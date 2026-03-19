export type TaskStatus = "Backlog" | "Todo" | "In Progress" | "Review" | "Done";
export type TaskPriority = "Low" | "Medium" | "High";

export type ActivityItem = {
  id: number;
  text: string;
  time: string;
};

export type TaskItem = {
  id: number;
  title: string;
  assignee: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
};

export type TeamMember = {
  id: number;
  name: string;
  role: string;
  avatar: string;
};

export type MilestonePriority = "Low" | "Medium" | "High" | "Critical";

export type MilestoneItem = {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  owner: string;
  priority: MilestonePriority;
  linkedTaskIds: number[];
};

export type ProjectItem = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  createdBy: string;
  dueDate: string;
  team: TeamMember[];
  tasks: TaskItem[];
  milestones: MilestoneItem[];
  activity: ActivityItem[];
};

export const projects: ProjectItem[] = [
  {
    id: "sphere-ai-collab",
    title: "Sphere AI Collab",
    tagline: "A collaboration platform for startups and student builders",
    description:
      "This workspace helps teams manage projects, tasks, updates, milestones, and collaboration across product development.",
    category: "Startup Collaboration",
    createdBy: "Vinay",
    dueDate: "2026-03-30",
    team: [
      {
        id: 1,
        name: "Vinay",
        role: "Frontend Developer",
        avatar: "V",
      },
      {
        id: 2,
        name: "Harshith",
        role: "Backend Developer",
        avatar: "H",
      },
      {
        id: 3,
        name: "Divya",
        role: "UI/UX Designer",
        avatar: "D",
      },
    ],
    tasks: [
      {
        id: 1,
        title: "Build onboarding flow",
        assignee: "Vinay",
        priority: "High",
        status: "Done",
        dueDate: "2026-03-14",
      },
      {
        id: 2,
        title: "Design workspace layout",
        assignee: "Divya",
        priority: "High",
        status: "In Progress",
        dueDate: "2026-03-18",
      },
      {
        id: 3,
        title: "Setup project routing",
        assignee: "Vinay",
        priority: "Medium",
        status: "Done",
        dueDate: "2026-03-12",
      },
      {
        id: 4,
        title: "Build task tracker",
        assignee: "Vinay",
        priority: "High",
        status: "Review",
        dueDate: "2026-03-17",
      },
      {
        id: 5,
        title: "Create updates system",
        assignee: "Harshith",
        priority: "Medium",
        status: "Todo",
        dueDate: "2026-03-20",
      },
      {
        id: 6,
        title: "Add milestones section",
        assignee: "Vinay",
        priority: "Medium",
        status: "In Progress",
        dueDate: "2026-03-19",
      },
    ],
    milestones: [
      {
        id: 1,
        title: "Workspace MVP",
        description:
          "Complete the core project workspace with task tracker, updates, milestones, and team visibility.",
        dueDate: "2026-03-20",
        owner: "Vinay",
        priority: "High",
        linkedTaskIds: [1, 3, 4, 6],
      },
      {
        id: 2,
        title: "Collaboration Updates System",
        description:
          "Enable project update posting, activity feed visibility, and smoother team communication inside workspace.",
        dueDate: "2026-03-24",
        owner: "Harshith",
        priority: "Medium",
        linkedTaskIds: [5],
      },
      {
        id: 3,
        title: "UI Polish Phase",
        description:
          "Refine design consistency, layout quality, and professional visual polish for demo readiness.",
        dueDate: "2026-03-28",
        owner: "Divya",
        priority: "Critical",
        linkedTaskIds: [2],
      },
    ],
    activity: [
      {
        id: 1,
        text: "Vinay completed onboarding flow and connected workspace route.",
        time: "2 hours ago",
      },
      {
        id: 2,
        text: "Divya is improving workspace layout design and visual hierarchy.",
        time: "4 hours ago",
      },
      {
        id: 3,
        text: "Harshith planned backend integration for updates system.",
        time: "Today",
      },
    ],
  },
];