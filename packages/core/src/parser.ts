import { Project, SyntaxKind, type TypeNode, type PropertySignature } from "ts-morph";
import type { SchemaField, FieldType, ParsedInterface } from "./types.js";

function literalValue(typeNode: TypeNode): string | number | boolean | undefined {
  if (typeNode.getKind() !== SyntaxKind.LiteralType) return undefined;
  const lit = typeNode.asKindOrThrow(SyntaxKind.LiteralType).getLiteral();
  const lk = lit.getKind();
  if (lk === SyntaxKind.StringLiteral)  return lit.asKindOrThrow(SyntaxKind.StringLiteral).getLiteralValue();
  if (lk === SyntaxKind.NumericLiteral) return lit.asKindOrThrow(SyntaxKind.NumericLiteral).getLiteralValue();
  if (lk === SyntaxKind.TrueKeyword)    return true;
  if (lk === SyntaxKind.FalseKeyword)   return false;
  return undefined;
}

function resolveTypeNode(typeNode: TypeNode | undefined, interfaceMap: Map<string, SchemaField[]>): Pick<SchemaField, "type" | "children" | "enum"> {
  if (!typeNode) return { type: "unknown" };

  const kind = typeNode.getKind();

  // Primitive keywords
  if (kind === SyntaxKind.StringKeyword)  return { type: "string" };
  if (kind === SyntaxKind.NumberKeyword)  return { type: "number" };
  if (kind === SyntaxKind.BooleanKeyword) return { type: "boolean" };

  // Single literal types: 'admin', 42, true — lock enum to that exact value
  if (kind === SyntaxKind.LiteralType) {
    const val = literalValue(typeNode);
    if (val !== undefined) {
      const type: FieldType =
        typeof val === "number" ? "number" :
        typeof val === "boolean" ? "boolean" : "string";
      return { type, enum: [val] };
    }
  }

  // Array types: string[], number[], User[]
  if (kind === SyntaxKind.ArrayType) {
    const elementType = typeNode.asKindOrThrow(SyntaxKind.ArrayType).getElementTypeNode();
    const inner = resolveTypeNode(elementType, interfaceMap);
    return {
      type: "array",
      children: [{ name: "$element", type: inner.type, optional: false, children: inner.children }],
    };
  }

  // Type references: User, Address, Date
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

  // Union types: string | null, 'light' | 'dark', 1 | 2 | 3, string | undefined
  if (kind === SyntaxKind.UnionType) {
    const types = typeNode.asKindOrThrow(SyntaxKind.UnionType).getTypeNodes();
    const meaningful = types.filter(
      (t) =>
        t.getKind() !== SyntaxKind.NullKeyword &&
        t.getKind() !== SyntaxKind.UndefinedKeyword
    );

    // Collect literal values — if every meaningful member is a literal it's an enum
    const values = meaningful.map(literalValue);
    if (values.every((v) => v !== undefined)) {
      const enumValues = values as (string | number | boolean)[];
      const baseType =
        typeof enumValues[0] === "number" ? "number" :
        typeof enumValues[0] === "boolean" ? "boolean" : "string";
      return { type: baseType as FieldType, enum: enumValues };
    }

    // Mixed union (string | number, etc.) — pick first meaningful member
    if (meaningful.length > 0) return resolveTypeNode(meaningful[0], interfaceMap);
  }

  return { type: "unknown" };
}

function resolveProperty(prop: PropertySignature, interfaceMap: Map<string, SchemaField[]>): SchemaField {
  const name = prop.getName();
  const optional = prop.hasQuestionToken();
  const typeNode = prop.getTypeNode();
  const { type, children, enum: enumValues } = resolveTypeNode(typeNode, interfaceMap);
  return {
    name,
    type,
    optional,
    ...(children ? { children } : {}),
    ...(enumValues ? { enum: enumValues } : {}),
  };
}

export function parseTypeScript(sourceCode: string): ParsedInterface[] {
  const project = new Project({ useInMemoryFileSystem: true, skipFileDependencyResolution: true });
  const file = project.createSourceFile("input.ts", sourceCode);

  const interfaceMap = new Map<string, SchemaField[]>();

  // Pass 1: register all object-shaped names in source order.
  // Iterating statements (not getInterfaces/getTypeAliases separately) preserves
  // declaration order so the selector pills appear in the right sequence.
  for (const stmt of file.getStatements()) {
    const sk = stmt.getKind();
    if (sk === SyntaxKind.InterfaceDeclaration) {
      interfaceMap.set(stmt.asKindOrThrow(SyntaxKind.InterfaceDeclaration).getName(), []);
    } else if (sk === SyntaxKind.TypeAliasDeclaration) {
      const alias = stmt.asKindOrThrow(SyntaxKind.TypeAliasDeclaration);
      if (alias.getTypeNode()?.getKind() === SyntaxKind.TypeLiteral) {
        interfaceMap.set(alias.getName(), []);
      }
    }
  }

  // Pass 2: populate each array in place (push, not reassign) so that any
  // forward-reference captured in pass 1 is automatically updated.
  for (const stmt of file.getStatements()) {
    const sk = stmt.getKind();
    if (sk === SyntaxKind.InterfaceDeclaration) {
      const iface = stmt.asKindOrThrow(SyntaxKind.InterfaceDeclaration);
      const existing = interfaceMap.get(iface.getName())!;
      // Inherit fields from extended interfaces (base already populated — source order)
      for (const base of iface.getExtends()) {
        const baseName = base.getExpression().getText();
        const baseFields = interfaceMap.get(baseName);
        if (baseFields) existing.push(...baseFields);
      }
      iface.getProperties().forEach((prop) => existing.push(resolveProperty(prop, interfaceMap)));
    } else if (sk === SyntaxKind.TypeAliasDeclaration) {
      const alias = stmt.asKindOrThrow(SyntaxKind.TypeAliasDeclaration);
      const typeNode = alias.getTypeNode();
      if (typeNode?.getKind() === SyntaxKind.TypeLiteral) {
        const existing = interfaceMap.get(alias.getName())!;
        typeNode
          .asKindOrThrow(SyntaxKind.TypeLiteral)
          .getMembers()
          .filter((m): m is PropertySignature => m.getKind() === SyntaxKind.PropertySignature)
          .forEach((prop) => existing.push(resolveProperty(prop, interfaceMap)));
      }
    }
  }

  return [...interfaceMap.entries()]
    .filter(([, fields]) => fields.length > 0)
    .map(([name, fields]) => ({ name, fields }));
}

export function parseFirstInterface(sourceCode: string): SchemaField[] {
  const results = parseTypeScript(sourceCode);
  if (results.length === 0) throw new Error("No interface found in source code");
  return results[0].fields;
}
