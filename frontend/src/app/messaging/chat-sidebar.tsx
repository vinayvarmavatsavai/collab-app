"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import BottomNav from "../navigation/BottomNav";
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
        <p className="text-sm text-[var(--text-muted-2)]">No conversations in this tab</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col px-2">
      {contacts.map((contact) => (
        <button
          key={contact.id}
          type="button"
          onClick={() => onSelectChat(contact.id)}
          className={cn(
            "mx-1 my-1 flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all",
            "border-transparent hover:border-[var(--line-soft)] hover:bg-[var(--muted)]",
            activeChatId === contact.id &&
              "border-[var(--line-soft)] bg-[var(--surface-solid)] shadow-sm"
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[var(--muted)] text-xs font-semibold text-[var(--text-main)]">
            {contact.initials}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "truncate text-sm text-[var(--text-main)]",
                  contact.unread ? "font-semibold" : "font-medium"
                )}
              >
                {contact.name}
              </span>

              <span className="shrink-0 text-xs text-[var(--text-muted-2)]">
                {contact.timestamp}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "truncate text-xs",
                  contact.unread
                    ? "font-medium text-[var(--text-main)]"
                    : "text-[var(--text-muted-2)]"
                )}
              >
                {contact.lastMessage}
              </span>

              {contact.unread && (
                <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--primary)]" />
              )}
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
    <aside className="flex w-full flex-col bg-[var(--app-bg)] md:w-80 md:border-r md:border-[var(--line-soft)] lg:w-96">
      <div className="border-b border-[var(--line-soft)] px-4 py-4">
        <input
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-11 w-full rounded-2xl border border-[var(--field-border)] bg-[var(--field-bg)] px-4 text-sm text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted-2)] focus:border-[var(--field-focus)]"
        />
      </div>

      <div className="px-4 py-3">
        <div className="grid grid-cols-3 gap-1 rounded-2xl border border-[var(--line-soft)] bg-[var(--muted)] p-1">
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "rounded-xl px-2 py-2 text-[11px] font-semibold transition sm:text-xs",
                  isActive
                    ? "bg-[var(--surface-solid)] text-[var(--text-main)] shadow-sm"
                    : "text-[var(--text-muted-2)] hover:text-[var(--text-main)]"
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "ml-1 text-[10px] sm:text-[11px]",
                    isActive ? "text-[var(--text-main)]" : "text-[var(--text-muted-2)]"
                  )}
                >
                  ({tabCounts[tab.key]})
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-2">
        <ContactList
          contacts={tabContacts}
          activeChatId={activeChatId}
          onSelectChat={onSelectChat}
        />
      </div>
      <BottomNav />
    </aside>
  )
}