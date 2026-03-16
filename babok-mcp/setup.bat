@echo off
setlocal EnableDelayedExpansion

echo.
echo  ========================================================
echo   BABOK MCP Server -- Instalator (Windows)
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
echo  Zalecana wersja: LTS ^(np. 20.x lub nowsza^)
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

:: --- 3. Instaluj zaleznosci MCP ---
echo.
echo  [INFO] Instalowanie zaleznosci serwera MCP...
pushd "%~dp0"
call npm install
set "NPM_ERR=!errorlevel!"
popd
if !NPM_ERR! neq 0 (
    echo  [BLAD] npm install nie powiodl sie.
    echo  Sprawdz polaczenie z internetem i sprobuj ponownie.
    goto :DONE
)
echo  [OK] Zaleznosci zainstalowane.

:: --- 4. Sprawdz plik serwera ---
echo.
echo  [INFO] Sprawdzam pliki serwera MCP...
if exist "%~dp0bin\babok-mcp.js" (
    node --check "%~dp0bin\babok-mcp.js" >nul 2>&1
    if !errorlevel! equ 0 (
        echo  [OK] Serwer MCP gotowy do uruchomienia.
    ) else (
        echo  [UWAGA] Blad skladni w bin\babok-mcp.js - sprawdz plik.
    )
) else (
    echo  [BLAD] Nie znaleziono bin\babok-mcp.js
)

:: --- 5. Konfiguracja Claude Desktop ---

:: Wyznacz katalog glowny projektu (rodzic katalogu babok-mcp)
for %%I in ("%~dp0..") do set "BABOK_ROOT=%%~fI"

:: Zamien backslashe na forward slashe (poprawny JSON)
set "MCP_BIN=%~dp0bin\babok-mcp.js"
set "MCP_BIN_FWD=%MCP_BIN:\=/%"
set "PROJECTS_FWD=%BABOK_ROOT:\=/%/projects"
set "STAGES_FWD=%BABOK_ROOT:\=/%/BABOK_AGENT/stages"

echo.
echo  --------------------------------------------------------
echo   Konfiguracja klienta MCP (np. Claude Desktop)
echo  --------------------------------------------------------
echo.
echo  Dodaj ponizszy wpis do pliku konfiguracyjnego klienta:
echo.
echo    Lokalizacja (Windows):
echo    %%APPDATA%%\Claude\claude_desktop_config.json
echo.
echo  {
echo    "mcpServers": {
echo      "babok": {
echo        "command": "node",
echo        "args": ["!MCP_BIN_FWD!"],
echo        "env": {
echo          "BABOK_PROJECTS_DIR": "!PROJECTS_FWD!",
echo          "BABOK_AGENT_DIR": "!STAGES_FWD!"
echo        }
echo      }
echo    }
echo  }
echo.
echo  --------------------------------------------------------

:: --- 6. Automatyczne otwarcie pliku konfiguracyjnego (opcjonalnie) ---
echo.
set "CLAUDE_CFG=%APPDATA%\Claude\claude_desktop_config.json"
if exist "!CLAUDE_CFG!" (
    set /p "OPEN_CFG=  Otworzyc claude_desktop_config.json w Notatniku? (T/N): "
    if /i "!OPEN_CFG!"=="T" (
        notepad "!CLAUDE_CFG!"
    )
) else (
    echo  [INFO] Nie znaleziono claude_desktop_config.json
    echo  Utworz ten plik recznie lub uruchom Claude Desktop przynajmniej raz.
)

:: --- Sukces ---
echo.
echo  ========================================================
echo   Instalacja zakonczona!
echo.
echo   Aby uruchomic serwer MCP recznie:
echo     node "%~dp0bin\babok-mcp.js"
echo.
echo   Po konfiguracji uruchom ponownie Claude Desktop.
echo  ========================================================

:DONE
echo.
echo  Nacisnij dowolny klawisz aby zamknac...
pause >nul
endlocal
