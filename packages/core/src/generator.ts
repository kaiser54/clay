import { faker } from "@faker-js/faker";
import { inferValue } from "./inference.js";
import type { SchemaField, GenerateOptions } from "./types.js";

function generateField(field: SchemaField): unknown {
  if (field.type === "object" && field.children) {
    return generateObject(field.children);
  }

  if (field.type === "array" && field.children) {
    const element = field.children[0];
    const length = faker.number.int({ min: 1, max: 5 });
    return Array.from({ length }, () => generateField(element));
  }

  return inferValue(field.name, field.type, faker);
}

function generateObject(fields: SchemaField[]): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const field of fields) {
    // skip ~30% of optional fields
    if (field.optional && faker.datatype.boolean({ probability: 0.3 })) continue;
    obj[field.name] = generateField(field);
  }
  return obj;
}

export function generateFromFields(fields: SchemaField[], options: GenerateOptions = {}): Record<string, unknown>[] {
  const { count = 10, seed } = options;

  if (seed !== undefined) faker.seed(seed);

  return Array.from({ length: count }, () => generateObject(fields));
}
