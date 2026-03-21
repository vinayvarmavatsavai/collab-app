// file: src/app/projects/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { projects as defaultProjects } from "./data";
import { getStoredProjects, type StoredProjectItem } from "@/lib/collaboration";

type ProjectCardItem = {
  id: string;
  title: string;
  tagline: string;
  category: string;
  teamCount: number;
  taskCount: number;
  progress: number;
};

function calculateProgress(
  tasks: Array<{ status: "Backlog" | "Todo" | "In Progress" | "Review" | "Done" }>,
) {
  if (!tasks.length) return 0;
  const doneCount = tasks.filter((task) => task.status === "Done").length;
  return Math.round((doneCount / tasks.length) * 100);
}

export default function ProjectsPage() {
  const [storedProjects, setStoredProjects] = useState<StoredProjectItem[]>([]);

  useEffect(() => {
    try {
      setStoredProjects(getStoredProjects());
    } catch {
      setStoredProjects([]);
    }
  }, []);

  const mergedProjects = useMemo(() => {
    const base = defaultProjects.map((project) => ({
      id: project.id,
      title: project.title,
      tagline: project.tagline,
      category: project.category,
      teamCount: project.team.length,
      taskCount: project.tasks.length,
      progress: calculateProgress(project.tasks),
    }));

    const extra = storedProjects
      .filter((stored) => !base.some((item) => item.id === stored.id))
      .map((project) => ({
        id: project.id,
        title: project.title,
        tagline: project.tagline,
        category: project.category,
        teamCount: project.team.length,
        taskCount: project.tasks.length,
        progress: calculateProgress(project.tasks),
      }));

    return [...extra, ...base];
  }, [storedProjects]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="mt-2 text-slate-600">
            Open a project workspace to manage tasks, milestones, and collaboration.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {mergedProjects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <p className="mb-2 text-sm font-medium text-violet-600">
                {project.category}
              </p>
              <h2 className="text-2xl font-bold">{project.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{project.tagline}</p>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-500">Progress</span>
                  <span className="font-semibold text-slate-700">
                    {project.progress}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
                <span>{project.teamCount} members</span>
                <span>{project.taskCount} tasks</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}