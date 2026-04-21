import { useEffect, useRef, useState } from "react";
import { fetchInterfaceNames } from "../api/clay-client.ts";

const DEFAULT_DELAY_MS = 350;

export function useDebouncedInterfaceList(source: string, delayMs = DEFAULT_DELAY_MS) {
  const [interfaces, setInterfaces] = useState<string[]>([]);
  const [selectedInterface, setSelectedInterface] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (!source.trim()) {
        setInterfaces([]);
        setSelectedInterface("");
        return;
      }
      try {
        const names = await fetchInterfaceNames(source);
        setInterfaces(names);
        setSelectedInterface((prev) => (names.includes(prev) ? prev : names[0] ?? ""));
      } catch {
        /* ignore parse errors while typing */
      }
    }, delayMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [source, delayMs]);

  return { interfaces, selectedInterface, setSelectedInterface };
}
