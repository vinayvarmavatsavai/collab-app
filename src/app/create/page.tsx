"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateCollaborationPage() {
  const router = useRouter();

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

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit() {
    console.log("Collaboration Created:", form);
    router.push("/home");
  }

  return (
    <div className="min-h-dvh bg-[#F4F6FB] pb-20">
      
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-4">
        <div className="text-[20px] font-extrabold">Create Collaboration</div>
        <div className="text-sm text-slate-500">
          Define your project clearly to attract the right collaborators.
        </div>
      </div>

      {/* Form */}
      <div className="px-4 py-6 space-y-6">

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold mb-2">Project Title *</label>
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
          <label className="block text-sm font-semibold mb-2">Short Description *</label>
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
          <label className="block text-sm font-semibold mb-2">Problem Statement *</label>
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
          <label className="block text-sm font-semibold mb-2">Required Skills *</label>
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
          <label className="block text-sm font-semibold mb-2">Experience Level Needed</label>
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
          <label className="block text-sm font-semibold mb-2">Weekly Time Commitment *</label>
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
          <label className="block text-sm font-semibold mb-2">Project Duration</label>
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
          <label className="block text-sm font-semibold mb-2">Compensation</label>
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
          <label className="block text-sm font-semibold mb-2">Collaboration Type</label>
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
    </div>
  );
}