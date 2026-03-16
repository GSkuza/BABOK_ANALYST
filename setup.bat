@echo off
setlocal EnableDelayedExpansion

echo.
echo  ========================================================
echo   BABOK Agent CLI -- Instalator (Windows)
echo  ========================================================
echo.

:: --- 0. Odswiez PATH (fix dla Explorer z nieaktualnym PATH) ---
powershell.exe -NoProfile -Command "[System.Environment]::GetEnvironmentVariable('PATH','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('PATH','User')" > "%TEMP%\babokpath.tmp" 2>nul
for /f "usebackq delims=" %%P in ("%TEMP%\babokpath.tmp") do set "PATH=%%P"
del "%TEMP%\babokpath.tmp" >nul 2>&1

:: --- 1. Sprawdz Node.js ---
node --version >nul 2>&1
if not errorlevel 1 goto :NODE_OK

:: Szukaj Node.js w standardowych lokalizacjach
if exist "%ProgramFiles%\nodejs\node.exe" (
    set "PATH=%ProgramFiles%\nodejs;!PATH!"
    goto :NODE_OK
)
if exist "%ProgramFiles(x86)%\nodejs\node.exe" (
    set "PATH=%ProgramFiles(x86)%\nodejs;!PATH!"
    goto :NODE_OK
)
if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
    set "PATH=%LOCALAPPDATA%\Programs\nodejs;!PATH!"
    goto :NODE_OK
)

echo  [BLAD] Node.js nie jest zainstalowany.
echo.
echo  Pobierz i zainstaluj ze strony: https://nodejs.org/
echo  Zalecana wersja: LTS (np. 20.x lub nowsza)
echo.
echo  Po instalacji uruchom ten skrypt ponownie.
goto :DONE

:NODE_OK
for /f "tokens=1" %%v in ('node --version') do set "NODE_VER=%%v"
echo  [OK] Node.js !NODE_VER! znaleziony.

:: --- 2. Sprawdz npm ---
call npm --version >nul 2>&1
if !errorlevel! neq 0 (
    echo  [BLAD] npm nie zostal znaleziony. Zainstaluj Node.js ponownie.
    goto :DONE
)
echo  [OK] npm znaleziony.

:: --- 3. Instaluj zaleznosci CLI ---
echo.
echo  [INFO] Instalowanie zaleznosci CLI...
pushd "%~dp0cli"
call npm install
set "NPM_ERR=!errorlevel!"
popd
if !NPM_ERR! neq 0 (
    echo  [BLAD] npm install nie powiodl sie.
    echo  Sprawdz polaczenie z internetem i sprobuj ponownie.
    goto :DONE
)
echo  [OK] Zaleznosci CLI zainstalowane.

:: --- 4. Instaluj zaleznosci MCP (opcjonalnie) ---
if exist "%~dp0babok-mcp\package.json" (
    echo.
    echo  [INFO] Instalowanie zaleznosci MCP...
    pushd "%~dp0babok-mcp"
    call npm install
    set "NPM_MCP_ERR=!errorlevel!"
    popd
    if !NPM_MCP_ERR! neq 0 (
        echo  [UWAGA] npm install MCP nie powiodl sie - kontynuuje bez MCP.
    ) else (
        echo  [OK] Zaleznosci MCP zainstalowane.
    )
)

:: --- 5. Zainstaluj babok globalnie ---
echo.
echo  [INFO] Instalowanie komendy 'babok' globalnie...
pushd "%~dp0cli"
call npm install -g . 2>nul
set "NPM_G_ERR=!errorlevel!"
popd
if !NPM_G_ERR! neq 0 (
    echo  [UWAGA] Instalacja globalna nie powiodla sie.
    echo  Mozesz potrzebowac uprawnien administratora.
    echo  Alternatywnie uzyj: node "%~dp0cli\bin\babok.js" --help
) else (
    echo  [OK] Komenda 'babok' dostepna globalnie.
)

:: --- 6. Kreator konfiguracji ---
echo.
set /p "RUN_SETUP=  Uruchomic kreator konfiguracji API? (T/N): "
if /i "!RUN_SETUP!"=="T" (
    node "%~dp0cli\bin\babok.js" setup
)

:: --- Sukces ---
echo.
echo  ========================================================
echo   Instalacja zakonczona!
echo.
echo   Otworz NOWY terminal i wpisz:
echo     babok --help        aby zobaczyc komendy
echo     babok new           aby utworzyc nowy projekt
echo  ========================================================

:DONE
echo.
echo  Nacisnij dowolny klawisz aby zamknac...
pause >nul
endlocal