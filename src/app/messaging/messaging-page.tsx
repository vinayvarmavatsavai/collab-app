"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { ChatSidebar } from "@/components/messaging/chat-sidebar"
import { ChatWindow } from "@/components/messaging/chat-window"
import { contacts } from "@/components/messaging/chat-data"
import { useIsMobile } from "@/hooks/use-mobile"

export function MessagingPage() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [activeChatId, setActiveChatId] = useState(contacts[0].id)
  const [searchQuery, setSearchQuery] = useState("")
  const [showMobileChat, setShowMobileChat] = useState(false)

  useEffect(() => {
    const signupCompleted = localStorage.getItem("signupCompleted") === "true"
    const profileCompleted = localStorage.getItem("profileCompleted") === "true"

    /*if (!signupCompleted) {
      router.replace("/")
      return
    }

    if (!profileCompleted) {
      /router.replace("/onboarding")
    }*/
  }, [router])

  const activeContact = contacts.find((c) => c.id === activeChatId) ?? contacts[0]
  const showSidebar = !isMobile || !showMobileChat
  const showChat = !isMobile || showMobileChat

  return (
    <div className="flex h-screen flex-col">
      <Navbar showBack />
      <div className="flex min-h-0 flex-1">
        {showSidebar && (
          <ChatSidebar
            contacts={contacts}
            activeChatId={activeChatId}
            onSelectChat={(id) => {
              setActiveChatId(id)
              if (isMobile) setShowMobileChat(true)
            }}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}
        {showChat && (
          <ChatWindow
            contact={activeContact}
            showMobileBack={isMobile}
            onMobileBack={() => setShowMobileChat(false)}
          />
        )}
      </div>
    </div>
  )
}
