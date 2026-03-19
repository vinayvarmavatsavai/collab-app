"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [name, setName] = useState("User");

  const [activeTab, setActiveTab] = useState<
    "home" | "explore" | "create" | "events" | "profile"
  >("events");

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<
    "all" | "free" | "paid" | "online" | "nearby"
  >("all");

  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [registeredIds, setRegisteredIds] = useState<number[]>([]);

  useEffect(() => {
    setName(getDisplayName());

    // saved (star)
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setSavedIds(parsed);
    } catch {}

    // registered
    try {
      const raw = localStorage.getItem(REGISTERED_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setRegisteredIds(parsed);
    } catch {}
  }, []);

  const go = (path: string, tab?: typeof activeTab) => {
    if (tab) setActiveTab(tab);
    router.push(path);
  };

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

  const registeredEvents = useMemo(() => {
    return mockEvents.filter((e) => registeredIds.includes(e.id));
  }, [registeredIds]);

  return (
    <div className="min-h-screen pb-24 bg-[#F4F6FB] text-slate-900 px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-slate-500 text-sm">
            Discover meetups, hackathons & workshops near you, {name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            aria-label="Notifications"
            title="Notifications"
            onClick={() => go("/notifications")}
            className="h-10 w-10 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition flex items-center justify-center"
          >
            <span className="text-lg leading-none">🔔</span>
          </button>

          <button
            aria-label="QR"
            title="QR"
            onClick={() => go("/qr")}
            className="h-10 w-10 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition flex items-center justify-center"
          >
            <img
              src="/icons/qr.png"
              alt="QR"
              className="h-5 w-5 object-contain"
            />
          </button>

          <button
            aria-label="Messages"
            title="Messages"
            onClick={() => go("/messages")}
            className="h-10 w-10 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition flex items-center justify-center"
          >
            <span className="text-lg leading-none">💬</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-4 py-3 flex items-center gap-3">
          <span className="text-slate-400">🔎</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events, companies, locations..."
            className="w-full outline-none text-sm"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {[
          { key: "all", label: "All" },
          { key: "free", label: "Free" },
          { key: "paid", label: "Paid" },
          { key: "online", label: "Online" },
          { key: "nearby", label: "Nearby" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={`px-4 py-2 rounded-2xl border text-sm font-semibold whitespace-nowrap ${
              filter === f.key
                ? "bg-[#2D6BFF] text-white border-[#2D6BFF]"
                : "bg-white text-slate-600 border-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Registered Events Section */}
      {registeredEvents.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">My Registered Events</h2>
            <span className="text-sm text-slate-500">
              {registeredEvents.length} registered
            </span>
          </div>

          <div className="space-y-4">
            {registeredEvents.map((e) => (
              <div
                key={`reg-${e.id}`}
                className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-slate-500 font-semibold">
                      {e.company}
                    </div>
                    <div className="text-base font-bold mt-1">{e.title}</div>
                  </div>

                  <span className="text-xs px-3 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700">
                    Registered ✓
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-xs text-slate-500">Date</div>
                    <div className="text-sm font-semibold">{e.dateLabel}</div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-xs text-slate-500">Time</div>
                    <div className="text-sm font-semibold">{e.timeLabel}</div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 col-span-2">
                    <div className="text-xs text-slate-500">
                      {e.mode === "Online" ? "Mode" : "Location"}
                    </div>
                    <div className="text-sm font-semibold">{e.location}</div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => alert(`Demo: open event ${e.id}`)}
                    className="flex-1 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold"
                  >
                    View
                  </button>

                  <button
                    onClick={() => toggleRegister(e.id)}
                    className="flex-1 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-700 text-sm font-semibold"
                  >
                    Unregister
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Upcoming</h2>
        <button
          onClick={() => setQuery("")}
          className="text-sm font-semibold text-[#2D6BFF]"
        >
          Reset
        </button>
      </div>

      <div className="space-y-4">
        {visibleEvents.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center">
            <div className="text-2xl">🗓️</div>
            <div className="mt-2 font-semibold">No events found</div>
            <div className="text-sm text-slate-500 mt-1">
              Try changing filters or search.
            </div>
          </div>
        ) : (
          visibleEvents.map((e) => {
            const saved = savedIds.includes(e.id);
            const isRegistered = registeredIds.includes(e.id);

            return (
              <div
                key={e.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-slate-500 font-semibold">
                      {e.company}
                    </div>
                    <div className="text-base font-bold mt-1">{e.title}</div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        e.priceInr === 0
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {formatPrice(e.priceInr)}
                    </span>

                    <button
                      onClick={() => toggleSave(e.id)}
                      className={`h-9 w-9 rounded-xl border flex items-center justify-center ${
                        saved
                          ? "border-[#2D6BFF] bg-[#2D6BFF] text-white"
                          : "border-slate-200 bg-white text-slate-600"
                      }`}
                      title={saved ? "Saved" : "Save"}
                      aria-label={saved ? "Saved" : "Save"}
                    >
                      {saved ? "★" : "☆"}
                    </button>
                  </div>
                </div>

                {/* Meta */}
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-xs text-slate-500">Date</div>
                    <div className="text-sm font-semibold">{e.dateLabel}</div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-xs text-slate-500">Time</div>
                    <div className="text-sm font-semibold">{e.timeLabel}</div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 col-span-2">
                    <div className="text-xs text-slate-500">
                      {e.mode === "Online" ? "Mode" : "Location"}
                    </div>
                    <div className="text-sm font-semibold">{e.location}</div>
                  </div>
                </div>

                {/* Tags */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100">
                    {e.mode}
                  </span>
                  {e.tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs px-2 py-1 rounded-full bg-slate-100"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => alert(`Demo: open event ${e.id}`)}
                    className="flex-1 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold"
                  >
                    View
                  </button>

                  <button
                    onClick={() => toggleRegister(e.id)}
                    className={`flex-1 px-4 py-2 rounded-xl text-sm font-semibold ${
                      isRegistered
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-[#2D6BFF] text-white"
                    }`}
                  >
                    {isRegistered ? "Registered ✓" : "Register"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 z-40">
        <div className="h-full grid grid-cols-5">
          <button
            onClick={() => go("/home", "home")}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] ${
              activeTab === "home"
                ? "text-[#2D6BFF] font-semibold"
                : "text-slate-500"
            }`}
          >
            <span className="text-lg leading-none">🏠</span>
            <span>Home</span>
          </button>

          <button
            onClick={() => go("/explore", "explore")}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] ${
              activeTab === "explore"
                ? "text-[#2D6BFF] font-semibold"
                : "text-slate-500"
            }`}
          >
            <span className="text-lg leading-none">🧭</span>
            <span>Explore</span>
          </button>

          <button
            onClick={() => go("/create", "create")}
            className="flex flex-col items-center justify-center gap-1 text-[11px]"
          >
            <span className="text-lg leading-none">➕</span>
            <span className="text-slate-700 font-semibold">Create</span>
          </button>

          <button
            onClick={() => go("/events", "events")}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] ${
              activeTab === "events"
                ? "text-[#2D6BFF] font-semibold"
                : "text-slate-500"
            }`}
          >
            <span className="text-lg leading-none">📅</span>
            <span>Events</span>
          </button>

          <button
            onClick={() => go("/profile", "profile")}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] ${
              activeTab === "profile"
                ? "text-[#2D6BFF] font-semibold"
                : "text-slate-500"
            }`}
          >
            <span className="text-lg leading-none">👤</span>
            <span>Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}