# BABOK Agent - Quick Start Guide

## 🚀 Szybki Start

### Krok 1: Inicjalizacja Agenta

Skopiuj pełną zawartość pliku `BABOK_Agent_System_Prompt.md` i wklej do **instrukcji projektu** (Project Instructions) w Claude.ai lub użyj jako system prompt w API Anthropic.

### Krok 2: Rozpocznij Sesję

W nowej konwersacji napisz:

```
BEGIN STAGE 1
```

Agent rozpocznie proces od Stage 1: Project Initialization & Stakeholder Mapping.

---

## 💡 Jak Pracować z Agentem

### Agent Będzie Zadawał Pytania w Formacie:

```
REASONING: [Wyjaśnienie dlaczego pyta]

QUESTIONS FOR HUMAN:
1. [Pytanie 1]
2. [Pytanie 2]
...

WAIT FOR HUMAN INPUT.
```

### Ty Odpowiadasz:

**Format odpowiedzi:** Jasno i konkretnie, używając numeracji pytań:

```
1. TAK - wszystkie dokumenty w scope: faktury, WZ, zamówienia
2. ERP: SAP Business One v10.0
3. Księgowość: Comarch ERP Optima v2024.1
4. Nie mamy DMS obecnie
5. KSeF deadline: 1 lipca 2026
```

### Jeśli Czegoś Nie Wiesz:

```
NIE WIEM - muszę sprawdzić z [osoba/dział]
```

Agent pomoże Ci znaleźć odpowiedź lub zasugeruje jak uzyskać informację.

---

## ⚙️ Komendy Kontrolne

| Komenda | Działanie |
|---------|-----------|
| `BEGIN STAGE [N]` | Rozpoczyna etap N |
| `STAGE [N] APPROVED` | Zatwierdza etap N i przechodzi do następnego |
| `CORRECTION: [błąd] → [poprawka]` | Poprawia błąd agenta |
| `PAUSE` | Wstrzymuje pracę, można kontynuować później |
| `RESUME STAGE [N]` | Wznawia pracę od etapu N |
| `SHOW PROGRESS` | Wyświetla status wszystkich etapów |
| `REGENERATE SECTION [nazwa]` | Regeneruje konkretną sekcję w ramach etapu |
| `SKIP TO STAGE [N]` | Pomija etapy (niezalecane, ale możliwe) |

---

## 📁 Struktura Plików Wyjściowych

Agent zapisze wszystkie deliverable w folderze:

```
/mnt/user-data/outputs/BABOK_Analysis/
├── STAGE_01_Project_Initialization.md
├── STAGE_02_Current_State_Analysis.md
├── STAGE_03_Problem_Domain_Analysis.md
├── STAGE_04_Solution_Requirements.md
├── STAGE_05_Future_State_Design.md
├── STAGE_06_Gap_Analysis_Roadmap.md
├── STAGE_07_Risk_Assessment.md
├── STAGE_08_Business_Case_ROI.md
└── FINAL_Complete_Documentation.md
```

**Każdy plik jest niezależny i można go edytować/przesyłać osobno.**

---

## 🎯 Najlepsze Praktyki

### ✅ DO:
- **Czytaj sekcje REASONING** - zrozumiesz dlaczego agent pyta o dane rzeczy
- **Bądź konkretny** - "średnio 50 faktur/miesiąc" lepsze niż "sporo"
- **Zatwierdzaj progresywnie** - możesz zatwierdzać sekcje po kolei, nie musisz czekać na cały etap
- **Pytaj o wyjaśnienia** - jeśli coś jest niejasne: "WHY did you conclude X?"
- **Koryguj natychmiast** - jeśli agent popełni błąd, popraw go od razu

### ❌ DON'T:
- **Nie zgaduj** - jeśli nie wiesz, powiedz "NIE WIEM"
- **Nie pomijaj pytań** - każde pytanie ma powód, agent nie pyta dla zabawy
- **Nie zatwierdzaj na ślepo** - przeczytaj dokument przed zatwierdzeniem
- **Nie mieszaj etapów** - dokończ jeden etap przed przejściem do następnego

---

## 🔍 Przykładowa Sesja

```
USER: BEGIN STAGE 1

AGENT: [Wyświetla cel Stage 1 i zadaje pierwsze pytania]

REASONING: Before stakeholder analysis, I need to understand 
what's IN and OUT of scope.

QUESTIONS FOR HUMAN:
1. Does "full digitalization" include incoming invoices? [YES/NO]
2. What ERP system is currently used? [NAME & VERSION]
...

WAIT FOR HUMAN INPUT.

USER: 
1. TAK - faktury zakupowe i sprzedażowe
2. ERP: SAP Business One v10.0
3. Księgowość: Comarch ERP Optima 2024.1
4. NIE - nie mamy DMS
5. TAK - Autenti obecnie używamy

AGENT: [Przetwarza odpowiedzi i kontynuuje z następnymi pytaniami]

[... proces trwa ...]

AGENT: [Po zebraniu wszystkich informacji]
I have completed STAGE 1 deliverable. 
[Pokazuje pełny dokument STAGE_01_Project_Initialization.md]

Please review and confirm: STAGE 1 APPROVED

USER: CORRECTION: W punkcie 2.1 - mamy 180 pracowników, nie 170

AGENT: [Poprawia dokument i pokazuje zaktualizowaną wersję]
Thank you for correction. Updated. 
Please review again and confirm: STAGE 1 APPROVED

USER: STAGE 1 APPROVED

AGENT: ✅ STAGE 1 APPROVED
Saving to /mnt/user-data/outputs/BABOK_Analysis/STAGE_01_Project_Initialization.md

Ready to proceed to STAGE 2: Current State Analysis (AS-IS)?
Type "BEGIN STAGE 2" when ready.

[... i tak dalej przez wszystkie 8 etapów ...]
```

---

## ⏱️ Czas Trwania (Szacunki)

| Stage | Czas Pracy | Czas Przerw na Konsultacje | Total |
|-------|-----------|---------------------------|-------|
| Stage 1 | 30-45 min | 1-2 dni | 1-2 dni |
| Stage 2 | 1-2 godz. | 3-5 dni (zbieranie danych) | 1 tydzień |
| Stage 3 | 45-60 min | 1-2 dni | 2-3 dni |
| Stage 4 | 2-3 godz. | 3-5 dni (walidacja wymagań) | 1 tydzień |
| Stage 5 | 1-2 godz. | 2-3 dni | 3-4 dni |
| Stage 6 | 1 godz. | 1 dzień | 1-2 dni |
| Stage 7 | 45 min | 1 dzień | 1-2 dni |
| Stage 8 | 1-2 godz. | 2-3 dni (kalkulacje finansowe) | 3-5 dni |
| **TOTAL** | **8-12 godz.** | **2-3 tygodnie** | **3-4 tygodnie** |

**Uwaga:** Większość czasu to nie praca z agentem, tylko zbieranie danych od stakeholderów i konsultacje wewnętrzne.

---

## 🆘 Rozwiązywanie Problemów

### Problem: Agent nie rozumie mojej odpowiedzi

**Rozwiązanie:** Przeformułuj bardziej szczegółowo lub podaj przykład:
```
Zamiast: "Mamy dużo faktur"
Napisz: "Otrzymujemy średnio 450 faktur zakupowych miesięcznie"
```

### Problem: Agent pyta o coś czego nie możemy określić teraz

**Rozwiązanie:**
```
To pytanie wymaga decyzji zarządu. Zaznacz jako OPEN QUESTION 
i przejdźmy dalej. Wrócimy do tego w Stage 4.
```

Agent oznaczy to jako otwarty temat do rozstrzygnięcia.

### Problem: Pomyliłem się w odpowiedzi kilka pytań temu

**Rozwiązanie:**
```
CORRECTION w [Section X.Y]: [Opisz błąd i poprawkę]
```

Agent cofnie się, poprawi i zapyta czy coś jeszcze trzeba zmienić.

### Problem: Agent wygenerował zbyt techniczny dokument

**Rozwiązanie:**
```
Simplify section [X] for non-technical audience. 
Remove jargon and add business-level explanations.
```

### Problem: Chcę zmienić priorytet wymagania

**Rozwiązanie:**
```
In Stage 4, change requirement FR-015 from MUST to SHOULD.
Reasoning: [Twoje uzasadnienie]
```

Agent zaktualizuje dokument i zweryfikuje czy nie ma konfliktów.

---

## 🔐 Bezpieczeństwo i Prywatność

### Dane Wrażliwe:

**Agent NIE będzie przechowywał:**
- Haseł ani kluczy API
- Numerów kont bankowych klientów/dostawców
- Danych osobowych poza niezbędnymi do analizy (imiona, role)

**Agent MOŻE przechowywać:**
- Strukturę organizacyjną (role, nie nazwiska)
- Procesy biznesowe (workflow)
- Agregowane metryki finansowe (nie szczegółowe transakcje)
- Nazwy systemów i narzędzi

### Compliance:

Agent jest zaprojektowany zgodnie z:
- ✅ GDPR (minimalizacja danych, prawo do usunięcia)
- ✅ BABOK® Code of Conduct
- ✅ ISO 27001 principles (dokumentacja procesów)

**Po zakończeniu projektu:**
Możesz usunąć konwersację z Claude.ai, a pliki .md zachować lokalnie.

---

## 📞 Wsparcie

### Jeśli napotkasz problem:

1. **Najpierw sprawdź tę instrukcję** - większość pytań ma odpowiedź tutaj
2. **Zapytaj agenta** - typ: "I'm stuck, how do I [problem]?"
3. **Zresetuj stage** - typ: "REGENERATE STAGE [N]" jeśli coś poszło nie tak

### Feedback Loop:

Po zakończeniu wszystkich etapów, agent zapyta:
```
How satisfied are you with this process? [1-5]
What could be improved?
```

Twoja opinia pomoże ulepszyć agenta dla przyszłych użytkowników.

---

## 🎓 Dodatkowe Zasoby

### Jeśli chcesz zgłębić BABOK:
- IIBA BABOK® Guide v3: https://www.iiba.org/babok-guide/
- IIBA Agile Extension: https://www.iiba.org/agile-extension/
- Glossary of terms: https://www.iiba.org/babok-guide/glossary/

### Jeśli potrzebujesz wsparcia merytorycznego:
- Certified Business Analyst (CBAP/CCBA) - rozważ zatrudnienie konsultanta na etapy 4-6
- BABOK Agent to narzędzie, nie zastępuje ludzkiego osądu

---

## ✅ Checklist Przed Startem

Przed wpisaniem `BEGIN STAGE 1` upewnij się że:

- [ ] Masz 30-45 minut nieprzerwanych na Stage 1
- [ ] Masz dostęp do kluczowych informacji o firmie (przychody, liczba pracowników, systemy)
- [ ] Znasz projekt sponsor'a (kto podejmuje decyzje)
- [ ] Masz możliwość konsultacji z zespołem (Finance, IT, Operations)
- [ ] Zapisałeś plik `BABOK_Agent_System_Prompt.md` w Project Instructions
- [ ] Przeczytałeś tę instrukcję i rozumiesz proces

**Jeśli wszystko OK, wpisz:**
```
BEGIN STAGE 1
```

**Powodzenia! 🚀**

---

**Version:** 1.0  
**Last Updated:** [DATE]  
**Maintained by:** BABOK Agent Development Team
