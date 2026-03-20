"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type FooterTab = "home" | "explore" | "create" | "events" | "profile";

type ExploreView =
  | "recommended"
  | "requests"
  | "my-requests"
  | "interests"
  | "startup-spotlight";

type ProjectVisibilityMode = "matching-only" | "open" | "hybrid";

type ExperienceLevel = "junior" | "mid" | "senior" | "any";

type Creator = {
  id?: string;
  firstname?: string;
  lastname?: string;
  headline?: string;
  bio?: string;
  profilePicture?: string;
  currentCompany?: string;
  currentPosition?: string;
};

type BackendProject = {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  requiredDomains: string[];
  optionalSkills?: string[];
  preferredExperienceLevel?: ExperienceLevel;
  maxCohortSize: number;
  status: string;
  visibilityMode: ProjectVisibilityMode;
  matchingScope?: "GLOBAL" | "COMMUNITY" | "CLUB";
  createdAt: string;
  updatedAt: string;
  creator?: Creator;
};

type ProjectsListResponse = {
  projects: BackendProject[];
  total: number;
  limit: number;
  offset: number;
};

type MyInterestProject = {
  id: string;
  title: string;
  description: string;
  requiredSkills?: string[];
  requiredDomains?: string[];
  visibilityMode?: ProjectVisibilityMode;
  creator?: Creator;
};

type BackendInterest = {
  id: string;
  projectId: string;
  userId: string;
  interestText: string;
  createdAt: string;
  project?: MyInterestProject;
};

type ExploreCard = {
  id: string;
  title: string;
  by: string;
  role: string;
  skills: string[];
  domains: string[];
  type: string;
  mode: string;
  hours: string;
  interestTags: string[];
  description: string;
  visibilityMode: ProjectVisibilityMode;
  preferredExperienceLevel?: ExperienceLevel;
  maxCohortSize: number;
  status: string;
  createdAt?: string;
};

const SAVED_REQUESTS_KEY = "saved_request_ids_v2";

const INTERESTS = [
  { key: "robotics", label: "Robotics", emoji: "🤖" },
  { key: "data-science", label: "Data Science", emoji: "📊" },
  { key: "web-dev", label: "Web Dev", emoji: "🌐" },
  { key: "design", label: "Design", emoji: "🎨" },
  { key: "ai", label: "AI", emoji: "🧠" },
];

function getDisplayNameFromLocalProfile(): string {
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

    const value = (candidates?.[0] ?? "User") as string;
    return value.trim() || "User";
  } catch {
    return "User";
  }
}

function getSavedRequestIds(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_REQUESTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function saveSavedRequestIds(ids: string[]) {
  localStorage.setItem(SAVED_REQUESTS_KEY, JSON.stringify(ids));
}

function getCreatorName(creator?: Creator): string {
  const fullName = [creator?.firstname, creator?.lastname]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (fullName) return fullName;
  if (creator?.currentCompany) return creator.currentCompany;
  return "Unknown user";
}

function getCreatorRole(creator?: Creator): string {
  return (
    creator?.headline ||
    creator?.currentPosition ||
    creator?.currentCompany ||
    "Collaborator"
  );
}

function getInterestTagsFromProject(project: BackendProject): string[] {
  const source = [
    ...(project.requiredSkills || []),
    ...(project.requiredDomains || []),
    ...(project.optionalSkills || []),
    project.title,
    project.description,
  ]
    .join(" ")
    .toLowerCase();

  const tags: string[] = [];

  if (
    source.includes("robot") ||
    source.includes("ros") ||
    source.includes("sensor")
  ) {
    tags.push("robotics");
  }

  if (
    source.includes("data") ||
    source.includes("analytics") ||
    source.includes("machine learning") ||
    source.includes("ml") ||
    source.includes("python") ||
    source.includes("ai")
  ) {
    tags.push("data-science");
  }

  if (
    source.includes("react") ||
    source.includes("node") ||
    source.includes("web") ||
    source.includes("frontend") ||
    source.includes("backend") ||
    source.includes("next")
  ) {
    tags.push("web-dev");
  }

  if (
    source.includes("design") ||
    source.includes("ui") ||
    source.includes("ux") ||
    source.includes("figma")
  ) {
    tags.push("design");
  }

  if (source.includes("ai") || source.includes("llm")) {
    tags.push("ai");
  }

  return tags.length > 0 ? [...new Set(tags)] : ["web-dev"];
}

function mapVisibilityModeToLabel(mode: ProjectVisibilityMode): string {
  if (mode === "matching-only") return "Invite Only";
  if (mode === "hybrid") return "Public + Matched";
  return "Public";
}

function mapExperienceToHours(level?: ExperienceLevel): string {
  if (level === "junior") return "4-8 hrs/week";
  if (level === "mid") return "6-10 hrs/week";
  if (level === "senior") return "8-12 hrs/week";
  return "Flexible";
}

function mapProjectToCard(project: BackendProject): ExploreCard {
  return {
    id: project.id,
    title: project.title,
    by: getCreatorName(project.creator),
    role: getCreatorRole(project.creator),
    skills: project.requiredSkills || [],
    domains: project.requiredDomains || [],
    type: mapVisibilityModeToLabel(project.visibilityMode),
    mode:
      project.matchingScope === "COMMUNITY"
        ? "Community"
        : project.matchingScope === "CLUB"
          ? "Club"
          : "Global",
    hours: mapExperienceToHours(project.preferredExperienceLevel),
    interestTags: getInterestTagsFromProject(project),
    description: project.description,
    visibilityMode: project.visibilityMode,
    preferredExperienceLevel: project.preferredExperienceLevel,
    maxCohortSize: project.maxCohortSize,
    status: project.status,
    createdAt: project.createdAt,
  };
}

export default function ExplorePage() {
  const router = useRouter();

  const [name, setName] = useState("User");
  const [footerTab, setFooterTab] = useState<FooterTab>("explore");
  const [view, setView] = useState<ExploreView>("recommended");
  const [activeInterest, setActiveInterest] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [appliedProjectIds, setAppliedProjectIds] = useState<string[]>([]);

  const [projects, setProjects] = useState<BackendProject[]>([]);
  const [myProjects, setMyProjects] = useState<BackendProject[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [applyingProjectId, setApplyingProjectId] = useState<string | null>(null);

  useEffect(() => {
    setName(getDisplayNameFromLocalProfile());
    setSavedIds(getSavedRequestIds());
    void loadExploreData();
  }, []);

  async function loadExploreData() {
    setIsLoading(true);
    setPageError("");

    try {
      const [projectsResponse, myProjectsResponse, myInterestsResponse] =
        await Promise.all([
          apiFetch<ProjectsListResponse>("/projects"),
          apiFetch<BackendProject[]>("/projects/my-requests"),
          apiFetch<BackendInterest[]>("/project-interests/me"),
        ]);

      setProjects(projectsResponse.projects || []);
      setMyProjects(myProjectsResponse || []);
      setAppliedProjectIds(
        (myInterestsResponse || []).map((interest) => String(interest.projectId)),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load explore data";

      setPageError(message);

      if (message === "Unauthorized") {
        router.push("/signup");
      }
    } finally {
      setIsLoading(false);
    }
  }

  const go = (path: string, ftab?: FooterTab) => {
    if (ftab) setFooterTab(ftab);
    router.push(path);
  };

  const toggleSave = (id: string) => {
    const next = savedIds.includes(id)
      ? savedIds.filter((x) => x !== id)
      : [...savedIds, id];

    setSavedIds(next);
    saveSavedRequestIds(next);
  };

  const openApply = (projectId: string) => {
    router.push(`/explore/${projectId}`);
  };

  const allCards = useMemo(() => {
    const myIds = new Set(myProjects.map((project) => project.id));

    const combined = [
      ...myProjects.map(mapProjectToCard),
      ...projects
        .filter((project) => !myIds.has(project.id))
        .map(mapProjectToCard),
    ];

    return combined;
  }, [projects, myProjects]);

  const myRequestCards = useMemo(() => {
    return myProjects.map(mapProjectToCard);
  }, [myProjects]);

  const baseList = useMemo(() => {
    if (view === "startup-spotlight") return [] as ExploreCard[];
    if (view === "recommended") return allCards.slice(0, 3);
    if (view === "requests") return allCards;
    if (view === "my-requests") return myRequestCards;
    return allCards;
  }, [view, allCards, myRequestCards]);

  const visible = useMemo(() => {
    let list = baseList;

    if (view === "interests" && activeInterest) {
      list = list.filter((p) => p.interestTags.includes(activeInterest));
    }

    const search = query.trim().toLowerCase();
    if (!search) return list;

    return list.filter((p) => {
      const haystack = [
        p.title,
        p.by,
        p.role,
        p.skills.join(" "),
        p.domains.join(" "),
        p.mode,
        p.type,
        p.hours,
        p.description,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [baseList, query, view, activeInterest]);

  const sectionTitle = useMemo(() => {
    if (view === "startup-spotlight") return "Startup Spotlight";
    if (view === "recommended") return "Recommended for you";
    if (view === "requests") return "All Requests";
    if (view === "my-requests") return "My Requests";
    return activeInterest
      ? `Interest: ${
          INTERESTS.find((item) => item.key === activeInterest)?.label ||
          activeInterest
        }`
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
        className={`min-w-[220px] rounded-2xl border p-4 text-left shadow-sm transition ${
          isActive
            ? "border-[#2D6BFF] bg-white"
            : "border-slate-200 bg-white hover:shadow-md"
        }`}
      >
        <div className="text-2xl">{emoji}</div>
        <div className="mt-2 font-bold">{title}</div>
        <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
      </button>
    );
  };

  const renderStartupSpotlight = () => {
    const tags = ["Collaboration", "Startups", "Universities", "Mobile-first"];
    const stack = [
      "Next.js",
      "Tailwind",
      "NestJS API",
      "PostgreSQL",
      "AI Matching",
    ];

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-base font-extrabold">SphereNet</div>
              <div className="mt-1 text-xs text-slate-500">
                Startup × Student Collaboration Platform
              </div>
            </div>

            <span className="inline-flex h-8 shrink-0 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 px-3 text-[11px] font-semibold leading-none text-emerald-700">
              This week
            </span>
          </div>

          <p className="mt-3 text-sm text-slate-600">
            SphereNet helps startups and collaborators discover each other,
            apply to real opportunities, and form smart collaboration cohorts.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="text-xs text-slate-500">Focus</div>
              <div className="mt-1 text-sm font-semibold">
                Requests • Applicants • Cohorts
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="text-xs text-slate-500">Matching</div>
              <div className="mt-1 text-sm font-semibold">
                AI relevance-based ranking
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-semibold">Tech Stack</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {stack.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => go("/home", "home")}
              className="flex-1 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              View in Home
            </button>

            <button
              onClick={() => go("/create", "create")}
              className="flex-1 rounded-xl bg-[#2D6BFF] px-4 py-2 text-sm font-semibold text-white"
            >
              Create a Request
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCard = (project: ExploreCard) => {
    const saved = savedIds.includes(project.id);
    const applied = appliedProjectIds.includes(project.id);
    const isMine = myRequestCards.some((item) => item.id === project.id);

    return (
      <div
        key={project.id}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-bold">{project.title}</div>
            <div className="mt-1 text-xs text-slate-500">
              {project.by} • {project.role}
            </div>
          </div>

          <button
            onClick={() => toggleSave(project.id)}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
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
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
            {project.type}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
            {project.mode}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
            {project.hours}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
            Cohort {project.maxCohortSize}
          </span>
        </div>

        {project.description ? (
          <p className="mt-3 line-clamp-2 text-sm text-slate-600">
            {project.description}
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          {project.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-slate-100 px-2 py-1 text-xs"
            >
              {skill}
            </span>
          ))}
        </div>

        {project.domains.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {project.domains.map((domain) => (
              <span
                key={domain}
                className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700"
              >
                {domain}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => router.push(`/explore/${project.id}`)}
            className="flex-1 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            View
          </button>

          <button
            onClick={() => openApply(project.id)}
            disabled={isMine || applied || applyingProjectId === project.id}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold ${
              isMine
                ? "bg-slate-200 text-slate-500"
                : applied
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-[#2D6BFF] text-white"
            }`}
          >
            {isMine
              ? "Your Request"
              : applied
                ? "Applied ✓"
                : applyingProjectId === project.id
                  ? "Opening..."
                  : "Apply"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] px-4 py-6 pb-24 text-slate-900">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Explore</h1>
          <p className="text-sm text-slate-500">
            Discover collaborations, {name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            aria-label="Notifications"
            title="Notifications"
            onClick={() => go("/notifications")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
          >
            <span className="text-lg leading-none">🔔</span>
          </button>

          <button
            aria-label="QR"
            title="QR"
            onClick={() => go("/qr")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
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
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
          >
            <span className="text-lg leading-none">💬</span>
          </button>
        </div>
      </div>

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
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
            subtitle="Smart picks from live requests"
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
            subtitle="Browse all collaboration requests"
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
            subtitle="Platform story + ecosystem"
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
            subtitle="Filter by category"
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
            {INTERESTS.map((interest) => {
              const active = activeInterest === interest.key;

              return (
                <button
                  key={interest.key}
                  onClick={() => setActiveInterest(interest.key)}
                  className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition ${
                    active
                      ? "border-[#2D6BFF]"
                      : "border-slate-200 hover:shadow-md"
                  }`}
                >
                  <div className="text-2xl">{interest.emoji}</div>
                  <div className="mt-2 font-bold">{interest.label}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Tap to filter requests
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {view !== "startup-spotlight" && (
        <div className="mb-6">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="text-slate-400">🔎</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, skills, domains, people..."
              className="w-full text-sm outline-none"
            />
          </div>
        </div>
      )}

      {pageError ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {pageError}
        </div>
      ) : null}

      {isLoading ? (
        <section className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="h-5 w-2/3 rounded bg-slate-200" />
              <div className="mt-3 h-4 w-1/3 rounded bg-slate-200" />
              <div className="mt-4 h-4 w-full rounded bg-slate-200" />
              <div className="mt-2 h-4 w-5/6 rounded bg-slate-200" />
            </div>
          ))}
        </section>
      ) : view !== "startup-spotlight" ? (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{sectionTitle}</h2>
            <span className="text-sm text-slate-500">{visible.length} items</span>
          </div>

          <section className="space-y-4">
            {visible.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                <div className="text-2xl">🧭</div>
                <div className="mt-2 font-semibold">Nothing found</div>
                <div className="mt-1 text-sm text-slate-500">
                  Try a different filter or search.
                </div>
              </div>
            ) : (
              visible.map(renderCard)
            )}
          </section>
        </>
      ) : null}

      <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-slate-200 bg-white">
        <div className="grid h-full grid-cols-5">
          <button
            onClick={() => go("/home", "home")}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] ${
              footerTab === "home"
                ? "font-semibold text-[#2D6BFF]"
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
                ? "font-semibold text-[#2D6BFF]"
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
            <span className="font-semibold text-slate-700">Create</span>
          </button>

          <button
            onClick={() => go("/events", "events")}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] ${
              footerTab === "events"
                ? "font-semibold text-[#2D6BFF]"
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
                ? "font-semibold text-[#2D6BFF]"
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