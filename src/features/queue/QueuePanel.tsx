import clsx from "clsx";
import { memo, useMemo, type KeyboardEvent } from "react";

import { selectQueueItems } from "../../state/selectors";
import { useOpsStore } from "../../state/useOpsStore";
import type { QueueItem, QueueStatus } from "../../types/ops";
import { filterQueueItems } from "../../utils/queueFilters";
import { formatRelativeTime } from "../../utils/time";

const statusOrder: Array<QueueStatus | "all"> = ["all", "queued", "running", "paused", "failed", "completed", "canceled"];

interface QueueRowProps {
  item: QueueItem;
  selected: boolean;
  onSelect: (id: string) => void;
}

const QueueRow = memo(({ item, selected, onSelect }: QueueRowProps) => (
  <button
    type="button"
    className={clsx("queue-row", selected && "queue-row-selected", `status-${item.status}`)}
    onClick={() => onSelect(item.id)}
    aria-label={`${item.id} ${item.status} priority ${item.priority}`}
  >
    <span className="queue-id">{item.id}</span>
    <span className="queue-status">{item.status}</span>
    <span className="queue-meta">{item.priority}</span>
    <span className="queue-meta">{item.assignedTo ?? "unassigned"}</span>
    <span className="queue-meta">{formatRelativeTime(item.updatedAt)}</span>
  </button>
));
QueueRow.displayName = "QueueRow";

export const QueuePanel = () => {
  const queueItems = useOpsStore(selectQueueItems);
  const selectedQueueId = useOpsStore((state) => state.ui.selectedQueueId);
  const statusFilter = useOpsStore((state) => state.ui.statusFilter);
  const searchFilter = useOpsStore((state) => state.ui.searchFilter);
  const assigneeFilter = useOpsStore((state) => state.ui.assigneeFilter);
  const operatorId = useOpsStore((state) => state.operatorId);
  const selectQueueItem = useOpsStore((state) => state.selectQueueItem);
  const setFilters = useOpsStore((state) => state.setFilters);
  const setActivePanel = useOpsStore((state) => state.setActivePanel);

  const visibleItems = useMemo(
    () =>
      filterQueueItems(queueItems, {
        search: searchFilter,
        status: statusFilter,
        assignee: assigneeFilter,
        me: operatorId
      }),
    [assigneeFilter, operatorId, queueItems, searchFilter, statusFilter]
  );

  const activeIndex = visibleItems.findIndex((item) => item.id === selectedQueueId);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (visibleItems.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = Math.min(visibleItems.length - 1, (activeIndex >= 0 ? activeIndex : 0) + 1);
      selectQueueItem(visibleItems[nextIndex].id);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex = Math.max(0, (activeIndex >= 0 ? activeIndex : 0) - 1);
      selectQueueItem(visibleItems[nextIndex].id);
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      setActivePanel("details");
    }
  };

  return (
    <section className="panel queue-panel" aria-label="Workflow queue">
      <header className="panel-header">
        <h2>Queue</h2>
        <span>{visibleItems.length} items</span>
      </header>

      <div className="queue-filters">
        <input
          type="search"
          aria-label="Search queue"
          placeholder="Search run or queue id"
          value={searchFilter}
          onChange={(event) => setFilters({ searchFilter: event.target.value })}
        />

        <select value={statusFilter} onChange={(event) => setFilters({ statusFilter: event.target.value as QueueStatus | "all" })}>
          {statusOrder.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select value={assigneeFilter} onChange={(event) => setFilters({ assigneeFilter: event.target.value as "all" | "unassigned" | "me" })}>
          <option value="all">all assignees</option>
          <option value="unassigned">unassigned</option>
          <option value="me">assigned to me</option>
        </select>
      </div>

      <div className="queue-list-wrap" tabIndex={0} onKeyDown={onKeyDown} role="listbox" aria-label="Queue items">
        <div className="queue-column-header">
          <span>ID</span>
          <span>Status</span>
          <span>Pri</span>
          <span>Owner</span>
          <span>Updated</span>
        </div>
        <div className="queue-list queue-list-scroll">
          {visibleItems.length > 0 ? (
            visibleItems.map((item) => (
              <QueueRow key={item.id} item={item} selected={item.id === selectedQueueId} onSelect={selectQueueItem} />
            ))
          ) : (
            <div className="queue-empty">
              <strong>No queue items match these filters.</strong>
              <span>Try clearing search or switching status filter.</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
