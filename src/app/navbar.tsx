"use client"

import { useRouter } from "next/navigation"

interface NavbarProps {
  showBack?: boolean
}

export function Navbar({ showBack }: NavbarProps) {
  const router = useRouter()

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            type="button"
            onClick={() => router.push("/home")}
            className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
            aria-label="Go back"
          >
            ← Back
          </button>
        )}
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">P</span>
          </div>
          <span className="text-lg font-semibold text-foreground tracking-tight">Platform</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/messages")}
          className="relative rounded-md px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
          aria-label="Messages"
        >
          💬
          <span className="absolute right-0 top-0 size-2 rounded-full bg-primary" />
        </button>
        <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
          JD
        </div>
      </div>
    </header>
  )
}
