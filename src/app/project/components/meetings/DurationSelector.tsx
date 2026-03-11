import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/ui/select";

const hoursOptions = Array.from({ length: 13 }, (_, hour) => hour);
const minuteOptions = [0, 15, 30, 45];

export function DurationSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const selectedHours = Math.min(12, Math.floor(value / 60));
  const selectedMinutes = value % 60;

  const update = (hours: number, minutes: number) => {
    const total = hours * 60 + minutes;
    onChange(total === 0 ? 15 : total);
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <Select
        value={String(selectedHours)}
        onValueChange={(next: string) => update(Number(next), selectedMinutes)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Hours" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {hoursOptions.map((hours) => (
            <SelectItem key={hours} value={String(hours)}>
              {hours}h
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={String(selectedMinutes)}
        onValueChange={(next: string) => update(selectedHours, Number(next))}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Minutes" />
        </SelectTrigger>
        <SelectContent>
          {minuteOptions.map((minutes) => (
            <SelectItem key={minutes} value={String(minutes)}>
              {minutes}m
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
