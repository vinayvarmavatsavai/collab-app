import Image from "next/image";

export type ProjectMilestone = {
  id: string | number;
  title: string;
  description?: string;
  date?: string;
  dueDate?: string;
  images?: string[];
  avatars?: string[];
};

type MilestoneNodeState = "completed" | "active" | "upcoming";

function getMilestoneDateText(input?: string) {
  if (!input) {
    return {
      month: "TBD",
      day: "--",
      year: "----",
    };
  }

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return {
      month: "TBD",
      day: "--",
      year: "----",
    };
  }

  return {
    month: parsed.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day: String(parsed.getDate()).padStart(2, "0"),
    year: String(parsed.getFullYear()),
  };
}

function toTimestamp(value?: string) {
  if (!value) return Number.POSITIVE_INFINITY;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return Number.POSITIVE_INFINITY;
  return parsed.getTime();
}

function getNodeStates(sortedMilestones: Array<ProjectMilestone & { timelineDate: string }>) {
  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  const firstFutureOrTodayIndex = sortedMilestones.findIndex(
    (milestone) => toTimestamp(milestone.timelineDate) >= todayOnly,
  );

  return sortedMilestones.map((_, index): MilestoneNodeState => {
    if (firstFutureOrTodayIndex === -1) return "completed";
    if (index < firstFutureOrTodayIndex) return "completed";
    if (index === firstFutureOrTodayIndex) return "active";
    return "upcoming";
  });
}

function getNodeClassName(state: MilestoneNodeState) {
  if (state === "upcoming") {
    return "border-[var(--line-soft)] bg-[var(--muted)]";
  }

  return "border-[var(--surface-solid)] bg-[var(--primary)]";
}

function MilestoneCard<TMilestone extends ProjectMilestone>({
  milestone,
  datePosition,
  isLeftColumn,
  onEdit,
  onDelete,
}: {
  milestone: TMilestone & { timelineDate: string };
  datePosition: "start" | "end";
  isLeftColumn: boolean;
  onEdit?: (milestone: TMilestone) => void;
  onDelete?: (milestone: TMilestone) => void;
}) {
  const dateText = getMilestoneDateText(milestone.timelineDate);
  const safeImages = Array.isArray(milestone.images) ? milestone.images.slice(0, 4) : [];
  const safeAvatars = Array.isArray(milestone.avatars) ? milestone.avatars.slice(0, 4) : [];

  return (
    <div className="relative rounded-[28px] border border-[var(--line-soft)] bg-[var(--surface-solid)] p-4 shadow-sm sm:p-5">
      <div
        className={`absolute top-1/2 hidden h-3 w-3 -translate-y-1/2 rotate-45 border border-[var(--line-soft)] bg-[var(--surface-solid)] md:block ${
          isLeftColumn ? "-right-1.5" : "-left-1.5"
        }`}
      />

      <div className="absolute left-[-22px] top-1/2 h-px w-[22px] -translate-y-1/2 bg-[var(--line-soft)] md:hidden" />

      <div className="flex min-w-0 flex-row items-stretch gap-4 max-[420px]:flex-col">
        {datePosition === "start" ? (
          <>
            <div className="w-20 shrink-0 self-stretch rounded-2xl border border-[var(--line-soft)] bg-[var(--muted)] px-3 py-2 text-left max-[420px]:w-full max-[420px]:text-center">
              <p className="text-[10px] font-semibold tracking-[0.16em] text-[var(--text-muted-2)]">
                {dateText.month}
              </p>
              <p className="mt-1 text-2xl font-bold leading-none text-[var(--text-main)]">
                {dateText.day}
              </p>
              <p className="mt-1 text-xs font-medium text-[var(--text-muted-2)]">
                {dateText.year}
              </p>
            </div>
            <div className="w-px self-stretch bg-[var(--line-soft)] max-[420px]:h-px max-[420px]:w-full" />
          </>
        ) : null}

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-[var(--text-main)] sm:text-lg">
            {milestone.title}
          </h3>

          <p className="mt-2 text-sm leading-6 text-[var(--text-muted-2)]">
            {milestone.description || "No description provided."}
          </p>

          {(safeImages.length > 0 || safeAvatars.length > 0) && (
            <div className="mt-4 flex flex-wrap items-center gap-4">
              {safeImages.length > 0 && (
                <div className="flex items-center">
                  {safeImages.map((imageUrl, index) => (
                    <div
                      key={`${String(milestone.id)}-image-${index}`}
                      className={`relative h-8 w-8 overflow-hidden rounded-md border border-[var(--surface-solid)] ${
                        index > 0 ? "-ml-2" : ""
                      }`}
                    >
                      <Image
                        src={imageUrl}
                        alt={`${milestone.title} media ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    </div>
                  ))}
                </div>
              )}

              {safeAvatars.length > 0 && (
                <div className="flex items-center">
                  {safeAvatars.map((avatarUrl, index) => (
                    <div
                      key={`${String(milestone.id)}-avatar-${index}`}
                      className={`relative h-8 w-8 overflow-hidden rounded-full border border-[var(--surface-solid)] ${
                        index > 0 ? "-ml-2" : ""
                      }`}
                    >
                      <Image
                        src={avatarUrl}
                        alt={`${milestone.title} member ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(onEdit || onDelete) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(milestone)}
                  className="rounded-xl border border-[var(--line-soft)] bg-[var(--muted)] px-3 py-1.5 text-xs font-medium text-[var(--text-main)] transition hover:opacity-80"
                >
                  Edit
                </button>
              )}

              {onDelete && (
                <button
                  onClick={() => onDelete(milestone)}
                  className="rounded-xl border border-[var(--danger-soft-border)] bg-[var(--danger-soft-bg)] px-3 py-1.5 text-xs font-medium text-[var(--danger-soft-text)] transition hover:opacity-80"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>

        {datePosition === "end" ? (
          <>
            <div className="w-px self-stretch bg-[var(--line-soft)] max-[420px]:h-px max-[420px]:w-full" />
            <div className="w-20 shrink-0 self-stretch rounded-2xl border border-[var(--line-soft)] bg-[var(--muted)] px-3 py-2 text-right max-[420px]:w-full max-[420px]:text-center">
              <p className="text-[10px] font-semibold tracking-[0.16em] text-[var(--text-muted-2)]">
                {dateText.month}
              </p>
              <p className="mt-1 text-2xl font-bold leading-none text-[var(--text-main)]">
                {dateText.day}
              </p>
              <p className="mt-1 text-xs font-medium text-[var(--text-muted-2)]">
                {dateText.year}
              </p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function ProjectMilestones<TMilestone extends ProjectMilestone>({
  milestones,
  onEdit,
  onDelete,
}: {
  milestones: TMilestone[];
  onEdit?: (milestone: TMilestone) => void;
  onDelete?: (milestone: TMilestone) => void;
}) {
  const safeMilestones = Array.isArray(milestones) ? milestones : [];

  const sortedMilestones = [...safeMilestones]
    .map((milestone) => ({
      ...milestone,
      timelineDate: milestone.date || milestone.dueDate || "",
    }))
    .sort((a, b) => toTimestamp(a.timelineDate) - toTimestamp(b.timelineDate));

  const nodeStates = getNodeStates(sortedMilestones);

  return (
    <div className="relative">
      <div className="absolute bottom-0 left-[14px] top-0 w-px bg-[var(--line-soft)] md:left-1/2 md:-translate-x-1/2" />

      <div className="space-y-7">
        {sortedMilestones.map((milestone, index) => {
          const isLeftColumn = index % 2 === 0;
          const state = nodeStates[index] || "upcoming";

          return (
            <div key={milestone.id} className="relative md:grid md:grid-cols-2 md:gap-12">
              <div className="absolute left-[14px] top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 md:left-1/2 md:translate-x-[-50%]">
                <div className={`h-full w-full rounded-full ${getNodeClassName(state)}`} />
              </div>

              <div className={`ml-8 md:ml-0 ${isLeftColumn ? "md:col-start-1" : "md:col-start-2"}`}>
                <div
                  className={`relative ${
                    isLeftColumn
                      ? "md:after:absolute md:after:right-[-3rem] md:after:top-1/2 md:after:h-px md:after:w-12 md:after:-translate-y-1/2 md:after:bg-[var(--line-soft)]"
                      : "md:after:absolute md:after:left-[-3rem] md:after:top-1/2 md:after:h-px md:after:w-12 md:after:-translate-y-1/2 md:after:bg-[var(--line-soft)]"
                  }`}
                >
                  <MilestoneCard
                    milestone={milestone}
                    datePosition={isLeftColumn ? "end" : "start"}
                    isLeftColumn={isLeftColumn}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}