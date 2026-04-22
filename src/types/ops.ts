export type QueueStatus = "queued" | "running" | "paused" | "failed" | "completed" | "canceled";
export type Priority = "P0" | "P1" | "P2";
export type NetworkPhase = "online" | "offline" | "reconnecting";

export interface Workflow {
  id: string;
  name: string;
  ownerTeam: string;
}

export interface Run {
  id: string;
  workflowId: string;
  startedAt: number;
  updatedAt: number;
  attempt: number;
}

export interface QueueItem {
  id: string;
  workflowId: string;
  runId: string;
  status: QueueStatus;
  priority: Priority;
  assignedTo: string | null;
  lastEventAt: number;
  progressPct: number;
  retryCount: number;
  updatedAt: number;
}

export interface EventLogEntry {
  id: string;
  runId: string;
  workflowId: string;
  queueItemId: string;
  sequence: number;
  type: "state_change" | "operator_action" | "system" | "network";
  message: string;
  createdAt: number;
  metadata?: Record<string, string | number | boolean | null>;
}

export type OperatorActionType = "retry" | "pause" | "cancel" | "assign";

export interface OperatorAction {
  id: string;
  queueItemId: string;
  type: OperatorActionType;
  operatorId: string;
  createdAt: number;
  payload?: {
    assignee?: string;
  };
}

export interface NetworkState {
  phase: NetworkPhase;
  lagMs: number;
  droppedUpdates: number;
  lastHeartbeatAt: number;
}

export interface ServerSnapshot {
  workflows: Workflow[];
  runs: Run[];
  queueItems: QueueItem[];
  eventLog: EventLogEntry[];
  sequence: number;
  serverTime: number;
}

export type ServerEvent =
  | {
      kind: "queue_upsert";
      sequence: number;
      generatedAt: number;
      item: QueueItem;
    }
  | {
      kind: "event_log";
      sequence: number;
      generatedAt: number;
      entry: EventLogEntry;
    };

export interface OperatorActionResult {
  ok: boolean;
  error?: string;
  item?: QueueItem;
  event?: EventLogEntry;
  sequence?: number;
}
