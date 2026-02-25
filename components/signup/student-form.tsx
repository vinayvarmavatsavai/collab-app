"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CreatableCombobox } from "@/components/creatable-combobox"
import { TimezoneSelect } from "@/components/signup/timezone-select"
import { useState } from "react"

const DOMAIN_OPTIONS = [
  "Artificial Intelligence",
  "Machine Learning",
  "Web Development",
  "Mobile Development",
  "Data Science",
  "Cloud Computing",
  "Cybersecurity",
  "UI/UX Design",
  "Product Management",
  "Digital Marketing",
  "Blockchain",
  "IoT",
  "Robotics",
  "Sustainability",
  "Biotech",
]

const INTENT_OPTIONS = [
  "Looking to collaborate",
  "Looking to contribute",
  "Looking to explore opportunities",
  "Looking to advise / mentor",
  "Looking for feedback",
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
          <Label htmlFor="student-first" className="text-foreground">First Name</Label>
          <Input
            id="student-first"
            type="text"
            placeholder="Jane"
            className="bg-card"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="student-last" className="text-foreground">Last Name</Label>
          <Input
            id="student-last"
            type="text"
            placeholder="Doe"
            className="bg-card"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="student-email" className="text-foreground">Email</Label>
        <Input
          id="student-email"
          type="email"
          placeholder="you@university.edu"
          className="bg-card"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="student-password" className="text-foreground">Password</Label>
        <Input
          id="student-password"
          type="password"
          placeholder="Create a strong password"
          className="bg-card"
        />
      </div>

      <TimezoneSelect value={timezone} onChange={setTimezone} />

      <div className="flex flex-col gap-2">
        <Label className="text-foreground">
          Primary Working Domains
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            (up to 5)
          </span>
        </Label>
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
        <Label className="text-foreground">Intent</Label>
        <CreatableCombobox
          options={INTENT_OPTIONS}
          selected={intent}
          onChange={setIntent}
          placeholder="What brings you here?"
          multi={false}
        />
      </div>

      <div className="flex flex-col gap-3">
        <Label className="text-foreground">Time Commitment</Label>
        <RadioGroup
          value={timeCommitment}
          onValueChange={setTimeCommitment}
          className="flex flex-col gap-3"
        >
          {[
            { value: "lt5", label: "Less than 5 hours a week" },
            { value: "5-10", label: "5\u201310 hours a week" },
            { value: "10+", label: "10+ hours a week" },
          ].map((option) => (
            <div key={option.value} className="flex items-center gap-3">
              <RadioGroupItem value={option.value} id={`time-${option.value}`} />
              <Label
                htmlFor={`time-${option.value}`}
                className="cursor-pointer font-normal text-foreground"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  )
}
