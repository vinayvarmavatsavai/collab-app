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

type SuggestedCollaborator = {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  primaryDomain: string;
  skills: string[];
  tags: string[];
  intent: string;
};

type RecommendationItem = SuggestedCollaborator & {
  score: number;
  matchedSkills: string[];
  matchedTags: string[];
};

const MOCK_COLLABORATORS: SuggestedCollaborator[] = [
  {
    id: 1,
    firstName: "Leela",
    lastName: "Sankar",
    username: "leela1",
    primaryDomain: "Cloud Engineering",
    skills: ["Azure", "GCP", "AWS"],
    tags: ["analytics", "innovation"],
    intent: "Open to contributing to open source",
  },
  {
    id: 2,
    firstName: "Fitan",
    lastName: "Tank",
    username: "fitan2",
    primaryDomain: "AI",
    skills: ["NLP", "TensorFlow", "Machine Learning"],
    tags: ["research", "deployment"],
    intent: "Interested in building projects",
  },
  {
    id: 3,
    firstName: "Ekanta",
    lastName: "Swamy",
    username: "ekanta3",
    primaryDomain: "Blockchain",
    skills: ["Smart Contracts", "Solidity", "Ethereum"],
    tags: ["research", "development"],
    intent: "Interested in building projects",
  },
  {
    id: 4,
    firstName: "Aarini",
    lastName: "Barman",
    username: "aarini4",
    primaryDomain: "AI",
    skills: ["NLP", "Machine Learning", "PyTorch"],
    tags: ["analytics", "research"],
    intent: "Looking for collaborators",
  },
  {
    id: 5,
    firstName: "Maya",
    lastName: "Rout",
    username: "maya5",
    primaryDomain: "ECE",
    skills: ["Embedded Systems", "Signal Processing", "Verilog"],
    tags: ["development", "innovation"],
    intent: "Seeking co-founders",
  },
  {
    id: 6,
    firstName: "Daksh",
    lastName: "Subramaniam",
    username: "daksh6",
    primaryDomain: "Computer Science",
    skills: ["Algorithms", "Python", "Java"],
    tags: ["innovation", "development"],
    intent: "Looking for collaborators",
  },
  {
    id: 7,
    firstName: "Saksham",
    lastName: "Patil",
    username: "saksham7",
    primaryDomain: "AgriTech",
    skills: ["Soil Analysis", "Drones", "Precision Farming"],
    tags: ["deployment", "research"],
    intent: "Interested in building projects",
  },
  {
    id: 8,
    firstName: "Reva",
    lastName: "Bahl",
    username: "reva8",
    primaryDomain: "Robotics",
    skills: ["ROS", "Sensors", "Computer Vision"],
    tags: ["design", "innovation"],
    intent: "Seeking co-founders",
  },
  {
    id: 9,
    firstName: "Odika",
    lastName: "Mangal",
    username: "odika9",
    primaryDomain: "Mechanical",
    skills: ["CAD", "Thermodynamics", "SolidWorks"],
    tags: ["innovation", "development"],
    intent: "Seeking co-founders",
  },
  {
    id: 10,
    firstName: "Raksha",
    lastName: "Mane",
    username: "raksha10",
    primaryDomain: "Civil",
    skills: ["Surveying", "STAAD", "Structural Design"],
    tags: ["development", "deployment"],
    intent: "Looking for collaborators",
  },
  {
    id: 11,
    firstName: "Hema",
    lastName: "Konda",
    username: "hema11",
    primaryDomain: "Data Science",
    skills: ["Pandas", "Statistics", "SQL"],
    tags: ["development", "innovation"],
    intent: "Open to research partnerships",
  },
  {
    id: 12,
    firstName: "Balveer",
    lastName: "Bajaj",
    username: "balveer12",
    primaryDomain: "Computer Science",
    skills: ["Python", "React", "Algorithms"],
    tags: ["research", "development"],
    intent: "Looking for collaborators",
  },
  {
    id: 13,
    firstName: "Gaurangi",
    lastName: "Krish",
    username: "gaurangi13",
    primaryDomain: "HealthTech",
    skills: ["AI", "Medical Imaging", "EHR"],
    tags: ["analytics", "development"],
    intent: "Looking for collaborators",
  },
  {
    id: 14,
    firstName: "David",
    lastName: "Nigam",
    username: "david14",
    primaryDomain: "Cloud Engineering",
    skills: ["AWS", "GCP", "Serverless"],
    tags: ["deployment", "research"],
    intent: "Open to contributing to open source",
  },
  {
    id: 15,
    firstName: "Omya",
    lastName: "Nayak",
    username: "omya15",
    primaryDomain: "DevOps",
    skills: ["Terraform", "Kubernetes", "CI/CD"],
    tags: ["research", "development"],
    intent: "Open to research partnerships",
  },
  {
    id: 16,
    firstName: "Devansh",
    lastName: "Pingle",
    username: "devansh16",
    primaryDomain: "Cloud Engineering",
    skills: ["AWS", "Serverless", "GCP"],
    tags: ["analytics", "innovation"],
    intent: "Open to contributing to open source",
  },
  {
    id: 17,
    firstName: "Urmi",
    lastName: "Tiwari",
    username: "urmi17",
    primaryDomain: "Mechanical",
    skills: ["Thermodynamics", "CAD", "SolidWorks"],
    tags: ["development", "research"],
    intent: "Interested in building projects",
  },
  {
    id: 18,
    firstName: "Alka",
    lastName: "Malhotra",
    username: "alka18",
    primaryDomain: "FinTech",
    skills: ["APIs", "Payments", "Trading Systems"],
    tags: ["analytics", "development"],
    intent: "Interested in building projects",
  },
  {
    id: 19,
    firstName: "Ekiya",
    lastName: "Kara",
    username: "ekiya19",
    primaryDomain: "Data Science",
    skills: ["Pandas", "SQL", "NumPy"],
    tags: ["research", "design"],
    intent: "Looking for collaborators",
  },
];

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

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function getDomainSignals(tags: string[], title: string, problem: string) {
  const text = `${title} ${problem}`.toLowerCase();
  const signals = new Set<string>();

  if (tags.includes("ai")) {
    signals.add("ai");
    signals.add("data science");
    signals.add("healthtech");
  }

  if (tags.includes("data-science")) {
    signals.add("data science");
    signals.add("ai");
  }

  if (tags.includes("web-dev")) {
    signals.add("computer science");
    signals.add("devops");
    signals.add("cloud engineering");
  }

  if (tags.includes("robotics")) {
    signals.add("robotics");
    signals.add("ece");
  }

  if (tags.includes("design")) {
    signals.add("design");
  }

  if (
    text.includes("cloud") ||
    text.includes("aws") ||
    text.includes("gcp") ||
    text.includes("azure")
  ) {
    signals.add("cloud engineering");
    signals.add("devops");
  }

  if (
    text.includes("deploy") ||
    text.includes("deployment") ||
    text.includes("serverless")
  ) {
    signals.add("cloud engineering");
    signals.add("devops");
  }

  if (
    text.includes("api") ||
    text.includes("backend") ||
    text.includes("frontend")
  ) {
    signals.add("computer science");
  }

  return Array.from(signals);
}

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

  const recommendations = useMemo<RecommendationItem[]>(() => {
    if (!requestItem) return [];

    const normalizedSkills = requestItem.skills.map(normalizeText);
    const normalizedTags = requestItem.interestTags.map(normalizeText);
    const domainSignals = getDomainSignals(
      requestItem.interestTags,
      requestItem.title,
      requestItem.problem || "",
    ).map(normalizeText);

    return MOCK_COLLABORATORS.map((person) => {
      const personDomainNormalized = normalizeText(person.primaryDomain);

      const matchedSkills = person.skills.filter((skill) =>
        normalizedSkills.some(
          (requestSkill) =>
            normalizeText(skill).includes(requestSkill) ||
            requestSkill.includes(normalizeText(skill)),
        ),
      );

      const matchedTags = person.tags.filter((tag) =>
        normalizedTags.some(
          (requestTag) =>
            normalizeText(tag).includes(requestTag) ||
            requestTag.includes(normalizeText(tag)),
        ),
      );

      let score = 0;
      score += matchedSkills.length * 35;
      score += matchedTags.length * 18;

      if (domainSignals.some((signal) => personDomainNormalized.includes(signal))) {
        score += 22;
      }

      if (
        person.skills.some((skill) =>
          domainSignals.some((signal) => {
            const normalizedSkill = normalizeText(skill);
            return (
              normalizedSkill.includes(signal) || signal.includes(normalizedSkill)
            );
          }),
        )
      ) {
        score += 8;
      }

      if (
        requestItem.type === "Public" &&
        /collaborators|open source|research/i.test(person.intent)
      ) {
        score += 4;
      }

      if (
        requestItem.experience === "Beginner" &&
        /building projects|collaborators/i.test(person.intent)
      ) {
        score += 4;
      }

      return {
        ...person,
        score,
        matchedSkills,
        matchedTags,
      };
    })
      .filter((person) => person.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }, [requestItem]);

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

          <Link href="/explore" className="text-sm font-semibold text-[#2D6BFF]">
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
                <p className="mt-4 text-base text-slate-700">{requestItem.shortDesc}</p>
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

          <div className="mt-6 rounded-2xl bg-slate-50 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Recommended Collaborators
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Based on this request’s skills, tags, and project context
                </p>
              </div>

              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                {recommendations.length} matches
              </span>
            </div>

            {recommendations.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center">
                <p className="text-sm font-semibold text-slate-900">
                  No recommendations found
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Add stronger skills and tags to improve matching.
                </p>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {recommendations.map((person) => (
                  <div
                    key={person.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {person.firstName} {person.lastName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          @{person.username} • {person.primaryDomain}
                        </p>
                      </div>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                        {person.score}% match
                      </span>
                    </div>

                    <p className="mt-3 text-xs leading-6 text-slate-600">
                      {person.intent}
                    </p>

                    {person.matchedSkills.length > 0 ? (
                      <div className="mt-3">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Matched Skills
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {person.matchedSkills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {person.matchedTags.length > 0 ? (
                      <div className="mt-3">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Matched Tags
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {person.matchedTags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {person.skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-500"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}