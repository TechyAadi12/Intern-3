import { describe, expect, it } from "vitest";

import { createOpsStore } from "./createOpsStore";
import type { OpsService } from "../services/mockOpsService";
import type { EventLogEntry, NetworkState, OperatorActionResult, QueueItem, ServerSnapshot } from "../types/ops";

const network: NetworkState = {
  phase: "online",
  lagMs: 0,
  droppedUpdates: 0,
  lastHeartbeatAt: Date.now()
};

const baseItem: QueueItem = {
  id: "q-0001",
  workflowId: "wf-1",
  runId: "run-1",
  status: "running",
  priority: "P1",
  assignedTo: null,
  lastEventAt: Date.now(),
  progressPct: 44,
  retryCount: 0,
  updatedAt: Date.now()
};

const snapshot: ServerSnapshot = {
  workflows: [{ id: "wf-1", name: "Workflow 01", ownerTeam: "Risk" }],
  runs: [{ id: "run-1", workflowId: "wf-1", startedAt: Date.now(), updatedAt: Date.now(), attempt: 1 }],
  queueItems: [baseItem],
  eventLog: [],
  sequence: 1,
  serverTime: Date.now()
};

const noOpEvent = (): (() => void) => () => undefined;

const noEvent: EventLogEntry = {
  id: "evt-1",
  runId: "run-1",
  workflowId: "wf-1",
  queueItemId: "q-0001",
  sequence: 2,
  type: "operator_action",
  message: "op-me executed RETRY",
  createdAt: Date.now()
};

describe("optimistic actions", () => {
  it("rolls back item state when server action fails", async () => {
    const failingService: OpsService = {
      fetchSnapshot: async () => snapshot,
      subscribeNetworkState: () => noOpEvent(),
      subscribeServerEvents: () => noOpEvent(),
      getCurrentNetworkState: () => network,
      performOperatorAction: async (): Promise<OperatorActionResult> => ({
        ok: false,
        error: "forced failure"
      })
    };

    const store = createOpsStore(failingService);
    await store.getState().initialize();

    expect(store.getState().server.queueById["q-0001"].status).toBe("running");

    await store.getState().performAction("retry", "q-0001");

    expect(store.getState().server.queueById["q-0001"].status).toBe("running");
    expect(store.getState().ui.lastError).toContain("forced failure");
  });

  it("keeps optimistic state when action succeeds", async () => {
    const successService: OpsService = {
      fetchSnapshot: async () => snapshot,
      subscribeNetworkState: () => noOpEvent(),
      subscribeServerEvents: () => noOpEvent(),
      getCurrentNetworkState: () => network,
      performOperatorAction: async (): Promise<OperatorActionResult> => ({
        ok: true,
        item: { ...baseItem, status: "queued", progressPct: 0, retryCount: 1 },
        event: noEvent,
        sequence: 2
      })
    };

    const store = createOpsStore(successService);
    await store.getState().initialize();
    await store.getState().performAction("retry", "q-0001");

    expect(store.getState().server.queueById["q-0001"].status).toBe("queued");
    expect(store.getState().pendingActions).toEqual({});
  });
});
