import type { GeneratedRecord, GenerateResponseBody, ParseResponseBody } from "../types/clay.ts";

export async function fetchInterfaceNames(source: string): Promise<string[]> {
  const res = await fetch("/api/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source }),
  });
  const json = (await res.json()) as ParseResponseBody;
  return json.interfaces ?? [];
}

export type GenerateParams = {
  source: string;
  count: number;
  seed?: number;
  interfaceName?: string;
};

export async function fetchGeneratedRecords(params: GenerateParams): Promise<GeneratedRecord[]> {
  const { source, count, seed, interfaceName } = params;
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source,
      count,
      seed,
      interfaceName,
    }),
  });
  const json = (await res.json()) as GenerateResponseBody;
  if (!res.ok) throw new Error(json.error ?? "Generation failed");
  return json.data ?? [];
}
