@echo off
chcp 65001 >nul 2>&1

echo.
echo  ========================================================
echo   BABOK Agent CLI -- Instalator (Windows)
echo  ========================================================
echo.

:: ── 1. Sprawdz Node.js ──────────────────────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
    echo  [BLAD] Node.js nie jest zainstalowany.
    echo.
    echo  Pobierz i zainstaluj Node.js ze strony:
    echo    https://nodejs.org/  (wersja LTS, np. 20.x)
    echo.
    echo  Po instalacji uruchom ten skrypt ponownie.
    goto :DONE
)

for /f "tokens=1" %%v in ('node --version') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER% znaleziony.

:: ── 2. Sprawdz npm ──────────────────────────────────────────────────────────
where npm >nul 2>&1
if errorlevel 1 (
    echo  [BLAD] npm nie zostal znaleziony. Zainstaluj Node.js ponownie.
    goto :DONE
)
echo  [OK] npm znaleziony.

:: ── 3. Instaluj zaleznosci CLI ──────────────────────────────────────────────
echo.
echo  [INFO] Instalowanie zaleznosci CLI (cli/)...
pushd "%~dp0cli"
call npm install
set NPM_CLI_ERR=%errorlevel%
popd
if %NPM_CLI_ERR% neq 0 (
    echo.
    echo  [BLAD] npm install (cli) nie powiodl sie.
    echo  Sprawdz polaczenie z internetem i sprobuj ponownie.
    goto :DONE
)
echo  [OK] Zaleznosci CLI zainstalowane.

:: ── 4. Instaluj zaleznosci MCP (opcjonalnie) ────────────────────────────────
if exist "%~dp0babok-mcp\package.json" (
    echo.
    echo  [INFO] Instalowanie zaleznosci MCP (babok-mcp/)...
    pushd "%~dp0babok-mcp"
    call npm install
    set NPM_MCP_ERR=%errorlevel%
    popd
    if %NPM_MCP_ERR% neq 0 (
        echo  [UWAGA] npm install (babok-mcp) nie powiodl sie - kontynuuję bez MCP.
    ) else (
        echo  [OK] Zaleznosci MCP zainstalowane.
    )
)

:: ── 5. Dodaj babok do PATH (opcjonalnie) ────────────────────────────────────
echo.
set /p ADD_PATH=  Czy dodac 'babok' do PATH uzytkownika? (T/N):
if /i "%ADD_PATH%"=="T" (
    setx PATH "%PATH%;%~dp0cli\bin"
    if errorlevel 1 (
        echo  [UWAGA] Nie udalo sie dodac do PATH. Dodaj recznie: %~dp0cli\bin
    ) else (
        echo  [OK] Dodano %~dp0cli\bin do PATH uzytkownika.
        echo  [INFO] Uruchom NOWY terminal aby zmiany weszly w zycie.
    )
)

:: ── 6. Kreator konfiguracji (klucze API, jezyk) ──────────────────────────────
echo.
set /p RUN_SETUP=  Czy uruchomic kreator konfiguracji (klucze API, jezyk)? (T/N):
if /i "%RUN_SETUP%"=="T" (
    node "%~dp0cli\bin\babok.js" setup
)

:: ── Sukces ───────────────────────────────────────────────────────────────────
echo.
echo  ========================================================
echo   Instalacja zakonczona!
echo.
echo   Uruchom NOWY terminal i wpisz:
echo     babok --help        aby zobaczyc komendy
echo     babok new           aby utworzyc nowy projekt
echo  ========================================================

:DONE
echo.
echo  Wpisz EXIT aby zamknac to okno.
echo.
cmd /k
