"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../navigation/Header";
import BottomNav from "../navigation/BottomNav";

import {
  SAVED_REQUESTS_KEY,
  addRequestApplicant,
  getAppliedRequestIds,
  getMyRequests,
  getProfileDisplayName,
  getProfileRoleLabel,
  removeRequestApplicant,
  saveAppliedRequestIds,
  saveSavedRequestIds,
  type CollaborationPost,
} from "@/lib/collaboration";

type ExploreView =
  | "recommended"
  | "requests"
  | "my-requests"
  | "interests"
  | "startup-spotlight";

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
  const [view, setView] = useState<ExploreView>("recommended");
  const [activeInterest, setActiveInterest] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [appliedIds, setAppliedIds] = useState<number[]>([]);
  const [myRequests, setMyRequests] = useState<CollaborationPost[]>([]);

  useEffect(() => {
    setName(getDisplayName());

    try {
      const raw = localStorage.getItem(SAVED_REQUESTS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setSavedIds(parsed);
    } catch {}

    try {
      setAppliedIds(getAppliedRequestIds());
    } catch {
      setAppliedIds([]);
    }

    try {
      setMyRequests(getMyRequests());
    } catch {
      setMyRequests([]);
    }
  }, []);

  const go = (path: string) => {
    router.push(path);
  };

  const toggleSave = (id: number) => {
    const next = savedIds.includes(id)
      ? savedIds.filter((x) => x !== id)
      : [...savedIds, id];

    setSavedIds(next);
    saveSavedRequestIds(next);
  };

  const toggleApply = (id: number) => {
    const next = appliedIds.includes(id)
      ? appliedIds.filter((x) => x !== id)
      : [...appliedIds, id];

    setAppliedIds(next);
    saveAppliedRequestIds(next);

    if (appliedIds.includes(id)) {
      removeRequestApplicant(id, getProfileDisplayName());
    } else {
      addRequestApplicant({
        requestId: id,
        applicantName: getProfileDisplayName(),
        applicantRole: getProfileRoleLabel(),
      });
    }
  };

  const allRequests = useMemo(() => {
    const mine = [...myRequests];
    const others = mockAllRequests.filter(
      (mock) => !mine.some((item) => item.id === mock.id),
    );

    return [...mine, ...others];
  }, [myRequests]);

  const baseList = useMemo(() => {
    if (view === "startup-spotlight") return [];
    if (view === "recommended") return allRequests.slice(0, 3);
    if (view === "requests") return allRequests;
    if (view === "my-requests") return myRequests;
    return allRequests;
  }, [view, myRequests, allRequests]);

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
            ? "border-[var(--text-main)] bg-[var(--surface-solid)]"
            : "border-[var(--line-soft)] bg-[var(--surface-solid)] hover:shadow-md"
        }`}
      >
        <div className="text-2xl">{emoji}</div>
        <div className="mt-2 font-bold text-[var(--text-main)]">{title}</div>
        <div className="mt-1 text-xs text-[var(--text-muted-2)]">{subtitle}</div>
      </button>
    );
  };

  const renderStartupSpotlight = () => {
    const tags = ["Collaboration", "Startups", "Universities", "Mobile-first"];
    const stack = ["Next.js", "Tailwind", "Node/Nest (API)", "Postgres/Mongo (later)"];

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--line-soft)] bg-[var(--muted)] font-extrabold text-[var(--text-main)]">
                S
              </div>

              <div className="min-w-0">
                <div className="truncate text-base font-extrabold text-[var(--text-main)]">
                  SphereNet
                </div>
                <div className="mt-1 text-xs text-[var(--text-muted-2)]">
                  Startup × University Collaboration Platform
                </div>
              </div>
            </div>

            <span className="inline-flex h-8 shrink-0 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[var(--muted)] px-3 text-[11px] font-semibold leading-none text-[var(--text-main)]">
              This week
            </span>
          </div>

          <p className="mt-3 text-sm text-[var(--text-muted-2)]">
            SphereNet helps startups and students collaborate through skill-based matching,
            project requests, milestones, and verified profiles — built mobile-first.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-[var(--muted)] px-2 py-1 text-xs text-[var(--text-muted-2)]"
              >
                {t}
              </span>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-3">
              <div className="text-xs text-[var(--text-muted-2)]">Focus</div>
              <div className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                Projects • Requests • Cohorts
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-3">
              <div className="text-xs text-[var(--text-muted-2)]">Weekly Podcast</div>
              <div className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                Founder story + product demo
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-semibold text-[var(--text-main)]">Tech Stack</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {stack.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-[var(--muted)] px-2 py-1 text-xs text-[var(--text-main)]"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => go("/home")}
              className="flex-1 rounded-xl bg-[var(--muted)] px-4 py-2 text-sm font-semibold text-[var(--text-main)]"
            >
              View in Home
            </button>

            <button
              onClick={() => go("/create")}
              className="flex-1 rounded-xl bg-[var(--primary-btn-bg)] px-4 py-2 text-sm font-semibold text-[var(--primary-btn-text)]"
            >
              Create a Request
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="font-bold text-[var(--text-main)]">Podcast</div>
            <span className="text-xs text-[var(--text-muted-2)]">Episode #01 (demo)</span>
          </div>

          <div className="mt-2 text-sm text-[var(--text-muted-2)]">
            “Building SphereNet: matching students to real startup work”
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--muted)]">
              <div className="h-full w-[35%] bg-[var(--text-main)]" />
            </div>
            <div className="text-xs text-[var(--text-muted-2)]">3:12</div>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => alert("Demo: play podcast")}
              className="rounded-xl bg-[var(--primary-btn-bg)] px-4 py-2 text-sm font-semibold text-[var(--primary-btn-text)]"
            >
              ▶ Play
            </button>
            <button
              onClick={() => alert("Demo: open details")}
              className="rounded-xl bg-[var(--muted)] px-4 py-2 text-sm font-semibold text-[var(--text-main)]"
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
        className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-4 shadow-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-bold text-[var(--text-main)]">{p.title}</div>
            <div className="mt-1 text-xs text-[var(--text-muted-2)]">
              {p.by} • {p.role}
            </div>
          </div>

          <button
            onClick={() => toggleSave(p.id)}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
              saved
                ? "border-[var(--text-main)] bg-[var(--text-main)] text-white"
                : "border-[var(--line-soft)] bg-[var(--surface-solid)] text-[var(--text-muted-2)]"
            }`}
            title={saved ? "Saved" : "Save"}
            aria-label={saved ? "Saved" : "Save"}
          >
            {saved ? "★" : "☆"}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-[var(--muted)] px-2 py-1 text-xs text-[var(--text-main)]">
            {p.type}
          </span>
          <span className="rounded-full bg-[var(--muted)] px-2 py-1 text-xs text-[var(--text-main)]">
            {p.mode}
          </span>
          <span className="rounded-full bg-[var(--muted)] px-2 py-1 text-xs text-[var(--text-main)]">
            {p.hours}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {p.skills.map((s) => (
            <span
              key={s}
              className="rounded-full bg-[var(--muted)] px-2 py-1 text-xs text-[var(--text-main)]"
            >
              {s}
            </span>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => router.push(`/explore/${p.id}`)}
            className="flex-1 rounded-xl bg-[var(--muted)] px-4 py-2 text-sm font-semibold text-[var(--text-main)]"
          >
            View
          </button>

          <button
            onClick={() => toggleApply(p.id)}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold ${
              applied
                ? "bg-[var(--muted)] text-[var(--text-main)]"
                : "bg-[var(--primary-btn-bg)] text-[var(--primary-btn-text)]"
            }`}
          >
            {applied ? "Applied ✓" : "Apply"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="sync-theme-page sync-page-with-bottom-nav min-h-screen">
      <Header
        title="Explore"
        subtitle={`Discover collaborations, ${name}`}
        showNotificationDot={true}
      />

      <div className="mx-auto w-full max-w-[480px] px-4 pb-4">
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--text-main)]">Explore Sections</h2>
            <button
              onClick={() => {
                setView("recommended");
                setActiveInterest(null);
                setQuery("");
              }}
              className="text-sm font-semibold text-[var(--text-main)]"
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

        {view === "startup-spotlight" && (
          <section className="mb-6">{renderStartupSpotlight()}</section>
        )}

        {view === "interests" && (
          <section className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-main)]">Choose an Interest</h2>
              {activeInterest && (
                <button
                  onClick={() => setActiveInterest(null)}
                  className="text-sm font-semibold text-[var(--text-main)]"
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
                    className={`rounded-2xl border bg-[var(--surface-solid)] p-4 shadow-sm text-left transition ${
                      active
                        ? "border-[var(--text-main)]"
                        : "border-[var(--line-soft)] hover:shadow-md"
                    }`}
                  >
                    <div className="text-2xl">{i.emoji}</div>
                    <div className="mt-2 font-bold text-[var(--text-main)]">{i.label}</div>
                    <div className="mt-1 text-xs text-[var(--text-muted-2)]">
                      Tap to filter posts
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {view !== "startup-spotlight" && (
          <div className="mb-6">
            <div className="flex items-center gap-3 rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 shadow-sm">
              <span className="text-[var(--text-muted-2)]">🔎</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title, skills, people..."
                className="w-full bg-transparent text-sm text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted-2)]"
              />
            </div>
          </div>
        )}

        {view !== "startup-spotlight" && (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-main)]">{sectionTitle}</h2>
              <span className="text-sm text-[var(--text-muted-2)]">{visible.length} items</span>
            </div>

            <section className="space-y-4">
              {visible.length === 0 ? (
                <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-6 text-center shadow-sm">
                  <div className="text-2xl">🧭</div>
                  <div className="mt-2 font-semibold text-[var(--text-main)]">Nothing found</div>
                  <div className="mt-1 text-sm text-[var(--text-muted-2)]">
                    Try a different search.
                  </div>
                </div>
              ) : (
                visible.map(renderCard)
              )}
            </section>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}