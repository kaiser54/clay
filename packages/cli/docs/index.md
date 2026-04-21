# index.ts

The CLI entry point for `@clay/cli`. Wires together the Commander argument parser, file reading, and calls into `@clay/core` (for data generation) and `@clay/server` (for the dev server). This file is the only source file in the CLI package — it is thin by design.

The compiled output (`dist/index.js`) is the file referenced by the `bin.clay` field in `package.json`, making it runnable via `npx clay` or a global `clay` install.

---

## Commands

### `clay generate <file>`

Reads a TypeScript file, generates mock JSON, and either prints it to stdout or writes it to a file.

```bash
clay generate ./types.ts
clay generate ./types.ts --count 50
clay generate ./types.ts --count 100 --seed 42
clay generate ./types.ts --count 20 --out ./fixtures/users.json
```

**Options:**

| Flag | Default | Description |
|---|---|---|
| `--count, -c` | `10` | Number of records to generate |
| `--seed, -s` | (none) | Integer seed for deterministic output. Same seed + same file = same JSON every time. |
| `--out, -o` | (none) | Write output to this file path instead of printing to stdout |

**What it does internally:**
1. Resolves the file path relative to `process.cwd()`
2. Reads the file with `fs.readFileSync`
3. Calls `generateMockData(sourceCode, { count, seed })` from `@clay/core`
4. Serializes the result with `JSON.stringify(..., null, 2)` for readable output
5. Prints to stdout or writes to `--out` if provided

Works with both `interface` and `type` alias declarations. The first type/interface in the file is used by default. Use `clay serve` to get data for all types at once.

---

### `clay serve <file>`

Starts a local HTTP mock API server from a TypeScript file. All interfaces and type aliases in the file become API resources.

```bash
clay serve ./types.ts
clay serve ./types.ts --port 4000
clay serve ./types.ts --count 50 --seed 42
```

**Options:**

| Flag | Default | Description |
|---|---|---|
| `--port, -p` | `3000` | Port to listen on |
| `--count, -c` | `10` | Number of records per resource |
| `--seed, -s` | (none) | Seed for deterministic data across all resources |

**What it does internally:**
1. Resolves the file path and reads it with `fs.readFileSync`
2. Passes `sourceCode` + options to `startServer()` from `@clay/server`
3. The server starts and prints the available endpoints to the terminal
4. Process stays alive (the Hono server keeps the event loop running)

**All types in the file become resources.** A file with `User`, `AdminUser extends User`, and `type Product = { ... }` will expose:
```
GET http://localhost:3000/api/users
GET http://localhost:3000/api/users/:id
GET http://localhost:3000/api/admin-users
GET http://localhost:3000/api/admin-users/:id
GET http://localhost:3000/api/products
GET http://localhost:3000/api/products/:id
```

---

## Error handling

Both commands exit with code `1` and print an error message in two failure cases:

- **File not found** — `Error: could not read file "<path>"`
- **No type in file** — `Error: No interface found in source code`

---

## How the binary is wired up

`package.json` declares:

```json
{
  "bin": { "clay": "./dist/index.js" }
}
```

The compiled `dist/index.js` starts with `#!/usr/bin/env node`, which the OS uses to execute it directly. When you run `npx clay`, npm:
1. Installs the `@clay/cli` package temporarily
2. Looks up the `bin.clay` field
3. Executes `dist/index.js` via Node

During development, use `tsx src/index.ts` to run without building:

```bash
pnpm --filter @clay/cli exec tsx src/index.ts generate ../../../myfile.ts
```
