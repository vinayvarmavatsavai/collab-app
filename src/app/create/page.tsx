"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FooterTab = "home" | "explore" | "create" | "events" | "profile";

export default function CreateCollaborationPage() {
  const router = useRouter();

  const [footerTab, setFooterTab] = useState<FooterTab>("create");

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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit() {
    console.log("Collaboration Created:", form);
    router.push("/home");
  }

  const go = (path: string, tab?: FooterTab) => {
    if (tab) setFooterTab(tab);
    router.push(path);
  };

  return (
    <div className="min-h-dvh bg-[#F4F6FB] pb-24 text-slate-900">

      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-4 z-30">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[20px] font-extrabold">
              Create Collaboration
            </div>
            <div className="text-sm text-slate-500">
              Define your project clearly to attract the right collaborators.
            </div>
          </div>

          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="text-sm font-semibold text-[#2D6BFF]"
          >
            Back
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="px-4 py-6 space-y-6">

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Project Title *
          </label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Example: AI Resume Analyzer for Students"
            className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#2D6BFF]"
          />
        </div>

        {/* Short Description */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Short Description *
          </label>
          <textarea
            name="shortDesc"
            value={form.shortDesc}
            onChange={handleChange}
            placeholder="One line summary of the project"
            rows={2}
            className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#2D6BFF]"
          />
        </div>

        {/* Problem Statement */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Problem Statement *
          </label>
          <textarea
            name="problem"
            value={form.problem}
            onChange={handleChange}
            placeholder="Describe the core problem you are solving..."
            rows={4}
            className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#2D6BFF]"
          />
        </div>

        {/* Required Skills */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Required Skills *
          </label>
          <input
            name="skills"
            value={form.skills}
            onChange={handleChange}
            placeholder="React, Node.js, UI/UX"
            className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#2D6BFF]"
          />
        </div>

        {/* Experience Level */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Experience Level Needed
          </label>
          <select
            name="experience"
            value={form.experience}
            onChange={handleChange}
            className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#2D6BFF]"
          >
            <option value="">Select level</option>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>

        {/* Time Commitment */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Weekly Time Commitment *
          </label>
          <select
            name="hours"
            value={form.hours}
            onChange={handleChange}
            className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#2D6BFF]"
          >
            <option value="">Select hours</option>
            <option>1–3 hrs/week</option>
            <option>4–7 hrs/week</option>
            <option>8–15 hrs/week</option>
            <option>15+ hrs/week</option>
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Project Duration
          </label>
          <input
            name="duration"
            value={form.duration}
            onChange={handleChange}
            placeholder="Example: 3 months"
            className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#2D6BFF]"
          />
        </div>

        {/* Compensation */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Compensation
          </label>
          <select
            name="compensation"
            value={form.compensation}
            onChange={handleChange}
            className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#2D6BFF]"
          >
            <option value="">Select type</option>
            <option>Unpaid</option>
            <option>Paid</option>
            <option>Equity-based</option>
          </select>
        </div>

        {/* Collaboration Type */}
        <div>
          <label className="block text-sm font-semibold mb-2">
            Collaboration Type
          </label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#2D6BFF]"
          >
            <option value="public">Open Public (AI Matched)</option>
            <option value="private">Private Invite Only</option>
          </select>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="w-full mt-6 h-12 rounded-2xl bg-[#2D6BFF] text-white font-extrabold shadow-md active:scale-[0.99]"
        >
          Create Collaboration →
        </button>

      </div>

      {/* Footer (same as Home & Explore) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 z-40">
        <div className="h-full grid grid-cols-5">

          <button
            onClick={() => go("/home", "home")}
            className={`flex flex-col items-center justify-center gap-1 text-xs ${
              footerTab === "home"
                ? "text-[#2D6BFF] font-semibold"
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
                ? "text-[#2D6BFF] font-semibold"
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
            <span className="text-slate-700 font-semibold">Create</span>
          </button>

          <button
            onClick={() => go("/events", "events")}
            className={`flex flex-col items-center justify-center gap-1 text-xs ${
              footerTab === "events"
                ? "text-[#2D6BFF] font-semibold"
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