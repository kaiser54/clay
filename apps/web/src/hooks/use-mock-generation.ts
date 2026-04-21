import { useCallback, useRef, useState } from "react";
import { fetchGeneratedRecords } from "../api/clay-client.ts";
import type { GeneratedRecord } from "../types/clay.ts";

export type MockGenerationOptions = {
  source: string;
  count: number;
  seed: string;
  interfaceName: string;
  onSuccess: () => void;
};

export function useMockGeneration({
  source,
  count,
  seed,
  interfaceName,
  onSuccess,
}: MockGenerationOptions) {
  const [data, setData] = useState<GeneratedRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const generatingRef = useRef(false);

  const generate = useCallback(async () => {
    if (!source.trim() || generatingRef.current) return;
    generatingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const records = await fetchGeneratedRecords({
        source,
        count,
        seed: seed !== "" ? parseInt(seed, 10) : undefined,
        interfaceName: interfaceName || undefined,
      });
      setData(records);
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
      setData(null);
    } finally {
      generatingRef.current = false;
      setLoading(false);
    }
  }, [source, count, seed, interfaceName, onSuccess]);

  return { data, error, loading, generate };
}
