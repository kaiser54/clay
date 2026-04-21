import type { GeneratedRecord } from "../types/clay.ts";
import { JsonHighlightedPre } from "./json-highlighted-pre.tsx";
import styles from "./output-panel.module.css";

type OutputPanelProps = {
  data: GeneratedRecord[] | null;
  error: string | null;
  loading: boolean;
  page: number;
  onPageChange: (page: number) => void;
  totalPages: number;
  outputJson: string;
  copied: boolean;
  onCopy: () => void;
  className?: string;
};

export function OutputPanel({
  data,
  error,
  loading,
  page,
  onPageChange,
  totalPages,
  outputJson,
  copied,
  onCopy,
  className,
}: OutputPanelProps) {
  const showEmpty = !data && !error && !loading;
  const showJson = data && !loading;

  return (
    <div className={`${styles.panel} ${className ?? ""}`}>
      <div className={styles.panelHeader}>
        <span>
          Output
          {data ? <span className={styles.badge}>{data.length} records</span> : null}
        </span>

        <div className={styles.panelActions}>
          {data && totalPages > 1 ? (
            <div className={styles.pagination}>
              <button type="button" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}>
                ‹
              </button>
              <span>
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                ›
              </button>
            </div>
          ) : null}

          {data ? (
            <button
              type="button"
              className={`${styles.copyBtn} ${copied ? styles.copyBtnDone : ""}`}
              onClick={onCopy}
            >
              {copied ? "✓ Copied" : "Copy"}
            </button>
          ) : null}
        </div>
      </div>

      <div className={styles.outputBody}>
        {showEmpty ? (
          <div className={styles.empty}>
            <p>Paste a TypeScript interface and click Generate.</p>
            <p className={styles.emptyHint}>Supports primitives · arrays · nested objects · optional fields</p>
          </div>
        ) : null}

        {loading ? (
          <div className={styles.empty}>
            <p className={styles.emptyHint}>Generating…</p>
          </div>
        ) : null}

        {error ? (
          <div className={styles.errorBox}>
            <span className={styles.errorLabel}>Error</span>
            {error}
          </div>
        ) : null}

        {showJson ? <JsonHighlightedPre json={outputJson} /> : null}
      </div>
    </div>
  );
}
