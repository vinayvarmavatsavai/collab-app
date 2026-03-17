import type { AvailabilitySlot } from "@/app/projects/mock/mockAvailability";
import { Button } from "@/app/ui/button";

export function AvailabilityGrid({
  slots,
  selectedSlotId,
  onSelect,
}: {
  slots: AvailabilitySlot[];
  selectedSlotId: string | null;
  onSelect: (slot: AvailabilitySlot) => void;
}) {
  if (slots.length === 0) {
    return <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No slots for this day.</div>;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {slots.map((slot) => {
        const active = selectedSlotId === slot.id;
        return (
          <Button
            key={slot.id}
            variant={active ? "default" : "outline"}
            className="justify-start"
            onClick={() => onSelect(slot)}
          >
            {slot.timeLabel}
          </Button>
        );
      })}
    </div>
  );
}
