import { useEffect, useMemo, type Dispatch, type SetStateAction } from "react";
import type { GeneratedRecord } from "../types/clay.ts";

export function usePagination(
  data: GeneratedRecord[] | null,
  limit: number,
  page: number,
  setPage: Dispatch<SetStateAction<number>>
) {
  const totalPages = data ? Math.ceil(data.length / limit) : 0;

  const paginated = useMemo(
    () => (data ? data.slice((page - 1) * limit, page * limit) : []),
    [data, limit, page]
  );

  const outputJson = useMemo(() => JSON.stringify(paginated, null, 2), [paginated]);

  useEffect(() => {
    if (data && page > Math.ceil(data.length / limit)) setPage(1);
  }, [limit, data, page, setPage]);

  return { totalPages, paginated, outputJson };
}
