"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ActiveCollab = {
  id: number;
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

const ACTIVE_COLLABS_KEY = "activeCollaborations_v1";

const mockActivity: ActivityPost[] = [
  {
    id: 11,
    orgName: "Syncreate Private Limited",
    orgSubtitle: "Update",
    logoText: "S",
    images: ["/feed/drone-1.jpg", "/feed/drone-2.jpg", "/feed/drone-3.jpg"],
    text:
      "We have successfully built an agricultural drone which we are currently testing in the fields of Haryana.",
    time: "2h ago",
  },
  {
    id: 12,
    orgName: "Apogee",
    orgSubtitle: "Survey",
    logoText: "A",
    images: ["/feed/campus-1.jpg", "/feed/campus-2.jpg"],
    text: "Quick survey: what should we build next for student-startup collaborations?",
    time: "6h ago",
  },
];

function getDisplayName(): string {
  try {
    const raw = localStorage.getItem("profileAnswers");
    if (!raw) return "Vinay";
    const parsed = JSON.parse(raw);

    const candidates = [
      parsed?.name,
      parsed?.fullName,
      parsed?.yourName,
      parsed?.["Your name"],
      parsed?.["Name"],
    ].filter(Boolean);

    const n = (candidates?.[0] ?? "Vinay") as string;
    return n.trim() || "Vinay";
  } catch {
    return "Vinay";
  }
}

export default function HomePage() {
  const router = useRouter();

  const [name, setName] = useState("Vinay");
  const [activeTab, setActiveTab] = useState<
    "home" | "explore" | "create" | "events" | "profile"
  >("home");

  const [activeCollabs, setActiveCollabs] = useState<ActiveCollab[]>([]);
  const [imgIndexByPost, setImgIndexByPost] = useState<Record<number, number>>(
    {},
  );

  useEffect(() => {
    setName(getDisplayName());

    try {
      const raw = localStorage.getItem(ACTIVE_COLLABS_KEY);
      const parsed = raw ? JSON.parse(raw) : null;

      if (Array.isArray(parsed) && parsed.length) {
        setActiveCollabs(parsed);
      } else {
        setActiveCollabs([
          {
            id: 901,
            title: "AI Model Optimization",
            status: "Active",
            deadline: "Deadline: 10/03/2026",
            sprintsLeft: "2 sprints left",
            quickLinks: [
              { label: "Workspace", path: "/projects/sphere-ai-collab" },
              {
                label: "Milestones",
                path: "/projects/sphere-ai-collab",
              },
              {
                label: "Meetings",
                path: "/projects/sphere-ai-collab/meetings",
              },
            ],
          },
        ]);
      }
    } catch {
      setActiveCollabs([]);
    }

    const init: Record<number, number> = {};
    for (const p of mockActivity) init[p.id] = 0;
    setImgIndexByPost(init);
  }, []);

  const headerSubtitle = useMemo(() => {
    return "Here are collaborations matched to your profile";
  }, []);

  const go = (path: string, tab?: typeof activeTab) => {
    if (tab) setActiveTab(tab);
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
    <div className="min-h-screen bg-[#F4F6FB] px-4 py-6 pb-24 text-slate-900">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {name} 👋</h1>
          <p className="text-sm text-slate-500">{headerSubtitle}</p>
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
            onClick={() => router.push("/qr")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm"
            aria-label="QR"
            title="QR"
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

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Active collaborations:</h2>
          <button
            onClick={() => go("/explore", "explore")}
            className="text-sm font-semibold text-[#2D6BFF]"
          >
            View all
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2">
          {activeCollabs.length === 0 ? (
            <div className="min-w-[320px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="font-semibold">No active collaborations yet</div>
              <div className="mt-1 text-sm text-slate-500">
                Once a request is accepted, it will appear here.
              </div>
              <button
                onClick={() => go("/explore", "explore")}
                className="mt-4 w-full rounded-xl bg-[#2D6BFF] py-2 font-semibold text-white"
              >
                Explore Requests
              </button>
            </div>
          ) : (
            activeCollabs.map((c) => (
              <div
                key={c.id}
                onClick={() => go(c.quickLinks[0]?.path || "/projects")}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    go(c.quickLinks[0]?.path || "/projects");
                  }
                }}
                className="min-w-[320px] cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{c.title}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {c.deadline}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                      {c.status}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {c.sprintsLeft}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {c.quickLinks.map((q) => (
                    <button
                      key={q.label}
                      onClick={(event) => {
                        event.stopPropagation();
                        go(q.path);
                      }}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-700"
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
          <h2 className="text-lg font-semibold">Activity</h2>
          <button
            onClick={() => go("/explore", "explore")}
            className="text-sm font-semibold text-[#2D6BFF]"
          >
            Explore
          </button>
        </div>

        <div className="space-y-4">
          {mockActivity.map((p) => {
            const idx = imgIndexByPost[p.id] ?? 0;
            const total = p.images.length;
            const progressPct = total <= 1 ? 100 : (idx / (total - 1)) * 100;

            return (
              <div
                key={p.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 font-bold text-slate-700">
                      {p.logoText}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{p.orgName}</div>
                      <div className="text-xs text-slate-500">
                        {p.orgSubtitle}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs text-slate-400">{p.time}</span>
                </div>

                <div className="relative mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
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
                        className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/90 shadow"
                        aria-label="Previous image"
                        title="Previous"
                      >
                        ‹
                      </button>
                      <button
                        onClick={() => nextImg(p.id, total)}
                        className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/90 shadow"
                        aria-label="Next image"
                        title="Next"
                      >
                        ›
                      </button>
                    </>
                  )}

                  <div className="absolute bottom-2 left-3 right-3">
                    <div className="flex items-center gap-2">
                      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/70">
                        <div
                          className="absolute left-0 top-0 h-full bg-white"
                          style={{ width: `${progressPct}%` }}
                        />
                        <div
                          className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-slate-300 bg-white shadow"
                          style={{ left: `calc(${progressPct}% - 8px)` }}
                        />
                      </div>

                      <div className="rounded-full border border-slate-200 bg-white/90 px-2 py-1 text-[11px] font-semibold text-slate-700">
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

                <p className="mt-3 text-sm text-slate-600">{p.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-slate-200 bg-white">
        <div className="grid h-full grid-cols-5">
          <button
            onClick={() => go("/home", "home")}
            className={`flex flex-col items-center justify-center gap-1 text-xs ${
              activeTab === "home"
                ? "font-semibold text-[#2D6BFF]"
                : "text-slate-500"
            }`}
          >
            <span className="text-lg leading-none">🏠</span>
            <span>Home</span>
          </button>

          <button
            onClick={() => go("/explore", "explore")}
            className={`flex flex-col items-center justify-center gap-1 text-xs ${
              activeTab === "explore"
                ? "font-semibold text-[#2D6BFF]"
                : "text-slate-500"
            }`}
          >
            <span className="text-lg leading-none">🧭</span>
            <span>Explore</span>
          </button>

          <button
            onClick={() => go("/create", "create")}
            className="flex flex-col items-center justify-center gap-1 text-xs"
          >
            <span className="text-lg leading-none">➕</span>
            <span className="font-semibold text-slate-700">Create</span>
          </button>

          <button
            onClick={() => go("/events", "events")}
            className={`flex flex-col items-center justify-center gap-1 text-xs ${
              activeTab === "events"
                ? "font-semibold text-[#2D6BFF]"
                : "text-slate-500"
            }`}
          >
            <span className="text-lg leading-none">📅</span>
            <span>Events</span>
          </button>

          <button
            onClick={() => go("/profile", "profile")}
            className={`flex flex-col items-center justify-center gap-1 text-xs ${
              activeTab === "profile"
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