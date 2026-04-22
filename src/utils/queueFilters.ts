import type { QueueItem, QueueStatus } from "../types/ops";

export interface QueueFilters {
  search: string;
  status: QueueStatus | "all";
  assignee: "all" | "unassigned" | "me";
  me: string;
}

export const filterQueueItems = (items: QueueItem[], filters: QueueFilters): QueueItem[] => {
  const query = filters.search.trim().toLowerCase();

  return items
    .filter((item) => {
      if (filters.status !== "all" && item.status !== filters.status) {
        return false;
      }
      if (filters.assignee === "unassigned" && item.assignedTo !== null) {
        return false;
      }
      if (filters.assignee === "me" && item.assignedTo !== filters.me) {
        return false;
      }
      if (!query) {
        return true;
      }
      return item.id.toLowerCase().includes(query) || item.runId.toLowerCase().includes(query);
    })
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority.localeCompare(b.priority);
      }
      return b.updatedAt - a.updatedAt;
    });
};
