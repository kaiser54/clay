import { useCallback, useState } from "react";

const COPIED_MS = 1500;

export function useCopyFeedback() {
  const [copied, setCopied] = useState(false);

  const copy = useCallback((text: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), COPIED_MS);
  }, []);

  return { copied, copy };
}
