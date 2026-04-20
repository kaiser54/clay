# 🗺️ TypeMock — Execution Plan

Companion to `idea.md`. This plan reorders the PRD roadmap around the five non-negotiable product priorities and turns each phase into concrete, buildable tasks.

---

## 0. Product North Star

> **"I didn't even feel like I did anything, and it worked."**

Every decision below is judged against that sentence. If a feature adds friction, we delay it. If it slows the feel below ~1.5s, we cut it.

### Priority Stack (in this order — do not reorder)

| # | Priority | What "good" looks like | What "bad" looks like |
|---|----------|------------------------|-----------------------|
| 1 | ⚡ **Speed** | Paste → result in 0.1–1.5s | Spinners, "generating…" states, cold starts |
| 2 | 🎯 **Realism** | `"john.doe@gmail.com"`, `"Amelia Carter"`, `$249.99` | `"abc123"`, `"test"`, `42` |
| 3 | 🧩 **Simplicity** | No login, no config, no docs. Paste and go. | Plugin system, config files, onboarding |
| 4 | 🔁 **Determinism** | `?seed=42` → same output, every time | Fresh random data per request |
| 5 | 🌐 **API** | Comes *last*. Build local-first. | Starting with hosted SaaS |

---

## 1. Re-sequenced Roadmap

The PRD puts the inference engine as "Phase 0 foundation" and CLI/API early. Your priority list says the opposite — prove the *pipeline* first, then make it smart, then make it repeatable, then ship it. We follow your ordering.

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
  TS      smart    deter-    CLI       API /
 parse +  infer-   ministic  (npx)     hosted
 basic    ence     seeds +
 mock +                arrays
 console
```

Each phase ends with something a developer can actually use. No dead phases.

---

## 2. Phase 1 — Parse + Generate + Print (the skeleton)

**Goal:** A single function call that turns a TypeScript interface string into a JSON array printed to the console, end-to-end, under 500ms for a typical flat interface.

### Scope (strict — anything else is Phase 2+)

- Accept a TypeScript interface as a string (not a file yet — keep it pure).
- Parse it with `ts-morph` into an internal `SchemaField[]`.
- Walk the schema and emit a *dumb* value per field based on type only:
  - `string` → lorem word
  - `number` → integer 0–1000
  - `boolean` → true/false
  - `Date` / ISO strings → `new Date().toISOString()`
  - arrays → repeat `count` times
  - nested objects → recurse
- Output an array of N records via `console.log(JSON.stringify(data, null, 2))`.

### Explicitly NOT in Phase 1

- No field-name inference (still Phase 2).
- No CLI, no server, no UI.
- No optional/union handling beyond "pick the first type".
- No relationships.

### Deliverable

A single package `packages/core` exporting:

```ts
generateMockData(sourceCode: string, options: { count: number }): unknown[]
```

### Exit criteria

- Works on 10 hand-picked interfaces (flat, nested, arrays, optional fields).
- `generateMockData(src, { count: 10 })` returns in <300ms locally.
- Unit tests pin the shape (not the values yet — those change in Phase 2).

### Risk this phase

The only real risk is `ts-morph` startup cost. It's heavy on first load. Mitigation: lazy-initialize the `Project` and reuse a single in-memory virtual FS across calls.

---

## 3. Phase 2 — Smart Inference (the product's soul)

**Goal:** Make the output *feel real*. Field names become semantic hints. This is where the product earns trust.

### The secret sauce: a field-name → generator rule table

Start with a JSON rule file, shipped with the library. No ML, no heuristics beyond regex + token matching. Examples:

| Field pattern | Inferred generator |
|---|---|
| `^id$`, `*Id$`, `uuid` | `faker.string.uuid()` |
| `email`, `emailAddress` | `faker.internet.email()` (lowercase, realistic names) |
| `firstName`, `fname` | `faker.person.firstName()` |
| `lastName`, `lname`, `surname` | `faker.person.lastName()` |
| `name`, `fullName` | `faker.person.fullName()` |
| `price`, `amount`, `cost`, `total` | `faker.commerce.price({ min: 5, max: 500 })` |
| `age` | int 18–80 |
| `phone`, `phoneNumber`, `mobile` | `faker.phone.number()` |
| `createdAt`, `updatedAt`, `deletedAt` | ISO past/recent timestamp |
| `avatar`, `image`, `photo`, `picture` | `https://i.pravatar.cc/150?u=<seed>` |
| `url`, `website`, `link` | `faker.internet.url()` |
| `address`, `street`, `city`, `country`, `zip`/`postal` | address parts |
| `title`, `headline` | `faker.lorem.sentence({ min: 3, max: 7 })` |
| `description`, `bio`, `content`, `body` | `faker.lorem.paragraph()` |
| `slug` | `faker.lorem.slug()` |
| `tag`, `category` | `faker.commerce.department()` |
| `lat`, `latitude` / `lng`, `longitude` | geo coords |
| `color`, `colour` | `faker.color.human()` |
| `isActive`, `is*`, `has*`, `enabled` | weighted boolean (70% true) |

### Matching rules (in order of priority)

1. **Exact match** on field name (case-insensitive).
2. **Suffix match** (`*Email`, `*Url`, `*Id`).
3. **Token match** (split camelCase, match any token against the dictionary).
4. **Type fallback** (the Phase 1 behavior).

### Escape hatch: JSDoc overrides

Ship this from the start so users never feel stuck when we guess wrong:

```ts
interface Product {
  /** @mock commerce.productName */
  title: string;
  /** @mock image.avatar */
  hero: string;
}
```

This single feature kills the "but what if the inference is wrong?" objection without adding config.

### Exit criteria

- Given the 10 reference interfaces from Phase 1, a human looking at the output says "yeah, that looks real" for at least 9 of 10.
- Rule table lives in a single JSON file so it's easy to grow by PR.
- `email: string` produces a believable name-based email, not `abc123@test.com`.
- Still <500ms end-to-end.

### Why this comes before determinism

Realism is the trust moment. A dev sees realistic data once and commits mentally. Determinism is a power-user feature — valuable, but invisible on first use.

---

## 4. Phase 3 — Determinism + Arrays

**Goal:** Same seed → same output. Arrays behave predictably.

### Features

- `options.seed?: number` threads through `faker.seed()` and any local RNG.
- Array cardinality rules:
  - Default: 1–5 items per array field.
  - `@mock count(10)` JSDoc to override.
- A global `count` param for top-level records stays from Phase 1.
- Referential seeds: if two fields have the same inferred generator + same seed, they produce the same value (useful for relational hints later).

### Why seeds matter

- Snapshot tests on the frontend stay stable.
- Demos are reproducible.
- Bug reports become shareable (`seed=1234` reproduces the exact payload).

### Exit criteria

- `generateMockData(src, { count: 5, seed: 42 })` called twice returns byte-identical JSON.
- Changing the seed changes the output.
- Array lengths are stable per seed.

---

## 5. Phase 4 — CLI (`npx typemock`)

**Goal:** The tool becomes usable from any project without installing anything.

### Commands

```
npx typemock <file.ts> [--count 10] [--seed 42] [--out data.json]
```

- Default behavior: print to stdout (pipe-friendly).
- `--out` writes to disk.
- `--watch` re-runs on file change (later — only if trivial).

### Why console output is enough at this stage

Devs already have `jq`, `curl`, `pbcopy`. We stay out of their way:

```bash
npx typemock types.ts --count 100 | jq '.[0]'
npx typemock types.ts | pbcopy
```

This is the "zero friction" moment — no server, no URL, no account.

### Exit criteria

- `npx typemock types.ts` works on a fresh machine with only Node installed.
- First-run time (including npx fetch) under 5 seconds; subsequent <1s.
- Help text fits on one screen.

---

## 6. Phase 5 — Local Dev Server + (later) Hosted API

**Goal:** The schema becomes a live REST endpoint.

### 5a — Local server (still zero-config)

```
npx typemock serve types.ts --port 3000
```

- `GET /api/<resource>` (pluralized from interface name).
- `GET /api/<resource>/:id` — ID matching against the in-memory store.
- `?_page=1&_limit=20` pagination.
- `?seed=42` for deterministic requests.
- In-memory store only. Generate once at boot. No DB.

### 5b — Hosted SaaS (only after local is loved)

- `https://api.typemock.dev/p/<project-id>/<resource>`.
- Store the **schema + seed**, not the generated data — regenerate on demand. Stateless, cheap, infinitely scalable.
- Parsing runs in an edge worker or browser Web Worker to keep `ts-morph` out of the trusted backend.
- URL is the only sharing primitive. No accounts at first.

### Explicitly delayed forever-or-until-requested

- Authentication simulation.
- Webhooks.
- Team collaboration.
- Schema versioning UI.

These are in the PRD but they're all Phase 6+ material. The brutal truth: users will churn before they care about any of it.

---

## 7. Architecture — one package, clean seams

```
packages/
  core/           # Phase 1–3: parse + infer + generate. Zero runtime deps beyond ts-morph + faker.
  cli/            # Phase 4: thin wrapper around core.
  server/         # Phase 5a: express/hono server using core.
  web/            # Phase 5b: hosted UI (Next.js) — last.
shared/
  rules.json      # The inference dictionary. Grows by PR.
  types.ts        # SchemaField, GeneratorOptions.
```

### Why this shape

- Core is a library with no I/O. Keeps it testable and fast.
- CLI and server are 50–100 line wrappers. Anything larger means core is leaking.
- The rules file is data, not code — contributors can improve realism without touching generator logic.

---

## 8. Performance Budget (hard numbers)

| Operation | Budget |
|---|---|
| Parse + generate, 1 flat interface, 10 records | <300ms |
| Parse + generate, 1 nested interface, 100 records | <800ms |
| Parse + generate, 1000 records | <1500ms |
| CLI cold start (after npx cache warm) | <1000ms |
| Local server response (pre-generated) | <20ms |

If any operation misses budget, we stop adding features until it's back in range. Speed is priority #1 for a reason — devs don't wait.

### Known speed wins to lean on

- Reuse a single `ts-morph` `Project` across calls (huge).
- Pre-compile the rule table into a single regex alternation + lookup map.
- Generate data in a tight loop — avoid async in the hot path.

---

## 9. What We Are Deliberately NOT Building (the "no" list)

Keeping this list in writing so scope creep is easy to reject:

- ❌ Authentication / user accounts (until late Phase 5b).
- ❌ A plugin system. Ever? Probably. At least not before Phase 5b.
- ❌ A config file. JSDoc `@mock` tags replace it.
- ❌ A GUI schema editor. Paste TypeScript; that's the UI.
- ❌ Database simulation / write endpoints. We generate, we don't persist.
- ❌ Complex TypeScript features (conditional types, mapped types, generics beyond simple substitution) — fail gracefully with a readable warning.
- ❌ "Custom rules" UI. Ship the rules file; accept PRs.

---

## 10. Success Signals Per Phase

| Phase | Signal that says "ship the next phase" |
|---|---|
| 1 | 10 reference interfaces parse and generate correctly. |
| 2 | A developer looking at output says "that looks real" without prompting. |
| 3 | Two runs with the same seed are byte-identical. |
| 4 | `npx typemock types.ts` works on 3 different machines first try. |
| 5a | A user uses the local server in a real side project for a day. |
| 5b | Users share typemock URLs with teammates unprompted. |

---

## 11. Next Immediate Actions (this week)

1. Scaffold `packages/core` with `ts-morph` + `@faker-js/faker`.
2. Implement the parser → `SchemaField[]` transform for flat + nested + array interfaces.
3. Write the Phase 1 dumb generator that only looks at `type`.
4. Build a `tests/fixtures/` folder with 10 reference interfaces and snapshot tests.
5. Measure: make sure a 10-record generation is under 300ms on your laptop.
6. Only then start Phase 2 (the rule table).

If step 5 fails, fix it before writing any inference rules. Speed is load-bearing.

---

## 12. The Brutal Truth, restated

- Slow → no one waits.
- Dumb data → no one trusts.
- Complex → no one uses.

Build in the order: **pipeline → realism → repeatability → reach → scale**. Not the other way around.
