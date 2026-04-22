import { describe, expect, it } from "vitest";

import { selectSelectedItem, selectSelectedTimeline } from "./selectors";
import type { OpsState } from "./createOpsStore";

const state: OpsState = {
  operatorId: "op-me",
  ui: {
    selectedQueueId: "q-1",
    statusFilter: "all",
    searchFilter: "",
    assigneeFilter: "all",
    activePanel: "details",
    confirmAction: null,
    lastError: null,
    commandPaletteOpen: false
  },
  server: {
    queueById: {
      "q-1": {
        id: "q-1",
        workflowId: "wf-1",
        runId: "run-1",
        status: "running",
        priority: "P0",
        assignedTo: null,
        lastEventAt: 1,
        progressPct: 20,
        retryCount: 0,
        updatedAt: 1
      }
    },
    queueOrder: ["q-1"],
    eventsByRun: {
      "run-1": [
        {
          id: "evt-1",
          runId: "run-1",
          workflowId: "wf-1",
          queueItemId: "q-1",
          sequence: 1,
          type: "system",
          message: "seed",
          createdAt: 1
        }
      ]
    },
    latestSequence: 1,
    staleConflict: false,
    lastSyncedAt: 1
  },
  network: {
    phase: "online",
    lagMs: 12,
    droppedUpdates: 0,
    lastHeartbeatAt: 1
  },
  pendingActions: {},
  initialize: async () => undefined,
  teardown: () => undefined,
  selectQueueItem: () => undefined,
  setFilters: () => undefined,
  setActivePanel: () => undefined,
  openConfirmDialog: () => undefined,
  closeConfirmDialog: () => undefined,
  openCommandPalette: () => undefined,
  performAction: async () => undefined,
  clearError: () => undefined,
  forceResync: async () => undefined
};

describe("state synchronization selectors", () => {
  it("returns same selected run context for details and timeline", () => {
    const selected = selectSelectedItem(state);
    const timeline = selectSelectedTimeline(state);

    expect(selected?.runId).toBe("run-1");
    expect(timeline).toHaveLength(1);
    expect(timeline[0].queueItemId).toBe(selected?.id);
  });
});
