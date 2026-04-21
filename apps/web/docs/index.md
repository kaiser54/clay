# apps/web

The browser-based UI for Clay. Lets you paste a TypeScript interface or type alias, pick which type to generate (when multiple are present), configure options, and copy the JSON output — all without touching the CLI.

**Stack:** React 19, Vite 8, CSS Modules, Hono (API server)

---

## Running locally

```bash
cd apps/web
pnpm dev
```

This starts two processes concurrently:

| Process | Port | Purpose |
|---|---|---|
| Vite dev server | `:5173` | React UI with HMR |
| Hono API server | `:3001` | `/api/generate` and `/api/parse` |

Vite proxies all `/api/*` requests to `:3001`, so the React app always calls `/api/...` without needing to know the API port.

---

## Architecture

### `App.tsx`

Root component (~70 lines). Owns top-level state (`source`, `count`, `seed`, `limit`, `page`) and composes all hooks and components. Does no fetching or rendering logic itself.

### `api/clay-client.ts`

Typed fetch wrappers over the two API endpoints. Components and hooks never call `fetch` directly.

```ts
fetchInterfaceNames(source: string): Promise<string[]>
fetchGeneratedRecords(params: GenerateParams): Promise<GeneratedRecord[]>
```

### `types/clay.ts`

Shared TypeScript types for the web layer:

```ts
type GeneratedRecord = Record<string, unknown>;

type ParseResponseBody  = { interfaces?: string[] };
type GenerateResponseBody = { data?: GeneratedRecord[]; error?: string };
```

---

## Hooks

### `useDebouncedInterfaceList(source)`

Debounces calls to `POST /api/parse` by 350 ms as the user types. Returns the list of interface/type names found in the source plus the currently selected one. Auto-selects the first name when the source changes and the previous selection no longer exists.

```ts
const { interfaces, selectedInterface, setSelectedInterface } = useDebouncedInterfaceList(source);
```

### `useMockGeneration({ source, count, seed, interfaceName, onSuccess })`

Calls `POST /api/generate` and manages `data`, `loading`, and `error` state. Uses a ref-based in-flight guard to prevent concurrent requests. Returns a stable `generate` callback.

```ts
const { data, error, loading, generate } = useMockGeneration({ ... });
```

### `usePagination(data, limit, page, setPage)`

Client-side pagination over the full `data` array. Returns `totalPages`, `paginated` (the current slice), and `outputJson` (the paginated slice serialized as formatted JSON). Resets `page` to 1 if the current page would become out of bounds after `limit` changes.

### `useCopyFeedback()`

Returns `{ copied, copy }`. `copy(text)` writes to the clipboard and sets `copied = true` for 1.5 s, enabling a "Copied!" flash on the button without additional state in the parent.

### `useGenerateShortcut(generate)`

Attaches a `keydown` listener for `Ctrl+Enter` / `⌘+Enter` and calls `generate`. Uses a ref to always hold the latest `generate` callback without re-registering the event listener.

---

## Components

| Component | File | Description |
|---|---|---|
| `AppChrome` | `components/app-chrome.tsx` | Full-page layout shell — header, editor panel, output panel |
| `AppHeader` | `components/app-header.tsx` | Top bar with logo and title |
| `EditorPanel` | `components/editor-panel.tsx` | Textarea for TypeScript input, controls (count, seed, limit), generate button, interface pills |
| `OutputPanel` | `components/output-panel.tsx` | JSON output with syntax highlighting, pagination controls, copy button |
| `InterfacePills` | `components/interface-pills.tsx` | Pill buttons for selecting which type to generate; hidden when only one type is present |
| `JsonHighlightedPre` | `components/json-highlighted-pre.tsx` | `<pre>` that applies CSS-class-based syntax highlighting via `lib/json-highlight.ts` |

---

## API server (`api.ts`)

A lightweight Hono server that wraps `@clay/core`. Runs on port 3001.

### `POST /api/parse`

Parses a TypeScript source string and returns the names of all interfaces and type aliases.

**Request body:**
```json
{ "source": "interface User { id: string }" }
```

**Response:**
```json
{ "interfaces": ["User"] }
```

Returns `{ "interfaces": [] }` on empty or unparseable input — never errors.

---

### `POST /api/generate`

Generates mock records from a TypeScript source string.

**Request body:**
```json
{
  "source": "interface User { id: string; email: string }",
  "count": 10,
  "seed": 42,
  "interfaceName": "User"
}
```

| Field | Required | Default | Description |
|---|---|---|---|
| `source` | yes | — | Raw TypeScript source |
| `count` | no | `10` | Number of records |
| `seed` | no | (random) | Deterministic seed |
| `interfaceName` | no | first type | Which interface to generate; omit to use the first one |

**Response (success):**
```json
{ "data": [ { "id": "...", "email": "..." }, ... ] }
```

**Response (error):**
```json
{ "error": "Interface \"Widget\" not found in source code" }
```

Returns HTTP 400 on any generation failure.

---

## Design system

Styles live in `src/index.css` (global CSS custom properties) and per-component CSS Modules files.

**Font stack:**
- Display: Instrument Serif
- Body: DM Sans
- Code / JSON: JetBrains Mono

**Color palette** (defined as CSS variables in `:root`):

| Variable | Usage |
|---|---|
| `--bg` | Page background |
| `--surface` / `--surface-2` | Panel backgrounds |
| `--border` / `--border-focus` | Borders and focus rings |
| `--text` / `--text-muted` | Primary and secondary text |
| `--accent` | Interactive elements, active states |
| `--error-*` | Error message background and border |
