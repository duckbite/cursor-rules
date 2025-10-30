## duckbite Cursor Rules CLI

Pull curated Cursor rules into any project with one command.

### Quickstart (pull all)

```bash
npx @duckbite/cursor-rules@latest pull --dest ./.cursor/rules
```

Defaults:

- command: `pull`
- `--dest ./.cursor/rules`
- `--branch main`
- `--repo duckbite/cursor-rules`

### Options

- `--dest <path>`: destination directory (default `.cursor/rules`)
- `--branch <name>`: Git branch to fetch (default `main`)
- `--repo <owner/repo>`: source repo (default `duckbite/cursor-rules`)
- `--dry-run`: preview without writing files
- `--no-overwrite`: skip existing files
- `--force`: overwrite existing files

Environment:

- `GITHUB_TOKEN` (optional) to avoid rate limits or access private repos.

### Interactive mode

```bash
npx @duckbite/cursor-rules@latest interactive --dest ./.cursor/rules
```

- Use the search prompt to filter the list.
- Select specific rules to pull using checkboxes.
- Supports the same flags as `pull`.
