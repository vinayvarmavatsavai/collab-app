"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type Project = {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  requiredDomains: string[];
  visibilityMode: string;
  preferredExperienceLevel?: string;
  maxCohortSize: number;
  status: string;
  creator?: {
    firstname?: string;
    lastname?: string;
    headline?: string;
    currentPosition?: string;
  };
};

export default function ExploreRequestDetailPage() {
  const router = useRouter();
  const params = useParams<{ requestId: string }>();
  const projectId = params?.requestId;

  const [project, setProject] = useState<Project | null>(null);
  const [isApplied, setIsApplied] = useState(false);
  const [isMyRequest, setIsMyRequest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!projectId) return;
    loadProject();
  }, [projectId]);

  async function loadProject() {
    setLoading(true);
    setError("");

    try {
      // 1. Get project
      const data = await apiFetch<Project>(`/projects/${projectId}`);
      setProject(data);

      // 2. Check if applied
      const interests = await apiFetch<any[]>(`/project-interests/me`);
      setIsApplied(
        interests.some((i) => String(i.projectId) === String(projectId)),
      );

      // 3. Check if my project
      const myProjects = await apiFetch<Project[]>(`/projects/my-requests`);
      setIsMyRequest(myProjects.some((p) => p.id === projectId));
    } catch (err: any) {
      setError(err.message || "Failed to load project");

      if (err.message === "Unauthorized") {
        router.push("/signup");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleApply() {
    if (!projectId) return;

    try {
      setApplying(true);

      await apiFetch(`/project-interests/${projectId}`, {
        method: "POST",
        body: JSON.stringify({
          interestText: "Interested in contributing to this project",
        }),
      });

      setIsApplied(true);
    } catch (err: any) {
      alert(err.message || "Failed to apply");
    } finally {
      setApplying(false);
    }
  }

  function getCreatorName() {
    if (!project?.creator) return "Unknown";

    return (
      `${project.creator.firstname || ""} ${
        project.creator.lastname || ""
      }`.trim() || "User"
    );
  }

  function getCreatorRole() {
    return (
      project?.creator?.headline ||
      project?.creator?.currentPosition ||
      "Collaborator"
    );
  }

  if (!projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Invalid request
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {error || "Not found"}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F6FB] px-4 py-6">
      <div className="max-w-4xl mx-auto">
        {/* HEADER */}
        <div className="mb-5 flex justify-between">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border rounded-xl"
          >
            ← Back
          </button>

          <Link href="/explore">Explore</Link>
        </div>

        {/* MAIN CARD */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border">
          <h1 className="text-2xl font-bold">{project.title}</h1>

          <p className="text-sm text-gray-500 mt-2">
            {getCreatorName()} • {getCreatorRole()}
          </p>

          <p className="mt-4 text-gray-700">{project.description}</p>

          {/* TAGS */}
          <div className="mt-4 flex flex-wrap gap-2">
            {project.requiredSkills?.map((s) => (
              <span key={s} className="bg-gray-100 px-2 py-1 text-xs rounded">
                {s}
              </span>
            ))}
          </div>

          {/* INFO */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-gray-500">Experience</p>
              <p className="font-semibold">
                {project.preferredExperienceLevel || "Any"}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-gray-500">Cohort Size</p>
              <p className="font-semibold">{project.maxCohortSize}</p>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="mt-6 flex gap-2">
            {isMyRequest ? (
              <Link
                href={`/requests/${project.id}/applicants`}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-xl text-center"
              >
                View Applicants
              </Link>
            ) : (
              <button
                onClick={handleApply}
                disabled={isApplied || applying}
                className={`flex-1 px-4 py-2 rounded-xl ${
                  isApplied
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-600 text-white"
                }`}
              >
                {isApplied
                  ? "Applied ✓"
                  : applying
                  ? "Applying..."
                  : "Apply"}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}