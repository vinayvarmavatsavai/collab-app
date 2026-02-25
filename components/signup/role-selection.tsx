"use client"

import { Rocket, GraduationCap, Building } from "lucide-react"
import { cn } from "@/lib/utils"

export type Role = "startup" | "student" | "ecosystem"

interface RoleCard {
  role: Role
  label: string
  description: string
  icon: React.ReactNode
}

const roles: RoleCard[] = [
  {
    role: "startup",
    label: "Startup",
    description: "Launch and grow your venture with the right support and connections.",
    icon: <Rocket className="size-7" />,
  },
  {
    role: "student",
    label: "Student",
    description: "Explore opportunities, collaborate, and build real-world experience.",
    icon: <GraduationCap className="size-7" />,
  },
  {
    role: "ecosystem",
    label: "Ecosystem Player",
    description: "Invest, mentor, accelerate, or support the innovation community.",
    icon: <Building className="size-7" />,
  },
]

interface RoleSelectionProps {
  onSelectRole: (role: Role) => void
}

export function RoleSelection({ onSelectRole }: RoleSelectionProps) {
  return (
    <div className="flex w-full flex-col items-center gap-10">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
          Are you a
        </h1>
        <p className="text-muted-foreground text-sm">
          Choose your role to get started
        </p>
      </div>
      <div className="grid w-full max-w-3xl grid-cols-1 gap-4 px-4 sm:grid-cols-3 sm:px-0">
        {roles.map((card) => (
          <button
            key={card.role}
            type="button"
            onClick={() => onSelectRole(card.role)}
            className={cn(
              "group relative flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center shadow-sm",
              "transition-all duration-200 ease-out",
              "hover:-translate-y-1 hover:border-primary hover:shadow-lg hover:shadow-primary/10",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            )}
          >
            <div className="flex size-14 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
              {card.icon}
            </div>
            <div className="flex flex-col gap-1.5">
              <h2 className="text-lg font-semibold text-foreground">
                {card.label}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {card.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
