# Agent Portability

BABOK Analyst is an agent-portable distribution. Core behavior lives in
`BABOK_AGENT/`, `skills/`, and `babok-mcp/`; host-specific files are thin
adapters that load that behavior in each agent.

## Supported Adapters

| Host | Files | Install |
|------|-------|---------|
| Claude Code | `.claude-plugin/`, `.mcp.json`, `hooks/`, `commands/`, `skills/`, `agents/` | `/plugin marketplace add GSkuza/BABOK_ANALYST` then `/plugin install babok_analyst@babok_analyst` |
| Codex | `.codex-plugin/`, `.agents/plugins/marketplace.json`, `plugins/babok_analyst/`, `hooks/`, `skills/` | `codex plugin marketplace add GSkuza/BABOK_ANALYST` then `codex plugin add babok_analyst@babok_analyst` |
| GitHub Copilot CLI | `.github/plugin/`, `AGENTS.md`, `hooks/copilot-hooks.json` | `copilot plugin marketplace add GSkuza/BABOK_ANALYST` then `copilot plugin install babok_analyst@babok_analyst` |
| Gemini CLI | `gemini-extension.json`, `AGENTS.md`, `commands/`, `skills/` | Extension manifest points `contextFileName` at `AGENTS.md` |
| Cursor | `.cursor/mcp.json` or project MCP config | Manual MCP wiring; use `babok-mcp` paths from plugin root |
| GitHub Copilot (IDE) | `.github/copilot-instructions.md` | Instruction-tier fallback (no hooks/MCP auto-wiring) |
| Generic agents | `AGENTS.md` or `skills/babok-analyst/SKILL.md` | Copy or load skill directly |

## Adapter Rule

Keep adapters thin. Point each host at existing `skills/`, `hooks/`, and
`BABOK_AGENT/stages/` rather than duplicating prompt text.

## Portable Paths

| Variable | Purpose |
|----------|---------|
| `${CLAUDE_PLUGIN_ROOT}` | Bundled plugin files (Claude Code MCP) |
| `cwd: "."` in `.mcp.json` | Codex resolves MCP paths relative to plugin root (no `${CLAUDE_PLUGIN_ROOT}`) |
| `${CLAUDE_PROJECT_DIR}` | User workspace — projects stored in `projects/` subdirectory |
| `${CLAUDE_PLUGIN_DATA}` | Persistent plugin state across updates |

**Canonical project directory:** `projects/<project_id>/`

**Legacy CLI export:** `BABOK_Analysis/` — only when using `babok run -o BABOK_Analysis`

## MCP Tools

The `babok-mcp` server exposes **16 tools** and **9 stage resources**
(`babok://stages/0` … `babok://stages/8`). Claude Code loads MCP via
`.mcp.json` at plugin root when the plugin is enabled.

## Uninstall

Each host removes plugin files via its own uninstall command. To clean
external state (mode flag, config file):

```bash
node scripts/uninstall.cjs
```

## Version Alignment

All host manifests must share one pinned semver. CI runs:

```bash
npm run check-versions
```
