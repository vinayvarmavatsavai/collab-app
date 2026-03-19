import { Input } from "@/app/ui/input";

export function TimePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <Input type="time" value={value} onChange={(event) => onChange(event.target.value)} />;
}
