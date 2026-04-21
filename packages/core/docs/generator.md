# generator.ts

Turns a `SchemaField[]` (the parser's output) into an array of plain JavaScript objects. This is the third and final stage of the core pipeline. It delegates all value decisions to `inference.ts` — its own job is purely structural: how many records, handle enum fields, recurse into objects, expand arrays, respect optionals.

---

## Public API

### `generateFromFields(fields: SchemaField[], options?: GenerateOptions): Record<string, unknown>[]`

The main export. Takes a parsed field list and produces `count` records.

```ts
import { parseFirstInterface, generateFromFields } from "@clay/core";

const fields = parseFirstInterface(`
  interface User {
    id: string;
    name: string;
    email: string;
  }
`);

const records = generateFromFields(fields, { count: 5, seed: 42 });
// [
//   { id: "...", name: "...", email: "..." },
//   ...5 records
// ]
```

**Seeding:** If `options.seed` is provided, `faker.seed(seed)` is called once before any generation begins. This resets the faker internal state so that the same seed always produces the same sequence of values across the entire batch.

---

## Internal functions

### `generateObject(fields: SchemaField[]): Record<string, unknown>`

Produces one record from a field list. Iterates over every field:

1. **Optional skip** — if `field.optional === true`, there is a 30% chance the field is omitted from the output entirely. This simulates real-world data where nullable fields are sometimes absent.
2. **Delegates** — calls `generateField(field)` for each kept field.

---

### `generateField(field: SchemaField): unknown`

Handles the structural routing for a single field:

| Field shape | Action |
|---|---|
| `field.enum` is set | `faker.helpers.arrayElement(field.enum)` — picks one of the declared values |
| `type === "object"` with `children` | Recurses into `generateObject(field.children)` |
| `type === "array"` with `children` | Generates 1–5 elements by calling `generateField(children[0])` in a loop |
| Anything else | Delegates to `inferValue(field.name, field.type, faker)` |

The `enum` check runs first. This means literal union types (`'light' | 'dark'`, `1 | 2 | 3`) and single literals (`'admin'`) always produce values from the declared set, regardless of what the inference engine would otherwise pick for that field name.

Array length is randomized via `faker.number.int({ min: 1, max: 5 })` on each call, so different records in the same batch will have different-length arrays — this is intentional for realism.

---

## Data flow

```
generateFromFields(fields, options)
  │
  ├─ faker.seed(seed)           ← set once if seed provided
  │
  └─ Array.from({ length: count })
       └─ generateObject(fields)
            └─ for each field:
                 ├─ skip if optional & coin flip
                 └─ generateField(field)
                      ├─ if enum       → arrayElement(field.enum)  ← literal union values
                      ├─ if object     → generateObject(children)  ← recursive
                      ├─ if array      → generateField($element) × N
                      └─ otherwise     → inferValue(name, type, faker)
```

---

## Why faker is a module-level singleton

The file imports `faker` (the global singleton from `@faker-js/faker`) rather than instantiating a new `Faker` each call. This is important for seeding: `faker.seed()` resets the internal Mersenne Twister state of that singleton. If a new instance were created per call, the seed would have no effect across calls.

The tradeoff is that `generateFromFields` is not safe to call concurrently from multiple async contexts — the second call's `faker.seed()` would corrupt the first call's sequence. In practice, generation is synchronous and completes in milliseconds, so this is not a concern for CLI or server use.
