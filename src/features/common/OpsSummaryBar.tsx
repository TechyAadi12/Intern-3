import { useMemo } from "react";

import { selectQueueItems } from "../../state/selectors";
import { useOpsStore } from "../../state/useOpsStore";
import { formatRelativeTime } from "../../utils/time";

export const OpsSummaryBar = () => {
  const items = useOpsStore(selectQueueItems);
  const lastSyncedAt = useOpsStore((state) => state.server.lastSyncedAt);
  const pendingCount = useOpsStore((state) => Object.keys(state.pendingActions).length);
  const setFilters = useOpsStore((state) => state.setFilters);

  const stats = useMemo(() => {
    const running = items.filter((item) => item.status === "running").length;
    const failed = items.filter((item) => item.status === "failed").length;
    const paused = items.filter((item) => item.status === "paused").length;

    return {
      total: items.length,
      running,
      failed,
      paused
    };
  }, [items]);

  return (
    <section className="ops-summary" aria-label="Operational summary">
      <button type="button" className="summary-card" onClick={() => setFilters({ statusFilter: "all" })}>
        <span>Total Queue</span>
        <strong>{stats.total}</strong>
      </button>
      <button type="button" className="summary-card running" onClick={() => setFilters({ statusFilter: "running" })}>
        <span>Running</span>
        <strong>{stats.running}</strong>
      </button>
      <button type="button" className="summary-card failed" onClick={() => setFilters({ statusFilter: "failed" })}>
        <span>Failed</span>
        <strong>{stats.failed}</strong>
      </button>
      <button type="button" className="summary-card paused" onClick={() => setFilters({ statusFilter: "paused" })}>
        <span>Paused</span>
        <strong>{stats.paused}</strong>
      </button>
      <div className="summary-meta">
        <span>Pending actions: {pendingCount}</span>
        <span>Last sync: {lastSyncedAt ? formatRelativeTime(lastSyncedAt) : "waiting..."}</span>
      </div>
    </section>
  );
};
