## Cursor Cloud specific instructions

This is a **MetaMask State Log Explorer** — a client-side React SPA (no backend, no database, no external APIs). Users upload MetaMask state log files (.json or .txt) and the app parses them to display transactions, origins, approvals, accounts, and other state data.

### Tech stack

- **Runtime / Package manager:** Bun (lockfile: `bun.lock`)
- **Framework:** React 18 + Vite 6 + TypeScript
- **UI:** shadcn/ui (Radix primitives) + Tailwind CSS 3.4
- **Linter/Formatter:** Biome 1.9

### Key commands

| Task | Command |
|------|---------|
| Install deps | `bun install` |
| Dev server | `bun run dev` (serves on `0.0.0.0:5173`) |
| Lint + typecheck | `bun run lint` |
| Format | `bun run format` |
| Build | `bun run build` |

### Notes

- There are **no automated tests** configured (no test script in `package.json`).
- No `.env` files or secrets are needed — the app is entirely client-side.
- The `same-runtime` package provides the JSX runtime (`jsxImportSource` in `tsconfig.json`). If you see JSX-related build errors, ensure `bun install` completed successfully.
- Bun must be on `$PATH`. It is installed at `~/.bun/bin/bun`; the shell profile (`~/.bashrc`) adds it automatically. If Bun is missing in a fresh shell, run `export PATH="$HOME/.bun/bin:$PATH"`.
