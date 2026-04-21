import type { KeyboardEvent } from "react";
import { InterfacePills } from "./interface-pills.tsx";
import styles from "./editor-panel.module.css";

type EditorPanelProps = {
  source: string;
  onSourceChange: (value: string) => void;
  interfaces: string[];
  selectedInterface: string;
  onSelectInterface: (name: string) => void;
  count: number;
  onCountChange: (value: number) => void;
  seed: string;
  onSeedChange: (value: string) => void;
  limit: number;
  onLimitChange: (value: number) => void;
  loading: boolean;
  onGenerate: () => void | Promise<void>;
  className?: string;
};

export function EditorPanel({
  source,
  onSourceChange,
  interfaces,
  selectedInterface,
  onSelectInterface,
  count,
  onCountChange,
  seed,
  onSeedChange,
  limit,
  onLimitChange,
  loading,
  onGenerate,
  className,
}: EditorPanelProps) {
  function handleTab(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const el = e.currentTarget;
    const { selectionStart, selectionEnd, value } = el;
    const next = value.slice(0, selectionStart) + "  " + value.slice(selectionEnd);
    onSourceChange(next);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = selectionStart + 2;
    });
  }

  return (
    <div className={`${styles.panel} ${className ?? ""}`}>
      <div className={styles.panelHeader}>
        <span>TypeScript</span>
      </div>

      <textarea
        className={styles.editor}
        value={source}
        onChange={(e) => onSourceChange(e.target.value)}
        onKeyDown={handleTab}
        spellCheck={false}
        placeholder="Paste a TypeScript interface…"
      />

      <InterfacePills names={interfaces} selected={selectedInterface} onSelect={onSelectInterface} />

      <div className={styles.options}>
        <div className={styles.fields}>
          <label className={styles.field}>
            <span>Count</span>
            <input
              type="number"
              min={1}
              max={1000}
              value={count}
              onChange={(e) => onCountChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
            />
          </label>

          <label className={styles.field}>
            <span>Seed</span>
            <input
              type="number"
              value={seed}
              onChange={(e) => onSeedChange(e.target.value)}
              placeholder="random"
            />
          </label>

          <label className={styles.field}>
            <span>Per page</span>
            <input
              type="number"
              min={1}
              max={Math.min(200, count)}
              value={limit}
              onChange={(e) => onLimitChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
            />
          </label>
        </div>

        <button type="button" className={styles.runBtn} onClick={onGenerate} disabled={loading}>
          {loading ? <span className={styles.spinner} /> : "Generate"}
        </button>
      </div>
    </div>
  );
}
