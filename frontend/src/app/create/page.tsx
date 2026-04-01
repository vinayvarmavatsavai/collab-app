"use client";

import { useMemo, useState } from "react";
import Header from "../navigation/Header";
import { useRouter } from "next/navigation";
import BottomNav from "../navigation/BottomNav";
import {
  addMyRequest,
  deriveInterestTags,
  getMyRequests,
  getNextRequestId,
  getProfileDisplayName,
  getProfileRoleLabel,
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

type RecommendationItem = SuggestedCollaborator & {
  score: number;
  matchedSkills: string[];
  matchedTags: string[];
};

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

export default function CreateCollaborationPage() {
  const router = useRouter();

  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    shortDesc: "",
    problem: "",
    skills: "",
    experience: "",
    hours: "",
    duration: "",
    compensation: "",
    type: "public",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function resetForm() {
    setForm({
      title: "",
      shortDesc: "",
      problem: "",
      skills: "",
      experience: "",
      hours: "",
      duration: "",
      compensation: "",
      type: "public",
    });
    setError("");
  }

  const typedSkills = useMemo(() => {
    return form.skills
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }, [form.skills]);

  const shouldShowRecommendations = typedSkills.length > 0;

  const derivedTagsPreview = useMemo(() => {
    if (!shouldShowRecommendations) return [];

    return deriveInterestTags({
      title: form.title.trim(),
      skills: typedSkills,
      problem: form.problem.trim(),
    });
  }, [form.title, form.problem, typedSkills, shouldShowRecommendations]);

  const recommendations = useMemo<RecommendationItem[]>(() => {
    if (!shouldShowRecommendations) return [];

    const normalizedSkills = typedSkills.map(normalizeText);
    const domainSignals = getDomainSignals(
      derivedTagsPreview,
      form.title.trim(),
      form.problem.trim(),
    ).map(normalizeText);

    return MOCK_COLLABORATORS.map((person) => {
      const personSkillsNormalized = person.skills.map(normalizeText);
      const personDomainNormalized = normalizeText(person.primaryDomain);

      const matchedSkills = person.skills.filter((skill) =>
        normalizedSkills.some(
          (typedSkill) =>
            normalizeText(skill).includes(typedSkill) ||
            typedSkill.includes(normalizeText(skill)),
        ),
      );

      const matchedTags = person.tags.filter((tag) =>
        derivedTagsPreview.some((derivedTag) => {
          const normalizedDerived = normalizeText(derivedTag);
          return (
            normalizeText(tag).includes(normalizedDerived) ||
            normalizedDerived.includes(normalizeText(tag))
          );
        }),
      );

      let score = 0;
      score += matchedSkills.length * 35;
      score += matchedTags.length * 18;

      if (domainSignals.some((signal) => personDomainNormalized.includes(signal))) {
        score += 22;
      }

      if (
        personSkillsNormalized.some((skill) =>
          domainSignals.some(
            (signal) => skill.includes(signal) || signal.includes(skill),
          ),
        )
      ) {
        score += 8;
      }

      if (
        form.experience === "Beginner" &&
        /collaborators|building projects/i.test(person.intent)
      ) {
        score += 4;
      }

      if (
        form.type === "public" &&
        /collaborators|open source|research/i.test(person.intent)
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
  }, [
    typedSkills,
    derivedTagsPreview,
    form.title,
    form.problem,
    form.experience,
    form.type,
    shouldShowRecommendations,
  ]);

  function handleSubmit() {
    const trimmedTitle = form.title.trim();
    const trimmedShortDesc = form.shortDesc.trim();
    const trimmedProblem = form.problem.trim();
    const trimmedSkills = form.skills.trim();

    if (!trimmedTitle) {
      setError("Please enter a project title.");
      return;
    }

    if (!trimmedShortDesc) {
      setError("Please enter a short description.");
      return;
    }

    if (!trimmedProblem) {
      setError("Please enter a problem statement.");
      return;
    }

    if (!trimmedSkills) {
      setError("Please enter required skills.");
      return;
    }

    if (!form.hours) {
      setError("Please select weekly time commitment.");
      return;
    }

    const skillsArray = trimmedSkills
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const existing = getMyRequests();

    const createdPost: CollaborationPost = {
      id: getNextRequestId(existing),
      title: trimmedTitle,
      by: getProfileDisplayName(),
      role: getProfileRoleLabel(),
      skills: skillsArray,
      type: form.type === "public" ? "Public" : "Private",
      mode: "Online",
      hours: form.hours,
      interestTags: deriveInterestTags({
        title: trimmedTitle,
        skills: skillsArray,
        problem: trimmedProblem,
      }),
      shortDesc: trimmedShortDesc,
      problem: trimmedProblem,
      experience: form.experience,
      duration: form.duration.trim(),
      compensation: form.compensation,
      createdAt: new Date().toISOString(),
    };

    addMyRequest(createdPost);
    resetForm();
    router.push("/explore");
  }

  return (
    <div className="sync-theme-page sync-page-with-bottom-nav min-h-dvh pb-24">
      <div className="sticky top-0 z-30 sync-theme-page">
        <Header
          title="Collaboration"
          subtitle="Define your project clearly to attract the right collaborators."
        />
      </div>

      <div className="mx-auto w-full max-w-[480px] space-y-6 px-4 py-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--text-main)]">
            Project Title *
          </label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Example: AI Resume Analyzer for Students"
            className="sync-theme-input w-full rounded-2xl px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--text-main)]">
            Short Description *
          </label>
          <textarea
            name="shortDesc"
            value={form.shortDesc}
            onChange={handleChange}
            placeholder="One line summary of the project"
            rows={2}
            className="sync-theme-input w-full rounded-2xl px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--text-main)]">
            Problem Statement *
          </label>
          <textarea
            name="problem"
            value={form.problem}
            onChange={handleChange}
            placeholder="Describe the core problem you are solving..."
            rows={4}
            className="sync-theme-input w-full rounded-2xl px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--text-main)]">
            Required Skills *
          </label>
          <input
            name="skills"
            value={form.skills}
            onChange={handleChange}
            placeholder="React, Node.js, UI/UX"
            className="sync-theme-input w-full rounded-2xl px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--text-main)]">
            Experience Level Needed
          </label>
          <select
            name="experience"
            value={form.experience}
            onChange={handleChange}
            className="sync-theme-input w-full rounded-2xl px-4 py-3 text-sm"
          >
            <option value="">Select level</option>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--text-main)]">
            Weekly Time Commitment *
          </label>
          <select
            name="hours"
            value={form.hours}
            onChange={handleChange}
            className="sync-theme-input w-full rounded-2xl px-4 py-3 text-sm"
          >
            <option value="">Select hours</option>
            <option>1–3 hrs/week</option>
            <option>4–7 hrs/week</option>
            <option>8–15 hrs/week</option>
            <option>15+ hrs/week</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--text-main)]">
            Project Duration
          </label>
          <input
            name="duration"
            value={form.duration}
            onChange={handleChange}
            placeholder="Example: 3 months"
            className="sync-theme-input w-full rounded-2xl px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--text-main)]">
            Compensation
          </label>
          <select
            name="compensation"
            value={form.compensation}
            onChange={handleChange}
            className="sync-theme-input w-full rounded-2xl px-4 py-3 text-sm"
          >
            <option value="">Select type</option>
            <option>Unpaid</option>
            <option>Paid</option>
            <option>Equity-based</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--text-main)]">
            Collaboration Type
          </label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="sync-theme-input w-full rounded-2xl px-4 py-3 text-sm"
          >
            <option value="public">Open Public (AI Matched)</option>
            <option value="private">Private Invite Only</option>
          </select>
        </div>

        {shouldShowRecommendations && (
          <section className="rounded-3xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[var(--text-main)]">
                  Suggested collaborators
                </h2>
                <p className="mt-1 text-xs text-[var(--text-muted-2)]">
                  Based on required skills and derived interest tags
                </p>
              </div>

              <span className="rounded-full border border-[var(--line-soft)] bg-[var(--muted)] px-3 py-1 text-[11px] font-semibold text-[var(--text-main)]">
                {recommendations.length} matches
              </span>
            </div>

            {derivedTagsPreview.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {derivedTagsPreview.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[var(--line-soft)] bg-[var(--muted)] px-3 py-1 text-[11px] font-semibold capitalize text-[var(--text-main)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 space-y-3">
              {recommendations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--line-soft)] bg-[var(--muted)] px-4 py-5 text-center">
                  <p className="text-sm font-medium text-[var(--text-main)]">
                    No recommendations found for these skills
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted-2)]">
                    Try adding clearer comma-separated skills like React, AWS, AI, Pandas, ROS.
                  </p>
                </div>
              ) : (
                recommendations.map((person) => (
                  <div
                    key={person.id}
                    className="rounded-2xl border border-[var(--line-soft)] bg-[var(--muted)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[var(--text-main)]">
                          {person.firstName} {person.lastName}
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-muted-2)]">
                          @{person.username} • {person.primaryDomain}
                        </p>
                      </div>

                      <span className="rounded-full bg-[var(--surface-solid)] px-3 py-1 text-[11px] font-semibold text-[var(--text-main)]">
                        {person.score}% match
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-[var(--text-muted-2)]">
                      {person.intent}
                    </p>

                    {person.matchedSkills.length > 0 ? (
                      <div className="mt-3">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted-2)]">
                          Matched Skills
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {person.matchedSkills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full bg-[var(--surface-solid)] px-3 py-1 text-[11px] font-semibold text-[var(--text-main)]"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {person.matchedTags.length > 0 ? (
                      <div className="mt-3">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted-2)]">
                          Matched Tags
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {person.matchedTags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-[var(--line-soft)] bg-[var(--surface-solid)] px-3 py-1 text-[11px] font-semibold capitalize text-[var(--text-main)]"
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
                          className="rounded-full border border-[var(--line-soft)] bg-transparent px-3 py-1 text-[11px] text-[var(--text-muted-2)]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {error ? (
          <div className="rounded-2xl border border-[var(--danger-soft-border)] bg-[var(--danger-soft-bg)] px-4 py-3 text-sm text-[var(--danger-soft-text)]">
            {error}
          </div>
        ) : null}

        <button
          onClick={handleSubmit}
          className="sync-theme-primary-btn mt-6 h-12 w-full rounded-2xl font-extrabold shadow-sm"
        >
          Create Collaboration →
        </button>
      </div>

      <BottomNav />
    </div>
  );
}