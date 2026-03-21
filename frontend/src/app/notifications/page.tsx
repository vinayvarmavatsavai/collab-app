"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/app/navigation/Header";
import BottomNav from "@/app/navigation/BottomNav";

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
      message: "AI matched you to: “Build AI Resume Analyzer”.",
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
      createdAt: now - 1000 * 60 * 60,
      read: false,
      href: "/create",
    },
    {
      id: uid(),
      type: "message",
      title: "New message",
      message: "Rahul: “Can you share your availability for this week?”",
      createdAt: now - 1000 * 60 * 60 * 4,
      read: true,
      href: "/messages",
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
    <div className="sync-theme-page sync-page-with-bottom-nav min-h-dvh">
      <Header title="Notifications" />

      <div className="mx-auto w-full max-w-[480px] px-4 pb-4">
        <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
          <div className="inline-flex rounded-2xl border border-[var(--line-soft)] bg-[var(--muted)] p-1">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                filter === "all"
                  ? "bg-[var(--surface-solid)] text-[var(--text-main)] shadow-sm"
                  : "text-[var(--text-muted-2)]"
              }`}
            >
              All
            </button>

            <button
              onClick={() => setFilter("unread")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                filter === "unread"
                  ? "bg-[var(--surface-solid)] text-[var(--text-main)] shadow-sm"
                  : "text-[var(--text-muted-2)]"
              }`}
            >
             {unreadCount} Unread
              <span
                className={`ml-1.5 text-xs ${
                  filter === "unread"
                    ? "text-[var(--text-main)]"
                    : "text-[var(--text-muted-2)]"
                }`}
              >
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={markAllRead}
              className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-solid)] px-4 py-2 text-sm font-medium text-[var(--text-main)] shadow-sm"
            >
              Read all
            </button>

            <button
              onClick={clearAll}
              className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-solid)] px-4 py-2 text-sm font-medium text-[var(--text-main)] shadow-sm"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {visible.length === 0 ? (
            <div className="rounded-3xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-6 text-center shadow-sm">
              <div className="text-2xl">🔕</div>
              <div className="mt-2 text-base font-semibold text-[var(--text-main)]">
                No notifications
              </div>
              <div className="mt-1 text-sm text-[var(--text-muted-2)]">
                You’re all caught up.
              </div>
            </div>
          ) : (
            visible.map((n) => (
              <div
                key={n.id}
                className="rounded-3xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-4 shadow-sm"
              >
                <button onClick={() => openNoti(n)} className="w-full text-left">
                  <div className="flex gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--muted)] text-lg">
                      {icon(n.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-base font-semibold leading-snug text-[var(--text-main)]">
                            {n.title}
                          </div>
                        </div>

                        <span className="shrink-0 pt-0.5 text-xs text-[var(--text-muted-2)]">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>

                      <div className="mt-1 text-sm leading-7 text-[var(--text-muted-2)]">
                        {n.message}
                      </div>
                    </div>
                  </div>
                </button>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => toggleRead(n.id)}
                    className="rounded-2xl bg-[var(--muted)] px-4 py-2 text-sm font-medium text-[var(--text-main)]"
                  >
                    {n.read ? "Mark unread" : "Mark read"}
                  </button>

                  {n.href && (
                    <button
                      onClick={() => openNoti(n)}
                      className="rounded-2xl bg-[var(--primary-btn-bg)] px-4 py-2 text-sm font-medium text-[var(--primary-btn-text)]"
                    >
                      Open
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}