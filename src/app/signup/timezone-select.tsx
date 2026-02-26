"use client"

const TIMEZONES = [
  { value: "UTC-12:00", label: "(UTC-12:00) Baker Island" },
  { value: "UTC-11:00", label: "(UTC-11:00) American Samoa" },
  { value: "UTC-10:00", label: "(UTC-10:00) Hawaii" },
  { value: "UTC-09:00", label: "(UTC-09:00) Alaska" },
  { value: "UTC-08:00", label: "(UTC-08:00) Pacific Time" },
  { value: "UTC-07:00", label: "(UTC-07:00) Mountain Time" },
  { value: "UTC-06:00", label: "(UTC-06:00) Central Time" },
  { value: "UTC-05:00", label: "(UTC-05:00) Eastern Time" },
  { value: "UTC+00:00", label: "(UTC+00:00) London, Dublin" },
  { value: "UTC+05:30", label: "(UTC+05:30) Mumbai, New Delhi" },
  { value: "UTC+09:00", label: "(UTC+09:00) Tokyo, Seoul" },
]

interface TimezoneSelectProps {
  value: string
  onChange: (value: string) => void
}

export function TimezoneSelect({ value, onChange }: TimezoneSelectProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="timezone" className="text-sm font-medium text-foreground">
        Time Zone
      </label>
      <select
        id="timezone"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
      >
        <option value="">Select your time zone</option>
        {TIMEZONES.map((tz) => (
          <option key={tz.value} value={tz.value}>
            {tz.label}
          </option>
        ))}
      </select>
    </div>
  )
}
