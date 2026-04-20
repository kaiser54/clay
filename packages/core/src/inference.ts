import type { Faker } from "@faker-js/faker";
import type { FieldType } from "./types.js";

type Rule = { pattern: RegExp; generator: (f: Faker) => unknown };

const rules: Rule[] = [
  { pattern: /^id$|_id$|Id$/, generator: (f) => f.string.uuid() },
  { pattern: /email/i, generator: (f) => f.internet.email() },
  { pattern: /^(firstName|first_name)$/i, generator: (f) => f.person.firstName() },
  { pattern: /^(lastName|last_name)$/i, generator: (f) => f.person.lastName() },
  { pattern: /^(name|fullName|full_name|displayName|display_name)$/i, generator: (f) => f.person.fullName() },
  { pattern: /^(username|user_name|handle)$/i, generator: (f) => f.internet.username() },
  { pattern: /^(price|amount|cost|fee|total|subtotal|balance)$/i, generator: (f) => parseFloat(f.commerce.price()) },
  { pattern: /^(createdAt|updatedAt|deletedAt|date|timestamp|publishedAt|created_at|updated_at)$/i, generator: (f) => f.date.between({ from: "2020-01-01", to: "2025-12-31" }).toISOString() },
  { pattern: /^(url|website|link|href|endpoint)$/i, generator: (f) => f.internet.url() },
  { pattern: /^(image|avatar|photo|thumbnail|picture|cover)$/i, generator: (f) => f.image.url() },
  { pattern: /^(phone|mobile|tel|phoneNumber|phone_number)$/i, generator: (f) => f.phone.number() },
  { pattern: /^(city|town)$/i, generator: (f) => f.location.city() },
  { pattern: /^(country)$/i, generator: (f) => f.location.country() },
  { pattern: /^(address|street)$/i, generator: (f) => f.location.streetAddress() },
  { pattern: /^(zipCode|zip_code|postalCode|postal_code)$/i, generator: (f) => f.location.zipCode() },
  { pattern: /^(description|bio|summary|body|content|about)$/i, generator: (f) => f.lorem.paragraph() },
  { pattern: /^(title|headline|subject)$/i, generator: (f) => f.lorem.sentence() },
  { pattern: /^(slug|handle|key)$/i, generator: (f) => f.helpers.slugify(f.lorem.words(2)) },
  { pattern: /^(age)$/i, generator: (f) => f.number.int({ min: 18, max: 80 }) },
  { pattern: /^(rating|score|rank)$/i, generator: (f) => f.number.float({ min: 1, max: 5, fractionDigits: 1 }) },
  { pattern: /^(quantity|qty|count|stock)$/i, generator: (f) => f.number.int({ min: 0, max: 500 }) },
  { pattern: /^(color|colour)$/i, generator: (f) => f.color.human() },
  { pattern: /^(company|organization|org)$/i, generator: (f) => f.company.name() },
  { pattern: /^(product|item|productName|product_name)$/i, generator: (f) => f.commerce.productName() },
  { pattern: /^(category|type|kind)$/i, generator: (f) => f.commerce.department() },
  { pattern: /^(status)$/i, generator: (f) => f.helpers.arrayElement(["active", "inactive", "pending", "archived"]) },
  { pattern: /^(role|permission)$/i, generator: (f) => f.helpers.arrayElement(["admin", "user", "moderator", "guest"]) },
  { pattern: /^(tag|label)s?$/i, generator: (f) => f.helpers.arrayElement(["featured", "new", "sale", "popular"]) },
  { pattern: /^(currency)$/i, generator: (f) => f.finance.currencyCode() },
  { pattern: /^(ip|ipAddress|ip_address)$/i, generator: (f) => f.internet.ip() },
  { pattern: /^(language|locale|lang)$/i, generator: (f) => f.helpers.arrayElement(["en", "fr", "de", "es", "zh"]) },
];

const typeDefaults: Record<string, (f: Faker) => unknown> = {
  string: (f) => f.lorem.word(),
  number: (f) => f.number.int({ min: 1, max: 100 }),
  boolean: (f) => f.datatype.boolean(),
  date: (f) => f.date.between({ from: "2020-01-01", to: "2025-12-31" }).toISOString(),
  unknown: () => null,
};

export function inferValue(fieldName: string, fieldType: FieldType, faker: Faker): unknown {
  for (const rule of rules) {
    if (rule.pattern.test(fieldName)) {
      return rule.generator(faker);
    }
  }
  const fallback = typeDefaults[fieldType];
  return fallback ? fallback(faker) : null;
}
