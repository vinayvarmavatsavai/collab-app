"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { getSavedRequestIds, saveSavedRequestIds } from "@/lib/collaboration";

type BackendProject = {
  id: string;
  title: string;
  description: string;
  requiredSkills?: string[];
  requiredDomains?: string[];
  preferredExperienceLevel?: "junior" | "mid" | "senior" | "any" | null;
  maxCohortSize?: number;
  visibilityMode?: "matching-only" | "open" | "hybrid";
  status?: string;
  creatorId?: string;
  createdAt?: string;
  creator?: {
    firstname?: string;
    lastname?: string;
    headline?: string;
    currentPosition?: string;
    currentCompany?: string;
  };
};

type ProjectsEnvelope = {
  projects?: BackendProject[];
};

type MyInterestItem = {
  id: string;
  projectId?: string;
  project?: BackendProject;
};

type InterestsEnvelope = {
  interests?: MyInterestItem[];
};

function normalizeProjectsResponse(
  input: BackendProject[] | ProjectsEnvelope | null | undefined,
): BackendProject[] {
  if (Array.isArray(input)) return input;
  if (input && Array.isArray(input.projects)) return input.projects;
  return [];
}

function normalizeInterestsResponse(
  input: MyInterestItem[] | InterestsEnvelope | null | undefined,
): MyInterestItem[] {
  if (Array.isArray(input)) return input;
  if (input && Array.isArray(input.interests)) return input.interests;
  return [];
}

function experienceLabel(value?: string | null) {
  if (!value) return "Any";
  if (value === "junior") return "Beginner";
  if (value === "mid") return "Intermediate";
  if (value === "senior") return "Advanced";
  return "Any";
}

export default function ExploreRequestDetailPage() {
  const router = useRouter();
  const params = useParams<{ requestId: string }>();
  const requestId = String(params?.requestId || "");

  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [myRequestIds, setMyRequestIds] = useState<string[]>([]);

  const [project, setProject] = useState<BackendProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingApply, setSubmittingApply] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      setSavedIds(getSavedRequestIds());
    } catch {
      setSavedIds([]);
    }
  }, []);

  useEffect(() => {
    async function loadDetail() {
      if (!requestId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [projectRes, myProjectsRes, myInterestsRes] = await Promise.all([
          apiRequest<BackendProject>(`/projects/${requestId}`),
          apiRequest<BackendProject[] | ProjectsEnvelope>("/projects/my-requests"),
          apiRequest<MyInterestItem[] | InterestsEnvelope>("/project-interests/me"),
        ]);

        const myProjects = normalizeProjectsResponse(myProjectsRes);
        const myInterests = normalizeInterestsResponse(myInterestsRes);

        setProject(projectRes);
        setMyRequestIds(myProjects.map((p) => p.id));
        setAppliedIds(
          myInterests
            .map((item) => item.project?.id || item.projectId)
            .filter(Boolean)
            .map(String),
        );
      } catch (err) {
        console.error("Failed to load request detail:", err);
        setError(err instanceof Error ? err.message : "Failed to load request.");
        setProject(null);
      } finally {
        setLoading(false);
      }
    }

    loadDetail();
  }, [requestId]);

  const isMine = project ? myRequestIds.includes(project.id) : false;
  const isApplied = project ? appliedIds.includes(project.id) : false;
  const isSaved = project ? savedIds.includes(project.id) : false;

  function toggleSave() {
    if (!project) return;

    const next = isSaved
      ? savedIds.filter((id) => id !== project.id)
      : [...savedIds, project.id];

    setSavedIds(next);
    saveSavedRequestIds(next);
  }

  async function handleApply() {
    if (!project || isMine || isApplied || submittingApply) return;

    setSubmittingApply(true);
    setError("");

    try {
      await apiRequest(`/project-interests/${project.id}`, {
        method: "POST",
        body: {
          interestText: `Interested in collaborating on ${project.title}.`,
          attachmentUrls: [],
        },
      });

      setAppliedIds((prev) =>
        prev.includes(project.id) ? prev : [...prev, project.id],
      );
    } catch (err) {
      console.error("Failed to apply:", err);
      setError(err instanceof Error ? err.message : "Failed to apply.");
    } finally {
      setSubmittingApply(false);
    }
  }

  if (!requestId) {
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

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F4F6FB] px-4 py-6 text-slate-900">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-6 w-32 rounded bg-slate-200" />
            <div className="mt-4 h-10 w-3/4 rounded bg-slate-200" />
            <div className="mt-4 h-4 w-1/2 rounded bg-slate-200" />
            <div className="mt-6 h-32 rounded bg-slate-200" />
          </div>
        </div>
      </main>
    );
  }

  if (!project) {
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

  const creatorName =
    `${project.creator?.firstname || ""} ${project.creator?.lastname || ""}`.trim() || "User";

  const creatorRole =
    project.creator?.headline ||
    project.creator?.currentPosition ||
    project.creator?.currentCompany ||
    "Collaborator";

  const descriptionParts = (project.description || "").split("\n\n");
  const shortDesc = descriptionParts[0] || project.description || "";
  const problem = descriptionParts.slice(1).join("\n\n") || project.description || "";

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

        {error ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {project.visibilityMode === "matching-only" ? "Private" : "Public"}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Online
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {project.maxCohortSize || 5} members max
                </span>
                {isMine ? (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    My Request
                  </span>
                ) : null}
              </div>

              <h1 className="text-2xl font-bold sm:text-3xl">{project.title}</h1>

              <p className="mt-2 text-sm text-slate-500">
                Posted by {creatorName} • {creatorRole}
              </p>

              {shortDesc ? (
                <p className="mt-4 text-base text-slate-700">{shortDesc}</p>
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

              {isMine ? (
                <Link
                  href={`/requests/${project.id}/applicants`}
                  className="rounded-xl bg-[#2D6BFF] px-4 py-2 text-sm font-semibold text-white transition"
                >
                  View Applicants
                </Link>
              ) : (
                <button
                  onClick={handleApply}
                  disabled={isApplied || submittingApply}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    isApplied
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-[#2D6BFF] text-white"
                  } disabled:opacity-70`}
                >
                  {isApplied ? "Applied ✓" : submittingApply ? "Applying..." : "Apply Now"}
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr,0.9fr]">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold">Problem Statement</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-700">
                  {problem || "No details available."}
                </p>
              </div>

              <div>
                <h2 className="text-lg font-bold">Required Skills</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(project.requiredSkills || []).length ? (
                    (project.requiredSkills || []).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">No required skills listed.</span>
                  )}
                </div>
              </div>

              {(project.requiredDomains || []).length ? (
                <div>
                  <h2 className="text-lg font-bold">Domains</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(project.requiredDomains || []).map((domain) => (
                      <span
                        key={domain}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                      >
                        {domain}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Experience Needed
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {experienceLabel(project.preferredExperienceLevel)}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Collaboration Mode
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  Online
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Type
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {project.visibilityMode === "matching-only" ? "Private" : "Public"}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Team / Cohort
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {project.maxCohortSize || 5} members max
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}