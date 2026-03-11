# Project Meetings Scheduler

A fully client-side, per-project meeting scheduling system built with **Next.js App Router**, **React**, **Tailwind CSS**, and **Radix UI**. Each project gets its own isolated calendar where team members can create, view, edit, and cancel meetings with conflict detection, real-time validation, and live Join buttons.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Directory Structure](#directory-structure)
- [Data Model](#data-model)
- [Persistence Layer](#persistence-layer)
- [Routing](#routing)
- [Features](#features)
  - [Calendar Views](#calendar-views)
  - [Meeting Form](#meeting-form)
  - [Validation Rules](#validation-rules)
  - [Conflict Detection](#conflict-detection)
  - [Active Meeting — Join Button](#active-meeting--join-button)
  - [Upcoming Meetings Sidebar](#upcoming-meetings-sidebar)
  - [Mini Month Calendar](#mini-month-calendar)
- [Component Reference](#component-reference)
- [Utility Reference](#utility-reference)
- [Layout & Scrolling Behaviour](#layout--scrolling-behaviour)
- [Known Constraints / Mock Data](#known-constraints--mock-data)

---

## Architecture Overview

```
Browser
 └── ProjectShell (layout wrapper, sticky header, fixed viewport height)
      └── ProjectCalendarPage (calendar state, upcoming sidebar)
           ├── TopNavigation       — view switcher, prev/next/today, create button
           ├── MiniMonthCalendar   — compact month picker + meeting dot indicators
           ├── Upcoming Meetings   — filtered, sorted future-only meeting list
           └── CalendarGrid        — day / week / month time grid
                └── EventCard      — per-meeting block with active Join button
```

State flows top-down. All mutation (create / update / delete) goes through `event-store.ts` which reads and writes to `localStorage`. There is no server or database — the app is fully functional offline.

---

## Directory Structure

```
src/app/project/
├── [projectId]/                  # Dynamic route — one URL per project
│   ├── page.tsx                  # Redirects /project/:id → /project/:id/calendar
│   ├── project-shell.tsx         # Shared layout: sticky header + fixed-height viewport
│   └── calendar/
│       ├── page.tsx              # Main calendar view (grid + sidebar)
│       ├── create/
│       │   └── page.tsx          # Create meeting form page
│       ├── [eventId]/
│       │   └── page.tsx          # Meeting details page
│       ├── edit/
│       │   └── [eventId]/
│       │       └── page.tsx      # Edit meeting form page
│       ├── schedule/
│       │   └── [username]/
│       │       └── page.tsx      # Public availability scheduling page
│       └── booking/
│           └── confirmation/
│               └── page.tsx      # Booking confirmation page
├── components/
│   └── meetings/                 # All UI components for the scheduler
│       ├── CalendarGrid.tsx
│       ├── EventCard.tsx
│       ├── MeetingForm.tsx
│       ├── MiniMonthCalendar.tsx
│       ├── TopNavigation.tsx
│       ├── ParticipantSelector.tsx
│       ├── DurationSelector.tsx
│       ├── DatePicker.tsx
│       ├── TimePicker.tsx
│       ├── MeetingProviderSelect.tsx
│       ├── MeetingSummaryCard.tsx
│       ├── ConfirmationModal.tsx
│       ├── AvailabilityGrid.tsx
│       ├── TimeSlot.tsx
│       └── index.ts              # Barrel export
├── mock/
│   ├── mockEvents.ts             # Seed events used when localStorage is empty
│   └── mockProjects.ts           # Project metadata (name, members, etc.)
└── utils/
    ├── event-store.ts            # localStorage CRUD + conflict detection
    └── date.ts                   # Timezone-safe date helpers
```

---

## Data Model

### `CalendarEvent`

```typescript
type CalendarEvent = {
  id: string;               // "ev-{timestamp}" — generated at creation
  projectId: string;        // Links event to a project
  title: string;
  description: string;
  date: string;             // "YYYY-MM-DD" — local timezone, no UTC shift
  start: string;            // ISO 8601 string (used for exact time arithmetic)
  durationMinutes: number;  // Minimum 15 minutes
  participants: string[];   // Array of usernames
  provider: "Zoom" | "Google Meet" | "Teams" | "Custom";
  meetingLink: string;      // Direct join URL
  createdBy: string;        // Username of creator
};
```

**Important**: `date` is derived using local timezone helpers (`toDateInputValue`) — never `.toISOString().slice(0, 10)` — to prevent UTC midnight rollback causing a meeting to appear on the wrong calendar day.

---

## Persistence Layer

**File**: `src/app/project/utils/event-store.ts`  
**Storage key**: `project_calendar_events_v1` in `localStorage`

### Behaviour

| Scenario | Result |
|---|---|
| First visit (no localStorage) | Seeded with `mockEvents` |
| `localStorage` present | Uses stored data, ignores mockEvents |
| SSR / server render | Returns `mockEvents` (no `window`) |
| Corrupt / non-array data | Falls back to `mockEvents` |

### API

```typescript
getEventsByProject(projectId)
// Returns events for a project, sorted by start time ascending

getEventById(projectId, eventId)
// Returns a single event or null

hasEventOverlap({ projectId, start, durationMinutes, excludeEventId? })
// Returns true if any existing event in the project overlaps the given time range.
// Overlap condition: incomingStart < existingEnd && incomingEnd > existingStart
// Back-to-back meetings (e.g. 4pm–6pm then 6pm–7pm) are NOT considered overlaps.

createEvent(input)
// Assigns id = "ev-{Date.now()}", appends to store, returns new event

updateEvent(projectId, eventId, patch)
// Merges patch into matching event, writes back, returns updated event

removeEvent(projectId, eventId)
// Deletes matching event, returns true if deleted
```

---

## Routing

All routes are under `/project/[projectId]/`. The square-bracket syntax is **Next.js dynamic routing** — `[projectId]` matches any URL segment, and that value is available in the page as `params.projectId`.

| URL | Page |
|---|---|
| `/project/:id` | Redirects to `/project/:id/calendar` |
| `/project/:id/calendar` | Main calendar view |
| `/project/:id/calendar/create` | Create meeting form |
| `/project/:id/calendar/:eventId` | Meeting details |
| `/project/:id/calendar/edit/:eventId` | Edit meeting form |
| `/project/:id/calendar/schedule/:username` | Public scheduling page |
| `/project/:id/calendar/booking/confirmation` | Booking confirmation |

> **Note (Next.js 16+)**: `params` is a `Promise` in client components. All pages unwrap it with `React.use(params)`.

---

## Features

### Calendar Views

Three views switchable via `TopNavigation`:

| View | Description |
|---|---|
| **Day** | Single day — 24-hour vertical time grid |
| **Week** | 7-day grid (Mon–Sun) — default on desktop |
| **Month** | Correct day count per month (28/29/30/31), event blocks per cell |

- Default view is **Week** on `≥ 768px` screens, **Day** on mobile
- Viewport is locked to `h-dvh` — only the time grid scrolls vertically; the rest of the page is fixed
- The dates header row is **sticky** — remains visible while scrolling through hours
- Clicking any empty time slot opens the create form pre-filled with that date and time

---

### Meeting Form

**Components used**: `DatePicker`, `TimePicker`, `DurationSelector`, `ParticipantSelector`, `MeetingProviderSelect`, `MeetingSummaryCard`

Fields:

| Field | Type | Notes |
|---|---|---|
| Title | Text input | Required |
| Description | Textarea | Optional |
| Participants | Multi-select dropdown | Includes "All" shortcut |
| Date | Date input | Required |
| Time | Time input | Required |
| Duration | Two selects (hours + minutes) | Hours 0–12, minutes 0/15/30/45; minimum 15 min |
| Provider | Select | Zoom / Google Meet / Teams / Custom |
| Meeting link | Text input | Auto-generated default; editable |

A **live summary card** on the right updates in real time as fields change.

---

### Validation Rules

Validated **as you change** the date, time, or duration fields (not only on submit):

1. **Past time block** — A meeting cannot be scheduled in the past. If the selected date+time is earlier than the current moment, a red warning banner appears immediately.
2. **Overlap conflict** — If the time range collides with any existing meeting in the same project, a warning banner appears. Back-to-back meetings (end of one = start of next) are explicitly allowed.
3. **Required fields** — Title, date, and time are required and checked on submit.

The warning banner appears and disappears **reactively** — no need to click Submit to see it.

---

### Conflict Detection

**Function**: `hasEventOverlap()` in `event-store.ts`

Algorithm:
```
incomingStart < existingEnd  AND  incomingEnd > existingStart
```

This is the standard interval overlap test. It correctly allows:
- Meetings that touch at a single boundary point (e.g. 4pm–6pm and 6pm–7pm → **allowed**)
- It blocks any actual time overlap (e.g. 4pm–6pm and 5pm–7pm → **blocked**)

The **edit page** passes `excludeEventId` so a meeting being edited is not compared against itself.

---

### Active Meeting — Join Button

**Component**: `EventCard.tsx`

At render time, each event card checks:
```typescript
const isActive = now >= start.getTime() && now < end.getTime();
```

| State | Card style | Extra element |
|---|---|---|
| **Upcoming** | Primary-tinted background (`bg-primary/25`, `border-primary/40`) | — |
| **Active now** | Green (`bg-green-600`, `border-green-500`, white text) | **"Join"** badge link opens `meetingLink` in new tab |

Clicking "Join" does not navigate away from the calendar — `e.stopPropagation()` prevents the card click from triggering the details page navigation.

---

### Upcoming Meetings Sidebar

Shown on `xl` screens (≥ 1280px) in the left panel alongside the mini calendar.

Filter logic:
```typescript
events
  .filter(event => new Date(event.start).getTime() + event.durationMinutes * 60_000 > Date.now())
  .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  .slice(0, 6)
```

- Only **future or currently active** meetings are shown (meetings whose end time has not yet passed)
- Sorted chronologically, nearest first
- Capped at 6 entries

---

### Mini Month Calendar

**Component**: `MiniMonthCalendar.tsx`

- Compact month grid used as a date picker in the left sidebar
- Accepts `eventDates: string[]` — an array of `"YYYY-MM-DD"` strings
- Dates that have at least one meeting show a **primary-coloured dot** below the day number
- Selected date is highlighted
- Previous/next month navigation

**Hydration safety**: `eventDates` is populated from a `useEffect` (after client mount) to avoid SSR/client HTML mismatch caused by `localStorage` being unavailable on the server.

---

## Component Reference

| Component | Purpose |
|---|---|
| `CalendarGrid` | Renders day/week/month times grid with sticky header and event cards |
| `EventCard` | Single meeting block; green + Join button when meeting is currently active |
| `MeetingForm` | Shared create/edit form with live validation callback (`onFieldChange`) |
| `MiniMonthCalendar` | Compact month picker with meeting dot indicators |
| `TopNavigation` | View switcher (day/week/month), prev/next/today, create button |
| `ParticipantSelector` | Dropdown multi-select with "All" shortcut, badge display |
| `DurationSelector` | Two-select duration picker (0–12h, 0/15/30/45 min), min 15 min |
| `DatePicker` | Native `<input type="date">` wrapper |
| `TimePicker` | Native `<input type="time">` wrapper |
| `MeetingProviderSelect` | Single-select for Zoom / Google Meet / Teams / Custom |
| `MeetingSummaryCard` | Read-only live preview card for the meeting being created/edited |
| `ConfirmationModal` | Reusable confirm/cancel dialog (used for meeting cancellation) |
| `AvailabilityGrid` | Weekly availability slot grid for public scheduling page |
| `TimeSlot` | Individual clickable hour cell in `CalendarGrid` |

---

## Utility Reference

### `src/app/project/utils/date.ts`

| Function | Description |
|---|---|
| `toDateInputValue(date)` | Converts `Date` to `"YYYY-MM-DD"` using **local** year/month/day — prevents UTC midnight rollback |
| `toTimeInputValue(date)` | Returns `"HH:MM"` from a `Date` |
| `parseEventDateTime(date, time)` | Combines `"YYYY-MM-DD"` + `"HH:MM"` into a `Date` in local timezone |
| `addDays(base, days)` | Returns new `Date` offset by N days |
| `startOfWeek(date)` | Returns Monday of the week containing `date` (European convention) |
| `formatDayLabel(date)` | Returns `"Mon 9"` style label for grid column headers |
| `formatDateRange(anchor, view)` | Returns range label for `TopNavigation` (e.g. `"Mar 9 – Mar 15, 2026"`) |
| `setHours(date, hours)` | Returns new `Date` with specified hours |
| `setMinutes(date, minutes)` | Returns new `Date` with specified minutes, seconds/ms zeroed |

---

## Layout & Scrolling Behaviour

The shell (`ProjectShell`) uses `h-dvh flex flex-col` to lock the entire UI to the viewport height. This prevents the browser from scrolling the full page.

```
h-dvh flex flex-col                  ← ProjectShell
├── shrink-0 sticky header           ← Page title + project name
└── flex-1 min-h-0 overflow-hidden   ← <main>
     └── flex flex-col h-full        ← Calendar page
          ├── shrink-0               ← TopNavigation
          └── flex-1 min-h-0 grid   ← Two-column layout
               ├── overflow-y-auto   ← Mini calendar + upcoming sidebar
               └── overflow-y-auto   ← CalendarGrid (only this scrolls)
                    ├── sticky top-0  ← Date header row (always visible)
                    └── scrollable    ← Hour rows (00:00 – 23:00)
```

Only the time grid scrolls. Everything else — the header, navigation bar, sidebar — stays fixed on screen.

---

## Known Constraints / Mock Data

- **Authentication** is not implemented. The `createdBy` field defaults to `"vinay"` (hardcoded).
- **Participants** are pulled from `mockUsers` in `mockProjects.ts`. In production these would come from a real user directory.
- **Projects** are static mock data in `mockProjects.ts`. The IDs `"901"` and `"902"` have pre-seeded mock meetings.
- **localStorage** is the only storage layer. Data does not persist across different browsers or devices, and is cleared if the user clears site data.
- The **"Join"** button on `EventCard` and the "Join meeting" button on the details page both open `meetingLink` in a new tab. In production this would deep-link into a real video conferencing SDK.
- The **public scheduling** (`/schedule/:username`) and **booking confirmation** pages are scaffolded but not wired to a backend.
