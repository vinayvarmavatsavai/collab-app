"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

type Applicant = {
  id: string;
  projectId: string;
  userId: string;
  interestText: string;
  attachmentUrls?: string[];
  relevanceScore?: number | null;
  profileSimilarity?: number | null;
  milestoneSimilarity?: number | null;
  skillOverlap?: number | null;
  createdAt?: string;
  user?: {
    id?: string;
    firstname?: string;
    lastname?: string;
    headline?: string;
    currentPosition?: string;
    currentCompany?: string;
  };
};

type ApplicantsEnvelope = {
  interests?: Applicant[];
  applicants?: Applicant[];
};

function normalizeApplicantsResponse(
  input: Applicant[] | ApplicantsEnvelope | null | undefined,
): Applicant[] {
  if (Array.isArray(input)) return input;
  if (input && Array.isArray(input.interests)) return input.interests;
  if (input && Array.isArray(input.applicants)) return input.applicants;
  return [];
}

function percent(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `${Math.round(value * 100)}%`;
}

export default function ApplicantsPage() {
  const router = useRouter();
  const params = useParams<{ requestId: string }>();
  const requestId = String(params?.requestId || "");

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [formingCohort, setFormingCohort] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadApplicants() {
      if (!requestId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const res = await apiRequest<Applicant[] | ApplicantsEnvelope>(
          `/project-interests/project/${requestId}`,
        );
        setApplicants(normalizeApplicantsResponse(res));
      } catch (err) {
        console.error("Failed to load applicants:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load applicants.",
        );
        setApplicants([]);
      } finally {
        setLoading(false);
      }
    }

    loadApplicants();
  }, [requestId]);

  function toggleSelect(userId: string) {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  }

  async function formCohort() {
    if (!requestId || selectedIds.length === 0 || formingCohort) return;

    setFormingCohort(true);
    setError("");

    try {
      await apiRequest(`/cohorts/projects/${requestId}`, {
        method: "POST",
        body: {
          memberIds: selectedIds,
        },
      });

      router.push("/home");
    } catch (err) {
      console.error("Failed to form cohort:", err);
      setError(err instanceof Error ? err.message : "Failed to form cohort.");
    } finally {
      setFormingCohort(false);
    }
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold">View Applicants</h1>
              <p className="mt-1 text-sm text-slate-500">
                Review applicants for this collaboration request.
              </p>
            </div>

            <button
              onClick={formCohort}
              disabled={selectedIds.length === 0 || formingCohort}
              className="rounded-xl bg-[#2D6BFF] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {formingCohort ? "Forming..." : "Form Cohort"}
            </button>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-6 space-y-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="h-5 w-1/3 rounded bg-slate-200" />
                  <div className="mt-3 h-4 w-1/2 rounded bg-slate-200" />
                  <div className="mt-4 h-16 rounded bg-slate-200" />
                </div>
              ))}
            </div>
          ) : applicants.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-semibold text-slate-900">No applicants yet</div>
              <div className="mt-1 text-sm text-slate-500">
                Once users apply, they will appear here.
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {applicants.map((applicant) => {
                const fullName =
                  `${applicant.user?.firstname || ""} ${applicant.user?.lastname || ""}`.trim() ||
                  "Applicant";

                const role =
                  applicant.user?.headline ||
                  applicant.user?.currentPosition ||
                  applicant.user?.currentCompany ||
                  "Collaborator";

                const isSelected = selectedIds.includes(applicant.userId);

                return (
                  <div
                    key={applicant.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="text-base font-bold text-slate-900">
                          {fullName}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">{role}</div>

                        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                          {applicant.interestText || "No applicant note provided."}
                        </p>

                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <div className="rounded-xl border border-slate-200 bg-white p-3">
                            <div className="text-[11px] uppercase tracking-wide text-slate-500">
                              Relevance
                            </div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">
                              {percent(applicant.relevanceScore)}
                            </div>
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-white p-3">
                            <div className="text-[11px] uppercase tracking-wide text-slate-500">
                              Profile
                            </div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">
                              {percent(applicant.profileSimilarity)}
                            </div>
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-white p-3">
                            <div className="text-[11px] uppercase tracking-wide text-slate-500">
                              Milestone
                            </div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">
                              {percent(applicant.milestoneSimilarity)}
                            </div>
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-white p-3">
                            <div className="text-[11px] uppercase tracking-wide text-slate-500">
                              Skill Overlap
                            </div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">
                              {percent(applicant.skillOverlap)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <button
                          onClick={() => toggleSelect(applicant.userId)}
                          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                            isSelected
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-[#2D6BFF] text-white"
                          }`}
                        >
                          {isSelected ? "Selected ✓" : "Select"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}