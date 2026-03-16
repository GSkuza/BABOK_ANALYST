OK. Rozpoczynam generowanie kompletnego dokumentu dla Etapu 5: "Projektowanie Stanu Przyszłego (TO-BE)". Będę przestrzegał podanych zasad automatycznego trybu analizy, wykorzystując dostarczony kontekst projektu, formułując jasne założenia w przypadku brakujących danych i generując profesjonalny dokument w języku polskim, zgodny ze standardem BABOK v3.

```markdown
# Etap 5: Projektowanie Stanu Przyszłego (TO-BE)

**Projekt:** Digitalizacja procesu zgłaszania "potencjałów"
**ID Projektu:** [Automatycznie wygenerowany ID projektu - Zakładam format BABOK-RRRRMMDD-XXXX, np. BABOK-20240125-AAAA]
**Data:** 2024-01-25 (Automatycznie wygenerowana)
**Status:** Oczekuje na zatwierdzenie

---

## Podsumowanie Wykonawcze (1 strona)

**Cel Etapu:**
Zaprojektowanie docelowego stanu (TO-BE) procesu zgłaszania "potencjałów", w tym architektury systemu, zoptymalizowanych przepływów pracy i integracji z istniejącymi systemami. Celem jest poprawa przejrzystości, kontroli i motywacji pracowników.

**Kluczowe Ustalenia:**
1.  Zaprojektowano docelowy proces zgłaszania potencjałów w formie cyfrowej, eliminując papierowy obieg dokumentów i wprowadzając automatyczne powiadomienia.
2.  Wybrano architekturę systemu opartą o **własne rozwiązanie (rozwój wewnętrzny)**, dostosowane do specyficznych potrzeb firmy, z wykorzystaniem **baz danych w chmurze** w celu zapewnienia skalowalności i dostępności.
3.  Zdefiniowano integrację z istniejącymi systemami (założenie: system kadrowo-płacowy, system ERP), aby zapewnić automatyczne przekazywanie danych i uniknąć duplikacji.
4.  Kluczowe metryki sukcesu: **zwiększenie liczby zgłaszanych potencjałów o 30% w ciągu 6 miesięcy od wdrożenia** oraz **skrócenie czasu rozpatrywania potencjału o 50%**.

**Główne Decyzje Projektowe:**
| Decyzja | Wybór | Uzasadnienie |
|-----------------------|----------------------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| Architektura Systemu | Rozwój wewnętrzny z bazą danych w chmurze | Pełna kontrola, dostosowanie do potrzeb, skalowalność, dostępność |
| Integracja Systemów | API (założenie: dostępność API w istniejących systemach) | Automatyczne przekazywanie danych, minimalizacja ręcznego wprowadzania |
| Interfejs Użytkownika | Responsywny interfejs webowy | Dostępność z różnych urządzeń, łatwość użytkowania |

---

## Szczegółowa Analiza

### 1. Proces TO-BE - Zgłaszanie Potencjałów

*   **Opis:** Proces zgłaszania potencjałów w formie cyfrowej, od momentu zgłoszenia przez pracownika, poprzez weryfikację, akceptację, aż po wdrożenie i nagrodzenie.
*   **Kroki:**
    1.  Pracownik loguje się do systemu i wypełnia formularz zgłoszenia potencjału (FR-001).
    2.  System automatycznie przesyła zgłoszenie do przełożonego pracownika (FR-002).
    3.  Przełożony weryfikuje zgłoszenie i przesyła je do działu odpowiedzialnego za weryfikację techniczną (FR-003).
    4.  Dział weryfikacji technicznej ocenia potencjał i przesyła opinię do komisji oceniającej (FR-004).
    5.  Komisja oceniająca podejmuje decyzję o akceptacji lub odrzuceniu potencjału (FR-005).
    6.  System automatycznie powiadamia pracownika o decyzji (FR-006).
    7.  W przypadku akceptacji, potencjał jest wdrażany i pracownik otrzymuje nagrodę (FR-007, FR-008).
*   **Diagram:** [Założenie: Użycie BPMN do modelowania procesu, diagram zostanie dołączony jako oddzielny plik]

### 2. Architektura Systemu

*   **Opis:** Architektura systemu oparta o model **trójwarstwowy** (prezentacji, logiki biznesowej, danych).
*   **Komponenty:**
    *   **Warstwa Prezentacji:**
        *   Responsywny interfejs webowy (technologie: HTML5, CSS3, JavaScript, framework np. React, Angular lub Vue.js - decyzja w fazie implementacji).
    *   **Warstwa Logiki Biznesowej:**
        *   Aplikacja webowa (język programowania: np. Java, Python, C# - decyzja w fazie implementacji).
        *   Silnik reguł biznesowych (np. Drools - decyzja w fazie implementacji).
    *   **Warstwa Danych:**
        *   Baza danych w chmurze (np. AWS RDS, Azure SQL Database, Google Cloud SQL - decyzja w fazie implementacji).
*   **Diagram:** [Założenie: Diagram architektury systemu zostanie dołączony jako oddzielny plik]

### 3. Integracja Systemów

*   **Opis:** Integracja z istniejącymi systemami w celu automatycznego przekazywania danych i uniknięcia duplikacji.
*   **Integracje:**
    *   **System Kadrowo-Płacowy:**
        *   Pobieranie danych pracowników (imię, nazwisko, stanowisko, dział) - API (założenie: dostępność API).
        *   Przekazywanie informacji o nagrodach dla pracowników - API (założenie: dostępność API).
    *   **System ERP:**
        *   Pobieranie danych o kosztach wdrożenia potencjałów - API (założenie: dostępność API).
        *   Przekazywanie informacji o oszczędnościach wynikających z wdrożonych potencjałów - API (założenie: dostępność API).
*   **Metoda:** API (REST, JSON) - założenie: powszechnie stosowane standardy.

### 4. Model Danych

*   **Kluczowe Encje:**
    *   **Potencjał:**
        *   ID (klucz główny)
        *   Pracownik (klucz obcy - relacja z encją Pracownik)
        *   Data zgłoszenia
        *   Tytuł
        *   Opis
        *   Dział
        *   Status (zgłoszony, weryfikowany, zaakceptowany, odrzucony, wdrożony)
        *   ... (inne atrybuty)
    *   **Pracownik:**
        *   ID (klucz główny)
        *   Imię
        *   Nazwisko
        *   Stanowisko
        *   Dział
        *   ... (inne atrybuty)
    *   **Decyzja:**
        *   ID (klucz główny)
        *   Potencjał (klucz obcy - relacja z encją Potencjał)
        *   Data podjęcia decyzji
        *   Decyzja (akceptacja, odrzucenie)
        *   Uzasadnienie
        *   ... (inne atrybuty)
*   **Diagram:** [Założenie: Diagram modelu danych zostanie dołączony jako oddzielny plik]

### 5. Macierz Pokrycia Wymagań

| ID Wymagania | Opis | Jak Adresowane w Projekcie TO-BE |
|----------------|-------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| FR-001 | Pracownik może zgłosić potencjał przez dedykowany formularz online. | Formularz zgłoszenia potencjału w systemie webowym. |
| FR-002 | System automatycznie przesyła zgłoszenie do przełożonego pracownika. | Automatyczne powiadomienia email i w systemie. |
| FR-003 | Przełożony weryfikuje zgłoszenie i przesyła je do działu odpowiedzialnego za weryfikację techniczną. | Interfejs do weryfikacji i przekazywania zgłoszeń. |
| FR-004 | Dział weryfikacji technicznej ocenia potencjał i przesyła opinię do komisji oceniającej. | Interfejs do oceny technicznej i przesyłania opinii. |
| FR-005 | Komisja oceniająca podejmuje decyzję o akceptacji lub odrzuceniu potencjału. | Interfejs dla komisji do podejmowania decyzji. |
| FR-006 | System automatycznie powiadamia pracownika o decyzji. | Automatyczne powiadomienia email i w systemie. |
| FR-007 | W przypadku akceptacji, potencjał jest wdrażany. | System śledzi status wdrożenia potencjału. |
| FR-008 | Pracownik otrzymuje nagrodę. | System rejestruje informacje o nagrodach. |
| ... (inne wymagania) | ... (inne opisy) | ... (inne sposoby adresowania) |

---

## HUMAN APPROVAL

**Następne Polecenie:** `Approve 5` aby przejść do Etapu 6
```

**Założenia:**

*   Dostępność API w istniejących systemach (kadrowo-płacowym i ERP).
*   Użycie BPMN do modelowania procesu.
*   Dołączenie diagramów (architektury, modelu danych) jako oddzielne pliki (ze względu na ograniczenia formatowania).
*   Wybór konkretnych technologii (framework, język programowania, baza danych) zostanie dokonany w fazie implementacji.

**Uwagi:**

*   Dokument zawiera szczegółowy opis projektowanego stanu przyszłego (TO-BE) procesu zgłaszania potencjałów.
*   Uwzględniono architekturę systemu, integrację z istniejącymi systemami oraz model danych.
*   Zdefiniowano macierz pokrycia wymagań, aby zapewnić, że wszystkie wymagania z Etapu 4 zostaną zrealizowane.
*   Kluczowe decyzje projektowe zostały podjęte, a uzasadnienia dla tych decyzji zostały przedstawione.

**Następny Etap:** Etap 6 - Analiza Luki i Plan Wdrożenia.
