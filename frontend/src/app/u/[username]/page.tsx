"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

type PublicProfileResponse = {
  username?: string;
  createdAt?: string;
  firstname?: string;
  lastname?: string;
  headline?: string | null;
  bio?: string | null;
  intent?: string | null;
  location?: string | null;
  website?: string | null;
  currentCompany?: string | null;
  currentPosition?: string | null;
  profilePicture?: string | null;
  coverPhoto?: string | null;
  profileCompleteness?: number;
  skills?: string[];
  roles?: string[];
  domains?: string[];
  projects?: Array<{
    title?: string;
    description?: string;
    role?: string;
    technologies?: string[];
    duration?: string;
  }>;
  collaborationGoals?: string | null;
  profileSummaryText?: string | null;
};

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = String(params?.username || "");

  const [profile, setProfile] = useState<PublicProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        setIsLoading(true);
        setError("");

        const data = await apiRequest<PublicProfileResponse>(
          `/users/public/profile/${encodeURIComponent(username)}`,
          { method: "GET" }
        );

        setProfile(data);
      } catch (err) {
        console.error("Failed to load public profile", err);
        setError("Profile not found.");
      } finally {
        setIsLoading(false);
      }
    }

    if (username) {
      void loadProfile();
    }
  }, [username]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F6FB] px-4 py-10 text-slate-900">
        <div className="mx-auto max-w-[720px] rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-lg font-bold">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#F4F6FB] px-4 py-10 text-slate-900">
        <div className="mx-auto max-w-[720px] rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-lg font-bold">Public Profile</div>
          <p className="mt-2 text-sm text-slate-500">
            {error || "This profile is unavailable."}
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 rounded-xl bg-[#2D6BFF] px-4 py-2 text-sm font-semibold text-white"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const fullName =
    `${profile.firstname ?? ""} ${profile.lastname ?? ""}`.trim() ||
    profile.username ||
    "SphereNet User";

  const roleLine =
    profile.headline ||
    profile.currentPosition ||
    profile.intent ||
    "SphereNet member";

  const skills = profile.skills || [];
  const roles = profile.roles || [];
  const domains = profile.domains || [];
  const projects = profile.projects || [];

  return (
    <div className="min-h-screen bg-[#F4F6FB] pb-10 text-slate-900">
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-[720px] items-center justify-between">
          <div>
            <div className="text-[20px] font-extrabold">SphereNet Profile</div>
            <div className="text-sm text-slate-500">@{profile.username}</div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[720px] px-4 py-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="h-32 bg-gradient-to-r from-[#DCE8FF] via-[#EEF4FF] to-[#F8FBFF]" />

          <div className="px-5 pb-5">
            <div className="-mt-12 flex items-end gap-4">
              <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-slate-100">
                <img
                  src={profile.profilePicture || "/avatar/default-avatar.png"}
                  alt={fullName}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "/avatar/default-avatar.png";
                  }}
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="text-2xl font-extrabold">{fullName}</div>
              <div className="mt-1 text-sm text-slate-500">{roleLine}</div>

              {profile.location ? (
                <div className="mt-2 text-sm text-slate-500">
                  {profile.location}
                </div>
              ) : null}
            </div>

            {profile.bio ? (
              <div className="mt-5">
                <div className="text-sm font-semibold text-slate-900">About</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {profile.bio}
                </p>
              </div>
            ) : null}

            {skills.length > 0 ? (
              <div className="mt-5">
                <div className="text-sm font-semibold text-slate-900">Skills</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-[#EEF4FF] px-3 py-1.5 text-xs font-semibold text-[#2D6BFF]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {roles.length > 0 ? (
              <div className="mt-5">
                <div className="text-sm font-semibold text-slate-900">Roles</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {roles.map((role) => (
                    <span
                      key={role}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {domains.length > 0 ? (
              <div className="mt-5">
                <div className="text-sm font-semibold text-slate-900">Domains</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {domains.map((domain) => (
                    <span
                      key={domain}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      {domain}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {projects.length > 0 ? (
              <div className="mt-6">
                <div className="text-sm font-semibold text-slate-900">Projects</div>
                <div className="mt-3 space-y-3">
                  {projects.map((project, index) => (
                    <div
                      key={`${project.title || "project"}-${index}`}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="text-sm font-bold text-slate-900">
                        {project.title || "Untitled project"}
                      </div>

                      {project.role ? (
                        <div className="mt-1 text-xs text-slate-500">
                          {project.role}
                        </div>
                      ) : null}

                      {project.description ? (
                        <p className="mt-2 text-sm text-slate-600">
                          {project.description}
                        </p>
                      ) : null}

                      {project.technologies?.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {project.technologies.map((tech) => (
                            <span
                              key={tech}
                              className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}