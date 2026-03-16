OK. Rozpoczynam generowanie kompletnego dokumentu dla Etapu 4: "Definicja Wymagań Rozwiązania". Będę przestrzegał podanych zasad automatycznego trybu analizy, wykorzystując dostarczony kontekst projektu, formułując jasne założenia w przypadku brakujących danych i generując profesjonalny dokument w języku polskim, zgodny ze standardem BABOK v3.

```markdown
# Etap 4: Definicja Wymagań Rozwiązania

**Projekt:** Digitalizacja procesu zgłaszania "potencjałów"
**ID Projektu:** [Automatycznie wygenerowany ID projektu - Zakładam format BABOK-RRRRMMDD-XXXX, np. BABOK-20240125-AAAA]
**Data:** 2024-01-25 (Automatycznie wygenerowana)
**Status:** Oczekuje na zatwierdzenie

---

## Podsumowanie Wykonawcze (1 strona)

**Cel Etapu:**
Zdefiniowanie wymagań funkcjonalnych i niefunkcjonalnych dla systemu digitalizującego proces zgłaszania "potencjałów", zapewniając przejrzystość, kontrolę przepływu informacji i motywację pracowników.

**Kluczowe Ustalenia:**
1. Zdefiniowano wymagania funkcjonalne, w tym możliwość zgłaszania potencjałów online, śledzenia statusu zgłoszenia i generowania raportów.
2. Zdefiniowano wymagania niefunkcjonalne, w tym bezpieczeństwo danych, dostępność systemu i łatwość użytkowania.
3. Ustalono priorytety wymagań, oparte na analizie przyczyn źródłowych z Etapu 3 i potrzebach interesariuszy.

**Priorytety Wymagań (MoSCoW):**
| Priorytet | Liczba Wymagań | % Całości | Notatki |
|----------|-----------------|------------|---------|
| MUST | 5 | 50% | Kluczowe dla wdrożenia |
| SHOULD | 3 | 30% | Ważne, ale możliwe do wdrożenia w kolejnych fazach |
| COULD | 2 | 20% | Pożądane, ale nie krytyczne |
| WON'T | 0 | 0% | Poza zakresem |

---

## Szczegółowa Analiza

### 1. Wymagania Funkcjonalne (FR)

| ID | Wymaganie | Priorytet | Źródło | Kryteria Akceptacji |
|----|-------------|----------|--------|---------------------|
| FR-001 | Pracownik może zgłosić potencjał przez dedykowany formularz online. | MUST | Brak przejrzystości | Formularz zawiera wszystkie wymagane pola (opis, kategoria, proponowane rozwiązanie). |
| FR-002 | System automatycznie przypisuje zgłoszenie do odpowiedniego działu/osoby weryfikującej. | MUST | Niekontrolowany przepływ informacji | Zgłoszenie trafia do właściwej osoby weryfikującej w ciągu 24 godzin. |
| FR-003 | Pracownik może śledzić status swojego zgłoszenia online. | MUST | Brak przejrzystości | System wyświetla aktualny status zgłoszenia (oczekujące, weryfikowane, zaakceptowane, odrzucone). |
| FR-004 | System wysyła automatyczne powiadomienia o zmianie statusu zgłoszenia. | MUST | Brak motywacji | Pracownik otrzymuje powiadomienie e-mail o każdej zmianie statusu zgłoszenia. |
| FR-005 | System generuje raporty dotyczące zgłoszonych potencjałów (liczba, status, oszczędności). | MUST | Brak monitoringu | Raporty są generowane automatycznie i dostępne dla kierownictwa. |
| FR-006 | System umożliwia dodawanie załączników (dokumenty, zdjęcia). | SHOULD | Ułatwienie zgłaszania | Możliwość dodania do 5 załączników o łącznej wielkości do 10 MB. |
| FR-007 | System archiwizuje zgłoszenia i powiązane dokumenty. | SHOULD | Zgodność z przepisami | Zgłoszenia są archiwizowane przez okres 5 lat. |
| FR-008 | System umożliwia ocenę wdrożonych potencjałów i obliczanie oszczędności. | COULD | Analiza efektywności | Możliwość przypisania wartości oszczędności do wdrożonego potencjału. |
| FR-009 | System integruje się z istniejącymi systemami (np. system HR). | COULD | Ułatwienie zarządzania danymi | Dane pracowników są automatycznie pobierane z systemu HR. |

### 2. Wymagania Niefunkcjonalne (NFR)

| ID | Kategoria | Wymaganie | Priorytet | Pomiar |
|----|----------|-------------|----------|-------------|
| NFR-001 | Wydajność | Czas odpowiedzi systemu na zapytanie | Wysoki | Poniżej 3 sekund |
| NFR-002 | Bezpieczeństwo | Autoryzacja dostępu do danych | Wysoki | Tylko uprawnione osoby mają dostęp do danych |
| NFR-003 | Dostępność | Uptime systemu | Wysoki | 99.9% |
| NFR-004 | Użyteczność | Łatwość obsługi systemu | Średni | Ocena powyżej 4/5 w ankiecie użytkowników |

### 3. Historie Użytkownika (User Stories)

**Epic:** Zgłaszanie Potencjałów

*   **US-001:** Jako pracownik, chcę móc zgłosić potencjał online, aby usprawnić proces.
    *   Kryteria Akceptacji:
        *   Dany: Jestem zalogowanym pracownikiem
        *   Kiedy: Wypełniam formularz zgłoszenia potencjału i klikam "Wyślij"
        *   Wtedy: Powinienem otrzymać potwierdzenie zgłoszenia i numer referencyjny.

*   **US-002:** Jako osoba weryfikująca, chcę móc przeglądać zgłoszone potencjały i zmieniać ich status, aby efektywnie zarządzać procesem.
    *   Kryteria Akceptacji:
        *   Dany: Jestem osobą z uprawnieniami do weryfikacji zgłoszeń.
        *   Kiedy: Przeglądam listę zgłoszonych potencjałów.
        *   Wtedy: Powinienem widzieć szczegóły zgłoszenia i móc zmienić jego status.

*   **US-003:** Jako kierownik, chcę móc generować raporty dotyczące zgłoszonych potencjałów, aby monitorować efektywność procesu.
    *   Kryteria Akceptacji:
        *   Dany: Jestem kierownikiem z uprawnieniami do generowania raportów.
        *   Kiedy: Wybieram opcję "Generuj raport".
        *   Wtedy: Powinienem otrzymać raport zawierający dane dotyczące liczby zgłoszeń, statusu i oszczędności.

### 4. Macierz Śledzenia Wymagań (RTM)

| Req ID | Wymaganie | Źródło (Przyczyna Źródłowa) | Interesariusz | Priorytet | Historia Użytkownika |
|--------|-------------|-------------------------------|---------------|----------|-----------------------|
| FR-001 | Pracownik może zgłosić potencjał online | Brak przejrzystości | Pracownik | MUST | US-001 |
| FR-002 | System automatycznie przypisuje zgłoszenie | Niekontrolowany przepływ informacji | Kierownik | MUST | US-002 |
| FR-003 | Pracownik może śledzić status zgłoszenia online | Brak motywacji | Pracownik | MUST | US-001 |

### 5. Proces Kontroli Zmian

Gdy wymagania ulegają zmianie po zatwierdzeniu, należy postępować zgodnie z poniższą procedurą:

1.  **Zgłoszenie Zmiany:** Interesariusz zgłasza wniosek o zmianę (CR-XXX).
2.  **Analiza Wpływu:** Analityk biznesowy ocenia wpływ na zakres, harmonogram, budżet i inne wymagania.
3.  **Przegląd:** Komitet Sterujący przegląda analizę wpływu.
4.  **Decyzja:** Zatwierdzenie / Odrzucenie / Odroczenie.
5.  **Implementacja:** Jeśli zatwierdzono, zaktualizuj RTM, historie użytkownika i dotknięte etapy.
6.  **Komunikacja:** Powiadom wszystkich zainteresowanych.

---

## Zatwierdzenie

**Następne polecenie:** `Approve 4` aby przejść do Etapu 5
```

---

**Koniec dokumentu.**
