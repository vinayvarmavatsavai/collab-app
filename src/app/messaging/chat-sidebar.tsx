"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import type { ChatContact } from "@/components/messaging/chat-data"

type ChatCategory = ChatContact["category"]

interface ChatSidebarProps {
  contacts: ChatContact[]
  activeChatId: string
  onSelectChat: (id: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

interface TabItem {
  key: ChatCategory
  label: string
}

const tabs: TabItem[] = [
  { key: "cohorts", label: "Cohorts" },
  { key: "communities", label: "Communities" },
  { key: "dms", label: "DMs" },
]

function ContactList({
  contacts,
  activeChatId,
  onSelectChat,
}: {
  contacts: ChatContact[]
  activeChatId: string
  onSelectChat: (id: string) => void
}) {
  if (contacts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">No conversations in this tab</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {contacts.map((contact) => (
        <button
          key={contact.id}
          type="button"
          onClick={() => onSelectChat(contact.id)}
          className={cn(
            "mx-2 my-1 flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors",
            "hover:bg-muted/70",
            activeChatId === contact.id && "bg-primary/10 ring-1 ring-primary/20"
          )}
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {contact.initials}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex items-center justify-between gap-2">
              <span className={cn("truncate text-sm", contact.unread ? "font-semibold" : "font-medium")}>
                {contact.name}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{contact.timestamp}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("truncate text-xs", contact.unread ? "font-medium text-foreground" : "text-muted-foreground")}>
                {contact.lastMessage}
              </span>
              {contact.unread && <span className="size-2 shrink-0 rounded-full bg-primary" />}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

export function ChatSidebar({
  contacts,
  activeChatId,
  onSelectChat,
  searchQuery,
  onSearchChange,
}: ChatSidebarProps) {
  const initialTab = contacts.find((c) => c.id === activeChatId)?.category ?? "cohorts"
  const [activeTab, setActiveTab] = useState<ChatCategory>(initialTab)

  const filteredContacts = useMemo(
    () => contacts.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [contacts, searchQuery]
  )

  const tabContacts = useMemo(
    () => filteredContacts.filter((c) => c.category === activeTab),
    [filteredContacts, activeTab]
  )

  const tabCounts = useMemo(
    () => ({
      cohorts: filteredContacts.filter((c) => c.category === "cohorts").length,
      communities: filteredContacts.filter((c) => c.category === "communities").length,
      dms: filteredContacts.filter((c) => c.category === "dms").length,
    }),
    [filteredContacts]
  )

  return (
    <aside className="flex w-80 flex-col border-r border-border bg-secondary/50 lg:w-96">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-base font-semibold text-foreground">Messages</h2>
        <button type="button" className="text-sm text-muted-foreground hover:text-foreground" aria-label="New message">
          ✏️
        </button>
      </div>

      <div className="px-4 py-3">
        <input
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="px-4 pb-3">
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/60 p-1">
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "rounded-lg px-2 py-2 text-xs font-semibold transition",
                  isActive ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                <span className={cn("ml-1 text-[11px]", isActive ? "text-primary" : "text-muted-foreground")}>({tabCounts[tab.key]})</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-2">
        <ContactList contacts={tabContacts} activeChatId={activeChatId} onSelectChat={onSelectChat} />
      </div>
    </aside>
  )
}
