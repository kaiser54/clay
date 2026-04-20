# inference.ts

The semantic heart of Clay. Given a field name and its primitive type, this file decides what kind of realistic value to generate. This is what separates the tool from a raw faker wrapper — field names carry intent, and this file understands that intent through a deterministic rule system.

---

## The core idea

Most mock data tools ask: *"what type is this?"*

Clay asks: *"what does this field name mean?"*

```
price: number   →  not faker.number.int()
                →  but 215.99, 557.95, 411.00
                   (tiered distribution, clustered endings)

createdAt: string  →  not a random date
                   →  always 2–4 years in the past (creation time)

updatedAt: string  →  always recent (within 2025)

tax: number        →  0–30% range
discount: number   →  0–80% range
rating: number     →  1–5 with one decimal
score: number      →  0–100 with one decimal
```

---

## Public API

### `inferValue(fieldName: string, fieldType: FieldType, faker: Faker): unknown`

The only export. Called once per field per record.

- Walks the rule list in score order (highest first)
- Skips rules whose `guard` type doesn't match `fieldType`
- Returns the first matching rule's generated value
- Falls back to `typeDefaults` if nothing matches

---

## Rule shape

```ts
type Rule = {
  test: RegExp;         // matched against the raw field name
  score: number;        // specificity — higher wins; rules sorted at module load
  guard?: FieldType;    // optional: only applies when the field's type equals this
  generate: (f: Faker, name: string) => unknown;
};
```

Rules are sorted once at module load (`rules.sort((a, b) => b.score - a.score)`), so the iteration order is always highest-score-first. The first match wins — no combining or averaging.

### Score levels

| Score | Meaning | Example |
|---|---|---|
| 100 | Exact name match | `/^email$/i`, `/^(tax\|vat)$/i` |
| 90 | Near-exact or strong semantic match | `/^(progress\|completion)$/i` |
| 80 | Suffix / contains for well-known patterns | `/email/i`, `/price$/i` |
| 70–60 | Broad contains match | `/price\|cost\|amount/i` |

This ordering ensures that a field named `basePrice` (matches at score 60 via the broad contains rule) doesn't accidentally override `email` (matches at score 100). More specific rules always win when both apply to the same field.

---

## Distribution helpers

### `pick(faker, options)`

Thin wrapper over `faker.helpers.weightedArrayElement`. Lets rules express weighted randomness:

```ts
pick(faker, [
  { value: "active", weight: 60 },
  { value: "inactive", weight: 25 },
  { value: "pending", weight: 15 },
])
```

---

### `realisticPrice(faker)`

Price generation with two layers of distribution:

**Tier selection (weighted):**
| Tier | Range | Weight |
|---|---|---|
| Low | $1–$20 | 15% |
| Normal | $20–$500 | 75% |
| High | $500–$2000 | 10% |

**Ending selection (weighted):**
| Ending | Weight |
|---|---|
| .99 | 40% |
| .00 | 30% |
| .50 | 15% |
| .95 | 15% |

Result: prices look like `215.99`, `411.00`, `557.95` — not `347.28` or `0.03`.

Applies to: `price`, `cost`, `amount`, `fee`, `total`, `subtotal`, `balance`, `charge`, and any field name that ends in `price`, `cost`, `amount`, or `fee`.

---

### `realisticSalary(faker)`

Annual salary with three tiers, rounded to the nearest $500:

| Tier | Range | Weight |
|---|---|---|
| Entry | $20k–$40k | 15% |
| Mid | $40k–$120k | 60% |
| Senior | $120k–$250k | 25% |

Result: `76500`, `98000`, `202500` — not `347281`.

---

### `realisticDate(faker, fieldName)`

Context-aware date generation. Uses the field name to choose an appropriate time window:

| Pattern in name | Window | Semantic |
|---|---|---|
| `updated`, `modified`, `last_` | 2025-01-01 → 2025-04-20 | Very recent |
| `created`, `registered`, `joined` | 2021-01-01 → 2023-12-31 | 2–4 years ago |
| `deleted`, `archived`, `expired` | 2024-06-01 → 2025-03-01 | Last ~year |
| `published`, `posted`, `released` | 2023-10-01 → 2025-04-01 | Last 18 months |
| `due`, `deadline`, `scheduled` | 2025-04-21 → 2026-12-31 | Future |
| anything else | 2020-01-01 → 2025-12-31 | Wide window |

All dates use `faker.date.between` with fixed string boundaries — this is intentional. Using `faker.date.past()` or `faker.date.recent()` would anchor to `Date.now()`, breaking determinism even with a seed.

---

## Rule categories (summary)

| Category | Fields covered |
|---|---|
| IDs | `id`, `*Id`, `*_id` → UUID |
| Dates | `createdAt`, `updatedAt`, `*At`, `*Date`, `*Timestamp` → context-aware ISO string |
| Email | `email`, `*email*` |
| Names | `name`, `fullName`, `firstName`, `lastName`, `*name` |
| Money | `price`, `cost`, `amount`, `fee`, `total`, `*price`, `*cost` → tiered distribution |
| Salary | `salary`, `wage`, `income`, `compensation` → tiered distribution |
| Percentages | `tax`, `vat` → 0–30%; `discount` → 0–80%; `progress`, `completion` → 0–100% |
| Ratings | `rating`, `reviewScore` → 1–5; `score`, `points` → 0–100 |
| Media | `image`, `avatar`, `photo`, `thumbnail`, `*Url`, `*Image` |
| Contact | `phone`, `mobile`, `tel` |
| Location | `city`, `country`, `state`, `address`, `zipCode`, `latitude`, `longitude` |
| Content | `description`, `bio`, `summary`, `body`, `title`, `headline`, `slug` |
| Person | `age` → 18–75; `gender` |
| Quantity | `quantity`, `qty`, `count`, `stock` → 0–500; `*count`, `*total` → 1–1000 |
| Business | `company`, `product`, `category`, `sku`, `currency` |
| Status/Enums | `status`, `role`, `priority`, `type`, `color`, `language` |
| Network | `ip`, `token`, `apiKey`, `version` |

---

## Type-based fallbacks

When no rule matches, the field type determines the fallback:

| Type | Fallback |
|---|---|
| `string` | `faker.lorem.word()` |
| `number` | `faker.number.int({ min: 1, max: 100 })` |
| `boolean` | Weighted: 55% true, 45% false |
| `date` | Generic date range via `realisticDate` |
| `unknown` | `null` |

---

## Adding new rules

To add support for a new field pattern, append to the `rules` array:

```ts
{ score: 100, test: /^(referralCode|promo_code)$/i, generate: (f) => f.string.alphanumeric(8).toUpperCase() },
```

Rules are re-sorted at module load, so score placement is automatic. Prefer score 100 for exact-name matches, 80 for suffix patterns, 60 for broad contains patterns.
