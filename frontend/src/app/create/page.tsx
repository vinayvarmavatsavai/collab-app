"use client";

import { useState } from "react";
import Header from "../navigation/Header";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import BottomNav from "../navigation/BottomNav";
import { apiRequest } from "@/lib/api";
import {
  addMyRequest,
  deriveInterestTags,
  getMyRequests,
  getNextRequestId,
  getProfileDisplayName,
  getProfileRoleLabel,
  type CollaborationPost,
} from "@/lib/collaboration";

type CreateProjectPayload = {
  title: string;
  description: string;
  requiredSkills: string[];
  requiredDomains: string[];
  optionalSkills?: string[];
  preferredExperienceLevel?: "junior" | "mid" | "senior" | "any";
  maxCohortSize?: number;
  visibilityMode?: "matching-only" | "open" | "hybrid";
};

type CreatedProjectResponse = {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  requiredDomains: string[];
  optionalSkills?: string[];
  preferredExperienceLevel?: string | null;
  maxCohortSize?: number;
  visibilityMode?: "matching-only" | "open" | "hybrid";
  status?: string;
  createdAt?: string;
};

function mapExperienceToBackend(
  value: string,
): "junior" | "mid" | "senior" | "any" | undefined {
  const normalized = value.trim().toLowerCase();

  if (!normalized) return undefined;
  if (normalized === "beginner") return "junior";
  if (normalized === "intermediate") return "mid";
  if (normalized === "advanced") return "senior";

  return undefined;
}

function mapTypeToVisibilityMode(
  value: string,
): "matching-only" | "open" | "hybrid" {
  if (value === "private") {
    return "matching-only";
  }

  return "open";
}

function mapInterestTagsToDomains(tags: string[]): string[] {
  const domainMap: Record<string, string> = {
    robotics: "Robotics",
    "data-science": "Data Science",
    "web-dev": "Web Development",
    design: "Design",
    ai: "Artificial Intelligence",
  };

  const mapped = tags
    .map((tag) => domainMap[tag] || tag)
    .map((item) => item.trim())
    .filter(Boolean);

  return Array.from(new Set(mapped));
}

function buildDescription(shortDesc: string, problem: string) {
  const short = shortDesc.trim();
  const prob = problem.trim();

  if (short && prob) {
    return `${short}\n\n${prob}`;
  }

  return short || prob;
}

export default function CreateCollaborationPage() {
  const router = useRouter();

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  async function handleSubmit() {
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

    const interestTags = deriveInterestTags({
      title: trimmedTitle,
      skills: skillsArray,
      problem: trimmedProblem,
    });

    const requiredDomains = mapInterestTagsToDomains(interestTags);

    const payload: CreateProjectPayload = {
      title: trimmedTitle,
      description: buildDescription(trimmedShortDesc, trimmedProblem),
      requiredSkills: skillsArray,
      requiredDomains,
      optionalSkills: [],
      preferredExperienceLevel: mapExperienceToBackend(form.experience),
      maxCohortSize: 5,
      visibilityMode: mapTypeToVisibilityMode(form.type),
    };

    setError("");
    setIsSubmitting(true);

    try {
      const created = await apiRequest<CreatedProjectResponse>("/projects", {
        method: "POST",
        body: payload,
      });

      const existing = getMyRequests();

      const createdPost: CollaborationPost = {
        id: getNextRequestId(existing),
        title: created.title || trimmedTitle,
        by: getProfileDisplayName(),
        role: getProfileRoleLabel(),
        skills: created.requiredSkills?.length ? created.requiredSkills : skillsArray,
        type: form.type === "public" ? "Public" : "Private",
        mode: "Online",
        hours: form.hours,
        interestTags,
        shortDesc: trimmedShortDesc,
        problem: trimmedProblem,
        experience: form.experience,
        duration: form.duration.trim(),
        compensation: form.compensation,
        createdAt: created.createdAt || new Date().toISOString(),
      };

      addMyRequest(createdPost);
      resetForm();
      router.push("/explore");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create collaboration.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
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

        {error ? (
          <div className="rounded-2xl border border-[var(--danger-soft-border)] bg-[var(--danger-soft-bg)] px-4 py-3 text-sm text-[var(--danger-soft-text)]">
            {error}
          </div>
        ) : null}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="sync-theme-primary-btn mt-6 h-12 w-full rounded-2xl font-extrabold shadow-sm disabled:opacity-60"
        >
          {isSubmitting ? "Creating..." : "Create Collaboration →"}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}