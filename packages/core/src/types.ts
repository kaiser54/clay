export type FieldType = "string" | "number" | "boolean" | "date" | "object" | "array" | "unknown";

export type SchemaField = {
  name: string;
  type: FieldType;
  optional: boolean;
  /** element type for arrays, properties for objects */
  children?: SchemaField[];
};

export type GenerateOptions = {
  count?: number;
  seed?: number;
};
