import { describe, it, expect } from "vitest";
import { parseFirstInterface, parseTypeScript } from "../parser.js";

describe("parseFirstInterface", () => {
  it("parses flat primitives", () => {
    const fields = parseFirstInterface(`
      interface User {
        id: string;
        age: number;
        active: boolean;
      }
    `);
    expect(fields).toEqual([
      { name: "id", type: "string", optional: false },
      { name: "age", type: "number", optional: false },
      { name: "active", type: "boolean", optional: false },
    ]);
  });

  it("marks optional fields", () => {
    const fields = parseFirstInterface(`
      interface Post {
        id: string;
        subtitle?: string;
      }
    `);
    expect(fields[0].optional).toBe(false);
    expect(fields[1].optional).toBe(true);
  });

  it("parses array fields", () => {
    const fields = parseFirstInterface(`
      interface Post {
        tags: string[];
      }
    `);
    expect(fields[0].type).toBe("array");
    expect(fields[0].children?.[0].type).toBe("string");
  });

  it("parses inline object fields", () => {
    const fields = parseFirstInterface(`
      interface User {
        address: { city: string; zip: string };
      }
    `);
    expect(fields[0].type).toBe("object");
    expect(fields[0].children).toHaveLength(2);
  });

  it("parses Date type references as date", () => {
    const fields = parseFirstInterface(`
      interface Event {
        createdAt: Date;
      }
    `);
    expect(fields[0].type).toBe("date");
  });

  it("handles union with null", () => {
    const fields = parseFirstInterface(`
      interface User {
        bio: string | null;
      }
    `);
    expect(fields[0].type).toBe("string");
  });

  it("parses multiple interfaces and returns all", () => {
    const results = parseTypeScript(`
      interface User { id: string }
      interface Post { title: string }
    `);
    expect(results).toHaveLength(2);
  });

  it("throws when no interface found", () => {
    expect(() => parseFirstInterface("const x = 1;")).toThrow("No interface found");
  });
});
