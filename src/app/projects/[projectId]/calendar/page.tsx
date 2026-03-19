"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/ui/card";
import {
  CalendarGrid,
  MiniMonthCalendar,
  TopNavigation,
  type CalendarView,
} from "@/app/projects/components/meetings";
import type { CalendarEvent } from "@/app/projects/mock/mockEvents";
import { getEventsByProject } from "@/app/projects/utils/event-store";
import {
  addDays,
  formatDateRange,
  toDateInputValue,
} from "@/app/projects/utils/date";

export default function ProjectCalendarPage() {
  const router = useRouter();
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId;

  const [anchor, setAnchor] = useState(new Date());
  const [view, setView] = useState<CalendarView>(() => {
    if (typeof window === "undefined") return "week";
    return window.matchMedia("(max-width: 768px)").matches ? "day" : "week";
  });

  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    if (!projectId) return;
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
      .filter(
        (event) =>
          new Date(event.start).getTime() + event.durationMinutes * 60_000 > now,
      )
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
    if (!projectId) return;

    const query = new URLSearchParams();
    if (date) query.set("date", date);
    if (time) query.set("time", time);

    const suffix = query.toString() ? `?${query.toString()}` : "";
    router.push(`/projects/${projectId}/calendar/create${suffix}`);
  };

  if (!projectId) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900">
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">Loading project calendar...</p>
        </div>
      </main>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <TopNavigation
        rangeLabel={rangeLabel}
        view={view}
        onPrev={() => move(-1)}
        onNext={() => move(1)}
        onToday={() => setAnchor(new Date())}
        onViewChange={setView}
        onCreate={() => goToCreate()}
      />

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[280px_1fr]">
        <div className="hidden space-y-4 overflow-y-auto xl:block">
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
                <div className="text-sm text-muted-foreground">
                  No upcoming meetings.
                </div>
              ) : (
                upcoming.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    className="w-full rounded-md border p-2 text-left hover:bg-accent"
                    onClick={() =>
                      router.push(`/projects/${projectId}/calendar/${event.id}`)
                    }
                  >
                    <div className="truncate text-sm font-medium">{event.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {event.date} · {new Date(event.start).toTimeString().slice(0, 5)}
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="min-h-0 overflow-y-auto">
          <CalendarGrid
            anchor={anchor}
            view={view}
            events={events.filter(
              (event) =>
                view === "month" ||
                event.date >= toDateInputValue(addDays(anchor, -7)),
            )}
            onSlotClick={(date, time) => goToCreate(date, time)}
            onEventClick={(eventId) =>
              router.push(`/projects/${projectId}/calendar/${eventId}`)
            }
          />
        </div>
      </div>
    </div>
  );
}