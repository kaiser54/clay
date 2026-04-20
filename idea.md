Below is a **complete Product Requirements Document (PRD)** for your idea, structured like a real product spec you’d see in a startup or internal engineering team.

---

# 📘 PRD: TypeMock — TypeScript Schema → Mock API Generator

## 1. Product Overview

### 1.1 Summary

TypeMock is a developer tool that converts TypeScript interfaces or schema definitions into **realistic mock data and fully functional mock APIs instantly**.

Developers can paste a schema and immediately get:

* Generated sample JSON data
* A hosted or local mock REST API
* Optional SDK/endpoint for frontend development

The goal is to eliminate manual mock data creation and accelerate frontend/backend integration workflows.

---

### 1.2 Problem Statement

Frontend and full-stack developers frequently need mock data when:

* Backend APIs are not ready
* Designing UI components
* Testing edge cases
* Building demos or prototypes

Current solutions are fragmented:

* Manual JSON writing (slow, error-prone)
* Generic fake data tools (not schema-aware)
* API mocking tools (require setup/config)
* Static mock servers (not dynamic or type-driven)

👉 There is no seamless “paste TypeScript → instant API” experience.

---

### 1.3 Goals

#### Primary Goals

* Convert TypeScript interfaces into structured mock data
* Generate realistic data using smart inference (not random noise)
* Provide instant API endpoints for generated data
* Reduce mock setup time to near zero

#### Secondary Goals

* Support relationships between entities
* Allow repeatable deterministic data (seeded generation)
* Enable export to JSON, API, or SDK
* Support sharing mock APIs via URL

---

### 1.4 Non-Goals (for MVP)

* Full backend database simulation
* Authentication systems
* Complex business logic simulation
* Production-grade data storage

---

## 2. Target Users

### 2.1 Primary Users

* Frontend engineers
* Full-stack developers
* Product engineers building prototypes
* QA engineers needing test data

### 2.2 Secondary Users

* Technical designers
* Startup founders building MVPs
* API consumers testing integrations

---

## 3. Core Use Cases

### 3.1 Instant Mock Generation

User pastes:

```ts
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}
```

System returns:

* Mock JSON array
* API endpoint `/users`

---

### 3.2 Frontend Development Without Backend

Frontend developer builds UI using:

```
GET https://typemock.dev/api/users
```

No backend required.

---

### 3.3 Testing UI states

Generate:

* empty states
* large datasets
* edge-case values

---

### 3.4 Demo environments

Shareable API for:

* interviews
* portfolio projects
* client demos

---

## 4. Product Scope

## 4.1 MVP Features

### 4.1.1 TypeScript Parser

* Accept interface/type input
* Extract:

  * field names
  * types
  * optional properties
  * arrays & nested objects

---

### 4.1.2 Smart Data Generator Engine

Maps types → realistic data:

| Type / Hint  | Output                                  |
| ------------ | --------------------------------------- |
| string       | name, text, slug, email (context-aware) |
| number       | price, age, quantity                    |
| boolean      | true/false                              |
| date         | ISO timestamps                          |
| id fields    | UUID or prefixed IDs                    |
| email        | realistic email                         |
| image/avatar | URL                                     |

Includes:

* field name inference (very important)
* fallback generator rules
* seed-based reproducibility

---

### 4.1.3 Mock API Generator

Automatically creates:

* `GET /resource`
* `GET /resource/:id`
* pagination support (basic)

Example:

```
/api/users
/api/users/:id
```

---

### 4.1.4 Data Scaling

User can specify:

* number of records (e.g. 10, 100, 1000)

---

### 4.1.5 Export Options

* JSON download
* Copy to clipboard
* API endpoint URL

---

### 4.1.6 Web UI (MVP interface)

* Code editor (paste TS)
* Preview panel
* “Generate” button
* Output JSON viewer

---

## 4.2 V1 Enhancements

### 4.2.1 Relationship Engine

Example:

```ts
interface User {
  id: string;
}

interface Order {
  userId: string;
}
```

System:

* links `userId → User.id`
* maintains referential integrity

---

### 4.2.2 Seed Control

* deterministic data generation
* reproducible demos

---

### 4.2.3 Pagination + Filtering

Mock API supports:

```
/users?page=1&limit=10
```

---

### 4.2.4 Multiple data sets per schema

* users
* posts
* comments

---

### 4.2.5 Schema versioning

Track changes to schema over time

---

## 4.3 V2 (Advanced / SaaS)

### 4.3.1 Hosted Mock APIs

Users get:

```
https://api.typemock.dev/project-id/users
```

---

### 4.3.2 VSCode Extension

* Right click TypeScript file
* “Generate Mock API”
* Inline preview

---

### 4.3.3 Team Sharing

* shared mock environments
* collaboration

---

### 4.3.4 Auth simulation

* headers
* roles
* protected routes

---

### 4.3.5 Webhooks / event simulation

* simulate backend events

---

## 5. System Architecture

### 5.1 High-Level Architecture

```
[ TypeScript Input ]
        ↓
[ AST Parser (ts-morph) ]
        ↓
[ Schema Normalizer ]
        ↓
[ Data Generation Engine ]
        ↓
[ API Layer / Mock Server ]
        ↓
[ UI / CLI / Extension ]
```

---

### 5.2 Core Modules

#### 1. Parser Layer

* converts TS → structured schema

#### 2. Inference Engine

* determines semantic meaning of fields

#### 3. Generator Engine

* produces fake data using rules + faker

#### 4. API Layer

* Express / Hono / Nitro server

---

## 6. Data Model

### Internal Schema format

```ts
type SchemaField = {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "object" | "array";
  format?: "email" | "uuid" | "image" | "name";
  children?: SchemaField[];
};
```

---

## 7. Key Differentiator (VERY IMPORTANT)

Most tools:

> "generate fake data"

TypeMock:

> "understands intent of your schema"

### Example:

```ts
price: number
```

→ not random number
→ but:

```
$10 - $500 realistic range
```

---

## 8. UX Flow

### Step 1

Paste TypeScript

### Step 2

Click "Generate"

### Step 3

See:

* JSON preview
* API endpoint
* copy button

### Step 4

(optional)

* share link
* export

---

## 9. Tech Stack Recommendation

### Frontend

* React / Next.js
* Monaco Editor (code input)

### Backend

* Node.js (Hono / Express)
* ts-morph (AST parsing)

### Data engine

* custom rules engine
* Faker.js integration

### Storage (later)

* Redis (cache)
* Postgres (saved schemas)

---

## 10. Success Metrics

* Time to first mock API: < 30 seconds
* Daily active developers
* API endpoint usage
* Schema reuse rate
* Extension installs (if built)

---

## 11. Risks

### 11.1 Commoditization risk

Faker already exists → must focus on **workflow + API generation**

### 11.2 Complexity creep

Relationship engine can explode scope → must delay to V1+

### 11.3 Poor inference quality

Bad mappings = low trust → must heavily tune rules

---

## 12. Future Vision

TypeMock becomes:

> “Backend simulator layer for frontend development”

Eventually:

* replaces most mock servers
* becomes dev standard tool like Postman or MSW
* integrates into CI pipelines

---

## 13. One-line Product Definition

> TypeMock turns TypeScript types into realistic, interactive mock APIs instantly—no backend required.






Below is a practical breakdown into **four concrete phases**, each with a clear deliverable, technical focus, and exit criteria. This roadmap prioritizes **local-first** delivery (CLI + local dev server) over a hosted SaaS early on, because that’s where the daily workflow value lives and it reduces infrastructure risk.

---

## Phase 0: The Inference Engine Core (The Foundation)

**Goal:** Prove the core differentiator works in isolation.  
**Deliverable:** A Node.js library that takes a TypeScript interface string and outputs a deterministic, realistic JSON array.

**Technical Focus:**
- **Parser:** Use `ts-morph` to parse TypeScript code in a virtual file system (no file I/O required for the library).
- **Field Name → Intent Mapping:** Create a **rule-based dictionary** (the “secret sauce”). This is the most critical piece. Start with a simple JSON mapping like:
  ```json
  {
    "patterns": {
      "id": { "type": "string", "generator": "uuid" },
      "email": { "type": "string", "generator": "email" },
      "price|amount|cost": { "type": "number", "generator": "commerce.price" },
      "createdAt|updatedAt": { "type": "string", "generator": "date.past" }
    }
  }
  ```
- **Data Generation:** Integrate `@faker-js/faker` with seeded randomness (using `faker.seed(value)`) for reproducibility.

**Exit Criteria:**
- A function `generateMockData(sourceCode: string, options: { count: number, seed?: number }): object[]` works reliably for 80% of common interface shapes (flat objects, primitives, arrays).
- Unit tests confirm that `email: string` generates an email and `price: number` generates a currency-looking number.

---

## Phase 1: MVP – Local CLI + Dev Server (The Daily Driver)

**Goal:** Let a developer run `npx typemock serve ./types.ts` and get an instant API.  
**Deliverable:** A CLI tool and a local web server (Express/Fastify) with a simple Web UI for preview.

### Feature Set (Aligned with PRD MVP)
1.  **CLI Command:** `typemock serve <file> --port 3000`
2.  **API Endpoints:**
    - `GET /api/users` (list)
    - `GET /api/users/:id` (single item, ID matching)
3.  **Web Preview (Optional but Recommended):** A lightweight React app embedded via `express.static` that shows:
    - The parsed schema tree.
    - A JSON output preview.
    - Links to the running endpoints.

### Technical Architecture (This Phase)
```
CLI Entry -> File Reader -> ts-morph Parser -> Inference Engine -> In-Memory Store -> Express Routes
```

### Implementation Strategy
- **In-Memory Store:** Generate the full dataset (up to a configurable max, e.g., 1000 items) **once** on server start and store it in a Map. This is simple and fast enough for local dev.
- **Routing:** Use Express path parameters to match `:id`. Since we control the generation, we know the `id` field name (usually "id") to query the Map.
- **No Database:** This keeps the tool zero-config and portable.

---

## Phase 2: V1 – Relationship Awareness & Refinements

**Goal:** Handle nested interfaces and basic foreign-key links to unlock e-commerce or social app demos.  
**Deliverable:** Enhanced parser and generator that understands `interface User { id: string }` and `interface Post { authorId: string }`.

### Feature Set (PRD V1)
1.  **Relationship Engine:**
    - **Detection:** If `FieldName` ends with `Id`/`ID` and `FieldType` is `string`/`number`, scan other schemas for a matching `id` field.
    - **Linking:** During generation, if `Post.authorId` is generated, ensure it picks a **real** `User.id` from the `User` collection.
2.  **Pagination Support:** Add `_page` and `_limit` query params to list endpoints.
3.  **Seed Control:** Allow `?seed=123` in the API to force deterministic output across sessions (useful for snapshot testing).

### Technical Changes
- **Generation Order:** The engine must now be **topological**. Generate `User` objects first, store their IDs, then generate `Post` objects pulling from that pool.
- **Performance:** With 10,000 records, in-memory Map is still fine. Ensure `faker` seed resets correctly per request.

---

## Phase 3: V2 – Collaborative SaaS & Distribution

**Goal:** Move from local tool to shared, persistent mock environments.  
**Deliverable:** A hosted web app (Next.js) with persistent project URLs.

### Feature Set (PRD V2)
1.  **Hosted Mock APIs:** `https://app.typemock.dev/p/abc123/users`
2.  **VSCode Extension:** Right-click a `.ts` file -> "Start Mock Server" (proxies to local CLI or hosted project).
3.  **Schema Versioning:** Save pastes as versions in a DB.

### Infrastructure Shift
- **Parser Location:** Move parsing logic to an **Edge Function** or a **Web Worker** in the browser to avoid running untrusted `ts-morph` on the backend server (security and memory risk).
- **Data Storage:** Store the **inferred schema definition** (JSON), not the generated data. Re-generate data on the fly based on the stored schema + seed. This is cheaper and stateless.
- **VSCode Extension:** This is a thin wrapper around the local CLI or a bridge to the web service.

---

## Risk Mitigation & Technical Debt Management

| Risk Area | Mitigation Strategy |
| :--- | :--- |
| **Complex TypeScript Syntax** | Use `ts-morph` to **emit** a simplified JSON structure rather than trying to handle every edge case of mapped/conditional types. For MVP, fail gracefully on advanced types and show a warning. |
| **Inference Accuracy** | Implement a **User Override System** early (Phase 1.5). Allow `@mock` JSDoc tags: `/** @mock image.avatar */ url: string;`. This prevents user frustration when the AI guesses wrong. |
| **Scope Creep (Database Simulation)** | Strictly enforce that **state is not persisted** between API calls unless it's a seeded, deterministic generation. We are a *generator*, not a *database simulator*. |

### Recommended Folder Structure (Phase 1)
```
packages/
  core/               # The inference engine library (Phase 0 output)
  cli/                # The CLI wrapper around core + Express server
  web-ui/             # React app bundled with the server
shared/
  types/              # Internal SchemaField definitions
```

This phased approach ensures you can ship a useful MVP (Phase 1) within a few weeks of focused work, while laying the technical foundation for the more ambitious features in the PRD without having to rewrite the core generation logic later.

This idea is solid — but success depends on execution depth, not just generation.
