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
  "SaaS",
]

const ROLE_TYPES = ["Investor", "Mentor", "Accelerator", "Research organization", "Other"]

export function EcosystemForm() {
  const [roleType, setRoleType] = useState("")
  const [timezone, setTimezone] = useState("")
  const [domain, setDomain] = useState<string[]>([])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="eco-name" className="text-sm font-medium">Manager Name</label>
        <input id="eco-name" type="text" placeholder="Full name" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="eco-email" className="text-sm font-medium">Manager Email</label>
        <input id="eco-email" type="email" placeholder="manager@organization.com" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="eco-password" className="text-sm font-medium">Password</label>
        <input id="eco-password" type="password" placeholder="Create a strong password" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="eco-role-type" className="text-sm font-medium">Role Type</label>
        <select
          id="eco-role-type"
          value={roleType}
          onChange={(e) => setRoleType(e.target.value)}
          className="h-10 rounded-md border border-slate-300 px-3 text-sm"
        >
          <option value="">Select your role type</option>
          {ROLE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <TimezoneSelect value={timezone} onChange={setTimezone} />

      <div className="flex flex-col gap-2">
        <label htmlFor="eco-reg" className="text-sm font-medium">Registration Number</label>
        <input id="eco-reg" type="text" placeholder="e.g. REG-2024-00001" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Primary Domain</label>
        <CreatableCombobox
          options={DOMAIN_OPTIONS}
          selected={domain}
          onChange={setDomain}
          placeholder="Select or create a domain..."
          multi={false}
        />
      </div>
    </div>
  )
}
