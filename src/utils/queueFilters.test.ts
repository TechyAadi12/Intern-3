import { describe, expect, it } from "vitest";

import { filterQueueItems } from "./queueFilters";
import type { QueueItem } from "../types/ops";

const items: QueueItem[] = [
  {
    id: "q-01",
    workflowId: "wf-1",
    runId: "run-01",
    status: "failed",
    priority: "P0",
    assignedTo: "op-me",
    lastEventAt: 1,
    progressPct: 45,
    retryCount: 0,
    updatedAt: 50
  },
  {
    id: "q-02",
    workflowId: "wf-2",
    runId: "run-02",
    status: "running",
    priority: "P1",
    assignedTo: null,
    lastEventAt: 1,
    progressPct: 75,
    retryCount: 0,
    updatedAt: 20
  }
];

describe("filterQueueItems", () => {
  it("filters by status, assignee and search terms", () => {
    const filtered = filterQueueItems(items, {
      search: "q-01",
      status: "failed",
      assignee: "me",
      me: "op-me"
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("q-01");
  });

  it("returns unassigned runs when requested", () => {
    const filtered = filterQueueItems(items, {
      search: "",
      status: "all",
      assignee: "unassigned",
      me: "op-me"
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("q-02");
  });
});
