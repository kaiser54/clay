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

A single-call convenience function that runs the full pipeline:

```
sourceCode  →  parseFirstInterface()  →  generateFromFields()  →  records[]
```

Internally it calls `parseFirstInterface` (parses only the first interface in the string) and then `generateFromFields`. If you need to generate data for multiple interfaces from the same source string, use `parseTypeScript` + `generateFromFields` directly.

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `sourceCode` | `string` | Raw TypeScript source containing at least one interface |
| `options.count` | `number` (default: `10`) | Number of records to generate |
| `options.seed` | `number` (optional) | Deterministic seed — same seed + same schema = identical output |

**Returns:** `Record<string, unknown>[]`

**Throws:** if the source string contains no interface declaration.

---

### `parseTypeScript(sourceCode)` — multi-interface parsing

```ts
import { parseTypeScript } from "@clay/core";

const allFields = parseTypeScript(`
  interface User { id: string; name: string }
  interface Post { title: string; authorId: string }
`);
// allFields[0] → User fields
// allFields[1] → Post fields
```

Use this when you need to process every interface in a file — for example, the server package uses it to create one API resource per interface.

---

### `parseFirstInterface(sourceCode)` — single interface

Same as `parseTypeScript` but returns only the first result and throws if nothing is found. Used internally by `generateMockData`.

---

### `generateFromFields(fields, options?)` — low-level generation

```ts
import { parseFirstInterface, generateFromFields } from "@clay/core";

const fields = parseFirstInterface(source);
const records = generateFromFields(fields, { count: 5, seed: 99 });
```

Exposed for callers who want to parse once and generate multiple batches:

```ts
const fields = parseFirstInterface(source);

const batch1 = generateFromFields(fields, { count: 10, seed: 1 });
const batch2 = generateFromFields(fields, { count: 10, seed: 2 });
// Different seeds → different data, same schema
```

---

### Type exports

```ts
import type { SchemaField, FieldType, GenerateOptions } from "@clay/core";
```

All shared types are re-exported so consumers don't need to reach into internal modules.

---

## Pipeline summary

```
                          @clay/core public API
                          ┌─────────────────────────────────────┐
  TypeScript source  ──►  │  parseTypeScript / parseFirstInterface  │
                          │           ↓                         │
                          │     SchemaField[]                   │
                          │           ↓                         │
                          │    generateFromFields               │
                          │    (inference engine inside)        │
                          │           ↓                         │
                          │  Record<string, unknown>[]          │
                          └─────────────────────────────────────┘
                                       │
                              CLI / Server / your code
```
