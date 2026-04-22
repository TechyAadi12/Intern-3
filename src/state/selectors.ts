import type { QueueItem } from "../types/ops";
import type { OpsState } from "./createOpsStore";

// Cache previous results to ensure stable references
let cachedQueueItems: QueueItem[] = [];
let cachedQueueItemsOrder: string[] = [];
let cachedQueueById: Record<string, QueueItem> = {};

export const selectQueueItems = (state: OpsState): QueueItem[] => {
  // Check if underlying data has changed
  const orderChanged = state.server.queueOrder !== cachedQueueItemsOrder;
  const itemsChanged = state.server.queueById !== cachedQueueById;

  if (!orderChanged && !itemsChanged) {
    return cachedQueueItems;
  }

  // Rebuild cache if data changed
  cachedQueueItemsOrder = state.server.queueOrder;
  cachedQueueById = state.server.queueById;
  cachedQueueItems = state.server.queueOrder
    .map((id) => state.server.queueById[id])
    .filter((item): item is QueueItem => Boolean(item));

  return cachedQueueItems;
};

export const selectSelectedItem = (state: OpsState): QueueItem | null => {
  if (!state.ui.selectedQueueId) {
    return null;
  }
  return state.server.queueById[state.ui.selectedQueueId] ?? null;
};

export const selectSelectedTimeline = (state: OpsState) => {
  const selected = selectSelectedItem(state);
  if (!selected) {
    return [];
  }
  return state.server.eventsByRun[selected.runId] ?? [];
};
