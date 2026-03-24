"use client";

import { CreatableCombobox } from "@/components/creatable-combobox";
import { TimezoneSelect } from "@/components/signup/timezone-select";
import type { SignupFormData } from "@/components/signup/signup-types";

const DOMAIN_OPTIONS = [
  "Artificial Intelligence",
  "Fintech",
  "HealthTech",
  "EdTech",
  "CleanTech",
  "SaaS",
];

const ROLE_TYPES = [
  "Investor",
  "Mentor",
  "Accelerator",
  "Research organization",
  "Other",
];

interface EcosystemFormProps {
  data: SignupFormData;
  onChange: (field: keyof SignupFormData, value: string | string[]) => void;
}

export function EcosystemForm({ data, onChange }: EcosystemFormProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="eco-first" className="text-sm font-medium">
            First Name
          </label>
          <input
            id="eco-first"
            type="text"
            value={data.firstname}
            onChange={(e) => onChange("firstname", e.target.value)}
            placeholder="John"
            className="h-11 rounded-md border border-slate-300 px-3 text-sm"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="eco-last" className="text-sm font-medium">
            Last Name
          </label>
          <input
            id="eco-last"
            type="text"
            value={data.lastname}
            onChange={(e) => onChange("lastname", e.target.value)}
            placeholder="Doe"
            className="h-11 rounded-md border border-slate-300 px-3 text-sm"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="eco-username" className="text-sm font-medium">
          Username
        </label>
        <input
          id="eco-username"
          type="text"
          value={data.username}
          onChange={(e) => onChange("username", e.target.value)}
          placeholder="mentorjohn"
          className="h-11 rounded-md border border-slate-300 px-3 text-sm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="eco-email" className="text-sm font-medium">
          Manager Email
        </label>
        <input
          id="eco-email"
          type="email"
          value={data.email}
          onChange={(e) => onChange("email", e.target.value)}
          placeholder="manager@organization.com"
          className="h-11 rounded-md border border-slate-300 px-3 text-sm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="eco-phone" className="text-sm font-medium">
          Phone
        </label>
        <input
          id="eco-phone"
          type="tel"
          value={data.phone}
          onChange={(e) => onChange("phone", e.target.value)}
          placeholder="+91 9876543210"
          className="h-11 rounded-md border border-slate-300 px-3 text-sm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="eco-password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="eco-password"
          type="password"
          value={data.password}
          onChange={(e) => onChange("password", e.target.value)}
          placeholder="Create a strong password"
          className="h-11 rounded-md border border-slate-300 px-3 text-sm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="eco-role-type" className="text-sm font-medium">
          Role Type
        </label>
        <select
          id="eco-role-type"
          value={data.managerRoleType}
          onChange={(e) => onChange("managerRoleType", e.target.value)}
          className="h-11 rounded-md border border-slate-300 px-3 text-sm"
        >
          <option value="">Select your role type</option>
          {ROLE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <TimezoneSelect
        value={data.timezone}
        onChange={(value) => onChange("timezone", value)}
      />

      <div className="flex flex-col gap-2">
        <label htmlFor="eco-reg" className="text-sm font-medium">
          Registration Number
        </label>
        <input
          id="eco-reg"
          type="text"
          value={data.registrationNumber}
          onChange={(e) => onChange("registrationNumber", e.target.value)}
          placeholder="e.g. REG-2024-00001"
          className="h-11 rounded-md border border-slate-300 px-3 text-sm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Primary Domain</label>
        <CreatableCombobox
          options={DOMAIN_OPTIONS}
          selected={data.skills}
          onChange={(value) =>
            onChange(
              "skills",
              Array.isArray(value) ? value.slice(0, 1) : []
            )
          }
          placeholder="Select or create a domain..."
          multi={false}
        />
      </div>
    </div>
  );
}