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
  "E-Commerce",
  "SaaS",
  "Cybersecurity",
];

interface StartupFormProps {
  data: SignupFormData;
  onChange: (field: keyof SignupFormData, value: string | string[]) => void;
}

export function StartupForm({ data, onChange }: StartupFormProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="startup-name" className="text-sm font-medium">
          Startup Name
        </label>
        <input
          id="startup-name"
          type="text"
          value={data.startupName}
          onChange={(e) => onChange("startupName", e.target.value)}
          placeholder="Acme Inc."
          className="h-11 rounded-md border border-slate-300 px-3 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="startup-first" className="text-sm font-medium">
            First Name
          </label>
          <input
            id="startup-first"
            type="text"
            value={data.firstname}
            onChange={(e) => onChange("firstname", e.target.value)}
            placeholder="John"
            className="h-11 rounded-md border border-slate-300 px-3 text-sm"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="startup-last" className="text-sm font-medium">
            Last Name
          </label>
          <input
            id="startup-last"
            type="text"
            value={data.lastname}
            onChange={(e) => onChange("lastname", e.target.value)}
            placeholder="Doe"
            className="h-11 rounded-md border border-slate-300 px-3 text-sm"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="startup-username" className="text-sm font-medium">
          Username
        </label>
        <input
          id="startup-username"
          type="text"
          value={data.username}
          onChange={(e) => onChange("username", e.target.value)}
          placeholder="acmefounder"
          className="h-11 rounded-md border border-slate-300 px-3 text-sm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="startup-email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="startup-email"
          type="email"
          value={data.email}
          onChange={(e) => onChange("email", e.target.value)}
          placeholder="you@startup.com"
          className="h-11 rounded-md border border-slate-300 px-3 text-sm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="startup-phone" className="text-sm font-medium">
          Phone
        </label>
        <input
          id="startup-phone"
          type="tel"
          value={data.phone}
          onChange={(e) => onChange("phone", e.target.value)}
          placeholder="+91 9876543210"
          className="h-11 rounded-md border border-slate-300 px-3 text-sm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="startup-password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="startup-password"
          type="password"
          value={data.password}
          onChange={(e) => onChange("password", e.target.value)}
          placeholder="Create a strong password"
          className="h-11 rounded-md border border-slate-300 px-3 text-sm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="startup-cin" className="text-sm font-medium">
          Corporate Identification Number (CIN)
        </label>
        <input
          id="startup-cin"
          type="text"
          value={data.cin}
          onChange={(e) => onChange("cin", e.target.value)}
          placeholder="e.g. U12345AB6789CDE012345"
          className="h-11 rounded-md border border-slate-300 px-3 text-sm"
        />
      </div>

      <TimezoneSelect
        value={data.timezone}
        onChange={(value) => onChange("timezone", value)}
      />

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">
          Primary Domain{" "}
          <span className="text-xs font-normal text-muted-foreground">
            (up to 3)
          </span>
        </label>
        <CreatableCombobox
          options={DOMAIN_OPTIONS}
          selected={data.skills}
          onChange={(value) => onChange("skills", value)}
          placeholder="Select or create domains..."
          maxItems={3}
          multi
        />
      </div>
    </div>
  );
}