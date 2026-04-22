import clsx from "clsx";
import { useMemo } from "react";

import { selectSelectedItem } from "../../state/selectors";
import { useOpsStore } from "../../state/useOpsStore";
import type { OperatorActionType } from "../../types/ops";
import { formatClock, formatRelativeTime } from "../../utils/time";

const actionLabels: Record<OperatorActionType, string> = {
  retry: "Retry",
  pause: "Pause",
  cancel: "Cancel",
  assign: "Assign"
};

export const DetailInspector = () => {
  const item = useOpsStore(selectSelectedItem);
  const pendingActions = useOpsStore((state) => state.pendingActions);
  const network = useOpsStore((state) => state.network);
  const openConfirmDialog = useOpsStore((state) => state.openConfirmDialog);
  const performAction = useOpsStore((state) => state.performAction);
  const setActivePanel = useOpsStore((state) => state.setActivePanel);

  const pendingForSelected = useMemo(
    () => Object.values(pendingActions).filter((entry) => entry.action.queueItemId === item?.id),
    [item?.id, pendingActions]
  );

  if (!item) {
    return (
      <section className="panel detail-panel" aria-label="Details">
        <header className="panel-header">
          <h2>Inspector</h2>
        </header>
        <p className="empty-state">Select a queue item to inspect run details.</p>
      </section>
    );
  }

  const disableActions = network.phase === "offline";

  const invokeAction = (type: OperatorActionType) => {
    if (type === "cancel") {
      openConfirmDialog(type, item.id);
      return;
    }
    if (type === "assign") {
      void performAction(type, item.id, { assignee: "op-me" });
      return;
    }
    void performAction(type, item.id);
  };

  return (
    <section className="panel detail-panel" aria-label="Selected run inspector" tabIndex={0}>
      <header className="panel-header">
        <h2>Inspector</h2>
        <button type="button" className="compact-button" onClick={() => setActivePanel("timeline")}>
          View Timeline
        </button>
      </header>

      <div className="detail-grid">
        <span>Queue ID</span>
        <strong>{item.id}</strong>
        <span>Run ID</span>
        <strong>{item.runId}</strong>
        <span>Status</span>
        <strong className={clsx("status-pill", `status-${item.status}`)}>{item.status.toUpperCase()}</strong>
        <span>Priority</span>
        <strong>{item.priority}</strong>
        <span>Assignee</span>
        <strong>{item.assignedTo ?? "unassigned"}</strong>
        <span>Progress</span>
        <strong>{item.progressPct}%</strong>
        <span>Retries</span>
        <strong>{item.retryCount}</strong>
        <span>Updated</span>
        <strong>{formatClock(item.updatedAt)} ({formatRelativeTime(item.updatedAt)})</strong>
      </div>

      <div className="action-row">
        {(Object.keys(actionLabels) as OperatorActionType[]).map((type) => (
          <button
            key={type}
            type="button"
            className={clsx("action-button", type === "cancel" && "danger-button")}
            onClick={() => invokeAction(type)}
            disabled={disableActions}
          >
            {actionLabels[type]}
          </button>
        ))}
      </div>

      <div className="pending-state" aria-live="polite">
        {pendingForSelected.length > 0 ? `${pendingForSelected.length} optimistic action(s) pending server confirmation.` : "No pending local actions."}
      </div>
    </section>
  );
};
