import { useMemo } from "react";

import { selectSelectedItem } from "../../state/selectors";
import { useOpsStore } from "../../state/useOpsStore";
import { formatClock, formatRelativeTime } from "../../utils/time";

export const TimelinePanel = () => {
  const selected = useOpsStore(selectSelectedItem);
  const activePanel = useOpsStore((state) => state.ui.activePanel);
  const eventsByRun = useOpsStore((state) => state.server.eventsByRun);
  const setActivePanel = useOpsStore((state) => state.setActivePanel);

  const events = useMemo(() => {
    if (!selected) {
      const aggregate = Object.values(eventsByRun).flat();
      return aggregate.sort((a, b) => b.createdAt - a.createdAt).slice(0, 80);
    }
    return (eventsByRun[selected.runId] ?? []).slice(0, 80);
  }, [eventsByRun, selected]);

  return (
    <section className="panel timeline-panel" aria-label="Activity timeline">
      <header className="panel-header">
        <h2>Timeline</h2>
        <div className="timeline-tabs" role="tablist" aria-label="Inspector and timeline focus">
          <button
            role="tab"
            type="button"
            aria-selected={activePanel === "details"}
            className={activePanel === "details" ? "tab-active" : ""}
            onClick={() => setActivePanel("details")}
          >
            Details
          </button>
          <button
            role="tab"
            type="button"
            aria-selected={activePanel === "timeline"}
            className={activePanel === "timeline" ? "tab-active" : ""}
            onClick={() => setActivePanel("timeline")}
          >
            Timeline
          </button>
        </div>
      </header>

      <div className="timeline-list" role="log" aria-live="polite" aria-label="Event log">
        {events.map((event) => (
          <article key={event.id} className={event.type === "operator_action" ? "timeline-event highlight" : "timeline-event"}>
            <div className="timeline-topline">
              <strong>{event.type.replace("_", " ").toUpperCase()}</strong>
              <span>{formatClock(event.createdAt)}</span>
              <span>{formatRelativeTime(event.createdAt)}</span>
            </div>
            <p>{event.message}</p>
            {event.metadata && (
              <div className="event-meta">
                {Object.entries(event.metadata).map(([key, value]) => (
                  <span key={key}>
                    {key}: {String(value)}
                  </span>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};
