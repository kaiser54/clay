# Clay

**Paste a TypeScript type or interface. Get realistic mock data and a live API — instantly.**

Clay turns your TypeScript type definitions into realistic JSON fixtures and a fully functional local REST API. No config files, no schemas to learn, no setup ceremony. Works with `interface`, `type` aliases, `extends` inheritance, literal unions, and cross-type references.

```ts
// types.ts
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  rating: number;
  createdAt: string;
}
```

```bash
clay generate types.ts --count 5
```

```json
[
  {
    "id": "3d3e79c8-431b-472e-8464-a99444522ff3",
    "name": "Refined Concrete Chair",
    "price": 215.99,
    "category": "Shoes",
    "rating": 3.6,
    "createdAt": "2022-10-01T08:22:09.376Z"
  }
]
```

Or start a live server your frontend can actually call:

```bash
clay serve types.ts --port 3000
# GET http://localhost:3000/api/products
# GET http://localhost:3000/api/products/:id
```

---

## Why Clay

Most mock data tools generate noise. Clay generates intent.

| Field | Generic faker | Clay |
|---|---|---|
| `email` | `abc123@xyz.com` | `taylor.hodkiewicz@hotmail.com` |
| `price` | `73821` | `215.99` |
| `createdAt` | `"2099-01-01"` | `"2022-10-01T08:22:09Z"` (past) |
| `updatedAt` | `"1970-01-01"` | `"2025-03-29T02:05:26Z"` (recent) |
| `rating` | `94729` | `3.6` (1–5 scale) |
| `discount` | `999` | `22.7` (0–80%) |
| `salary` | `47` | `76500` (rounded to $500) |
| `theme: 'light' \| 'dark'` | `"lorem"` | `"light"` or `"dark"` |

The field name is the signal. Clay reads it and infers the right kind of value — type-aware, range-aware, semantically grounded. Literal union types are always respected exactly.

---

## Getting started

### Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io) 9+

### Install from the repo

```bash
git clone <repo>
cd clay
pnpm install
pnpm --filter @clay/core build
pnpm --filter @clay/server build
```

### Run via tsx (development)

```bash
pnpm --filter @clay/cli exec tsx src/index.ts generate ./example.ts --count 10
pnpm --filter @clay/cli exec tsx src/index.ts serve ./example.ts --port 3000
```

---

## Commands

### `clay generate <file>`

Generate mock JSON from a TypeScript file and print it to the terminal.

```bash
clay generate ./types.ts
clay generate ./types.ts --count 50
clay generate ./types.ts --count 100 --seed 42
clay generate ./types.ts --out ./fixtures/users.json
```

| Option | Default | Description |
|---|---|---|
| `--count, -c` | `10` | Number of records |
| `--seed, -s` | (random) | Fixed seed for reproducible output |
| `--out, -o` | stdout | Write to a file instead of printing |

By default the first type/interface in the file is used. To generate data for a specific type, use the Web UI interface selector or `clay serve` to expose all types as API resources.

---

### `clay serve <file>`

Start a local mock REST API server. Every interface/type in the file becomes a resource.

```bash
clay serve ./types.ts
clay serve ./types.ts --port 4000 --count 20 --seed 42
```

| Option | Default | Description |
|---|---|---|
| `--port, -p` | `3000` | Port to listen on |
| `--count, -c` | `10` | Records per resource |
| `--seed, -s` | (random) | Fixed seed — restart the server with the same seed to get the same data |

After starting, open `http://localhost:3000` in a browser to see a dashboard of all live endpoints.

---

## Web UI

Clay ships a browser-based UI for interactive mock generation:

```bash
cd apps/web
pnpm dev
# open http://localhost:5173
```

- Paste any TypeScript `interface` or `type` definition
- When multiple types are present, pills appear to select which one to generate
- Configure record count, seed, and per-page pagination
- Copy the JSON output with one click
- `⌘ Enter` to generate from keyboard

---

## API endpoints

For a file with `User`, `Product`, and `Order` interfaces, the server exposes:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | HTML dashboard listing all endpoints |
| GET | `/api/users` | Paginated list of users |
| GET | `/api/users/:id` | Single user by UUID |
| GET | `/api/products` | Paginated list of products |
| GET | `/api/products/:id` | Single product by UUID |
| GET | `/api/orders` | Paginated list of orders |
| GET | `/api/orders/:id` | Single order by UUID |

### Pagination

```bash
GET /api/users?_page=2&_limit=5
```

Response:

```json
{
  "data": [ ...5 users ],
  "total": 20,
  "page": 2,
  "limit": 5,
  "pages": 4
}
```

---

## TypeScript support

Clay handles the full range of real-world TypeScript shapes.

### `interface` and `type` aliases

Both work identically:

```ts
interface User { id: string; name: string }

export type Profile = { avatar: string; bio: string }
```

### Optional fields

```ts
interface Post {
  id: string;
  title: string;
  subtitle?: string;   // present in ~70% of records, absent in ~30%
}
```

### Literal union types (enums)

Values are always chosen from the declared members — never invented:

```ts
type Settings = {
  theme: 'light' | 'dark';               // → "light" or "dark"
  tier: 'free' | 'premium' | 'enterprise'; // → one of the three
  priority: 1 | 2 | 3;                   // → 1, 2, or 3
}
```

Single literals are also locked:

```ts
interface AdminUser {
  role: 'admin';   // → always "admin"
}
```

### Interface inheritance (`extends`)

Derived interfaces include all fields from their base:

```ts
interface User {
  id: number;
  name: string;
  email: string;
}

interface AdminUser extends User {
  role: 'admin';         // locked literal
  permissions: string[];
}

interface RegularUser extends User {
  role: 'user';          // locked literal
  subscriptionTier: 'free' | 'premium' | 'enterprise';
}
```

`AdminUser` records will have `id`, `name`, `email`, `role`, and `permissions`. Multiple levels of inheritance are supported.

### Arrays

```ts
interface Post {
  tags: string[];      // → ["tag1", "tag2"] (1–5 items)
}
```

### Nested objects (inline)

```ts
interface User {
  address: {
    city: string;
    country: string;
    zipCode: string;
  };
}
```

### Cross-type references

```ts
export type Profile = { avatar: string; bio: string }

export type User = {
  id: number;
  name: string;
  profile: Profile;   // → generates a full Profile-shaped object
}
```

Forward references work — order of declaration doesn't matter.

### Union with null/undefined

```ts
interface User {
  bio: string | null;            // → generates a string
  nickname: string | undefined;  // → generates a string
}
```

### Date type

```ts
interface Event {
  scheduledAt: Date;   // → ISO date string
}
```

---

## Inference rules — what Clay understands

Clay uses a scored rule system. Field names are matched against patterns; the most specific match wins.

### Identity

| Field name(s) | Generated value |
|---|---|
| `id` | UUID |
| `userId`, `productId`, `*Id`, `*_id` | UUID |
| `email`, `*email*` | `"taylor@gmail.com"` |
| `name`, `fullName`, `displayName` | `"Taylor Hodkiewicz"` |
| `firstName` | `"Taylor"` |
| `lastName` | `"Hodkiewicz"` |
| `username`, `handle`, `login` | `"taylor_h"` |

### Money & finance

| Field name(s) | Generated value |
|---|---|
| `price`, `cost`, `amount`, `fee`, `total`, `subtotal`, `balance`, `charge` | Tiered dist., endings `.99`/`.00`/`.50`/`.95` |
| `*price`, `*cost`, `*amount`, `*fee` | Same distribution |
| `salary`, `wage`, `income`, `compensation` | Tiered, rounded to $500 |
| `currency`, `currencyCode` | `"USD"`, `"EUR"`, etc. |

### Percentages & ratings

| Field name(s) | Generated value |
|---|---|
| `tax`, `vat` | 0–30 |
| `discount` | 0–80 |
| `progress`, `completion`, `ratingPercent` | 0–100 |
| `*Percent`, `*Rate` | 0–100 |
| `rating`, `reviewScore`, `starRating` | 1.0–5.0 |
| `score`, `points`, `karma` | 0–100 |

### Dates

| Field name(s) | Generated value |
|---|---|
| `createdAt`, `registeredAt`, `joinedAt` | 2021–2023 (past) |
| `updatedAt`, `modifiedAt`, `lastSeen` | Jan–Apr 2025 (recent) |
| `deletedAt`, `archivedAt`, `expiredAt` | Mid 2024–early 2025 |
| `publishedAt`, `postedAt`, `releasedAt` | Late 2023–April 2025 |
| `dueAt`, `deadline`, `scheduledAt` | April 2025–end 2026 (future) |
| `date`, `timestamp`, `*Date`, `*At` | 2020–2025 (generic) |

### Media & links

| Field name(s) | Generated value |
|---|---|
| `image`, `avatar`, `photo`, `thumbnail`, `cover`, `banner` | Image URL |
| `*Image`, `*Url` | Image URL |
| `url`, `website`, `link`, `href` | Web URL |

### Location

| Field name(s) | Generated value |
|---|---|
| `city`, `town` | `"San Francisco"` |
| `country` | `"United States"` |
| `state`, `province`, `region` | `"California"` |
| `address`, `street` | `"123 Main St"` |
| `zipCode`, `postalCode`, `zip` | `"94105"` |
| `latitude`, `lat` | `-90` to `90` |
| `longitude`, `lng`, `lon` | `-180` to `180` |

### Content

| Field name(s) | Generated value |
|---|---|
| `description`, `bio`, `summary`, `body`, `content` | Paragraph |
| `title`, `headline`, `subject`, `caption` | Sentence |
| `slug`, `permalink` | `"my-post-title"` |

### Person & demographics

| Field name(s) | Generated value |
|---|---|
| `age` | 18–75 |
| `gender`, `sex` | `"male"`, `"female"`, `"non-binary"` |
| `phone`, `mobile`, `tel` | `"+1 555-123-4567"` |

### Business

| Field name(s) | Generated value |
|---|---|
| `company`, `organization`, `brand` | `"Acme Corp"` |
| `product`, `productName` | `"Refined Concrete Chair"` |
| `category`, `department` | `"Electronics"` |
| `sku`, `barcode`, `upc` | Code |
| `quantity`, `qty`, `stock` | 0–500 |

### Status & enums

> Note: inference rules are a fallback. If a field has an explicit literal union type (`role: 'admin' | 'user'`), the declared values are always used instead of the inference table below.

| Field name(s) | Generated value |
|---|---|
| `status` | `"active"`, `"inactive"`, `"pending"`, `"archived"` |
| `role`, `permission` | `"admin"`, `"user"`, `"moderator"`, `"guest"` |
| `priority`, `urgency` | `"low"`, `"medium"`, `"high"`, `"critical"` |
| `type`, `kind`, `tier` | `"basic"`, `"standard"`, `"premium"`, `"enterprise"` |
| `color`, `colour` | `"blue"`, `"red"`, etc. |
| `language`, `locale` | `"en"`, `"fr"`, `"de"`, etc. |

### Technical

| Field name(s) | Generated value |
|---|---|
| `ip`, `ipAddress` | `"192.168.1.42"` |
| `token`, `apiKey`, `secret` | 40-char alphanumeric |
| `version`, `semver` | `"1.4.2"` |

---

## Determinism

Pass `--seed` to get reproducible output. Useful for UI snapshots, CI fixtures, and demos:

```bash
# Always produces the same 10 users
clay generate types.ts --count 10 --seed 42

# API always returns the same data on every restart
clay serve types.ts --seed 42
```

---

## Monorepo structure

```
clay/
├── packages/
│   ├── core/          @clay/core — parser + inference + generator
│   │   ├── src/
│   │   │   ├── types.ts       shared type definitions
│   │   │   ├── parser.ts      TypeScript AST → ParsedInterface[]
│   │   │   ├── inference.ts   field name → realistic value
│   │   │   ├── generator.ts   SchemaField[] → object[]
│   │   │   └── index.ts       public API
│   │   └── docs/              one doc file per source file
│   │
│   ├── cli/           @clay/cli — generate and serve commands
│   │   ├── src/
│   │   │   └── index.ts       CLI entry point (Commander)
│   │   └── docs/
│   │
│   └── server/        @clay/server — Hono REST mock server
│       ├── src/
│       │   └── index.ts       startServer() + route handlers
│       └── docs/
│
├── apps/
│   └── web/           React 19 + Vite browser UI
│       ├── src/
│       │   ├── api/           fetch wrappers for /api/generate and /api/parse
│       │   ├── components/    AppChrome, EditorPanel, OutputPanel, InterfacePills, etc.
│       │   ├── hooks/         useMockGeneration, usePagination, useCopyFeedback, etc.
│       │   ├── lib/           json-highlight.ts
│       │   ├── types/         shared web types (clay.ts)
│       │   ├── constants/     editor-placeholder.ts
│       │   └── App.tsx        root component (composition only)
│       ├── api.ts             Hono API server (port 3001)
│       └── docs/              web app architecture docs
│
└── test-types/        TypeScript example files for manual testing
    ├── example.ts
    ├── example-product.ts
    ├── example-shop.ts
    └── example-employee.ts
```

---

## Development

### Run tests

```bash
pnpm test                        # all packages
pnpm --filter @clay/core test    # core only
```

### Build

```bash
pnpm build                       # all packages
pnpm --filter @clay/core build   # core only (required before running CLI/server)
```

### Web UI dev server

```bash
cd apps/web
pnpm dev   # starts Vite on :5173 + API server on :3001 concurrently
```

### Add an inference rule

Open `packages/core/src/inference.ts` and add to the `rules` array:

```ts
{ score: 100, test: /^(referralCode|promo_code)$/i, generate: (f) => f.string.alphanumeric(8).toUpperCase() },
```

Score 100 for exact name matches, 80 for suffix patterns, 60 for broad contains. Rules are sorted by score at module load.

Then add a test in `packages/core/src/tests/generator.test.ts`:

```ts
it("referralCode is 8 uppercase chars", () => {
  const result = generateMockData(`interface R { referralCode: string }`, { count: 5, seed: 1 });
  for (const item of result) {
    expect((item.referralCode as string)).toMatch(/^[A-Z0-9]{8}$/);
  }
});
```

---

## Package docs

Each package has a `docs/` folder:

- [`packages/core/docs/types.md`](packages/core/docs/types.md) — shared type definitions (`SchemaField`, `ParsedInterface`, `GenerateOptions`)
- [`packages/core/docs/parser.md`](packages/core/docs/parser.md) — TypeScript AST parser (two-pass strategy, literal unions, extends)
- [`packages/core/docs/inference.md`](packages/core/docs/inference.md) — semantic inference engine (rule system, distributions)
- [`packages/core/docs/generator.md`](packages/core/docs/generator.md) — record generator (enum handling, optional fields, arrays)
- [`packages/core/docs/index.md`](packages/core/docs/index.md) — public API surface
- [`packages/core/docs/tests.md`](packages/core/docs/tests.md) — test suite guide
- [`packages/cli/docs/index.md`](packages/cli/docs/index.md) — CLI commands reference
- [`packages/server/docs/index.md`](packages/server/docs/index.md) — mock server internals
- [`apps/web/docs/index.md`](apps/web/docs/index.md) — web UI architecture, hooks, API endpoints
