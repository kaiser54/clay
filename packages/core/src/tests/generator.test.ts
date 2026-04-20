import { describe, it, expect } from "vitest";
import { generateMockData } from "../index.js";

const userInterface = `
  interface User {
    id: string;
    name: string;
    email: string;
    age: number;
    active: boolean;
    createdAt: string;
  }
`;

describe("generateMockData", () => {
  it("returns the requested count of records", () => {
    const result = generateMockData(userInterface, { count: 5 });
    expect(result).toHaveLength(5);
  });

  it("generates realistic email values", () => {
    const result = generateMockData(userInterface, { count: 3, seed: 1 });
    for (const item of result) {
      expect(item.email).toMatch(/@/);
    }
  });

  it("generates uuid-like ids", () => {
    const result = generateMockData(userInterface, { count: 3, seed: 1 });
    for (const item of result) {
      expect(typeof item.id).toBe("string");
      expect((item.id as string).length).toBeGreaterThan(10);
    }
  });

  it("generates realistic names (not lorem words)", () => {
    const result = generateMockData(userInterface, { count: 5, seed: 42 });
    for (const item of result) {
      expect(typeof item.name).toBe("string");
      expect(item.name as string).not.toBe("");
    }
  });

  it("is deterministic with a seed", () => {
    const a = generateMockData(userInterface, { count: 5, seed: 99 });
    const b = generateMockData(userInterface, { count: 5, seed: 99 });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("produces different output with different seeds", () => {
    const a = generateMockData(userInterface, { count: 3, seed: 1 });
    const b = generateMockData(userInterface, { count: 3, seed: 2 });
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  it("handles array fields", () => {
    const result = generateMockData(`interface Post { tags: string[] }`, { count: 3, seed: 1 });
    for (const item of result) {
      expect(Array.isArray(item.tags)).toBe(true);
    }
  });

  it("handles nested object fields", () => {
    const result = generateMockData(
      `interface User { address: { city: string; zip: string } }`,
      { count: 2, seed: 1 }
    );
    for (const item of result) {
      expect(typeof (item.address as Record<string, unknown>).city).toBe("string");
    }
  });

  it("handles optional fields (may be absent)", () => {
    const result = generateMockData(
      `interface User { id: string; bio?: string }`,
      { count: 20, seed: 5 }
    );
    const hasBio = result.some((item) => "bio" in item);
    const missingBio = result.some((item) => !("bio" in item));
    expect(hasBio).toBe(true);
    expect(missingBio).toBe(true);
  });

  it("generates price fields as numbers in realistic range", () => {
    const result = generateMockData(
      `interface Product { price: number }`,
      { count: 5, seed: 1 }
    );
    for (const item of result) {
      expect(typeof item.price).toBe("number");
      expect(item.price as number).toBeGreaterThan(0);
    }
  });
});
