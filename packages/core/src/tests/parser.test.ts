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

  it("returns ParsedInterface[] with names", () => {
    const results = parseTypeScript(`
      interface User { id: string }
      interface Post { title: string }
    `);
    expect(results[0].name).toBe("User");
    expect(results[1].name).toBe("Post");
    expect(results[0].fields[0]).toMatchObject({ name: "id", type: "string" });
  });

  it("resolves forward-referenced child types", () => {
    // Order matters: User references Address which is declared AFTER User
    const results = parseTypeScript(`
      interface User {
        id: string;
        address: Address;
      }
      interface Address {
        city: string;
        zip: string;
      }
    `);
    const user = results.find((r) => r.name === "User")!;
    const addressField = user.fields.find((f) => f.name === "address")!;
    expect(addressField.type).toBe("object");
    expect(addressField.children).toHaveLength(2);
    expect(addressField.children![0]).toMatchObject({ name: "city", type: "string" });
  });

  it("resolves array of referenced type", () => {
    const results = parseTypeScript(`
      interface Order {
        items: LineItem[];
      }
      interface LineItem {
        sku: string;
        qty: number;
      }
    `);
    const order = results.find((r) => r.name === "Order")!;
    const itemsField = order.fields.find((f) => f.name === "items")!;
    expect(itemsField.type).toBe("array");
    const elementSchema = itemsField.children![0];
    expect(elementSchema.type).toBe("object");
    expect(elementSchema.children).toHaveLength(2);
  });
});

describe("type alias support", () => {
  it("parses exported type aliases with object literals", () => {
    const results = parseTypeScript(`
      export type Profile = {
        avatar: string;
        bio: string;
        location?: string;
      };
    `);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Profile");
    expect(results[0].fields).toHaveLength(3);
    expect(results[0].fields[2].optional).toBe(true);
  });

  it("parses string literal unions as string type", () => {
    const results = parseTypeScript(`
      export type Settings = {
        theme: 'light' | 'dark';
        notifications: boolean;
        language: string;
      };
    `);
    const themeField = results[0].fields.find((f) => f.name === "theme")!;
    expect(themeField.type).toBe("string");
  });

  it("resolves cross-references between type aliases", () => {
    const results = parseTypeScript(`
      export type Profile = {
        avatar: string;
        bio: string;
        location?: string;
      };
      export type Settings = {
        theme: 'light' | 'dark';
        notifications: boolean;
        language: string;
      };
      export type User = {
        id: number;
        name: string;
        email: string;
        profile: Profile;
        settings: Settings;
      };
    `);
    expect(results).toHaveLength(3);
    const user = results.find((r) => r.name === "User")!;
    const profileField = user.fields.find((f) => f.name === "profile")!;
    expect(profileField.type).toBe("object");
    expect(profileField.children).toHaveLength(3);
    const settingsField = user.fields.find((f) => f.name === "settings")!;
    expect(settingsField.type).toBe("object");
    expect(settingsField.children).toHaveLength(3);
  });

  it("handles a mix of interface and type declarations", () => {
    const results = parseTypeScript(`
      interface Address { city: string; zip: string }
      export type User = {
        id: number;
        address: Address;
      };
    `);
    const user = results.find((r) => r.name === "User")!;
    const addressField = user.fields.find((f) => f.name === "address")!;
    expect(addressField.type).toBe("object");
    expect(addressField.children).toHaveLength(2);
  });

  it("preserves source declaration order in results", () => {
    const results = parseTypeScript(`
      export type Profile = { avatar: string };
      export type Settings = { theme: string };
      export type User = { id: number };
    `);
    expect(results.map((r) => r.name)).toEqual(["Profile", "Settings", "User"]);
  });
});
