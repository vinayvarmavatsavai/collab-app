// file: src/app/requests/[requestId]/applicants/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  createProjectFromAcceptedApplicant,
  getApplicantsForRequest,
  getMyRequests,
  updateRequestApplicantStatus,
  type CollaborationPost,
  type RequestApplicant,
} from "@/lib/collaboration";

export default function RequestApplicantsPage() {
  const router = useRouter();
  const params = useParams<{ requestId: string }>();
  const requestId = Number(params?.requestId);

  const [myRequests, setMyRequests] = useState<CollaborationPost[]>([]);
  const [applicants, setApplicants] = useState<RequestApplicant[]>([]);

  useEffect(() => {
    try {
      setMyRequests(getMyRequests());
    } catch {
      setMyRequests([]);
    }

    if (!Number.isNaN(requestId)) {
      try {
        setApplicants(getApplicantsForRequest(requestId));
      } catch {
        setApplicants([]);
      }
    }
  }, [requestId]);

  const requestItem = useMemo(() => {
    return myRequests.find((item) => item.id === requestId) || null;
  }, [myRequests, requestId]);

  const pendingApplicants = applicants.filter(
    (item) => item.applicantStatus === "Pending",
  );
  const acceptedApplicants = applicants.filter(
    (item) => item.applicantStatus === "Accepted",
  );
  const rejectedApplicants = applicants.filter(
    (item) => item.applicantStatus === "Rejected",
  );

  function handleStatusChange(
  applicant: RequestApplicant,
  nextStatus: "Pending" | "Accepted" | "Rejected",
) {
  const nextAll = updateRequestApplicantStatus(applicant.id, nextStatus);
  setApplicants(nextAll.filter((item) => item.requestId === requestId));

  if (nextStatus === "Accepted" && requestItem) {
    createProjectFromAcceptedApplicant({
      request: requestItem,
      applicant,
    });
  }
}

  if (!requestId || Number.isNaN(requestId)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4F6FB] px-4 text-slate-900">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold">Invalid request</h1>
          <p className="mt-2 text-sm text-slate-500">
            Request id is missing or invalid.
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

  if (!requestItem) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4F6FB] px-4 text-slate-900">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold">Request not found</h1>
          <p className="mt-2 text-sm text-slate-500">
            This page only works for requests you created.
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

  return (
    <main className="min-h-screen bg-[#F4F6FB] px-4 py-6 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            ← Back
          </button>

          <Link
            href={`/explore/${requestItem.id}`}
            className="text-sm font-semibold text-[#2D6BFF]"
          >
            View Request
          </Link>
        </div>

        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                Owner View
              </div>
              <h1 className="text-2xl font-bold">{requestItem.title}</h1>
              <p className="mt-2 text-sm text-slate-500">
                Manage applicants for your collaboration request
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:min-w-[260px]">
              <div className="rounded-2xl bg-slate-50 p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Pending
                </p>
                <p className="mt-2 text-2xl font-bold">{pendingApplicants.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Accepted
                </p>
                <p className="mt-2 text-2xl font-bold">{acceptedApplicants.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Rejected
                </p>
                <p className="mt-2 text-2xl font-bold">{rejectedApplicants.length}</p>
              </div>
            </div>
          </div>
        </section>

        {applicants.length === 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="text-3xl">🧑‍💻</div>
            <h2 className="mt-3 text-xl font-bold">No applicants yet</h2>
            <p className="mt-2 text-sm text-slate-500">
              Once people apply to this request, they will appear here.
            </p>
          </section>
        ) : (
          <section className="space-y-4">
            {applicants.map((applicant) => (
              <div
                key={applicant.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {applicant.applicantName}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {applicant.applicantRole}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      Applied on {new Date(applicant.appliedAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        applicant.applicantStatus === "Accepted"
                          ? "bg-emerald-100 text-emerald-700"
                          : applicant.applicantStatus === "Rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {applicant.applicantStatus}
                    </span>

                    <button
                      onClick={() => handleStatusChange(applicant, "Accepted")}
                      className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Accept
                    </button>

                    <button
                      onClick={() => handleStatusChange(applicant, "Rejected")}
                      className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                    >
                      Reject
                    </button>

                    <button
                      onClick={() => handleStatusChange(applicant, "Pending")}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Mark Pending
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}