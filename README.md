# BABOK Analyst - AI-Powered Business Analysis Agent

Agent AI do profesjonalnej analizy biznesowej zgodnej ze standardem **BABOK v3** (International Institute of Business Analysis). Prowadzi analityka krok po kroku przez 8 etapow - od inicjalizacji projektu po business case z kalkulacja ROI.

## Czym jest BABOK Analyst?

BABOK Analyst to zestaw promptow systemowych dla modeli AI (Claude, ChatGPT, inne LLM), ktory zamienia je w eksperta analizy biznesowej. Agent:

- Prowadzi ustrukturyzowany proces analizy w **8 etapach** (Stage 1-8)
- Zadaje pytania w formacie **Chain-of-Thought** z widocznym rozumowaniem
- Wymaga **zatwierdzenia czlowieka** na kazdym etapie (human-in-the-loop)
- Generuje kompletna **dokumentacje projektowa** w formacie Markdown
- Specjalizuje sie w projektach IT dla sektora **MSP** (male i srednie przedsiebiorstwa)

## Struktura repozytorium

```
BABOK_ANALYST/
|
|-- BABOK_AGENT/                          # Pliki agenta
|   |-- BABOK_Agent_System_Prompt.md      # Glowny system prompt (instrukcje agenta)
|   |-- BABOK_Agent_Quick_Start_Guide.md  # Skrocona instrukcja uzycia
|   |-- BABOK_Project_Structure_Template.md # Szablon struktury folderow projektu
|
|-- .github/
|   |-- copilot-instructions.md           # Konfiguracja dla GitHub Copilot / VS Code
|
|-- .gitignore                            # Wyklucza lokalne pliki analizy
|-- README.md                             # Ten plik
```

## 8 etapow analizy

| Etap | Nazwa | Co otrzymujesz |
|------|-------|----------------|
| **Stage 1** | Project Initialization & Stakeholder Mapping | Zakres projektu, rejestr interesariuszy, kryteria sukcesu |
| **Stage 2** | Current State Analysis (AS-IS) | Mapy procesow, baseline kosztowy, analiza systemow |
| **Stage 3** | Problem Domain Analysis | Kategoryzacja problemow, analiza przyczynowa, priorytetyzacja |
| **Stage 4** | Solution Requirements Definition | Wymagania funkcjonalne/niefunkcjonalne, user stories, MoSCoW |
| **Stage 5** | Future State Design (TO-BE) | Architektura docelowa, procesy TO-BE |
| **Stage 6** | Gap Analysis & Implementation Roadmap | Analiza luk, roadmapa wdrozenia |
| **Stage 7** | Risk Assessment & Mitigation Strategy | Rejestr ryzyk, plany mitygacji |
| **Stage 8** | Business Case & ROI Model | Model finansowy, ROI, NPV, payback period |

---

## Jak zaczac - krok po kroku

### Sposob 1: Claude.ai (Projects)

1. **Sklonuj lub pobierz repozytorium** (patrz sekcja ponizej)
2. Wejdz na [claude.ai](https://claude.ai) i utworz nowy **Project**
3. W ustawieniach projektu kliknij **"Project Instructions"** (Custom Instructions)
4. Skopiuj **calkowita** zawartosc pliku `BABOK_AGENT/BABOK_Agent_System_Prompt.md` i wklej do pola Project Instructions
5. Rozpocznij nowa konwersacje w projekcie i wpisz:
   ```
   BEGIN STAGE 1
   ```

### Sposob 2: VS Code z Claude Code (CLI)

1. Sklonuj repozytorium:
   ```bash
   git clone https://github.com/GSkuza/BABOK_ANALYST.git
   cd BABOK_ANALYST
   ```
2. Zainstaluj [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (wymaga Node.js 18+):
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```
3. Uruchom Claude Code w katalogu projektu:
   ```bash
   claude
   ```
4. Claude automatycznie wczyta konfiguracje z `.github/copilot-instructions.md`
5. Wpisz:
   ```
   BEGIN STAGE 1
   ```

### Sposob 3: VS Code z GitHub Copilot Chat

1. Sklonuj repozytorium i otworz w VS Code:
   ```bash
   git clone https://github.com/GSkuza/BABOK_ANALYST.git
   code BABOK_ANALYST
   ```
2. Upewnij sie, ze masz zainstalowane rozszerzenie **GitHub Copilot Chat**
3. Copilot automatycznie wczyta instrukcje z `.github/copilot-instructions.md`
4. Otworz Copilot Chat (Ctrl+Shift+I) i wpisz:
   ```
   BEGIN STAGE 1
   ```

### Sposob 4: ChatGPT lub inny model LLM

1. Pobierz zawartosc pliku `BABOK_AGENT/BABOK_Agent_System_Prompt.md`
2. W ChatGPT: Ustawienia -> "Custom Instructions" lub "System Prompt"
3. Wklej zawartosc pliku jako instrukcje systemowe
4. Rozpocznij nowa konwersacje i wpisz:
   ```
   BEGIN STAGE 1
   ```

### Sposob 5: API (Anthropic, OpenAI, inne)

Uzyj zawartosci `BABOK_Agent_System_Prompt.md` jako parametru `system` w wywolaniu API:

```python
import anthropic

client = anthropic.Anthropic()

with open("BABOK_AGENT/BABOK_Agent_System_Prompt.md") as f:
    system_prompt = f.read()

message = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=8192,
    system=system_prompt,
    messages=[{"role": "user", "content": "BEGIN STAGE 1"}]
)
```

---

## Klonowanie repozytorium

### Wymagania

- **Git** zainstalowany na komputerze ([poradnik instalacji](https://git-scm.com/downloads))
- Opcjonalnie: **VS Code** lub inny edytor kodu

### Klonowanie przez HTTPS

```bash
git clone https://github.com/GSkuza/BABOK_ANALYST.git
```

### Klonowanie przez SSH

```bash
git clone git@github.com:GSkuza/BABOK_ANALYST.git
```

### Klonowanie przez GitHub CLI

```bash
gh repo clone GSkuza/BABOK_ANALYST
```

### Pobranie ZIP (bez Git)

1. Wejdz na https://github.com/GSkuza/BABOK_ANALYST
2. Kliknij zielony przycisk **"Code"**
3. Wybierz **"Download ZIP"**
4. Rozpakuj archiwum w wybranym miejscu

---

## Jak pracowac z agentem

### Format komunikacji

Agent zadaje pytania w ustrukturyzowanym formacie:

```
REASONING: [Wyjasnienie dlaczego pyta o dany temat]

QUESTIONS FOR HUMAN:
1. [Pytanie 1]
2. [Pytanie 2]
...

WAIT FOR HUMAN INPUT.
```

### Jak odpowiadac

Odpowiadaj konkretnie, uzywajac numeracji pytan:

```
1. TAK - wszystkie dokumenty w scope: faktury, WZ, zamowienia
2. ERP: SAP Business One v10.0
3. Ksiegowosc: Comarch ERP Optima v2024.1
4. Nie mamy DMS obecnie
5. KSeF deadline: 1 lipca 2026
```

Jezeli czegosc nie wiesz:

```
NIE WIEM - musze sprawdzic z [osoba/dzial]
```

### Komendy kontrolne

| Komenda | Dzialanie |
|---------|-----------|
| `BEGIN STAGE [N]` | Rozpoczyna etap N |
| `STAGE [N] APPROVED` | Zatwierdza etap N i przechodzi do nastepnego |
| `CORRECTION: [blad] -> [poprawka]` | Poprawia blad agenta |
| `PAUSE` | Wstrzymuje prace |
| `RESUME STAGE [N]` | Wznawia prace od etapu N |
| `SHOW PROGRESS` | Wyswietla status wszystkich etapow |
| `REGENERATE SECTION [nazwa]` | Regeneruje konkretna sekcje |
| `SKIP TO STAGE [N]` | Pomija etapy (niezalecane) |

---

## Pliki wyjsciowe

Agent generuje dokumenty Markdown dla kazdego etapu:

```
STAGE_01_Project_Initialization.md
STAGE_02_Current_State_Analysis.md
STAGE_03_Problem_Domain_Analysis.md
STAGE_04_Solution_Requirements.md
STAGE_05_Future_State_Design.md
STAGE_06_Gap_Analysis_Roadmap.md
STAGE_07_Risk_Assessment.md
STAGE_08_Business_Case_ROI.md
FINAL_Complete_Documentation.md
```

Zalecana struktura folderow projektu jest opisana w pliku `BABOK_AGENT/BABOK_Project_Structure_Template.md`.

---

## Szacunkowy czas trwania

| Etap | Praca z agentem | Konsultacje wewnetrzne | Lacznie |
|------|----------------|----------------------|---------|
| Stage 1 | 30-45 min | 1-2 dni | 1-2 dni |
| Stage 2 | 1-2 godz. | 3-5 dni | ~1 tydzien |
| Stage 3 | 45-60 min | 1-2 dni | 2-3 dni |
| Stage 4 | 2-3 godz. | 3-5 dni | ~1 tydzien |
| Stage 5 | 1-2 godz. | 2-3 dni | 3-4 dni |
| Stage 6 | 1 godz. | 1 dzien | 1-2 dni |
| Stage 7 | 45 min | 1 dzien | 1-2 dni |
| Stage 8 | 1-2 godz. | 2-3 dni | 3-5 dni |
| **RAZEM** | **8-12 godz.** | **2-3 tygodnie** | **3-4 tygodnie** |

Wiekszosc czasu to nie praca z agentem, lecz zbieranie danych od interesariuszy i konsultacje wewnetrzne.

---

## Najlepsze praktyki

**Rób:**
- Czytaj sekcje REASONING - zrozumiesz logike agenta
- Badz konkretny - "srednio 50 faktur/miesiac" zamiast "sporo"
- Zatwierdzaj sekcje progresywnie - nie musisz czekac na caly etap
- Koryguj natychmiast jezeli agent popelni blad

**Nie rob:**
- Nie zgaduj - powiedz "NIE WIEM" jezeli nie znasz odpowiedzi
- Nie pomijaj pytan - kazde ma uzasadnienie
- Nie zatwierdzaj dokumentow bez przeczytania
- Nie mieszaj etapow - dokonczaj jeden przed przejsciem do nastepnego

---

## Rozwiazywanie problemow

| Problem | Rozwiazanie |
|---------|------------|
| Agent nie rozumie odpowiedzi | Przeformuluj bardziej szczegolowo, podaj przyklad |
| Agent pyta o cos czego nie wiesz | Odpowiedz "NIE WIEM" lub oznacz jako OPEN QUESTION |
| Blad w wczesniejszej odpowiedzi | `CORRECTION w [Section X.Y]: [opis bledu i poprawki]` |
| Zbyt techniczny dokument | "Simplify section [X] for non-technical audience" |
| Zmiana priorytetu wymagania | "Change requirement FR-015 from MUST to SHOULD. Reasoning: [...]" |

---

## Bezpieczenstwo i prywatnosc

**Agent NIE przechowuje:** hasel, kluczy API, numerow kont bankowych, danych osobowych (poza rolami).

**Agent MOZE przechowywac:** strukture organizacyjna, procesy biznesowe, zagregowane metryki, nazwy systemow.

Agent jest zaprojektowany zgodnie z GDPR, BABOK Code of Conduct i zasadami ISO 27001.

---

## Dodatkowe zasoby

- [IIBA BABOK Guide v3](https://www.iiba.org/babok-guide/)
- [IIBA Agile Extension](https://www.iiba.org/agile-extension/)
- [BABOK Glossary](https://www.iiba.org/babok-guide/glossary/)

---

## Licencja

Ten projekt jest udostepniony publicznie. Pliki agenta moga byc uzywane w dowolnych projektach analizy biznesowej.

---

**Wersja:** 1.1
**Ostatnia aktualizacja:** 2026-02-07
