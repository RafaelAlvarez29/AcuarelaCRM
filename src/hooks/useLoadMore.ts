import { useEffect, useState } from "react"

/** Paginación por "cargar más": muestra un subconjunto y reinicia al cambiar los filtros. */
export function useLoadMore<T>(
  items: readonly T[],
  pageSize: number,
  ...resetDeps: unknown[]
) {
  const [visibleCount, setVisibleCount] = useState(pageSize)

  useEffect(() => {
    setVisibleCount(pageSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps)

  const visible = items.slice(0, visibleCount)
  const hasMore = items.length > visibleCount
  const loadMore = () => setVisibleCount((count) => count + pageSize)

  return { visible, hasMore, loadMore }
}