"use client"

import { Navbar } from "@/components/navbar"

interface HomePageProps {
  onMessagesClick: () => void
}

export function HomePage({ onMessagesClick }: HomePageProps) {
  return (
    <div className="flex h-screen flex-col">
      <Navbar onMessagesClick={onMessagesClick} />
      <main className="flex flex-1 items-center justify-center bg-secondary">
        <p className="text-muted-foreground text-sm">
          Welcome to your dashboard. Start exploring.
        </p>
      </main>
    </div>
  )
}
