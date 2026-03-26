"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../navigation/Header";
import BottomNav from "../navigation/BottomNav";
import { apiRequest } from "@/lib/api";
import {
  SAVED_REQUESTS_KEY,
  saveSavedRequestIds,
} from "@/lib/collaboration";

type ExploreView =
  | "recommended"
  | "requests"
  | "my-requests"
  | "interests"
  | "startup-spotlight";

type BackendProject = {
  id: string;
  title: string;
  description: string;
  requiredSkills?: string[];
  requiredDomains?: string[];
  optionalSkills?: string[];
  preferredExperienceLevel?: "junior" | "mid" | "senior" | "any" | null;
  maxCohortSize?: number;
  visibilityMode?: "matching-only" | "open" | "hybrid";
  status?: string;
  creatorId?: string;
  createdAt?: string;
  creator?: {
    id?: string;
    firstname?: string;
    lastname?: string;
    headline?: string;
    currentPosition?: string;
    currentCompany?: string;
  };
};

type ProjectsEnvelope = {
  projects?: BackendProject[];
  total?: number;
  limit?: number;
  offset?: number;
};

type NotificationItem = {
  id: string;
  projectId?: string;
  notificationType?: "match" | "selected" | "rejected" | string;
  notifiedAt?: string;
  project?: BackendProject;
};

type NotificationsEnvelope = {
  notifications?: NotificationItem[];
};

type MyInterestItem = {
  id: string;
  projectId?: string;
  createdAt?: string;
  project?: BackendProject;
};

type InterestsEnvelope = {
  interests?: MyInterestItem[];
};

type ExploreCard = {
  id: string;
  title: string;
  by: string;
  role: string;
  skills: string[];
  type: "Public" | "Private";
  mode: "Online";
  hours: string;
  interestTags: string[];
  shortDesc?: string;
  problem?: string;
  experience?: string;
  createdAt?: string;
  isMine?: boolean;
  status?: string;
};

const INTERESTS = [
  { key: "robotics", label: "Robotics", emoji: "🤖" },
  { key: "data-science", label: "Data Science", emoji: "📊" },
  { key: "web-dev", label: "Web Dev", emoji: "🌐" },
  { key: "design", label: "Design", emoji: "🎨" },
  { key: "ai", label: "AI", emoji: "🧠" },
];

function normalizeProjectsResponse(
  input: BackendProject[] | ProjectsEnvelope | null | undefined,
): BackendProject[] {
  if (Array.isArray(input)) return input;
  if (input && Array.isArray(input.projects)) return input.projects;
  return [];
}

function normalizeInterestsResponse(
  input: MyInterestItem[] | InterestsEnvelope | null | undefined,
): MyInterestItem[] {
  if (Array.isArray(input)) return input;
  if (input && Array.isArray(input.interests)) return input.interests;
  return [];
}

function normalizeNotificationsResponse(
  input: NotificationItem[] | NotificationsEnvelope | null | undefined,
): NotificationItem[] {
  if (Array.isArray(input)) return input;
  if (input && Array.isArray(input.notifications)) return input.notifications;
  return [];
}

function experienceLabel(value?: string | null) {
  if (!value) return "";
  if (value === "junior") return "Beginner";
  if (value === "mid") return "Intermediate";
  if (value === "senior") return "Advanced";
  return "Any";
}

function formatStatusLabel(value?: string) {
  if (!value) return "";
  if (value === "in_progress") return "In Progress";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function toInterestTags(project: BackendProject): string[] {
  const text = [
    ...(project.requiredSkills || []),
    ...(project.requiredDomains || []),
    project.title || "",
    project.description || "",
  ]
    .join(" ")
    .toLowerCase();

  const tags = new Set<string>();

  if (text.includes("robot") || text.includes("ros") || text.includes("sensor")) {
    tags.add("robotics");
  }
  if (
    text.includes("data science") ||
    text.includes("pandas") ||
    text.includes("analytics") ||
    text.includes("machine learning") ||
    text.includes("ml")
  ) {
    tags.add("data-science");
  }
  if (
    text.includes("react") ||
    text.includes("node") ||
    text.includes("next") ||
    text.includes("frontend") ||
    text.includes("backend") ||
    text.includes("web") ||
    text.includes("javascript") ||
    text.includes("typescript") ||
    text.includes("angular")
  ) {
    tags.add("web-dev");
  }
  if (
    text.includes("design") ||
    text.includes("ui") ||
    text.includes("ux") ||
    text.includes("figma")
  ) {
    tags.add("design");
  }
  if (
    text.includes("ai") ||
    text.includes("artificial intelligence") ||
    text.includes("llm") ||
    text.includes("gpt")
  ) {
    tags.add("ai");
  }

  return Array.from(tags);
}

function mapProjectToCard(project: BackendProject, isMine = false): ExploreCard {
  const firstname = project.creator?.firstname?.trim() || "";
  const lastname = project.creator?.lastname?.trim() || "";
  const fullName = `${firstname} ${lastname}`.trim();

  const role =
    project.creator?.headline?.trim() ||
    project.creator?.currentPosition?.trim() ||
    project.creator?.currentCompany?.trim() ||
    "Collaborator";

  const desc = project.description || "";
  const parts = desc.split("\n\n");

  return {
    id: project.id,
    title: project.title || "Untitled Request",
    by: fullName || "User",
    role,
    skills: project.requiredSkills || [],
    type: project.visibilityMode === "matching-only" ? "Private" : "Public",
    mode: "Online",
    hours: `${project.maxCohortSize || 5} members max`,
    interestTags: toInterestTags(project),
    shortDesc: parts[0] || desc,
    problem: parts.slice(1).join("\n\n") || desc,
    experience: experienceLabel(project.preferredExperienceLevel),
    createdAt: project.createdAt,
    isMine,
    status: project.status,
  };
}

export default function ExplorePage() {
  const router = useRouter();

  const [name, setName] = useState("User");
  const [view, setView] = useState<ExploreView>("requests");
  const [activeInterest, setActiveInterest] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);

  const [recommended, setRecommended] = useState<ExploreCard[]>([]);
  const [publicRequests, setPublicRequests] = useState<ExploreCard[]>([]);
  const [myRequests, setMyRequests] = useState<ExploreCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfileName() {
      try {
        const profile = await apiRequest<{
          firstname?: string;
          lastname?: string;
          username?: string;
        }>("/users/me/profile");

        const fullName =
          `${profile.firstname || ""} ${profile.lastname || ""}`.trim() ||
          profile.username ||
          "User";

        setName(fullName);
      } catch (err) {
        console.error("Failed to load explore profile name:", err);
        setName("User");
      }
    }

    try {
      const raw = localStorage.getItem(SAVED_REQUESTS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        setSavedIds(parsed.map(String));
      }
    } catch {
      setSavedIds([]);
    }

    loadProfileName();
  }, []);

  useEffect(() => {
    async function loadExploreData() {
      setLoading(true);
      setError("");

      try {
        const [projectsRaw, myProjectsRaw, myInterestsRaw, notificationsRaw] =
          await Promise.all([
            apiRequest<BackendProject[] | ProjectsEnvelope>("/projects"),
            apiRequest<BackendProject[] | ProjectsEnvelope>("/projects/my-requests"),
            apiRequest<MyInterestItem[] | InterestsEnvelope>("/project-interests/me"),
            apiRequest<NotificationItem[] | NotificationsEnvelope>("/notifications/projects"),
          ]);

        const projects = normalizeProjectsResponse(projectsRaw);
        const myProjects = normalizeProjectsResponse(myProjectsRaw);
        const myInterests = normalizeInterestsResponse(myInterestsRaw);
        const notifications = normalizeNotificationsResponse(notificationsRaw);

        const myProjectIds = new Set(myProjects.map((p) => p.id));

        const mappedPublic = projects.map((p) =>
          mapProjectToCard(p, myProjectIds.has(p.id)),
        );

        const mappedMine = myProjects.map((p) => mapProjectToCard(p, true));

        const matchedProjects = notifications
          .filter((n) => n.notificationType === "match" && n.project)
          .map((n) => n.project as BackendProject)
          .filter((p) => !myProjectIds.has(p.id));

        const uniqueRecommended = Array.from(
          new Map(matchedProjects.map((p) => [p.id, p])).values(),
        ).map((p) => mapProjectToCard(p, false));

        const appliedProjectIds = myInterests
          .map((item) => item.project?.id || item.projectId)
          .filter(Boolean)
          .map(String);

        setRecommended(uniqueRecommended);
        setPublicRequests(mappedPublic);
        setMyRequests(mappedMine);
        setAppliedIds(Array.from(new Set(appliedProjectIds)));
      } catch (err) {
        console.error("Failed to load explore data:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load requests. Check backend/API connection.",
        );
        setRecommended([]);
        setPublicRequests([]);
        setMyRequests([]);
        setAppliedIds([]);
      } finally {
        setLoading(false);
      }
    }

    loadExploreData();
  }, []);

  const go = (path: string) => {
    router.push(path);
  };

  const toggleSave = (id: string) => {
    const next = savedIds.includes(id)
      ? savedIds.filter((x) => x !== id)
      : [...savedIds, id];

    setSavedIds(next);
    saveSavedRequestIds(next);
  };

  const baseList = useMemo(() => {
    if (view === "startup-spotlight") return [];
    if (view === "recommended") return recommended;
    if (view === "requests") return publicRequests.filter((p) => p.status === "open");
    if (view === "my-requests") return myRequests;
    return publicRequests.filter((p) => p.status === "open");
  }, [view, recommended, myRequests, publicRequests]);

  const visible = useMemo(() => {
    let list = baseList;

    if (view === "interests" && activeInterest) {
      list = list.filter((p) => p.interestTags.includes(activeInterest));
    }

    const q = query.trim().toLowerCase();
    if (!q) return list;

    return list.filter((p) => {
      return (
        p.title.toLowerCase().includes(q) ||
        p.by.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.skills.some((s) => s.toLowerCase().includes(q)) ||
        p.interestTags.some((tag) => tag.toLowerCase().includes(q)) ||
        (p.shortDesc || "").toLowerCase().includes(q) ||
        (p.problem || "").toLowerCase().includes(q) ||
        (p.status || "").toLowerCase().includes(q)
      );
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
        className={`min-w-[220px] rounded-2xl border p-4 text-left shadow-sm transition ${
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

  const renderStatusBadge = (status?: string) => {
    if (!status) return null;

    const normalized = status.toLowerCase();

    const classes =
      normalized === "matching"
        ? "bg-amber-100 text-amber-700"
        : normalized === "open"
          ? "bg-emerald-100 text-emerald-700"
          : normalized === "in_progress"
            ? "bg-blue-100 text-blue-700"
            : "bg-[var(--muted)] text-[var(--text-main)]";

    return (
      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${classes}`}>
        {formatStatusLabel(status)}
      </span>
    );
  };

  const renderCard = (p: ExploreCard) => {
    const saved = savedIds.includes(p.id);
    const applied = appliedIds.includes(p.id);

    return (
      <div
        key={p.id}
        className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-4 shadow-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="truncate text-base font-bold text-[var(--text-main)]">
                {p.title}
              </div>
              {p.isMine ? renderStatusBadge(p.status) : null}
            </div>

            <div className="mt-1 text-xs text-[var(--text-muted-2)]">
              {p.by} • {p.role}
            </div>

            {p.isMine && p.status === "matching" ? (
              <div className="mt-1 text-xs text-[var(--text-muted-2)]">
                Finding matching collaborators...
              </div>
            ) : null}
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

          {!p.isMine ? (
            <button
              onClick={() => router.push(`/explore/${p.id}`)}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold ${
                applied
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-[var(--primary-btn-bg)] text-[var(--primary-btn-text)]"
              }`}
            >
              {applied ? "Applied" : "Apply"}
            </button>
          ) : (
            <button
              onClick={() => router.push(`/requests/${p.id}/applicants`)}
              className="flex-1 rounded-xl bg-[var(--primary-btn-bg)] px-4 py-2 text-sm font-semibold text-[var(--primary-btn-text)]"
            >
              Manage
            </button>
          )}
        </div>
      </div>
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
      </div>
    );
  };

  return (
    <div className="sync-theme-page sync-page-with-bottom-nav min-h-screen">
      <Header
        title={`Explore`}
        subtitle="Discover collaboration requests and startup opportunities"
        showNotificationDot={true}
      />

      <div className="mx-auto w-full max-w-[480px] px-4 pb-4">
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--text-main)]">
              Explore Sections
            </h2>
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
              subtitle="AI-matched suggestions"
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
              <h2 className="text-lg font-semibold text-[var(--text-main)]">
                Choose an Interest
              </h2>
              {activeInterest && (
                <button
                  onClick={() => setActiveInterest(null)}
                  className="text-sm font-semibold text-[var(--text-main)]"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2">
              {INTERESTS.map((interest) => {
                const active = activeInterest === interest.key;
                return (
                  <button
                    key={interest.key}
                    onClick={() => setActiveInterest(interest.key)}
                    className={`min-w-[150px] rounded-2xl border p-4 text-left shadow-sm transition ${
                      active
                        ? "border-[var(--text-main)] bg-[var(--surface-solid)]"
                        : "border-[var(--line-soft)] bg-[var(--surface-solid)]"
                    }`}
                  >
                    <div className="text-2xl">{interest.emoji}</div>
                    <div className="mt-2 font-bold text-[var(--text-main)]">
                      {interest.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {view !== "startup-spotlight" && (
          <section className="mb-6">
            <div className="mb-3">
              <div className="text-lg font-semibold text-[var(--text-main)]">
                {sectionTitle}
              </div>
              <div className="mt-1 text-xs text-[var(--text-muted-2)]">
                Search by title, creator, role, skills, or request details
              </div>
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search requests..."
              className="sync-theme-input w-full rounded-2xl px-4 py-3 text-sm"
            />
          </section>
        )}

        {error ? (
          <div className="mb-6 rounded-2xl border border-[var(--danger-soft-border)] bg-[var(--danger-soft-bg)] px-4 py-3 text-sm text-[var(--danger-soft-text)]">
            {error}
          </div>
        ) : null}

        {loading && view !== "startup-spotlight" ? (
          <section className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-4 shadow-sm"
              >
                <div className="h-5 w-2/3 rounded bg-[var(--muted)]" />
                <div className="mt-3 h-4 w-1/3 rounded bg-[var(--muted)]" />
                <div className="mt-4 h-10 rounded bg-[var(--muted)]" />
              </div>
            ))}
          </section>
        ) : null}

        {!loading && view !== "startup-spotlight" ? (
          <section className="space-y-4">
            {visible.length === 0 ? (
              <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-4 shadow-sm">
                <div className="font-semibold text-[var(--text-main)]">
                  No requests found
                </div>
                <div className="mt-1 text-sm text-[var(--text-muted-2)]">
                  Try changing the section, filters, or search.
                </div>
              </div>
            ) : (
              visible.map(renderCard)
            )}
          </section>
        ) : null}
      </div>

      <BottomNav />
    </div>
  );
}