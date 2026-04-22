import { useMemo } from "react";

import { useOpsStore } from "../../state/useOpsStore";
import { selectQueueItems } from "../../state/selectors";

export const CommandPalette = () => {
  const open = useOpsStore((state) => state.ui.commandPaletteOpen);
  const openCommandPalette = useOpsStore((state) => state.openCommandPalette);
  const setFilters = useOpsStore((state) => state.setFilters);
  const setActivePanel = useOpsStore((state) => state.setActivePanel);
  const selectQueueItem = useOpsStore((state) => state.selectQueueItem);
  const items = useOpsStore(selectQueueItems);

  const firstFailed = useMemo(() => items.find((item) => item.status === "failed"), [items]);

  if (!open) {
    return null;
  }

  const runCommand = (command: "failed" | "clear" | "timeline") => {
    if (command === "failed" && firstFailed) {
      selectQueueItem(firstFailed.id);
    }
    if (command === "clear") {
      setFilters({ assigneeFilter: "all", searchFilter: "", statusFilter: "all" });
    }
    if (command === "timeline") {
      setActivePanel("timeline");
    }
    openCommandPalette(false);
  };

  return (
    <div className="modal-overlay" role="presentation">
      <section className="palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <header>
          <h2>Command Palette</h2>
          <button type="button" className="compact-button" onClick={() => openCommandPalette(false)}>
            Close
          </button>
        </header>
        <ul>
          <li>
            <button type="button" onClick={() => runCommand("failed")}>
              Focus first failed run
            </button>
          </li>
          <li>
            <button type="button" onClick={() => runCommand("clear")}>
              Clear all filters
            </button>
          </li>
          <li>
            <button type="button" onClick={() => runCommand("timeline")}>
              Jump to timeline panel
            </button>
          </li>
        </ul>
      </section>
    </div>
  );
};
