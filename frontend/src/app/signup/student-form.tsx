"use client";

import { CreatableCombobox } from "@/components/creatable-combobox";
import { TimezoneSelect } from "@/components/signup/timezone-select";
import type { SignupFormData } from "@/components/signup/signup-types";

const DOMAIN_OPTIONS = [
  "Artificial Intelligence",
  "Machine Learning",
  "Web Development",
  "Mobile Development",
  "Data Science",
  "Cloud Computing",
];

const INTENT_OPTIONS = [
  { label: "Build", value: "Build" },
  { label: "Help", value: "Help" },
  { label: "Explore", value: "Explore" },
];

interface StudentFormProps {
  data: SignupFormData;
  onChange: (field: keyof SignupFormData, value: string | string[]) => void;
}

export function StudentForm({ data, onChange }: StudentFormProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="student-first" className="text-sm font-medium">
            First Name
          </label>
          <input
            id="student-first"
            type="text"
            value={data.firstname}
            onChange={(e) => onChange("firstname", e.target.value)}
            placeholder="Jane"
            className="h-11 rounded-md border border-slate-300 px-3 text-sm"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="student-last" className="text-sm font-medium">
            Last Name
          </label>
          <input
            id="student-last"
            type="text"
            value={data.lastname}
            onChange={(e) => onChange("lastname", e.target.value)}
            placeholder="Doe"
            className="h-11 rounded-md border border-slate-300 px-3 text-sm"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="student-username" className="text-sm font-medium">
          Username
        </label>
        <input
          id="student-username"
          type="text"
          value={data.username}
          onChange={(e) => onChange("username", e.target.value)}
          placeholder="janedoe"
          className="h-11 rounded-md border border-slate-300 px-3 text-sm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="student-email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="student-email"
          type="email"
          value={data.email}
          onChange={(e) => onChange("email", e.target.value)}
          placeholder="you@university.edu"
          className="h-11 rounded-md border border-slate-300 px-3 text-sm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="student-phone" className="text-sm font-medium">
          Phone
        </label>
        <input
          id="student-phone"
          type="tel"
          value={data.phone}
          onChange={(e) => onChange("phone", e.target.value)}
          placeholder="+91 9876543210"
          className="h-11 rounded-md border border-slate-300 px-3 text-sm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="student-password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="student-password"
          type="password"
          value={data.password}
          onChange={(e) => onChange("password", e.target.value)}
          placeholder="Create a strong password"
          className="h-11 rounded-md border border-slate-300 px-3 text-sm"
        />
      </div>

      <TimezoneSelect
        value={data.timezone}
        onChange={(value) => onChange("timezone", value)}
      />

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">
          Primary Working Domains{" "}
          <span className="text-xs font-normal text-muted-foreground">
            (up to 5)
          </span>
        </label>
        <CreatableCombobox
          options={DOMAIN_OPTIONS}
          selected={data.skills}
          onChange={(value) => onChange("skills", value)}
          placeholder="Select or create domains..."
          maxItems={5}
          multi
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Intent</label>
        <CreatableCombobox
          options={INTENT_OPTIONS.map((item) => item.label)}
          selected={
            data.intent
              ? [
                  INTENT_OPTIONS.find((item) => item.value === data.intent)
                    ?.label ?? data.intent,
                ]
              : []
          }
          onChange={(value) => {
            const selectedLabel = Array.isArray(value) ? (value[0] ?? "") : "";
            const matched = INTENT_OPTIONS.find(
              (item) => item.label === selectedLabel,
            );
            onChange("intent", matched?.value ?? "Explore");
          }}
          placeholder="What brings you here?"
          multi={false}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="time-commitment" className="text-sm font-medium">
          Time Commitment
        </label>
        <select
          id="time-commitment"
          value={data.timeCommitment}
          onChange={(e) => onChange("timeCommitment", e.target.value)}
          className="h-11 rounded-md border border-slate-300 px-3 text-sm"
        >
          <option value="">Select hours</option>
          <option value="lt5">Less than 5 hours a week</option>
          <option value="5-10">5-10 hours a week</option>
          <option value="10+">10+ hours a week</option>
        </select>
      </div>
    </div>
  );
}
