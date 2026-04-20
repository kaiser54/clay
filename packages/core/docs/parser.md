# parser.ts

Converts a raw TypeScript source string into an array of `SchemaField[]` arrays — one per interface found. This is the first stage of the pipeline. No disk I/O happens here; everything runs against an in-memory virtual file system.

**Dependency:** `ts-morph` (TypeScript AST wrapper)

---

## Public API

### `parseTypeScript(sourceCode: string): SchemaField[][]`

Parses all interfaces in the source string. Returns one `SchemaField[]` per interface, in declaration order.

```ts
import { parseTypeScript } from "@clay/core";

const fields = parseTypeScript(`
  interface User { id: string; name: string }
  interface Post { title: string; body: string }
`);
// fields[0] → User fields
// fields[1] → Post fields
```

Returns an empty array if the source contains no interfaces.

---

### `parseFirstInterface(sourceCode: string): SchemaField[]`

Convenience wrapper around `parseTypeScript`. Takes only the first interface found. Throws if none exists.

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

### `resolveTypeNode(typeNode, interfaceMap)`

Maps a single `TypeNode` from the AST to the `{ type, children }` portion of a `SchemaField`. This is a recursive function that handles every structural TypeScript type:

| TypeScript construct | How it's resolved |
|---|---|
| `string` | `{ type: "string" }` |
| `number` | `{ type: "number" }` |
| `boolean` | `{ type: "boolean" }` |
| `Date` | `{ type: "date" }` |
| `string[]` or `User[]` | `{ type: "array", children: [{ name: "$element", ... }] }` |
| `{ city: string }` inline | `{ type: "object", children: [...] }` recursively |
| `AnotherInterface` | `{ type: "object", children: interfaceMap.get("AnotherInterface") }` |
| `string \| null` or `T \| undefined` | Strips null/undefined, resolves the remaining type |
| Anything else | `{ type: "unknown" }` |

The `interfaceMap` parameter is pre-populated with all interface names found in the source (pass 1 of the two-pass approach). This lets interface references resolve even when the referenced interface is declared after the one being parsed.

---

### `resolveProperty(prop, interfaceMap)`

Extracts one `PropertySignature` from the AST into a complete `SchemaField`:
- Reads the property name via `prop.getName()`
- Checks for `?` via `prop.hasQuestionToken()`
- Delegates type resolution to `resolveTypeNode`

---

## Two-pass parsing strategy

The parser uses two passes over the interface list to handle forward references:

**Pass 1** — register all interface names in `interfaceMap` with empty field arrays. This ensures that when pass 2 encounters a type reference like `author: User`, the name `"User"` already exists in the map.

**Pass 2** — parse each interface's properties and populate `interfaceMap` with the resolved fields.

Without this, an interface that references another declared below it would silently fall back to `type: "string"` instead of the full nested object.

---

## Performance note

`ts-morph` is initialized with `useInMemoryFileSystem: true` and `skipFileDependencyResolution: true`. This means:

- No temp files are written to disk
- No `node_modules` resolution occurs
- The project is discarded after parsing — no global state accumulates

Typical parse time for a file with 3–5 interfaces is under 100ms, dominated by the ts-morph startup cost on first call.
