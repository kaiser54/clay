import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { parseTypeScript, generateFromFields } from "@clay/core";

export type ServerOptions = {
  sourceCode: string;
  port?: number;
  count?: number;
  seed?: number;
};

/** CamelCase → kebab-plural: UserProfile → user-profiles */
function toResourceName(name: string): string {
  return (
    name
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      .toLowerCase() + "s"
  );
}

function findIdField(record: Record<string, unknown>): string | number | undefined {
  const idKey = Object.keys(record).find((k) => k.toLowerCase() === "id");
  if (idKey) return record[idKey] as string | number;
  return undefined;
}

export function startServer(options: ServerOptions): void {
  const { sourceCode, port = 3000, count = 10, seed } = options;

  const allFields = parseTypeScript(sourceCode);
  if (allFields.length === 0) throw new Error("No interfaces found in source file");

  // Build resource stores: { users: [...], products: [...] }
  const stores = new Map<string, Record<string, unknown>[]>();
  const interfaceNames: string[] = [];

  // Re-extract names to align with parsed fields
  const nameMatch = [...sourceCode.matchAll(/interface\s+(\w+)/g)].map((m) => m[1]);

  for (let i = 0; i < allFields.length; i++) {
    const name = nameMatch[i] ?? `resource${i}`;
    const resource = toResourceName(name);
    const records = generateFromFields(allFields[i], { count, seed });
    stores.set(resource, records);
    interfaceNames.push(name);
  }

  const app = new Hono();

  // Landing page
  app.get("/", (c) => {
    const origin = `http://localhost:${port}`;
    const endpoints = [...stores.keys()].flatMap((r) => [
      `GET ${origin}/api/${r}`,
      `GET ${origin}/api/${r}/:id`,
    ]);
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Clay Mock Server</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0 }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #0f0f0f; color: #e5e5e5; padding: 2rem; }
  h1 { font-size: 1.4rem; font-weight: 600; margin-bottom: 0.25rem; color: #fff }
  .subtitle { font-size: 0.875rem; color: #666; margin-bottom: 2rem }
  .resource { margin-bottom: 1.5rem }
  .resource-name { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #666; margin-bottom: 0.5rem }
  .route { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0.8rem; background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 6px; margin-bottom: 0.4rem; font-family: monospace; font-size: 0.85rem }
  .method { background: #1a3a2a; color: #4ade80; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600 }
  a { color: #60a5fa; text-decoration: none }
  a:hover { text-decoration: underline }
</style>
</head>
<body>
<h1>Clay Mock Server</h1>
<p class="subtitle">Running on port ${port} &mdash; ${stores.size} resource${stores.size !== 1 ? "s" : ""}, ${count} records each</p>
${[...stores.keys()]
  .map(
    (r) => `<div class="resource">
  <div class="resource-name">${r}</div>
  <div class="route"><span class="method">GET</span><a href="/api/${r}">/api/${r}</a></div>
  <div class="route"><span class="method">GET</span><span>/api/${r}/:id</span></div>
</div>`
  )
  .join("\n")}
</body>
</html>`;
    return c.html(html);
  });

  // List endpoint: GET /api/:resource?_page=1&_limit=10
  app.get("/api/:resource", (c) => {
    const resource = c.req.param("resource");
    const records = stores.get(resource);
    if (!records) return c.json({ error: `Resource "${resource}" not found` }, 404);

    const page = Math.max(1, parseInt(c.req.query("_page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("_limit") ?? String(count), 10)));
    const start = (page - 1) * limit;
    const data = records.slice(start, start + limit);

    return c.json({
      data,
      total: records.length,
      page,
      limit,
      pages: Math.ceil(records.length / limit),
    });
  });

  // Single item: GET /api/:resource/:id
  app.get("/api/:resource/:id", (c) => {
    const resource = c.req.param("resource");
    const id = c.req.param("id");
    const records = stores.get(resource);
    if (!records) return c.json({ error: `Resource "${resource}" not found` }, 404);

    const record = records.find((r) => String(findIdField(r)) === id);
    if (!record) return c.json({ error: `Record "${id}" not found` }, 404);

    return c.json(record);
  });

  serve({ fetch: app.fetch, port }, () => {
    const origin = `http://localhost:${port}`;
    console.log(`\n  Clay Mock Server running at ${origin}\n`);
    [...stores.keys()].forEach((r) => {
      console.log(`  GET ${origin}/api/${r}`);
      console.log(`  GET ${origin}/api/${r}/:id`);
    });
    console.log();
  });
}
