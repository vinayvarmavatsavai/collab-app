// file: src/app/explore/[requestId]/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  addRequestApplicant,
  getAppliedRequestIds,
  getMyRequests,
  getProfileDisplayName,
  getProfileRoleLabel,
  getSavedRequestIds,
  removeRequestApplicant,
  saveAppliedRequestIds,
  saveSavedRequestIds,
  type CollaborationPost,
} from "@/lib/collaboration";

const mockAllRequests: CollaborationPost[] = [
  {
    id: 201,
    title: "Robotics Sensor Fusion Prototype",
    by: "Sanjay",
    role: "Research Student",
    skills: ["Robotics", "Python", "ROS"],
    type: "Public",
    mode: "In-person",
    hours: "6-10 hrs/week",
    interestTags: ["robotics", "ai"],
    shortDesc: "Prototype collaboration for robotics perception and sensor fusion.",
    problem:
      "We are building a robotics prototype that needs sensor fusion support for better environmental understanding and testing.",
    experience: "Intermediate",
    duration: "2 months",
    compensation: "Unpaid",
    createdAt: "2026-03-17T08:00:00.000Z",
  },
  {
    id: 202,
    title: "Build AI Resume Analyzer",
    by: "Rahul",
    role: "Startup Founder",
    skills: ["React", "Node.js", "AI"],
    type: "Public",
    mode: "Online",
    hours: "5-8 hrs/week",
    interestTags: ["data-science", "ai", "web-dev"],
    shortDesc: "Help build an AI-based resume screening tool for students.",
    problem:
      "We want to help students improve their resumes using AI-based feedback and scoring. Need collaborators for frontend, backend, and AI integration.",
    experience: "Intermediate",
    duration: "3 months",
    compensation: "Paid",
    createdAt: "2026-03-17T08:00:00.000Z",
  },
  {
    id: 203,
    title: "Data Science — Churn Prediction",
    by: "Meghana",
    role: "Student",
    skills: ["Python", "Pandas", "ML"],
    type: "Public",
    mode: "Online",
    hours: "4-6 hrs/week",
    interestTags: ["data-science", "ai"],
    shortDesc: "Student project focused on customer churn prediction.",
    problem:
      "Need support with preprocessing, feature engineering, baseline models, and evaluation for a churn prediction problem.",
    experience: "Beginner",
    duration: "1.5 months",
    compensation: "Unpaid",
    createdAt: "2026-03-17T08:00:00.000Z",
  },
  {
    id: 204,
    title: "Startup Landing Page UI Revamp",
    by: "Ayesha",
    role: "Designer",
    skills: ["UI/UX", "Figma"],
    type: "Public",
    mode: "Online",
    hours: "3-5 hrs/week",
    interestTags: ["design", "web-dev"],
    shortDesc: "Need design help for a startup landing page refresh.",
    problem:
      "We need a cleaner landing page experience with stronger hierarchy, modern sections, and mobile-first improvements.",
    experience: "Intermediate",
    duration: "1 month",
    compensation: "Paid",
    createdAt: "2026-03-17T08:00:00.000Z",
  },
  {
    id: 205,
    title: "Mobile App Backend APIs",
    by: "Kiran",
    role: "Freelancer",
    skills: ["Next.js", "MongoDB"],
    type: "Public",
    mode: "Online",
    hours: "6-10 hrs/week",
    interestTags: ["web-dev"],
    shortDesc: "Backend API collaboration for a mobile app product.",
    problem:
      "Need API endpoints, DB integration, auth flow support, and deployment-ready backend setup for the app MVP.",
    experience: "Advanced",
    duration: "2.5 months",
    compensation: "Equity-based",
    createdAt: "2026-03-17T08:00:00.000Z",
  },
];

export default function ExploreRequestDetailPage() {
  const router = useRouter();
  const params = useParams<{ requestId: string }>();
  const requestId = Number(params?.requestId);

  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [appliedIds, setAppliedIds] = useState<number[]>([]);
  const [myRequests, setMyRequests] = useState<CollaborationPost[]>([]);

  useEffect(() => {
    try {
      setSavedIds(getSavedRequestIds());
    } catch {
      setSavedIds([]);
    }

    try {
      setAppliedIds(getAppliedRequestIds());
    } catch {
      setAppliedIds([]);
    }

    try {
      setMyRequests(getMyRequests());
    } catch {
      setMyRequests([]);
    }
  }, []);

  const allRequests = useMemo(() => {
    const mine = [...myRequests];
    const others = mockAllRequests.filter(
      (item) => !mine.some((myItem) => myItem.id === item.id),
    );
    return [...mine, ...others];
  }, [myRequests]);

  const requestItem = useMemo(() => {
    return allRequests.find((item) => item.id === requestId) || null;
  }, [allRequests, requestId]);

  const isSaved = requestItem ? savedIds.includes(requestItem.id) : false;
  const isApplied = requestItem ? appliedIds.includes(requestItem.id) : false;
  const isMyRequest = requestItem
    ? myRequests.some((item) => item.id === requestItem.id)
    : false;

  function toggleSave() {
    if (!requestItem) return;

    const next = savedIds.includes(requestItem.id)
      ? savedIds.filter((id) => id !== requestItem.id)
      : [...savedIds, requestItem.id];

    setSavedIds(next);
    saveSavedRequestIds(next);
  }

 function toggleApply() {
  if (!requestItem) return;

  const next = appliedIds.includes(requestItem.id)
    ? appliedIds.filter((id) => id !== requestItem.id)
    : [...appliedIds, requestItem.id];

  setAppliedIds(next);
  saveAppliedRequestIds(next);

  if (appliedIds.includes(requestItem.id)) {
    removeRequestApplicant(requestItem.id, getProfileDisplayName());
  } else {
    addRequestApplicant({
      requestId: requestItem.id,
      applicantName: getProfileDisplayName(),
      applicantRole: getProfileRoleLabel(),
    });
  }
}
  if (!requestId || Number.isNaN(requestId)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4F6FB] px-4 text-slate-900">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold">Invalid request</h1>
          <p className="mt-2 text-sm text-slate-500">
            The request id is missing or invalid.
          </p>
          <Link
            href="/explore"
            className="mt-5 inline-flex rounded-xl bg-[#2D6BFF] px-4 py-2 text-sm font-semibold text-white"
          >
            Back to Explore
          </Link>
        </div>
      </main>
    );
  }

  if (!requestItem) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4F6FB] px-4 text-slate-900">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold">Request not found</h1>
          <p className="mt-2 text-sm text-slate-500">
            No collaboration request matched this id.
          </p>
          <Link
            href="/explore"
            className="mt-5 inline-flex rounded-xl bg-[#2D6BFF] px-4 py-2 text-sm font-semibold text-white"
          >
            Back to Explore
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F6FB] px-4 py-6 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            ← Back
          </button>

          <Link
            href="/explore"
            className="text-sm font-semibold text-[#2D6BFF]"
          >
            Explore
          </Link>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {requestItem.type}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {requestItem.mode}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {requestItem.hours}
                </span>
                {isMyRequest ? (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    My Request
                  </span>
                ) : null}
              </div>

              <h1 className="text-2xl font-bold sm:text-3xl">{requestItem.title}</h1>

              <p className="mt-2 text-sm text-slate-500">
                Posted by {requestItem.by} • {requestItem.role}
              </p>

              {requestItem.shortDesc ? (
                <p className="mt-4 text-base text-slate-700">
                  {requestItem.shortDesc}
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
  <button
    onClick={toggleSave}
    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
      isSaved
        ? "bg-slate-900 text-white"
        : "border border-slate-200 bg-white text-slate-700"
    }`}
  >
    {isSaved ? "Saved ★" : "Save ☆"}
  </button>

  {isMyRequest ? (
    <Link
      href={`/requests/${requestItem.id}/applicants`}
      className="rounded-xl bg-[#2D6BFF] px-4 py-2 text-sm font-semibold text-white transition"
    >
      View Applicants
    </Link>
  ) : (
    <button
      onClick={toggleApply}
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
        isApplied
          ? "bg-emerald-100 text-emerald-700"
          : "bg-[#2D6BFF] text-white"
      }`}
    >
      {isApplied ? "Applied ✓" : "Apply"}
    </button>
  )}
</div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Experience Level
              </p>
              <p className="mt-2 font-semibold text-slate-900">
                {requestItem.experience || "Not specified"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Duration
              </p>
              <p className="mt-2 font-semibold text-slate-900">
                {requestItem.duration || "Not specified"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Compensation
              </p>
              <p className="mt-2 font-semibold text-slate-900">
                {requestItem.compensation || "Not specified"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Collaboration Mode
              </p>
              <p className="mt-2 font-semibold text-slate-900">
                {requestItem.mode}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-5">
            <h2 className="text-lg font-bold text-slate-900">Problem Statement</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              {requestItem.problem || "No detailed problem statement added yet."}
            </p>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-5">
            <h2 className="text-lg font-bold text-slate-900">Required Skills</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {requestItem.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-5">
            <h2 className="text-lg font-bold text-slate-900">Interest Tags</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {requestItem.interestTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white px-3 py-1 text-xs font-semibold capitalize text-slate-700 shadow-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}