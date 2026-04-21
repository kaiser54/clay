# index.ts

The mock API server for Clay. Takes a TypeScript source string, parses every interface and type alias in it, generates an in-memory dataset for each, and starts a Hono HTTP server with REST endpoints for all resources. The server runs until the process is killed — it has no persistence layer, no database, and no state between requests.

**Dependencies:** `hono`, `@hono/node-server`, `@clay/core`

---

## Public API

### `startServer(options: ServerOptions): void`

Starts the server. Does not return (the Node.js HTTP server keeps the event loop alive).

```ts
import { startServer } from "@clay/server";
import { readFileSync } from "node:fs";

startServer({
  sourceCode: readFileSync("./types.ts", "utf-8"),
  port: 3000,
  count: 20,
  seed: 42,
});
```

**`ServerOptions`:**

| Property | Type | Default | Description |
|---|---|---|---|
| `sourceCode` | `string` | required | Raw TypeScript source — `interface` and `type` aliases both supported |
| `port` | `number` | `3000` | HTTP port to listen on |
| `count` | `number` | `10` | Number of records to generate per resource |
| `seed` | `number` | (none) | Deterministic seed. Same seed + same file = same API data every run. |

Throws if the source contains no interfaces or type aliases.

---

## Resource naming — `toResourceName()`

Each interface/type name is converted to a URL-safe, lowercase plural resource name:

```
User            →  users
Product         →  products
BlogPost        →  blog-posts
UserProfile     →  user-profiles
AdminUser       →  admin-users
```

The algorithm:
1. Insert `-` before a run of uppercase letters followed by a capitalized word (`HTMLParser` → `HTML-Parser`)
2. Insert `-` between a lowercase letter and an uppercase letter (`blogPost` → `blog-Post`)
3. Lowercase everything
4. Append `s`

This matches common REST API conventions so frontend code built against Clay can swap in a real API later with minimal renaming.

---

## In-memory data store

On startup, `startServer` calls `parseTypeScript` (returns `ParsedInterface[]`) and `generateFromFields` for each interface. All generated records are stored in a `Map<string, Record<string, unknown>[]>` keyed by resource name.

The dataset is created **once** and never mutated during the server's lifetime. Every request reads from this static snapshot. This means:

- No write operations — `POST`, `PUT`, `PATCH`, `DELETE` are not implemented
- The data is always consistent (no concurrency issues)
- Restarting the server with the same seed gives back the same data

### Multiple types in one file

A file with `interface User`, `interface AdminUser extends User`, and `type Product = { ... }` produces three independent resources: `users`, `admin-users`, and `products`. Each gets its own fully populated dataset.

---

## Routes

### `GET /`

Returns an HTML dashboard page listing all live endpoints. Useful for quickly discovering what's available after running `clay serve`.

The page shows:
- Server port and record count
- Each resource name as a section
- Clickable links to the list endpoints

---

### `GET /api/:resource`

Returns a paginated list of records for the named resource.

**Query parameters:**

| Parameter | Default | Description |
|---|---|---|
| `_page` | `1` | Page number (1-indexed) |
| `_limit` | `count` (from options) | Records per page, capped at 100 |

**Response shape:**

```json
{
  "data": [ ...records ],
  "total": 20,
  "page": 1,
  "limit": 10,
  "pages": 2
}
```

**Example:**
```
GET /api/users?_page=2&_limit=5
```

**404 response** if the resource name doesn't match any interface:
```json
{ "error": "Resource \"widgets\" not found" }
```

---

### `GET /api/:resource/:id`

Returns a single record matched by its `id` field.

The server uses `findIdField()` to locate the field whose lowercase name is `"id"`. The match compares `String(record.id)` against the URL parameter, so UUIDs work without special handling.

**Response:** the matching record object directly (no wrapper).

**404 response** if no record has that id:
```json
{ "error": "Record \"abc123\" not found" }
```

---

## Internal helpers

### `findIdField(record)`

Scans the record's keys for one whose lowercase form equals `"id"`. Returns the value if found, `undefined` otherwise. The `GET /:id` route uses this to match URL parameters against generated records.

---

## Terminal output on start

When the server is ready, it prints the full URLs of all endpoints:

```
  Clay Mock Server running at http://localhost:3000

  GET http://localhost:3000/api/users
  GET http://localhost:3000/api/users/:id
  GET http://localhost:3000/api/admin-users
  GET http://localhost:3000/api/admin-users/:id
  GET http://localhost:3000/api/products
  GET http://localhost:3000/api/products/:id
```

---

## Adding more HTTP methods (future)

The server is intentionally read-only for now. To add write support, the in-memory `Map` would need to become mutable and the routes would need to handle `POST`/`PUT`/`DELETE`. Hono makes this straightforward — each method is a separate `app.post(...)` call. The generated data can serve as the initial seed state that write operations modify in memory.
