export type FieldType = "string" | "number" | "boolean" | "date" | "object" | "array" | "unknown";

export type SchemaField = {
  name: string;
  type: FieldType;
  optional: boolean;
  /** element type for arrays, properties for objects */
  children?: SchemaField[];
  /** possible values for literal union types: 'light' | 'dark', 1 | 2 | 3 */
  enum?: (string | number | boolean)[];
};

export type GenerateOptions = {
  count?: number;
  seed?: number;
};

export type ParsedInterface = {
  name: string;
  fields: SchemaField[];
};
