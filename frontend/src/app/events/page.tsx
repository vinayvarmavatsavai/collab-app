"use client";

import { useEffect, useMemo, useState } from "react";
import BottomNav from "../navigation/BottomNav";
import Header from "../navigation/Header";

type EventTag =
  | "Hackathon"
  | "Meetup"
  | "Workshop"
  | "Webinar"
  | "Pitch"
  | "Career"
  | "Design"
  | "AI";

type EventItem = {
  id: number;
  title: string;
  company: string;
  dateLabel: string;
  timeLabel: string;
  location: string;
  priceInr: number;
  mode: "Online" | "In-person";
  tags: EventTag[];
};

const mockEvents: EventItem[] = [
  {
    id: 1,
    title: "Startup Pitch Night — Build & Present",
    company: "FoundersHub",
    dateLabel: "Tue, Mar 02",
    timeLabel: "6:00 PM - 8:30 PM",
    location: "Hitech City, Hyderabad",
    priceInr: 299,
    mode: "In-person",
    tags: ["Pitch", "Meetup"],
  },
  {
    id: 2,
    title: "AI Builders Meetup — Agents & Tools",
    company: "SphereNet Community",
    dateLabel: "Mon, Mar 03",
    timeLabel: "11:00 AM - 12:30 PM",
    location: "Online",
    priceInr: 0,
    mode: "Online",
    tags: ["AI", "Meetup"],
  },
  {
    id: 3,
    title: "Design Systems Workshop (Figma + UI Kit)",
    company: "PixelWorks",
    dateLabel: "Wed, Mar 06",
    timeLabel: "7:00 PM - 9:00 PM",
    location: "Gachibowli, Hyderabad",
    priceInr: 499,
    mode: "In-person",
    tags: ["Design", "Workshop"],
  },
  {
    id: 4,
    title: "Weekend Hackathon — Build in 24 Hours",
    company: "DevSprint",
    dateLabel: "Fri, Mar 09",
    timeLabel: "10:00 AM - Sun 10:00 AM",
    location: "Madhapur, Hyderabad",
    priceInr: 199,
    mode: "In-person",
    tags: ["Hackathon", "Career"],
  },
  {
    id: 5,
    title: "Career Webinar — Portfolio that gets interviews",
    company: "HiringStudio",
    dateLabel: "Fri, Mar 15",
    timeLabel: "8:00 PM - 9:00 PM",
    location: "Online",
    priceInr: 0,
    mode: "Online",
    tags: ["Career", "Webinar"],
  },
];

const SAVED_KEY = "savedEvents_v1";
const REGISTERED_KEY = "registeredEvents_v1";

function formatPrice(priceInr: number) {
  if (!priceInr || priceInr <= 0) return "Free";
  return `₹${priceInr}`;
}

function getDisplayName(): string {
  try {
    const raw = localStorage.getItem("profileAnswers");
    if (!raw) return "User";
    const parsed = JSON.parse(raw);

    const candidates = [
      parsed?.name,
      parsed?.fullName,
      parsed?.yourName,
      parsed?.["Your name"],
      parsed?.["Name"],
    ].filter(Boolean);

    const n = (candidates?.[0] ?? "User") as string;
    return n.trim() || "User";
  } catch {
    return "User";
  }
}

export default function EventsPage() {
  const [name, setName] = useState("User");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<
    "all" | "free" | "paid" | "online" | "nearby"
  >("all");
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [registeredIds, setRegisteredIds] = useState<number[]>([]);

  useEffect(() => {
    setName(getDisplayName());

    try {
      const raw = localStorage.getItem(SAVED_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setSavedIds(parsed);
    } catch {}

    try {
      const raw = localStorage.getItem(REGISTERED_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setRegisteredIds(parsed);
    } catch {}
  }, []);

  const visibleEvents = useMemo(() => {
    const q = query.trim().toLowerCase();

    return mockEvents.filter((e) => {
      const hay =
        `${e.title} ${e.company} ${e.location} ${e.mode} ${e.tags.join(" ")}`.toLowerCase();
      const matchesQuery = !q || hay.includes(q);

      let matchesFilter = true;
      if (filter === "free") matchesFilter = e.priceInr === 0;
      if (filter === "paid") matchesFilter = e.priceInr > 0;
      if (filter === "online") matchesFilter = e.mode === "Online";
      if (filter === "nearby") matchesFilter = e.mode === "In-person";

      return matchesQuery && matchesFilter;
    });
  }, [query, filter]);

  const registeredEvents = useMemo(() => {
    return mockEvents.filter((e) => registeredIds.includes(e.id));
  }, [registeredIds]);

  const toggleSave = (id: number) => {
    const next = savedIds.includes(id)
      ? savedIds.filter((x) => x !== id)
      : [...savedIds, id];

    setSavedIds(next);
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  };

  const toggleRegister = (id: number) => {
    const next = registeredIds.includes(id)
      ? registeredIds.filter((x) => x !== id)
      : [...registeredIds, id];

    setRegisteredIds(next);
    localStorage.setItem(REGISTERED_KEY, JSON.stringify(next));
  };

  return (
    <div className="sync-theme-page sync-page-with-bottom-nav min-h-screen">
      <Header
        title="Events"
        subtitle={`Discover meetups, hackathons, workshops, and webinars for your next move, ${name}.`}
      />

      <div className="mx-auto w-full max-w-[480px] px-4 pb-6 pt-2">
        <div className="sync-theme-surface sync-theme-border mb-4 rounded-[28px] border px-4 py-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="sync-theme-text-main text-sm font-semibold">
                Event Hub
              </div>
              <div className="sync-theme-text-muted mt-1 text-xs">
                Search and manage registrations in one place
              </div>
            </div>

            <div className="rounded-full bg-black/[0.06] px-3 py-1 text-xs font-semibold text-black dark:bg-white/[0.08] dark:text-white">
              {visibleEvents.length} found
            </div>
          </div>

          <div className="sync-theme-border flex items-center gap-3 rounded-2xl border bg-black/[0.03] px-4 py-3 dark:bg-white/[0.04]">
            <span className="sync-theme-text-soft text-sm">🔎</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events, companies, locations..."
              className="sync-theme-text-main w-full bg-transparent text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {[
              { key: "all", label: "All" },
              { key: "free", label: "Free" },
              { key: "paid", label: "Paid" },
              { key: "online", label: "Online" },
              { key: "nearby", label: "Nearby" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() =>
                  setFilter(
                    f.key as "all" | "free" | "paid" | "online" | "nearby",
                  )
                }
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                  filter === f.key
                    ? "sync-theme-primary-btn"
                    : "sync-theme-border sync-theme-surface border"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {registeredEvents.length > 0 && (
          <section className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="sync-theme-text-main text-lg font-semibold">
                My Registered Events
              </h2>
              <span className="sync-theme-text-muted text-sm">
                {registeredEvents.length} registered
              </span>
            </div>

            <div className="space-y-3">
              {registeredEvents.map((e) => (
                <div
                  key={`reg-${e.id}`}
                  className="sync-theme-surface sync-theme-border rounded-[22px] border px-3 py-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="sync-theme-text-muted text-[11px] font-semibold">
                        {e.company}
                      </div>
                      <div className="sync-theme-text-main mt-0.5 line-clamp-2 text-[14px] font-semibold leading-5">
                        {e.title}
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                      Registered
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
                    <div>
                      <div className="sync-theme-text-muted text-[10px]">Date</div>
                      <div className="sync-theme-text-main font-medium">
                        {e.dateLabel}
                      </div>
                    </div>

                    <div>
                      <div className="sync-theme-text-muted text-[10px]">Time</div>
                      <div className="sync-theme-text-main font-medium">
                        {e.timeLabel}
                      </div>
                    </div>

                    <div className="col-span-2">
                      <div className="sync-theme-text-muted text-[10px]">
                        {e.mode === "Online" ? "Mode" : "Location"}
                      </div>
                      <div className="sync-theme-text-main font-medium">
                        {e.location}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => alert(`Demo: open event ${e.id}`)}
                      className="flex-1 rounded-xl bg-black/[0.06] py-2 text-xs font-medium text-black dark:bg-white/[0.08] dark:text-white"
                    >
                      View
                    </button>

                    <button
                      onClick={() => toggleRegister(e.id)}
                      className="flex-1 rounded-xl bg-emerald-100 py-2 text-xs font-semibold text-emerald-700"
                    >
                      Unregister
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mb-3 flex items-center justify-between">
          <h2 className="sync-theme-text-main text-lg font-semibold">
            Upcoming Events
          </h2>

          <button
            onClick={() => {
              setQuery("");
              setFilter("all");
            }}
            className="sync-theme-text-main text-sm font-semibold"
          >
            Reset
          </button>
        </div>

        <div className="space-y-3">
          {visibleEvents.length === 0 ? (
            <div className="sync-theme-surface sync-theme-border rounded-[22px] border p-6 text-center shadow-sm">
              <div className="text-3xl">🗓️</div>
              <div className="sync-theme-text-main mt-3 text-base font-semibold">
                No events found
              </div>
              <div className="sync-theme-text-muted mt-1 text-sm">
                Try changing your search or filters.
              </div>
            </div>
          ) : (
            visibleEvents.map((e) => {
              const saved = savedIds.includes(e.id);
              const isRegistered = registeredIds.includes(e.id);

              return (
                <div
                  key={e.id}
                  className="sync-theme-surface sync-theme-border rounded-[22px] border px-3 py-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="sync-theme-text-muted text-[11px] font-semibold">
                        {e.company}
                      </div>

                      <div className="sync-theme-text-main mt-0.5 line-clamp-2 text-[14px] font-semibold leading-5">
                        {e.title}
                      </div>
                    </div>

                    <button
                      onClick={() => toggleSave(e.id)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs ${
                        saved
                          ? "bg-black text-white dark:bg-white dark:text-black"
                          : "bg-black/[0.06] text-black dark:bg-white/[0.08] dark:text-white"
                      }`}
                      title={saved ? "Saved" : "Save"}
                      aria-label={saved ? "Saved" : "Save"}
                    >
                      {saved ? "★" : "☆"}
                    </button>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
                    <div>
                      <div className="sync-theme-text-muted text-[10px]">Date</div>
                      <div className="sync-theme-text-main font-medium">
                        {e.dateLabel}
                      </div>
                    </div>

                    <div>
                      <div className="sync-theme-text-muted text-[10px]">Time</div>
                      <div className="sync-theme-text-main font-medium">
                        {e.timeLabel}
                      </div>
                    </div>

                    <div className="col-span-2">
                      <div className="sync-theme-text-muted text-[10px]">
                        {e.mode === "Online" ? "Mode" : "Location"}
                      </div>
                      <div className="sync-theme-text-main font-medium">
                        {e.location}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-black/[0.06] px-2 py-[2px] text-[10px] text-black dark:bg-white/[0.08] dark:text-white">
                      {e.mode}
                    </span>

                    {e.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-black/[0.06] px-2 py-[2px] text-[10px] text-black dark:bg-white/[0.08] dark:text-white"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => alert(`Demo: open event ${e.id}`)}
                      className="flex-1 rounded-xl bg-black/[0.06] py-2 text-xs font-medium text-black dark:bg-white/[0.08] dark:text-white"
                    >
                      View
                    </button>

                    <button
                      onClick={() => toggleRegister(e.id)}
                      className={`flex-1 rounded-xl py-2 text-xs font-semibold ${
                        isRegistered
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-black text-white dark:bg-white dark:text-black"
                      }`}
                    >
                      {isRegistered ? "Registered" : "Register"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}