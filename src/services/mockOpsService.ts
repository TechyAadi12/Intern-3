import type {
  EventLogEntry,
  NetworkState,
  OperatorAction,
  OperatorActionResult,
  QueueItem,
  QueueStatus,
  Run,
  ServerEvent,
  ServerSnapshot,
  Workflow
} from "../types/ops";

interface OpsService {
  fetchSnapshot: () => Promise<ServerSnapshot>;
  performOperatorAction: (action: OperatorAction) => Promise<OperatorActionResult>;
  subscribeServerEvents: (listener: (event: ServerEvent) => void) => () => void;
  subscribeNetworkState: (listener: (state: NetworkState) => void) => () => void;
  getCurrentNetworkState: () => NetworkState;
}

const teams = ["Payments", "Risk", "Catalog", "Fulfillment"];
const operators = ["op-a", "op-b", "op-c", "op-me", null] as const;
const statuses: QueueStatus[] = ["queued", "running", "paused", "failed", "completed", "canceled"];
const priorities = ["P0", "P1", "P2"] as const;

const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const sample = <T>(values: readonly T[]): T => values[randomInt(0, values.length - 1)] as T;
const chance = (p: number): boolean => Math.random() < p;

const generateSeedData = (count = 320): { workflows: Workflow[]; runs: Run[]; queueItems: QueueItem[]; eventLog: EventLogEntry[] } => {
  const now = Date.now();
  const workflows: Workflow[] = Array.from({ length: 48 }, (_, index) => ({
    id: `wf-${index + 1}`,
    name: `Workflow ${String(index + 1).padStart(2, "0")}`,
    ownerTeam: sample(teams)
  }));

  const runs: Run[] = [];
  const queueItems: QueueItem[] = [];
  const eventLog: EventLogEntry[] = [];

  for (let i = 0; i < count; i += 1) {
    const workflow = sample(workflows);
    const runId = `run-${String(i + 1).padStart(4, "0")}`;
    const status = sample(statuses);
    const updatedAt = now - randomInt(1_000, 180_000);

    const run: Run = {
      id: runId,
      workflowId: workflow.id,
      startedAt: updatedAt - randomInt(10_000, 120_000),
      updatedAt,
      attempt: randomInt(1, 3)
    };

    const queueItem: QueueItem = {
      id: `q-${String(i + 1).padStart(4, "0")}`,
      workflowId: workflow.id,
      runId,
      status,
      priority: sample(priorities),
      assignedTo: sample(operators),
      lastEventAt: updatedAt,
      progressPct: status === "completed" ? 100 : status === "failed" ? randomInt(20, 90) : randomInt(0, 96),
      retryCount: randomInt(0, 2),
      updatedAt
    };

    const entry: EventLogEntry = {
      id: `evt-seed-${i + 1}`,
      runId,
      workflowId: workflow.id,
      queueItemId: queueItem.id,
      sequence: i + 1,
      type: "system",
      message: `Run initialized in ${status.toUpperCase()} state`,
      createdAt: updatedAt - randomInt(100, 6_000)
    };

    runs.push(run);
    queueItems.push(queueItem);
    eventLog.push(entry);
  }

  return { workflows, runs, queueItems, eventLog };
};

class MockOpsService implements OpsService {
  private readonly workflows: Workflow[];
  private readonly runs = new Map<string, Run>();
  private readonly queue = new Map<string, QueueItem>();
  private readonly eventLog = new Map<string, EventLogEntry>();

  private readonly serverListeners = new Set<(event: ServerEvent) => void>();
  private readonly networkListeners = new Set<(state: NetworkState) => void>();

  private sequence = 10_000;
  private simulationTimer: ReturnType<typeof setInterval> | null = null;
  private networkTimer: ReturnType<typeof setInterval> | null = null;

  private networkState: NetworkState = {
    phase: "online",
    lagMs: 120,
    droppedUpdates: 0,
    lastHeartbeatAt: Date.now()
  };

  constructor() {
    const seed = generateSeedData();
    this.workflows = seed.workflows;
    seed.runs.forEach((run) => this.runs.set(run.id, run));
    seed.queueItems.forEach((item) => this.queue.set(item.id, item));
    seed.eventLog.forEach((entry) => this.eventLog.set(entry.id, entry));
    this.sequence += seed.eventLog.length;
  }

  private startSimulation(): void {
    if (!this.simulationTimer) {
      this.simulationTimer = setInterval(() => this.simulateTick(), 1_500);
    }
    if (!this.networkTimer) {
      this.networkTimer = setInterval(() => this.simulateNetwork(), 4_500);
    }
  }

  private simulateNetwork(): void {
    const now = Date.now();
    if (this.networkState.phase === "online" && chance(0.12)) {
      this.networkState = { ...this.networkState, phase: "offline", lagMs: 0, lastHeartbeatAt: now };
      this.emitNetwork();

      setTimeout(() => {
        this.networkState = { ...this.networkState, phase: "reconnecting", lagMs: randomInt(500, 1200), lastHeartbeatAt: Date.now() };
        this.emitNetwork();
      }, randomInt(4_000, 7_000));

      setTimeout(() => {
        this.networkState = { ...this.networkState, phase: "online", lagMs: randomInt(90, 260), lastHeartbeatAt: Date.now() };
        this.emitNetwork();
      }, randomInt(8_000, 12_000));
      return;
    }

    if (this.networkState.phase === "online") {
      this.networkState = {
        ...this.networkState,
        lagMs: randomInt(80, 300),
        lastHeartbeatAt: now
      };
      this.emitNetwork();
    }
  }

  private simulateTick(): void {
    const queueItems = Array.from(this.queue.values());
    const mutationCount = randomInt(1, 3);

    for (let i = 0; i < mutationCount; i += 1) {
      const item = sample(queueItems);
      const next = this.transition(item);
      this.queue.set(next.id, next);
      this.runs.set(next.runId, {
        ...(this.runs.get(next.runId) as Run),
        updatedAt: next.updatedAt
      });

      this.emitServerEvent({
        kind: "queue_upsert",
        sequence: this.nextSequence(),
        generatedAt: Date.now(),
        item: next
      });

      const entry: EventLogEntry = {
        id: `evt-${next.id}-${Date.now()}-${i}`,
        runId: next.runId,
        workflowId: next.workflowId,
        queueItemId: next.id,
        sequence: this.nextSequence(),
        type: "state_change",
        message: `Status changed to ${next.status.toUpperCase()}`,
        createdAt: Date.now(),
        metadata: {
          status: next.status,
          progressPct: next.progressPct
        }
      };
      this.eventLog.set(entry.id, entry);
      this.emitServerEvent({
        kind: "event_log",
        sequence: entry.sequence,
        generatedAt: Date.now(),
        entry
      });
    }
  }

  private transition(item: QueueItem): QueueItem {
    const now = Date.now();
    const clone: QueueItem = { ...item, updatedAt: now, lastEventAt: now };

    switch (item.status) {
      case "queued":
        clone.status = chance(0.55) ? "running" : "queued";
        clone.progressPct = Math.max(clone.progressPct, randomInt(1, 16));
        return clone;
      case "running":
        if (chance(0.08)) {
          clone.status = "failed";
        } else if (chance(0.15)) {
          clone.status = "completed";
          clone.progressPct = 100;
        } else {
          clone.progressPct = Math.min(99, clone.progressPct + randomInt(5, 18));
        }
        return clone;
      case "failed":
        if (chance(0.06)) {
          clone.status = "queued";
          clone.retryCount += 1;
          clone.progressPct = 0;
        }
        return clone;
      case "paused":
        if (chance(0.1)) {
          clone.status = "running";
        }
        return clone;
      default:
        if (chance(0.02)) {
          clone.status = "queued";
          clone.retryCount += 1;
          clone.progressPct = 0;
        }
        return clone;
    }
  }

  private nextSequence(): number {
    this.sequence += 1;
    return this.sequence;
  }

  private emitNetwork(): void {
    this.networkListeners.forEach((listener) => listener(this.networkState));
  }

  private emitServerEvent(event: ServerEvent): void {
    if (this.networkState.phase === "offline") {
      this.networkState = {
        ...this.networkState,
        droppedUpdates: this.networkState.droppedUpdates + 1
      };
      this.emitNetwork();
      return;
    }

    if (chance(0.12)) {
      this.networkState = {
        ...this.networkState,
        droppedUpdates: this.networkState.droppedUpdates + 1
      };
      this.emitNetwork();
      return;
    }

    const baseLag = randomInt(70, 680) + this.networkState.lagMs;
    setTimeout(() => {
      this.serverListeners.forEach((listener) => listener(event));
    }, baseLag);

    if (chance(0.1)) {
      setTimeout(() => {
        this.serverListeners.forEach((listener) => listener(event));
      }, baseLag + randomInt(60, 240));
    }
  }

  fetchSnapshot = async (): Promise<ServerSnapshot> => {
    this.startSimulation();
    await new Promise((resolve) => setTimeout(resolve, randomInt(180, 620) + this.networkState.lagMs));

    if (this.networkState.phase === "offline") {
      throw new Error("Network offline");
    }

    return {
      workflows: this.workflows,
      runs: Array.from(this.runs.values()),
      queueItems: Array.from(this.queue.values()),
      eventLog: Array.from(this.eventLog.values()).sort((a, b) => b.createdAt - a.createdAt).slice(0, 1200),
      sequence: this.sequence,
      serverTime: Date.now()
    };
  };

  performOperatorAction = async (action: OperatorAction): Promise<OperatorActionResult> => {
    await new Promise((resolve) => setTimeout(resolve, randomInt(180, 720) + this.networkState.lagMs));

    if (this.networkState.phase === "offline") {
      return { ok: false, error: "Cannot perform action while offline." };
    }

    const current = this.queue.get(action.queueItemId);
    if (!current) {
      return { ok: false, error: "Queue item not found." };
    }

    if (chance(0.2)) {
      return { ok: false, error: `Action ${action.type.toUpperCase()} failed due to server conflict.` };
    }

    const next: QueueItem = { ...current, updatedAt: Date.now(), lastEventAt: Date.now() };
    if (action.type === "retry") {
      next.status = "queued";
      next.retryCount += 1;
      next.progressPct = 0;
    }
    if (action.type === "pause" && next.status === "running") {
      next.status = "paused";
    }
    if (action.type === "cancel") {
      next.status = "canceled";
    }
    if (action.type === "assign") {
      next.assignedTo = action.payload?.assignee ?? action.operatorId;
    }

    this.queue.set(next.id, next);

    const sequence = this.nextSequence();
    const event: EventLogEntry = {
      id: `evt-op-${sequence}`,
      runId: next.runId,
      workflowId: next.workflowId,
      queueItemId: next.id,
      sequence,
      type: "operator_action",
      message: `${action.operatorId} executed ${action.type.toUpperCase()}`,
      createdAt: Date.now(),
      metadata: {
        action: action.type,
        assignedTo: next.assignedTo
      }
    };
    this.eventLog.set(event.id, event);

    this.emitServerEvent({ kind: "queue_upsert", sequence: this.nextSequence(), generatedAt: Date.now(), item: next });
    this.emitServerEvent({ kind: "event_log", sequence: event.sequence, generatedAt: Date.now(), entry: event });

    return {
      ok: true,
      item: next,
      event,
      sequence: event.sequence
    };
  };

  subscribeServerEvents = (listener: (event: ServerEvent) => void): (() => void) => {
    this.startSimulation();
    this.serverListeners.add(listener);
    return () => {
      this.serverListeners.delete(listener);
    };
  };

  subscribeNetworkState = (listener: (state: NetworkState) => void): (() => void) => {
    this.startSimulation();
    this.networkListeners.add(listener);
    listener(this.networkState);
    return () => {
      this.networkListeners.delete(listener);
    };
  };

  getCurrentNetworkState = (): NetworkState => this.networkState;
}

export type { OpsService };
export const mockOpsService: OpsService = new MockOpsService();
