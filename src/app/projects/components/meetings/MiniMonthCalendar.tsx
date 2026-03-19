"use client";

import { Button } from "@/app/ui/button";
import { addDays, toDateInputValue } from "@/app/projects/utils/date";

function startOfMonth(date: Date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function gridStart(date: Date) {
  const first = startOfMonth(date);
  const day = (first.getDay() + 6) % 7;
  return addDays(first, -day);
}

export function MiniMonthCalendar({
  selectedDate,
  eventDates,
  onChange,
}: {
  selectedDate: Date;
  eventDates: string[];
  onChange: (date: Date) => void;
}) {
  const monthStart = startOfMonth(selectedDate);
  const start = gridStart(monthStart);
  const dates = Array.from({ length: 42 }, (_, i) => addDays(start, i));

  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="mb-2 text-sm font-medium">
        {selectedDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
      </div>
      <div className="mb-1 grid grid-cols-7 text-[11px] text-muted-foreground">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
          <div key={day} className="p-1 text-center">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {dates.map((d) => {
          const isSelected = toDateInputValue(d) === toDateInputValue(selectedDate);
          const inMonth = d.getMonth() === selectedDate.getMonth();
          const hasMeeting = eventDates.includes(toDateInputValue(d));

          return (
            <div key={d.toISOString()} className="relative">
              <Button
                size="icon-sm"
                variant={isSelected ? "default" : "ghost"}
                className={inMonth ? "" : "text-muted-foreground"}
                onClick={() => onChange(d)}
              >
                {d.getDate()}
              </Button>
              {hasMeeting && (
                <span className="pointer-events-none absolute left-1/2 bottom-0.5 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
