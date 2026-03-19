"use client";

import { Fragment } from "react";
import { formatDayLabel, startOfWeek, addDays, toDateInputValue } from "@/app/projects/utils/date";
import type { CalendarEvent } from "@/app/projects/mock/mockEvents";
import { EventCard } from "./EventCard";
import { TimeSlot } from "./TimeSlot";
import type { CalendarView } from "./TopNavigation";

const hours = Array.from({ length: 24 }, (_, i) => i);

export function CalendarGrid({
  anchor,
  view,
  events,
  onSlotClick,
  onEventClick,
}: {
  anchor: Date;
  view: CalendarView;
  events: CalendarEvent[];
  onSlotClick: (date: string, time: string) => void;
  onEventClick: (eventId: string) => void;
}) {
  const days =
    view === "day"
      ? [anchor]
      : view === "week"
        ? Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(anchor), i))
        : Array.from(
            { length: new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate() },
            (_, i) => addDays(new Date(anchor.getFullYear(), anchor.getMonth(), 1), i),
          );

  if (view === "month") {
    return (
      <div className="rounded-xl border bg-card p-3">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {days.map((day) => {
            const dateKey = toDateInputValue(day);
            const dayEvents = events.filter((event) => event.date === dateKey);
            return (
              <div key={dateKey} className="rounded-md border p-2">
                <div className="mb-2 text-xs font-semibold">{formatDayLabel(day)}</div>
                <div className="space-y-1">
                  {dayEvents.length === 0 ? (
                    <button
                      type="button"
                      className="w-full rounded-md border border-dashed px-2 py-2 text-xs text-muted-foreground hover:bg-accent"
                      onClick={() => onSlotClick(dateKey, "09:00")}
                    >
                      + Add meeting
                    </button>
                  ) : (
                    dayEvents.map((event) => (
                      <EventCard key={event.id} event={event} onClick={() => onEventClick(event.id)} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card">
      {/* Sticky header row */}
      <div
        className="sticky top-0 z-10 bg-card border-b grid"
        style={{ gridTemplateColumns: `70px repeat(${days.length}, minmax(0, 1fr))` }}
      >
        <div className="p-2 text-xs text-muted-foreground">Time</div>
        {days.map((day) => (
          <div key={day.toISOString()} className="border-l p-2 text-xs font-medium">
            {formatDayLabel(day)}
          </div>
        ))}
      </div>

      {/* Scrollable hour rows */}
      <div className="grid" style={{ gridTemplateColumns: `70px repeat(${days.length}, minmax(0, 1fr))` }}>
        {hours.map((hour) => (
          <Fragment key={`hour-${hour}`}>
            <div key={`label-${hour}`} className="h-12 border-t p-2 text-xs text-muted-foreground">
              {String(hour).padStart(2, "0")}:00
            </div>
            {days.map((day) => {
              const dateKey = toDateInputValue(day);
              const slotTime = `${String(hour).padStart(2, "0")}:00`;
              const slotEvents = events.filter((event) => {
                const start = new Date(event.start);
                return event.date === dateKey && start.getHours() === hour;
              });

              return (
                <div key={`${dateKey}-${hour}`} className="relative border-l">
                  <TimeSlot timeLabel={slotTime} onSelect={() => onSlotClick(dateKey, slotTime)} />
                  <div className="pointer-events-auto absolute inset-x-1 top-1 space-y-1">
                    {slotEvents.map((event) => (
                      <EventCard key={event.id} event={event} onClick={() => onEventClick(event.id)} />
                    ))}
                  </div>
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
