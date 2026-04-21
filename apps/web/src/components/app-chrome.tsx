import { AppHeader } from "./app-header.tsx";
import { EditorPanel } from "./editor-panel.tsx";
import { OutputPanel } from "./output-panel.tsx";
import type { GeneratedRecord } from "../types/clay.ts";
import appStyles from "../app.module.css";

export type AppChromeProps = {
  source: string;
  onSourceChange: (v: string) => void;
  interfaces: string[];
  selectedInterface: string;
  onSelectInterface: (name: string) => void;
  count: number;
  onCountChange: (v: number) => void;
  seed: string;
  onSeedChange: (v: string) => void;
  limit: number;
  onLimitChange: (v: number) => void;
  loading: boolean;
  onGenerate: () => void | Promise<void>;
  data: GeneratedRecord[] | null;
  error: string | null;
  page: number;
  onPageChange: (p: number) => void;
  totalPages: number;
  outputJson: string;
  copied: boolean;
  onCopy: () => void;
};

export function AppChrome({
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
  data,
  error,
  page,
  onPageChange,
  totalPages,
  outputJson,
  copied,
  onCopy,
}: AppChromeProps) {
  return (
    <div className={appStyles.app}>
      <div className={appStyles.revealHeader}>
        <AppHeader />
      </div>
      <div className={appStyles.main}>
        <EditorPanel
          className={appStyles.revealPanelLeft}
          source={source}
          onSourceChange={onSourceChange}
          interfaces={interfaces}
          selectedInterface={selectedInterface}
          onSelectInterface={onSelectInterface}
          count={count}
          onCountChange={onCountChange}
          seed={seed}
          onSeedChange={onSeedChange}
          limit={limit}
          onLimitChange={onLimitChange}
          loading={loading}
          onGenerate={onGenerate}
        />
        <OutputPanel
          className={appStyles.revealPanelRight}
          data={data}
          error={error}
          loading={loading}
          page={page}
          onPageChange={onPageChange}
          totalPages={totalPages}
          outputJson={outputJson}
          copied={copied}
          onCopy={onCopy}
        />
      </div>
    </div>
  );
}
