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
import ProjectMilestones from "../components/ProjectMilestones";

type TaskStatus = "Backlog" | "Todo" | "In Progress" | "Review" | "Done";
type TaskPriority = "Low" | "Medium" | "High";
type WorkspaceTab =
  | "Overview"
  | "Tasks"
  | "Scrum Board"
  | "Updates"
  | "Milestones"
  | "Team";

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
    return "border border-[var(--danger-soft-border)] bg-[var(--danger-soft-bg)] text-[var(--danger-soft-text)]";
  }
  if (priority === "Medium") {
    return "border border-[var(--line-soft)] bg-[var(--muted)] text-[var(--text-main)]";
  }
  return "border border-[var(--line-soft)] bg-[var(--surface-solid)] text-[var(--text-muted-2)]";
}


function getStatusClasses(status: TaskStatus) {
  if (status === "Done") {
    return "border border-[var(--line-soft)] bg-[var(--surface-solid)] text-[var(--text-main)]";
  }
  if (status === "In Progress") {
    return "border border-[var(--line-soft)] bg-[var(--muted)] text-[var(--text-main)]";
  }
  if (status === "Review") {
    return "border border-[var(--line-soft)] bg-[var(--muted)] text-[var(--text-main)]";
  }
  if (status === "Todo") {
    return "border border-[var(--line-soft)] bg-[var(--surface-solid)] text-[var(--text-main)]";
  }
  return "border border-[var(--line-soft)] bg-[var(--surface-solid)] text-[var(--text-muted-2)]";
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
    return "border border-[var(--danger-soft-border)] bg-[var(--danger-soft-bg)] text-[var(--danger-soft-text)]";
  }
  if (state === "today") {
    return "border border-[var(--line-soft)] bg-[var(--muted)] text-[var(--text-main)]";
  }
  if (state === "upcoming") {
    return "border border-[var(--line-soft)] bg-[var(--surface-solid)] text-[var(--text-main)]";
  }
  return "border border-[var(--line-soft)] bg-[var(--surface-solid)] text-[var(--text-muted-2)]";
}

function getDueDateLabel(dueDate: string) {
  const state = getDueDateState(dueDate);

  if (state === "overdue") return `Overdue • ${dueDate}`;
  if (state === "today") return `Due Today • ${dueDate}`;
  if (state === "upcoming") return `Upcoming • ${dueDate}`;

  return dueDate;
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
    <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-3 text-sm shadow-sm">
      <button
        onClick={() => onOpenTask(task)}
        className="text-left font-medium text-[var(--text-main)] transition hover:text-[var(--primary)]"
      >
        {task.title}
      </button>

      <p className="mt-1 text-xs text-[var(--text-muted-2)]">{task.assignee}</p>

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
          className="inline-flex items-center gap-1 rounded-xl border border-[var(--line-soft)] bg-[var(--muted)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-main)] transition hover:opacity-80"
        >
          <Pencil size={11} />
          Edit
        </button>

        <button
          onClick={() => onDeleteTask(task)}
          className="inline-flex items-center gap-1 rounded-xl border border-[var(--danger-soft-border)] bg-[var(--danger-soft-bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--danger-soft-text)] transition hover:opacity-80"
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
      className={`flex h-[72vh] w-[290px] shrink-0 flex-col rounded-3xl border bg-[var(--muted)] transition ${
        isOver
          ? "border-[var(--primary)] ring-2 ring-[var(--line-soft)]"
          : "border-[var(--line-soft)]"
      }`}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--line-soft)] bg-[var(--muted)] px-4 py-3">
        <h3 className="font-semibold text-[var(--text-main)]">{column.title}</h3>
        <span className="rounded-full bg-[var(--surface-solid)] px-2 py-0.5 text-xs font-semibold text-[var(--text-main)]">
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
              className={`rounded-2xl border border-dashed bg-[var(--surface-solid)] p-4 text-center text-sm transition ${
                isOver
                  ? "border-[var(--primary)] text-[var(--text-main)]"
                  : "border-[var(--line-soft)] text-[var(--text-muted-2)]"
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
    const localProjects = getStoredProjects();
    const refreshedProject =
      localProjects.find((item) => item.id === projectId) ||
      projects.find((item) => item.id === projectId) ||
      null;

    setProjectState(refreshedProject);
  }, [projectId]);

  useEffect(() => {
    if (!projectState) return;

    const localProjects = getStoredProjects();
    const existsInLocal = localProjects.some((item) => item.id === projectState.id);

    if (existsInLocal) {
      const next = localProjects.map((item) =>
        item.id === projectState.id ? ({ ...projectState } as ProjectItem) : item,
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
    useState<MilestoneItem | null>(null);

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
      <main className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] text-[var(--text-main)]">
        <div className="rounded-3xl border border-[var(--line-soft)] bg-[var(--surface-solid)] px-6 py-4 shadow-sm">
          Loading project workspace...
        </div>
      </main>
    );
  }

  if (!projectState) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--app-bg)] px-4 text-[var(--text-main)]">
        <div className="rounded-3xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold">Project not found</h1>
          <p className="mt-2 text-[var(--text-muted-2)]">
            No project matched this id:{" "}
            <span className="font-semibold">{projectId}</span>
          </p>
          <Link
            href="/projects"
            className="mt-5 inline-flex rounded-2xl bg-[var(--primary-btn-bg)] px-4 py-2 text-sm font-semibold text-[var(--primary-btn-text)] transition hover:opacity-90"
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
  if (!projectState || projectState.activity.length === 0) return 1;
  return Math.max(...projectState.activity.map((item) => item.id)) + 1;
}

function getNextMilestoneId() {
  if (!projectState || projectState.milestones.length === 0) return 1;
  return Math.max(...projectState.milestones.map((item) => item.id)) + 1;
}

  function resetTaskForm() {
    setNewTaskTitle("");
    setNewTaskAssignee(projectState?.team[0]?.name || "");
    setNewTaskPriority("Medium");
    setNewTaskStatus("Todo");
    setNewTaskDueDate("");
    setTaskError("");
  }

  function openAddTaskModal() {
    setIsAddTaskOpen(true);
    setNewTaskTitle("");
    setNewTaskAssignee(projectState?.team[0]?.name || "");
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
    setMilestoneOwner(projectState?.team[0]?.name || "");
    setMilestonePriority("Medium");
    setMilestoneDueDate("");
    setMilestoneLinkedTaskIds([]);
    setMilestoneError("");
  }

  function openAddMilestoneModal() {
    setIsAddMilestoneOpen(true);
    setMilestoneTitle("");
    setMilestoneDescription("");
    setMilestoneOwner(projectState?.team[0]?.name || "");
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

  function openDeleteMilestoneModal(milestone: MilestoneItem) {
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

  if (!projectState) return;

  const currentProject: ProjectItem = projectState;
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
    currentProject.tasks.length > 0
      ? Math.max(...currentProject.tasks.map((task) => task.id)) + 1
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
    ...currentProject,
    tasks: [createdTask, ...currentProject.tasks],
    activity: [createdActivity, ...currentProject.activity],
  });

  closeAddTaskModal();
}

  function handleEditTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!projectState) return;

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

    const oldTask = projectState.tasks.find((task) => task.id === editingTaskId);
    if (!oldTask) return;

    const updatedTasks = projectState.tasks.map((task) =>
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
      ...projectState,
      tasks: updatedTasks,
      activity: [editActivity, ...projectState.activity],
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
    if (!projectState) return;
    const taskToDeleteNow = projectState.tasks.find((task) => task.id === taskId);
    if (!taskToDeleteNow) return;

    const updatedTasks = projectState.tasks.filter((task) => task.id !== taskId);

    const updatedMilestones = projectState.milestones.map((milestone) => ({
      ...milestone,
      linkedTaskIds: milestone.linkedTaskIds.filter((id) => id !== taskId),
    }));

    const deleteActivity: ActivityItem = {
      id: getNextActivityId(),
      text: `Task '${taskToDeleteNow.title}' was deleted`,
      time: formatTimeNow(),
    };

    setProjectState({
      ...projectState,
      tasks: updatedTasks,
      milestones: updatedMilestones,
      activity: [deleteActivity, ...projectState.activity],
    });

    if (selectedTask?.id === taskId) {
      closeTaskDetailModal();
    }

    closeDeleteConfirmModal();
  }

  function handleStatusChange(taskId: number, nextStatus: TaskStatus) {
    if (!projectState) return;
    const currentTask = projectState.tasks.find((task) => task.id === taskId);

    if (!currentTask || currentTask.status === nextStatus) {
      return;
    }

    const updatedTasks = projectState.tasks.map((task) =>
      task.id === taskId ? { ...task, status: nextStatus } : task,
    );

    const statusActivity: ActivityItem = {
      id: getNextActivityId(),
      text: `${currentTask.assignee} moved '${currentTask.title}' from ${currentTask.status} to ${nextStatus}`,
      time: formatTimeNow(),
    };

    setProjectState({
      ...projectState,
      tasks: updatedTasks,
      activity: [statusActivity, ...projectState.activity],
    });

    if (selectedTask?.id === taskId) {
      setSelectedTask({ ...selectedTask, status: nextStatus });
    }
  }

  function handleDragStart(event: DragStartEvent) {
    if (!projectState) return;
    const taskId = Number(event.active.id);
    const foundTask =
      projectState.tasks.find((task) => task.id === taskId) || null;
    setActiveDragTask(foundTask);
  }

  function handleDragCancel() {
    setActiveDragTask(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!projectState) return;
    const { active, over } = event;

    setActiveDragTask(null);

    if (!over) return;

    const activeTaskId = Number(active.id);
    const draggedTask = projectState.tasks.find((task) => task.id === activeTaskId);

    if (!draggedTask) return;

    let nextStatus: TaskStatus | null = null;

    if (TASK_STATUSES.includes(over.id as TaskStatus)) {
      nextStatus = over.id as TaskStatus;
    } else {
      const overTask = projectState.tasks.find((task) => task.id === Number(over.id));
      nextStatus = overTask?.status || null;
    }

    if (!nextStatus || nextStatus === draggedTask.status) {
      return;
    }

    handleStatusChange(activeTaskId, nextStatus);
  }

  function handlePostUpdate(e: React.FormEvent<HTMLFormElement>) {
    if (!projectState) return;
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
      ...projectState,
      activity: [updateActivity, ...projectState.activity],
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

   if (!projectState) return;

const currentProject: ProjectItem = projectState;

setProjectState({
  ...currentProject,
  milestones: [createdMilestone, ...currentProject.milestones],
  activity: [milestoneActivity, ...currentProject.activity],
});

    closeAddMilestoneModal();
  }

  function handleEditMilestone(e: React.FormEvent<HTMLFormElement>) {
    if (!projectState) return;
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

    const oldMilestone = projectState.milestones.find(
      (milestone) => milestone.id === editingMilestoneId,
    );

    if (!oldMilestone) return;

    const updatedMilestones = projectState.milestones.map((milestone) =>
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
      ...projectState,
      milestones: updatedMilestones,
      activity: [editActivity, ...projectState.activity],
    });

    closeEditMilestoneModal();
  }

  function handleDeleteMilestone(milestoneId: number) {
    if (!projectState) return;
    const deletingMilestone = projectState.milestones.find(
      (milestone) => milestone.id === milestoneId,
    );

    if (!deletingMilestone) return;

    const updatedMilestones = projectState.milestones.filter(
      (milestone) => milestone.id !== milestoneId,
    );

    const deleteActivity: ActivityItem = {
      id: getNextActivityId(),
      text: `Milestone '${deletingMilestone.title}' was deleted`,
      time: formatTimeNow(),
    };

    setProjectState({
      ...projectState,
      milestones: updatedMilestones,
      activity: [deleteActivity, ...projectState.activity],
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
    <main className="min-h-screen bg-[var(--app-bg)] text-[var(--text-main)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-solid)] px-4 py-2 text-sm font-medium text-[var(--text-main)] shadow-sm transition hover:opacity-90"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>

        <section className="mb-6 rounded-[28px] border border-[var(--line-soft)] bg-[var(--surface-solid)] p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-2 inline-flex rounded-full border border-[var(--line-soft)] bg-[var(--muted)] px-3 py-1 text-xs font-semibold tracking-wide text-[var(--text-main)]">
                {projectState.category}
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-[var(--text-main)] sm:text-4xl">
                {projectState.title}
              </h1>

              <p className="mt-2 text-base text-[var(--text-muted-2)] sm:text-lg">
                {projectState.tagline}
              </p>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--text-muted-2)] sm:text-base">
                {projectState.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={openAddTaskModal}
                  className="rounded-2xl bg-[var(--primary-btn-bg)] px-4 py-2 text-sm font-semibold text-[var(--primary-btn-text)] transition hover:opacity-90"
                >
                  Add Task
                </button>

                <button
                  onClick={() => setActiveTab("Scrum Board")}
                  className="rounded-2xl border border-[var(--line-soft)] bg-[var(--muted)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] transition hover:opacity-80"
                >
                  Open Scrum Board
                </button>

                <button
                  className="rounded-2xl border border-[var(--line-soft)] bg-[var(--muted)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] transition hover:opacity-80"
                  onClick={openPostUpdateModal}
                >
                  Post Update
                </button>

                <Link
                  href="/sharedspace"
                  className="rounded-2xl border border-[var(--line-soft)] bg-[var(--muted)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] transition hover:opacity-80"
                >
                  Shared Space
                </Link>
              </div>
            </div>

            <div className="grid w-full max-w-md grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--muted)] p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--text-muted-2)]">
                  Progress
                </p>
                <p className="mt-2 text-2xl font-bold text-[var(--text-main)]">
                  {projectProgress}%
                </p>
                <div className="mt-3 h-2 rounded-full bg-[var(--line-soft)]">
                  <div
                    className="h-2 rounded-full bg-[var(--text-main)]"
                    style={{ width: `${projectProgress}%` }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--muted)] p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--text-muted-2)]">
                  Due Date
                </p>
                <p className="mt-2 text-lg font-semibold text-[var(--text-main)]">
                  {projectState.dueDate}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--muted)] p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--text-muted-2)]">
                  Tasks
                </p>
                <p className="mt-2 text-2xl font-bold text-[var(--text-main)]">
                  {projectState.tasks.length}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--muted)] p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--text-muted-2)]">
                  Team
                </p>
                <p className="mt-2 text-2xl font-bold text-[var(--text-main)]">
                  {projectState.team.length}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-[28px] border border-[var(--line-soft)] bg-[var(--surface-solid)] p-3 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {WORKSPACE_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab
                    ? "bg-[var(--text-main)] text-[var(--background)] shadow-sm"
                    : "bg-[var(--muted)] text-[var(--text-main)] hover:opacity-80"
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
                <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[var(--text-muted-2)]">
                        Completed Tasks
                      </p>
                      <h3 className="mt-1 text-2xl font-bold text-[var(--text-main)]">
                        {doneCount}
                      </h3>
                    </div>
                    <div className="rounded-xl border border-[var(--line-soft)] bg-[var(--muted)] p-3 text-[var(--text-main)]">
                      <CheckCircle2 size={20} />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[var(--text-muted-2)]">
                        In Progress
                      </p>
                      <h3 className="mt-1 text-2xl font-bold text-[var(--text-main)]">
                        {progressCount}
                      </h3>
                    </div>
                    <div className="rounded-xl border border-[var(--line-soft)] bg-[var(--muted)] p-3 text-[var(--text-main)]">
                      <Clock3 size={20} />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[var(--text-muted-2)]">
                        Milestones
                      </p>
                      <h3 className="mt-1 text-2xl font-bold text-[var(--text-main)]">
                        {projectState.milestones.length}
                      </h3>
                    </div>
                    <div className="rounded-xl border border-[var(--line-soft)] bg-[var(--muted)] p-3 text-[var(--text-main)]">
                      <Target size={20} />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[var(--text-muted-2)]">
                        Team Members
                      </p>
                      <h3 className="mt-1 text-2xl font-bold text-[var(--text-main)]">
                        {projectState.team.length}
                      </h3>
                    </div>
                    <div className="rounded-xl border border-[var(--line-soft)] bg-[var(--muted)] p-3 text-[var(--text-main)]">
                      <Users size={20} />
                    </div>
                  </div>
                </div>
              </section>

              <div className="rounded-[28px] border border-[var(--line-soft)] bg-[var(--surface-solid)] p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-[var(--text-main)]">
                      Task Snapshot
                    </h2>
                    <p className="text-sm text-[var(--text-muted-2)]">
                      Quick view of latest work items
                    </p>
                  </div>
                  <button
                    className="rounded-2xl border border-[var(--line-soft)] bg-[var(--muted)] px-4 py-2 text-sm font-medium text-[var(--text-main)] transition hover:opacity-80"
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
                      className="flex w-full items-center justify-between rounded-2xl border border-[var(--line-soft)] bg-[var(--muted)] px-4 py-4 text-left transition hover:opacity-80"
                    >
                      <div>
                        <p className="font-semibold text-[var(--text-main)]">
                          {task.title}
                        </p>
                        <p className="mt-1 text-sm text-[var(--text-muted-2)]">
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

              <div className="rounded-[28px] border border-[var(--line-soft)] bg-[var(--surface-solid)] p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <MessageSquare className="text-[var(--text-main)]" size={18} />
                  <h2 className="text-lg font-bold text-[var(--text-main)]">
                    Recent Activity
                  </h2>
                </div>

                <div className="space-y-3">
                  {projectState.activity.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-[var(--line-soft)] bg-[var(--muted)] p-4"
                    >
                      <p className="text-sm leading-6 text-[var(--text-main)]">
                        {item.text}
                      </p>
                      <p className="mt-2 text-xs text-[var(--text-muted-2)]">
                        {item.time}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-[28px] border border-[var(--line-soft)] bg-[var(--surface-solid)] p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Users className="text-[var(--text-main)]" size={18} />
                  <h2 className="text-lg font-bold text-[var(--text-main)]">
                    Team Members
                  </h2>
                </div>

                <div className="space-y-3">
                  {projectState.team.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-2xl border border-[var(--line-soft)] bg-[var(--muted)] px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[var(--surface-solid)] font-bold text-[var(--text-main)]">
                          {member.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--text-main)]">
                            {member.name}
                          </p>
                          <p className="text-sm text-[var(--text-muted-2)]">
                            {member.role}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-[var(--line-soft)] bg-[var(--surface-solid)] p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <FolderKanban className="text-[var(--text-main)]" size={18} />
                  <h2 className="text-lg font-bold text-[var(--text-main)]">
                    Project Info
                  </h2>
                </div>

                <div className="space-y-4 text-sm text-[var(--text-muted-2)]">
                  <div className="flex items-center gap-3">
                    <CalendarDays size={16} className="text-[var(--text-muted-2)]" />
                    <span>Deadline: {projectState.dueDate}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users size={16} className="text-[var(--text-muted-2)]" />
                    <span>Created by: {projectState.createdBy}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Target size={16} className="text-[var(--text-muted-2)]" />
                    <span>Progress: {projectProgress}%</span>
                  </div>
                </div>
              </div>
            </aside>
          </section>
        )}

        {activeTab === "Tasks" && (
          <section className="rounded-[28px] border border-[var(--line-soft)] bg-[var(--surface-solid)] p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-main)]">
                    Task Tracker
                  </h2>
                  <p className="text-sm text-[var(--text-muted-2)]">
                    Manage and update all project tasks
                  </p>
                </div>

                <button
                  onClick={openAddTaskModal}
                  className="rounded-2xl bg-[var(--primary-btn-bg)] px-4 py-2 text-sm font-semibold text-[var(--primary-btn-text)] transition hover:opacity-90"
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
                  className="rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3 py-2 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--field-focus)]"
                />

                <select
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(e.target.value as TaskStatus | "All")
                  }
                  className="rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3 py-2 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--field-focus)]"
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
                  className="rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3 py-2 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--field-focus)]"
                >
                  <option value="All">All Priority</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>

                <select
                  value={filterAssignee}
                  onChange={(e) => setFilterAssignee(e.target.value)}
                  className="rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3 py-2 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--field-focus)]"
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
                <p className="text-sm text-[var(--text-muted-2)]">
                  Showing{" "}
                  <span className="font-semibold text-[var(--text-main)]">
                    {filteredTasks.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-[var(--text-main)]">
                    {projectState.tasks.length}
                  </span>{" "}
                  tasks
                </p>

                <button
                  onClick={clearTaskFilters}
                  className="rounded-2xl border border-[var(--line-soft)] bg-[var(--muted)] px-3 py-2 text-sm font-medium text-[var(--text-main)] transition hover:opacity-80"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-sm text-[var(--text-muted-2)]">
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
                        className="rounded-2xl border border-[var(--line-soft)] bg-[var(--muted)] px-3 py-10 text-center text-sm text-[var(--text-muted-2)]"
                      >
                        No tasks match your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => (
                      <tr key={task.id} className="bg-[var(--muted)]">
                        <td className="rounded-l-2xl border-y border-l border-[var(--line-soft)] px-3 py-4 font-medium text-[var(--text-main)]">
                          <button
                            onClick={() => openTaskDetailModal(task)}
                            className="text-left transition hover:text-[var(--primary)]"
                          >
                            {task.title}
                          </button>
                        </td>
                        <td className="border-y border-[var(--line-soft)] px-3 py-4 text-sm text-[var(--text-muted-2)]">
                          {task.assignee}
                        </td>
                        <td className="border-y border-[var(--line-soft)] px-3 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getDueDateBadgeClasses(
                              getDueDateState(task.dueDate),
                            )}`}
                          >
                            {getDueDateLabel(task.dueDate)}
                          </span>
                        </td>
                        <td className="border-y border-[var(--line-soft)] px-3 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPriorityClasses(
                              task.priority,
                            )}`}
                          >
                            {task.priority}
                          </span>
                        </td>
                        <td className="border-y border-[var(--line-soft)] px-3 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                              task.status,
                            )}`}
                          >
                            {task.status}
                          </span>
                        </td>
                        <td className="rounded-r-2xl border-y border-r border-[var(--line-soft)] px-3 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => openEditTaskModal(task)}
                              className="inline-flex items-center gap-1 rounded-xl border border-[var(--line-soft)] bg-[var(--surface-solid)] px-2.5 py-1 text-xs font-medium text-[var(--text-main)] transition hover:opacity-80"
                            >
                              <Pencil size={12} />
                              Edit
                            </button>

                            <button
                              onClick={() => openDeleteConfirmModal(task)}
                              className="inline-flex items-center gap-1 rounded-xl border border-[var(--danger-soft-border)] bg-[var(--danger-soft-bg)] px-2.5 py-1 text-xs font-medium text-[var(--danger-soft-text)] transition hover:opacity-80"
                            >
                              <Trash2 size={12} />
                              Delete
                            </button>

                            {TASK_STATUSES.filter((status) => status !== task.status).map(
                              (status) => (
                                <button
                                  key={status}
                                  onClick={() => handleStatusChange(task.id, status)}
                                  className="rounded-xl border border-[var(--line-soft)] bg-[var(--surface-solid)] px-2.5 py-1 text-xs font-medium text-[var(--text-main)] transition hover:opacity-80"
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
          <section className="rounded-[28px] border border-[var(--line-soft)] bg-[var(--surface-solid)] p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[var(--text-main)]">
                  Scrum Board
                </h2>
                <p className="text-sm text-[var(--text-muted-2)]"
                >
                  Drag tasks between columns like Jira, Trello, and Linear
                </p>
              </div>
              <div className="rounded-xl border border-[var(--line-soft)] bg-[var(--muted)] p-2 text-[var(--text-main)]">
                <LayoutGrid size={18} />
              </div>
            </div>

            <div className="mb-4 rounded-2xl border border-dashed border-[var(--line-soft)] bg-[var(--muted)] px-4 py-3 text-sm text-[var(--text-muted-2)]">
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
              <div className="rounded-[28px] border border-[var(--line-soft)] bg-[var(--surface-solid)] p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-[var(--text-main)]">
                      Project Updates
                    </h2>
                    <p className="text-sm text-[var(--text-muted-2)]">
                      Progress logs, blockers, team notes, and announcements
                    </p>
                  </div>

                  <button
                    onClick={openPostUpdateModal}
                    className="rounded-2xl bg-[var(--primary-btn-bg)] px-4 py-2 text-sm font-semibold text-[var(--primary-btn-text)] transition hover:opacity-90"
                  >
                    Post Update
                  </button>
                </div>
              </div>

              {projectState.activity.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-[var(--line-soft)] bg-[var(--surface-solid)] p-10 text-center shadow-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--line-soft)] bg-[var(--muted)] text-[var(--text-muted-2)]">
                    <MessageSquare size={24} />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-[var(--text-main)]">
                    No updates yet
                  </h3>
                  <p className="mt-2 text-sm text-[var(--text-muted-2)]">
                    Start the conversation by sharing progress, blockers, or
                    team announcements.
                  </p>
                  <button
                    onClick={openPostUpdateModal}
                    className="mt-5 rounded-2xl bg-[var(--primary-btn-bg)] px-4 py-2 text-sm font-semibold text-[var(--primary-btn-text)] transition hover:opacity-90"
                  >
                    Post First Update
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {projectState.activity.map((item, index) => (
                    <div
                      key={item.id}
                      className="rounded-[28px] border border-[var(--line-soft)] bg-[var(--surface-solid)] p-5 shadow-sm"
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--line-soft)] bg-[var(--muted)] text-[var(--text-main)]">
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
                            <span className="inline-flex rounded-full border border-[var(--line-soft)] bg-[var(--muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted-2)]">
                              Project Update
                            </span>
                            <span className="text-xs text-[var(--text-muted-2)]">
                              {item.time}
                            </span>
                          </div>

                          <p className="mt-3 text-sm leading-7 text-[var(--text-main)]">
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
              <div className="rounded-[28px] border border-[var(--line-soft)] bg-[var(--surface-solid)] p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <MessageSquare className="text-[var(--text-main)]" size={18} />
                  <h2 className="text-lg font-bold text-[var(--text-main)]">
                    Updates Summary
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--muted)] p-4">
                    <p className="text-xs uppercase tracking-wide text-[var(--text-muted-2)]">
                      Total Updates
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[var(--text-main)]">
                      {projectState.activity.length}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--muted)] p-4">
                    <p className="text-xs uppercase tracking-wide text-[var(--text-muted-2)]">
                      Latest Activity
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-main)]">
                      {projectState.activity[0]?.text || "No activity yet"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-[var(--line-soft)] bg-[var(--surface-solid)] p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className="text-[var(--text-main)]" size={18} />
                  <h2 className="text-lg font-bold text-[var(--text-main)]">
                    What to post here
                  </h2>
                </div>

                <div className="space-y-3 text-sm text-[var(--text-muted-2)]">
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
            <div className="rounded-[28px] border border-[var(--line-soft)] bg-[var(--surface-solid)] p-5 shadow-sm">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-main)]">
                    Milestones Roadmap
                  </h2>
                  <p className="text-sm text-[var(--text-muted-2)]">
                    Full project history in a responsive timeline
                  </p>
                </div>

                <button
                  onClick={openAddMilestoneModal}
                  className="rounded-2xl bg-[var(--primary-btn-bg)] px-4 py-2 text-sm font-semibold text-[var(--primary-btn-text)] transition hover:opacity-90"
                >
                  Add Milestone
                </button>
              </div>

              {projectState.milestones.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--line-soft)] bg-[var(--muted)] p-10 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-solid)] text-[var(--text-muted-2)] shadow-sm">
                    <Target size={24} />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-[var(--text-main)]">
                    No milestones added yet
                  </h3>
                  <p className="mt-2 text-sm text-[var(--text-muted-2)]">
                    Add milestones later to track the major phases of this project.
                  </p>
                  <button
                    onClick={openAddMilestoneModal}
                    className="mt-5 rounded-2xl bg-[var(--primary-btn-bg)] px-4 py-2 text-sm font-semibold text-[var(--primary-btn-text)] transition hover:opacity-90"
                  >
                    Create First Milestone
                  </button>
                </div>
              ) : (
                <ProjectMilestones
                  milestones={projectState.milestones}
                  onEdit={openEditMilestoneModal}
                  onDelete={openDeleteMilestoneModal}
                />
              )}
            </div>
          </section>
        )}

        {activeTab === "Team" && (
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2 rounded-[28px] border border-[var(--line-soft)] bg-[var(--surface-solid)] p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-main)]">
                    Team Members
                  </h2>
                  <p className="text-sm text-[var(--text-muted-2)]">
                    Current collaborators in this workspace
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {projectState.team.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-2xl border border-[var(--line-soft)] bg-[var(--muted)] p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[var(--surface-solid)] font-bold text-[var(--text-main)]">
                        {member.avatar}
                      </div>

                      <div>
                        <p className="font-semibold text-[var(--text-main)]">
                          {member.name}
                        </p>
                        <p className="text-sm text-[var(--text-muted-2)]">
                          {member.role}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <aside className="rounded-[28px] border border-[var(--line-soft)] bg-[var(--surface-solid)] p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Users className="text-[var(--text-main)]" size={18} />
                <h2 className="text-lg font-bold text-[var(--text-main)]">
                  Team Summary
                </h2>
              </div>

              <p className="text-sm leading-6 text-[var(--text-muted-2)]">
                This section helps show role distribution across frontend,
                backend, design, product, and collaboration support.
              </p>
            </aside>
          </section>
        )}
      </div>

      {isAddTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[28px] border border-[var(--line-soft)] bg-[var(--surface-solid)] p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-main)]">
                  Create New Task
                </h2>
                <p className="mt-1 text-sm text-[var(--text-muted-2)]">
                  Add a task to this project workspace
                </p>
              </div>

              <button
                onClick={closeAddTaskModal}
                className="rounded-xl border border-[var(--line-soft)] p-2 text-[var(--text-main)] transition hover:bg-[var(--muted)]"
                aria-label="Close task modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--text-main)]">
                  Task Title
                </label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Ex: Build cohort creation flow"
                  className="w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--field-focus)]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--text-main)]">
                    Assignee
                  </label>
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--field-focus)]"
                  >
                    {projectState.team.map((member) => (
                      <option key={member.id} value={member.name}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--text-main)]">
                    Priority
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) =>
                      setNewTaskPriority(e.target.value as TaskPriority)
                    }
                    className="w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--field-focus)]"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--text-main)]">
                  Status
                </label>
                <select
                  value={newTaskStatus}
                  onChange={(e) =>
                    setNewTaskStatus(e.target.value as TaskStatus)
                  }
                  className="w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--field-focus)]"
                >
                  <option value="Backlog">Backlog</option>
                  <option value="Todo">Todo</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--text-main)]">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--field-focus)]"
                />
              </div>

              {taskError ? (
                <div className="rounded-2xl border border-[var(--danger-soft-border)] bg-[var(--danger-soft-bg)] px-4 py-3 text-sm text-[var(--danger-soft-text)]">
                  {taskError}
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAddTaskModal}
                  className="rounded-2xl border border-[var(--line-soft)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] transition hover:bg-[var(--muted)]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-2xl bg-[var(--primary-btn-bg)] px-5 py-2 text-sm font-semibold text-[var(--primary-btn-text)] transition hover:opacity-90"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[28px] border border-[var(--line-soft)] bg-[var(--surface-solid)] p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-main)]">
                  Edit Task
                </h2>
                <p className="mt-1 text-sm text-[var(--text-muted-2)]">
                  Update the selected task details
                </p>
              </div>

              <button
                onClick={closeEditTaskModal}
                className="rounded-xl border border-[var(--line-soft)] p-2 text-[var(--text-main)] transition hover:bg-[var(--muted)]"
                aria-label="Close edit task modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditTask} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--text-main)]">
                  Task Title
                </label>
                <input
                  type="text"
                  value={editTaskTitle}
                  onChange={(e) => setEditTaskTitle(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--field-focus)]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--text-main)]">
                    Assignee
                  </label>
                  <select
                    value={editTaskAssignee}
                    onChange={(e) => setEditTaskAssignee(e.target.value)}
                    className="w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--field-focus)]"
                  >
                    {projectState.team.map((member) => (
                      <option key={member.id} value={member.name}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--text-main)]">
                    Priority
                  </label>
                  <select
                    value={editTaskPriority}
                    onChange={(e) =>
                      setEditTaskPriority(e.target.value as TaskPriority)
                    }
                    className="w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--field-focus)]"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--text-main)]">
                  Status
                </label>
                <select
                  value={editTaskStatus}
                  onChange={(e) =>
                    setEditTaskStatus(e.target.value as TaskStatus)
                  }
                  className="w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--field-focus)]"
                >
                  <option value="Backlog">Backlog</option>
                  <option value="Todo">Todo</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--text-main)]">
                  Due Date
                </label>
                <input
                  type="date"
                  value={editTaskDueDate}
                  onChange={(e) => setEditTaskDueDate(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--field-focus)]"
                />
              </div>

              {editTaskError ? (
                <div className="rounded-2xl border border-[var(--danger-soft-border)] bg-[var(--danger-soft-bg)] px-4 py-3 text-sm text-[var(--danger-soft-text)]">
                  {editTaskError}
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditTaskModal}
                  className="rounded-2xl border border-[var(--line-soft)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] transition hover:bg-[var(--muted)]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-2xl bg-[var(--primary-btn-bg)] px-5 py-2 text-sm font-semibold text-[var(--primary-btn-text)] transition hover:opacity-90"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPostUpdateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[28px] border border-[var(--line-soft)] bg-[var(--surface-solid)] p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-main)]">
                  Post Project Update
                </h2>
                <p className="mt-1 text-sm text-[var(--text-muted-2)]">
                  Share progress, blockers, or announcements with the team
                </p>
              </div>

              <button
                onClick={closePostUpdateModal}
                className="rounded-xl border border-[var(--line-soft)] p-2 text-[var(--text-main)] transition hover:bg-[var(--muted)]"
                aria-label="Close update modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePostUpdate} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--text-main)]">
                  Update Message
                </label>
                <textarea
                  value={newUpdateText}
                  onChange={(e) => setNewUpdateText(e.target.value)}
                  placeholder="Ex: Finished onboarding UI and started integrating project workspace actions."
                  rows={5}
                  className="w-full resize-none rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--field-focus)]"
                />
              </div>

              {updateError ? (
                <div className="rounded-2xl border border-[var(--danger-soft-border)] bg-[var(--danger-soft-bg)] px-4 py-3 text-sm text-[var(--danger-soft-text)]">
                  {updateError}
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closePostUpdateModal}
                  className="rounded-2xl border border-[var(--line-soft)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] transition hover:bg-[var(--muted)]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-2xl bg-[var(--primary-btn-bg)] px-5 py-2 text-sm font-semibold text-[var(--primary-btn-text)] transition hover:opacity-90"
                >
                  Post Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isTaskDetailOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] border border-[var(--line-soft)] bg-[var(--surface-solid)] p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex rounded-full border border-[var(--line-soft)] bg-[var(--muted)] px-3 py-1 text-xs font-semibold text-[var(--text-main)]">
                  Task Details
                </div>
                <h2 className="text-2xl font-bold text-[var(--text-main)]">
                  {selectedTask.title}
                </h2>
                <p className="mt-1 text-sm text-[var(--text-muted-2)]">
                  Detailed view of the selected task
                </p>
              </div>

              <button
                onClick={closeTaskDetailModal}
                className="rounded-xl border border-[var(--line-soft)] p-2 text-[var(--text-main)] transition hover:bg-[var(--muted)]"
                aria-label="Close task detail modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--muted)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted-2)]">
                  Assignee
                </p>
                <p className="mt-2 font-semibold text-[var(--text-main)]">
                  {selectedTask.assignee}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--muted)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted-2)]">
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

              <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--muted)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted-2)]">
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

              <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--muted)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted-2)]">
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

            <div className="mt-4 rounded-2xl border border-[var(--line-soft)] bg-[var(--muted)] p-4">
              <div className="mb-2 flex items-center gap-2">
                <FileText size={16} className="text-[var(--text-muted-2)]" />
                <p className="text-sm font-semibold text-[var(--text-main)]">
                  Description
                </p>
              </div>
              <p className="text-sm leading-6 text-[var(--text-muted-2)]">
                This task currently uses placeholder task details. When backend
                APIs arrive, you can expand this modal with task description,
                comments, checklist items, attachments, and audit history.
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-[var(--line-soft)] bg-[var(--muted)] p-4">
              <div className="mb-2 flex items-center gap-2">
                <MessageSquare size={16} className="text-[var(--text-muted-2)]" />
                <p className="text-sm font-semibold text-[var(--text-main)]">
                  Comments & Activity
                </p>
              </div>
              <p className="text-sm leading-6 text-[var(--text-muted-2)]">
                No task-level comments yet. Later, this can show discussion,
                task-specific updates, mentions, and change history.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                onClick={() => openEditTaskModal(selectedTask)}
                className="inline-flex items-center gap-2 rounded-2xl border border-[var(--line-soft)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] transition hover:bg-[var(--muted)]"
              >
                <Pencil size={14} />
                Edit Task
              </button>

              <button
                onClick={() => openDeleteConfirmModal(selectedTask)}
                className="inline-flex items-center gap-2 rounded-2xl border border-[var(--danger-soft-border)] bg-[var(--danger-soft-bg)] px-4 py-2 text-sm font-semibold text-[var(--danger-soft-text)] transition hover:opacity-80"
              >
                <Trash2 size={14} />
                Delete Task
              </button>

              <button
                onClick={closeTaskDetailModal}
                className="rounded-2xl bg-[var(--primary-btn-bg)] px-4 py-2 text-sm font-semibold text-[var(--primary-btn-text)] transition hover:opacity-90"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && taskToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-[var(--line-soft)] bg-[var(--surface-solid)] p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--danger-soft-border)] bg-[var(--danger-soft-bg)] text-[var(--danger-soft-text)]">
                  <AlertTriangle size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[var(--text-main)]">
                    Delete Task?
                  </h2>
                  <p className="mt-1 text-sm text-[var(--text-muted-2)]">
                    This action cannot be undone in the current workspace state.
                  </p>
                </div>
              </div>

              <button
                onClick={closeDeleteConfirmModal}
                className="rounded-xl border border-[var(--line-soft)] p-2 text-[var(--text-main)] transition hover:bg-[var(--muted)]"
                aria-label="Close delete confirmation modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-2xl border border-[var(--danger-soft-border)] bg-[var(--danger-soft-bg)] p-4">
              <p className="text-sm text-[var(--text-muted-2)]">
                You are about to delete:
              </p>
              <p className="mt-2 font-semibold text-[var(--text-main)]">
                {taskToDelete.title}
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted-2)]">
                Assignee: {taskToDelete.assignee}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                onClick={closeDeleteConfirmModal}
                className="rounded-2xl border border-[var(--line-soft)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] transition hover:bg-[var(--muted)]"
              >
                Cancel
              </button>

              <button
                onClick={() => handleDeleteTask(taskToDelete.id)}
                className="rounded-2xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddMilestoneOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-[var(--line-soft)] bg-[var(--surface-solid)] p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-main)]">
                  Create Milestone
                </h2>
                <p className="mt-1 text-sm text-[var(--text-muted-2)]">
                  Add a major project phase and link tasks to it
                </p>
              </div>

              <button
                onClick={closeAddMilestoneModal}
                className="rounded-xl border border-[var(--line-soft)] p-2 text-[var(--text-main)] transition hover:bg-[var(--muted)]"
                aria-label="Close milestone modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMilestone} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--text-main)]">
                  Milestone Title
                </label>
                <input
                  type="text"
                  value={milestoneTitle}
                  onChange={(e) => setMilestoneTitle(e.target.value)}
                  placeholder="Ex: Workspace MVP"
                  className="w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--field-focus)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--text-main)]">
                  Description
                </label>
                <textarea
                  value={milestoneDescription}
                  onChange={(e) => setMilestoneDescription(e.target.value)}
                  rows={4}
                  placeholder="Ex: Complete core workspace features for startup collaboration"
                  className="w-full resize-none rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--field-focus)]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--text-main)]">
                    Owner
                  </label>
                  <select
                    value={milestoneOwner}
                    onChange={(e) => setMilestoneOwner(e.target.value)}
                    className="w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--field-focus)]"
                  >
                    {projectState.team.map((member) => (
                      <option key={member.id} value={member.name}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--text-main)]">
                    Priority
                  </label>
                  <select
                    value={milestonePriority}
                    onChange={(e) =>
                      setMilestonePriority(e.target.value as MilestonePriority)
                    }
                    className="w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--field-focus)]"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--text-main)]">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={milestoneDueDate}
                    onChange={(e) => setMilestoneDueDate(e.target.value)}
                    className="w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--field-focus)]"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-sm font-semibold text-[var(--text-main)]">
                    Link Tasks
                  </label>
                  <span className="text-xs font-medium text-[var(--text-muted-2)]">
                    {milestoneLinkedTaskIds.length} selected
                  </span>
                </div>

                <div className="max-h-72 space-y-3 overflow-y-auto rounded-2xl border border-[var(--line-soft)] bg-[var(--muted)] p-3">
                  {projectState.tasks.length === 0 ? (
                    <div className="rounded-xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-4 text-sm text-[var(--text-muted-2)]">
                      No tasks available to link yet.
                    </div>
                  ) : (
                    projectState.tasks.map((task) => (
                      <label
                        key={task.id}
                        className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-4 transition hover:bg-[var(--muted)]"
                      >
                        <input
                          type="checkbox"
                          checked={milestoneLinkedTaskIds.includes(task.id)}
                          onChange={() => toggleMilestoneTask(task.id)}
                          className="mt-1 h-4 w-4 rounded border-[var(--line-soft)]"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-[var(--text-main)]">
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
                          <p className="mt-1 text-xs text-[var(--text-muted-2)]">
                            {task.assignee} • {task.dueDate}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {milestoneError ? (
                <div className="rounded-2xl border border-[var(--danger-soft-border)] bg-[var(--danger-soft-bg)] px-4 py-3 text-sm text-[var(--danger-soft-text)]">
                  {milestoneError}
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAddMilestoneModal}
                  className="rounded-2xl border border-[var(--line-soft)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] transition hover:bg-[var(--muted)]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-2xl bg-[var(--primary-btn-bg)] px-5 py-2 text-sm font-semibold text-[var(--primary-btn-text)] transition hover:opacity-90"
                >
                  Create Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditMilestoneOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-[var(--line-soft)] bg-[var(--surface-solid)] p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-main)]">
                  Edit Milestone
                </h2>
                <p className="mt-1 text-sm text-[var(--text-muted-2)]">
                  Update milestone details and linked tasks
                </p>
              </div>

              <button
                onClick={closeEditMilestoneModal}
                className="rounded-xl border border-[var(--line-soft)] p-2 text-[var(--text-main)] transition hover:bg-[var(--muted)]"
                aria-label="Close edit milestone modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditMilestone} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--text-main)]">
                  Milestone Title
                </label>
                <input
                  type="text"
                  value={editMilestoneTitle}
                  onChange={(e) => setEditMilestoneTitle(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--field-focus)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--text-main)]">
                  Description
                </label>
                <textarea
                  value={editMilestoneDescription}
                  onChange={(e) => setEditMilestoneDescription(e.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--field-focus)]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--text-main)]">
                    Owner
                  </label>
                  <select
                    value={editMilestoneOwner}
                    onChange={(e) => setEditMilestoneOwner(e.target.value)}
                    className="w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--field-focus)]"
                  >
                    {projectState.team.map((member) => (
                      <option key={member.id} value={member.name}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--text-main)]">
                    Priority
                  </label>
                  <select
                    value={editMilestonePriority}
                    onChange={(e) =>
                      setEditMilestonePriority(e.target.value as MilestonePriority)
                    }
                    className="w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--field-focus)]"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--text-main)]">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={editMilestoneDueDate}
                    onChange={(e) => setEditMilestoneDueDate(e.target.value)}
                    className="w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--field-focus)]"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-sm font-semibold text-[var(--text-main)]">
                    Linked Tasks
                  </label>
                  <span className="text-xs font-medium text-[var(--text-muted-2)]">
                    {editMilestoneLinkedTaskIds.length} selected
                  </span>
                </div>

                <div className="max-h-72 space-y-3 overflow-y-auto rounded-2xl border border-[var(--line-soft)] bg-[var(--muted)] p-3">
                  {projectState.tasks.length === 0 ? (
                    <div className="rounded-xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-4 text-sm text-[var(--text-muted-2)]">
                      No tasks available to link yet.
                    </div>
                  ) : (
                    projectState.tasks.map((task) => (
                      <label
                        key={task.id}
                        className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-4 transition hover:bg-[var(--muted)]"
                      >
                        <input
                          type="checkbox"
                          checked={editMilestoneLinkedTaskIds.includes(task.id)}
                          onChange={() => toggleEditMilestoneTask(task.id)}
                          className="mt-1 h-4 w-4 rounded border-[var(--line-soft)]"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-[var(--text-main)]">
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
                          <p className="mt-1 text-xs text-[var(--text-muted-2)]">
                            {task.assignee} • {task.dueDate}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {editMilestoneError ? (
                <div className="rounded-2xl border border-[var(--danger-soft-border)] bg-[var(--danger-soft-bg)] px-4 py-3 text-sm text-[var(--danger-soft-text)]">
                  {editMilestoneError}
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditMilestoneModal}
                  className="rounded-2xl border border-[var(--line-soft)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] transition hover:bg-[var(--muted)]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-2xl bg-[var(--primary-btn-bg)] px-5 py-2 text-sm font-semibold text-[var(--primary-btn-text)] transition hover:opacity-90"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteMilestoneOpen && milestoneToDelete && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-[var(--line-soft)] bg-[var(--surface-solid)] p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--danger-soft-border)] bg-[var(--danger-soft-bg)] text-[var(--danger-soft-text)]">
                  <AlertTriangle size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[var(--text-main)]">
                    Delete Milestone?
                  </h2>
                  <p className="mt-1 text-sm text-[var(--text-muted-2)]">
                    This will remove the milestone from the roadmap.
                  </p>
                </div>
              </div>

              <button
                onClick={closeDeleteMilestoneModal}
                className="rounded-xl border border-[var(--line-soft)] p-2 text-[var(--text-main)] transition hover:bg-[var(--muted)]"
                aria-label="Close delete milestone confirmation modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-2xl border border-[var(--danger-soft-border)] bg-[var(--danger-soft-bg)] p-4">
              <p className="text-sm text-[var(--text-muted-2)]">
                You are about to delete:
              </p>
              <p className="mt-2 font-semibold text-[var(--text-main)]">
                {milestoneToDelete.title}
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted-2)]">
                Owner: {milestoneToDelete.owner}
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted-2)]">
                Linked tasks: {milestoneToDelete.linkedTaskIds.length}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                onClick={closeDeleteMilestoneModal}
                className="rounded-2xl border border-[var(--line-soft)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] transition hover:bg-[var(--muted)]"
              >
                Cancel
              </button>

              <button
                onClick={() => handleDeleteMilestone(milestoneToDelete.id)}
                className="rounded-2xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
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