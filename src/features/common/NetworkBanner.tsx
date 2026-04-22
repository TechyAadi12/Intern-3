import clsx from "clsx";

import { useOpsStore } from "../../state/useOpsStore";
import { formatRelativeTime } from "../../utils/time";

export const NetworkBanner = () => {
  const network = useOpsStore((state) => state.network);
  const staleConflict = useOpsStore((state) => state.server.staleConflict);
  const lastError = useOpsStore((state) => state.ui.lastError);
  const clearError = useOpsStore((state) => state.clearError);
  const forceResync = useOpsStore((state) => state.forceResync);

  return (
    <section className="banner-stack" aria-live="polite">
      <div className={clsx("network-banner", `network-${network.phase}`)}>
        <strong>Network:</strong> {network.phase.toUpperCase()} | Lag {network.lagMs}ms | Dropped updates {network.droppedUpdates}
        <span className="network-heartbeat">Heartbeat {formatRelativeTime(network.lastHeartbeatAt)}</span>
      </div>

      {staleConflict && (
        <div className="warning-banner" role="status">
          Incoming event sequence gap detected. Data may be stale.
          <button type="button" className="compact-button" onClick={() => void forceResync()}>
            Resync now
          </button>
        </div>
      )}

      {lastError && (
        <div className="error-banner" role="alert">
          {lastError}
          <button type="button" className="compact-button" onClick={clearError}>
            Dismiss
          </button>
        </div>
      )}
    </section>
  );
};
