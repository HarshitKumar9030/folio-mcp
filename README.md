# Folioo MCP

Connect Claude Code, Codex, Claude Desktop, Cursor, VS Code and other MCP clients to your Folioo workspace. Node.js 20+ is required; Python and a local source checkout are not required.

## 1. Get your credentials

Open your Folioo app → Settings → Connect your tools → Create integration token. The token expires after 30 days and can be revoked there. It permits reading your projects and publishing public content. Store it in your client's secret environment, not in prompts, source control, or shared configuration.

Every client needs two values: `FOLIO_API_URL` (your Folioo app, `https://folioo.tech` or `http://localhost:3000` locally) and `FOLIO_API_TOKEN`. `FOLIO_ORIGIN` is optional; set it to your dashboard origin only for custom setups that return 403.

## 2. Add the server to your client

### Claude Code

```sh
export FOLIO_API_TOKEN=folio_...   # your token, kept in your shell profile or a secret manager
claude mcp add folio --scope user -e FOLIO_API_URL=https://folioo.tech -e FOLIO_API_TOKEN="$FOLIO_API_TOKEN" -- npx --yes github:HarshitKumar9030/folio-mcp#v0.2.0
claude mcp list
```

Inside Claude Code, run `/mcp` to see the connection and its tools. Reference: https://docs.claude.com/en/docs/claude-code/mcp

### Codex

```sh
codex mcp add folio -- npx --yes github:HarshitKumar9030/folio-mcp#v0.2.0
codex mcp list
```

Or in `~/.codex/config.toml`:

```toml
[mcp_servers.folio]
command = "npx"
args = ["--yes", "github:HarshitKumar9030/folio-mcp#v0.2.0"]
env_vars = ["FOLIO_API_URL", "FOLIO_API_TOKEN", "FOLIO_ORIGIN"]
```

### Claude Desktop, Cursor and other JSON clients

Claude Desktop: Settings → Developer → Edit config (`claude_desktop_config.json`). Cursor: `~/.cursor/mcp.json`.

```json
{
  "mcpServers": {
    "folio": {
      "command": "npx",
      "args": ["--yes", "github:HarshitKumar9030/folio-mcp#v0.2.0"],
      "env": {
        "FOLIO_API_URL": "https://folioo.tech",
        "FOLIO_API_TOKEN": "REPLACE_IN_YOUR_PRIVATE_CLIENT_SETTINGS"
      }
    }
  }
}
```

### VS Code

`.vscode/mcp.json` uses a `servers` key: `{"servers": {"folio": {"type": "stdio", "command": "npx", "args": [...], "env": {...}}}}`. Keep the file out of source control if it holds your token.

## 3. Try a read-only request

Ask your client: “List my Folioo projects and tell me which version is live.” Then try “Read the files of this project.” Publishing is explicit: “Publish these supplied files as a new Folioo project.” Updates require the current `expected_version` and will reject stale versions.

Tools (the same in every client):

| Tool | What it does |
| --- | --- |
| `list_projects` | List projects owned by your account |
| `list_deployments` | Release history and which version is live |
| `read_project_files` | Read the current files of an owned project |
| `publish_project` | Publish supplied files to a new public URL |
| `update_project` | Publish a new version with a version conflict check |
| `run_workspace_task` | Run an explicit Folioo task: index files, create Studio outputs, draft outreach |
| `save_contact` | Save or update a lead or contact |
| `list_outreach` | List contacts and drafts waiting for review |
| `send_outreach_email` | Send a reviewed draft, only with explicit confirmation |
| `list_proposals` | Proposals with status: draft, published, opens, accepted and the total |
| `get_proposal` | Read one proposal: sections, blocks, pricing, acceptance and link |
| `proposal_activity` | Opens, reading time, comments, acceptances and follow-up drafts |
| `list_proposal_templates` | Starter and saved proposal templates |
| `create_proposal_from_template` | Create a ready-to-edit proposal from a template, no AI writing |
| `create_proposal_from_brief` | Write a proposal page and deck from a client brief |
| `billing_status` | Plan, project slots, live projects and next charge (owners only) |
 Files use `path`, `content`, and `encoding` (`utf-8` or `base64`). Limits: 20 MB total, 200 files per publish, 30 projects, 200 MB stored versions per account.

## Troubleshooting

- **Node/npx missing:** install Node.js 20+ and ensure the desktop client can find it.
- **Connection refused:** start Folioo or correct `FOLIO_API_URL`. This package does not host the Folioo application.
- **401:** recreate an expired/revoked token and update the client environment.
- **403:** set `FOLIO_ORIGIN` to the dashboard's configured origin.
- **409:** read the project again and use its latest version before updating.
- **413:** reduce the file count or total size.
- **No tools:** restart the MCP connection; verify the command and environment. Logs go to stderr; stdout is reserved for MCP.

This is a local stdio connector distributed through GitHub, not an npm registry release, hosted HTTP MCP endpoint, or MCP protocol v2 implementation. The Python connector remains an alternative in the main Folioo project.

## Planned hosted connection

A remote MCP endpoint is a future option. The remote transport, authentication and client setup have not been shipped or verified yet. Until a real endpoint is published, use the stdio connector above; set FOLIO_API_URL to the local or hosted Folioo app URL. A dashboard URL is not itself an MCP endpoint. Hosted setup instructions will be added after end-to-end verification.

The connector defaults to `https://folioo.tech`. Set `FOLIO_API_URL=http://localhost:3000` explicitly for local development. This is a local stdio connector, not a hosted MCP endpoint.
