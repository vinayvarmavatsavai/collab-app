"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Milestone = {
  title: string;
  status: "Completed" | "In progress";
  tags: string[];
};

type HistoryItem = {
  title: string;
  role: string;
  status: "Completed" | "In progress";
  date: string;
};

const milestoneByYear: Record<number, Milestone[]> = {
  2026: [
    { title: "Autonomous Drone Vision", status: "Completed", tags: ["Milestone", "Completed"] },
    { title: "Model Compression Pipeline", status: "In progress", tags: ["Milestone", "In progress"] },
  ],
  2025: [
    { title: "Edge Inference Benchmarking", status: "Completed", tags: ["Milestone", "Completed"] },
    { title: "Robotics Sensor Fusion", status: "Completed", tags: ["Milestone", "Completed"] },
  ],
  2024: [{ title: "Deployment Playbook v1", status: "Completed", tags: ["Milestone", "Completed"] }],
};

const historyData: HistoryItem[] = [
  { title: "AI Model Optimization", role: "Contributor • Milestones", status: "Completed", date: "Jan 2026" },
  { title: "Prototype Review Sprint", role: "Reviewer • Advisory", status: "Completed", date: "Oct 2025" },
  { title: "Sensor Fusion Audit", role: "Advisor • Robotics", status: "Completed", date: "May 2025" },
];

const skillsData = ["UI/UX", "Figma", "React", "Next.js", "Node.js", "MongoDB"];

export default function ProfilePage() {
  const router = useRouter();

  const years = useMemo(
    () => Object.keys(milestoneByYear).map(Number).sort((a, b) => b - a),
    []
  );

  const [activeYear, setActiveYear] = useState<number>(years[0]);
  const [historyShown, setHistoryShown] = useState(1);

  // Demo profile (later from backend)
  const [profile, setProfile] = useState({
    name: "Vinay",
    role: "Builder • Startups • Collaboration",
    location: "India",
  });

  useEffect(() => {
    // If you want: load profile from localStorage answers
    // const raw = localStorage.getItem("profileAnswers");
    // if (raw) setProfile(p => ({ ...p, name: "Vinay" }));
  }, []);

  const milestones = milestoneByYear[activeYear] || [];
  const shownHistory = historyData.slice(0, historyShown);
  const canLoadMore = historyShown < historyData.length;

  return (
    <div className="min-h-screen pb-24 bg-[#F4F6FB] text-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="px-4 py-4 flex items-center justify-between">
          <div>
            <div className="text-[20px] font-extrabold">Profile</div>
            <div className="text-sm text-slate-500">Credibility • milestones</div>
          </div>

          <button
            onClick={() => router.push("/home")}
            className="text-sm font-semibold text-[#2D6BFF]"
          >
            Back
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Profile Header Card */}
        <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
              {profile.name?.slice(0, 1).toUpperCase()}
            </div>

            <div className="min-w-0">
              <div className="text-[18px] font-extrabold truncate">{profile.name}</div>
              <div className="text-sm text-slate-500 truncate">{profile.role}</div>
              <div className="text-xs text-slate-400 mt-1">{profile.location}</div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {["AI", "Startups", "Collab"].map((t) => (
              <span key={t} className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Milestones */}
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-bold">Milestones</h3>
        </div>

        {/* Year selector */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {years.map((y) => {
            const active = y === activeYear;
            return (
              <button
                key={y}
                onClick={() => setActiveYear(y)}
                className={[
                  "px-4 py-2 rounded-full text-sm font-semibold border",
                  active
                    ? "bg-[#2D6BFF] text-white border-[#2D6BFF]"
                    : "bg-white text-slate-600 border-slate-200",
                ].join(" ")}
              >
                {y}
              </button>
            );
          })}
        </div>

        {/* Milestone cards */}
        <div className="space-y-3">
          {milestones.map((m, idx) => (
            <div key={idx} className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="font-semibold">{m.title}</div>
                <span
                  className={[
                    "text-xs px-2 py-1 rounded-full font-semibold",
                    m.status === "Completed"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700",
                  ].join(" ")}
                >
                  {m.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {m.tags.map((t) => (
                  <span key={t} className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Collaboration History */}
        <div className="flex items-center justify-between mt-2">
          <h3 className="text-[16px] font-bold">Collaboration History</h3>
          <button className="text-sm font-semibold text-slate-500" onClick={() => {}}>
            Timeline
          </button>
        </div>

        <div className="space-y-3">
          {shownHistory.map((h, idx) => (
            <div key={idx} className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
              <div className="font-semibold">{h.title}</div>
              <div className="text-sm text-slate-600 mt-1">
                {h.role} • {h.status} • {h.date}
              </div>
            </div>
          ))}
        </div>

        {canLoadMore && (
          <button
            onClick={() => setHistoryShown((v) => Math.min(v + 1, historyData.length))}
            className="w-full h-12 rounded-2xl bg-white border border-slate-200 text-slate-800 font-bold shadow-sm"
          >
            Load more
          </button>
        )}

        {/* Skills */}
        <div className="flex items-center justify-between mt-2">
          <h3 className="text-[16px] font-bold">Skills</h3>
          <button className="text-sm font-semibold text-slate-500" onClick={() => {}}>
            Tags
          </button>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {skillsData.map((s) => (
              <span key={s} className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Invite */}
        <button
          onClick={() => alert("Invite sent (demo)")}
          className="w-full h-12 rounded-2xl bg-[#2D6BFF] text-white font-extrabold shadow-md active:scale-[0.99]"
        >
          Invite to Collaboration
        </button>
      </div>

      {/* Bottom Navigation (same as Home, uniform) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 z-40">
        <div className="h-full grid grid-cols-4">
          <button
            onClick={() => router.push("/home")}
            className="flex flex-col items-center justify-center gap-1 text-slate-500 text-xs"
          >
            <span className="text-lg leading-none">🏠</span>
            <span>Home</span>
          </button>

          <button
            onClick={() => router.push("/messages")}
            className="flex flex-col items-center justify-center gap-1 text-slate-500 text-xs"
          >
            <span className="text-lg leading-none">💬</span>
            <span>Messages</span>
          </button>

          <button
            onClick={() => router.push("/create")}
            className="flex flex-col items-center justify-center gap-1 text-slate-500 text-xs"
          >
            <span className="text-lg leading-none">➕</span>
            <span>Create</span>
          </button>

          <button
            onClick={() => router.push("/profile")}
            className="flex flex-col items-center justify-center gap-1 text-[#2D6BFF] text-xs font-semibold"
          >
            <span className="text-lg leading-none">👤</span>
            <span>Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}