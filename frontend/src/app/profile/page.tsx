"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../navigation/Header";
import BottomNav from "../navigation/BottomNav";

type FooterTab = "home" | "explore" | "create" | "events" | "profile";

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

type ProfileInfo = {
  name: string;
  role: string;
  location: string;
  avatarUrl?: string;
};

export default function ProfilePage() {
  const router = useRouter();

  const years = useMemo(
    () => Object.keys(milestoneByYear).map(Number).sort((a, b) => b - a),
    []
  );

  const [activeYear, setActiveYear] = useState<number>(years[0]);
  const [historyShown, setHistoryShown] = useState(1);
  const [footerTab, setFooterTab] = useState<FooterTab>("profile");

  const [profile] = useState<ProfileInfo>({
    name: "Rahul",
    role: "Builder • Startups • Collaboration",
    location: "India",
    avatarUrl: "/avatar/default-avatar.png",
  });

  const go = (path: string, ftab?: FooterTab) => {
    if (ftab) setFooterTab(ftab);
    router.push(path);
  };

  const milestones = milestoneByYear[activeYear] || [];
  const shownHistory = historyData.slice(0, historyShown);
  const canLoadMore = historyShown < historyData.length;

  const credibilityScore = useMemo(() => {
    const completedMilestones = Object.values(milestoneByYear)
      .flat()
      .filter((m) => m.status === "Completed").length;

    const historyCompleted = historyData.filter((h) => h.status === "Completed").length;
    const skillsCount = skillsData.length;

    return Math.min(
      100,
      40 + completedMilestones * 8 + historyCompleted * 6 + Math.min(skillsCount, 8) * 2
    );
  }, []);

  return (
    <div className="sync-theme-page min-h-screen pb-24">
      <Header
        title="Profile"
        subtitle="Credibility • milestones • history"
        variant="profile"
      />

      <div className="mx-auto w-full max-w-[480px] px-4 py-5 space-y-5">
        <div className="rounded-[28px] border border-[var(--line-soft)] bg-[var(--surface-solid)] p-4 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-[var(--line-soft)] bg-[var(--muted)]">
              <img
                src={profile.avatarUrl || "/avatar/default-avatar.png"}
                alt="Profile"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <div className="flex h-full w-full items-center justify-center text-[1.6rem] font-bold text-[var(--text-main)]">
                {profile.name?.slice(0, 1).toUpperCase()}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-[1.65rem] font-extrabold tracking-[-0.03em] text-[var(--text-main)]">
                {profile.name}
              </div>
              <div className="mt-1 text-sm text-[var(--text-muted-2)]">
                {profile.role}
              </div>
              <div className="mt-1 text-sm text-[var(--text-soft-2)]">
                {profile.location}
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-center">
            <div className="grid w-full max-w-[280px] grid-cols-3 gap-2.5">
              <div className="rounded-[22px] bg-[var(--muted)] px-2.5 py-3 text-center">
                <div className="text-[1.5rem] font-extrabold leading-none text-[var(--text-main)]">
                  {credibilityScore}
                </div>
                <div className="mt-1.5 text-[11px] text-[var(--text-muted-2)]">
                  Credibility
                </div>
              </div>

              <div className="rounded-[22px] bg-[var(--muted)] px-2.5 py-3 text-center">
                <div className="text-[1.5rem] font-extrabold leading-none text-[var(--text-main)]">
                  {Object.values(milestoneByYear).flat().length}
                </div>
                <div className="mt-1.5 text-[11px] text-[var(--text-muted-2)]">
                  Milestones
                </div>
              </div>

              <div className="rounded-[22px] bg-[var(--muted)] px-2.5 py-3 text-center">
                <div className="text-[1.5rem] font-extrabold leading-none text-[var(--text-main)]">
                  {historyData.length}
                </div>
                <div className="mt-1.5 text-[11px] text-[var(--text-muted-2)]">
                  History
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-[1.15rem] font-bold text-[var(--text-main)]">Milestones</h3>
          <span className="text-sm text-[var(--text-muted-2)]">Credibility timeline</span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {years.map((y) => {
            const active = y === activeYear;
            return (
              <button
                key={y}
                onClick={() => setActiveYear(y)}
                className={[
                  "rounded-full border px-5 py-2.5 text-sm font-semibold transition",
                  active
                    ? "border-[var(--primary-btn-bg)] bg-[var(--primary-btn-bg)] text-[var(--primary-btn-text)]"
                    : "border-[var(--line-soft)] bg-[var(--surface-solid)] text-[var(--text-muted-2)]",
                ].join(" ")}
              >
                {y}
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          {milestones.map((m, idx) => (
            <div
              key={idx}
              className="rounded-[26px] border border-[var(--line-soft)] bg-[var(--surface-solid)] p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="font-semibold text-[var(--text-main)]">{m.title}</div>
                <span
                  className={[
                    "rounded-full px-3 py-1 text-xs font-semibold",
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
                  <span
                    key={t}
                    className="rounded-full bg-[var(--muted)] px-3 py-1 text-xs text-[var(--text-muted-2)]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-1">
          <h3 className="text-[1.15rem] font-bold text-[var(--text-main)]">Collaboration History</h3>
          <button className="text-sm font-semibold text-[var(--text-muted-2)]">
            Timeline
          </button>
        </div>

        <div className="space-y-3">
          {shownHistory.map((h, idx) => (
            <div
              key={idx}
              className="rounded-[26px] border border-[var(--line-soft)] bg-[var(--surface-solid)] p-4 shadow-sm"
            >
              <div className="font-semibold text-[var(--text-main)]">{h.title}</div>
              <div className="mt-1 text-sm text-[var(--text-muted-2)]">
                {h.role} • {h.status} • {h.date}
              </div>
            </div>
          ))}
        </div>

        {canLoadMore && (
          <button
            onClick={() => setHistoryShown((v) => Math.min(v + 1, historyData.length))}
            className="h-12 w-full rounded-[22px] border border-[var(--line-soft)] bg-[var(--surface-solid)] font-bold text-[var(--text-main)] shadow-sm"
          >
            Load more
          </button>
        )}

        <div className="flex items-center justify-between pt-1">
          <h3 className="text-[1.15rem] font-bold text-[var(--text-main)]">Skills</h3>
          <button className="text-sm font-semibold text-[var(--text-muted-2)]">
            Tags
          </button>
        </div>

        <div className="rounded-[26px] border border-[var(--line-soft)] bg-[var(--surface-solid)] p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {skillsData.map((s) => (
              <span
                key={s}
                className="rounded-full bg-[var(--muted)] px-3 py-1.5 text-xs font-medium text-[var(--text-main)]"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={() => alert("Invite sent (demo)")}
          className="h-12 w-full rounded-[22px] bg-[var(--primary-btn-bg)] font-extrabold text-[var(--primary-btn-text)] shadow-md active:scale-[0.99]"
        >
          Invite to Collaboration
        </button>
      </div>

      <BottomNav />
    </div>
  );
}