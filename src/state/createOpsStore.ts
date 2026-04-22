import { createStore } from "zustand/vanilla";

import type { OpsService } from "../services/mockOpsService";
import type {
  EventLogEntry,
  NetworkState,
  OperatorAction,
  OperatorActionType,
  QueueItem,
  QueueStatus,
  ServerEvent
} from "../types/ops";

interface PendingAction {
  action: OperatorAction;
  previous: QueueItem;
}

interface UiState {
  selectedQueueId: string | null;
  statusFilter: QueueStatus | "all";
  searchFilter: string;
  assigneeFilter: "all" | "unassigned" | "me";
  activePanel: "details" | "timeline";
  confirmAction: null | {
    itemId: string;
    type: OperatorActionType;
  };
  lastError: string | null;
  commandPaletteOpen: boolean;
}

interface ServerState {
  queueById: Record<string, QueueItem>;
  queueOrder: string[];
  eventsByRun: Record<string, EventLogEntry[]>;
  latestSequence: number;
  staleConflict: boolean;
  lastSyncedAt: number | null;
}

interface OpsState {
  operatorId: string;
  ui: UiState;
  server: ServerState;
  network: NetworkState;
  pendingActions: Record<string, PendingAction>;
  initialize: () => Promise<void>;
  teardown: () => void;
  selectQueueItem: (id: string | null) => void;
  setFilters: (patch: Partial<Pick<UiState, "statusFilter" | "searchFilter" | "assigneeFilter">>) => void;
  setActivePanel: (panel: UiState["activePanel"]) => void;
  openConfirmDialog: (type: OperatorActionType, itemId: string) => void;
  closeConfirmDialog: () => void;
  openCommandPalette: (open: boolean) => void;
  performAction: (type: OperatorActionType, itemId: string, payload?: { assignee?: string }) => Promise<void>;
  clearError: () => void;
  forceResync: () => Promise<void>;
}

const emptyUiState: UiState = {
  selectedQueueId: null,
  statusFilter: "all",
  searchFilter: "",
  assigneeFilter: "all",
  activePanel: "details",
  confirmAction: null,
  lastError: null,
  commandPaletteOpen: false
};

const mergeEvent = (target: Record<string, EventLogEntry[]>, entry: EventLogEntry): Record<string, EventLogEntry[]> => {
  const existing = target[entry.runId] ?? [];
  if (existing.some((item) => item.id === entry.id)) {
    return target;
  }
  const next = [entry, ...existing].sort((a, b) => b.createdAt - a.createdAt).slice(0, 120);
  return { ...target, [entry.runId]: next };
};

const applyOptimisticTransition = (item: QueueItem, action: OperatorAction): QueueItem => {
  const next = { ...item, updatedAt: Date.now(), lastEventAt: Date.now() };
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
  return next;
};

const applyServerEvent = (server: ServerState, event: ServerEvent): ServerState => {
  if (event.sequence <= server.latestSequence) {
    return server;
  }

  const staleConflict = event.sequence > server.latestSequence + 1;

  if (event.kind === "queue_upsert") {
    return {
      ...server,
      queueById: {
        ...server.queueById,
        [event.item.id]: event.item
      },
      latestSequence: event.sequence,
      staleConflict: server.staleConflict || staleConflict,
      lastSyncedAt: Date.now()
    };
  }

  return {
    ...server,
    eventsByRun: mergeEvent(server.eventsByRun, event.entry),
    latestSequence: event.sequence,
    staleConflict: server.staleConflict || staleConflict,
    lastSyncedAt: Date.now()
  };
};

export const createOpsStore = (service: OpsService) => {
  let cleanupFns: Array<() => void> = [];
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  const store = createStore<OpsState>((set, get) => ({
    operatorId: "op-me",
    ui: emptyUiState,
    server: {
      queueById: {},
      queueOrder: [],
      eventsByRun: {},
      latestSequence: 0,
      staleConflict: false,
      lastSyncedAt: null
    },
    network: service.getCurrentNetworkState(),
    pendingActions: {},

    initialize: async () => {
      if (cleanupFns.length > 0) {
        return;
      }

      cleanupFns = [
        service.subscribeServerEvents((event) => {
          set((state) => ({
            ...state,
            server: applyServerEvent(state.server, event)
          }));
        }),
        service.subscribeNetworkState((network) => {
          set((state) => ({ ...state, network }));
        })
      ];

      const syncSnapshot = async () => {
        try {
          const snapshot = await service.fetchSnapshot();
          const queueById = Object.fromEntries(snapshot.queueItems.map((item) => [item.id, item]));
          const eventsByRun = snapshot.eventLog.reduce<Record<string, EventLogEntry[]>>((acc, entry) => {
            const current = acc[entry.runId] ?? [];
            acc[entry.runId] = [...current, entry].sort((a, b) => b.createdAt - a.createdAt).slice(0, 120);
            return acc;
          }, {});

          set((state) => {
            const selectedQueueId = state.ui.selectedQueueId ?? snapshot.queueItems[0]?.id ?? null;
            return {
              ...state,
              ui: { ...state.ui, selectedQueueId },
              server: {
                queueById,
                queueOrder: snapshot.queueItems.map((item) => item.id),
                eventsByRun,
                latestSequence: snapshot.sequence,
                staleConflict: false,
                lastSyncedAt: Date.now()
              }
            };
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Snapshot fetch failed";
          set((state) => ({
            ...state,
            ui: {
              ...state.ui,
              lastError: message
            }
          }));
        }
      };

      await syncSnapshot();
      pollTimer = setInterval(syncSnapshot, 7_500);
    },

    teardown: () => {
      cleanupFns.forEach((cleanup) => cleanup());
      cleanupFns = [];
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    },

    selectQueueItem: (id) => {
      set((state) => ({ ...state, ui: { ...state.ui, selectedQueueId: id } }));
    },

    setFilters: (patch) => {
      set((state) => ({ ...state, ui: { ...state.ui, ...patch } }));
    },

    setActivePanel: (panel) => {
      set((state) => ({ ...state, ui: { ...state.ui, activePanel: panel } }));
    },

    openConfirmDialog: (type, itemId) => {
      set((state) => ({
        ...state,
        ui: {
          ...state.ui,
          confirmAction: { type, itemId }
        }
      }));
    },

    closeConfirmDialog: () => {
      set((state) => ({
        ...state,
        ui: {
          ...state.ui,
          confirmAction: null
        }
      }));
    },

    openCommandPalette: (open) => {
      set((state) => ({ ...state, ui: { ...state.ui, commandPaletteOpen: open } }));
    },

    clearError: () => {
      set((state) => ({ ...state, ui: { ...state.ui, lastError: null } }));
    },

    forceResync: async () => {
      try {
        const snapshot = await service.fetchSnapshot();
        const queueById = Object.fromEntries(snapshot.queueItems.map((item) => [item.id, item]));
        const eventsByRun = snapshot.eventLog.reduce<Record<string, EventLogEntry[]>>((acc, entry) => {
          const current = acc[entry.runId] ?? [];
          acc[entry.runId] = [...current, entry].sort((a, b) => b.createdAt - a.createdAt).slice(0, 120);
          return acc;
        }, {});

        set((state) => ({
          ...state,
          server: {
            ...state.server,
            queueById,
            queueOrder: snapshot.queueItems.map((item) => item.id),
            eventsByRun,
            latestSequence: snapshot.sequence,
            staleConflict: false,
            lastSyncedAt: Date.now()
          }
        }));
      } catch {
        set((state) => ({ ...state, ui: { ...state.ui, lastError: "Resync failed while network is unstable." } }));
      }
    },

    performAction: async (type, itemId, payload) => {
      const state = get();
      const item = state.server.queueById[itemId];
      if (!item) {
        return;
      }

      const action: OperatorAction = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        queueItemId: itemId,
        type,
        operatorId: state.operatorId,
        createdAt: Date.now(),
        payload
      };

      const optimistic = applyOptimisticTransition(item, action);
      set((current) => ({
        ...current,
        ui: {
          ...current.ui,
          lastError: null,
          confirmAction: null
        },
        server: {
          ...current.server,
          queueById: {
            ...current.server.queueById,
            [itemId]: optimistic
          }
        },
        pendingActions: {
          ...current.pendingActions,
          [action.id]: {
            action,
            previous: item
          }
        }
      }));

      const result = await service.performOperatorAction(action);

      if (!result.ok || !result.item) {
        set((current) => {
          const pending = current.pendingActions[action.id];
          const nextPending = { ...current.pendingActions };
          delete nextPending[action.id];
          return {
            ...current,
            ui: {
              ...current.ui,
              lastError: result.error ?? "Action failed unexpectedly."
            },
            server: {
              ...current.server,
              queueById: {
                ...current.server.queueById,
                [itemId]: pending?.previous ?? current.server.queueById[itemId]
              }
            },
            pendingActions: nextPending
          };
        });
        return;
      }

      set((current) => {
        const nextPending = { ...current.pendingActions };
        delete nextPending[action.id];

        let nextServer: ServerState = {
          ...current.server,
          queueById: {
            ...current.server.queueById,
            [itemId]: result.item as QueueItem
          }
        };

        if (result.event) {
          nextServer = {
            ...nextServer,
            eventsByRun: mergeEvent(nextServer.eventsByRun, result.event)
          };
        }

        return {
          ...current,
          server: nextServer,
          pendingActions: nextPending
        };
      });
    }
  }));

  return store;
};

export type { OpsState };
