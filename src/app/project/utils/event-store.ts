"use client";

import { mockEvents, type CalendarEvent } from "../mock/mockEvents";

const KEY = "project_calendar_events_v1";

function readAll(): CalendarEvent[] {
  if (typeof window === "undefined") return mockEvents;

  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return mockEvents;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return mockEvents;
    return parsed as CalendarEvent[];
  } catch {
    return mockEvents;
  }
}

function writeAll(events: CalendarEvent[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(events));
}

export function getEventsByProject(projectId: string): CalendarEvent[] {
  return readAll()
    .filter((event) => event.projectId === projectId)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

export function getEventById(projectId: string, eventId: string): CalendarEvent | null {
  return readAll().find((event) => event.projectId === projectId && event.id === eventId) ?? null;
}

export function hasEventOverlap({
  projectId,
  start,
  durationMinutes,
  excludeEventId,
}: {
  projectId: string;
  start: string;
  durationMinutes: number;
  excludeEventId?: string;
}): boolean {
  const incomingStart = new Date(start).getTime();
  const incomingEnd = incomingStart + durationMinutes * 60_000;

  return readAll()
    .filter((event) => event.projectId === projectId && event.id !== excludeEventId)
    .some((event) => {
      const currentStart = new Date(event.start).getTime();
      const currentEnd = currentStart + event.durationMinutes * 60_000;
      return incomingStart < currentEnd && incomingEnd > currentStart;
    });
}

export function createEvent(input: Omit<CalendarEvent, "id">): CalendarEvent {
  const event: CalendarEvent = {
    ...input,
    id: `ev-${Date.now()}`,
  };

  const all = readAll();
  all.push(event);
  writeAll(all);
  return event;
}

export function updateEvent(projectId: string, eventId: string, patch: Partial<CalendarEvent>): CalendarEvent | null {
  const all = readAll();
  const index = all.findIndex((event) => event.projectId === projectId && event.id === eventId);
  if (index === -1) return null;

  const updated = { ...all[index], ...patch, id: eventId, projectId };
  all[index] = updated;
  writeAll(all);
  return updated;
}

export function removeEvent(projectId: string, eventId: string): boolean {
  const all = readAll();
  const next = all.filter((event) => !(event.projectId === projectId && event.id === eventId));
  if (next.length === all.length) return false;
  writeAll(next);
  return true;
}
