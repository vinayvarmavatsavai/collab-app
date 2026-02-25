"use client"

import { useState } from "react"
import { SignupWizard } from "@/components/signup/signup-wizard"
import { HomePage } from "@/components/home-page"
import { MessagingPage } from "@/components/messaging/messaging-page"

type View = "signup" | "home" | "messages"

export default function Page() {
  const [currentView, setCurrentView] = useState<View>("signup")

  if (currentView === "home") {
    return <HomePage onMessagesClick={() => setCurrentView("messages")} />
  }

  if (currentView === "messages") {
    return <MessagingPage onBackClick={() => setCurrentView("home")} />
  }

  return <SignupWizard onComplete={() => setCurrentView("home")} />
}
