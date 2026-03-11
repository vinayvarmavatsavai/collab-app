import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/ui/select";
import { mockProviders } from "@/app/project/mock/mockProviders";

export function MeetingProviderSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (provider: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Choose provider" />
      </SelectTrigger>
      <SelectContent>
        {mockProviders.map((provider) => (
          <SelectItem key={provider} value={provider}>
            {provider}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
