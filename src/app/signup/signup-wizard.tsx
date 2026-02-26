"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RoleSelection, type Role } from "@/components/signup/role-selection"
import { StartupForm } from "@/components/signup/startup-form"
import { StudentForm } from "@/components/signup/student-form"
import { EcosystemForm } from "@/components/signup/ecosystem-form"
import { cn } from "@/lib/utils"

const roleLabels: Record<Role, string> = {
  startup: "Startup",
  student: "Student",
  ecosystem: "Ecosystem Player",
}

export function SignupWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedRole, setSelectedRole] = useState<Role>("startup")
  const [isAnimating, setIsAnimating] = useState(false)

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role)
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentStep(1)
      setIsAnimating(false)
    }, 150)
  }

  const handleBack = () => {
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentStep(0)
      setIsAnimating(false)
    }, 150)
  }

  const handleCreateAccount = () => {
    localStorage.setItem("signupCompleted", "true")
    router.push("/onboarding")
  }

  return (
    <main className="flex min-h-screen items-start justify-center px-4 py-12 sm:items-center sm:py-16">
      <div
        className={cn(
          "w-full max-w-3xl transition-all duration-300 ease-out",
          isAnimating ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"
        )}
      >
        {currentStep === 0 ? (
          <RoleSelection onSelectRole={handleSelectRole} />
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
                  Sign up as a {roleLabels[selectedRole]}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Fill in your details to create your account.
                </p>
              </div>

              {selectedRole === "startup" && <StartupForm />}
              {selectedRole === "student" && <StudentForm />}
              {selectedRole === "ecosystem" && <EcosystemForm />}

              <button
                type="button"
                onClick={handleCreateAccount}
                className="mt-8 h-11 w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium"
              >
                Create Account
              </button>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                {"By creating an account, you agree to our "}
                <a href="#" className="text-primary underline underline-offset-2 hover:text-primary/80">
                  Terms of Service
                </a>
                {" and "}
                <a href="#" className="text-primary underline underline-offset-2 hover:text-primary/80">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
