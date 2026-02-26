"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type FooterTab = "home" | "explore" | "create" | "events" | "profile";

type ExploreView =
  | "recommended"
  | "requests"
  | "my-requests"
  | "interests"
  | "startup-spotlight";

type CollaborationPost = {
  id: number;
  title: string;
  by: string;
  role: string;
  skills: string[];
  type: "Public" | "Private";
  mode: "Online" | "In-person";
  hours: string;
  interestTags: string[];
};

const mockAllRequests: CollaborationPost[] = [
  {
    id: 201,
    title: "Robotics Sensor Fusion Prototype",
    by: "Sanjay",
    role: "Research Student",
    skills: ["Robotics", "Python", "ROS"],
    type: "Public",
    mode: "In-person",
    hours: "6-10 hrs/week",
    interestTags: ["robotics", "ai"],
  },
  {
    id: 202,
    title: "Build AI Resume Analyzer",
    by: "Rahul",
    role: "Startup Founder",
    skills: ["React", "Node.js", "AI"],
    type: "Public",
    mode: "Online",
    hours: "5-8 hrs/week",
    interestTags: ["data-science", "ai", "web-dev"],
  },
  {
    id: 203,
    title: "Data Science — Churn Prediction",
    by: "Meghana",
    role: "Student",
    skills: ["Python", "Pandas", "ML"],
    type: "Public",
    mode: "Online",
    hours: "4-6 hrs/week",
    interestTags: ["data-science", "ai"],
  },
  {
    id: 204,
    title: "Startup Landing Page UI Revamp",
    by: "Ayesha",
    role: "Designer",
    skills: ["UI/UX", "Figma"],
    type: "Public",
    mode: "Online",
    hours: "3-5 hrs/week",
    interestTags: ["design", "web-dev"],
  },
  {
    id: 205,
    title: "Mobile App Backend APIs",
    by: "Kiran",
    role: "Freelancer",
    skills: ["Next.js", "MongoDB"],
    type: "Public",
    mode: "Online",
    hours: "6-10 hrs/week",
    interestTags: ["web-dev"],
  },
];

const INTERESTS = [
  { key: "robotics", label: "Robotics", emoji: "🤖" },
  { key: "data-science", label: "Data Science", emoji: "📊" },
  { key: "web-dev", label: "Web Dev", emoji: "🌐" },
  { key: "design", label: "Design", emoji: "🎨" },
  { key: "ai", label: "AI", emoji: "🧠" },
];

const SAVED_KEY = "savedRequests_v1";
const MY_REQUESTS_KEY = "myRequests_v1";

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

export default function ExplorePage() {
  const router = useRouter();

  const [name, setName] = useState("User");
  const [footerTab, setFooterTab] = useState<FooterTab>("explore");

  const [view, setView] = useState<ExploreView>("recommended");
  const [activeInterest, setActiveInterest] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [appliedIds, setAppliedIds] = useState<number[]>([]);
  const [myRequests, setMyRequests] = useState<CollaborationPost[]>([]);

  useEffect(() => {
    setName(getDisplayName());

    try {
      const raw = localStorage.getItem(SAVED_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setSavedIds(parsed);
    } catch {}

    try {
      const raw = localStorage.getItem(MY_REQUESTS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setMyRequests(parsed);
      else setMyRequests([]);
    } catch {
      setMyRequests([]);
    }
  }, []);

  const go = (path: string, ftab?: FooterTab) => {
    if (ftab) setFooterTab(ftab);
    router.push(path);
  };

  const toggleSave = (id: number) => {
    const next = savedIds.includes(id)
      ? savedIds.filter((x) => x !== id)
      : [...savedIds, id];

    setSavedIds(next);
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  };

  const toggleApply = (id: number) => {
    const next = appliedIds.includes(id)
      ? appliedIds.filter((x) => x !== id)
      : [...appliedIds, id];

    setAppliedIds(next);
  };

  const baseList = useMemo(() => {
    if (view === "startup-spotlight") return [];
    if (view === "recommended") return mockAllRequests.slice(0, 3);
    if (view === "requests") return mockAllRequests;
    if (view === "my-requests") return myRequests;
    return mockAllRequests;
  }, [view, myRequests]);

  const visible = useMemo(() => {
    let list = baseList;

    if (view === "interests" && activeInterest) {
      list = list.filter((p) => p.interestTags.includes(activeInterest));
    }

    const q = query.trim().toLowerCase();
    if (!q) return list;

    return list.filter((p) => {
      const hay =
        `${p.title} ${p.by} ${p.role} ${p.skills.join(" ")} ${p.mode} ${p.type} ${p.hours}`.toLowerCase();
      return hay.includes(q);
    });
  }, [baseList, query, view, activeInterest]);

  const sectionTitle = useMemo(() => {
    if (view === "startup-spotlight") return "Startup Spotlight";
    if (view === "recommended") return "Recommended for you";
    if (view === "requests") return "All Requests";
    if (view === "my-requests") return "My Requests";
    return activeInterest
      ? `Interest: ${INTERESTS.find((x) => x.key === activeInterest)?.label ?? activeInterest}`
      : "Pick an Interest";
  }, [view, activeInterest]);

  const SectionButton = ({
    title,
    subtitle,
    emoji,
    isActive,
    onClick,
  }: {
    title: string;
    subtitle: string;
    emoji: string;
    isActive: boolean;
    onClick: () => void;
  }) => {
    return (
      <button
        onClick={onClick}
        className={`min-w-[220px] rounded-2xl border p-4 shadow-sm text-left transition ${
          isActive
            ? "border-[#2D6BFF] bg-white"
            : "border-slate-200 bg-white hover:shadow-md"
        }`}
      >
        <div className="text-2xl">{emoji}</div>
        <div className="mt-2 font-bold">{title}</div>
        <div className="text-xs text-slate-500 mt-1">{subtitle}</div>
      </button>
    );
  };

  const renderStartupSpotlight = () => {
    const tags = ["Collaboration", "Startups", "Universities", "Mobile-first"];
    const stack = ["Next.js", "Tailwind", "Node/Nest (API)", "Postgres/Mongo (later)"];

    return (
      <div className="space-y-4">
        {/* Main spotlight card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-12 w-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center font-extrabold text-slate-700">
                S
              </div>

              <div className="min-w-0">
                <div className="text-base font-extrabold truncate">SphereNet</div>
                <div className="text-xs text-slate-500 mt-1">
                  Startup × University Collaboration Platform
                </div>
              </div>
            </div>

            <span className="shrink-0 inline-flex items-center justify-center h-8 px-3 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100 text-[11px] leading-none">
  This week
</span>
          </div>

          {/* short description */}
          <p className="mt-3 text-sm text-slate-600">
            SphereNet helps startups and students collaborate through skill-based matching,
            project requests, milestones, and verified profiles — built mobile-first.
          </p>

          {/* tags */}
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((t) => (
              <span
                key={t}
                className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600"
              >
                {t}
              </span>
            ))}
          </div>

          {/* what’s included */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="text-xs text-slate-500">Focus</div>
              <div className="mt-1 text-sm font-semibold">
                Projects • Requests • Cohorts
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="text-xs text-slate-500">Weekly Podcast</div>
              <div className="mt-1 text-sm font-semibold">
                Founder story + product demo
              </div>
            </div>
          </div>

          {/* stack */}
          <div className="mt-4">
            <div className="text-sm font-semibold">Tech Stack</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {stack.map((s) => (
                <span
                  key={s}
                  className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* actions */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => go("/home", "home")}
              className="flex-1 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold"
            >
              View in Home
            </button>

            <button
              onClick={() => go("/create", "create")}
              className="flex-1 px-4 py-2 rounded-xl bg-[#2D6BFF] text-white text-sm font-semibold"
            >
              Create a Request
            </button>
          </div>
        </div>

        {/* Podcast card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="font-bold">Podcast</div>
            <span className="text-xs text-slate-500">Episode #01 (demo)</span>
          </div>

          <div className="mt-2 text-sm text-slate-600">
            “Building SphereNet: matching students to real startup work”
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-slate-300 w-[35%]" />
            </div>
            <div className="text-xs text-slate-500">3:12</div>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => alert("Demo: play podcast")}
              className="px-4 py-2 rounded-xl bg-[#2D6BFF] text-white text-sm font-semibold"
            >
              ▶ Play
            </button>
            <button
              onClick={() => alert("Demo: open details")}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCard = (p: CollaborationPost) => {
    const saved = savedIds.includes(p.id);
    const applied = appliedIds.includes(p.id);

    return (
      <div
        key={p.id}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-bold">{p.title}</div>
            <div className="text-xs text-slate-500 mt-1">
              {p.by} • {p.role}
            </div>
          </div>

          <button
            onClick={() => toggleSave(p.id)}
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

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-slate-100">
            {p.type}
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-slate-100">
            {p.mode}
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-slate-100">
            {p.hours}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {p.skills.map((s) => (
            <span
              key={s}
              className="text-xs px-2 py-1 rounded-full bg-slate-100"
            >
              {s}
            </span>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => alert(`Demo: open request ${p.id}`)}
            className="flex-1 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold"
          >
            View
          </button>

          <button
            onClick={() => toggleApply(p.id)}
            className={`flex-1 px-4 py-2 rounded-xl text-sm font-semibold ${
              applied
                ? "bg-emerald-100 text-emerald-700"
                : "bg-[#2D6BFF] text-white"
            }`}
          >
            {applied ? "Applied ✓" : "Apply"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-24 bg-[#F4F6FB] text-slate-900 px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Explore</h1>
          <p className="text-slate-500 text-sm">
            Discover collaborations, {name}
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

      {/* Explore Sections */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Explore Sections</h2>
          <button
            onClick={() => {
              setView("recommended");
              setActiveInterest(null);
              setQuery("");
            }}
            className="text-sm font-semibold text-[#2D6BFF]"
          >
            Reset
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2">
          <SectionButton
            title="Recommended"
            subtitle="AI-matched suggestions (demo)"
            emoji="✨"
            isActive={view === "recommended"}
            onClick={() => {
              setView("recommended");
              setActiveInterest(null);
              setQuery("");
            }}
          />

          <SectionButton
            title="Requests"
            subtitle="Browse all public requests"
            emoji="📌"
            isActive={view === "requests"}
            onClick={() => {
              setView("requests");
              setActiveInterest(null);
              setQuery("");
            }}
          />

          {/* ✅ NEW: Startup Spotlight */}
          <SectionButton
            title="Startup Spotlight"
            subtitle="Weekly startup podcast + details"
            emoji="🎙️"
            isActive={view === "startup-spotlight"}
            onClick={() => {
              setView("startup-spotlight");
              setActiveInterest(null);
              setQuery("");
            }}
          />

          <SectionButton
            title="My Requests"
            subtitle="Requests you posted"
            emoji="🧾"
            isActive={view === "my-requests"}
            onClick={() => {
              setView("my-requests");
              setActiveInterest(null);
              setQuery("");
            }}
          />

          <SectionButton
            title="Interests"
            subtitle="Robotics, Data Science, Web…"
            emoji="🧠"
            isActive={view === "interests"}
            onClick={() => {
              setView("interests");
              setActiveInterest(null);
              setQuery("");
            }}
          />
        </div>
      </section>

      {/* Spotlight view */}
      {view === "startup-spotlight" && (
        <section className="mb-6">{renderStartupSpotlight()}</section>
      )}

      {/* Interests tiles */}
      {view === "interests" && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Choose an Interest</h2>
            {activeInterest && (
              <button
                onClick={() => setActiveInterest(null)}
                className="text-sm font-semibold text-[#2D6BFF]"
              >
                Clear
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {INTERESTS.map((i) => {
              const active = activeInterest === i.key;
              return (
                <button
                  key={i.key}
                  onClick={() => setActiveInterest(i.key)}
                  className={`rounded-2xl border bg-white p-4 shadow-sm text-left transition ${
                    active
                      ? "border-[#2D6BFF]"
                      : "border-slate-200 hover:shadow-md"
                  }`}
                >
                  <div className="text-2xl">{i.emoji}</div>
                  <div className="mt-2 font-bold">{i.label}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    Tap to filter posts
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Search (hide for spotlight) */}
      {view !== "startup-spotlight" && (
        <div className="mb-6">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-4 py-3 flex items-center gap-3">
            <span className="text-slate-400">🔎</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, skills, people..."
              className="w-full outline-none text-sm"
            />
          </div>
        </div>
      )}

      {/* Title + List (hide list for spotlight) */}
      {view !== "startup-spotlight" && (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">{sectionTitle}</h2>
            <span className="text-sm text-slate-500">{visible.length} items</span>
          </div>

          <section className="space-y-4">
            {visible.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center">
                <div className="text-2xl">🧭</div>
                <div className="mt-2 font-semibold">Nothing found</div>
                <div className="text-sm text-slate-500 mt-1">
                  Try a different search.
                </div>
              </div>
            ) : (
              visible.map(renderCard)
            )}
          </section>
        </>
      )}

      {/* Footer */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 z-40">
        <div className="h-full grid grid-cols-5">
          <button
            onClick={() => go("/home", "home")}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] ${
              footerTab === "home"
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
              footerTab === "explore"
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
              footerTab === "events"
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
              footerTab === "profile"
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