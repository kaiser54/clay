import { useEffect, useRef } from "react";

export function useGenerateShortcut(generate: () => void | Promise<void>) {
  const generateRef = useRef(generate);
  generateRef.current = generate;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        void generateRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
