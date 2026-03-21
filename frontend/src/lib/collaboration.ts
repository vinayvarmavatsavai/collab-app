// file: src/lib/collaboration.ts

export type CollaborationPost = {
  id: number;
  title: string;
  by: string;
  role: string;
  skills: string[];
  type: "Public" | "Private";
  mode: "Online" | "In-person";
  hours: string;
  interestTags: string[];
  shortDesc?: string;
  problem?: string;
  experience?: string;
  duration?: string;
  compensation?: string;
  createdAt?: string;
};

export const MY_REQUESTS_KEY = "myRequests_v1";
export const SAVED_REQUESTS_KEY = "savedRequests_v1";
export const APPLIED_REQUESTS_KEY = "appliedRequests_v1";

function safeParse<T>(value: string | null, fallback: T): T {
  try {
    if (!value) return fallback;
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function getProfileDisplayName(): string {
  try {
    const raw = localStorage.getItem("profileAnswers");
    if (!raw) return "User";

    const parsed = JSON.parse(raw);

    const candidates = [
      parsed?.name,
      parsed?.fullName,
      parsed?.yourName,
      parsed?.["Your name"],
      parsed?.["Name"],
    ].filter(Boolean);

    const value = (candidates?.[0] ?? "User") as string;
    return value.trim() || "User";
  } catch {
    return "User";
  }
}

export function getProfileRoleLabel(): string {
  try {
    const raw = localStorage.getItem("profileAnswers");
    if (!raw) return "Project Owner";

    const parsed = JSON.parse(raw);

    const candidates = [
      parsed?.role,
      parsed?.userType,
      parsed?.profession,
      parsed?.["Role"],
      parsed?.["User type"],
    ].filter(Boolean);

    const value = (candidates?.[0] ?? "Project Owner") as string;
    return value.trim() || "Project Owner";
  } catch {
    return "Project Owner";
  }
}

export function getMyRequests(): CollaborationPost[] {
  return safeParse<CollaborationPost[]>(localStorage.getItem(MY_REQUESTS_KEY), []);
}

export function saveMyRequests(requests: CollaborationPost[]) {
  localStorage.setItem(MY_REQUESTS_KEY, JSON.stringify(requests));
}

export function addMyRequest(post: CollaborationPost) {
  const current = getMyRequests();
  saveMyRequests([post, ...current]);
}

export function getSavedRequestIds(): number[] {
  return safeParse<number[]>(localStorage.getItem(SAVED_REQUESTS_KEY), []);
}

export function saveSavedRequestIds(ids: number[]) {
  localStorage.setItem(SAVED_REQUESTS_KEY, JSON.stringify(ids));
}

export function getAppliedRequestIds(): number[] {
  return safeParse<number[]>(localStorage.getItem(APPLIED_REQUESTS_KEY), []);
}

export function saveAppliedRequestIds(ids: number[]) {
  localStorage.setItem(APPLIED_REQUESTS_KEY, JSON.stringify(ids));
}

export function getNextRequestId(existing: CollaborationPost[]) {
  if (!existing.length) return Date.now();
  return Math.max(...existing.map((item) => item.id)) + 1;
}

export function deriveInterestTags(input: {
  title: string;
  skills: string[];
  problem: string;
}): string[] {
  const haystack = `${input.title} ${input.problem} ${input.skills.join(" ")}`.toLowerCase();

  const tags = new Set<string>();

  if (
    haystack.includes("robot") ||
    haystack.includes("ros") ||
    haystack.includes("sensor")
  ) {
    tags.add("robotics");
  }

  if (
    haystack.includes("data") ||
    haystack.includes("pandas") ||
    haystack.includes("analytics") ||
    haystack.includes("ml")
  ) {
    tags.add("data-science");
  }

  if (
    haystack.includes("react") ||
    haystack.includes("next") ||
    haystack.includes("node") ||
    haystack.includes("web") ||
    haystack.includes("frontend") ||
    haystack.includes("backend")
  ) {
    tags.add("web-dev");
  }

  if (
    haystack.includes("design") ||
    haystack.includes("figma") ||
    haystack.includes("ui") ||
    haystack.includes("ux")
  ) {
    tags.add("design");
  }

  if (
    haystack.includes("ai") ||
    haystack.includes("llm") ||
    haystack.includes("machine learning") ||
    haystack.includes("genai")
  ) {
    tags.add("ai");
  }

  if (tags.size === 0) {
    tags.add("web-dev");
  }

  return Array.from(tags);
}

export const REQUEST_APPLICANTS_KEY = "requestApplicants_v1";

export type RequestApplicantStatus = "Pending" | "Accepted" | "Rejected";

export type RequestApplicant = {
  id: string;
  requestId: number;
  applicantName: string;
  applicantRole: string;
  applicantStatus: RequestApplicantStatus;
  appliedAt: string;
};

export function getRequestApplicants(): RequestApplicant[] {
  return safeParse<RequestApplicant[]>(
    localStorage.getItem(REQUEST_APPLICANTS_KEY),
    [],
  );
}

export function saveRequestApplicants(applicants: RequestApplicant[]) {
  localStorage.setItem(REQUEST_APPLICANTS_KEY, JSON.stringify(applicants));
}

export function addRequestApplicant(input: {
  requestId: number;
  applicantName: string;
  applicantRole: string;
}) {
  const current = getRequestApplicants();

  const alreadyExists = current.some(
    (item) =>
      item.requestId === input.requestId &&
      item.applicantName === input.applicantName,
  );

  if (alreadyExists) {
    return current;
  }

  const created: RequestApplicant = {
    id: `app_${input.requestId}_${Date.now()}`,
    requestId: input.requestId,
    applicantName: input.applicantName,
    applicantRole: input.applicantRole,
    applicantStatus: "Pending",
    appliedAt: new Date().toISOString(),
  };

  const next = [created, ...current];
  saveRequestApplicants(next);
  return next;
}

export function removeRequestApplicant(requestId: number, applicantName: string) {
  const current = getRequestApplicants();
  const next = current.filter(
    (item) =>
      !(item.requestId === requestId && item.applicantName === applicantName),
  );
  saveRequestApplicants(next);
  return next;
}
export function getApplicantsForRequest(requestId: number): RequestApplicant[] {
  return getRequestApplicants().filter((item) => item.requestId === requestId);
}

export function updateRequestApplicantStatus(
  applicantId: string,
  nextStatus: RequestApplicantStatus,
) {
  const current = getRequestApplicants();

  const next = current.map((item) =>
    item.id === applicantId
      ? {
          ...item,
          applicantStatus: nextStatus,
        }
      : item,
  );

  saveRequestApplicants(next);
  return next;
}

export const ACTIVE_COLLABS_KEY = "activeCollaborations_v1";
export const PROJECTS_STORAGE_KEY = "projects_v1";

export type ActiveCollabItem = {
  id: number;
  title: string;
  status: "Active" | "Paused";
  deadline: string;
  sprintsLeft: string;
  quickLinks: Array<{
    label: "Workspace" | "Milestones" | "Meetings";
    path: string;
  }>;
};

export type StoredTaskStatus =
  | "Backlog"
  | "Todo"
  | "In Progress"
  | "Review"
  | "Done";

export type StoredTaskPriority = "Low" | "Medium" | "High";

export type StoredMilestonePriority = "Low" | "Medium" | "High" | "Critical";

export type StoredActivityItem = {
  id: number;
  text: string;
  time: string;
};

export type StoredTaskItem = {
  id: number;
  title: string;
  assignee: string;
  priority: StoredTaskPriority;
  status: StoredTaskStatus;
  dueDate: string;
};

export type StoredTeamMember = {
  id: number;
  name: string;
  role: string;
  avatar: string;
};

export type StoredMilestoneItem = {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  owner: string;
  priority: StoredMilestonePriority;
  linkedTaskIds: number[];
};

export type StoredProjectItem = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  createdBy: string;
  dueDate: string;
  team: StoredTeamMember[];
  tasks: StoredTaskItem[];
  milestones: StoredMilestoneItem[];
  activity: StoredActivityItem[];
};

export function getStoredProjects(): StoredProjectItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
    return safeParse<StoredProjectItem[]>(raw, []);
  } catch {
    return [];
  }
}

export function saveStoredProjects(projects: StoredProjectItem[]) {
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
}

export function getActiveCollaborations(): ActiveCollabItem[] {
  return safeParse<ActiveCollabItem[]>(
    localStorage.getItem(ACTIVE_COLLABS_KEY),
    [],
  );
}

export function saveActiveCollaborations(items: ActiveCollabItem[]) {
  localStorage.setItem(ACTIVE_COLLABS_KEY, JSON.stringify(items));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

function getAvatarLetter(name: string) {
  return (name?.trim()?.[0] || "U").toUpperCase();
}

function getFutureDate(daysToAdd: number) {
  const now = new Date();
  now.setDate(now.getDate() + daysToAdd);
  return now.toISOString().split("T")[0];
}

export function createProjectFromAcceptedApplicant(input: {
  request: CollaborationPost;
  applicant: RequestApplicant;
}) {
  const existingProjects = getStoredProjects();
  const existingActiveCollabs = getActiveCollaborations();

  const projectIdBase = slugify(input.request.title || "project");
  const projectId = `${projectIdBase}-${input.request.id}`;

  const alreadyExists = existingProjects.some((item) => item.id === projectId);

  if (!alreadyExists) {
    const createdBy = input.request.by || "Owner";
    const collaboratorName = input.applicant.applicantName || "Collaborator";

    const project: StoredProjectItem = {
      id: projectId,
      title: input.request.title,
      tagline:
        input.request.shortDesc ||
        "Collaboration workspace for accepted project members",
      description:
        input.request.problem ||
        "This workspace was created after accepting a collaboration request.",
      category: "Startup Collaboration",
      createdBy,
      dueDate: getFutureDate(30),
      team: [
        {
          id: 1,
          name: createdBy,
          role: input.request.role || "Project Owner",
          avatar: getAvatarLetter(createdBy),
        },
        {
          id: 2,
          name: collaboratorName,
          role: input.applicant.applicantRole || "Collaborator",
          avatar: getAvatarLetter(collaboratorName),
        },
      ],
      tasks: [
        {
          id: 1,
          title: "Kickoff collaboration and align on goals",
          assignee: createdBy,
          priority: "High",
          status: "Todo",
          dueDate: getFutureDate(3),
        },
        {
          id: 2,
          title: "Break request into implementation tasks",
          assignee: collaboratorName,
          priority: "Medium",
          status: "Backlog",
          dueDate: getFutureDate(5),
        },
      ],
      milestones: [
        {
          id: 1,
          title: "Collaboration Kickoff",
          description:
            "Start the accepted collaboration and convert the request into an execution plan.",
          dueDate: getFutureDate(7),
          owner: createdBy,
          priority: "High",
          linkedTaskIds: [1, 2],
        },
      ],
      activity: [
        {
          id: 1,
          text: `${createdBy} accepted ${collaboratorName} for '${input.request.title}'`,
          time: "Just now",
        },
        {
          id: 2,
          text: `Project workspace '${input.request.title}' was created`,
          time: "Just now",
        },
      ],
    };

    saveStoredProjects([project, ...existingProjects]);
  }

  const collabId = input.request.id;
  const alreadyInHome = existingActiveCollabs.some((item) => item.id === collabId);

  if (!alreadyInHome) {
    const activeCollab: ActiveCollabItem = {
      id: collabId,
      title: input.request.title,
      status: "Active",
      deadline: `Deadline: ${getFutureDate(30)}`,
      sprintsLeft: "2 sprints left",
      quickLinks: [
        {
          label: "Workspace",
          path: `/projects/${projectId}`,
        },
        {
          label: "Milestones",
          path: `/projects/${projectId}?tab=Milestones`,
        },
        {
          label: "Meetings",
          path: `/projects/${projectId}/meetings`,
        },
      ],
    };

    saveActiveCollaborations([activeCollab, ...existingActiveCollabs]);
  }

  return {
    projectId,
  };
}