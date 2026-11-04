# Folio MCP

Connect Codex and other MCP-compatible clients to your Folio workspace. Node.js 20+ is required; Python and a local source checkout are not required.

## 1. Get your credentials

Open your running Folio app → Settings → Connect your tools → Create integration token. The token expires after 30 days and can be revoked there. It permits reading your projects and publishing public content. Store it in your client's secret environment, not in prompts, source control, or shared configuration.

## 2. Install in Codex

Set `FOLIO_API_URL` to your running Folio app and `FOLIO_API_TOKEN` to your token in the environment inherited by the MCP host. For a local app, the URL is `http://localhost:3000`. A deployed Folio app should use HTTPS.

```sh
codex mcp add folio -- npx --yes github:HarshitKumar9030/folio-mcp#v0.1.0
codex mcp list
```

Codex configuration alternative:

```toml
[mcp_servers.folio]
command = "npx"
args = ["--yes", "github:HarshitKumar9030/folio-mcp#v0.1.0"]
env_vars = ["FOLIO_API_URL", "FOLIO_API_TOKEN", "FOLIO_ORIGIN"]
```

Use your client's environment/secret settings if it is launched from a desktop app rather than your shell. `FOLIO_ORIGIN` is optional when the API URL is the dashboard URL; otherwise set it to the dashboard origin configured by your server.

Official Codex setup reference: https://learn.chatgpt.com/docs/extend/mcp

## Other MCP clients

```json
{
  "mcpServers": {
    "folio": {
      "command": "npx",
      "args": ["--yes", "github:HarshitKumar9030/folio-mcp#v0.1.0"],
      "env": {
        "FOLIO_API_URL": "http://localhost:3000",
        "FOLIO_API_TOKEN": "REPLACE_IN_YOUR_PRIVATE_CLIENT_SETTINGS"
      }
    }
  }
}
```

## 3. Try a read-only request

Ask your client: “List my Folio projects and tell me which version is live.” Then try “Read the files of this project.” Publishing is explicit: “Publish these supplied files as a new Folio project.” Updates require the current `expected_version` and will reject stale versions.

Tools: `list_projects`, `list_deployments`, `read_project_files`, `publish_project`, `update_project`. Files use `path`, `content`, and `encoding` (`utf-8` or `base64`). Limits: 20 MB total, 200 files per publish, 30 projects, 200 MB stored versions per account.

## Troubleshooting

- **Node/npx missing:** install Node.js 20+ and ensure the desktop client can find it.
- **Connection refused:** start Folio or correct `FOLIO_API_URL`. This package does not host the Folio application.
- **401:** recreate an expired/revoked token and update the client environment.
- **403:** set `FOLIO_ORIGIN` to the dashboard's configured origin.
- **409:** read the project again and use its latest version before updating.
- **413:** reduce the file count or total size.
- **No tools:** restart the MCP connection; verify the command and environment. Logs go to stderr; stdout is reserved for MCP.

This is a local stdio connector distributed through GitHub, not an npm registry release, hosted HTTP MCP endpoint, or MCP protocol v2 implementation. The Python connector remains an alternative in the main Folio project.
