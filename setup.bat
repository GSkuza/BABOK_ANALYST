@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║     BABOK Agent CLI — Instalator (Windows)   ║
echo  ╚══════════════════════════════════════════════╝
echo.

:: ── 1. Sprawdź Node.js ──────────────────────────────────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [BLAD] Node.js nie jest zainstalowany.
    echo.
    echo  Pobierz i zainstaluj Node.js ze strony:
    echo    https://nodejs.org/  (wersja LTS, np. 20.x)
    echo.
    echo  Po instalacji uruchom ten skrypt ponownie.
    echo.
    pause
    exit /b 1
)

for /f "tokens=1" %%v in ('node --version') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER% znaleziony.

:: ── 2. Sprawdź npm ──────────────────────────────────────────────────────────
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo  [BLAD] npm nie został znaleziony. Zainstaluj Node.js ponownie.
    pause
    exit /b 1
)
echo  [OK] npm znaleziony.

:: ── 3. Zainstaluj zależności CLI ────────────────────────────────────────────
echo.
echo  [INFO] Instalowanie zaleznosci CLI (cli/)...
pushd "%~dp0cli"
call npm install --prefer-offline 2>&1
if %errorlevel% neq 0 (
    echo  [BLAD] npm install nie powiodl sie. Sprawdz polaczenie z internetem.
    popd
    pause
    exit /b 1
)
popd
echo  [OK] Zaleznosci CLI zainstalowane.

:: ── 4. Zainstaluj zależności MCP (opcjonalnie) ──────────────────────────────
if exist "%~dp0babok-mcp\package.json" (
    echo.
    echo  [INFO] Instalowanie zaleznosci MCP (babok-mcp/)...
    pushd "%~dp0babok-mcp"
    call npm install --prefer-offline 2>&1
    popd
    echo  [OK] Zaleznosci MCP zainstalowane.
)

:: ── 5. Dodaj babok do PATH (opcjonalnie) ────────────────────────────────────
echo.
set /p ADD_PATH="  Czy dodac 'babok' do PATH uzytkownika? (T/N): "
if /i "!ADD_PATH!"=="T" (
    set CLI_BIN=%~dp0cli\bin
    for /f "skip=2 tokens=3*" %%a in ('reg query HKCU\Environment /v PATH 2^>nul') do set "CURRENT_PATH=%%a %%b"
    echo !CURRENT_PATH! | findstr /i "%~dp0cli\bin" >nul 2>&1
    if %errorlevel% equ 0 (
        echo  [OK] Katalog juz jest w PATH.
    ) else (
        setx PATH "!CURRENT_PATH!;%~dp0cli\bin" >nul 2>&1
        echo  [OK] Dodano %~dp0cli\bin do PATH uzytkownika.
        echo  [INFO] Uruchom nowy terminal, aby zmiany weszly w zycie.
    )
)

:: ── 6. Uruchom kreator konfiguracji ─────────────────────────────────────────
echo.
set /p RUN_SETUP="  Czy uruchomic kreator konfiguracji (klucze API, jezyk)? (T/N): "
if /i "!RUN_SETUP!"=="T" (
    node "%~dp0cli\bin\babok.js" setup
)

echo.
echo  ════════════════════════════════════════════════
echo   Instalacja zakonczona pomyslnie!
echo.
echo   Uruchom nowy terminal i wpisz:
echo     babok --help        aby zobaczyc dostepne komendy
echo     babok new           aby utworzyc nowy projekt
echo   ════════════════════════════════════════════════
echo.
pause
endlocal
