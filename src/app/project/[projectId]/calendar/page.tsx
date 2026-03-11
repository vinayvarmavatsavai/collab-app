"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/ui/card";
import {
  CalendarGrid,
  MiniMonthCalendar,
  TopNavigation,
  type CalendarView,
} from "@/app/project/components/meetings";
import type { CalendarEvent } from "@/app/project/mock/mockEvents";
import { getEventsByProject } from "@/app/project/utils/event-store";
import { addDays, formatDateRange, toDateInputValue } from "@/app/project/utils/date";

export default function ProjectCalendarPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const router = useRouter();
  const { projectId } = use(params);

  const [anchor, setAnchor] = useState(new Date());
  const [view, setView] = useState<CalendarView>(() => {
    if (typeof window === "undefined") return "week";
    return window.matchMedia("(max-width: 768px)").matches ? "day" : "week";
  });

  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    setEvents(getEventsByProject(projectId));
  }, [projectId]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const sync = () => setView(media.matches ? "day" : "week");
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return events
      .filter((event) => new Date(event.start).getTime() + event.durationMinutes * 60_000 > now)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 6);
  }, [events]);

  const rangeLabel = useMemo(() => formatDateRange(anchor, view), [anchor, view]);

  const move = (delta: number) => {
    if (view === "day") setAnchor((prev) => addDays(prev, delta));
    else if (view === "week") setAnchor((prev) => addDays(prev, delta * 7));
    else setAnchor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const goToCreate = (date?: string, time?: string) => {
    const query = new URLSearchParams();
    if (date) query.set("date", date);
    if (time) query.set("time", time);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    router.push(`/project/${projectId}/calendar/create${suffix}`);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <TopNavigation
        rangeLabel={rangeLabel}
        view={view}
        onPrev={() => move(-1)}
        onNext={() => move(1)}
        onToday={() => setAnchor(new Date())}
        onViewChange={setView}
        onCreate={() => goToCreate()}
      />

      <div className="flex-1 min-h-0 grid gap-4 xl:grid-cols-[280px_1fr]">
        <div className="hidden space-y-4 xl:block overflow-y-auto">
          <MiniMonthCalendar
            selectedDate={anchor}
            eventDates={events.map((event) => event.date)}
            onChange={setAnchor}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming meetings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcoming.length === 0 ? (
                <div className="text-sm text-muted-foreground">No upcoming meetings.</div>
              ) : (
                upcoming.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    className="w-full rounded-md border p-2 text-left hover:bg-accent"
                    onClick={() => router.push(`/project/${projectId}/calendar/${event.id}`)}
                  >
                    <div className="text-sm font-medium truncate">{event.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {event.date} · {new Date(event.start).toTimeString().slice(0, 5)}
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="overflow-y-auto min-h-0">
          <CalendarGrid
            anchor={anchor}
            view={view}
            events={events.filter((event) => view === "month" || event.date >= toDateInputValue(addDays(anchor, -7)))}
            onSlotClick={(date, time) => goToCreate(date, time)}
            onEventClick={(eventId) => router.push(`/project/${projectId}/calendar/${eventId}`)}
          />
        </div>
      </div>
    </div>
  );
}
