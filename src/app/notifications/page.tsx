"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type FooterTab = "home" | "explore" | "create" | "events" | "profile";

type NotiType = "match" | "apply" | "status" | "message" | "cohort" | "system";

type NotificationItem = {
  id: string;
  type: NotiType;
  title: string;
  message: string;
  createdAt: number;
  read: boolean;
  href?: string;
};

const STORAGE_KEY = "notifications_v1";

function uid() {
  return Math.random().toString(36).slice(2) + "-" + Date.now().toString(36);
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

function icon(type: NotiType) {
  switch (type) {
    case "match":
      return "✨";
    case "apply":
      return "📥";
    case "status":
      return "✅";
    case "message":
      return "💬";
    case "cohort":
      return "👥";
    default:
      return "🔔";
  }
}

function seedIfEmpty() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return;

  const now = Date.now();
  const seeded: NotificationItem[] = [
    {
      id: uid(),
      type: "match",
      title: "New match found",
      message:
        "AI matched you to: “Build AI Resume Analyzer”. Tap to view & apply.",
      createdAt: now - 1000 * 60 * 8,
      read: false,
      href: "/collaboration/1",
    },
    {
      id: uid(),
      type: "apply",
      title: "New application received",
      message:
        "Ayesha applied to your collaboration: “Startup Landing Page Design”.",
      createdAt: now - 1000 * 60 * 40,
      read: false,
      href: "/create",
    },
    {
      id: uid(),
      type: "message",
      title: "New message",
      message: "Rahul: “Can you share your availability for this week?”",
      createdAt: now - 1000 * 60 * 90,
      read: true,
      href: "/messages",
    },
    {
      id: uid(),
      type: "status",
      title: "Application accepted",
      message:
        "You were accepted into: “Mobile App Backend APIs”. Group chat created.",
      createdAt: now - 1000 * 60 * 60 * 5,
      read: true,
      href: "/messages",
    },
    {
      id: uid(),
      type: "cohort",
      title: "Cohort approved",
      message: "Your request to join “Startup Builders Cohort” was approved.",
      createdAt: now - 1000 * 60 * 60 * 22,
      read: false,
      href: "/events",
    },
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
}

function loadList(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveList(list: NotificationItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export default function NotificationsPage() {
  const router = useRouter();

  // Footer active highlighting (optional) — keeping none active is weird,
  // so we set it to "home" visually neutral. You can set to "explore" if you want.
  const [activeTab, setActiveTab] = useState<FooterTab>("home");

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    seedIfEmpty();
    setItems(loadList());
  }, []);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items]
  );

  const visible = useMemo(() => {
    const sorted = [...items].sort((a, b) => b.createdAt - a.createdAt);
    return filter === "unread" ? sorted.filter((n) => !n.read) : sorted;
  }, [items, filter]);

  const go = (path: string, tab?: FooterTab) => {
    if (tab) setActiveTab(tab);
    router.push(path);
  };

  const markAllRead = () => {
    const updated = items.map((n) => ({ ...n, read: true }));
    setItems(updated);
    saveList(updated);
  };

  const clearAll = () => {
    setItems([]);
    saveList([]);
  };

  const toggleRead = (id: string) => {
    const updated = items.map((n) =>
      n.id === id ? { ...n, read: !n.read } : n
    );
    setItems(updated);
    saveList(updated);
  };

  const openNoti = (n: NotificationItem) => {
    const updated = items.map((x) =>
      x.id === n.id ? { ...x, read: true } : x
    );
    setItems(updated);
    saveList(updated);
    if (n.href) router.push(n.href);
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-slate-900 px-4 py-6 pb-24">
      {/* Header (match app) */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <button
            onClick={() => router.back()}
            className="h-10 w-10 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-center"
            aria-label="Back"
            title="Back"
          >
            ←
          </button>

          <div>
            <h1 className="text-2xl font-bold leading-tight">
              Notifications
            </h1>
            <p className="text-slate-500 text-sm">{unreadCount} unread</p>
          </div>
        </div>

        {/* Right icons: Bell + QR + Messages */}
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

      {/* Filter + actions */}
      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="inline-flex bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-2 rounded-xl text-sm font-semibold ${
              filter === "all" ? "bg-[#2D6BFF] text-white" : "text-slate-600"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-3 py-2 rounded-xl text-sm font-semibold ${
              filter === "unread" ? "bg-[#2D6BFF] text-white" : "text-slate-600"
            }`}
          >
            Unread
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={markAllRead}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-sm text-sm font-semibold text-slate-700"
          >
            Read all
          </button>
          <button
            onClick={clearAll}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-sm text-sm font-semibold text-slate-700"
          >
            Clear
          </button>
        </div>
      </div>

      {/* List */}
      <div className="mt-5 space-y-3">
        {visible.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center">
            <div className="text-2xl">🔕</div>
            <div className="mt-2 font-semibold">No notifications</div>
            <div className="text-sm text-slate-500 mt-1">
              You’re all caught up.
            </div>
          </div>
        ) : (
          visible.map((n) => (
            <div
              key={n.id}
              className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${
                n.read ? "opacity-90" : ""
              }`}
            >
              <button onClick={() => openNoti(n)} className="w-full text-left">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center text-lg">
                    {icon(n.type)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold leading-snug">
                        {n.title}
                      </div>

                      <div className="flex items-center gap-2">
                        {!n.read && (
                          <span className="h-2 w-2 rounded-full bg-[#2D6BFF]" />
                        )}
                        <span className="text-xs text-slate-400">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-1 text-sm text-slate-600">
                      {n.message}
                    </div>
                  </div>
                </div>
              </button>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => toggleRead(n.id)}
                  className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold"
                >
                  {n.read ? "Mark unread" : "Mark read"}
                </button>

                {n.href && (
                  <button
                    onClick={() => openNoti(n)}
                    className="px-3 py-2 rounded-xl bg-[#2D6BFF] text-white text-sm font-semibold"
                  >
                    Open
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer (match your app) */}
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
            {/* keep your plus */}
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