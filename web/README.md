# BABOK Analyst Web UI

Next.js (App Router) frontend for the BABOK Analyst platform.

## Prerequisites

- Node.js >= 18
- BABOK MCP server running (default: `http://localhost:3001`)

## Setup

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BABOK_MCP_URL` | `http://localhost:3001` | Base URL of the BABOK MCP server |

## Views

| Route | Description |
|-------|-------------|
| `/` | Dashboard — list all projects |
| `/projects/new` | Create a new project |
| `/projects/[id]` | Project detail with stage pipeline |
| `/projects/[id]/stages/[n]` | Stage view — deliverable + approve/reject |
| `/projects/[id]/export` | Download ZIP of all deliverables |

## Development

```bash
npm run build   # TypeScript check + production build
npm run lint    # ESLint
```
