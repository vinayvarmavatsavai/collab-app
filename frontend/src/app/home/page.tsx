"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../navigation/Header";
import BottomNav from "../navigation/BottomNav";
import { apiRequest } from "@/lib/api";

type ActiveCollab = {
  id: number;
  projectId: string;
  title: string;
  status: "Active" | "Paused";
  deadline: string;
  sprintsLeft: string;
  quickLinks: Array<{
    label: "Workspace" | "Milestones" | "Meetings";
    path: string;
  }>;
};

type ActivityPost = {
  id: number;
  orgName: string;
  orgSubtitle: string;
  logoText: string;
  images: string[];
  text: string;
  time: string;
};

type UserProfileResponse = {
  id?: string;
  firstname?: string;
  lastname?: string;
  username?: string;
};

type CohortResponse = {
  id?: string;
  project?: {
    id?: string;
    title?: string;
  };
};

type NotificationResponse = {
  id?: string;
  notificationType?: string;
  notifiedAt?: string;
  project?: {
    id?: string;
    title?: string;
    creator?: {
      firstname?: string;
      lastname?: string;
      username?: string;
    };
  };
};

function buildQuickLinks(projectId: string) {
  return [
    { label: "Workspace" as const, path: `/projects/${projectId}` },
    { label: "Milestones" as const, path: `/projects/${projectId}` },
    { label: "Meetings" as const, path: `/projects/${projectId}/meetings` },
  ];
}

function formatDisplayTime(value?: string) {
  if (!value) return "Recently";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

function buildNotificationText(item: NotificationResponse) {
  const type = (item.notificationType || "update").toLowerCase();
  const creator =
    item.project?.creator?.firstname ||
    item.project?.creator?.username ||
    "a collaborator";

  if (type === "match") {
    return `You have a new match update for this collaboration from ${creator}.`;
  }

  if (type === "selected") {
    return `You were selected in this collaboration flow by ${creator}.`;
  }

  if (type === "rejected") {
    return `There was a status update on this collaboration from ${creator}.`;
  }

  return `You have a new collaboration update from ${creator}.`;
}

export default function HomePage() {
  const router = useRouter();

  const [name, setName] = useState("Rahul");
  const [activeCollabs, setActiveCollabs] = useState<ActiveCollab[]>([]);
  const [activity, setActivity] = useState<ActivityPost[]>([]);
  const [imgIndexByPost, setImgIndexByPost] = useState<Record<number, number>>(
    {},
  );

  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await apiRequest<UserProfileResponse>("/users/me/profile");

        const fullName =
          `${profile.firstname || ""} ${profile.lastname || ""}`.trim() ||
          profile.username ||
          "User";

        setName(fullName);
      } catch (error) {
        console.error("Failed to load profile:", error);
        setName("User");
      }
    }

    async function loadCohorts() {
      try {
        const cohorts = await apiRequest<CohortResponse[]>("/cohorts/me");

        const mapped: ActiveCollab[] = (Array.isArray(cohorts) ? cohorts : []).map(
          (item, index) => {
            const projectId = item.project?.id || "unknown-project";
            const title = item.project?.title || "Untitled Collaboration";

            return {
              id: index + 1,
              projectId,
              title,
              status: "Active",
              deadline: "Deadline: --/--/--",
              sprintsLeft: "Ongoing",
              quickLinks: buildQuickLinks(projectId),
            };
          },
        );

        setActiveCollabs(mapped);
      } catch (error) {
        console.error("Failed to load active collaborations:", error);
        setActiveCollabs([]);
      }
    }

    async function loadNotifications() {
      try {
        const notifications = await apiRequest<NotificationResponse[]>(
          "/notifications/projects",
        );

        const mapped: ActivityPost[] = (
          Array.isArray(notifications) ? notifications : []
        ).map((item, index) => {
          const projectTitle = item.project?.title || "Project";
          const notificationType = item.notificationType || "Update";

          return {
            id: index + 1,
            orgName: projectTitle,
            orgSubtitle:
              notificationType.charAt(0).toUpperCase() +
              notificationType.slice(1),
            logoText: projectTitle.charAt(0).toUpperCase() || "P",
            images: ["/feed/drone-1.jpg"],
            text: buildNotificationText(item),
            time: formatDisplayTime(item.notifiedAt),
          };
        });

        setActivity(mapped);
      } catch (error) {
        console.error("Failed to load activity:", error);
        setActivity([]);
      }
    }

    loadProfile();
    loadCohorts();
    loadNotifications();
  }, []);

  useEffect(() => {
    const init: Record<number, number> = {};
    for (const p of activity) {
      init[p.id] = 0;
    }
    setImgIndexByPost(init);
  }, [activity]);

  const headerSubtitle = useMemo(() => {
    return "Here are collaborations matched to your profile";
  }, []);

  const go = (path: string) => {
    router.push(path);
  };

  const nextImg = (postId: number, total: number) => {
    setImgIndexByPost((prev) => {
      const cur = prev[postId] ?? 0;
      const nxt = (cur + 1) % total;
      return { ...prev, [postId]: nxt };
    });
  };

  const prevImg = (postId: number, total: number) => {
    setImgIndexByPost((prev) => {
      const cur = prev[postId] ?? 0;
      const nxt = (cur - 1 + total) % total;
      return { ...prev, [postId]: nxt };
    });
  };

  const setImg = (postId: number, idx: number) => {
    setImgIndexByPost((prev) => ({ ...prev, [postId]: idx }));
  };

  return (
    <div className="sync-theme-page sync-page-with-bottom-nav min-h-screen">
      <Header
        title={`Hi, ${name} `}
        subtitle={headerSubtitle}
        showNotificationDot={true}
      />

      <div className="mx-auto w-full max-w-[480px] px-4 pb-4">
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--text-main)]">
              Active collaborations:
            </h2>
            <button
              onClick={() => go("/explore")}
              className="text-sm font-semibold text-[var(--text-main)]"
            >
              View all
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {activeCollabs.length === 0 ? (
              <div className="min-w-[230px] rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-4 shadow-sm">
                <div className="font-semibold text-[var(--text-main)]">
                  No active collaborations yet
                </div>
                <div className="mt-1 text-sm text-[var(--text-muted-2)]">
                  Once a request is accepted, it will appear here.
                </div>
                <button
                  onClick={() => go("/explore")}
                  className="mt-4 w-full rounded-xl bg-[var(--primary-btn-bg)] py-2 font-semibold text-[var(--primary-btn-text)]"
                >
                  Explore Requests
                </button>
              </div>
            ) : (
              activeCollabs.map((c) => (
                <div
                  key={c.id}
                  onClick={() => go(`/projects/${c.projectId}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      go(`/projects/${c.projectId}`);
                    }
                  }}
                  className="min-w-[220px] cursor-pointer rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-[var(--text-main)]">
                        {c.title}
                      </div>
                      <div className="mt-1 text-xs text-[var(--text-muted-2)]">
                        {c.deadline}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="rounded-full bg-[var(--muted)] px-2 py-1 text-[11px] font-semibold text-[var(--text-main)]">
                        {c.status}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted-2)]">
                        {c.sprintsLeft}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2 overflow-hidden">
                    {c.quickLinks.map((q) => (
                      <button
                        key={q.label}
                        onClick={(event) => {
                          event.stopPropagation();
                          go(q.path);
                        }}
                        className="flex-1 whitespace-nowrap rounded-full border border-[var(--line-soft)] bg-[var(--muted)] px-1 py-1 text-[10px] font-semibold text-[var(--text-main)]"
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--text-main)]">
              Activity
            </h2>
            <button
              onClick={() => go("/explore")}
              className="text-sm font-semibold text-[var(--text-main)]"
            >
              Explore
            </button>
          </div>

          <div className="space-y-4">
            {activity.length === 0 ? (
              <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-4 shadow-sm">
                <div className="font-semibold text-[var(--text-main)]">
                  No activity yet
                </div>
                <div className="mt-1 text-sm text-[var(--text-muted-2)]">
                  New collaboration notifications will appear here.
                </div>
              </div>
            ) : (
              activity.map((p) => {
                const idx = imgIndexByPost[p.id] ?? 0;
                const total = p.images.length;

                return (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--muted)] font-bold text-[var(--text-main)]">
                          {p.logoText}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-[var(--text-main)]">
                            {p.orgName}
                          </div>
                          <div className="text-xs text-[var(--text-muted-2)]">
                            {p.orgSubtitle}
                          </div>
                        </div>
                      </div>

                      <span className="text-xs text-[var(--text-muted-2)]">
                        {p.time}
                      </span>
                    </div>

                    <div className="relative mt-3 overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-[var(--muted)]">
                      <div className="aspect-[16/10] w-full">
                        <img
                          src={p.images[idx]}
                          alt="Activity"
                          className="h-full w-full object-cover"
                          draggable={false}
                        />
                      </div>

                      {total > 1 && (
                        <>
                          <button
                            onClick={() => prevImg(p.id, total)}
                            className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--line-soft)] bg-white shadow"
                            aria-label="Previous image"
                            title="Previous"
                          >
                            ‹
                          </button>
                          <button
                            onClick={() => nextImg(p.id, total)}
                            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--line-soft)] bg-white shadow"
                            aria-label="Next image"
                            title="Next"
                          >
                            ›
                          </button>
                        </>
                      )}

                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="flex items-center justify-end">
                          <div className="rounded-full border border-[var(--line-soft)] bg-white px-2 py-1 text-[11px] font-semibold text-[var(--text-main)]">
                            {idx + 1}/{total}
                          </div>
                        </div>

                        {total > 1 && (
                          <div className="mt-2 flex items-center justify-center gap-1">
                            {p.images.map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setImg(p.id, i)}
                                className={[
                                  "h-1.5 rounded-full transition",
                                  i === idx ? "w-5 bg-white" : "w-2 bg-white/60",
                                ].join(" ")}
                                aria-label={`Go to image ${i + 1}`}
                                title={`Image ${i + 1}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-[var(--text-muted-2)]">
                      {p.text}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}