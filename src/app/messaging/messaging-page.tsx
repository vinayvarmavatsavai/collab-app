"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { ChatSidebar } from "@/components/messaging/chat-sidebar"
import { ChatWindow } from "@/components/messaging/chat-window"
import { contacts } from "@/components/messaging/chat-data"

export function MessagingPage() {
  const router = useRouter()
  const [activeChatId, setActiveChatId] = useState(contacts[0].id)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const signupCompleted = localStorage.getItem("signupCompleted") === "true"
    const profileCompleted = localStorage.getItem("profileCompleted") === "true"

    if (!signupCompleted) {
      router.replace("/")
      return
    }

    if (!profileCompleted) {
      router.replace("/onboarding")
    }
  }, [router])

  const activeContact = contacts.find((c) => c.id === activeChatId) ?? contacts[0]

  return (
    <div className="flex h-screen flex-col">
      <Navbar showBack />
      <div className="flex min-h-0 flex-1">
        <ChatSidebar
          contacts={contacts}
          activeChatId={activeChatId}
          onSelectChat={setActiveChatId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <ChatWindow contact={activeContact} />
      </div>
    </div>
  )
}
