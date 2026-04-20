# Product Requirements Document
## Clay — TypeScript Schema → Mock Data & API Generator

**Version:** 1.0  
**Status:** Active Development  
**Last Updated:** April 2026

---

## 1. Product Overview

### 1.1 Summary

Clay is a developer tool that converts TypeScript interfaces into **realistic mock data and fully functional local REST APIs — instantly**. A developer pastes or points at a `.ts` file and immediately receives generated JSON fixtures and live HTTP endpoints, with no configuration, no login, and no reading of docs required.

The core insight is that field names carry intent. `price: number` is not a random integer — it is a currency value with realistic range and formatting. `createdAt: string` is not a random date — it is a timestamp anchored in the past. Clay exploits this signal through a scored, rule-based semantic inference engine that makes generated data look real rather than generated.

### 1.2 One-line definition

> Clay turns TypeScript types into realistic, interactive mock APIs instantly — no backend required.

---

## 2. Problem Statement

Frontend and full-stack developers constantly need mock data when:

- Backend APIs are not yet built
- Designing and building UI components
- Testing edge cases and loading states
- Building demos, prototypes, and portfolio projects
- Writing integration tests that need fixture data

Current solutions are fragmented and frustrating:

| Tool | Problem |
|---|---|
| Manual JSON writing | Slow, tedious, doesn't scale, data looks fake |
| Faker.js directly | Raw API with no schema awareness, requires boilerplate |
| JSONPlaceholder | Fixed schemas, can't use your own types |
| MSW / Mirage | Powerful but requires significant setup and maintenance |
| Postman mock servers | Requires cloud account, config, manual schema definition |

**There is no seamless "paste TypeScript → instant API" experience.** Clay fills this gap.

---

## 3. Goals

### Primary Goals

- Convert TypeScript interfaces into structured mock data with zero configuration
- Generate realistic data through field-name semantic inference, not random noise
- Provide instant local API endpoints for any TypeScript schema
- Reduce mock setup time from hours to seconds

### Secondary Goals

- Support deterministic, repeatable data for demos and CI
- Handle complex TypeScript structures (nested objects, arrays, optionals, unions)
- Allow all interfaces in a file to become API resources simultaneously
- Be useful as a library, CLI tool, and hosted service

### Non-Goals (current)

- Full backend database simulation with persistence across restarts
- Authentication and authorization systems
- Complex business logic simulation
- Production data storage or SaaS-level reliability guarantees

---

## 4. Target Users

### Primary

- **Frontend engineers** building UI before the backend is ready
- **Full-stack developers** who need fixture data for integration testing
- **Product engineers** prototyping features quickly

### Secondary

- **QA engineers** generating edge-case test datasets
- **Technical designers** building interactive prototypes
- **Startup founders** building MVPs with placeholder backends

---

## 5. Features

### 5.1 Core Engine — `@clay/core`

#### TypeScript Parser

- [x] Parse TypeScript interfaces from a raw source string
- [x] Extract field names, types, and optional markers
- [x] Handle primitive types: `string`, `number`, `boolean`
- [x] Handle `Date` type reference → date generation
- [x] Handle array types: `string[]`, `number[]`, `User[]`
- [x] Handle inline object literals: `{ city: string; zip: string }`
- [x] Handle cross-interface references: `author: Author` → nested `Author` object
- [x] Handle union types with null/undefined: `string | null` → unwrap to `string`
- [x] Handle optional fields (`?` token)
- [x] Parse multiple interfaces from one source string
- [x] In-memory virtual file system (no disk I/O, no temp files)
- [ ] Generic types: `Paginated<T>`, `ApiResponse<T>`
- [ ] Conditional types: `T extends string ? A : B`
- [ ] Mapped types: `{ [K in keyof T]: string }`
- [ ] Type aliases (non-interface): `type User = { id: string }`
- [ ] `@mock` JSDoc tag to override inference on a per-field basis

#### Semantic Inference Engine

- [x] Scored rule system — most specific rule wins (100 = exact, 80 = suffix, 60 = contains)
- [x] Type guard support — rules optionally scoped to a specific `FieldType`
- [x] Rules sorted at module load for zero-overhead matching
- [x] Type-based fallbacks when no rule matches
- [x] **ID fields** — `id`, `*Id`, `*_id` → UUID
- [x] **Email fields** — `email`, `*email*` → realistic email address
- [x] **Name fields** — `name`, `fullName`, `firstName`, `lastName`, `displayName` → person names
- [x] **Username fields** — `username`, `handle`, `login` → internet username
- [x] **Money fields** — `price`, `cost`, `amount`, `fee`, `total`, `subtotal`, `balance`, `charge`, `*price`, `*cost` → weighted tier distribution with clustered endings (`.99` / `.00` / `.50` / `.95`)
- [x] **Salary fields** — `salary`, `wage`, `income`, `compensation` → tiered ($20k–$250k), rounded to $500
- [x] **Tax/VAT fields** — `tax`, `vat` → 0–30%
- [x] **Discount fields** — `discount` → 0–80%
- [x] **Percentage fields** — `progress`, `completion`, `ratingPercent`, `*Percent`, `*Rate` → 0–100%
- [x] **Rating fields** — `rating`, `reviewScore`, `starRating`, `*rating` → 1.0–5.0
- [x] **Score fields** — `score`, `points`, `karma`, `*score` → 0–100
- [x] **Date fields (context-aware)** — `createdAt` → past (2021–2023), `updatedAt` → recent (2025), `deletedAt` → last year, `publishedAt` → last 18 months, `dueAt`/`deadline` → future
- [x] **Media fields** — `image`, `avatar`, `photo`, `thumbnail`, `cover`, `banner`, `*Image`, `*Url` → image URL
- [x] **URL fields** — `url`, `website`, `link`, `href` → web URL
- [x] **Phone fields** — `phone`, `mobile`, `tel` → formatted phone number
- [x] **Location fields** — `city`, `country`, `state`, `address`, `zipCode`, `latitude`, `longitude`
- [x] **Content fields** — `description`, `bio`, `summary`, `body`, `title`, `headline`, `slug`
- [x] **Person fields** — `age` (18–75), `gender`
- [x] **Quantity fields** — `quantity`, `qty`, `stock`, `count`, `*count`
- [x] **Business fields** — `company`, `product`, `category`, `sku`, `currency`
- [x] **Status/enum fields** — `status`, `role`, `priority`, `type`, `color`, `language`
- [x] **Tech fields** — `ip`, `token`, `apiKey`, `version`
- [x] **Boolean weighted distribution** — 55% true / 45% false (not 50/50)
- [ ] Custom locale support (e.g. Nigerian phone numbers, naira prices)
- [ ] Configurable optional field skip probability (currently fixed at 30%)
- [ ] `@mock` JSDoc annotation to override inference: `/** @mock image.avatar */ url: string`

#### Distribution Engine

- [x] Price tier weighting: 15% low ($1–$20), 75% normal ($20–$500), 10% high ($500–$2000)
- [x] Price ending clustering: .99 (40%), .00 (30%), .50 (15%), .95 (15%)
- [x] Salary tier weighting: 15% entry, 60% mid, 25% senior
- [x] Salary rounded to nearest $500 for realism
- [x] Date range anchoring to fixed boundaries (prevents non-determinism from `Date.now()`)
- [x] Weighted boolean generation via `faker.helpers.weightedArrayElement`
- [ ] Configurable price ranges per currency (NGN, GBP, EUR vs USD)
- [ ] Configurable distribution weights via options object
- [ ] Outlier generation mode (intentional edge-case data for testing)

#### Generator

- [x] Generate N records from a `SchemaField[]`
- [x] Recursive nested object generation
- [x] Array generation with random length (1–5 items)
- [x] Optional field skipping (~30% probability)
- [x] Seeded generation via `faker.seed()` — same seed + same schema = byte-identical output
- [x] Configurable record count (default: 10)
- [ ] Configurable array length range (currently fixed 1–5)
- [ ] Relationship engine: `userId` in `Order` → actual `User.id` from the `User` collection
- [ ] Topological generation order (generate parent interfaces before children)
- [ ] Referential integrity (child foreign keys reference real parent IDs)

#### Public API

- [x] `generateMockData(sourceCode, options?)` — one-call convenience function
- [x] `parseTypeScript(sourceCode)` — returns `SchemaField[][]` for all interfaces
- [x] `parseFirstInterface(sourceCode)` — returns `SchemaField[]` for first interface
- [x] `generateFromFields(fields, options?)` — low-level generation from parsed schema
- [x] Full TypeScript type exports: `SchemaField`, `FieldType`, `GenerateOptions`
- [ ] `generateAllMockData(sourceCode, options?)` — generate for every interface, return a named map
- [ ] Stream/iterator API for large datasets (>10k records)

---

### 5.2 CLI — `@clay/cli`

#### `clay generate <file>`

- [x] Read TypeScript file from disk
- [x] `--count, -c` — number of records (default: 10)
- [x] `--seed, -s` — deterministic seed
- [x] `--out, -o` — write output to file instead of stdout
- [x] Formatted JSON output (`JSON.stringify(..., null, 2)`)
- [x] Human-readable error messages on missing file or parse failure
- [ ] `--all` flag — generate for every interface in the file (not just the first)
- [ ] `--format` flag — output format: `json` (default), `csv`, `ndjson`
- [ ] `--interface, -i` flag — select a specific named interface from the file
- [ ] `--pretty` / `--compact` — control JSON formatting

#### `clay serve <file>`

- [x] Start Hono HTTP server from a TypeScript file
- [x] `--port, -p` — port to listen on (default: 3000)
- [x] `--count, -c` — records per resource (default: 10)
- [x] `--seed, -s` — deterministic seed
- [x] Print all live endpoints to terminal on startup
- [x] Error handling for missing file and startup failures
- [ ] `--watch` flag — reload data when the TypeScript file changes
- [ ] `--cors` flag — add CORS headers for browser-side fetch
- [ ] `--delay <ms>` flag — simulate network latency per request
- [ ] `--log` flag — request logging to stdout

#### General CLI

- [x] Commander-based argument parsing
- [x] `clay --version`
- [x] `clay --help` and per-command help
- [ ] `clay list <file>` — list all interfaces found in a file without generating
- [ ] `clay init` — scaffold a `clay.config.ts` in the current directory
- [ ] Configuration file support (`clay.config.ts` / `clay.config.json`)
- [ ] Environment variable support (`CLAY_SEED`, `CLAY_PORT`, `CLAY_COUNT`)
- [ ] Interactive mode: prompt for missing options instead of failing

---

### 5.3 Mock Server — `@clay/server`

#### Routes

- [x] `GET /` — HTML dashboard listing all live endpoints with method badges
- [x] `GET /api/:resource` — paginated list endpoint
- [x] `GET /api/:resource/:id` — single record lookup by `id` field
- [ ] `POST /api/:resource` — create a new record (add to in-memory store)
- [ ] `PUT /api/:resource/:id` — replace a record in the in-memory store
- [ ] `PATCH /api/:resource/:id` — partial update of a record
- [ ] `DELETE /api/:resource/:id` — remove a record from the in-memory store

#### Pagination & Filtering

- [x] `?_page=N` — page number (1-indexed)
- [x] `?_limit=N` — records per page (default: count, max: 100)
- [x] Response envelope: `{ data, total, page, limit, pages }`
- [ ] `?_sort=field` — sort list by a field name
- [ ] `?_order=asc|desc` — sort direction
- [ ] `?field=value` — filter list by exact field match (e.g. `?status=active`)
- [ ] `?_search=query` — full-text search across string fields

#### Resource Naming

- [x] CamelCase → kebab-plural: `UserProfile` → `/api/user-profiles`
- [x] Two-regex algorithm handles runs of caps (`HTMLParser` → `/api/html-parsers`)
- [ ] Irregular plurals (`person` → `people`, `category` → `categories`)
- [ ] Configurable resource names via options

#### Data & State

- [x] In-memory store pre-generated at startup
- [x] Per-resource generation — each interface gets its own dataset
- [x] Seed propagated across all resources
- [x] ID field detection for single-item lookup
- [ ] Write operations reflected in the in-memory store (POST/PUT/DELETE)
- [ ] `GET /api/:resource/reset` — restore resource to its original generated state
- [ ] Seed reloadable without server restart

#### Server Infrastructure

- [x] Hono framework with `@hono/node-server` adapter
- [x] 404 JSON error responses for unknown resources and missing IDs
- [ ] CORS middleware (configurable origins)
- [ ] Request logging middleware
- [ ] Response time headers
- [ ] `GET /api` — meta endpoint listing all resources and their record counts

---

### 5.4 Web UI (Planned)

- [ ] Browser-based interface at `localhost:3000` or `clay.dev`
- [ ] Monaco Editor for TypeScript input with syntax highlighting
- [ ] Real-time JSON preview panel updating as you type
- [ ] "Generate" button with instant output
- [ ] Copy to clipboard button
- [ ] Download as JSON button
- [ ] Schema URL sharing (encode schema in URL for one-click demos)

---

### 5.5 Hosted SaaS — `clay.dev` (Planned)

- [ ] Public hosted instance at `clay.dev`
- [ ] Persistent project URLs: `clay.dev/p/<id>/users`
- [ ] No login required for anonymous sessions (temporary URLs)
- [ ] Optional account for persistent projects
- [ ] Schema saved as normalized JSON (re-generate on request, not stored data)
- [ ] Shared links for demos, interviews, and portfolio projects
- [ ] Usage dashboard (requests, schemas, endpoints)

---

### 5.6 Tooling & DX

#### Monorepo & Build

- [x] pnpm workspaces monorepo
- [x] Shared `tsconfig.base.json` (strict, ESNext, NodeNext module resolution)
- [x] Per-package TypeScript builds (`tsc`)
- [x] ESM-native packages (`"type": "module"`)
- [x] Declaration files and source maps in dist

#### Testing

- [x] Vitest test runner (ESM-native, fast, no config overhead)
- [x] 28 tests across parser and generator
- [x] Parser unit tests — all TypeScript constructs covered
- [x] Generator integration tests — structural + inference quality + distribution + determinism
- [ ] Server integration tests — route responses, pagination, 404 handling
- [ ] CLI end-to-end tests — command output, file writing, error exits
- [ ] Snapshot tests for full inference output of standard interfaces
- [ ] Performance benchmarks — generation time for 10 / 100 / 1000 records

#### Documentation

- [x] Root `README.md` with full usage guide, command reference, and inference rule table
- [x] `packages/core/docs/types.md` — shared type definitions
- [x] `packages/core/docs/parser.md` — TypeScript AST parser internals
- [x] `packages/core/docs/inference.md` — semantic inference engine deep-dive
- [x] `packages/core/docs/generator.md` — record generator internals
- [x] `packages/core/docs/index.md` — public API surface and pipeline diagram
- [x] `packages/core/docs/tests.md` — test suite guide and how to write new tests
- [x] `packages/cli/docs/index.md` — CLI commands, flags, and binary wiring
- [x] `packages/server/docs/index.md` — mock server routes, naming, and store design
- [ ] `CONTRIBUTING.md` — guide for adding inference rules and submitting PRs
- [ ] `CHANGELOG.md` — version history
- [ ] Hosted documentation site

---

## 6. Technical Architecture

### Pipeline

```
TypeScript source string
        │
        ▼
  ┌─────────────────────────────┐
  │  Parser (ts-morph)          │  in-memory VFS, two-pass for forward refs
  │  → SchemaField[]            │  handles primitives, arrays, objects, unions
  └─────────────────────────────┘
        │
        ▼
  ┌─────────────────────────────┐
  │  Inference Engine           │  scored rules, 91 patterns
  │  field name + type          │  distribution modeling
  │  → realistic value          │  context-aware date logic
  └─────────────────────────────┘
        │
        ▼
  ┌─────────────────────────────┐
  │  Generator                  │  recursion for objects/arrays
  │  → Record<string,unknown>[] │  seed-based determinism
  └─────────────────────────────┘
        │
     ┌──┴───────────────┐
     ▼                  ▼
  CLI                Server
  generate            serve
  (stdout/file)       (Hono HTTP)
```

### Package dependency graph

```
@clay/core   ←──  @clay/server  ←──  @clay/cli
                                          │
                  @clay/core    ◄─────────┘
```

### Tech stack

| Layer | Technology |
|---|---|
| Language | TypeScript 5.x (strict, ESNext) |
| Package manager | pnpm 9+ (workspaces) |
| TS parsing | ts-morph (TypeScript compiler API wrapper) |
| Data generation | @faker-js/faker v9 |
| HTTP server | Hono v4 + @hono/node-server |
| CLI argument parsing | Commander v12 |
| Test runner | Vitest v2 |
| Runtime | Node.js 18+ |

---

## 7. Data Model

### `SchemaField`

The internal representation of a single interface property, produced by the parser and consumed by the generator.

```ts
type SchemaField = {
  name: string;          // raw property name from TS source
  type: FieldType;       // normalized type category
  optional: boolean;     // true if field has ? token
  children?: SchemaField[]; // nested fields for objects; element descriptor for arrays
};

type FieldType =
  | "string" | "number" | "boolean" | "date"
  | "object" | "array" | "unknown";
```

### `GenerateOptions`

```ts
type GenerateOptions = {
  count?: number;   // default 10
  seed?: number;    // if set: faker.seed(seed) called before generation
};
```

### Server response envelope (list)

```ts
{
  data:  Record<string, unknown>[];
  total: number;   // total records in store
  page:  number;   // current page (1-indexed)
  limit: number;   // records returned
  pages: number;   // Math.ceil(total / limit)
}
```

---

## 8. Success Metrics

| Metric | Target |
|---|---|
| Time from `clay serve types.ts` to first API response | < 2 seconds |
| Generation time for 10 records (any interface) | < 500ms |
| Test suite pass rate | 100% |
| Inference accuracy (% of fields that "look right") | > 90% for common field names |
| Seed determinism | Byte-identical output for same seed + same schema, always |
| Cold-start CLI response time | < 1.5 seconds |

---

## 9. Phased Roadmap

### Phase 1 — Core Library ✅
Parse TypeScript, generate realistic data, seed support, 28 passing tests.

### Phase 2 — CLI + Local Server ✅
`clay generate` and `clay serve`, Hono server, pagination, HTML dashboard, multi-interface support.

### Phase 3 — Inference Depth ✅
Scored rule system, distribution modeling (price tiers, salary tiers, date context), 91 rules covering all common field patterns.

### Phase 4 — Write Operations & Filtering
POST/PUT/DELETE endpoints with in-memory mutation, `?field=value` filtering, `?_sort` and `?_order`, request logging, CORS.

### Phase 5 — Relationship Engine
Detect foreign key fields (`userId → User.id`), topological generation order, referential integrity across resources.

### Phase 6 — DX Completions
`--watch` mode, `--all` flag for generate, `@mock` JSDoc overrides, `clay list`, configuration file support, CORS flag.

### Phase 7 — Web UI
Browser-based editor (Monaco), real-time preview, copy/download, schema URL sharing.

### Phase 8 — Hosted SaaS
`clay.dev`, persistent project URLs, anonymous sessions, optional accounts, usage dashboard.

---

## 10. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Inference misses a common field name | High | Medium | Maintain rule table, community contributions via `CONTRIBUTING.md` |
| ts-morph parse performance too slow for large files | Medium | Medium | Benchmark regularly; consider caching project instances |
| SaaS hosting enables abuse (parsing malicious TS) | Medium | High | Sandbox ts-morph in a Worker or isolate; rate limit by IP |
| Scope creep into full database simulation | Medium | High | Keep server read-only until Phase 4; enforce YAGNI |
| Faker breaking changes on major version bump | Low | Low | Pin faker version; test against new versions before upgrading |
