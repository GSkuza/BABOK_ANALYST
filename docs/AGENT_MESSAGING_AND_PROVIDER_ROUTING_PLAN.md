> **Wersja:** 0.2 | **Status:** Draft do dyskusji | **Data:** 2026-07-02
> **Powiązane:** [`L2_L3_ARCHITECTURE.md`](./L2_L3_ARCHITECTURE.md) (wizja multi-agent — ten plan czyni jej część realną), [`MCP_TOOLS_SPECIFICATION.md`](./MCP_TOOLS_SPECIFICATION.md)
>
> **v0.2 vs v0.1:** poprzednia wersja skupiała się na Ollama jako głównym mechanizmie routingu. Ta wersja przenosi środek ciężkości na routing między **OpenAI, Anthropic, Google i HuggingFace**, z naciskiem na **routing per typ zadania** (generacja vs. klasyfikacja/ocena/podsumowanie) — bo to w kodzie jest dziś realnym marnotrawstwem: proste zadania klasyfikacyjne wołają dziś pełny model generatywny. Ollama zostaje jako opcjonalny dodatek w załączniku, nie jako oś planu.

# Plan: routing providerów (OpenAI / Anthropic / Google / HuggingFace) + message-passing między niezależnymi procesami

## 0. Cel

Dziś `babok run` używa **jednego providera i jednego modelu** dla wszystkiego — od generowania 2000-słowowego dokumentu Stage 4, przez ocenę jakości w 3-punktowej skali, po odpowiedź "CONFIRMED/UNCERTAIN/REFUTED" na pojedyncze pytanie weryfikacyjne. To marnuje pieniądze i czas: klasyfikacja 3-klasowa nie potrzebuje tego samego modelu co synteza całego rozdziału BRD.

Ten plan ma dwa niezależne, komplementarne cele:

1. **Routing providerów per typ zadania** — nie "jeden provider na cały run", tylko: mocny model do generowania/syntezy (stage'e deep: 3/4/6/8), tani/szybki model do zadań klasyfikacyjnych i pomocniczych (ocena jakości, weryfikacja CoVe, klasyfikacja MoSCoW/ryzyka, podsumowanie kontekstu między etapami) — rozłożone na OpenAI, Anthropic, Google i **HuggingFace Inference API używane właściwie** (nie tylko jako czwarty dostawca czatu, ale przez jego wyspecjalizowane endpointy task-specific: `zero-shot-classification`, `text-classification`, `summarization`, `feature-extraction`).
2. **Message-passing między niezależnymi procesami** — etapy przestają być wywołaniami funkcji w jednej pętli, a stają się procesami-agentami komunikującymi się przez kolejkę komunikatów, zgodnie z prymitywami już naszkicowanymi w `docs/L2_L3_ARCHITECTURE.md §2.2` (`WRITE_ARTIFACT`, `READ_ARTIFACT`, `POST_MESSAGE`), dotąd niezaimplementowanymi w kodzie.

### Poza zakresem (non-goals)

- Zmiana formatu przechowywania projektu (`PROJECT_JOURNAL_<id>.json`, `STAGE_0N_*.md` zostają).
- Osłabienie Two-Key Journal — auto-run nadal nie ustawia ludzkiego zatwierdzenia; dzisiejsze `approved_by: 'auto-run'` (`run.js:188`) to wewnętrzny stan pipeline'u, nie atest człowieka.
- Modele lokalne (Ollama/SGLang) jako główny temat — patrz Załącznik A, to rozszerzenie na później, nie warunek wejścia.

---

## 1. Stan obecny — gdzie dziś marnowany jest "duży model do małego zadania"

| Miejsce w kodzie | Co robi dziś | Dlaczego to jest kandydat do routingu |
|---|---|---|
| `cli/src/reasoning/verify.js:104-113` (Chain-of-Verification) | Dla **każdego** pytania weryfikacyjnego osobne wywołanie `llmClient.chat()`, z odpowiedzi parsowany jest `VERDICT: CONFIRMED\|UNCERTAIN\|REFUTED` (linia 52) | To jest **klasyfikacja 3-klasowa**, nie generacja. Stage z 8 pytaniami weryfikacyjnymi = 8 pełnych wywołań drogiego modelu za coś, co model klasyfikacyjny/tani model rozstrzyga równie dobrze |
| `cli/src/orchestrator/quality-loop.js:74-79` | Pełne wywołanie `llmClient.chat()` z prośbą o JSON `{overall, completeness, consistency, quality, improvements}` | Ocena wg sztywnej rubryki (już opisanej w `cli/src/quality/scorer.js`) — zadanie oceniające/klasyfikacyjne, nie kreatywne |
| `cli/src/commands/run.js:210-219` (`buildStageSystemPrompt`, `prevContext`) | Poprzednie etapy wstrzykiwane do promptu przez **ślepe ucięcie do 2000 znaków** (`content.substring(0, 2000)`) | To bezmyślne obcinanie może urwać FR-ID-y, budżet, KPI w połowie zdania — a te dane muszą przetrwać do walidacji (`rule-fr-traceability.js`, `rule-budget-ceiling.js`, `rule-kpi-coverage.js`). Podsumowanie zamiast obcięcia to zadanie dla taniego modelu/modelu summarization |
| `cli/src/reasoning/debate.js:79-85` (Critic pass) | Pełne wywołanie tym samym modelem co Analyst/Synthesiser | Krytyka istniejącego tekstu jest tańszym poznawczo zadaniem niż jego wygenerowanie od zera — kandydat do tańszego modelu (opcjonalnie, niższy priorytet niż verify/quality-loop) |
| `cli/src/llm.js:518-529` (`case 'huggingface'`) | HuggingFace używany wyłącznie przez `hf.chatCompletion(...)` — jak każdy inny provider czatu | HuggingFace Inference API ma dedykowane endpointy zadaniowe (`zeroShotClassification`, `textClassification`, `summarization`, `featureExtraction`) w tym samym pakiecie `@huggingface/inference` — dziś kompletnie nieużywane |

Wniosek: routing "provider per etap" (jak sugerował `--deep-model` dziś, `run.js:333-338`) to za mało. Prawdziwa wartość jest w **routingu per typ zadania**, bo w każdym etapie mieszają się zadania generacyjne i klasyfikacyjne.

---

## 2. Macierz providerów i ich rola

| Provider | Mocny model (generacja / deep stages) | Tani/szybki model (klasyfikacja, ocena) | Unikalna zdolność w tym planie |
|---|---|---|---|
| **OpenAI** | `gpt-4.1` | `gpt-4.1-nano` / `gpt-4o-mini` | Structured Outputs / `response_format: json_schema` — najbardziej niezawodny provider do wymuszenia JSON-a w `quality-loop.js` (koniec z `parseScoreResponse()` łapiącym markdown-fence regexem, `quality-loop.js:27-41`) |
| **Anthropic** | `claude-sonnet-5` | `claude-haiku-4-5` | Haiku jest wystarczająco dobry i tani do zadań klasyfikacyjnych/CoVe przy zachowaniu tego samego dostawcy co model deep — mniej kluczy/kont do zarządzania, jeśli firma jest już na Anthropic |
| **Google (Gemini)** | `gemini-2.5-pro-exp-03-25` (przez Vertex) / `gemini-2.0-flash` | `gemini-2.0-flash-lite` | Najniższy koszt/token w całej macierzy — dobry domyślny provider dla wolumenowych zadań klasyfikacyjnych (CoVe robi N wywołań na etap × 8 etapów) |
| **HuggingFace** | (opcjonalnie, jako fallback czatu — `Qwen2.5-72B`, `Bielik-11B`) | **task-specific endpoints, nie chat** | Patrz §3 — to jest właściwe miejsce dla zero-shot classification, ekstrakcji encji, embeddingów |

---

## 3. HuggingFace — "zaawansowane API", nie czwarty chatbot

`@huggingface/inference` (już zależność projektu, `cli/src/llm.js:4`) udostępnia więcej niż `chatCompletion`. Rozszerzyć `createLlmClient` o osobny, zadaniowy interfejs (nie w miejscu `chat()`, tylko obok niego):

```js
// cli/src/llm-tasks.js (nowy plik)
import { HfInference } from '@huggingface/inference';

export function createHfTaskClient(apiKey) {
  const hf = new HfInference(apiKey);
  return {
    // Zero-shot classification zamiast pytać duży model "czy to FR czy NFR?"
    classify: (text, labels) => hf.zeroShotClassification({
      model: 'facebook/bart-large-mnli',
      inputs: text,
      parameters: { candidate_labels: labels },
    }),
    // Fine-tuned sentiment/urgency dla stakeholder pain points
    textClassify: (text, model) => hf.textClassification({ model, inputs: text }),
    // Podsumowanie długiego tekstu poprzedniego etapu zamiast substring(0, 2000)
    summarize: (text) => hf.summarization({
      model: 'facebook/bart-large-cnn',
      inputs: text,
      parameters: { max_length: 300 },
    }),
    // Embeddingi do wykrywania duplikatów/podobieństwa (np. w babok_search, cross-stage dedup)
    embed: (text) => hf.featureExtraction({
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      inputs: text,
    }),
  };
}
```

### Konkretne podpięcia w istniejącym kodzie

| Nowa funkcja | Podmienia | Zysk |
|---|---|---|
| `classify(question+answer, ['CONFIRMED','UNCERTAIN','REFUTED'])` | `runCoVe()` w `verify.js:104-113` — pętla pytanie-po-pytaniu | N wywołań drogiego modelu → N (tanich, ~10-50ms) wywołań klasyfikatora. Duży model wraca do gry tylko w kroku korekty (`verify.js:132`, gdy faktycznie trzeba coś przepisać) |
| `classify(deliverable_section, MOSCOW_LABELS)` | Etap 4 (Requirements) — dziś model sam decyduje MoSCoW w prozie | Możliwość **audytu** klasyfikacji MoSCoW niezależnie od modelu, który napisał wymaganie (mniejsza szansa, że model "oszukuje" własną klasyfikacją) |
| `summarize(previousStageOutput)` | `buildStageSystemPrompt()` w `run.js:210-219` | Zamiast ślepego cięcia na 2000 znaków — podsumowanie zachowujące kluczowe fakty (ID-ki, liczby), bezpośrednio poprawia trafność `cross-stage-validator` (reguły 1, 2, 4 zależą od tego, czy FR-ID/budżet/KPI przetrwały do kolejnego etapu) |
| `embed(risk_description)` | Nowa reguła walidacji / `babok_search` | Wykrywanie duplikatów ryzyk/wymagań przez podobieństwo wektorowe zamiast dokładnego dopasowania tekstu |

To jest sedno "alternatywnej wersji" — HuggingFace nie konkuruje z OpenAI/Anthropic/Google o to samo zadanie (generację), tylko robi rzeczy, których duże modele czatu robią nieefektywnie.

---

## 4. Router: konfiguracja per typ zadania (nie tylko per etap)

Nowy plik `router_config.json` (albo sekcja w `agent_config.json` — do decyzji, patrz §7):

```json
{
  "routing_policy": "cost_aware",
  "tasks": {
    "generate_deliverable": {
      "standard": { "provider": "gemini", "model": "gemini-2.0-flash" },
      "deep":     { "provider": "anthropic", "model": "claude-sonnet-5" }
    },
    "classify": {
      "provider": "huggingface", "task": "zero-shot-classification", "model": "facebook/bart-large-mnli"
    },
    "score_quality": {
      "provider": "openai", "model": "gpt-4o-mini", "response_format": "json_schema"
    },
    "verify_claim": {
      "provider": "huggingface", "task": "zero-shot-classification"
    },
    "summarize_context": {
      "provider": "huggingface", "task": "summarization"
    }
  },
  "fallback_chain": ["openai", "anthropic", "gemini"]
}
```

`deep` = stage'e 3/4/6/8 (już wydzielone jako `DEEP_ANALYSIS_STAGES` w `engine.js:29` i `debate.js:15` — reużyć tę samą stałą, nie duplikować).

### Zmiany w kodzie

- **`cli/src/router.js` (nowy)** — `resolveClient(taskType, { stageNumber, routerConfig })` zwraca `{ chat }` (dla providerów LLM) albo dedykowany klient zadaniowy (dla HuggingFace task-specific). Jedno miejsce, które wie "jaki task → jaki provider".
- **`engine.js:72-73`** — `isDeepStage ? deepAnalysisClient : llmClient` zamienia się na `router.resolveClient('generate_deliverable', { stageNumber })`.
- **`quality-loop.js:79`** — `llmClient.chat(...)` zamienia się na `router.resolveClient('score_quality').chat(...)`, docelowo z OpenAI `response_format: json_schema` zamiast dzisiejszego regexowego `parseScoreResponse()` (`quality-loop.js:27-41`).
- **`verify.js:111`** — pytania z jasnym zestawem odpowiedzi (`CONFIRMED/UNCERTAIN/REFUTED`) idą przez `router.resolveClient('verify_claim').classify(...)`; tylko krok korekty (`verify.js:132`) zostaje na pełnym modelu generatywnym.
- **`run.js:210-219`** — `prevContext` budowany przez `router.resolveClient('summarize_context').summarize(...)` zamiast `substring(0, 2000)`.

### Fallback / odporność

`withFallback(taskType, fn)` w `router.js` próbuje kolejnych providerów z `fallback_chain` przy błędzie (429/5xx/timeout) — ważniejsze niż w wersji lokalnej (Ollama), bo tu wszystkie providery mają realne rate-limity, więc fallback to nie luksus tylko konieczność przy równoległym wykonaniu (Stage 2 + Stage 7 dziś, więcej po fazie message bus).

---

## 5. Message-passing między niezależnymi procesami

*(bez zmian względem v0.1 co do architektury — mechanizm transportu nie zależy od tego, którzy providerzy są routowani; szczegóły techniczne zostają, streszczenie poniżej)*

- Append-only log `projects/<id>/agent_messages.jsonl`, realizujący typy komunikatów z `docs/L2_L3_ARCHITECTURE.md §2.2` (`stage_complete`, `quality_iterate`, `quality_escalate`, `context_update`, `pipeline_error`) + nowy `provider_fallback`.
- Transport: `EventEmitter` w procesie (dla `worker_threads`) + zapis do pliku dla trwałości/resume — analogicznie do dzisiejszego `.stage_N.lock` (`cli/src/lock.js`), żaden nowy serwis (Redis/RabbitMQ) nie wchodzi do stacku.
- Izolacja: start od `worker_threads` (jeden proces Node, wiele wątków — każdy z własnym `router.resolveClient(...)`, więc różne wątki mogą realnie bić w różnych providerów jednocześnie). `child_process.fork()` jako opcja rozszerzenia, gdy pojawi się potrzeba pełnej izolacji procesowej (nie budować z góry).
- `engine.js:runStage()` zamienia bezpośrednie `await executeStage(...)` na `publish('stage_ready', ...)` → worker → `publish('stage_complete', ...)` → orchestrator odpala `runQualityLoop` → `publish('quality_approved'|'quality_iterate'|'quality_escalate', ...)`.

---

## 6. Fazy wdrożenia

| Faza | Zakres | Pliki | Kryterium „done” |
|---|---|---|---|
| **1. HuggingFace task client** | `createHfTaskClient()`, `classify/textClassify/summarize/embed` | `cli/src/llm-tasks.js` (nowy) | Wywołanie `classify("To wymaganie musi...", ['FR','NFR'])` zwraca etykietę z score — testowalne bez pełnego pipeline'u |
| **2. Router per typ zadania** | `router_config.json`, `cli/src/router.js`, podłączenie do `engine.js`, `quality-loop.js` | `cli/src/router.js`, `engine.js`, `quality-loop.js` | Dwa różne zadania w jednym runie realnie trafiają do dwóch różnych providerów (log `[router] task=score_quality → openai/gpt-4o-mini`) |
| **3. Podmiana CoVe i podsumowań kontekstu** | `verify.js` → `classify()` per pytanie; `run.js` `prevContext` → `summarize()` | `verify.js`, `run.js` | Liczba pełnych wywołań LLM na etap z CoVe spada z `N pytań` do `1` (tylko ewentualna korekta); `STAGE_NN_verification.json` nadal zawiera te same pola co dziś |
| **4. Message bus (in-process)** | `agent_messages.jsonl`, publish/subscribe zamiast bezpośrednich wywołań w `engine.js` | `cli/src/orchestrator/message-bus.js`, `engine.js` | Pełna historia runu w `agent_messages.jsonl`; resume po przerwaniu odtwarza stan |
| **5. Izolacja `worker_threads`** | Stage-agent jako worker z własnym routerem | `cli/src/orchestrator/stage-worker.js` (nowy) | Awaria/timeout jednego workera nie ubija całego `babok run`; retry z fallbacku widoczny w logu |
| **6. Testy i dokumentacja** | Testy routera, mock HF task client, aktualizacja `L2_L3_ARCHITECTURE.md` i `CLAUDE.md` | `tests/unit/router.test.js`, `tests/unit/llm-tasks.test.js` | `npm test` zielone; dokumentacja opisuje stan faktyczny |

**Fazy 1-3 dają całą wartość "taniej i mądrzej"** bez ruszania architektury procesowej (4-5) — to jest ta sama zasada co w v0.1: jeśli message-passing między procesami okaże się niepotrzebny, można zatrzymać się po fazie 3.

---

## 7. Ryzyka i decyzje do podjęcia

- **Jakość klasyfikacji zero-shot.** `facebook/bart-large-mnli` jest solidny do ogólnych etykiet (CONFIRMED/UNCERTAIN/REFUTED, FR/NFR), ale przy specyficznym żargonie branżowym (np. klasyfikacja zgodności z KSeF) może być gorszy niż duży model z pełnym kontekstem BABOK. **Do zweryfikowania na przykładach z `evaluation/gold_standards` przed włączeniem w fazie 3 na produkcję.**
- **Koszt zarządzania kluczami.** Router per zadanie oznacza, że pojedynczy `babok run` może potrzebować kluczy do 3-4 providerów jednocześnie zamiast jednego. `cli/src/llm.js` już ma per-provider keystore (`readStoredKey`/`storeKey`, linie 137-176) — router czyta z tego samego miejsca, nie wprowadza nowego mechanizmu, ale UX `babok setup` powinien to uwzględnić (pytać o klucze providerów użytych w `router_config.json`, nie tylko o jeden).
- **`router_config.json` czy sekcja `agent_config.json`?** `agent_config.json.agents.stageN.model` już istnieje (dodane pod L2, dziś nieużywane) — można rozbudować to pole zamiast tworzyć nowy plik. Rekomendacja: rozbudować `agent_config.json` (mniej plików, spójne z istniejącą konwencją), `router_config.json` tylko jeśli konfiguracja urośnie na tyle, że zaśmieca główny config. **Decyzja do podjęcia przed fazą 2.**
- **Two-Key Gate pod współbieżnością** (dotyczy faz 4-5) — `.stage_N.lock` musi obejmować też workery auto-run, nie tylko `babok chat`/interaktywny `babok run`.

---

## Załącznik A — Ollama / modele lokalne (opcjonalne rozszerzenie, nie część v1)

Jeśli w przyszłości pojawi się potrzeba lokalnego/darmowego providera dla zadań standardowych (nie deep), router z §4 przyjmuje go bez zmian architektury: dodać `ollama` do `PROVIDERS` w `cli/src/llm.js` (analogicznie do istniejącego `PROVIDERS.local`, `llm.js:83-89`, endpoint OpenAI-compatible pod `http://localhost:11434/v1`, health-check przez `GET /api/tags` przed użyciem) i dopisać go jako kolejną opcję w `tasks.generate_deliverable.standard` albo do `fallback_chain`. Nie jest to warunek wejścia dla żadnej z faz 1-6 powyżej.
