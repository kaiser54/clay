# tests/

The `src/tests/` directory holds two test files that verify the parser and generator independently. Tests run with [Vitest](https://vitest.dev) and execute against the TypeScript source directly — no build step required.

Run tests:

```bash
pnpm test          # from packages/core
pnpm --filter @clay/core test   # from repo root
```

---

## parser.test.ts

Unit tests for `parseFirstInterface` and `parseTypeScript`. Each test passes a TypeScript source string and asserts the exact `SchemaField[]` shape that comes out.

| Test | What it verifies |
|---|---|
| Flat primitives | `string`, `number`, `boolean` fields produce the correct `FieldType` |
| Optional fields | `?` token sets `optional: true` |
| Array fields | `string[]` produces `type: "array"` with a `$element` child |
| Inline objects | `{ city: string }` produces `type: "object"` with two children |
| `Date` type | `Date` maps to `type: "date"`, not `"object"` or `"string"` |
| Union with null | `string \| null` unwraps to `type: "string"` |
| Multiple interfaces | `parseTypeScript` returns one entry per interface |
| Error on no interface | `parseFirstInterface` throws when source has no interface |

---

## generator.test.ts

Integration-style tests that call `generateMockData` end-to-end (parser + inference + generator). These tests care about the *shape and quality* of output, not just that it runs.

### Structural tests

| Test | What it verifies |
|---|---|
| Record count | Output length equals `count` option |
| Array fields | `tags: string[]` → each record has an array |
| Nested objects | `address: { city: string }` → nested object with correct keys |
| Optional fields | Over 20 records, some have the field and some don't |

### Inference quality tests

| Test | What it verifies |
|---|---|
| Email | Contains `@` |
| ID | String, length > 10 (UUID-like) |
| Name | Non-empty string |
| `userId`, `orderId` | Match UUID pattern via suffix rule |
| Salary | ≥ $20,000 |

### Distribution engine tests

| Test | What it verifies |
|---|---|
| Price endings | Over 30 records with seed 7, all prices end in .00, .50, .95, or .99 |
| Price bounds | All prices between $1 and $2000 |
| `basePrice`, `discountPrice` | Suffix rule fires — money distribution applied |
| Discount | 0–80% range |
| Tax | 0–30% range |
| Rating | 1–5 range |
| Score | 0–100 range |

### Date context tests

| Test | What it verifies |
|---|---|
| `createdAt` | Year is before 2024 (always in the past) |
| `updatedAt` | Year is 2025 or later (always recent) |

### Determinism tests

| Test | What it verifies |
|---|---|
| Same seed | Two calls with the same seed produce byte-identical JSON |
| Different seeds | Two different seeds produce different JSON |

---

## Writing new tests

When adding a new inference rule or distribution helper, the pattern is:

```ts
it("myNewField is in expected range", () => {
  const result = generateMockData(`interface T { myNewField: number }`, { count: 20, seed: 1 });
  for (const item of result) {
    expect(item.myNewField as number).toBeGreaterThanOrEqual(0);
    expect(item.myNewField as number).toBeLessThanOrEqual(100);
  }
});
```

Use a fixed seed in tests to ensure CI results are stable. Use a count high enough (10–30 records) to exercise weighted distributions meaningfully.
