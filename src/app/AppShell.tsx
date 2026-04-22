import { useEffect } from "react";

import { CommandPalette } from "../features/common/CommandPalette";
import { ConfirmDialog } from "../features/common/ConfirmDialog";
import { NetworkBanner } from "../features/common/NetworkBanner";
import { OpsSummaryBar } from "../features/common/OpsSummaryBar";
import { DetailInspector } from "../features/details/DetailInspector";
import { QueuePanel } from "../features/queue/QueuePanel";
import { TimelinePanel } from "../features/timeline/TimelinePanel";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { useUrlStateSync } from "../hooks/useUrlStateSync";
import { useOpsStore } from "../state/useOpsStore";

export const AppShell = () => {
  const initialize = useOpsStore((state) => state.initialize);
  const teardown = useOpsStore((state) => state.teardown);
  const confirmAction = useOpsStore((state) => state.ui.confirmAction);
  const closeConfirmDialog = useOpsStore((state) => state.closeConfirmDialog);
  const performAction = useOpsStore((state) => state.performAction);

  useKeyboardShortcuts();
  useUrlStateSync();

  useEffect(() => {
    void initialize();
    return () => teardown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="app-shell">
      <header className="topbar">
        <h1>Ops Cockpit</h1>
        <p>Monitor to Inspect to Act to Verify | Command Palette: Ctrl/Cmd + K</p>
      </header>

      <NetworkBanner />
      <OpsSummaryBar />

      <div className="surface-grid">
        <QueuePanel />
        <DetailInspector />
        <TimelinePanel />
      </div>

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title="Cancel workflow run"
        description="Canceling is destructive for in-flight work. Confirm only if downstream systems are safe."
        confirmLabel="Cancel run"
        onCancel={closeConfirmDialog}
        onConfirm={() => {
          if (!confirmAction) {
            return;
          }
          void performAction(confirmAction.type, confirmAction.itemId);
        }}
      />

      <CommandPalette />
    </main>
  );
};
