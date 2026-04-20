export { parseTypeScript, parseFirstInterface } from "./parser.js";
export { generateFromFields } from "./generator.js";
export type { SchemaField, FieldType, GenerateOptions } from "./types.js";

import { parseFirstInterface } from "./parser.js";
import { generateFromFields } from "./generator.js";
import type { GenerateOptions } from "./types.js";

export function generateMockData(
  sourceCode: string,
  options: GenerateOptions = {}
): Record<string, unknown>[] {
  const fields = parseFirstInterface(sourceCode);
  return generateFromFields(fields, options);
}
