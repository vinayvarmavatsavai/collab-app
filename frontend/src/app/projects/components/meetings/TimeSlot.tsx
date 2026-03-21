export function TimeSlot({
  timeLabel,
  onSelect,
}: {
  timeLabel: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="h-12 w-full border-t px-2 text-left text-xs text-muted-foreground hover:bg-accent"
      aria-label={`Create meeting at ${timeLabel}`}
    >
      <span className="opacity-0">{timeLabel}</span>
    </button>
  );
}
