"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { ChatSidebar } from "@/components/messaging/chat-sidebar"
import { ChatWindow } from "@/components/messaging/chat-window"
import { contacts } from "@/components/messaging/chat-data"

interface MessagingPageProps {
  onBackClick: () => void
}

export function MessagingPage({ onBackClick }: MessagingPageProps) {
  const [activeChatId, setActiveChatId] = useState(contacts[0].id)
  const [searchQuery, setSearchQuery] = useState("")

  const activeContact = contacts.find((c) => c.id === activeChatId) ?? contacts[0]

  return (
    <div className="flex h-screen flex-col">
      <Navbar
        onMessagesClick={() => {}}
        onBackClick={onBackClick}
        showBack
      />
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
