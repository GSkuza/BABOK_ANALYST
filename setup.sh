#!/usr/bin/env bash
# BABOK Agent CLI — Installer (Linux / macOS)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

echo ""
echo "  ╔══════════════════════════════════════════════╗"
echo "  ║    BABOK Agent CLI — Installer (Unix)        ║"
echo "  ╚══════════════════════════════════════════════╝"
echo ""

# ── 1. Check Node.js ─────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
    echo -e "  ${RED}[ERROR]${NC} Node.js is not installed."
    echo ""
    echo "  Install Node.js (LTS) via your package manager:"
    echo "    macOS:  brew install node"
    echo "    Ubuntu: sudo apt install nodejs npm"
    echo "    Or:     https://nodejs.org/"
    echo ""
    exit 1
fi

NODE_VER=$(node --version)
echo -e "  ${GREEN}[OK]${NC} Node.js ${NODE_VER} found."

# ── 2. Check npm ─────────────────────────────────────────────────────────────
if ! command -v npm &>/dev/null; then
    echo -e "  ${RED}[ERROR]${NC} npm not found. Reinstall Node.js."
    exit 1
fi
echo -e "  ${GREEN}[OK]${NC} npm found."

# ── 3. Install CLI dependencies ───────────────────────────────────────────────
echo ""
echo "  [INFO] Installing CLI dependencies (cli/)..."
( cd "$SCRIPT_DIR/cli" && npm install --prefer-offline )
echo -e "  ${GREEN}[OK]${NC} CLI dependencies installed."

# ── 4. Install MCP dependencies (optional) ───────────────────────────────────
if [ -f "$SCRIPT_DIR/babok-mcp/package.json" ]; then
    echo ""
    echo "  [INFO] Installing MCP server dependencies (babok-mcp/)..."
    ( cd "$SCRIPT_DIR/babok-mcp" && npm install --prefer-offline )
    echo -e "  ${GREEN}[OK]${NC} MCP dependencies installed."
fi

# ── 5. Symlink babok to /usr/local/bin (optional) ────────────────────────────
echo ""
read -r -p "  Add 'babok' to /usr/local/bin (requires sudo)? [y/N]: " ADD_LINK
if [[ "${ADD_LINK,,}" == "y" ]]; then
    BABOK_BIN="$SCRIPT_DIR/cli/bin/babok.js"
    chmod +x "$BABOK_BIN"
    sudo ln -sf "$BABOK_BIN" /usr/local/bin/babok
    echo -e "  ${GREEN}[OK]${NC} Symlink created: /usr/local/bin/babok"
fi

# ── 6. Run setup wizard ───────────────────────────────────────────────────────
echo ""
read -r -p "  Run the setup wizard (API keys, language)? [Y/n]: " RUN_SETUP
if [[ "${RUN_SETUP,,}" != "n" ]]; then
    node "$SCRIPT_DIR/cli/bin/babok.js" setup
fi

echo ""
echo "  ════════════════════════════════════════════════"
echo -e "  ${GREEN}Installation complete!${NC}"
echo ""
echo "  Open a new terminal and type:"
echo "    babok --help    to see available commands"
echo "    babok new       to create a new project"
echo "  ════════════════════════════════════════════════"
echo ""
