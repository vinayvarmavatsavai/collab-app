"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../navigation/Header";
import BottomNav from "../navigation/BottomNav";
import { apiRequest } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

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

type UserProfileResponse = {
  id?: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  intent?: string;
  headline?: string;
  bio?: string;
  location?: string;
  profilePicture?: string;
  coverPhoto?: string;
  website?: string;
  currentCompany?: string;
  currentPosition?: string;
  experience?: Array<{
    id?: string;
    company?: string;
    position?: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
    description?: string;
    location?: string;
  }>;
  education?: Array<{
    id?: string;
    school?: string;
    degree?: string;
    field?: string;
    startYear?: string;
    endYear?: string;
    description?: string;
  }>;
  certifications?: Array<{
    id?: string;
    name?: string;
    issuer?: string;
    issueDate?: string;
    expiryDate?: string;
    credentialId?: string;
    credentialUrl?: string;
  }>;
  languages?: string[];
  profileCompleteness?: number;
  isProfilePublic?: boolean;
  onboardingCompleted?: boolean;
  projects?: Array<{
    title?: string;
    description?: string;
    role?: string;
    technologies?: string[];
    duration?: string;
  }>;
  collaborationGoals?: string;
  availabilityHours?: number;
  profileSummaryText?: string;
  skills?: string[];
  domains?: string[];
  userSkills?: Array<{
    id?: string;
    skill?: {
      id?: string;
      name?: string;
    };
    canonicalSkill?: {
      id?: string;
      name?: string;
    };
    name?: string;
  }>;
};

type ProfileCompletenessResponse = {
  completeness?: number;
  suggestions?: string[];
};

type ProfileInfo = {
  name: string;
  role: string;
  location: string;
  avatarUrl?: string;
};

const milestoneByYear: Record<number, Milestone[]> = {
  2026: [
    {
      title: "Autonomous Drone Vision",
      status: "Completed",
      tags: ["Milestone", "Completed"],
    },
    {
      title: "Model Compression Pipeline",
      status: "In progress",
      tags: ["Milestone", "In progress"],
    },
  ],
  2025: [
    {
      title: "Edge Inference Benchmarking",
      status: "Completed",
      tags: ["Milestone", "Completed"],
    },
    {
      title: "Robotics Sensor Fusion",
      status: "Completed",
      tags: ["Milestone", "Completed"],
    },
  ],
  2024: [
    {
      title: "Deployment Playbook v1",
      status: "Completed",
      tags: ["Milestone", "Completed"],
    },
  ],
};

const historyData: HistoryItem[] = [
  {
    title: "AI Model Optimization",
    role: "Contributor • Milestones",
    status: "Completed",
    date: "Jan 2026",
  },
  {
    title: "Prototype Review Sprint",
    role: "Reviewer • Advisory",
    status: "Completed",
    date: "Oct 2025",
  },
  {
    title: "Sensor Fusion Audit",
    role: "Advisor • Robotics",
    status: "Completed",
    date: "May 2025",
  },
];

export default function ProfilePage() {
  const router = useRouter();

  const years = useMemo(
    () => Object.keys(milestoneByYear).map(Number).sort((a, b) => b - a),
    []
  );

  const [activeYear, setActiveYear] = useState<number>(years[0]);
  const [historyShown, setHistoryShown] = useState(1);
  const [footerTab, setFooterTab] = useState<FooterTab>("profile");

  const [profile, setProfile] = useState<ProfileInfo>({
    name: "Loading...",
    role: "Loading profile...",
    location: "Loading...",
    avatarUrl: "/avatar/default-avatar.png",
  });

  const [skillsData, setSkillsData] = useState<string[]>([]);
  const [profileCompleteness, setProfileCompleteness] = useState<number>(20);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const go = (path: string, ftab?: FooterTab) => {
    if (ftab) setFooterTab(ftab);
    router.push(path);
  };

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    async function fetchProfile() {
      try {
        setIsLoading(true);
        setError("");

        const [profileResponse, completenessResponse] = await Promise.all([
          apiRequest<UserProfileResponse>("/users/me/profile", {
            method: "GET",
            token,
          }),
          apiRequest<ProfileCompletenessResponse>(
            "/users/me/profile/completeness",
            {
              method: "GET",
              token,
            }
          ).catch(
            (): ProfileCompletenessResponse => ({ completeness: 20 })
          ),
        ]);

        const fullName =
          `${profileResponse.firstname ?? ""} ${profileResponse.lastname ?? ""}`.trim() ||
          "User";

        const roleText =
          profileResponse.headline ||
          [profileResponse.currentPosition, profileResponse.currentCompany]
            .filter(Boolean)
            .join(" • ") ||
          profileResponse.intent ||
          "Builder • Collaboration";

        const locationText = profileResponse.location || "Location not added";

        setProfile({
          name: fullName,
          role: roleText,
          location: locationText,
          avatarUrl:
            profileResponse.profilePicture || "/avatar/default-avatar.png",
        });

        const normalizedSkills =
          profileResponse.userSkills
            ?.map((item) => {
              return (
                item?.canonicalSkill?.name ||
                item?.skill?.name ||
                item?.name ||
                ""
              );
            })
            .filter(Boolean) || profileResponse.skills || [];

        setSkillsData(normalizedSkills);

        setProfileCompleteness(
          completenessResponse.completeness ??
            profileResponse.profileCompleteness ??
            20
        );
      } catch (err) {
        console.error("Failed to load profile", err);
        setError("Failed to load profile.");
      } finally {
        setIsLoading(false);
      }
    }

    void fetchProfile();
  }, [router]);

  const milestones = milestoneByYear[activeYear] || [];
  const shownHistory = historyData.slice(0, historyShown);
  const canLoadMore = historyShown < historyData.length;

  const credibilityScore = useMemo(() => {
    const completedMilestones = Object.values(milestoneByYear)
      .flat()
      .filter((m) => m.status === "Completed").length;

    const historyCompleted = historyData.filter(
      (h) => h.status === "Completed"
    ).length;

    const skillsCount = skillsData.length;

    return Math.min(
      100,
      40 +
        completedMilestones * 8 +
        historyCompleted * 6 +
        Math.min(skillsCount, 8) * 2
    );
  }, [skillsData]);

  if (isLoading) {
    return (
      <div className="sync-theme-page min-h-screen pb-24">
        <Header
          title="Profile"
          subtitle="Credibility • milestones • history"
          variant="profile"
        />
        <div className="mx-auto w-full max-w-[480px] px-4 py-5">
          <div className="rounded-[28px] border border-[var(--line-soft)] bg-[var(--surface-solid)] p-4 shadow-sm">
            <div className="text-sm text-[var(--text-muted-2)]">
              Loading profile...
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="sync-theme-page min-h-screen pb-24">
      <Header
        title="Profile"
        subtitle="Credibility • milestones • history"
        variant="profile"
      />

      <div className="mx-auto w-full max-w-[480px] space-y-5 px-4 py-5">
        {error ? (
          <div className="rounded-[22px] border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="rounded-[28px] border border-[var(--line-soft)] bg-[var(--surface-solid)] p-4 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-[var(--line-soft)] bg-[var(--muted)]">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="Profile"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : null}
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
                  {profileCompleteness}
                </div>
                <div className="mt-1.5 text-[11px] text-[var(--text-muted-2)]">
                  Complete %
                </div>
              </div>

              <div className="rounded-[22px] bg-[var(--muted)] px-2.5 py-3 text-center">
                <div className="text-[1.5rem] font-extrabold leading-none text-[var(--text-main)]">
                  {skillsData.length}
                </div>
                <div className="mt-1.5 text-[11px] text-[var(--text-muted-2)]">
                  Skills
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-[1.15rem] font-bold text-[var(--text-main)]">
            Milestones
          </h3>
          <span className="text-sm text-[var(--text-muted-2)]">
            Credibility timeline
          </span>
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
                <div className="font-semibold text-[var(--text-main)]">
                  {m.title}
                </div>
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
          <h3 className="text-[1.15rem] font-bold text-[var(--text-main)]">
            Collaboration History
          </h3>
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
              <div className="font-semibold text-[var(--text-main)]">
                {h.title}
              </div>
              <div className="mt-1 text-sm text-[var(--text-muted-2)]">
                {h.role} • {h.status} • {h.date}
              </div>
            </div>
          ))}
        </div>

        {canLoadMore && (
          <button
            onClick={() =>
              setHistoryShown((v) => Math.min(v + 1, historyData.length))
            }
            className="h-12 w-full rounded-[22px] border border-[var(--line-soft)] bg-[var(--surface-solid)] font-bold text-[var(--text-main)] shadow-sm"
          >
            Load more
          </button>
        )}

        <div className="flex items-center justify-between pt-1">
          <h3 className="text-[1.15rem] font-bold text-[var(--text-main)]">
            Skills
          </h3>
          <button className="text-sm font-semibold text-[var(--text-muted-2)]">
            Tags
          </button>
        </div>

        <div className="rounded-[26px] border border-[var(--line-soft)] bg-[var(--surface-solid)] p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {skillsData.length > 0 ? (
              skillsData.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-[var(--muted)] px-3 py-1.5 text-xs font-medium text-[var(--text-main)]"
                >
                  {s}
                </span>
              ))
            ) : (
              <span className="text-sm text-[var(--text-muted-2)]">
                No skills added yet.
              </span>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}