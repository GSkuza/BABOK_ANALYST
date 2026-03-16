OK. Generuję kompletny dokument dla Etapu 2: "Analiza Stanu Obecnego (AS-IS)". Używam dostarczonego kontekstu projektu, formułuję jasne założenia w przypadku brakujących danych i generuję profesjonalny dokument w języku polskim, zgodny ze standardem BABOK v3.

```markdown
# Etap 2: Analiza Stanu Obecnego (AS-IS)

**Projekt:** Digitalizacja procesu zgłaszania "potencjałów"
**ID Projektu:** [Automatycznie wygenerowany ID projektu - Zakładam format BABOK-RRRRMMDD-XXXX]
**Data:** 2024-01-25 (Automatycznie wygenerowana)
**Status:** Oczekuje na zatwierdzenie

---

## Podsumowanie Wykonawcze (1 strona)

**Cel Etapu:**
Udokumentowanie obecnego stanu procesu zgłaszania potencjałów, identyfikacja punktów bólu i ustalenie metryk bazowych do pomiaru przyszłych ulepszeń.

**Kluczowe Ustalenia:**
1.  Proces zgłaszania potencjałów zmapowany jako manualny, papierowy obieg dokumentów.
2.  Główne punkty bólu: brak przejrzystości, niekontrolowany przepływ informacji, brak motywacji pracowników.
3.  Brak systemu do śledzenia statusu potencjałów, co utrudnia monitorowanie i raportowanie.

**Koszty Bazowe (Szacunkowe):** [Założenie: Brak danych, więc szacuję bazując na typowym procesie papierowym w firmie motoryzacyjnej]
| Kategoria Kosztów | Roczna Kwota (PLN) | % Całości |
|--------------------|----------------------|------------|
| Czas pracy pracowników (zgłaszanie, weryfikacja, akceptacja) | 15 000 PLN | 60% |
| Koszty administracyjne (papier, drukowanie, archiwizacja) | 2 500 PLN | 10% |
| Utracone korzyści (brak wdrożonych potencjałów) | 7 500 PLN | 30% |
| **RAZEM**          | **25 000 PLN**       | **100%**   |

**Krytyczne Problemy:**
-   Brak przejrzystości procesu dla pracowników.
-   Niekontrolowany przepływ informacji prowadzący do opóźnień i błędów.
-   Brak motywacji dla pracowników do zgłaszania potencjałów z powodu braku informacji zwrotnej.

**Następne Kroki Po Zatwierdzeniu:**
1.  Analiza przyczyn źródłowych zidentyfikowanych problemów (Etap 3).
2.  Ustalenie wymagań dla nowego systemu digitalizacji (Etap 4).

---

## Szczegółowa Analiza

### 1. Mapa Procesu AS-IS

**Proces:** Zgłaszanie "potencjałów" (wniosków racjonalizatorskich)
**Wywołanie:** Pomysł pracownika na ulepszenie
**Stan Końcowy:** Wdrożony lub odrzucony potencjał
**Działy Zaangażowane:** Produkcja, Inżynieria, Zarząd
**Systemy Używane:** Brak (proces manualny)
**Średni Czas Trwania:** 2-4 tygodnie
**Miesięczna Ilość:** [Założenie: Brak danych, szacuję 5-10 potencjałów miesięcznie]

**Kroki Procesu:**
| Krok | Osoba | Akcja | System | Czas Trwania | Notatki |
|------|--------|--------|--------|--------------|---------|
| 1    | Pracownik | Wypełnienie formularza papierowego | Brak | 1-2 godziny | Manualne |
| 2    | Bezpośredni przełożony | Weryfikacja i akceptacja | Brak | 1-3 dni | Manualne |
| 3    | Dział Inżynierii | Ocena techniczna | Brak | 3-7 dni | Manualne |
| 4    | Dyrektor Produkcji | Decyzja o wdrożeniu | Brak | 1-5 dni | Manualne |
| 5    | Wdrożenie (jeśli zaakceptowane) | Wdrożenie zmian | Brak | Zależne od potencjału | Manualne |
| 6    | Archiwizacja | Archiwizacja dokumentów | Brak | 0.5 godziny | Manualne |

**Zidentyfikowane Wąskie Gardła:**
-   Oczekiwanie na akceptację przełożonego (brak priorytetu).
-   Długi czas oceny technicznej (brak zasobów).
-   Brak śledzenia statusu potencjału (brak informacji zwrotnej dla pracownika).

---

### 2. Rejestr Punktów Bólu

| ID    | Punkt Bólu                                 | Proces                     | Częstotliwość | Wpływ Czasowy | Wpływ Kosztowy | Dotknięte Role |
|-------|---------------------------------------------|-----------------------------|---------------|----------------|----------------|----------------|
| PB-001 | Brak przejrzystości statusu potencjału      | Zgłaszanie potencjałów      | Częste        | 1-2 godziny/tydzień na pracownika | Trudny do oszacowania | Pracownicy, przełożeni |
| PB-002 | Długi czas oczekiwania na decyzję             | Zgłaszanie potencjałów      | Częste        | 2-3 dni na potencjał | Trudny do oszacowania | Pracownicy, przełożeni |
| PB-003 | Utrudniona komunikacja między działami      | Zgłaszanie potencjałów      | Umiarkowane    | 1-2 godziny/miesiąc | Trudny do oszacowania | Inżynieria, produkcja |

**Obecnie Stosowane Obejścia:**
| Obejście                                  | Cel                             | Ryzyko                               | Wysiłek |
|-------------------------------------------|---------------------------------|---------------------------------------|---------|
| Dopytywanie o status potencjału e-mailem | Uzyskanie informacji o statusie | Utrata czasu, brak centralnej bazy | Średni   |

---

### 3. Metryki Bazowe

#### Metryki Ilościowe:
| Metryka                               | Wartość | Okres | Źródło     | Pewność   |
|----------------------------------------|---------|-------|------------|-----------|
| Ilość zgłoszonych potencjałów          | [Założenie: 5-10] | Miesiąc | Szacunek | Niska     |
| Ilość wdrożonych potencjałów            | [Założenie: 1-2] | Miesiąc | Szacunek | Niska     |
| Ilość odrzuconych potencjałów           | [Założenie: 3-8] | Miesiąc | Szacunek | Niska     |

#### Metryki Czasowe:
| Metryka                               | Wartość | Okres | Źródło     | Pewność   |
|----------------------------------------|---------|-------|------------|-----------|
| Średni czas trwania procesu            | 2-4 tygodnie | Na potencjał | Szacunek | Niska     |
| Średni czas oczekiwania na decyzję     | 1-2 tygodnie | Na potencjał | Szacunek | Niska     |

#### Metryki Kosztowe:
| Metryka                               | Wartość | Okres | Źródło     | Pewność   |
|----------------------------------------|---------|-------|------------|-----------|
| Koszt pracy pracowników                | [Szacunek: 15 000 PLN] | Rocznie | Szacunek | Niska     |
| Koszty administracyjne                   | [Szacunek: 2 500 PLN] | Rocznie | Szacunek | Niska     |
| Utracone korzyści                       | [Szacunek: 7 500 PLN] | Rocznie | Szacunek | Niska     |

#### Metryki Jakościowe:
| Metryka                               | Wartość | Okres | Źródło     | Pewność   |
|----------------------------------------|---------|-------|------------|-----------|
| Poziom zadowolenia pracowników         | Niski     | Na bieżąco | Ankiety (brak) | Bardzo Niska |

---

### 4. Analiza Systemów i Przepływu Danych

#### Obecny Stan Systemów:
| System | Cel | Użytkownicy | Wersja | Wsparcie | Integracja |
|--------|-----|-------------|--------|----------|------------|
| Brak   | Brak | Brak        | Brak   | Brak     | Brak       |

#### Przepływ Danych Między Systemami:
Brak systemów, brak przepływu danych.

#### Problemy z Jakością Danych:
Brak danych.

---

### 5. Podsumowanie Stanu Obecnego

**Mocne Strony (co działa dobrze):**
1.  Zaangażowanie pracowników w zgłaszanie potencjałów (pomimo trudności).

**Słabe Strony (co wymaga poprawy):**
1.  Brak przejrzystości procesu (szacowany wpływ: utrata czasu i motywacji).
2.  Długi czas trwania procesu (szacowany wpływ: opóźnienia we wdrożeniach).
3.  Brak systemu do śledzenia statusu potencjałów (szacowany wpływ: brak informacji zwrotnej).

**Ryzyka Utrzymania Status Quo:**
1.  Spadek motywacji pracowników (prawdopodobieństwo: wysokie, wpływ: średni).
2.  Utrata potencjalnych korzyści z niewdrożonych pomysłów (prawdopodobieństwo: średnie, wpływ: wysoki).

---

## Zatwierdzenie

**Następne Polecenie:** `Approve 2` aby przejść do Etapu 3
```

**Założenia:**

*   Brak dostępu do danych systemowych, więc większość metryk jest szacunkowa.
*   Brak wdrożonego systemu do zarządzania potencjałami.
*   Koszty pracy pracowników szacowane na podstawie średniej stawki godzinowej.
*   Brak ankiet zadowolenia pracowników, więc poziom zadowolenia jest szacowany na niski.

**Uwagi:**

*   Należy zweryfikować szacunkowe dane z kierownictwem i pracownikami.
*   W Etapie 3 zostanie przeprowadzona analiza przyczyn źródłowych problemów.
*   W Etapie 4 zostaną zebrane szczegółowe wymagania dotyczące nowego systemu.

**Koniec dokumentu.**
