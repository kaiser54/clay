import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { generateMockData, parseTypeScript } from "@clay/core";

const app = new Hono();

app.use("*", cors());

app.post("/api/generate", async (c) => {
  let body: { source?: string; count?: number; seed?: number };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { source, count = 10, seed } = body;

  if (!source?.trim()) {
    return c.json({ error: "source is required" }, 400);
  }

  try {
    const data = generateMockData(source, { count, seed });
    return c.json({ data });
  } catch (err) {
    return c.json({ error: (err as Error).message }, 400);
  }
});

// Returns the list of interface names found in the source
app.post("/api/parse", async (c) => {
  let body: { source?: string };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { source } = body;
  if (!source?.trim()) return c.json({ interfaces: [] });

  try {
    const names = [...source.matchAll(/interface\s+(\w+)/g)].map((m) => m[1]);
    return c.json({ interfaces: names });
  } catch {
    return c.json({ interfaces: [] });
  }
});

serve({ fetch: app.fetch, port: 3001 }, () => {
  console.log("  Clay API  →  http://localhost:3001");
});
