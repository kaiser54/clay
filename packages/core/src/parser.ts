import { Project, SyntaxKind, type TypeNode, type PropertySignature } from "ts-morph";
import type { SchemaField, FieldType } from "./types.js";

function resolveTypeNode(typeNode: TypeNode | undefined, interfaceMap: Map<string, SchemaField[]>): Pick<SchemaField, "type" | "children"> {
  if (!typeNode) return { type: "unknown" };

  const kind = typeNode.getKind();

  // string, number, boolean keywords
  if (kind === SyntaxKind.StringKeyword) return { type: "string" };
  if (kind === SyntaxKind.NumberKeyword) return { type: "number" };
  if (kind === SyntaxKind.BooleanKeyword) return { type: "boolean" };

  // Array types: string[], number[], User[]
  if (kind === SyntaxKind.ArrayType) {
    const elementType = typeNode.asKindOrThrow(SyntaxKind.ArrayType).getElementTypeNode();
    const inner = resolveTypeNode(elementType, interfaceMap);
    return {
      type: "array",
      children: [{ name: "$element", type: inner.type, optional: false, children: inner.children }],
    };
  }

  // Type references: User, string (aliased)
  if (kind === SyntaxKind.TypeReference) {
    const refName = typeNode.asKindOrThrow(SyntaxKind.TypeReference).getTypeName().getText();
    if (refName === "Date") return { type: "date" };
    if (interfaceMap.has(refName)) {
      return { type: "object", children: interfaceMap.get(refName) };
    }
    // Unresolved reference — treat as string
    return { type: "string" };
  }

  // Inline object literals: { name: string }
  if (kind === SyntaxKind.TypeLiteral) {
    const members = typeNode.asKindOrThrow(SyntaxKind.TypeLiteral).getMembers();
    const children: SchemaField[] = members
      .filter((m): m is PropertySignature => m.getKind() === SyntaxKind.PropertySignature)
      .map((prop) => resolveProperty(prop, interfaceMap));
    return { type: "object", children };
  }

  // Union types: string | null, string | undefined → unwrap non-null member
  if (kind === SyntaxKind.UnionType) {
    const types = typeNode.asKindOrThrow(SyntaxKind.UnionType).getTypeNodes();
    const meaningful = types.find(
      (t) => t.getKind() !== SyntaxKind.NullKeyword && t.getKind() !== SyntaxKind.UndefinedKeyword
    );
    if (meaningful) return resolveTypeNode(meaningful, interfaceMap);
  }

  return { type: "unknown" };
}

function resolveProperty(prop: PropertySignature, interfaceMap: Map<string, SchemaField[]>): SchemaField {
  const name = prop.getName();
  const optional = prop.hasQuestionToken();
  const typeNode = prop.getTypeNode();
  const { type, children } = resolveTypeNode(typeNode, interfaceMap);
  return { name, type, optional, ...(children ? { children } : {}) };
}

export function parseTypeScript(sourceCode: string): SchemaField[][] {
  const project = new Project({ useInMemoryFileSystem: true, skipFileDependencyResolution: true });
  const file = project.createSourceFile("input.ts", sourceCode);

  const interfaceMap = new Map<string, SchemaField[]>();

  // Two-pass: first collect all interface names, then resolve
  for (const iface of file.getInterfaces()) {
    interfaceMap.set(iface.getName(), []);
  }

  for (const iface of file.getInterfaces()) {
    const fields: SchemaField[] = iface
      .getProperties()
      .map((prop) => resolveProperty(prop, interfaceMap));
    interfaceMap.set(iface.getName(), fields);
  }

  return [...interfaceMap.values()].filter((fields) => fields.length > 0);
}

export function parseFirstInterface(sourceCode: string): SchemaField[] {
  const results = parseTypeScript(sourceCode);
  if (results.length === 0) throw new Error("No interface found in source code");
  return results[0];
}
