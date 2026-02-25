"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Collaboration = {
  id: number;
  title: string;
  skills: string[];
  hours: string;
  by: string;
};

const mockSuggested: Collaboration[] = [
  {
    id: 1,
    title: "Build AI Resume Analyzer",
    skills: ["React", "Node.js", "AI"],
    hours: "5-8 hrs/week",
    by: "Rahul • Startup Founder",
  },
  {
    id: 2,
    title: "Startup Landing Page Design",
    skills: ["UI/UX", "Figma"],
    hours: "3-5 hrs/week",
    by: "Ayesha • Designer",
  },
  {
    id: 3,
    title: "Mobile App Backend APIs",
    skills: ["Next.js", "MongoDB"],
    hours: "6-10 hrs/week",
    by: "Kiran • Freelancer",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState("User");

  useEffect(() => {
    const data = localStorage.getItem("profileAnswers");
    if (data) setName("Vinay");
  }, []);

  return (
    <div className="min-h-screen pb-24 bg-[#F4F6FB] text-slate-900 px-4 py-6">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Welcome back, {name} 👋
        </h1>
        <p className="text-slate-500 text-sm">
          Here are collaborations matched to your profile
        </p>
      </div>

      {/* Suggested Collaborations */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3">
          Suggested Collaborations
        </h2>

        <div className="flex gap-4 overflow-x-auto pb-2">
          {mockSuggested.map((item) => (
            <div
              key={item.id}
              className="min-w-[260px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition"
            >
              <h3 className="font-semibold">{item.title}</h3>

              <div className="mt-2 flex flex-wrap gap-2">
                {item.skills.map((s) => (
                  <span
                    key={s}
                    className="text-xs px-2 py-1 rounded-full bg-slate-100"
                  >
                    {s}
                  </span>
                ))}
              </div>

              <div className="mt-3 text-sm text-slate-600">
                {item.hours}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {item.by}
              </div>

              <button className="mt-4 w-full py-2 rounded-xl bg-[#2D6BFF] text-white font-semibold">
                View & Apply
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Feed */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Feed</h2>

        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="font-semibold">Startup Update 🚀</div>
              <p className="text-slate-600 text-sm mt-2">
                We just launched our beta version! Looking for frontend collaborators.
              </p>
              <div className="text-xs text-slate-400 mt-3">
                2h ago
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Navigation */}
      {/* Bottom Navigation (Uniform) */}
<div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 z-40">
  <div className="h-full grid grid-cols-4">
    {/* Home */}
    <button
      onClick={() => router.push("/home")}
      className="flex flex-col items-center justify-center gap-1 text-[#2D6BFF] text-xs font-semibold"
    >
      <span className="text-lg leading-none">🏠</span>
      <span>Home</span>
    </button>

    {/* Messages */}
    <button
      onClick={() => router.push("/messages")}
      className="flex flex-col items-center justify-center gap-1 text-slate-500 text-xs"
    >
      <span className="text-lg leading-none">💬</span>
      <span>Messages</span>
    </button>

    {/* Create */}
    <button
      onClick={() => router.push("/create")}
      className="flex flex-col items-center justify-center gap-1 text-slate-500 text-xs"
    >
      <span className="text-lg leading-none">➕</span>
      <span>Create</span>
    </button>

    {/* Profile */}
    <button
      onClick={() => router.push("/profile")}
      className="flex flex-col items-center justify-center gap-1 text-slate-500 text-xs"
    >
      <span className="text-lg leading-none">👤</span>
      <span>Profile</span>
    </button>
  </div>
</div>

    </div>
  );
}