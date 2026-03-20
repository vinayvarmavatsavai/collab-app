"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreatableCombobox } from "@/components/creatable-combobox";
import { TimezoneSelect } from "@/components/signup/timezone-select";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const DOMAIN_OPTIONS = [
  "Artificial Intelligence",
  "Machine Learning",
  "Web Development",
  "Mobile Development",
  "Data Science",
  "Cloud Computing",
];

const INTENT_OPTIONS = ["Build", "Help", "Explore", "Advice"];

type SignInResponse = {
  accessToken: string;
  sessionId?: string;
  identity?: unknown;
};

export function StudentForm() {
  const router = useRouter();

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [timezone, setTimezone] = useState("");
  const [domains, setDomains] = useState<string[]>([]);
  const [intent, setIntent] = useState<string[]>([]);
  const [timeCommitment, setTimeCommitment] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedIntent = intent[0] || "";

  const getErrorMessage = (data: any) => {
    if (!data) return "Something went wrong";
    if (Array.isArray(data.message)) return data.message.join(", ");
    if (typeof data.message === "string") return data.message;
    return "Something went wrong";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!firstname || !lastname || !username || !email || !phone || !password || !selectedIntent) {
      setError("Please fill all required fields.");
      return;
    }

    setLoading(true);

    try {
      const signupRes = await fetch(`${API_BASE_URL}/auth/signup/user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username,
          firstname,
          lastname,
          email,
          password,
          phone,
          intent: selectedIntent,
        }),
      });

      const signupData = await signupRes.json().catch(() => null);

      if (!signupRes.ok) {
        throw new Error(getErrorMessage(signupData));
      }

      const signinRes = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const signinData: SignInResponse | any = await signinRes.json().catch(() => null);

      if (!signinRes.ok) {
        throw new Error(getErrorMessage(signinData));
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", signinData.accessToken);

        if (signinData.sessionId) {
          localStorage.setItem("sessionId", signinData.sessionId);
        }

        if (signinData.identity) {
          localStorage.setItem("user", JSON.stringify(signinData.identity));
        }

        localStorage.setItem(
          "pendingOnboardingProfile",
          JSON.stringify({
            timezone,
            domains,
            timeCommitment,
            intent: selectedIntent,
          }),
        );
      }

      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="student-first" className="text-sm font-medium">
            First Name
          </label>
          <input
            id="student-first"
            type="text"
            placeholder="Jane"
            value={firstname}
            onChange={(e) => setFirstname(e.target.value)}
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="student-last" className="text-sm font-medium">
            Last Name
          </label>
          <input
            id="student-last"
            type="text"
            placeholder="Doe"
            value={lastname}
            onChange={(e) => setLastname(e.target.value)}
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
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
          placeholder="janedoe"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="h-10 rounded-md border border-slate-300 px-3 text-sm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="student-email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="student-email"
          type="email"
          placeholder="you@university.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-10 rounded-md border border-slate-300 px-3 text-sm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="student-phone" className="text-sm font-medium">
          Phone
        </label>
        <input
          id="student-phone"
          type="text"
          placeholder="9876543210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="h-10 rounded-md border border-slate-300 px-3 text-sm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="student-password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="student-password"
          type="password"
          placeholder="Create a strong password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-10 rounded-md border border-slate-300 px-3 text-sm"
        />
      </div>

      <TimezoneSelect value={timezone} onChange={setTimezone} />

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">
          Primary Working Domains{" "}
          <span className="text-xs font-normal text-muted-foreground">
            (up to 5)
          </span>
        </label>
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
        <label htmlFor="time-commitment" className="text-sm font-medium">
          Time Commitment
        </label>
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

      {error ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}