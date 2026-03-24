"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleSelection } from "@/components/signup/role-selection";
import { StartupForm } from "@/components/signup/startup-form";
import { StudentForm } from "@/components/signup/student-form";
import { EcosystemForm } from "@/components/signup/ecosystem-form";
import type { Role, SignupFormData } from "@/components/signup/signup-types";
import { signup, signin } from "@/lib/auth";
import { cn } from "@/lib/utils";

const roleLabels: Record<Role, string> = {
  startup: "Startup",
  student: "Student",
  ecosystem: "Ecosystem Player",
};

// Adjust these enum values only if your backend enum differs.
const INTENT_VALUE_MAP: Record<Role, "Build" | "Help" | "Explore" | "Advice"> = {
  startup: "Build",
  student: "Explore",
  ecosystem: "Advice",
};

function createInitialFormData(role: Role): SignupFormData {
  return {
    role,
    firstname: "",
    lastname: "",
    username: "",
    email: "",
    password: "",
    phone: "",
    skills: [],
    intent: INTENT_VALUE_MAP[role],
    startupName: "",
    cin: "",
    managerRoleType: "",
    registrationNumber: "",
    timezone: "",
    timeCommitment: "",
  };
}

export function SignupWizard() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<Role>("startup");
  const [formData, setFormData] = useState<SignupFormData>(
    createInitialFormData("startup")
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const title = useMemo(() => roleLabels[selectedRole], [selectedRole]);

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setFormData(createInitialFormData(role));
    setError("");
    setIsAnimating(true);

    setTimeout(() => {
      setCurrentStep(1);
      setIsAnimating(false);
    }, 150);
  };

  const handleBack = () => {
    setError("");
    setIsAnimating(true);

    setTimeout(() => {
      setCurrentStep(0);
      setIsAnimating(false);
    }, 150);
  };

  const handleChange = (
    field: keyof SignupFormData,
    value: string | string[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.firstname.trim()) return "First name is required.";
    if (!formData.lastname.trim()) return "Last name is required.";
    if (!formData.username.trim()) return "Username is required.";
    if (!formData.email.trim()) return "Email is required.";
    if (!formData.password.trim()) return "Password is required.";
    if (formData.password.length < 8)
      return "Password must be at least 8 characters.";
    if (!formData.phone.trim()) return "Phone is required.";

    return "";
  };

  const handleCreateAccount = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await signup({
        email: formData.email.trim(),
        username: formData.username.trim(),
        password: formData.password,
        firstname: formData.firstname.trim(),
        lastname: formData.lastname.trim(),
        phone: formData.phone.trim(),
        skills: formData.skills,
        intent: formData.intent,
      });

      const loginResult = await signin({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (loginResult.identity.onboardingCompleted) {
        router.replace("/home");
        return;
      }

      router.replace("/onboarding");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Signup failed. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-start justify-center px-4 py-8 sm:items-center sm:py-12">
      <div
        className={cn(
          "w-full max-w-3xl transition-all duration-300 ease-out",
          isAnimating ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"
        )}
      >
        {currentStep === 0 ? (
          <div className="space-y-6">
            <RoleSelection onSelectRole={handleSelectRole} />
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-primary underline underline-offset-2"
              >
                Log in
              </Link>
            </p>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-lg">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <div className="mb-8 flex flex-col gap-1">
                <button
                  type="button"
                  onClick={handleBack}
                  className="-ml-2 mb-3 w-fit rounded-md px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  ← Back
                </button>

                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  Sign up as a {title}
                </h1>

                <p className="text-sm text-muted-foreground">
                  Fill in your details to create your account.
                </p>
              </div>

              {selectedRole === "startup" && (
                <StartupForm data={formData} onChange={handleChange} />
              )}

              {selectedRole === "student" && (
                <StudentForm data={formData} onChange={handleChange} />
              )}

              {selectedRole === "ecosystem" && (
                <EcosystemForm data={formData} onChange={handleChange} />
              )}

              {error ? (
                <div className="mt-6 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleCreateAccount}
                disabled={isSubmitting}
                className="mt-8 h-11 w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </button>

              <p className="mt-4 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="font-medium text-primary underline underline-offset-2"
                >
                  Log in
                </Link>
              </p>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                By creating an account, you agree to our{" "}
                <a
                  href="#"
                  className="text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  className="text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}