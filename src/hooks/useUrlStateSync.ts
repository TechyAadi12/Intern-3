import { useEffect, useMemo, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";

import type { QueueStatus } from "../types/ops";
import { useOpsStore } from "../state/useOpsStore";

const validStatus = new Set<QueueStatus | "all">(["all", "queued", "running", "paused", "failed", "completed", "canceled"]);

type AssigneeFilter = "all" | "unassigned" | "me";
type ActivePanel = "details" | "timeline";

export const useUrlStateSync = () => {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const hydrated = useRef(false);
  const skipNextWrite = useRef(true);

  const selectedQueueId = useOpsStore((state) => state.ui.selectedQueueId);
  const statusFilter = useOpsStore((state) => state.ui.statusFilter);
  const assigneeFilter = useOpsStore((state) => state.ui.assigneeFilter);
  const searchFilter = useOpsStore((state) => state.ui.searchFilter);
  const activePanel = useOpsStore((state) => state.ui.activePanel);
  const setFilters = useOpsStore((state) => state.setFilters);
  const selectQueueItem = useOpsStore((state) => state.selectQueueItem);
  const setActivePanel = useOpsStore((state) => state.setActivePanel);

  const parsed = useMemo(() => {
    const status = params.get("status");
    const assignee = params.get("assignee");
    const panel = params.get("panel");

    const nextAssignee: AssigneeFilter =
      assignee === "all" || assignee === "unassigned" || assignee === "me" ? assignee : "all";
    const nextPanel: ActivePanel = panel === "details" || panel === "timeline" ? panel : "details";

    return {
      selected: params.get("selected"),
      search: params.get("search") ?? "",
      status: validStatus.has(status as QueueStatus | "all") ? (status as QueueStatus | "all") : "all",
      assignee: nextAssignee,
      panel: nextPanel
    };
  }, [params]);

  useEffect(() => {
    if (hydrated.current) {
      return;
    }

    selectQueueItem(parsed.selected ?? null);
    setFilters({
      searchFilter: parsed.search,
      statusFilter: parsed.status,
      assigneeFilter: parsed.assignee
    });
    setActivePanel(parsed.panel);

    hydrated.current = true;
    skipNextWrite.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed]);

  useEffect(() => {
    if (!hydrated.current) {
      return;
    }
    if (skipNextWrite.current) {
      skipNextWrite.current = false;
      return;
    }

    const next = new URLSearchParams();
    if (selectedQueueId) {
      next.set("selected", selectedQueueId);
    }
    if (statusFilter !== "all") {
      next.set("status", statusFilter);
    }
    if (assigneeFilter !== "all") {
      next.set("assignee", assigneeFilter);
    }
    if (searchFilter) {
      next.set("search", searchFilter);
    }
    if (activePanel !== "details") {
      next.set("panel", activePanel);
    }

    const currentQuery = location.search.startsWith("?") ? location.search.slice(1) : location.search;
    const nextQuery = next.toString();

    if (currentQuery !== nextQuery) {
      setParams(next, { replace: true });
    }
  }, [activePanel, assigneeFilter, location.search, searchFilter, selectedQueueId, setParams, statusFilter]);
};
