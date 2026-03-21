"use client"

import { useState } from "react"
import { CreatableCombobox } from "@/components/creatable-combobox"
import { TimezoneSelect } from "@/components/signup/timezone-select"

const DOMAIN_OPTIONS = [
  "Artificial Intelligence",
  "Fintech",
  "HealthTech",
  "EdTech",
  "CleanTech",
  "E-Commerce",
  "SaaS",
  "Cybersecurity",
]

export function StartupForm() {
  const [timezone, setTimezone] = useState("")
  const [domains, setDomains] = useState<string[]>([])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="startup-name" className="text-sm font-medium">Startup Name</label>
        <input id="startup-name" type="text" placeholder="Acme Inc." className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="startup-email" className="text-sm font-medium">Email</label>
        <input id="startup-email" type="email" placeholder="you@startup.com" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="startup-password" className="text-sm font-medium">Password</label>
        <input id="startup-password" type="password" placeholder="Create a strong password" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="startup-cin" className="text-sm font-medium">Corporate Identification Number (CIN)</label>
        <input id="startup-cin" type="text" placeholder="e.g. U12345AB6789CDE012345" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
      </div>

      <TimezoneSelect value={timezone} onChange={setTimezone} />

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Primary Domain <span className="text-xs font-normal text-muted-foreground">(up to 3)</span></label>
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
