"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

const TIMEZONES = [
  { value: "UTC-12:00", label: "(UTC-12:00) Baker Island" },
  { value: "UTC-11:00", label: "(UTC-11:00) American Samoa" },
  { value: "UTC-10:00", label: "(UTC-10:00) Hawaii" },
  { value: "UTC-09:00", label: "(UTC-09:00) Alaska" },
  { value: "UTC-08:00", label: "(UTC-08:00) Pacific Time" },
  { value: "UTC-07:00", label: "(UTC-07:00) Mountain Time" },
  { value: "UTC-06:00", label: "(UTC-06:00) Central Time" },
  { value: "UTC-05:00", label: "(UTC-05:00) Eastern Time" },
  { value: "UTC-04:00", label: "(UTC-04:00) Atlantic Time" },
  { value: "UTC-03:00", label: "(UTC-03:00) Buenos Aires" },
  { value: "UTC-02:00", label: "(UTC-02:00) Mid-Atlantic" },
  { value: "UTC-01:00", label: "(UTC-01:00) Azores" },
  { value: "UTC+00:00", label: "(UTC+00:00) London, Dublin" },
  { value: "UTC+01:00", label: "(UTC+01:00) Berlin, Paris" },
  { value: "UTC+02:00", label: "(UTC+02:00) Cairo, Helsinki" },
  { value: "UTC+03:00", label: "(UTC+03:00) Moscow, Nairobi" },
  { value: "UTC+04:00", label: "(UTC+04:00) Dubai" },
  { value: "UTC+05:00", label: "(UTC+05:00) Karachi" },
  { value: "UTC+05:30", label: "(UTC+05:30) Mumbai, New Delhi" },
  { value: "UTC+06:00", label: "(UTC+06:00) Dhaka" },
  { value: "UTC+07:00", label: "(UTC+07:00) Bangkok, Jakarta" },
  { value: "UTC+08:00", label: "(UTC+08:00) Singapore, Beijing" },
  { value: "UTC+09:00", label: "(UTC+09:00) Tokyo, Seoul" },
  { value: "UTC+09:30", label: "(UTC+09:30) Adelaide" },
  { value: "UTC+10:00", label: "(UTC+10:00) Sydney, Melbourne" },
  { value: "UTC+11:00", label: "(UTC+11:00) Solomon Islands" },
  { value: "UTC+12:00", label: "(UTC+12:00) Auckland, Fiji" },
]

interface TimezoneSelectProps {
  value: string
  onChange: (value: string) => void
}

export function TimezoneSelect({ value, onChange }: TimezoneSelectProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="timezone" className="text-foreground">Time Zone</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="timezone" className="w-full bg-card text-foreground">
          <SelectValue placeholder="Select your time zone" />
        </SelectTrigger>
        <SelectContent>
          {TIMEZONES.map((tz) => (
            <SelectItem key={tz.value} value={tz.value}>
              {tz.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
