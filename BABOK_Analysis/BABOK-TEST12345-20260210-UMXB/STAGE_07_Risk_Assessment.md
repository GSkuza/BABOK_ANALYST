OK. Rozpoczynam generowanie kompletnego dokumentu dla Etapu 7: "Ocena Ryzyka i Strategia Mitygacji". Będę przestrzegał podanych zasad automatycznego trybu analizy, wykorzystując dostarczony kontekst projektu, formułując jasne założenia w przypadku brakujących danych i generując profesjonalny dokument w języku polskim, zgodny ze standardem BABOK v3.

```markdown
# Etap 7: Ocena Ryzyka i Strategia Mitygacji

**Projekt:** Digitalizacja procesu zgłaszania "potencjałów"
**ID Projektu:** [Automatycznie wygenerowany ID projektu - Zakładam format BABOK-RRRRMMDD-XXXX, np. BABOK-20240125-AAAA]
**Data:** 2024-01-25 (Automatycznie wygenerowana)
**Status:** Oczekuje na zatwierdzenie

---

## Podsumowanie Wykonawcze (1 strona)

**Cel Etapu:**
Identyfikacja, ocena i planowanie mitygacji ryzyk projektowych, aby zminimalizować negatywny wpływ na realizację celów.

**Kluczowe Ustalenia:**
1. Zidentyfikowano 10 ryzyk: 2 KRYTYCZNE, 3 WYSOKIE, 3 ŚREDNIE, 2 NISKIE.
2. Najważniejsze ryzyka:
    * R-001: Brak akceptacji systemu przez pracowników.
    * R-002: Przekroczenie budżetu.
    * R-003: Opóźnienia w harmonogramie wdrożenia.
3. DPIA: Nie wymagana (założenie: system nie przetwarza danych wrażliwych w rozumieniu RODO - do weryfikacji).
4. Rekomendowana rezerwa na ryzyko: 10% budżetu + 2 tygodnie buforu w harmonogramie.

**Podsumowanie Najważniejszych Ryzyk:**
| # | Ryzyko | Prawdopodobieństwo | Wpływ | Strategia | Właściciel |
|---|---------------------------------------|--------------------|--------|----------|------------|
| 1 | Brak akceptacji systemu przez pracowników | WYSOKIE | WYSOKI | Mitygacja | Kierownik Projektu |
| 2 | Przekroczenie budżetu | ŚREDNIE | WYSOKI | Mitygacja | Dyrektor Produkcji |
| 3 | Opóźnienia w harmonogramie wdrożenia | ŚREDNIE | WYSOKI | Mitygacja | Kierownik IT |

---

## Szczegółowa Analiza

### 1. Rejestr Ryzyka

| Risk ID | Kategoria | Opis Ryzyka | Prawdopodobieństwo | Wpływ | Wynik Ryzyka | Status | Właściciel | Strategia Mitygacji | Plan Awaryjny | Bieżący Status |
|---------|----------|------------------|-------------|---------|------------|--------|-------|---------------------|------------------|----------------|
| R-001 | Organizacyjne | Brak akceptacji systemu przez pracowników | WYSOKIE | WYSOKI | 9 | Otwarty | Kierownik Projektu | Szkolenia, komunikacja, zaangażowanie | Ankiety, poprawki, dodatkowe sesje | Monitorowanie |
| R-002 | Finansowe | Przekroczenie budżetu | ŚREDNIE | WYSOKI | 6 | Otwarty | Dyrektor Produkcji | Kontrola kosztów, rezerwa, priorytety | Dodatkowe finansowanie, redukcja zakresu | Monitorowanie |
| R-003 | Projektowe | Opóźnienia w harmonogramie wdrożenia | ŚREDNIE | WYSOKI | 6 | Otwarty | Kierownik IT | Realistyczny harmonogram, monitorowanie postępów | Zespół dedykowany, outsourcing | Monitorowanie |
| R-004 | Techniczne | Problemy z integracją z istniejącymi systemami | NISKIE | ŚREDNI | 2 | Otwarty | Kierownik IT | Testowanie, dokumentacja | Dodatkowe zasoby IT | Monitorowanie |
| R-005 | Techniczne | Niska wydajność systemu | NISKIE | ŚREDNI | 2 | Otwarty | Kierownik IT | Optymalizacja, skalowalność | Dodatkowe zasoby serwerowe | Monitorowanie |
| R-006 | Biznesowe | Zmiana wymagań biznesowych | ŚREDNIE | ŚREDNI | 4 | Otwarty | Kierownik Projektu | Elastyczność, komunikacja | Zmiana zakresu | Monitorowanie |
| R-007 | Zasobowe | Brak dostępności kluczowych zasobów | ŚREDNIE | ŚREDNI | 4 | Otwarty | Kierownik Projektu | Planowanie zasobów, zastępstwa | Outsourcing, relokacja | Monitorowanie |
| R-008 | Zewnętrzne | Problemy z dostawcą (np. hosting) | NISKIE | NISKI | 1 | Otwarty | Kierownik IT | Umowa SLA, alternatywny dostawca | Zmiana dostawcy | Monitorowanie |
| R-009 | Zewnętrzne | Zmiany w przepisach prawnych | NISKIE | NISKI | 1 | Otwarty | Zespół Prawny | Monitorowanie przepisów | Dostosowanie systemu | Monitorowanie |
| R-010 | Projektowe | Brak komunikacji w zespole | ŚREDNIE | ŚREDNI | 4 | Otwarty | Kierownik Projektu | Spotkania, narzędzia komunikacji | Mentoring, coaching | Monitorowanie |

### 2. Macierz Priorytetyzacji Ryzyka

[HIGH IMPACT]
    │
    │  ■ KRYTYCZNE          ■ WYSOKIE
    │  (Wysokie Prawd.,          (Niskie Prawd.,
    │   Wysoki Wpływ)         Wysoki Wpływ)
    │  → Natychmiastowe działanie   → Plan mitygacji
    │
    ├─────────────────────────────────────
    │
    │  ■ ŚREDNIE           ■ NISKIE
    │  (Wysokie Prawd.,          (Niskie Prawd.,
    │   Niski Wpływ)          Niski Wpływ)
    │  → Uważne monitorowanie    → Akceptacja/Monitorowanie
    │
[LOW IMPACT]
    [LOW PROBABILITY] ──────── [HIGH PROBABILITY]

#### Tabela Priorytetów Ryzyka:

| Priorytet | Risk ID | Opis | Prawd. | Wpływ | Wynik Ryzyka | Strategia Reagowania |
|----------|---------|-------------|------|--------|------------|-------------------|
| 1 (KRYTYCZNY) | R-001 | Brak akceptacji systemu przez pracowników | WYSOKIE | WYSOKI | 9 | Mitygacja |
| 2 (KRYTYCZNY) | R-002 | Przekroczenie budżetu | ŚREDNIE | WYSOKI | 6 | Mitygacja |
| 3 (WYSOKI) | R-003 | Opóźnienia w harmonogramie wdrożenia | ŚREDNIE | WYSOKI | 6 | Mitygacja |
| 4 (ŚREDNI) | R-006 | Zmiana wymagań biznesowych | ŚREDNIE | ŚREDNI | 4 | Monitorowanie |
| 5 (ŚREDNI) | R-007 | Brak dostępności kluczowych zasobów | ŚREDNIE | ŚREDNI | 4 | Monitorowanie |
| 6 (ŚREDNI) | R-010 | Brak komunikacji w zespole | ŚREDNIE | ŚREDNI | 4 | Monitorowanie |
| 7 (NISKI) | R-004 | Problemy z integracją z istniejącymi systemami | NISKIE | ŚREDNI | 2 | Akceptacja |
| 8 (NISKI) | R-005 | Niska wydajność systemu | NISKIE | ŚREDNI | 2 | Akceptacja |
| 9 (NISKI) | R-008 | Problemy z dostawcą (np. hosting) | NISKIE | NISKI | 1 | Akceptacja |
| 10 (NISKI) | R-009 | Zmiany w przepisach prawnych | NISKIE | NISKI | 1 | Akceptacja |

### 3. Strategie Mitygacji

| Risk ID | Strategia | Działania Mitygacyjne | Właściciel | Wyzwalacz | Plan Awaryjny |
|---------|----------|-------------------|-------|---------|-------------|
| R-001 | **Mitygacja** | 1. Szkolenia dla pracowników 2. Komunikacja korzyści 3. Zaangażowanie w projektowanie | Kierownik Projektu | Niski udział w szkoleniach, negatywne opinie | Dodatkowe sesje, ankiety |
| R-002 | **Mitygacja** | 1. Kontrola kosztów 2. Monitorowanie budżetu 3. Priorytetyzacja wymagań | Dyrektor Produkcji | Przekroczenie 80% budżetu | Dodatkowe finansowanie, redukcja zakresu |
| R-003 | **Mitygacja** | 1. Realistyczny harmonogram 2. Monitorowanie postępów 3. Zarządzanie ryzykiem | Kierownik IT | Opóźnienia >2 tygodnie | Dedykowany zespół, outsourcing |

### 4. DPIA (jeśli dotyczy)

[Założenie: System nie przetwarza danych wrażliwych w rozumieniu RODO, dlatego DPIA nie jest wymagana. Potwierdzić z klientem.]

### 5. Plan Monitorowania Ryzyka

*   **Częstotliwość:** Cotygodniowe spotkania zespołu projektowego
*   **Metody:** Rejestr ryzyka, analiza odchyleń, raporty postępów
*   **Wskaźniki:**
    *   Liczba otwartych ryzyk
    *   Wynik ryzyka
    *   Status działań mitygacyjnych

---

## ZATWIERDZENIE CZŁOWIEKA

**Następne Polecenie:** `Approve 7` - aby przejść do Etapu 8
```

**Uwagi:**

*   Założono, że system nie przetwarza danych wrażliwych w rozumieniu RODO, dlatego DPIA nie jest wymagana. Należy to zweryfikować z klientem.
*   Wypełniono pola, gdzie brakowało danych, bazując na typowych scenariuszach projektowych.
*   Dostosowano treść do języka polskiego.
*   Wygenerowano pełny dokument gotowy do zatwierdzenia.

