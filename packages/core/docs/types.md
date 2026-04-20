# types.ts

Defines the shared data shapes that flow through the entire `@clay/core` pipeline. Every other file in this package imports from here — nothing external.

---

## `FieldType`

```ts
type FieldType = "string" | "number" | "boolean" | "date" | "object" | "array" | "unknown";
```

The normalized set of primitive categories the parser maps all TypeScript types onto. Complex TypeScript constructs (unions, references, literals) are reduced to one of these values before the generator ever sees them.

| Value | When it appears |
|---|---|
| `"string"` | `string`, unresolved type references, one side of a `string \| null` union |
| `"number"` | `number` |
| `"boolean"` | `boolean` |
| `"date"` | `Date` (the built-in class) |
| `"object"` | Inline type literals `{ city: string }` or a named interface used as a property type |
| `"array"` | `string[]`, `number[]`, `User[]` |
| `"unknown"` | Anything the parser cannot resolve — generator falls back to `null` |

---

## `SchemaField`

```ts
type SchemaField = {
  name: string;
  type: FieldType;
  optional: boolean;
  children?: SchemaField[];
};
```

The single unit of parsed information about one property. The parser produces a `SchemaField[]` per interface; the generator consumes it.

| Property | Purpose |
|---|---|
| `name` | The raw property name from the TypeScript source, e.g. `"createdAt"`, `"userId"` |
| `type` | Normalized `FieldType` |
| `optional` | `true` when the property has a `?` token; the generator may skip it ~30% of the time |
| `children` | Present for `"object"` (the object's properties) and `"array"` (a single-element array holding the element descriptor, always named `"$element"`) |

### Array children example

For `tags: string[]` the parser produces:
```ts
{
  name: "tags",
  type: "array",
  optional: false,
  children: [{ name: "$element", type: "string", optional: false }]
}
```

The `$element` sentinel name tells the generator this is an array element, not a real property. The inference engine ignores it and falls back to type-based generation.

---

## `GenerateOptions`

```ts
type GenerateOptions = {
  count?: number;
  seed?: number;
};
```

Options passed to `generateMockData` and `generateFromFields`.

| Property | Default | Purpose |
|---|---|---|
| `count` | `10` | How many records to produce |
| `seed` | `undefined` | Integer seed passed to `faker.seed()`. When set, the same seed + same schema always produces byte-identical output. Omit for a fresh random result each call. |
