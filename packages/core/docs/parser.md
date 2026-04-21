# parser.ts

Converts a raw TypeScript source string into a `ParsedInterface[]` — one entry per type or interface found. This is the first stage of the pipeline. No disk I/O happens here; everything runs against an in-memory virtual file system.

**Dependency:** `ts-morph` (TypeScript AST wrapper)

---

## Public API

### `parseTypeScript(sourceCode: string): ParsedInterface[]`

Parses all `interface` declarations and `type` alias object literals in the source string. Returns one `ParsedInterface` per type found, in declaration order.

```ts
import { parseTypeScript } from "@clay/core";

const parsed = parseTypeScript(`
  interface User { id: string; name: string }
  export type Post = { title: string; body: string }
`);
// parsed[0] → { name: "User", fields: [...] }
// parsed[1] → { name: "Post", fields: [...] }
```

Returns an empty array if the source contains no interfaces or type aliases.

---

### `parseFirstInterface(sourceCode: string): SchemaField[]`

Convenience wrapper around `parseTypeScript`. Returns the first result's `fields` array. Throws if none exists.

```ts
import { parseFirstInterface } from "@clay/core";

const fields = parseFirstInterface(`
  interface Product { id: string; price: number }
`);
// [{ name: "id", type: "string", ... }, { name: "price", type: "number", ... }]
```

Used by `generateMockData` internally, and by the CLI `generate` command.

---

## Internal functions

### `literalValue(typeNode)`

Extracts the JavaScript value from a `LiteralType` AST node:
- `StringLiteral` → `string`
- `NumericLiteral` → `number`
- `TrueKeyword` / `FalseKeyword` → `boolean`
- Anything else → `undefined`

Used by `resolveTypeNode` to collect enum members from literal union types.

---

### `resolveTypeNode(typeNode, interfaceMap)`

Maps a single `TypeNode` from the AST to the `{ type, children, enum }` portion of a `SchemaField`. Handles every structural TypeScript type recursively:

| TypeScript construct | How it's resolved |
|---|---|
| `string` | `{ type: "string" }` |
| `number` | `{ type: "number" }` |
| `boolean` | `{ type: "boolean" }` |
| `Date` | `{ type: "date" }` |
| `'admin'` (single literal) | `{ type: "string", enum: ["admin"] }` — always generates that exact value |
| `'light' \| 'dark'` (all literals) | `{ type: "string", enum: ["light", "dark"] }` — picks one randomly |
| `1 \| 2 \| 3` (numeric literals) | `{ type: "number", enum: [1, 2, 3] }` |
| `string \| null` or `T \| undefined` | Strips null/undefined, resolves the remaining type |
| `string[]` or `User[]` | `{ type: "array", children: [{ name: "$element", ... }] }` |
| `{ city: string }` inline | `{ type: "object", children: [...] }` recursively |
| `AnotherInterface` (type reference) | `{ type: "object", children: interfaceMap.get("AnotherInterface") }` |
| Anything else | `{ type: "unknown" }` |

The `interfaceMap` parameter is pre-populated with all interface/type names found in the source (pass 1 of the two-pass approach). This lets type references resolve even when the referenced type is declared after the one being parsed.

---

### `resolveProperty(prop, interfaceMap)`

Extracts one `PropertySignature` from the AST into a complete `SchemaField`:
- Name via `prop.getName()`
- Optional flag via `prop.hasQuestionToken()`
- Type, children, and enum via `resolveTypeNode`

---

## Two-pass parsing strategy

The parser uses two passes to handle forward references and `extends` correctly.

**Pass 1** — iterate all top-level statements in source order. Register every `interface` declaration and every `type` alias whose body is an object literal (`{ ... }`) in `interfaceMap` with an empty `SchemaField[]`. Iterating statements preserves declaration order, which controls the order of results and UI selector pills.

**Pass 2** — iterate statements again in source order. For each `interface`:
1. Look up any `extends` base types and copy their already-populated fields in first
2. Push the interface's own resolved properties after

For each `type` alias, push its resolved properties.

All arrays are populated **in place** (via `push`, never by reassignment). This means array object references captured in pass 1 — used as `children` by type references — are automatically up to date after pass 2 completes. A type like `user: User` resolved in pass 1 gets a reference to the same array that pass 2 fills in.

```
Pass 1:  interfaceMap = { User: [], AdminUser: [], Post: [] }
                                  ↑           ↑         ↑
                              same array objects

Pass 2:  User → push [id, name, email]       ← User's array now populated
         AdminUser → copy User's fields, push [role, permissions]
         Post → push [title, body, author]   ← author.children = User's array (auto-updated)
```

---

## Supported TypeScript shapes

### `interface` and `export type` aliases

```ts
interface User { id: string }
export type Profile = { avatar: string }
```

### `extends` inheritance

Derived interfaces include all fields from their base, in order (base fields first):

```ts
interface User { id: number; name: string }

interface AdminUser extends User {
  role: 'admin';        // AdminUser gets id, name, role, permissions
  permissions: string[];
}
```

Multi-level inheritance is supported. The base interface must be declared before the derived one in the source.

### Literal unions

```ts
type Settings = {
  theme: 'light' | 'dark';           // enum: ["light", "dark"]
  tier: 'free' | 'premium';          // enum: ["free", "premium"]
  priority: 1 | 2 | 3;              // enum: [1, 2, 3]
  role: 'admin';                     // enum: ["admin"] — single literal
}
```

### Cross-type references (including forward references)

```ts
export type Profile = { bio: string }  // declared first

export type User = {
  id: number;
  profile: Profile;      // resolves to full Profile shape
}
```

Or in reverse order — the two-pass strategy handles both:

```ts
interface Order {
  items: LineItem[];     // LineItem declared below — still resolves correctly
}
interface LineItem { sku: string; qty: number }
```

---

## Performance note

`ts-morph` is initialized with `useInMemoryFileSystem: true` and `skipFileDependencyResolution: true`. This means:

- No temp files are written to disk
- No `node_modules` resolution occurs
- The project is discarded after parsing — no global state accumulates

Typical parse time for a file with 3–5 interfaces is under 100ms, dominated by the ts-morph startup cost on first call.
