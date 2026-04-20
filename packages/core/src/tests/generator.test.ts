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

  it("generates realistic names", () => {
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
    expect(result.some((item) => "bio" in item)).toBe(true);
    expect(result.some((item) => !("bio" in item))).toBe(true);
  });

  // ── Distribution engine tests ──────────────────────────────────────────────

  it("price uses clustered distribution — endings are .00, .50, .95, or .99", () => {
    const result = generateMockData(`interface P { price: number }`, { count: 30, seed: 7 });
    for (const item of result) {
      const cents = Math.round(((item.price as number) % 1) * 100);
      expect([0, 50, 95, 99]).toContain(cents);
    }
  });

  it("price stays within realistic bounds (1–2000)", () => {
    const result = generateMockData(`interface P { price: number }`, { count: 50, seed: 3 });
    for (const item of result) {
      expect(item.price as number).toBeGreaterThanOrEqual(1);
      expect(item.price as number).toBeLessThanOrEqual(2000);
    }
  });

  it("suffix price fields (basePrice, discountPrice) also use money distribution", () => {
    const result = generateMockData(
      `interface P { basePrice: number; discountPrice: number }`,
      { count: 10, seed: 1 }
    );
    for (const item of result) {
      expect(item.basePrice as number).toBeGreaterThanOrEqual(1);
      expect(item.discountPrice as number).toBeGreaterThanOrEqual(1);
    }
  });

  // ── Percentage / discount ────────────────────────────────────────────────

  it("discount fields stay within 0–100", () => {
    const result = generateMockData(`interface P { discount: number }`, { count: 20, seed: 1 });
    for (const item of result) {
      expect(item.discount as number).toBeGreaterThanOrEqual(0);
      expect(item.discount as number).toBeLessThanOrEqual(100);
    }
  });

  it("tax fields stay within 0–30", () => {
    const result = generateMockData(`interface P { tax: number }`, { count: 20, seed: 1 });
    for (const item of result) {
      expect(item.tax as number).toBeGreaterThanOrEqual(0);
      expect(item.tax as number).toBeLessThanOrEqual(30);
    }
  });

  // ── Ratings ───────────────────────────────────────────────────────────────

  it("rating fields stay in 1–5 range", () => {
    const result = generateMockData(`interface R { rating: number }`, { count: 20, seed: 1 });
    for (const item of result) {
      expect(item.rating as number).toBeGreaterThanOrEqual(1);
      expect(item.rating as number).toBeLessThanOrEqual(5);
    }
  });

  it("score fields stay in 0–100 range", () => {
    const result = generateMockData(`interface R { score: number }`, { count: 20, seed: 1 });
    for (const item of result) {
      expect(item.score as number).toBeGreaterThanOrEqual(0);
      expect(item.score as number).toBeLessThanOrEqual(100);
    }
  });

  // ── Date context ─────────────────────────────────────────────────────────

  it("createdAt is in the past (before 2024)", () => {
    const result = generateMockData(`interface E { createdAt: string }`, { count: 20, seed: 1 });
    for (const item of result) {
      expect(new Date(item.createdAt as string).getFullYear()).toBeLessThan(2024);
    }
  });

  it("updatedAt is recent (2025 or later)", () => {
    const result = generateMockData(`interface E { updatedAt: string }`, { count: 10, seed: 1 });
    for (const item of result) {
      expect(new Date(item.updatedAt as string).getFullYear()).toBeGreaterThanOrEqual(2025);
    }
  });

  // ── Scoring — suffix ID fields ────────────────────────────────────────────

  it("userId, orderId etc. resolve to UUID via suffix rule", () => {
    const result = generateMockData(
      `interface Order { userId: string; orderId: string }`,
      { count: 3, seed: 1 }
    );
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    for (const item of result) {
      expect(item.userId as string).toMatch(uuidPattern);
      expect(item.orderId as string).toMatch(uuidPattern);
    }
  });

  it("salary generates realistic values (≥20000)", () => {
    const result = generateMockData(`interface E { salary: number }`, { count: 10, seed: 1 });
    for (const item of result) {
      expect(item.salary as number).toBeGreaterThanOrEqual(20_000);
    }
  });
});
