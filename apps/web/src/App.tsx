import { useState, useCallback, useEffect, useRef } from "react";
import styles from "./App.module.css";

// ─── helpers ────────────────────────────────────────────────────────────────

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlight(json: string): string {
  return escapeHtml(json).replace(
    /("(?:\\u[0-9a-fA-F]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (m) => {
      if (m.startsWith('"')) {
        return m.endsWith(":")
          ? `<span class="jk">${m}</span>`
          : `<span class="js">${m}</span>`;
      }
      if (m === "true" || m === "false") return `<span class="jb">${m}</span>`;
      if (m === "null") return `<span class="jn">${m}</span>`;
      return `<span class="jnum">${m}</span>`;
    }
  );
}

const PLACEHOLDER = `interface User {
  id: string
  name: string
  email: string
  age: number
  role: string
  status: string
  createdAt: string
  updatedAt: string
}`;

// ─── types ───────────────────────────────────────────────────────────────────

type GeneratedRecord = Record<string, unknown>;

// ─── component ───────────────────────────────────────────────────────────────

export default function App() {
  const [source, setSource] = useState(PLACEHOLDER);
  const [count, setCount] = useState(10);
  const [seed, setSeed] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);

  const [data, setData] = useState<GeneratedRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // derived
  const totalPages = data ? Math.ceil(data.length / limit) : 0;
  const paginated = data ? data.slice((page - 1) * limit, page * limit) : [];
  const outputJson = JSON.stringify(paginated, null, 2);

  // ── generate ────────────────────────────────────────────────────────────────
  const generate = useCallback(async () => {
    if (!source.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          count,
          seed: seed !== "" ? parseInt(seed, 10) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Generation failed");
      setData(json.data);
      setPage(1);
    } catch (err) {
      setError((err as Error).message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [source, count, seed, loading]);

  // ── keyboard shortcut ────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        generate();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [generate]);

  // ── tab indent in textarea ───────────────────────────────────────────────────
  function handleTab(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const el = e.currentTarget;
    const { selectionStart, selectionEnd, value } = el;
    const next = value.slice(0, selectionStart) + "  " + value.slice(selectionEnd);
    setSource(next);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = selectionStart + 2;
    });
  }

  // ── copy ────────────────────────────────────────────────────────────────────
  function copy() {
    if (!data) return;
    navigator.clipboard.writeText(outputJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // ── page clamp when limit changes ────────────────────────────────────────────
  useEffect(() => {
    if (data && page > Math.ceil(data.length / limit)) setPage(1);
  }, [limit, data, page]);

  return (
    <div className={styles.app}>
      {/* ── header ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.logo}>Clay</span>
          <span className={styles.tagline}>TypeScript → realistic mock data</span>
        </div>
        <kbd className={styles.shortcut}>⌘ Enter</kbd>
      </header>

      {/* ── main ── */}
      <div className={styles.main}>
        {/* left panel */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span>TypeScript</span>
          </div>

          <textarea
            ref={textareaRef}
            className={styles.editor}
            value={source}
            onChange={(e) => setSource(e.target.value)}
            onKeyDown={handleTab}
            spellCheck={false}
            placeholder="Paste a TypeScript interface…"
          />

          {/* options */}
          <div className={styles.options}>
            <div className={styles.fields}>
              <label className={styles.field}>
                <span>Count</span>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={count}
                  onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </label>

              <label className={styles.field}>
                <span>Seed</span>
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="random"
                />
              </label>

              <label className={styles.field}>
                <span>Per page</span>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={limit}
                  onChange={(e) => setLimit(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </label>
            </div>

            <button
              className={styles.runBtn}
              onClick={generate}
              disabled={loading}
            >
              {loading ? (
                <span className={styles.spinner} />
              ) : (
                "Generate"
              )}
            </button>
          </div>
        </div>

        {/* right panel */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span>
              Output
              {data && (
                <span className={styles.badge}>{data.length} records</span>
              )}
            </span>

            <div className={styles.panelActions}>
              {data && totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    ‹
                  </button>
                  <span>
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    ›
                  </button>
                </div>
              )}

              {data && (
                <button
                  className={`${styles.copyBtn} ${copied ? styles.copyBtnDone : ""}`}
                  onClick={copy}
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              )}
            </div>
          </div>

          <div className={styles.outputBody}>
            {!data && !error && !loading && (
              <div className={styles.empty}>
                <p>Paste a TypeScript interface and click Generate.</p>
                <p className={styles.emptyHint}>
                  Supports primitives · arrays · nested objects · optional fields
                </p>
              </div>
            )}

            {loading && (
              <div className={styles.empty}>
                <p className={styles.emptyHint}>Generating…</p>
              </div>
            )}

            {error && (
              <div className={styles.errorBox}>
                <span className={styles.errorLabel}>Error</span>
                {error}
              </div>
            )}

            {data && !loading && (
              <pre
                className={styles.jsonOutput}
                dangerouslySetInnerHTML={{ __html: highlight(outputJson) }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
