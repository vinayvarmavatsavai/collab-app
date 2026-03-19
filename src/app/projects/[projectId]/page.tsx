"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getStoredProjects, saveStoredProjects } from "@/lib/collaboration";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCheck,
  CheckCircle2,
  Clock3,
  FileText,
  FolderKanban,
  LayoutGrid,
  MessageSquare,
  Pencil,
  Sparkles,
  Target,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  projects,
  type ActivityItem,
  type MilestoneItem,
  type MilestonePriority,
  type ProjectItem,
  type TaskItem,
} from "../data";

type TaskStatus = "Backlog" | "Todo" | "In Progress" | "Review" | "Done";
type TaskPriority = "Low" | "Medium" | "High";
type WorkspaceTab =
  | "Overview"
  | "Tasks"
  | "Scrum Board"
  | "Updates"
  | "Milestones"
  | "Team";

type MilestoneStatus = "Upcoming" | "In Progress" | "Completed";
type MilestoneHealth = "On Track" | "At Risk" | "Blocked";

type ComputedMilestone = MilestoneItem & {
  linkedTasks: TaskItem[];
  progress: number;
  status: MilestoneStatus;
  health: MilestoneHealth;
};

type BoardColumnItem = {
  id: TaskStatus;
  title: TaskStatus;
  tasks: TaskItem[];
  count: number;
};

const TASK_STATUSES: TaskStatus[] = [
  "Backlog",
  "Todo",
  "In Progress",
  "Review",
  "Done",
];

const WORKSPACE_TABS: WorkspaceTab[] = [
  "Overview",
  "Tasks",
  "Scrum Board",
  "Updates",
  "Milestones",
  "Team",
];

function getPriorityClasses(priority: TaskPriority) {
  if (priority === "High") {
    return "border border-red-200 bg-red-100 text-red-700";
  }
  if (priority === "Medium") {
    return "border border-amber-200 bg-amber-100 text-amber-700";
  }
  return "border border-emerald-200 bg-emerald-100 text-emerald-700";
}

function getMilestonePriorityClasses(priority: MilestonePriority) {
  if (priority === "Critical") {
    return "border border-red-200 bg-red-100 text-red-700";
  }
  if (priority === "High") {
    return "border border-orange-200 bg-orange-100 text-orange-700";
  }
  if (priority === "Medium") {
    return "border border-amber-200 bg-amber-100 text-amber-700";
  }
  return "border border-emerald-200 bg-emerald-100 text-emerald-700";
}

function getMilestoneStatusClasses(status: MilestoneStatus) {
  if (status === "Completed") {
    return "border border-emerald-200 bg-emerald-100 text-emerald-700";
  }
  if (status === "In Progress") {
    return "border border-blue-200 bg-blue-100 text-blue-700";
  }
  return "border border-slate-200 bg-slate-100 text-slate-700";
}

function getMilestoneHealthClasses(health: MilestoneHealth) {
  if (health === "Blocked") {
    return "border border-red-200 bg-red-100 text-red-700";
  }
  if (health === "At Risk") {
    return "border border-amber-200 bg-amber-100 text-amber-700";
  }
  return "border border-emerald-200 bg-emerald-100 text-emerald-700";
}

function getStatusClasses(status: TaskStatus) {
  if (status === "Done") {
    return "border border-emerald-200 bg-emerald-100 text-emerald-700";
  }
  if (status === "In Progress") {
    return "border border-blue-200 bg-blue-100 text-blue-700";
  }
  if (status === "Review") {
    return "border border-violet-200 bg-violet-100 text-violet-700";
  }
  if (status === "Todo") {
    return "border border-amber-200 bg-amber-100 text-amber-700";
  }
  return "border border-slate-200 bg-slate-100 text-slate-700";
}

function formatTimeNow() {
  return "Just now";
}

function getDateOnlyString(date: Date) {
  return date.toISOString().split("T")[0];
}

function getDueDateState(dueDate: string) {
  const today = getDateOnlyString(new Date());

  if (!dueDate) return "normal";
  if (dueDate < today) return "overdue";
  if (dueDate === today) return "today";

  const todayDate = new Date(today);
  const due = new Date(dueDate);
  const diffMs = due.getTime() - todayDate.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 3) return "upcoming";

  return "normal";
}

function getDueDateBadgeClasses(state: string) {
  if (state === "overdue") {
    return "border border-red-200 bg-red-100 text-red-700";
  }
  if (state === "today") {
    return "border border-amber-200 bg-amber-100 text-amber-700";
  }
  if (state === "upcoming") {
    return "border border-blue-200 bg-blue-100 text-blue-700";
  }
  return "border border-slate-200 bg-slate-100 text-slate-700";
}

function getDueDateLabel(dueDate: string) {
  const state = getDueDateState(dueDate);

  if (state === "overdue") return `Overdue • ${dueDate}`;
  if (state === "today") return `Due Today • ${dueDate}`;
  if (state === "upcoming") return `Upcoming • ${dueDate}`;

  return dueDate;
}

function calculateMilestoneProgress(linkedTasks: TaskItem[]) {
  if (linkedTasks.length === 0) return 0;
  const doneCount = linkedTasks.filter((task) => task.status === "Done").length;
  return Math.round((doneCount / linkedTasks.length) * 100);
}

function calculateMilestoneStatus(
  linkedTasks: TaskItem[],
  progress: number,
): MilestoneStatus {
  if (linkedTasks.length === 0) return "Upcoming";
  if (progress === 100) return "Completed";

  const hasStarted = linkedTasks.some((task) =>
    ["In Progress", "Review", "Done"].includes(task.status),
  );

  return hasStarted ? "In Progress" : "Upcoming";
}

function calculateMilestoneHealth(
  dueDate: string,
  progress: number,
  linkedTasks: TaskItem[],
): MilestoneHealth {
  const today = getDateOnlyString(new Date());

  if (linkedTasks.length === 0) return "On Track";
  if (progress === 100) return "On Track";

  const hasBlockedPattern = linkedTasks.some(
    (task) => getDueDateState(task.dueDate) === "overdue" && task.status !== "Done",
  );

  if (hasBlockedPattern) return "Blocked";
  if (dueDate < today && progress < 100) return "At Risk";

  return "On Track";
}

function calculateProjectProgress(tasks: TaskItem[]) {
  if (tasks.length === 0) return 0;
  const doneCount = tasks.filter((task) => task.status === "Done").length;
  return Math.round((doneCount / tasks.length) * 100);
}

function TaskCardContent({
  task,
  onOpenTask,
  onEditTask,
  onDeleteTask,
}: {
  task: TaskItem;
  onOpenTask: (task: TaskItem) => void;
  onEditTask: (task: TaskItem) => void;
  onDeleteTask: (task: TaskItem) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm">
      <button
        onClick={() => onOpenTask(task)}
        className="text-left font-medium text-slate-800 transition hover:text-violet-700"
      >
        {task.title}
      </button>

      <p className="mt-1 text-xs text-slate-500">{task.assignee}</p>

      <div className="mt-2">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getDueDateBadgeClasses(
            getDueDateState(task.dueDate),
          )}`}
        >
          {getDueDateLabel(task.dueDate)}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getPriorityClasses(
            task.priority,
          )}`}
        >
          {task.priority}
        </span>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
            task.status,
          )}`}
        >
          {task.status}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => onEditTask(task)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-100"
        >
          <Pencil size={11} />
          Edit
        </button>

        <button
          onClick={() => onDeleteTask(task)}
          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700 transition hover:bg-red-100"
        >
          <Trash2 size={11} />
          Delete
        </button>
      </div>
    </div>
  );
}

function SortableTaskCard({
  task,
  onOpenTask,
  onEditTask,
  onDeleteTask,
}: {
  task: TaskItem;
  onOpenTask: (task: TaskItem) => void;
  onEditTask: (task: TaskItem) => void;
  onDeleteTask: (task: TaskItem) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: task.id,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? "opacity-40" : "opacity-100"}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <TaskCardContent
          task={task}
          onOpenTask={onOpenTask}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
        />
      </div>
    </div>
  );
}

function BoardColumn({
  column,
  onOpenTask,
  onEditTask,
  onDeleteTask,
}: {
  column: BoardColumnItem;
  onOpenTask: (task: TaskItem) => void;
  onEditTask: (task: TaskItem) => void;
  onDeleteTask: (task: TaskItem) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div
      className={`flex h-[72vh] w-[290px] shrink-0 flex-col rounded-2xl border bg-slate-50 transition ${isOver
          ? "border-violet-300 ring-2 ring-violet-100"
          : "border-slate-200"
        }`}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h3 className="font-semibold text-slate-800">{column.title}</h3>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
          {column.count}
        </span>
      </div>

      <div ref={setNodeRef} className="flex-1 space-y-3 overflow-y-auto p-3">
        <SortableContext
          items={column.tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.length === 0 ? (
            <div
              className={`rounded-xl border border-dashed bg-white p-4 text-center text-sm transition ${isOver
                  ? "border-violet-300 text-violet-700"
                  : "border-slate-200 text-slate-500"
                }`}
            >
              Drop task here
            </div>
          ) : (
            column.tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onOpenTask={onOpenTask}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

export default function ProjectWorkspacePage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId;

  const initialProject = useMemo(() => {
    const localProjects = getStoredProjects();
    return (
      localProjects.find((item) => item.id === projectId) ||
      projects.find((item) => item.id === projectId) ||
      null
    );
  }, [projectId]);

  const [projectState, setProjectState] = useState<ProjectItem | null>(
    initialProject,
  );
  useEffect(() => {
    if (!projectState) return;

    const localProjects = getStoredProjects();
    const existsInLocal = localProjects.some((item) => item.id === projectState.id);

    if (existsInLocal) {
      const next = localProjects.map((item) =>
        item.id === projectState.id ? (projectState as any) : item,
      );
      saveStoredProjects(next);
    }
  }, [projectState]);

  const [activeTab, setActiveTab] = useState<WorkspaceTab>("Overview");

  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskPriority, setNewTaskPriority] =
    useState<TaskPriority>("Medium");
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>("Todo");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [taskError, setTaskError] = useState("");

  const [isPostUpdateOpen, setIsPostUpdateOpen] = useState(false);
  const [newUpdateText, setNewUpdateText] = useState("");
  const [updateError, setUpdateError] = useState("");

  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskAssignee, setEditTaskAssignee] = useState("");
  const [editTaskPriority, setEditTaskPriority] =
    useState<TaskPriority>("Medium");
  const [editTaskStatus, setEditTaskStatus] = useState<TaskStatus>("Todo");
  const [editTaskDueDate, setEditTaskDueDate] = useState("");
  const [editTaskError, setEditTaskError] = useState("");

  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "All">("All");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "All">(
    "All",
  );
  const [filterAssignee, setFilterAssignee] = useState<string | "All">("All");

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);

  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDescription, setMilestoneDescription] = useState("");
  const [milestoneOwner, setMilestoneOwner] = useState("");
  const [milestonePriority, setMilestonePriority] =
    useState<MilestonePriority>("Medium");
  const [milestoneDueDate, setMilestoneDueDate] = useState("");
  const [milestoneLinkedTaskIds, setMilestoneLinkedTaskIds] = useState<number[]>(
    [],
  );
  const [milestoneError, setMilestoneError] = useState("");

  const [isEditMilestoneOpen, setIsEditMilestoneOpen] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<number | null>(
    null,
  );
  const [editMilestoneTitle, setEditMilestoneTitle] = useState("");
  const [editMilestoneDescription, setEditMilestoneDescription] = useState("");
  const [editMilestoneOwner, setEditMilestoneOwner] = useState("");
  const [editMilestonePriority, setEditMilestonePriority] =
    useState<MilestonePriority>("Medium");
  const [editMilestoneDueDate, setEditMilestoneDueDate] = useState("");
  const [editMilestoneLinkedTaskIds, setEditMilestoneLinkedTaskIds] = useState<
    number[]
  >([]);
  const [editMilestoneError, setEditMilestoneError] = useState("");

  const [isDeleteMilestoneOpen, setIsDeleteMilestoneOpen] = useState(false);
  const [milestoneToDelete, setMilestoneToDelete] =
    useState<ComputedMilestone | null>(null);

  const [activeDragTask, setActiveDragTask] = useState<TaskItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
  );

  if (!projectId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
          Loading project workspace...
        </div>
      </main>
    );
  }

  if (!projectState) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-slate-900">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold">Project not found</h1>
          <p className="mt-2 text-slate-600">
            No project matched this id:{" "}
            <span className="font-semibold">{projectId}</span>
          </p>
          <Link
            href="/projects"
            className="mt-5 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Go to Projects
          </Link>
        </div>
      </main>
    );
  }

  const backlogTasks = projectState.tasks.filter(
    (task) => task.status === "Backlog",
  );
  const todoTasks = projectState.tasks.filter((task) => task.status === "Todo");
  const inProgressTasks = projectState.tasks.filter(
    (task) => task.status === "In Progress",
  );
  const reviewTasks = projectState.tasks.filter(
    (task) => task.status === "Review",
  );
  const doneTasks = projectState.tasks.filter((task) => task.status === "Done");

  const backlogCount = backlogTasks.length;
  const todoCount = todoTasks.length;
  const progressCount = inProgressTasks.length;
  const reviewCount = reviewTasks.length;
  const doneCount = doneTasks.length;

  const projectProgress = calculateProjectProgress(projectState.tasks);

  const filteredTasks = projectState.tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignee.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "All" || task.status === filterStatus;

    const matchesPriority =
      filterPriority === "All" || task.priority === filterPriority;

    const matchesAssignee =
      filterAssignee === "All" || task.assignee === filterAssignee;

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  const computedMilestones: ComputedMilestone[] = [...projectState.milestones]
    .map((milestone) => {
      const linkedTasks = projectState.tasks.filter((task) =>
        milestone.linkedTaskIds.includes(task.id),
      );

      const progress = calculateMilestoneProgress(linkedTasks);
      const status = calculateMilestoneStatus(linkedTasks, progress);
      const health = calculateMilestoneHealth(
        milestone.dueDate,
        progress,
        linkedTasks,
      );

      return {
        ...milestone,
        linkedTasks,
        progress,
        status,
        health,
      };
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const completedMilestones = computedMilestones.filter(
    (milestone) => milestone.status === "Completed",
  );
  const inProgressMilestones = computedMilestones.filter(
    (milestone) => milestone.status === "In Progress",
  );
  const upcomingMilestones = computedMilestones.filter(
    (milestone) => milestone.status === "Upcoming",
  );

  const boardColumns: BoardColumnItem[] = [
    {
      id: "Backlog",
      title: "Backlog",
      tasks: backlogTasks,
      count: backlogCount,
    },
    {
      id: "Todo",
      title: "Todo",
      tasks: todoTasks,
      count: todoCount,
    },
    {
      id: "In Progress",
      title: "In Progress",
      tasks: inProgressTasks,
      count: progressCount,
    },
    {
      id: "Review",
      title: "Review",
      tasks: reviewTasks,
      count: reviewCount,
    },
    {
      id: "Done",
      title: "Done",
      tasks: doneTasks,
      count: doneCount,
    },
  ];

  function getNextActivityId() {
    return projectState!.activity.length > 0
      ? Math.max(...projectState!.activity.map((item) => item.id)) + 1
      : 1;
  }

  function getNextMilestoneId() {
    return projectState!.milestones.length > 0
      ? Math.max(...projectState!.milestones.map((item) => item.id)) + 1
      : 1;
  }

  function resetTaskForm() {
    setNewTaskTitle("");
    setNewTaskAssignee(projectState!.team[0]?.name || "");
    setNewTaskPriority("Medium");
    setNewTaskStatus("Todo");
    setNewTaskDueDate("");
    setTaskError("");
  }

  function openAddTaskModal() {
    setIsAddTaskOpen(true);
    setNewTaskTitle("");
    setNewTaskAssignee(projectState!.team[0]?.name || "");
    setNewTaskPriority("Medium");
    setNewTaskStatus("Todo");
    setNewTaskDueDate("");
    setTaskError("");
  }

  function closeAddTaskModal() {
    setIsAddTaskOpen(false);
    resetTaskForm();
  }

  function openPostUpdateModal() {
    setIsPostUpdateOpen(true);
    setNewUpdateText("");
    setUpdateError("");
  }

  function closePostUpdateModal() {
    setIsPostUpdateOpen(false);
    setNewUpdateText("");
    setUpdateError("");
  }

  function openEditTaskModal(task: TaskItem) {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditTaskAssignee(task.assignee);
    setEditTaskPriority(task.priority);
    setEditTaskStatus(task.status);
    setEditTaskDueDate(task.dueDate);
    setEditTaskError("");
    setIsEditTaskOpen(true);
  }

  function closeEditTaskModal() {
    setIsEditTaskOpen(false);
    setEditingTaskId(null);
    setEditTaskTitle("");
    setEditTaskAssignee("");
    setEditTaskPriority("Medium");
    setEditTaskStatus("Todo");
    setEditTaskDueDate("");
    setEditTaskError("");
  }

  function openTaskDetailModal(task: TaskItem) {
    setSelectedTask(task);
    setIsTaskDetailOpen(true);
  }

  function closeTaskDetailModal() {
    setSelectedTask(null);
    setIsTaskDetailOpen(false);
  }

  function openDeleteConfirmModal(task: TaskItem) {
    setTaskToDelete(task);
    setIsDeleteConfirmOpen(true);
  }

  function closeDeleteConfirmModal() {
    setTaskToDelete(null);
    setIsDeleteConfirmOpen(false);
  }

  function resetMilestoneForm() {
    setMilestoneTitle("");
    setMilestoneDescription("");
    setMilestoneOwner(projectState!.team[0]?.name || "");
    setMilestonePriority("Medium");
    setMilestoneDueDate("");
    setMilestoneLinkedTaskIds([]);
    setMilestoneError("");
  }

  function openAddMilestoneModal() {
    setIsAddMilestoneOpen(true);
    setMilestoneTitle("");
    setMilestoneDescription("");
    setMilestoneOwner(projectState!.team[0]?.name || "");
    setMilestonePriority("Medium");
    setMilestoneDueDate("");
    setMilestoneLinkedTaskIds([]);
    setMilestoneError("");
  }

  function closeAddMilestoneModal() {
    setIsAddMilestoneOpen(false);
    resetMilestoneForm();
  }

  function openEditMilestoneModal(milestone: MilestoneItem) {
    setEditingMilestoneId(milestone.id);
    setEditMilestoneTitle(milestone.title);
    setEditMilestoneDescription(milestone.description);
    setEditMilestoneOwner(milestone.owner);
    setEditMilestonePriority(milestone.priority);
    setEditMilestoneDueDate(milestone.dueDate);
    setEditMilestoneLinkedTaskIds(milestone.linkedTaskIds);
    setEditMilestoneError("");
    setIsEditMilestoneOpen(true);
  }

  function closeEditMilestoneModal() {
    setIsEditMilestoneOpen(false);
    setEditingMilestoneId(null);
    setEditMilestoneTitle("");
    setEditMilestoneDescription("");
    setEditMilestoneOwner("");
    setEditMilestonePriority("Medium");
    setEditMilestoneDueDate("");
    setEditMilestoneLinkedTaskIds([]);
    setEditMilestoneError("");
  }

  function openDeleteMilestoneModal(milestone: ComputedMilestone) {
    setMilestoneToDelete(milestone);
    setIsDeleteMilestoneOpen(true);
  }

  function closeDeleteMilestoneModal() {
    setMilestoneToDelete(null);
    setIsDeleteMilestoneOpen(false);
  }

  function toggleMilestoneTask(taskId: number) {
    setMilestoneLinkedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId],
    );
  }

  function toggleEditMilestoneTask(taskId: number) {
    setEditMilestoneLinkedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId],
    );
  }

  function handleAddTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedTitle = newTaskTitle.trim();
    const trimmedAssignee = newTaskAssignee.trim();

    if (!trimmedTitle) {
      setTaskError("Please enter a task title.");
      return;
    }

    if (!trimmedAssignee) {
      setTaskError("Please select an assignee.");
      return;
    }

    if (!newTaskDueDate) {
      setTaskError("Please select a due date.");
      return;
    }

    const nextTaskId =
      projectState!.tasks.length > 0
        ? Math.max(...projectState!.tasks.map((task) => task.id)) + 1
        : 1;

    const createdTask: TaskItem = {
      id: nextTaskId,
      title: trimmedTitle,
      assignee: trimmedAssignee,
      priority: newTaskPriority,
      status: newTaskStatus,
      dueDate: newTaskDueDate,
    };

    const createdActivity: ActivityItem = {
      id: getNextActivityId(),
      text: `New task '${trimmedTitle}' created and assigned to ${trimmedAssignee}`,
      time: formatTimeNow(),
    };

    setProjectState({
      ...projectState!,
      tasks: [createdTask, ...projectState!.tasks],
      activity: [createdActivity, ...projectState!.activity],
    });

    closeAddTaskModal();
  }

  function handleEditTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (editingTaskId === null) return;

    const trimmedTitle = editTaskTitle.trim();
    const trimmedAssignee = editTaskAssignee.trim();

    if (!trimmedTitle) {
      setEditTaskError("Please enter a task title.");
      return;
    }

    if (!trimmedAssignee) {
      setEditTaskError("Please select an assignee.");
      return;
    }

    if (!editTaskDueDate) {
      setEditTaskError("Please select a due date.");
      return;
    }

    const oldTask = projectState!.tasks.find((task) => task.id === editingTaskId);
    if (!oldTask) return;

    const updatedTasks = projectState!.tasks.map((task) =>
      task.id === editingTaskId
        ? {
          ...task,
          title: trimmedTitle,
          assignee: trimmedAssignee,
          priority: editTaskPriority,
          status: editTaskStatus,
          dueDate: editTaskDueDate,
        }
        : task,
    );

    const editActivity: ActivityItem = {
      id: getNextActivityId(),
      text: `Task '${oldTask.title}' was edited and updated to '${trimmedTitle}'`,
      time: formatTimeNow(),
    };

    setProjectState({
      ...projectState!,
      tasks: updatedTasks,
      activity: [editActivity, ...projectState!.activity],
    });

    if (selectedTask?.id === editingTaskId) {
      setSelectedTask({
        ...selectedTask,
        title: trimmedTitle,
        assignee: trimmedAssignee,
        priority: editTaskPriority,
        status: editTaskStatus,
        dueDate: editTaskDueDate,
      });
    }

    closeEditTaskModal();
  }

  function handleDeleteTask(taskId: number) {
    const taskToDeleteNow = projectState!.tasks.find((task) => task.id === taskId);
    if (!taskToDeleteNow) return;

    const updatedTasks = projectState!.tasks.filter((task) => task.id !== taskId);

    const updatedMilestones = projectState!.milestones.map((milestone) => ({
      ...milestone,
      linkedTaskIds: milestone.linkedTaskIds.filter((id) => id !== taskId),
    }));

    const deleteActivity: ActivityItem = {
      id: getNextActivityId(),
      text: `Task '${taskToDeleteNow.title}' was deleted`,
      time: formatTimeNow(),
    };

    setProjectState({
      ...projectState!,
      tasks: updatedTasks,
      milestones: updatedMilestones,
      activity: [deleteActivity, ...projectState!.activity],
    });

    if (selectedTask?.id === taskId) {
      closeTaskDetailModal();
    }

    closeDeleteConfirmModal();
  }

  function handleStatusChange(taskId: number, nextStatus: TaskStatus) {
    const currentTask = projectState!.tasks.find((task) => task.id === taskId);

    if (!currentTask || currentTask.status === nextStatus) {
      return;
    }

    const updatedTasks = projectState!.tasks.map((task) =>
      task.id === taskId ? { ...task, status: nextStatus } : task,
    );

    const statusActivity: ActivityItem = {
      id: getNextActivityId(),
      text: `${currentTask.assignee} moved '${currentTask.title}' from ${currentTask.status} to ${nextStatus}`,
      time: formatTimeNow(),
    };

    setProjectState({
      ...projectState!,
      tasks: updatedTasks,
      activity: [statusActivity, ...projectState!.activity],
    });

    if (selectedTask?.id === taskId) {
      setSelectedTask({ ...selectedTask, status: nextStatus });
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const taskId = Number(event.active.id);
    const foundTask = projectState!.tasks.find((task) => task.id === taskId) || null;
    setActiveDragTask(foundTask);
  }

  function handleDragCancel() {
    setActiveDragTask(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    setActiveDragTask(null);

    if (!over) return;

    const activeTaskId = Number(active.id);
    const draggedTask = projectState!.tasks.find((task) => task.id === activeTaskId);

    if (!draggedTask) return;

    let nextStatus: TaskStatus | null = null;

    if (TASK_STATUSES.includes(over.id as TaskStatus)) {
      nextStatus = over.id as TaskStatus;
    } else {
      const overTask = projectState!.tasks.find((task) => task.id === Number(over.id));
      nextStatus = overTask?.status || null;
    }

    if (!nextStatus || nextStatus === draggedTask.status) {
      return;
    }

    handleStatusChange(activeTaskId, nextStatus);
  }

  function handlePostUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedUpdate = newUpdateText.trim();

    if (!trimmedUpdate) {
      setUpdateError("Please write an update before posting.");
      return;
    }

    const updateActivity: ActivityItem = {
      id: getNextActivityId(),
      text: trimmedUpdate,
      time: formatTimeNow(),
    };

    setProjectState({
      ...projectState!,
      activity: [updateActivity, ...projectState!.activity],
    });

    closePostUpdateModal();
  }

  function handleAddMilestone(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedTitle = milestoneTitle.trim();
    const trimmedDescription = milestoneDescription.trim();
    const trimmedOwner = milestoneOwner.trim();

    if (!trimmedTitle) {
      setMilestoneError("Please enter a milestone title.");
      return;
    }

    if (!trimmedDescription) {
      setMilestoneError("Please enter a milestone description.");
      return;
    }

    if (!trimmedOwner) {
      setMilestoneError("Please select an owner.");
      return;
    }

    if (!milestoneDueDate) {
      setMilestoneError("Please select a due date.");
      return;
    }

    const createdMilestone: MilestoneItem = {
      id: getNextMilestoneId(),
      title: trimmedTitle,
      description: trimmedDescription,
      dueDate: milestoneDueDate,
      owner: trimmedOwner,
      priority: milestonePriority,
      linkedTaskIds: milestoneLinkedTaskIds,
    };

    const milestoneActivity: ActivityItem = {
      id: getNextActivityId(),
      text: `Milestone '${trimmedTitle}' was created and assigned to ${trimmedOwner}`,
      time: formatTimeNow(),
    };

    setProjectState({
      ...projectState!,
      milestones: [createdMilestone, ...projectState!.milestones],
      activity: [milestoneActivity, ...projectState!.activity],
    });

    closeAddMilestoneModal();
  }

  function handleEditMilestone(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (editingMilestoneId === null) return;

    const trimmedTitle = editMilestoneTitle.trim();
    const trimmedDescription = editMilestoneDescription.trim();
    const trimmedOwner = editMilestoneOwner.trim();

    if (!trimmedTitle) {
      setEditMilestoneError("Please enter a milestone title.");
      return;
    }

    if (!trimmedDescription) {
      setEditMilestoneError("Please enter a milestone description.");
      return;
    }

    if (!trimmedOwner) {
      setEditMilestoneError("Please select an owner.");
      return;
    }

    if (!editMilestoneDueDate) {
      setEditMilestoneError("Please select a due date.");
      return;
    }

    const oldMilestone = projectState!.milestones.find(
      (milestone) => milestone.id === editingMilestoneId,
    );

    if (!oldMilestone) return;

    const updatedMilestones = projectState!.milestones.map((milestone) =>
      milestone.id === editingMilestoneId
        ? {
          ...milestone,
          title: trimmedTitle,
          description: trimmedDescription,
          dueDate: editMilestoneDueDate,
          owner: trimmedOwner,
          priority: editMilestonePriority,
          linkedTaskIds: editMilestoneLinkedTaskIds,
        }
        : milestone,
    );

    const editActivity: ActivityItem = {
      id: getNextActivityId(),
      text: `Milestone '${oldMilestone.title}' was updated to '${trimmedTitle}'`,
      time: formatTimeNow(),
    };

    setProjectState({
      ...projectState!,
      milestones: updatedMilestones,
      activity: [editActivity, ...projectState!.activity],
    });

    closeEditMilestoneModal();
  }

  function handleDeleteMilestone(milestoneId: number) {
    const deletingMilestone = projectState!.milestones.find(
      (milestone) => milestone.id === milestoneId,
    );

    if (!deletingMilestone) return;

    const updatedMilestones = projectState!.milestones.filter(
      (milestone) => milestone.id !== milestoneId,
    );

    const deleteActivity: ActivityItem = {
      id: getNextActivityId(),
      text: `Milestone '${deletingMilestone.title}' was deleted`,
      time: formatTimeNow(),
    };

    setProjectState({
      ...projectState!,
      milestones: updatedMilestones,
      activity: [deleteActivity, ...projectState!.activity],
    });

    closeDeleteMilestoneModal();
  }

  function clearTaskFilters() {
    setSearchQuery("");
    setFilterStatus("All");
    setFilterPriority("All");
    setFilterAssignee("All");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>

        <section className="mb-6 rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-2 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur">
                {projectState.category}
              </p>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {projectState.title}
              </h1>

              <p className="mt-2 text-base text-white/90 sm:text-lg">
                {projectState.tagline}
              </p>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">
                {projectState.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={openAddTaskModal}
                  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow transition hover:bg-slate-100"
                >
                  Add Task
                </button>

                <button
                  onClick={() => setActiveTab("Scrum Board")}
                  className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  Open Scrum Board
                </button>

                <button
                  className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                  onClick={openPostUpdateModal}
                >
                  Post Update
                </button>
                <Link
                  href="/sharedspace"
                  className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  Shared Space
                </Link>
              </div>
            </div>

            <div className="grid w-full max-w-md grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-white/75">
                  Progress
                </p>
                <p className="mt-2 text-2xl font-bold">{projectProgress}%</p>
                <div className="mt-3 h-2 rounded-full bg-white/20">
                  <div
                    className="h-2 rounded-full bg-white"
                    style={{ width: `${projectProgress}%` }}
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-white/75">
                  Due Date
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {projectState.dueDate}
                </p>
              </div>

              <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-white/75">
                  Tasks
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {projectState.tasks.length}
                </p>
              </div>

              <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-white/75">
                  Team
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {projectState.team.length}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {WORKSPACE_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${activeTab === tab
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </section>

        {activeTab === "Overview" && (
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Completed Tasks</p>
                      <h3 className="mt-1 text-2xl font-bold">{doneCount}</h3>
                    </div>
                    <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
                      <CheckCircle2 size={20} />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">In Progress</p>
                      <h3 className="mt-1 text-2xl font-bold">{progressCount}</h3>
                    </div>
                    <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
                      <Clock3 size={20} />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Milestones</p>
                      <h3 className="mt-1 text-2xl font-bold">
                        {computedMilestones.length}
                      </h3>
                    </div>
                    <div className="rounded-xl bg-violet-100 p-3 text-violet-700">
                      <Target size={20} />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Team Members</p>
                      <h3 className="mt-1 text-2xl font-bold">
                        {projectState.team.length}
                      </h3>
                    </div>
                    <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
                      <Users size={20} />
                    </div>
                  </div>
                </div>
              </section>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Task Snapshot</h2>
                    <p className="text-sm text-slate-500">
                      Quick view of latest work items
                    </p>
                  </div>
                  <button
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    onClick={() => setActiveTab("Tasks")}
                  >
                    Go to Tasks
                  </button>
                </div>

                <div className="space-y-3">
                  {projectState.tasks.slice(0, 5).map((task) => (
                    <button
                      key={task.id}
                      onClick={() => openTaskDetailModal(task)}
                      className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:bg-slate-100"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">{task.title}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {task.assignee}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPriorityClasses(
                            task.priority,
                          )}`}
                        >
                          {task.priority}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                            task.status,
                          )}`}
                        >
                          {task.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <MessageSquare className="text-slate-700" size={18} />
                  <h2 className="text-lg font-bold">Recent Activity</h2>
                </div>

                <div className="space-y-3">
                  {projectState.activity.slice(0, 6).map((item) => (
                    <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm leading-6 text-slate-700">
                        {item.text}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">{item.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Users className="text-slate-700" size={18} />
                  <h2 className="text-lg font-bold">Team Members</h2>
                </div>

                <div className="space-y-3">
                  {projectState.team.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 font-bold text-white">
                          {member.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            {member.name}
                          </p>
                          <p className="text-sm text-slate-500">{member.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <FolderKanban className="text-slate-700" size={18} />
                  <h2 className="text-lg font-bold">Project Info</h2>
                </div>

                <div className="space-y-4 text-sm text-slate-600">
                  <div className="flex items-center gap-3">
                    <CalendarDays size={16} className="text-slate-400" />
                    <span>Deadline: {projectState.dueDate}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users size={16} className="text-slate-400" />
                    <span>Created by: {projectState.createdBy}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Target size={16} className="text-slate-400" />
                    <span>Progress: {projectProgress}%</span>
                  </div>
                </div>
              </div>
            </aside>
          </section>
        )}

        {activeTab === "Tasks" && (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold">Task Tracker</h2>
                  <p className="text-sm text-slate-500">
                    Manage and update all project tasks
                  </p>
                </div>

                <button
                  onClick={openAddTaskModal}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Add Task
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />

                <select
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(e.target.value as TaskStatus | "All")
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                >
                  <option value="All">All Status</option>
                  {TASK_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <select
                  value={filterPriority}
                  onChange={(e) =>
                    setFilterPriority(e.target.value as TaskPriority | "All")
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                >
                  <option value="All">All Priority</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>

                <select
                  value={filterAssignee}
                  onChange={(e) => setFilterAssignee(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                >
                  <option value="All">All Assignees</option>
                  {projectState.team.map((member) => (
                    <option key={member.id} value={member.name}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {filteredTasks.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {projectState.tasks.length}
                  </span>{" "}
                  tasks
                </p>

                <button
                  onClick={clearTaskFilters}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-sm text-slate-500">
                    <th className="px-3">Task</th>
                    <th className="px-3">Assignee</th>
                    <th className="px-3">Due Date</th>
                    <th className="px-3">Priority</th>
                    <th className="px-3">Status</th>
                    <th className="px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="rounded-2xl bg-slate-50 px-3 py-10 text-center text-sm text-slate-500"
                      >
                        No tasks match your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => (
                      <tr key={task.id} className="bg-slate-50">
                        <td className="rounded-l-2xl px-3 py-4 font-medium text-slate-800">
                          <button
                            onClick={() => openTaskDetailModal(task)}
                            className="text-left transition hover:text-violet-700"
                          >
                            {task.title}
                          </button>
                        </td>
                        <td className="px-3 py-4 text-sm text-slate-600">
                          {task.assignee}
                        </td>
                        <td className="px-3 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getDueDateBadgeClasses(
                              getDueDateState(task.dueDate),
                            )}`}
                          >
                            {getDueDateLabel(task.dueDate)}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPriorityClasses(
                              task.priority,
                            )}`}
                          >
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                              task.status,
                            )}`}
                          >
                            {task.status}
                          </span>
                        </td>
                        <td className="rounded-r-2xl px-3 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => openEditTaskModal(task)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                            >
                              <Pencil size={12} />
                              Edit
                            </button>

                            <button
                              onClick={() => openDeleteConfirmModal(task)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100"
                            >
                              <Trash2 size={12} />
                              Delete
                            </button>

                            {TASK_STATUSES.filter((status) => status !== task.status).map(
                              (status) => (
                                <button
                                  key={status}
                                  onClick={() => handleStatusChange(task.id, status)}
                                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                                >
                                  {status}
                                </button>
                              ),
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "Scrum Board" && (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Scrum Board</h2>
                <p className="text-sm text-slate-500">
                  Drag tasks between columns like Jira, Trello, and Linear
                </p>
              </div>
              <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                <LayoutGrid size={18} />
              </div>
            </div>

            <div className="mb-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Drag and drop task cards between Backlog, Todo, In Progress, Review,
              and Done.
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragCancel={handleDragCancel}
              onDragEnd={handleDragEnd}
            >
              <div className="w-full overflow-x-auto touch-pan-x pb-2">
                <div className="flex min-w-max gap-4">
                  {boardColumns.map((column) => (
                    <BoardColumn
                      key={column.id}
                      column={column}
                      onOpenTask={openTaskDetailModal}
                      onEditTask={openEditTaskModal}
                      onDeleteTask={openDeleteConfirmModal}
                    />
                  ))}
                </div>
              </div>

              <DragOverlay>
                {activeDragTask ? (
                  <div className="w-[260px] rotate-1 opacity-95 shadow-2xl">
                    <TaskCardContent
                      task={activeDragTask}
                      onOpenTask={openTaskDetailModal}
                      onEditTask={openEditTaskModal}
                      onDeleteTask={openDeleteConfirmModal}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </section>
        )}

        {activeTab === "Updates" && (
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Project Updates</h2>
                    <p className="text-sm text-slate-500">
                      Progress logs, blockers, team notes, and announcements
                    </p>
                  </div>

                  <button
                    onClick={openPostUpdateModal}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    Post Update
                  </button>
                </div>
              </div>

              {projectState.activity.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                    <MessageSquare size={24} />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">
                    No updates yet
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Start the conversation by sharing progress, blockers, or
                    team announcements.
                  </p>
                  <button
                    onClick={openPostUpdateModal}
                    className="mt-5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    Post First Update
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {projectState.activity.map((item, index) => (
                    <div
                      key={item.id}
                      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                          {index % 3 === 0 ? (
                            <Sparkles size={18} />
                          ) : index % 3 === 1 ? (
                            <MessageSquare size={18} />
                          ) : (
                            <CheckCheck size={18} />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                              Project Update
                            </span>
                            <span className="text-xs text-slate-400">
                              {item.time}
                            </span>
                          </div>

                          <p className="mt-3 text-sm leading-7 text-slate-700">
                            {item.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <MessageSquare className="text-slate-700" size={18} />
                  <h2 className="text-lg font-bold">Updates Summary</h2>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Total Updates
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {projectState.activity.length}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Latest Activity
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {projectState.activity[0]?.text || "No activity yet"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className="text-slate-700" size={18} />
                  <h2 className="text-lg font-bold">What to post here</h2>
                </div>

                <div className="space-y-3 text-sm text-slate-600">
                  <p>• Completed UI or backend progress</p>
                  <p>• Blockers and dependency issues</p>
                  <p>• Testing notes and bug updates</p>
                  <p>• Team-wide announcements</p>
                  <p>• Next-step planning</p>
                </div>
              </div>
            </aside>
          </section>
        )}

        {activeTab === "Milestones" && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Completed</p>
                    <h3 className="mt-1 text-2xl font-bold">
                      {completedMilestones.length}
                    </h3>
                  </div>
                  <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
                    <CheckCircle2 size={20} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">In Progress</p>
                    <h3 className="mt-1 text-2xl font-bold">
                      {inProgressMilestones.length}
                    </h3>
                  </div>
                  <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
                    <Clock3 size={20} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Upcoming</p>
                    <h3 className="mt-1 text-2xl font-bold">
                      {upcomingMilestones.length}
                    </h3>
                  </div>
                  <div className="rounded-xl bg-violet-100 p-3 text-violet-700">
                    <Target size={20} />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold">Milestones Roadmap</h2>
                  <p className="text-sm text-slate-500">
                    Major goals linked to actual project tasks
                  </p>
                </div>

                <button
                  onClick={openAddMilestoneModal}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Add Milestone
                </button>
              </div>

              {computedMilestones.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
                    <Target size={24} />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">
                    No milestones added yet
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Add milestones later to track the major phases of this project.
                  </p>
                  <button
                    onClick={openAddMilestoneModal}
                    className="mt-5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    Create First Milestone
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {computedMilestones.map((milestone, index) => (
                    <div
                      key={milestone.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex min-w-0 items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                              <span className="text-sm font-bold">{index + 1}</span>
                            </div>

                            <div className="min-w-0">
                              <p className="text-lg font-semibold text-slate-900">
                                {milestone.title}
                              </p>
                              <p className="mt-2 text-sm leading-6 text-slate-600">
                                {milestone.description}
                              </p>

                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                                  <CalendarDays size={12} />
                                  Due: {milestone.dueDate}
                                </span>

                                <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                                  Owner: {milestone.owner}
                                </span>

                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getMilestonePriorityClasses(
                                    milestone.priority,
                                  )}`}
                                >
                                  {milestone.priority}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-start justify-end gap-2">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getMilestoneStatusClasses(
                                milestone.status,
                              )}`}
                            >
                              {milestone.status}
                            </span>

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getMilestoneHealthClasses(
                                milestone.health,
                              )}`}
                            >
                              {milestone.health}
                            </span>

                            <button
                              onClick={() => openEditMilestoneModal(milestone)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                            >
                              <Pencil size={12} />
                              Edit
                            </button>

                            <button
                              onClick={() => openDeleteMilestoneModal(milestone)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100"
                            >
                              <Trash2 size={12} />
                              Delete
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="font-medium text-slate-700">
                              Progress
                            </span>
                            <span className="font-semibold text-slate-900">
                              {milestone.progress}%
                            </span>
                          </div>

                          <div className="h-2.5 rounded-full bg-slate-200">
                            <div
                              className="h-2.5 rounded-full bg-slate-900 transition-all"
                              style={{ width: `${milestone.progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                          <div className="rounded-2xl bg-white p-4 shadow-sm">
                            <p className="text-xs uppercase tracking-wide text-slate-500">
                              Linked Tasks
                            </p>
                            <p className="mt-2 text-xl font-bold text-slate-900">
                              {milestone.linkedTasks.length}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white p-4 shadow-sm">
                            <p className="text-xs uppercase tracking-wide text-slate-500">
                              Done Tasks
                            </p>
                            <p className="mt-2 text-xl font-bold text-slate-900">
                              {
                                milestone.linkedTasks.filter(
                                  (task) => task.status === "Done",
                                ).length
                              }
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white p-4 shadow-sm">
                            <p className="text-xs uppercase tracking-wide text-slate-500">
                              Remaining
                            </p>
                            <p className="mt-2 text-xl font-bold text-slate-900">
                              {
                                milestone.linkedTasks.filter(
                                  (task) => task.status !== "Done",
                                ).length
                              }
                            </p>
                          </div>
                        </div>

                        {milestone.linkedTasks.length > 0 ? (
                          <div className="rounded-2xl bg-white p-4 shadow-sm">
                            <p className="mb-3 text-sm font-semibold text-slate-800">
                              Linked Task Titles
                            </p>

                            <div className="flex flex-wrap gap-2">
                              {milestone.linkedTasks.map((task) => (
                                <span
                                  key={task.id}
                                  className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                                >
                                  {task.title}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                            No linked tasks yet for this milestone.
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === "Team" && (
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Team Members</h2>
                  <p className="text-sm text-slate-500">
                    Current collaborators in this workspace
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {projectState.team.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 font-bold text-white">
                        {member.avatar}
                      </div>

                      <div>
                        <p className="font-semibold text-slate-800">
                          {member.name}
                        </p>
                        <p className="text-sm text-slate-500">{member.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Users className="text-slate-700" size={18} />
                <h2 className="text-lg font-bold">Team Summary</h2>
              </div>

              <p className="text-sm leading-6 text-slate-600">
                This section helps show role distribution across frontend,
                backend, design, product, and collaboration support.
              </p>
            </aside>
          </section>
        )}
      </div>

      {isAddTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Create New Task
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add a task to this project workspace
                </p>
              </div>

              <button
                onClick={closeAddTaskModal}
                className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
                aria-label="Close task modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Task Title
                </label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Ex: Build cohort creation flow"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Assignee
                  </label>
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  >
                    {projectState.team.map((member) => (
                      <option key={member.id} value={member.name}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Priority
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) =>
                      setNewTaskPriority(e.target.value as TaskPriority)
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Status
                </label>
                <select
                  value={newTaskStatus}
                  onChange={(e) =>
                    setNewTaskStatus(e.target.value as TaskStatus)
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                >
                  <option value="Backlog">Backlog</option>
                  <option value="Todo">Todo</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              {taskError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {taskError}
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAddTaskModal}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Edit Task</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Update the selected task details
                </p>
              </div>

              <button
                onClick={closeEditTaskModal}
                className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
                aria-label="Close edit task modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditTask} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Task Title
                </label>
                <input
                  type="text"
                  value={editTaskTitle}
                  onChange={(e) => setEditTaskTitle(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Assignee
                  </label>
                  <select
                    value={editTaskAssignee}
                    onChange={(e) => setEditTaskAssignee(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  >
                    {projectState.team.map((member) => (
                      <option key={member.id} value={member.name}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Priority
                  </label>
                  <select
                    value={editTaskPriority}
                    onChange={(e) =>
                      setEditTaskPriority(e.target.value as TaskPriority)
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Status
                </label>
                <select
                  value={editTaskStatus}
                  onChange={(e) =>
                    setEditTaskStatus(e.target.value as TaskStatus)
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                >
                  <option value="Backlog">Backlog</option>
                  <option value="Todo">Todo</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Due Date
                </label>
                <input
                  type="date"
                  value={editTaskDueDate}
                  onChange={(e) => setEditTaskDueDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              {editTaskError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {editTaskError}
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditTaskModal}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPostUpdateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Post Project Update
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Share progress, blockers, or announcements with the team
                </p>
              </div>

              <button
                onClick={closePostUpdateModal}
                className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
                aria-label="Close update modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePostUpdate} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Update Message
                </label>
                <textarea
                  value={newUpdateText}
                  onChange={(e) => setNewUpdateText(e.target.value)}
                  placeholder="Ex: Finished onboarding UI and started integrating project workspace actions."
                  rows={5}
                  className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              {updateError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {updateError}
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closePostUpdateModal}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Post Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isTaskDetailOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                  Task Details
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {selectedTask.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Detailed view of the selected task
                </p>
              </div>

              <button
                onClick={closeTaskDetailModal}
                className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
                aria-label="Close task detail modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Assignee
                </p>
                <p className="mt-2 font-semibold text-slate-800">
                  {selectedTask.assignee}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Due Date
                </p>
                <div className="mt-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getDueDateBadgeClasses(
                      getDueDateState(selectedTask.dueDate),
                    )}`}
                  >
                    {getDueDateLabel(selectedTask.dueDate)}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Priority
                </p>
                <div className="mt-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPriorityClasses(
                      selectedTask.priority,
                    )}`}
                  >
                    {selectedTask.priority}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </p>
                <div className="mt-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                      selectedTask.status,
                    )}`}
                  >
                    {selectedTask.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <FileText size={16} className="text-slate-500" />
                <p className="text-sm font-semibold text-slate-700">
                  Description
                </p>
              </div>
              <p className="text-sm leading-6 text-slate-600">
                This task currently uses placeholder task details. When backend
                APIs arrive, you can expand this modal with task description,
                comments, checklist items, attachments, and audit history.
              </p>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <MessageSquare size={16} className="text-slate-500" />
                <p className="text-sm font-semibold text-slate-700">
                  Comments & Activity
                </p>
              </div>
              <p className="text-sm leading-6 text-slate-600">
                No task-level comments yet. Later, this can show discussion,
                task-specific updates, mentions, and change history.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                onClick={() => openEditTaskModal(selectedTask)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <Pencil size={14} />
                Edit Task
              </button>

              <button
                onClick={() => openDeleteConfirmModal(selectedTask)}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              >
                <Trash2 size={14} />
                Delete Task
              </button>

              <button
                onClick={closeTaskDetailModal}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && taskToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700">
                  <AlertTriangle size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Delete Task?
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    This action cannot be undone in the current workspace state.
                  </p>
                </div>
              </div>

              <button
                onClick={closeDeleteConfirmModal}
                className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
                aria-label="Close delete confirmation modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
              <p className="text-sm text-slate-600">You are about to delete:</p>
              <p className="mt-2 font-semibold text-slate-900">
                {taskToDelete.title}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Assignee: {taskToDelete.assignee}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                onClick={closeDeleteConfirmModal}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                onClick={() => handleDeleteTask(taskToDelete.id)}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddMilestoneOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Create Milestone
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add a major project phase and link tasks to it
                </p>
              </div>

              <button
                onClick={closeAddMilestoneModal}
                className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
                aria-label="Close milestone modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMilestone} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Milestone Title
                </label>
                <input
                  type="text"
                  value={milestoneTitle}
                  onChange={(e) => setMilestoneTitle(e.target.value)}
                  placeholder="Ex: Workspace MVP"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  value={milestoneDescription}
                  onChange={(e) => setMilestoneDescription(e.target.value)}
                  rows={4}
                  placeholder="Ex: Complete core workspace features for startup collaboration"
                  className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Owner
                  </label>
                  <select
                    value={milestoneOwner}
                    onChange={(e) => setMilestoneOwner(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  >
                    {projectState.team.map((member) => (
                      <option key={member.id} value={member.name}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Priority
                  </label>
                  <select
                    value={milestonePriority}
                    onChange={(e) =>
                      setMilestonePriority(e.target.value as MilestonePriority)
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={milestoneDueDate}
                    onChange={(e) => setMilestoneDueDate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-sm font-semibold text-slate-700">
                    Link Tasks
                  </label>
                  <span className="text-xs font-medium text-slate-500">
                    {milestoneLinkedTaskIds.length} selected
                  </span>
                </div>

                <div className="max-h-72 space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  {projectState.tasks.length === 0 ? (
                    <div className="rounded-xl bg-white p-4 text-sm text-slate-500">
                      No tasks available to link yet.
                    </div>
                  ) : (
                    projectState.tasks.map((task) => (
                      <label
                        key={task.id}
                        className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={milestoneLinkedTaskIds.includes(task.id)}
                          onChange={() => toggleMilestoneTask(task.id)}
                          className="mt-1 h-4 w-4 rounded border-slate-300"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-slate-800">
                              {task.title}
                            </p>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                                task.status,
                              )}`}
                            >
                              {task.status}
                            </span>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getPriorityClasses(
                                task.priority,
                              )}`}
                            >
                              {task.priority}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {task.assignee} • {task.dueDate}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {milestoneError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {milestoneError}
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAddMilestoneModal}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Create Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditMilestoneOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Edit Milestone
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Update milestone details and linked tasks
                </p>
              </div>

              <button
                onClick={closeEditMilestoneModal}
                className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
                aria-label="Close edit milestone modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditMilestone} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Milestone Title
                </label>
                <input
                  type="text"
                  value={editMilestoneTitle}
                  onChange={(e) => setEditMilestoneTitle(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  value={editMilestoneDescription}
                  onChange={(e) => setEditMilestoneDescription(e.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Owner
                  </label>
                  <select
                    value={editMilestoneOwner}
                    onChange={(e) => setEditMilestoneOwner(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  >
                    {projectState.team.map((member) => (
                      <option key={member.id} value={member.name}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Priority
                  </label>
                  <select
                    value={editMilestonePriority}
                    onChange={(e) =>
                      setEditMilestonePriority(e.target.value as MilestonePriority)
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={editMilestoneDueDate}
                    onChange={(e) => setEditMilestoneDueDate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-sm font-semibold text-slate-700">
                    Linked Tasks
                  </label>
                  <span className="text-xs font-medium text-slate-500">
                    {editMilestoneLinkedTaskIds.length} selected
                  </span>
                </div>

                <div className="max-h-72 space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  {projectState.tasks.length === 0 ? (
                    <div className="rounded-xl bg-white p-4 text-sm text-slate-500">
                      No tasks available to link yet.
                    </div>
                  ) : (
                    projectState.tasks.map((task) => (
                      <label
                        key={task.id}
                        className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={editMilestoneLinkedTaskIds.includes(task.id)}
                          onChange={() => toggleEditMilestoneTask(task.id)}
                          className="mt-1 h-4 w-4 rounded border-slate-300"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-slate-800">
                              {task.title}
                            </p>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                                task.status,
                              )}`}
                            >
                              {task.status}
                            </span>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getPriorityClasses(
                                task.priority,
                              )}`}
                            >
                              {task.priority}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {task.assignee} • {task.dueDate}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {editMilestoneError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {editMilestoneError}
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditMilestoneModal}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteMilestoneOpen && milestoneToDelete && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700">
                  <AlertTriangle size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Delete Milestone?
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    This will remove the milestone from the roadmap.
                  </p>
                </div>
              </div>

              <button
                onClick={closeDeleteMilestoneModal}
                className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
                aria-label="Close delete milestone confirmation modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
              <p className="text-sm text-slate-600">You are about to delete:</p>
              <p className="mt-2 font-semibold text-slate-900">
                {milestoneToDelete.title}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Owner: {milestoneToDelete.owner}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Linked tasks: {milestoneToDelete.linkedTasks.length}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                onClick={closeDeleteMilestoneModal}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                onClick={() => handleDeleteMilestone(milestoneToDelete.id)}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}