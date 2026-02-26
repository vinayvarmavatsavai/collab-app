"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  "Deep Tech",
  "Impact & Social Enterprise",
  "Sustainability",
  "Enterprise Software",
  "Consumer Tech",
]

const ROLE_TYPES = [
  "Investor",
  "Mentor",
  "Accelerator",
  "Research organization",
  "Other",
]

export function EcosystemForm() {
  const [roleType, setRoleType] = useState("")
  const [timezone, setTimezone] = useState("")
  const [domain, setDomain] = useState<string[]>([])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="eco-name" className="text-foreground">Manager Name</Label>
        <Input
          id="eco-name"
          type="text"
          placeholder="Full name"
          className="bg-card"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="eco-email" className="text-foreground">Manager Email</Label>
        <Input
          id="eco-email"
          type="email"
          placeholder="manager@organization.com"
          className="bg-card"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="eco-password" className="text-foreground">Password</Label>
        <Input
          id="eco-password"
          type="password"
          placeholder="Create a strong password"
          className="bg-card"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="eco-role-type" className="text-foreground">Role Type</Label>
        <Select value={roleType} onValueChange={setRoleType}>
          <SelectTrigger id="eco-role-type" className="w-full bg-card text-foreground">
            <SelectValue placeholder="Select your role type" />
          </SelectTrigger>
          <SelectContent>
            {ROLE_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TimezoneSelect value={timezone} onChange={setTimezone} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="eco-reg" className="text-foreground">Registration Number</Label>
        <Input
          id="eco-reg"
          type="text"
          placeholder="e.g. REG-2024-00001"
          className="bg-card"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-foreground">Primary Domain</Label>
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
