// file: src/app/create/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type FooterTab = "home" | "explore" | "create" | "events" | "profile";

type CreateProjectResponse = {
  id: string;
  title: string;
  description: string;
  requiredSkills?: string[];
  requiredDomains?: string[];
  optionalSkills?: string[];
  preferredExperienceLevel?: string;
  maxCohortSize?: number;
  visibilityMode?: string;
};

export default function CreateCollaborationPage() {
  const router = useRouter();

  const [footerTab, setFooterTab] = useState<FooterTab>("create");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  

  function mapVisibilityMode(value: string) {
    return value === "private" ? "private" : "open";
  }

  function deriveOptionalSkills(skillsArray: string[]) {
    if (skillsArray.length <= 2) return [];
    return skillsArray.slice(2);
  }

  function deriveRequiredDomains(title: string, shortDesc: string, skillsArray: string[]) {
    const combined = `${title} ${shortDesc} ${skillsArray.join(" ")}`.toLowerCase();

    const domains: string[] = [];

    if (
      combined.includes("react") ||
      combined.includes("node") ||
      combined.includes("web") ||
      combined.includes("frontend") ||
      combined.includes("backend") ||
      combined.includes("full stack")
    ) {
      domains.push("Web Dev");
    }

    if (
      combined.includes("ai") ||
      combined.includes("ml") ||
      combined.includes("machine learning") ||
      combined.includes("artificial intelligence")
    ) {
      domains.push("AI");
    }

    if (
      combined.includes("data") ||
      combined.includes("analytics") ||
      combined.includes("python")
    ) {
      domains.push("Data Science");
    }

    return domains.length ? domains : ["Web Dev"];
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

    setError("");
    setLoading(true);

    try {
      const skillsArray = trimmedSkills
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const payload = {
        title: trimmedTitle,
        description: `${trimmedShortDesc}\n\nProblem Statement:\n${trimmedProblem}${
          form.hours ? `\n\nWeekly Time Commitment: ${form.hours}` : ""
        }${form.duration.trim() ? `\nProject Duration: ${form.duration.trim()}` : ""}${
          form.compensation ? `\nCompensation: ${form.compensation}` : ""
        }`,
        requiredSkills: skillsArray.slice(0, 2),
        requiredDomains: deriveRequiredDomains(trimmedTitle, trimmedShortDesc, skillsArray),
        optionalSkills: deriveOptionalSkills(skillsArray),
        preferredExperienceLevel: form.experience || "any",
        maxCohortSize: 5,
        visibilityMode: mapVisibilityMode(form.type),
      };

      await apiFetch<CreateProjectResponse>("/projects", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      resetForm();
      router.push("/explore");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create collaboration.");
    } finally {
      setLoading(false);
    }
  }

  const go = (path: string, tab?: FooterTab) => {
    if (tab) setFooterTab(tab);
    router.push(path);
  };

  return (
    <div className="min-h-dvh bg-[#F4F6FB] pb-24 text-slate-900">
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[20px] font-extrabold">Create Collaboration</div>
            <div className="text-sm text-slate-500">
              Define your project clearly to attract the right collaborators.
            </div>
          </div>

          <button
            onClick={() => router.back()}
            className="text-sm font-semibold text-[#2D6BFF]"
          >
            Back
          </button>
        </div>
      </div>

      <div className="space-y-6 px-4 py-6">
        <div>
          <label className="mb-2 block text-sm font-semibold">Project Title *</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Example: AI Resume Analyzer for Students"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#2D6BFF]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">Short Description *</label>
          <textarea
            name="shortDesc"
            value={form.shortDesc}
            onChange={handleChange}
            placeholder="One line summary of the project"
            rows={2}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#2D6BFF]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">Problem Statement *</label>
          <textarea
            name="problem"
            value={form.problem}
            onChange={handleChange}
            placeholder="Describe the core problem you are solving..."
            rows={4}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#2D6BFF]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">Required Skills *</label>
          <input
            name="skills"
            value={form.skills}
            onChange={handleChange}
            placeholder="React, Node.js, UI/UX"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#2D6BFF]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Experience Level Needed
          </label>
          <select
            name="experience"
            value={form.experience}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#2D6BFF]"
          >
            <option value="">Select level</option>
<option value="junior">Beginner</option>
<option value="mid">Intermediate</option>
<option value="senior">Advanced</option>
<option value="any">Any</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Weekly Time Commitment *
          </label>
          <select
            name="hours"
            value={form.hours}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#2D6BFF]"
          >
            <option value="">Select hours</option>
            <option>1–3 hrs/week</option>
            <option>4–7 hrs/week</option>
            <option>8–15 hrs/week</option>
            <option>15+ hrs/week</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">Project Duration</label>
          <input
            name="duration"
            value={form.duration}
            onChange={handleChange}
            placeholder="Example: 3 months"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#2D6BFF]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">Compensation</label>
          <select
            name="compensation"
            value={form.compensation}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#2D6BFF]"
          >
            <option value="">Select type</option>
            <option>Unpaid</option>
            <option>Paid</option>
            <option>Equity-based</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">Collaboration Type</label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#2D6BFF]"
          >
            <option value="public">Open Public (AI Matched)</option>
            <option value="private">Private Invite Only</option>
          </select>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-6 h-12 w-full rounded-2xl bg-[#2D6BFF] font-extrabold text-white shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create Collaboration →"}
        </button>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-slate-200 bg-white">
        <div className="grid h-full grid-cols-5">
          <button
            onClick={() => go("/home", "home")}
            className={`flex flex-col items-center justify-center gap-1 text-xs ${
              footerTab === "home"
                ? "font-semibold text-[#2D6BFF]"
                : "text-slate-500"
            }`}
          >
            <span className="text-lg leading-none">🏠</span>
            <span>Home</span>
          </button>

          <button
            onClick={() => go("/explore", "explore")}
            className={`flex flex-col items-center justify-center gap-1 text-xs ${
              footerTab === "explore"
                ? "font-semibold text-[#2D6BFF]"
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
            <span className="font-semibold text-slate-700">Create</span>
          </button>

          <button
            onClick={() => go("/events", "events")}
            className={`flex flex-col items-center justify-center gap-1 text-xs ${
              footerTab === "events"
                ? "font-semibold text-[#2D6BFF]"
                : "text-slate-500"
            }`}
          >
            <span className="text-lg leading-none">📅</span>
            <span>Events</span>
          </button>

          <button
            onClick={() => go("/profile", "profile")}
            className={`flex flex-col items-center justify-center gap-1 text-xs ${
              footerTab === "profile"
                ? "font-semibold text-[#2D6BFF]"
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