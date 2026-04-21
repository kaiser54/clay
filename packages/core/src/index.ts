export { parseTypeScript, parseFirstInterface } from "./parser.js";
export { generateFromFields } from "./generator.js";
export type { SchemaField, FieldType, GenerateOptions, ParsedInterface } from "./types.js";

import { parseTypeScript, parseFirstInterface } from "./parser.js";
import { generateFromFields } from "./generator.js";
import type { GenerateOptions } from "./types.js";

/** Returns the names of all interfaces found in the source code. */
export function listInterfaces(sourceCode: string): string[] {
  return parseTypeScript(sourceCode).map((i) => i.name);
}

/** Generate mock records for the first interface in the source. */
export function generateMockData(
  sourceCode: string,
  options: GenerateOptions = {}
): Record<string, unknown>[] {
  const fields = parseFirstInterface(sourceCode);
  return generateFromFields(fields, options);
}

/** Generate mock records for a specific named interface in the source. */
export function generateMockDataByName(
  sourceCode: string,
  interfaceName: string,
  options: GenerateOptions = {}
): Record<string, unknown>[] {
  const interfaces = parseTypeScript(sourceCode);
  const target = interfaces.find((i) => i.name === interfaceName);
  if (!target) {
    throw new Error(`Interface "${interfaceName}" not found in source code`);
  }
  return generateFromFields(target.fields, options);
}
