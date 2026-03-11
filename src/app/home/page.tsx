"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ActiveCollab = {
  id: number;
  title: string;
  status: "Active" | "Paused";
  deadline: string;
  sprintsLeft: string;
  quickLinks: Array<{ label: "Milestones" | "Calendar" | "Post"; path: string }>;
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
    {}
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
              { label: "Milestones", path: "/milestones" },
              { label: "Calendar", path: "/calendar" },
              { label: "Post", path: "/create" },
            ],
          },
          {
            id: 902,
            title: "Robotics Sensor Fusion",
            status: "Active",
            deadline: "Deadline: 22/03/2026",
            sprintsLeft: "1 sprint left",
            quickLinks: [
              { label: "Milestones", path: "/milestones" },
              { label: "Calendar", path: "/calendar" },
              { label: "Post", path: "/create" },
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
    <div className="min-h-screen pb-24 bg-[#F4F6FB] text-slate-900 px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {name} 👋</h1>
          <p className="text-slate-500 text-sm">{headerSubtitle}</p>
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
            onClick={() => router.push("/qr")}
            className="h-10 w-10 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-center"
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
            className="h-10 w-10 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition flex items-center justify-center"
          >
            <span className="text-lg leading-none">💬</span>
          </button>
        </div>
      </div>

      {/* Active collaborations */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
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
              <div className="text-sm text-slate-500 mt-1">
                Once a request is accepted, it will appear here.
              </div>
              <button
                onClick={() => go("/explore", "explore")}
                className="mt-4 w-full py-2 rounded-xl bg-[#2D6BFF] text-white font-semibold"
              >
                Explore Requests
              </button>
            </div>
          ) : (
            activeCollabs.map((c) => (
              <div
                key={c.id}
                onClick={() => go(`/project/${c.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    go(`/project/${c.id}`);
                  }
                }}
                className="min-w-[320px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{c.title}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {c.deadline}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[11px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                      {c.status}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {c.sprintsLeft}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex gap-2 flex-wrap">
                  {c.quickLinks.map((q) => (
                    <button
                      key={q.label}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (q.label === "Calendar") {
                          go(`/project/${c.id}/calendar`);
                          return;
                        }
                        if (q.label === "Milestones") {
                          go(`/project/${c.id}`);
                          return;
                        }
                        go(q.path);
                      }}
                      className="text-[11px] px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700 font-semibold"
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

      {/* Activity */}
      <section>
        <div className="flex items-center justify-between mb-3">
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
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700">
                      {p.logoText}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{p.orgName}</div>
                      <div className="text-xs text-slate-500">
                        {p.orgSubtitle}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs text-slate-400">{p.time}</span>
                </div>

                <div className="mt-3 relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
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
                        className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 border border-slate-200 shadow flex items-center justify-center"
                        aria-label="Previous image"
                        title="Previous"
                      >
                        ‹
                      </button>
                      <button
                        onClick={() => nextImg(p.id, total)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 border border-slate-200 shadow flex items-center justify-center"
                        aria-label="Next image"
                        title="Next"
                      >
                        ›
                      </button>
                    </>
                  )}

                  <div className="absolute bottom-2 left-3 right-3">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 h-2 rounded-full bg-white/70 overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full bg-white"
                          style={{ width: `${progressPct}%` }}
                        />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white border border-slate-300 shadow"
                          style={{ left: `calc(${progressPct}% - 8px)` }}
                        />
                      </div>

                      <div className="text-[11px] px-2 py-1 rounded-full bg-white/90 border border-slate-200 text-slate-700 font-semibold">
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

                <p className="text-slate-600 text-sm mt-3">{p.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 z-40">
        <div className="h-full grid grid-cols-5">
          <button
            onClick={() => go("/home", "home")}
            className={`flex flex-col items-center justify-center gap-1 text-xs ${
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
            className={`flex flex-col items-center justify-center gap-1 text-xs ${
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
            className="flex flex-col items-center justify-center gap-1 text-xs"
          >
            <span className="text-lg leading-none">➕</span>
            <span className="text-slate-700 font-semibold">Create</span>
          </button>

          <button
            onClick={() => go("/events", "events")}
            className={`flex flex-col items-center justify-center gap-1 text-xs ${
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
            className={`flex flex-col items-center justify-center gap-1 text-xs ${
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
