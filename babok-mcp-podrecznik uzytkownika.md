# BABOK-MCP — Podręcznik Użytkownika

**Wersja serwera:** 2.0.2
**Data dokumentu:** 2026-03-16
**Autor:** BABOK Analyst Project

---

## Spis treści

1. [Czym jest babok-mcp?](#1-czym-jest-babok-mcp)
2. [Wartość dodana — po co tego używać?](#2-wartość-dodana--po-co-tego-używać)
3. [Wymagania wstępne](#3-wymagania-wstępne)
4. [Instalacja](#4-instalacja)
5. [Konfiguracja klientów MCP](#5-konfiguracja-klientów-mcp)
   - [Claude Code CLI](#51-claude-code-cli-zalecane)
   - [Claude Desktop](#52-claude-desktop)
   - [VS Code Copilot](#53-vs-code-copilot)
   - [Cursor](#54-cursor)
6. [Weryfikacja połączenia](#6-weryfikacja-połączenia)
7. [Zmienne środowiskowe](#7-zmienne-środowiskowe)
8. [Narzędzia (Tools) — szczegółowy opis](#8-narzędzia-tools--szczegółowy-opis)
   - [babok_new_project](#81-babok_new_project)
   - [babok_list_projects](#82-babok_list_projects)
   - [babok_get_stage](#83-babok_get_stage)
   - [babok_approve_stage](#84-babok_approve_stage)
   - [babok_get_deliverable](#85-babok_get_deliverable)
   - [babok_save_deliverable](#86-babok_save_deliverable)
   - [babok_search](#87-babok_search)
   - [babok_export](#88-babok_export)
9. [Zasoby (Resources) — etapy BABOK](#9-zasoby-resources--etapy-babok)
10. [Kompletny przykład sesji](#10-kompletny-przykład-sesji)
11. [Kiedy i do czego używać babok-mcp?](#11-kiedy-i-do-czego-używać-babok-mcp)
12. [Struktura plików projektu](#12-struktura-plików-projektu)
13. [Rozwiązywanie problemów](#13-rozwiązywanie-problemów)
14. [Najczęstsze pytania (FAQ)](#14-najczęstsze-pytania-faq)

---

## 1. Czym jest babok-mcp?

**babok-mcp** to serwer **Model Context Protocol (MCP)** — otwarty standard integracji narzędzi z asystentami AI, stworzony przez Anthropic.

Serwer ten **opakowuje cały cykl życia projektu analizy biznesowej BABOK** w zestaw narzędzi, które asystent AI (Claude, Copilot, Cursor itp.) może wywoływać automatycznie podczas rozmowy — bez konieczności ręcznego uruchamiania komend w terminalu.

### Jak to działa?

Tradycyjny przepływ pracy bez MCP:

```
Analityk → [pisze pytania] → AI → [odpowiada tekstem]
Analityk → [ręcznie zapisuje wyniki] → terminal: babok approve ...
Analityk → [przechodzi do następnego etapu]
```

Przepływ pracy z babok-mcp:

```
Analityk → "Zacznij Stage 3 dla projektu K7M3"

AI automatycznie:
  1. wywołuje babok_get_stage(K7M3, 3)
     → otrzymuje instrukcje etapu + stan projektu
  2. przeprowadza analizę z analitykiem
  3. wywołuje babok_save_deliverable(K7M3, 3, "...")
     → zapisuje dokument do pliku MD
  4. wywołuje babok_approve_stage(K7M3, 3)
     → zatwierdza etap, przechodzi do etapu 4
```

Analityk skupia się wyłącznie na **merytoryce** — cała administracja projektu dzieje się automatycznie.

---

## 2. Wartość dodana — po co tego używać?

### 2.1 Automatyzacja zarządzania projektem

Bez babok-mcp analityk musi ręcznie:
- przełączać się między terminalem a oknem czatu AI
- wklejać kontekst projektu do każdej nowej rozmowy
- pamiętać, na jakim etapie jest projekt
- ręcznie zapisywać wyniki do plików

Z babok-mcp:
- AI samo pobiera aktualny stan projektu przed każdą odpowiedzią
- AI samo zapisuje wygenerowane dokumenty
- AI samo zatwierdza etapy po akceptacji
- stan projektu jest zawsze aktualny i spójny

### 2.2 Ciągłość kontekstu między sesjami

Każdy projekt ma **dziennik (journal)** — plik JSON przechowujący:
- wszystkie podjęte decyzje
- założenia projektu
- otwarte pytania
- daty i status każdego etapu

Gdy wracasz do projektu po tygodniu, AI pobiera journal i od razu wie:
- co zostało już zrobione
- jakie decyzje podjęto
- od jakiego miejsca kontynuować

Nie ma potrzeby "przypominania" AI o kontekście projektu.

### 2.3 Standaryzacja metodyki BABOK

Serwer integruje **9 szczegółowych promptów agentowych** (Stage 0–8), które definiują metodykę BABOK. Każdy etap ma ściśle określony zakres:

| Etap | Nazwa | Co produkuje |
|------|-------|--------------|
| 0 | Project Charter | Karta projektu, cele, zakres |
| 1 | Project Initialization & Stakeholder Mapping | Rejestr interesariuszy |
| 2 | Current State Analysis (AS-IS) | Analiza stanu obecnego |
| 3 | Problem Domain Analysis | Analiza problemów biznesowych |
| 4 | Solution Requirements Definition | Wymagania funkcjonalne i niefunkcjonalne |
| 5 | Future State Design (TO-BE) | Projekt stanu docelowego |
| 6 | Gap Analysis & Implementation Roadmap | Analiza luk i harmonogram |
| 7 | Risk Assessment & Mitigation Strategy | Rejestr ryzyk |
| 8 | Business Case & ROI Model | Uzasadnienie biznesowe i ROI |

AI nie "improwizuje" metodyki — zawsze stosuje te same, sprawdzone wzorce analizy.

### 2.4 Wyszukiwanie w wiedzy projektowej

Narzędzie `babok_search` przeszukuje **wszystkie dokumenty ze wszystkich projektów** jednocześnie. Możesz zapytać:

- "Znajdź wszystkie wymagania dotyczące integracji z SAP"
- "Pokaż mi ryzyka zidentyfikowane w poprzednich projektach"
- "Gdzie w dokumentacji pojawia się temat zgodności z RODO"

To buduje **bazę wiedzy organizacji** — każdy nowy projekt czerpie z doświadczeń poprzednich.

### 2.5 Wsparcie dla wielu klientów AI

Ten sam serwer MCP działa z:
- **Claude Code CLI** — praca w terminalu / VS Code
- **Claude Desktop** — aplikacja desktopowa
- **VS Code Copilot** — bezpośrednio w edytorze kodu
- **Cursor** — AI-first edytor kodu

Jeden serwer, wiele interfejsów — bez duplikowania konfiguracji.

### 2.6 Eksport i dokumentacja

Narzędzie `babok_export` w jednym wywołaniu kopiuje wszystkie dokumenty projektu (pliki MD + journal JSON) do wskazanego katalogu eksportu. Gotowe do archiwizacji, udostępnienia klientowi lub konwersji do DOCX/PDF.

---

## 3. Wymagania wstępne

Przed instalacją upewnij się, że masz:

| Wymaganie | Minimalna wersja | Jak sprawdzić |
|-----------|-----------------|---------------|
| Node.js | 18.0.0 | `node --version` |
| npm | 9.0.0 | `npm --version` |
| Git | dowolna | `git --version` |
| Repozytorium BABOK_ANALYST | sklonowane | `ls D:/BABOK_ANALYST` |

### Instalacja Node.js

Jeśli Node.js nie jest zainstalowany:

1. Pobierz instalator ze strony: [https://nodejs.org](https://nodejs.org) (wersja LTS)
2. Zainstaluj zgodnie z instrukcjami instalatora
3. Zrestartuj terminal i zweryfikuj: `node --version`

---

## 4. Instalacja

### Krok 1: Sklonuj repozytorium (jeśli nie masz)

```bash
git clone https://github.com/GSkuza/BABOK_ANALYST.git D:/BABOK_ANALYST
```

### Krok 2: Zainstaluj zależności serwera MCP

**Opcja A — instalator jednym kliknięciem (Windows):**

```bat
cd D:/BABOK_ANALYST/babok-mcp
setup.bat
```

Skrypt automatycznie instaluje zależności, sprawdza plik serwera i wyświetla gotowy fragment do wklejenia do `claude_desktop_config.json`.

**Opcja B — ręcznie:**

```bash
cd D:/BABOK_ANALYST/babok-mcp
npm install
```

Po zakończeniu instalacji sprawdź czy plik wejściowy istnieje:

```bash
ls D:/BABOK_ANALYST/babok-mcp/bin/babok-mcp.js
```

### Krok 3: Zweryfikuj serwer

Uruchom serwer ręcznie na kilka sekund (Ctrl+C żeby zatrzymać):

```bash
node D:/BABOK_ANALYST/babok-mcp/bin/babok-mcp.js
```

Serwer działa poprawnie jeśli nie wyrzuca błędów (po uruchomieniu czeka na stdin — to normalne zachowanie serwera MCP).

---

## 5. Konfiguracja klientów MCP

### 5.1 Claude Code CLI (zalecane)

Claude Code CLI to narzędzie do pracy z Claude bezpośrednio z terminala lub VS Code. Jest to **najprostsza metoda integracji** — jedna komenda i gotowe.

#### Jednorazowa konfiguracja:

```bash
claude mcp add babok node "D:/BABOK_ANALYST/babok-mcp/bin/babok-mcp.js" \
  -e BABOK_PROJECTS_DIR="D:/BABOK_ANALYST/projects" \
  -e BABOK_AGENT_DIR="D:/BABOK_ANALYST/BABOK_AGENT/stages"
```

Komenda `claude mcp add` zapisuje konfigurację w `~/.claude.json` (plik lokalny projektu).

#### Weryfikacja:

```bash
claude mcp list
```

Oczekiwane wyjście:
```
babok: node D:/BABOK_ANALYST/babok-mcp/bin/babok-mcp.js - ✓ Connected
```

#### Usunięcie (gdy potrzebne):

```bash
claude mcp remove babok
```

---

### 5.2 Claude Desktop

Claude Desktop to aplikacja okienkowa dostępna na Windows i macOS.

#### Lokalizacja pliku konfiguracyjnego:

| System | Ścieżka |
|--------|---------|
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |

#### Zawartość pliku konfiguracyjnego:

Otwórz plik (lub utwórz jeśli nie istnieje) i dodaj sekcję `mcpServers`:

```json
{
  "mcpServers": {
    "babok": {
      "command": "node",
      "args": ["D:/BABOK_ANALYST/babok-mcp/bin/babok-mcp.js"],
      "env": {
        "BABOK_PROJECTS_DIR": "D:/BABOK_ANALYST/projects",
        "BABOK_AGENT_DIR": "D:/BABOK_ANALYST/BABOK_AGENT/stages"
      }
    }
  }
}
```

> **Uwaga dla macOS:** Użyj ścieżek Unix, np. `/Users/nazwaużytkownika/BABOK_ANALYST/...`

#### Restart aplikacji:

Po zapisaniu pliku **całkowicie zamknij i uruchom ponownie Claude Desktop**. Serwer MCP pojawi się w interfejsie jako ikona narzędzi 🔧.

---

### 5.3 VS Code Copilot

VS Code obsługuje MCP servers bezpośrednio w GitHub Copilot Chat.

#### Metoda 1: Plik `.vscode/mcp.json` w projekcie

Utwórz plik `.vscode/mcp.json` w katalogu głównym projektu:

```json
{
  "servers": {
    "babok": {
      "type": "stdio",
      "command": "node",
      "args": ["D:/BABOK_ANALYST/babok-mcp/bin/babok-mcp.js"],
      "env": {
        "BABOK_PROJECTS_DIR": "D:/BABOK_ANALYST/projects",
        "BABOK_AGENT_DIR": "D:/BABOK_ANALYST/BABOK_AGENT/stages"
      }
    }
  }
}
```

#### Metoda 2: Ustawienia globalne VS Code

Dodaj do `settings.json` (`Ctrl+Shift+P` → "Open User Settings JSON"):

```json
{
  "mcp.servers": {
    "babok": {
      "type": "stdio",
      "command": "node",
      "args": ["D:/BABOK_ANALYST/babok-mcp/bin/babok-mcp.js"],
      "env": {
        "BABOK_PROJECTS_DIR": "D:/BABOK_ANALYST/projects",
        "BABOK_AGENT_DIR": "D:/BABOK_ANALYST/BABOK_AGENT/stages"
      }
    }
  }
}
```

Po skonfigurowaniu narzędzia babok będą dostępne w **Copilot Chat** po wpisaniu `@babok` lub automatycznie.

---

### 5.4 Cursor

Cursor to edytor kodu oparty na AI, obsługujący MCP.

#### Plik konfiguracyjny: `~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "babok": {
      "command": "node",
      "args": ["D:/BABOK_ANALYST/babok-mcp/bin/babok-mcp.js"],
      "env": {
        "BABOK_PROJECTS_DIR": "D:/BABOK_ANALYST/projects",
        "BABOK_AGENT_DIR": "D:/BABOK_ANALYST/BABOK_AGENT/stages"
      }
    }
  }
}
```

Zrestartuj Cursor po zapisaniu konfiguracji.

---

## 6. Weryfikacja połączenia

Po konfiguracji dowolnego klienta możesz zweryfikować działanie serwera:

### W Claude Code CLI:

```bash
claude mcp list
```

### W rozmowie z AI:

Napisz do asystenta:
> "Wywołaj babok_list_projects i pokaż mi listę projektów"

Jeśli serwer jest podłączony, AI wykona narzędzie i wyświetli wyniki. Jeśli brak projektów, zobaczysz:
```
No projects found. Use babok_new_project to create the first one.
Projects directory: D:/BABOK_ANALYST/projects
```

---

## 7. Zmienne środowiskowe

Serwer rozpoznaje dwie zmienne środowiskowe:

| Zmienna | Domyślna wartość | Opis |
|---------|-----------------|------|
| `BABOK_PROJECTS_DIR` | `./projects` (względem CWD) | Katalog przechowywania projektów (journale + deliverables) |
| `BABOK_AGENT_DIR` | `./BABOK_AGENT/stages` (względem CWD) | Katalog z plikami promptów etapów (`BABOK_agent_stage_N.md`) |

### Priorytet rozpoznawania ścieżek:

1. Zmienna środowiskowa (zawsze nadpisuje)
2. Katalog `./projects` względem bieżącego katalogu roboczego
3. Katalog `../projects` względem pakietu `babok-mcp`

### Przykład dla niestandardowej lokalizacji projektów:

```json
{
  "env": {
    "BABOK_PROJECTS_DIR": "C:/MojeFirma/ProjektyBABOK",
    "BABOK_AGENT_DIR": "D:/BABOK_ANALYST/BABOK_AGENT/stages"
  }
}
```

---

## 8. Narzędzia (Tools) — szczegółowy opis

Serwer udostępnia **10 narzędzi**. Każde z nich AI wywołuje automatycznie na podstawie Twoich poleceń w języku naturalnym.

---

### 8.1 `babok_new_project`

**Cel:** Tworzy nowy projekt analizy biznesowej BABOK.

**Parametry:**

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `name` | string | TAK | Nazwa projektu (np. "Wdrożenie CRM dla Acme Sp. z o.o.") |
| `language` | "EN" lub "PL" | NIE (domyślnie "EN") | Język analizy — wszystkie dokumenty będą generowane w tym języku |

**Co robi:**
- Generuje unikalny identyfikator projektu w formacie `BABOK-YYYYMMDD-XXXX`
- Tworzy katalog projektu w `BABOK_PROJECTS_DIR/BABOK-YYYYMMDD-XXXX/`
- Inicjalizuje plik dziennika `PROJECT_JOURNAL_BABOK-YYYYMMDD-XXXX.json`
- Ustawia Stage 0 (Project Charter) jako aktywny

**Przykład odpowiedzi:**
```
✅ NEW PROJECT CREATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Project ID:   BABOK-20260316-K7M3
  Project Name: Wdrożenie CRM dla Acme Sp. z o.o.
  Language:     PL
  Created:      2026-03-16T10:23:45.000Z
  Directory:    D:/BABOK_ANALYST/projects/BABOK-20260316-K7M3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current stage: Stage 0 — Project Charter (IN PROGRESS)
```

**Jak wywołać (przykłady poleceń do AI):**

```
"Utwórz nowy projekt BABOK dla wdrożenia systemu ERP w języku polskim"
"Zacznij nowy projekt: Migracja danych do chmury Azure, po angielsku"
"New BABOK project: Customer Portal Redesign, language EN"
```

---

### 8.2 `babok_list_projects`

**Cel:** Wyświetla listę wszystkich projektów w katalogu roboczym.

**Parametry:** brak

**Co robi:**
- Skanuje katalog `BABOK_PROJECTS_DIR`
- Dla każdego projektu odczytuje journal
- Zwraca tabelę z ID, nazwą, aktualnym etapem i statusem

**Przykład odpowiedzi:**
```
BABOK Projects:
━━━━━━━━━━━━━━━━
  BABOK-20260316-K7M3  |  Wdrożenie CRM dla Acme  |  Stage 2: Current State Analysis  |  IN_PROGRESS
  BABOK-20260301-AB4N  |  Migracja do Azure        |  Stage 8: Business Case & ROI     |  COMPLETED
  BABOK-20260210-XP9R  |  Portal Klienta           |  Stage 0: Project Charter         |  IN_PROGRESS
```

**Jak wywołać:**

```
"Pokaż wszystkie projekty BABOK"
"Jakie mam aktywne projekty?"
"Lista projektów"
```

---

### 8.3 `babok_get_stage`

**Cel:** To **główne narzędzie** serwera. Pobiera pełny kontekst do pracy nad etapem — instrukcje metodyczne + stan projektu + istniejący deliverable.

**Parametry:**

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project_id` | string | TAK | Pełny lub częściowy ID projektu (np. "K7M3" zamiast pełnego "BABOK-20260316-K7M3") |
| `stage_n` | liczba (0–8) | TAK | Numer etapu |

**Co zwraca (trzy sekcje):**

1. **Nagłówek etapu** — numer, nazwa, status, daty
2. **Journal Context** — podsumowanie projektu: wszystkie etapy, podjęte decyzje, założenia, otwarte pytania
3. **Stage Instructions** — pełna treść pliku `BABOK_agent_stage_N.md` — szczegółowe pytania i metodyka dla danego etapu
4. **Existing Deliverable** (jeśli istnieje) — aktualny dokument etapu do rewizji lub kontynuacji

**Dlaczego to ważne:**

Bez tego narzędzia AI musiałoby "zgadywać" co robić na każdym etapie. Dzięki niemu:
- zawsze stosuje właściwą metodykę BABOK
- zna aktualny stan i historię projektu
- nie pyta ponownie o rzeczy już ustalone w poprzednich etapach
- może wznowić pracę w połowie etapu (ma istniejący deliverable)

**Jak wywołać:**

```
"Zacznij pracę nad Stage 3 projektu K7M3"
"Pobierz instrukcje dla etapu 2"
"Co musimy zrobić na Stage 5 w projekcie Migracja Azure?"
```

---

### 8.4 `babok_approve_stage`

**Cel:** Zatwierdza zakończony etap i przesuwa projekt do następnego.

**Parametry:**

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project_id` | string | TAK | ID projektu |
| `stage_n` | liczba (0–8) | TAK | Numer etapu do zatwierdzenia |
| `notes` | string | NIE | Opcjonalne notatki — kluczowe decyzje podjęte podczas etapu |

**Co robi:**
- Oznacza etap jako `approved` w journal
- Zapisuje datę zatwierdzenia i notatki
- Przesuwa projekt do następnego etapu (status `in_progress`)
- Jeśli zatwierdzono Stage 8 — projekt jest `DONE`

**Przykład odpowiedzi:**
```
✅ Stage 2 APPROVED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Project:  BABOK-20260316-K7M3
  Stage:    2 — Current State Analysis (AS-IS)
  Approved: 2026-03-16 14:45:22
  Notes:    Zidentyfikowano 3 systemy legacy, brak integracji między działami

Next: Stage 3 — Problem Domain Analysis (now IN PROGRESS)
Call babok_get_stage with stage_n=3 to continue.
```

**Jak wywołać:**

```
"Zatwierdź Stage 2 — wszystko wygląda dobrze"
"Approve stage 2 with note: legacy systems identified"
"Zaakceptuj etap analizy stanu obecnego"
```

---

### 8.5 `babok_get_deliverable`

**Cel:** Odczytuje treść dokumentu (deliverable) dla konkretnego etapu.

**Parametry:**

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project_id` | string | TAK | ID projektu |
| `stage_n` | liczba (0–8) | TAK | Numer etapu |

**Co robi:**
- Odczytuje plik Markdown z katalogu projektu
- Zwraca pełną treść dokumentu

**Nazwy plików deliverables:**

| Etap | Plik |
|------|------|
| 0 | `STAGE_00_Project_Charter.md` |
| 1 | `STAGE_01_Project_Initialization.md` |
| 2 | `STAGE_02_Current_State_Analysis.md` |
| 3 | `STAGE_03_Problem_Domain_Analysis.md` |
| 4 | `STAGE_04_Solution_Requirements.md` |
| 5 | `STAGE_05_Future_State_Design.md` |
| 6 | `STAGE_06_Gap_Analysis_Roadmap.md` |
| 7 | `STAGE_07_Risk_Assessment.md` |
| 8 | `STAGE_08_Business_Case_ROI.md` |

**Jak wywołać:**

```
"Pokaż mi dokument z etapu 4 projektu K7M3"
"Przeczytaj aktualny deliverable Stage 1"
"Wyświetl kartę projektu (Stage 0)"
```

---

### 8.6 `babok_save_deliverable`

**Cel:** Zapisuje wygenerowany przez AI dokument etapu jako plik Markdown w katalogu projektu.

**Parametry:**

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project_id` | string | TAK | ID projektu |
| `stage_n` | liczba (0–8) | TAK | Numer etapu |
| `content` | string | TAK | Pełna treść dokumentu w formacie Markdown |

**Co robi:**
- Zapisuje plik do `BABOK_PROJECTS_DIR/<project_id>/<filename>.md`
- Aktualizuje journal: status etapu → `completed`, data ukończenia
- Zwraca potwierdzenie z ścieżką pliku i liczbą znaków

**Kiedy AI wywołuje to narzędzie:**

AI wywołuje `babok_save_deliverable` automatycznie po wygenerowaniu dokumentu etapu — zazwyczaj po tym, jak analityk odpowiedział na wszystkie pytania metodyczne. Nie musisz o to prosić wprost.

**Jak wywołać:**

```
"Zapisz wygenerowany dokument do projektu"
"Zachowaj wyniki analizy Stage 3"
"Finalizuj deliverable dla Stage 2 i zapisz"
```

---

### 8.7 `babok_search`

**Cel:** Przeszukuje pełnotekstowo wszystkie pliki Markdown we wszystkich projektach (lub jednym wybranym).

**Parametry:**

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `query` | string | TAK | Fraza wyszukiwania (bez uwzględniania wielkości liter) |
| `project_id` | string | NIE | Ogranicz wyszukiwanie do konkretnego projektu |

**Co robi:**
- Skanuje wszystkie pliki `.md` we wszystkich projektach
- Zwraca pasujące linie z kontekstem (linia przed + linia po)
- Ogranicza do 5 dopasowań na plik (aby nie zalewać odpowiedzi)

**Przykład odpowiedzi:**
```
Search results for: "integracja SAP"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 BABOK-20260316-K7M3 — Wdrożenie CRM / STAGE_04_Solution_Requirements.md
  Line 87:
    Wymagania techniczne:
    - integracja SAP z modułem CRM musi obsługiwać real-time sync
    - SLA dla integracji SAP: max 2s latencja

📁 BABOK-20260210-XP9R — Portal Klienta / STAGE_06_Gap_Analysis_Roadmap.md
  Line 134:
    Zidentyfikowana luka: brak integracji SAP z systemem zamówień
    Priorytet: WYSOKI
```

**Typowe zastosowania:**

```
"Znajdź wszystkie wymagania dotyczące bezpieczeństwa w moich projektach"
"Szukaj wzmianek o RODO we wszystkich dokumentach"
"W jakich projektach pojawiał się temat migracji danych?"
"Znajdź wszystkie ryzyka opisane jako 'wysokie' w projekcie K7M3"
```

---

### 8.8 `babok_export`

**Cel:** Eksportuje wszystkie pliki projektu (journal + deliverables) do wskazanego katalogu.

---

### 8.9 `babok_rename_project`

**Cel:** Zmienia nazwę projektu w journal (bez zmiany ID katalogu).

**Parametry:**

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project_id` | string | TAK | ID projektu |
| `new_name` | string | TAK | Nowa nazwa projektu |

**Co robi:**
- Aktualizuje pole `project_name` w pliku journal JSON
- Zapisuje datę zmiany i starą nazwę w historii
- Zwraca potwierdzenie

**Jak wywołać:**

```
"Zmień nazwę projektu K7M3 na 'Wdrożenie CRM v2 - etap rozszerzony'"
"Rename project K7M3 to 'CRM Phase 2'"
```

---

### 8.10 `babok_delete_project`

**Cel:** Trwale usuwa projekt po potwierdzeniu.

**Parametry:**

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project_id` | string | TAK | ID projektu |
| `confirm` | boolean | TAK | Musi być `true` — wymaga jawnego potwierdzenia |

**Co robi:**
- Wymaga `confirm: true` — AI nie wywoła bez jawnej zgody
- Usuwa katalog projektu z `BABOK_PROJECTS_DIR`
- Operacja jest **nieodwracalna**

**Jak wywołać:**

```
"Usuń projekt K7M3 — potwierdź usunięcie"
"Delete project K7M3, I confirm"
```

> ⚠️ **Uwaga:** Zanim poprosisz o usunięcie, warto wcześniej wyeksportować projekt przez `babok_export`.

---

### 8.8 `babok_export` (ciąg dalszy)

**Parametry:**

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `project_id` | string | TAK | ID projektu |
| `output_dir` | string | NIE | Ścieżka docelowa (domyślnie `./export/<project_id>`) |

**Co robi:**
- Tworzy katalog docelowy (jeśli nie istnieje)
- Kopiuje wszystkie pliki `.md` i `.json` z katalogu projektu
- Zwraca potwierdzenie z liczbą skopiowanych plików i ścieżką

**Przykład odpowiedzi:**
```
📦 PROJECT EXPORTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Project:  BABOK-20260316-K7M3
  Name:     Wdrożenie CRM dla Acme
  Files:    10 file(s)
  Output:   D:/BABOK_ANALYST/export/BABOK-20260316-K7M3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Typowe zastosowania:**

```
"Wyeksportuj projekt K7M3 do folderu C:/Deliverables/Acme"
"Zrób eksport projektu dla klienta"
"Export project to D:/Raporty/Q1-2026"
```

Po eksporcie możesz konwertować pliki MD do DOCX/PDF:

```bash
# Konwersja całego eksportu do DOCX (wymaga pandoc)
for file in export/BABOK-20260316-K7M3/*.md; do
  pandoc "$file" -o "${file%.md}.docx"
done
```

---

## 9. Zasoby (Resources) — etapy BABOK

Serwer udostępnia również **9 zasobów MCP** — są to pliki promptów etapów dostępne pod adresami URI:

| URI | Etap | Zawartość |
|-----|------|-----------|
| `babok://stages/0` | Stage 0 | Instrukcje tworzenia Project Charter |
| `babok://stages/1` | Stage 1 | Metodyka mapowania interesariuszy |
| `babok://stages/2` | Stage 2 | Analiza stanu obecnego (AS-IS) |
| `babok://stages/3` | Stage 3 | Analiza domeny problemowej |
| `babok://stages/4` | Stage 4 | Definicja wymagań rozwiązania |
| `babok://stages/5` | Stage 5 | Projektowanie stanu docelowego (TO-BE) |
| `babok://stages/6` | Stage 6 | Analiza luk i harmonogram wdrożenia |
| `babok://stages/7` | Stage 7 | Ocena ryzyk i strategie mitygacji |
| `babok://stages/8` | Stage 8 | Business Case i model ROI |

Zasoby te są odczytywane automatycznie przez narzędzie `babok_get_stage` — nie musisz ich wywoływać ręcznie.

---

## 10. Kompletny przykład sesji

Poniżej pełna sesja prowadzenia analizy biznesowej przez 3 pierwsze etapy.

---

### Sesja 1: Inicjalizacja projektu

**Analityk do AI:**
> "Utwórz nowy projekt BABOK dla wdrożenia systemu CRM w Acme Polska, język polski"

**AI wywołuje:** `babok_new_project({ name: "Wdrożenie CRM w Acme Polska", language: "PL" })`

**AI odpowiada:**
> Projekt został utworzony: **BABOK-20260316-K7M3**. Zaczynam Stage 0 — Project Charter.

**AI wywołuje:** `babok_get_stage({ project_id: "K7M3", stage_n: 0 })`

**AI prowadzi rozmowę** (pytania z pliku `BABOK_agent_stage_0.md`):
> 1. Jaki jest główny cel biznesowy tego wdrożenia?
> 2. Jaki jest planowany budżet i horyzont czasowy?
> 3. Kto jest sponsorem projektu?

**Analityk odpowiada** na pytania...

**AI wywołuje:** `babok_save_deliverable({ project_id: "K7M3", stage_n: 0, content: "# Project Charter\n..." })`

**Analityk:**
> "Wygląda dobrze, zatwierdź Stage 0"

**AI wywołuje:** `babok_approve_stage({ project_id: "K7M3", stage_n: 0, notes: "Cel: zwiększenie sprzedaży o 20% w 18 mies." })`

---

### Sesja 2 (następnego dnia): Kontynuacja

**Analityk do AI:**
> "Kontynuuj projekt K7M3 — jesteśmy na Stage 1"

**AI wywołuje:** `babok_get_stage({ project_id: "K7M3", stage_n: 1 })`

AI widzi w journal że Stage 0 jest zatwierdzony z notatką o celu. **Nie pyta ponownie o podstawy projektu** — kontynuuje od Stage 1 ze pełnym kontekstem.

---

### Sesja 3: Wyszukiwanie wiedzy z poprzednich projektów

**Analityk do AI:**
> "Zanim zaczniemy Stage 4, sprawdź czy w poprzednich projektach były podobne wymagania dotyczące integracji"

**AI wywołuje:** `babok_search({ query: "integracja CRM" })`

AI prezentuje znaleziska z poprzednich projektów — analityk może użyć tej wiedzy w bieżącym projekcie.

---

### Finalizacja projektu:

**Po ukończeniu Stage 8:**

**Analityk:**
> "Wyeksportuj projekt K7M3 do folderu D:/Deliverables/Acme-CRM"

**AI wywołuje:** `babok_export({ project_id: "K7M3", output_dir: "D:/Deliverables/Acme-CRM" })`

Katalog eksportu zawiera:
```
D:/Deliverables/Acme-CRM/
├── PROJECT_JOURNAL_BABOK-20260316-K7M3.json
├── STAGE_00_Project_Charter.md
├── STAGE_01_Project_Initialization.md
├── STAGE_02_Current_State_Analysis.md
├── STAGE_03_Problem_Domain_Analysis.md
├── STAGE_04_Solution_Requirements.md
├── STAGE_05_Future_State_Design.md
├── STAGE_06_Gap_Analysis_Roadmap.md
├── STAGE_07_Risk_Assessment.md
└── STAGE_08_Business_Case_ROI.md
```

---

## 11. Kiedy i do czego używać babok-mcp?

### Używaj babok-mcp gdy:

| Sytuacja | Dlaczego warto |
|----------|---------------|
| **Prowadzisz formalne analizy biznesowe** | Automatyczne stosowanie metodyki BABOK, każdy etap ma właściwe pytania i strukturę |
| **Pracujesz nad kilkoma projektami równolegle** | `babok_list_projects` + `babok_get_stage` dają natychmiastowy kontekst |
| **Wracasz do projektu po przerwie** | Journal przechowuje historię — nie tracisz kontekstu |
| **Chcesz budować bazę wiedzy organizacji** | `babok_search` przeszukuje wszystkie projekty |
| **Tworzysz dokumentację dla klienta** | `babok_export` + pandoc = gotowe raporty DOCX/PDF |
| **Pracujesz w zespole** | Wspólny katalog `BABOK_PROJECTS_DIR` = wspólna baza projektów |
| **Integrujesz AI do procesu BA** | AI staje się wirtualnym analitykiem znającym metodykę |

### NIE używaj babok-mcp gdy:

| Sytuacja | Alternatywa |
|----------|-------------|
| Potrzebujesz jednorazowej analizy ad-hoc | Zwykła rozmowa z Claude bez narzędzi |
| Chcesz podłączyć do claude.ai w przeglądarce | Wymaga wystawienia serwera HTTP (ngrok + przebudowa) |
| Projekty są niejawne/tajne | Upewnij się że ścieżki projektów są na bezpiecznym dysku |

---

## 12. Struktura plików projektu

Po zakończeniu pełnej analizy każdy projekt zawiera:

```
BABOK_ANALYST/projects/
└── BABOK-20260316-K7M3/
    ├── PROJECT_JOURNAL_BABOK-20260316-K7M3.json   ← dziennik projektu
    ├── STAGE_00_Project_Charter.md                ← Karta projektu
    ├── STAGE_01_Project_Initialization.md         ← Interesariusze
    ├── STAGE_02_Current_State_Analysis.md         ← Analiza AS-IS
    ├── STAGE_03_Problem_Domain_Analysis.md        ← Problemy biznesowe
    ├── STAGE_04_Solution_Requirements.md          ← Wymagania
    ├── STAGE_05_Future_State_Design.md            ← Stan docelowy TO-BE
    ├── STAGE_06_Gap_Analysis_Roadmap.md           ← Analiza luk + roadmapa
    ├── STAGE_07_Risk_Assessment.md                ← Rejestr ryzyk
    └── STAGE_08_Business_Case_ROI.md              ← Uzasadnienie biznesowe
```

### Struktura journal JSON:

```json
{
  "project_id": "BABOK-20260316-K7M3",
  "project_name": "Wdrożenie CRM w Acme Polska",
  "language": "PL",
  "created_at": "2026-03-16T10:23:45.000Z",
  "last_updated": "2026-03-16T14:45:22.000Z",
  "current_stage": 3,
  "current_status": "in_progress",
  "stages": [
    {
      "stage": 0,
      "name": "Project Charter",
      "status": "approved",
      "started_at": "2026-03-16T10:23:45.000Z",
      "approved_at": "2026-03-16T11:15:00.000Z",
      "notes": "Cel: zwiększenie sprzedaży o 20% w 18 mies.",
      "deliverable_file": "STAGE_00_Project_Charter.md"
    }
  ],
  "decisions": [...],
  "assumptions": [...],
  "open_questions": [...]
}
```

---

## 13. Rozwiązywanie problemów

### Problem: Serwer nie startuje

**Objaw:** `claude mcp list` pokazuje błąd lub brak serwera `babok`

**Rozwiązania:**

1. Sprawdź czy Node.js jest zainstalowany:
   ```bash
   node --version
   # Musi być >= 18
   ```

2. Sprawdź czy zależności są zainstalowane:
   ```bash
   ls D:/BABOK_ANALYST/babok-mcp/node_modules/@modelcontextprotocol
   # Musi istnieć
   ```

3. Jeśli brak — zainstaluj ponownie:
   ```bash
   cd D:/BABOK_ANALYST/babok-mcp && npm install
   ```

4. Uruchom serwer ręcznie i sprawdź błędy:
   ```bash
   node D:/BABOK_ANALYST/babok-mcp/bin/babok-mcp.js
   ```

---

### Problem: "Stage prompt file not found"

**Objaw:** AI odpowiada że nie może znaleźć pliku instrukcji etapu

**Rozwiązanie:** Sprawdź zmienną `BABOK_AGENT_DIR`:

```bash
ls D:/BABOK_ANALYST/BABOK_AGENT/stages/
# Muszą istnieć pliki BABOK_agent_stage_0.md ... BABOK_agent_stage_8.md
```

Jeśli pliki są w innym miejscu, zaktualizuj konfigurację:
```json
"BABOK_AGENT_DIR": "ścieżka/do/katalogu/ze/stagami"
```

---

### Problem: "Project not found"

**Objaw:** AI nie może znaleźć projektu po ID

**Rozwiązanie 1:** Sprawdź czy projekt istnieje:
```bash
ls D:/BABOK_ANALYST/projects/
```

**Rozwiązanie 2:** Użyj pełnego lub częściowego ID — serwer akceptuje np. `K7M3` zamiast pełnego `BABOK-20260316-K7M3`.

**Rozwiązanie 3:** Sprawdź `BABOK_PROJECTS_DIR` — może wskazuje na inny katalog niż myślisz.

---

### Problem: Zmiany nie są widoczne po restarcie

**Objaw:** Po restarcie Claude Desktop/Code serwer nie widzi nowych projektów

**Rozwiązanie:** Serwer działa jako oddzielny proces — czyta pliki z dysku w czasie rzeczywistym. Jeśli problem nadal występuje, sprawdź uprawnienia do katalogu `projects/`.

---

### Problem: "No matches found" przy wyszukiwaniu

**Objaw:** `babok_search` nie znajduje oczekiwanych wyników

**Możliwe przyczyny:**
- Dokumenty etapów nie zostały jeszcze zapisane przez AI (nie wywołano `babok_save_deliverable`)
- Szukana fraza jest w innym języku niż dokumenty
- Wyszukiwanie jest case-insensitive ale wymaga dokładnego dopasowania fragmentu

---

## 14. Najczęstsze pytania (FAQ)

**P: Czy mogę używać babok-mcp bez BABOK_ANALYST CLI?**
O: Tak. Serwer MCP jest niezależny — nie wymaga globalnego polecenia `babok`. Potrzebujesz tylko pliku `babok-mcp.js` i katalogu z promptami etapów.

**P: Czy AI automatycznie przechodzi przez wszystkie 9 etapów?**
O: Nie — AI czeka na zatwierdzenie każdego etapu przez analityka. Każdy etap wymaga interakcji człowieka. Jeśli chcesz automatyczne przejście, użyj komendy `babok run` z CLI.

**P: Gdzie są przechowywane projekty?**
O: W katalogu wskazanym przez `BABOK_PROJECTS_DIR` (domyślnie `D:/BABOK_ANALYST/projects/`). Każdy projekt to osobny podkatalog z plikami `.md` i `.json`.

**P: Czy mogę zmienić nazwę projektu po jego utworzeniu?**
O: Tak. Narzędzie `babok_rename_project` zmienia nazwę projektu bezpośrednio przez MCP. Możesz też użyć polecenia `babok rename` w CLI.

**P: Czy kilka osób może pracować na tym samym projekcie?**
O: Tak, jeśli `BABOK_PROJECTS_DIR` wskazuje na współdzielony folder sieciowy lub dysk. Nie ma jednak mechanizmu blokowania plików — unikaj równoczesnej pracy na tym samym etapie.

**P: Co się stanie jeśli zatwierdzę etap, który nie ma jeszcze deliverable?**
O: Serwer zatwierdzi etap (aktualizuje journal), ale plik deliverable nie zostanie automatycznie utworzony. Możesz go dodać później przez `babok_save_deliverable`.

**P: Jak usunąć projekt?**
O: Użyj narzędzia `babok_delete_project` — wymaga jawnego parametru `confirm: true`, więc jest zabezpieczone przed przypadkowym usunięciem. Możesz też użyć `babok delete` w CLI lub ręcznie usunąć katalog projektu.

**P: Czy serwer obsługuje inne języki niż EN i PL?**
O: Parametr `language` akceptuje tylko `EN` lub `PL`. Jednak AI może generować treści w innych językach jeśli o to poprosisz — language w journal kontroluje domyślny język odpowiedzi agenta BABOK.

**P: Jak zaktualizować serwer do nowszej wersji?**
O: Wykonaj `git pull` w katalogu `BABOK_ANALYST`, a następnie `npm install` w `babok-mcp/`. Nie musisz zmieniać konfiguracji MCP.

---

*Dokumentacja wygenerowana dla babok-mcp v2.0.2 — BABOK Analyst Project*
*Repozytorium: https://github.com/GSkuza/BABOK_ANALYST*
