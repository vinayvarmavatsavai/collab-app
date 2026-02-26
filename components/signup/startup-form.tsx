"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CreatableCombobox } from "@/components/creatable-combobox"
import { TimezoneSelect } from "@/components/signup/timezone-select"
import { useState } from "react"

const DOMAIN_OPTIONS = [
  "Artificial Intelligence",
  "Fintech",
  "HealthTech",
  "EdTech",
  "CleanTech",
  "E-Commerce",
  "SaaS",
  "Cybersecurity",
  "Blockchain",
  "AgriTech",
  "IoT",
  "Robotics",
  "Gaming",
  "Social Media",
  "Logistics & Supply Chain",
]

export function StartupForm() {
  const [timezone, setTimezone] = useState("")
  const [domains, setDomains] = useState<string[]>([])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="startup-name" className="text-foreground">Startup Name</Label>
        <Input
          id="startup-name"
          type="text"
          placeholder="Acme Inc."
          className="bg-card"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="startup-email" className="text-foreground">Email</Label>
        <Input
          id="startup-email"
          type="email"
          placeholder="you@startup.com"
          className="bg-card"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="startup-password" className="text-foreground">Password</Label>
        <Input
          id="startup-password"
          type="password"
          placeholder="Create a strong password"
          className="bg-card"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="startup-cin" className="text-foreground">
          Corporate Identification Number (CIN)
        </Label>
        <Input
          id="startup-cin"
          type="text"
          placeholder="e.g. U12345AB6789CDE012345"
          className="bg-card"
        />
      </div>

      <TimezoneSelect value={timezone} onChange={setTimezone} />

      <div className="flex flex-col gap-2">
        <Label className="text-foreground">
          Primary Domain
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            (up to 3)
          </span>
        </Label>
        <CreatableCombobox
          options={DOMAIN_OPTIONS}
          selected={domains}
          onChange={setDomains}
          placeholder="Select or create domains..."
          maxItems={3}
          multi
        />
      </div>
    </div>
  )
}
