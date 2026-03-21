"use client"

import { useState } from "react"
import { CreatableCombobox } from "@/components/creatable-combobox"
import { TimezoneSelect } from "@/components/signup/timezone-select"

const DOMAIN_OPTIONS = [
  "Artificial Intelligence",
  "Machine Learning",
  "Web Development",
  "Mobile Development",
  "Data Science",
  "Cloud Computing",
]

const INTENT_OPTIONS = [
  "Looking to collaborate",
  "Looking to contribute",
  "Looking to explore opportunities",
]

export function StudentForm() {
  const [timezone, setTimezone] = useState("")
  const [domains, setDomains] = useState<string[]>([])
  const [intent, setIntent] = useState<string[]>([])
  const [timeCommitment, setTimeCommitment] = useState("")

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="student-first" className="text-sm font-medium">First Name</label>
          <input id="student-first" type="text" placeholder="Jane" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="student-last" className="text-sm font-medium">Last Name</label>
          <input id="student-last" type="text" placeholder="Doe" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="student-email" className="text-sm font-medium">Email</label>
        <input id="student-email" type="email" placeholder="you@university.edu" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="student-password" className="text-sm font-medium">Password</label>
        <input id="student-password" type="password" placeholder="Create a strong password" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
      </div>

      <TimezoneSelect value={timezone} onChange={setTimezone} />

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Primary Working Domains <span className="text-xs font-normal text-muted-foreground">(up to 5)</span></label>
        <CreatableCombobox
          options={DOMAIN_OPTIONS}
          selected={domains}
          onChange={setDomains}
          placeholder="Select or create domains..."
          maxItems={5}
          multi
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Intent</label>
        <CreatableCombobox
          options={INTENT_OPTIONS}
          selected={intent}
          onChange={setIntent}
          placeholder="What brings you here?"
          multi={false}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="time-commitment" className="text-sm font-medium">Time Commitment</label>
        <select
          id="time-commitment"
          value={timeCommitment}
          onChange={(e) => setTimeCommitment(e.target.value)}
          className="h-10 rounded-md border border-slate-300 px-3 text-sm"
        >
          <option value="">Select hours</option>
          <option value="lt5">Less than 5 hours a week</option>
          <option value="5-10">5-10 hours a week</option>
          <option value="10+">10+ hours a week</option>
        </select>
      </div>
    </div>
  )
}
