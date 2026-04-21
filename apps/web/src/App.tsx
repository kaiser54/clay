import { useCallback, useState } from "react";
import { AppChrome } from "./components/app-chrome.tsx";
import { EDITOR_PLACEHOLDER } from "./constants/editor-placeholder.ts";
import { useCopyFeedback } from "./hooks/use-copy-feedback.ts";
import { useDebouncedInterfaceList } from "./hooks/use-debounced-interface-list.ts";
import { useGenerateShortcut } from "./hooks/use-generate-shortcut.ts";
import { useMockGeneration } from "./hooks/use-mock-generation.ts";
import { usePagination } from "./hooks/use-pagination.ts";

export default function App() {
  const [source, setSource] = useState(EDITOR_PLACEHOLDER);
  const [count, setCount] = useState(10);
  const [seed, setSeed] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);

  const handleCountChange = useCallback((v: number) => {
    const next = Math.max(1, v);
    setCount(next);
    setLimit((prev) => Math.min(prev, next));
  }, []);

  const handleLimitChange = useCallback((v: number) => {
    const next = Math.max(1, v);
    setLimit(Math.min(next, count));
  }, [count]);

  const { interfaces, selectedInterface, setSelectedInterface } = useDebouncedInterfaceList(source);

  const resetPage = useCallback(() => setPage(1), []);

  const { data, error, loading, generate } = useMockGeneration({
    source,
    count,
    seed,
    interfaceName: selectedInterface,
    onSuccess: resetPage,
  });

  const { totalPages, outputJson } = usePagination(data, limit, page, setPage);

  const { copied, copy } = useCopyFeedback();

  useGenerateShortcut(generate);

  return (
    <AppChrome
      source={source}
      onSourceChange={setSource}
      interfaces={interfaces}
      selectedInterface={selectedInterface}
      onSelectInterface={setSelectedInterface}
      count={count}
      onCountChange={handleCountChange}
      seed={seed}
      onSeedChange={setSeed}
      limit={limit}
      onLimitChange={handleLimitChange}
      loading={loading}
      onGenerate={generate}
      data={data}
      error={error}
      page={page}
      onPageChange={setPage}
      totalPages={totalPages}
      outputJson={outputJson}
      copied={copied}
      onCopy={() => copy(outputJson)}
    />
  );
}
