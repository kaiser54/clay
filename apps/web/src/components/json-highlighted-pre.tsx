import { highlightJson } from "../lib/json-highlight.ts";
import styles from "./json-highlighted-pre.module.css";

type JsonHighlightedPreProps = {
  json: string;
};

export function JsonHighlightedPre({ json }: JsonHighlightedPreProps) {
  return (
    <pre
      className={styles.jsonOutput}
      dangerouslySetInnerHTML={{ __html: highlightJson(json) }}
    />
  );
}
