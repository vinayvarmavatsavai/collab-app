import { Badge } from "@/app/ui/badge";
import type { CalendarEvent } from "@/app/projects/mock/mockEvents";

export function EventCard({
  event,
  onClick,
}: {
  event: CalendarEvent;
  onClick: () => void;
}) {
  const start = new Date(event.start);
  const end = new Date(start.getTime() + event.durationMinutes * 60_000);
  const now = Date.now();
  const isActive = now >= start.getTime() && now < end.getTime();

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-md border px-2 py-1 text-left shadow-sm transition",
        isActive
          ? "border-green-500 bg-green-600 text-white hover:bg-green-700"
          : "border-primary/40 bg-primary/25 text-foreground hover:bg-primary/40",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="text-xs font-bold truncate">{event.title}</div>
        {isActive && (
          <a
            href={event.meetingLink}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-green-700 hover:bg-green-50"
          >
            Join
          </a>
        )}
      </div>
      <div className={["text-[11px]", isActive ? "text-green-100" : "text-muted-foreground"].join(" ")}>
        {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
      <Badge
        variant="secondary"
        className={["mt-1 text-[10px]", isActive ? "bg-green-800 text-green-100" : ""].join(" ")}
      >
        {event.participants.length} participants
      </Badge>
    </button>
  );
}
