# index.ts

The public API surface of `@clay/core`. Everything a consumer needs is re-exported from here. Internal modules (`parser`, `inference`, `generator`, `types`) are not expected to be imported directly by callers outside this package.

---

## Exports

### `generateMockData(sourceCode, options?)` — primary function

```ts
import { generateMockData } from "@clay/core";

const records = generateMockData(`
  interface User {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  }
`, { count: 10, seed: 42 });
```

Runs the full pipeline for the **first** type/interface found in the source:

```
sourceCode  →  parseFirstInterface()  →  generateFromFields()  →  records[]
```

Works with both `interface` and `type` alias declarations.

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `sourceCode` | `string` | Raw TypeScript source containing at least one interface or type alias |
| `options.count` | `number` (default: `10`) | Number of records to generate |
| `options.seed` | `number` (optional) | Deterministic seed — same seed + same schema = identical output |

**Returns:** `Record<string, unknown>[]`

**Throws:** if the source string contains no interface or type alias declaration.

---

### `generateMockDataByName(sourceCode, interfaceName, options?)` — target a specific type

```ts
import { generateMockDataByName } from "@clay/core";

const admins = generateMockDataByName(source, "AdminUser", { count: 5 });
```

Like `generateMockData` but generates records for the named interface/type instead of the first one. Use this when a source file contains multiple types and you want to control which one is generated.

**Throws:** if `interfaceName` is not found in the source.

---

### `listInterfaces(sourceCode)` — discover available types

```ts
import { listInterfaces } from "@clay/core";

const names = listInterfaces(`
  interface User { id: string }
  interface Post { title: string }
`);
// ["User", "Post"]
```

Returns the names of all `interface` and `type` declarations in the source, in declaration order. Useful for building selectors or validating names before calling `generateMockDataByName`.

---

### `parseTypeScript(sourceCode)` — full multi-type parsing

```ts
import { parseTypeScript } from "@clay/core";

const parsed = parseTypeScript(`
  interface User { id: string; name: string }
  interface Post { title: string; authorId: string }
`);
// parsed[0] → { name: "User", fields: [...] }
// parsed[1] → { name: "Post", fields: [...] }
```

Returns `ParsedInterface[]` — one entry per type/interface found, in declaration order. The server package uses this to create one API resource per interface.

---

### `parseFirstInterface(sourceCode)` — single type

Same as `parseTypeScript` but returns only the first result's `fields` array and throws if nothing is found. Used internally by `generateMockData`.

---

### `generateFromFields(fields, options?)` — low-level generation

```ts
import { parseFirstInterface, generateFromFields } from "@clay/core";

const fields = parseFirstInterface(source);
const records = generateFromFields(fields, { count: 5, seed: 99 });
```

Exposed for callers who want to parse once and generate multiple batches with different seeds:

```ts
const fields = parseFirstInterface(source);

const batch1 = generateFromFields(fields, { count: 10, seed: 1 });
const batch2 = generateFromFields(fields, { count: 10, seed: 2 });
```

---

### Type exports

```ts
import type { SchemaField, FieldType, GenerateOptions, ParsedInterface } from "@clay/core";
```

All shared types are re-exported so consumers don't need to reach into internal modules.

---

## Pipeline summary

```
                          @clay/core public API
                          ┌──────────────────────────────────────────┐
  TypeScript source  ──►  │  parseTypeScript / parseFirstInterface   │
  (interface or type)     │             ↓                            │
                          │    ParsedInterface[]                     │
                          │    { name, fields: SchemaField[] }       │
                          │             ↓                            │
                          │       generateFromFields                 │
                          │       (inference engine inside)          │
                          │             ↓                            │
                          │   Record<string, unknown>[]              │
                          └──────────────────────────────────────────┘
                                         │
                                CLI / Server / Web UI / your code
```
