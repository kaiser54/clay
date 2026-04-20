import type { Faker } from "@faker-js/faker";
import type { FieldType } from "./types.js";

// ---------------------------------------------------------------------------
// Rule shape
// Rules are ordered by `score` (specificity). Higher score wins.
// ---------------------------------------------------------------------------
type Rule = {
  /** tested against the raw field name */
  test: RegExp;
  /** higher = more specific; first highest-score match wins */
  score: number;
  /** optional: only apply when field type also matches */
  guard?: FieldType;
  generate: (f: Faker, name: string) => unknown;
};

// ---------------------------------------------------------------------------
// Distribution helpers
// ---------------------------------------------------------------------------

/** Pick a value from a weighted list — no AI, just math */
function pick<T>(faker: Faker, options: Array<{ value: T; weight: number }>): T {
  return faker.helpers.weightedArrayElement(options.map((o) => ({ ...o, weight: o.weight })));
}

/**
 * Realistic price: weighted tiers + clustered endings.
 * Distribution: 15% low (1–20) | 75% normal (20–500) | 10% high (500–2000)
 * Endings:       40% .99 | 30% .00 | 15% .50 | 15% .95
 */
function realisticPrice(faker: Faker): number {
  const tier = pick(faker, [
    { value: [1, 20] as [number, number], weight: 15 },
    { value: [20, 500] as [number, number], weight: 75 },
    { value: [500, 2000] as [number, number], weight: 10 },
  ]);
  const base = Math.floor(faker.number.float({ min: tier[0], max: tier[1] }));
  const cents = pick(faker, [
    { value: 0.99, weight: 40 },
    { value: 0.0, weight: 30 },
    { value: 0.5, weight: 15 },
    { value: 0.95, weight: 15 },
  ]);
  return base + cents;
}

/**
 * Realistic salary: clustered tiers for annual compensation
 * 60% mid (40k–120k) | 25% senior (120k–250k) | 15% entry (20k–40k)
 */
function realisticSalary(faker: Faker): number {
  const tier = pick(faker, [
    { value: [20_000, 40_000] as [number, number], weight: 15 },
    { value: [40_000, 120_000] as [number, number], weight: 60 },
    { value: [120_000, 250_000] as [number, number], weight: 25 },
  ]);
  // Round to nearest 500 for realism
  return Math.round(faker.number.int({ min: tier[0], max: tier[1] }) / 500) * 500;
}

/** Context-aware date generation keyed by field name semantics */
function realisticDate(faker: Faker, name: string): string {
  const n = name.toLowerCase();
  // Very recent: last ~90 days
  if (/updated|modified|last_/i.test(n)) {
    return faker.date.between({ from: "2025-01-01", to: "2025-04-20" }).toISOString();
  }
  // Creation time: 2–4 years ago
  if (/created|registered|joined|signup/i.test(n)) {
    return faker.date.between({ from: "2021-01-01", to: "2023-12-31" }).toISOString();
  }
  // Deletion / expiry: within the last year
  if (/deleted|archived|expired|deactivated/i.test(n)) {
    return faker.date.between({ from: "2024-06-01", to: "2025-03-01" }).toISOString();
  }
  // Published content: last 18 months
  if (/published|posted|released|launched/i.test(n)) {
    return faker.date.between({ from: "2023-10-01", to: "2025-04-01" }).toISOString();
  }
  // Scheduled / due / deadline: future
  if (/due|deadline|scheduled|expires|valid_until/i.test(n)) {
    return faker.date.between({ from: "2025-04-21", to: "2026-12-31" }).toISOString();
  }
  // Generic date: wide window
  return faker.date.between({ from: "2020-01-01", to: "2025-12-31" }).toISOString();
}

// ---------------------------------------------------------------------------
// Rule table — sorted descending by score (editor: keep it this way)
// ---------------------------------------------------------------------------
const rules: Rule[] = [
  // ── IDs ──────────────────────────────────────────────────────────────────
  { score: 100, test: /^id$/i,                   generate: (f) => f.string.uuid() },
  { score: 80,  test: /Id$|_id$/,                generate: (f) => f.string.uuid() },

  // ── Dates (before generic string rules) ──────────────────────────────────
  { score: 100, test: /^(createdAt|created_at)$/i, generate: (f, n) => realisticDate(f, n) },
  { score: 100, test: /^(updatedAt|updated_at)$/i, generate: (f, n) => realisticDate(f, n) },
  { score: 100, test: /^(deletedAt|deleted_at)$/i, generate: (f, n) => realisticDate(f, n) },
  { score: 100, test: /^(publishedAt|published_at)$/i, generate: (f, n) => realisticDate(f, n) },
  { score: 80,  test: /At$|_at$|Date$|_date$|Timestamp$|timestamp$/i, generate: (f, n) => realisticDate(f, n) },
  { score: 60,  test: /date|timestamp/i,          generate: (f, n) => realisticDate(f, n) },

  // ── Identity ─────────────────────────────────────────────────────────────
  { score: 100, test: /^email$/i,                 generate: (f) => f.internet.email() },
  { score: 80,  test: /email/i,                   generate: (f) => f.internet.email() },

  { score: 100, test: /^(firstName|first_name)$/i, generate: (f) => f.person.firstName() },
  { score: 100, test: /^(lastName|last_name)$/i,   generate: (f) => f.person.lastName() },
  { score: 100, test: /^(name|fullName|full_name|displayName|display_name)$/i, generate: (f) => f.person.fullName() },
  { score: 70,  test: /name$/i,                   generate: (f) => f.person.fullName() },

  { score: 100, test: /^(username|user_name|handle|login)$/i, generate: (f) => f.internet.username() },

  // ── Money (distribution-modeled) ─────────────────────────────────────────
  { score: 100, test: /^(price|cost|amount|fee|total|subtotal|balance|charge)$/i, generate: (f) => realisticPrice(f) },
  { score: 90,  test: /^(salary|wage|income|compensation|earnings)$/i,            generate: (f) => realisticSalary(f) },
  { score: 80,  test: /price$|cost$|amount$|fee$|total$/i,                        generate: (f) => realisticPrice(f) },
  { score: 60,  test: /price|cost|amount/i,                                       generate: (f) => realisticPrice(f) },

  // ── Percentages (most specific first) ────────────────────────────────────
  { score: 100, test: /^(tax|vat)$/i,
    generate: (f) => f.number.float({ min: 0, max: 30, fractionDigits: 2 }) },
  { score: 100, test: /^discount$/i,
    generate: (f) => f.number.float({ min: 0, max: 80, fractionDigits: 1 }) },
  { score: 90,  test: /^(progress|completion|ratingPercent|rating_percent)$/i,
    generate: (f) => f.number.float({ min: 0, max: 100, fractionDigits: 1 }) },
  { score: 80,  test: /Percent$|_percent$|Rate$|_rate$/i,
    guard: "number", generate: (f) => f.number.float({ min: 0, max: 100, fractionDigits: 1 }) },

  // ── Ratings ───────────────────────────────────────────────────────────────
  { score: 100, test: /^(rating|reviewScore|review_score|starRating|star_rating)$/i,
    generate: (f) => f.number.float({ min: 1, max: 5, fractionDigits: 1 }) },
  { score: 90,  test: /^(score|points|karma|reputation)$/i,
    generate: (f) => f.number.float({ min: 0, max: 100, fractionDigits: 1 }) },
  { score: 80,  test: /rating$/i,
    generate: (f) => f.number.float({ min: 1, max: 5, fractionDigits: 1 }) },
  { score: 80,  test: /score$/i,
    generate: (f) => f.number.float({ min: 0, max: 100, fractionDigits: 1 }) },

  // ── Media ─────────────────────────────────────────────────────────────────
  { score: 100, test: /^(image|avatar|photo|thumbnail|picture|cover|banner)$/i, generate: (f) => f.image.url() },
  { score: 80,  test: /Url$|_url$|Image$|_image$/i, generate: (f) => f.image.url() },
  { score: 100, test: /^(url|website|link|href|endpoint|source)$/i, generate: (f) => f.internet.url() },

  // ── Contact ───────────────────────────────────────────────────────────────
  { score: 100, test: /^(phone|mobile|tel|phoneNumber|phone_number|cell)$/i, generate: (f) => f.phone.number() },

  // ── Location ──────────────────────────────────────────────────────────────
  { score: 100, test: /^(city|town)$/i,           generate: (f) => f.location.city() },
  { score: 100, test: /^(country)$/i,              generate: (f) => f.location.country() },
  { score: 100, test: /^(state|province|region)$/i, generate: (f) => f.location.state() },
  { score: 100, test: /^(address|street|streetAddress|street_address)$/i, generate: (f) => f.location.streetAddress() },
  { score: 100, test: /^(zipCode|zip_code|postalCode|postal_code|zip)$/i, generate: (f) => f.location.zipCode() },
  { score: 100, test: /^(latitude|lat)$/i,         generate: (f) => f.location.latitude() },
  { score: 100, test: /^(longitude|lng|lon)$/i,    generate: (f) => f.location.longitude() },

  // ── Content ───────────────────────────────────────────────────────────────
  { score: 100, test: /^(description|bio|summary|body|content|about|overview)$/i, generate: (f) => f.lorem.paragraph() },
  { score: 100, test: /^(title|headline|subject|caption)$/i, generate: (f) => f.lorem.sentence() },
  { score: 100, test: /^(slug|permalink)$/i,        generate: (f) => f.helpers.slugify(f.lorem.words(2)) },

  // ── Person / Demographics ─────────────────────────────────────────────────
  { score: 100, test: /^(age)$/i,                  generate: (f) => f.number.int({ min: 18, max: 75 }) },
  { score: 100, test: /^(gender|sex)$/i,            generate: (f) => f.helpers.arrayElement(["male", "female", "non-binary", "prefer not to say"]) },

  // ── Quantity / Counts ─────────────────────────────────────────────────────
  { score: 100, test: /^(quantity|qty|count|stock|inventory|units)$/i, generate: (f) => f.number.int({ min: 0, max: 500 }) },
  { score: 80,  test: /count$|_count$|total$/i,    generate: (f) => f.number.int({ min: 1, max: 1000 }) },

  // ── Business ──────────────────────────────────────────────────────────────
  { score: 100, test: /^(company|organization|org|firm|brand)$/i, generate: (f) => f.company.name() },
  { score: 100, test: /^(product|productName|product_name)$/i,    generate: (f) => f.commerce.productName() },
  { score: 100, test: /^(category|department|section)$/i,         generate: (f) => f.commerce.department() },
  { score: 100, test: /^(sku|barcode|upc|isbn)$/i,                generate: (f) => f.commerce.isbn() },
  { score: 100, test: /^(currency|currencyCode|currency_code)$/i, generate: (f) => f.finance.currencyCode() },

  // ── Status / Enum-like fields ─────────────────────────────────────────────
  { score: 100, test: /^status$/i,                 generate: (f) => f.helpers.arrayElement(["active", "inactive", "pending", "archived"]) },
  { score: 100, test: /^(role|permission|access)$/i, generate: (f) => f.helpers.arrayElement(["admin", "user", "moderator", "guest"]) },
  { score: 100, test: /^(priority|urgency)$/i,     generate: (f) => f.helpers.arrayElement(["low", "medium", "high", "critical"]) },
  { score: 100, test: /^(type|kind|variant|tier)$/i, generate: (f) => f.helpers.arrayElement(["basic", "standard", "premium", "enterprise"]) },
  { score: 100, test: /^(color|colour)$/i,          generate: (f) => f.color.human() },
  { score: 100, test: /^(language|locale|lang)$/i,  generate: (f) => f.helpers.arrayElement(["en", "fr", "de", "es", "zh", "ar"]) },

  // ── Network / Tech ────────────────────────────────────────────────────────
  { score: 100, test: /^(ip|ipAddress|ip_address)$/i, generate: (f) => f.internet.ip() },
  { score: 100, test: /^(token|apiKey|api_key|secret)$/i, generate: (f) => f.string.alphanumeric(40) },
  { score: 100, test: /^(version|semver)$/i,        generate: (f) => f.system.semver() },
];

// Sort once at module load — highest score first
rules.sort((a, b) => b.score - a.score);

// ---------------------------------------------------------------------------
// Type-based fallbacks (when no rule matches)
// ---------------------------------------------------------------------------
const typeDefaults: Partial<Record<FieldType, (f: Faker) => unknown>> = {
  string:  (f) => f.lorem.word(),
  number:  (f) => f.number.int({ min: 1, max: 100 }),
  boolean: (f) => pick(f, [{ value: true, weight: 55 }, { value: false, weight: 45 }]),
  date:    (f) => realisticDate(f, "date"),
  unknown: () => null,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export function inferValue(fieldName: string, fieldType: FieldType, faker: Faker): unknown {
  for (const rule of rules) {
    if (rule.guard && rule.guard !== fieldType) continue;
    if (rule.test.test(fieldName)) return rule.generate(faker, fieldName);
  }
  return typeDefaults[fieldType]?.(faker) ?? null;
}
