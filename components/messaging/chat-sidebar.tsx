"use client"

import { Search, SquarePen } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { ChatContact } from "@/components/messaging/chat-data"

interface ChatSidebarProps {
  contacts: ChatContact[]
  activeChatId: string
  onSelectChat: (id: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

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
        <p className="text-sm text-muted-foreground">No conversations yet</p>
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
            "flex items-center gap-3 px-4 py-3 text-left transition-colors",
            "hover:bg-muted/60",
            activeChatId === contact.id && "bg-muted"
          )}
        >
          <Avatar className="size-10 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {contact.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex items-center justify-between gap-2">
              <span className={cn(
                "truncate text-sm",
                contact.unread ? "font-semibold text-foreground" : "font-medium text-foreground"
              )}>
                {contact.name}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {contact.timestamp}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "truncate text-xs",
                contact.unread ? "font-medium text-foreground" : "text-muted-foreground"
              )}>
                {contact.lastMessage}
              </span>
              {contact.unread && (
                <span className="size-2 shrink-0 rounded-full bg-primary" />
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
  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const cohorts = filteredContacts.filter((c) => c.category === "cohorts")
  const communities = filteredContacts.filter((c) => c.category === "communities")
  const dms = filteredContacts.filter((c) => c.category === "dms")

  return (
    <aside className="flex w-80 flex-col border-r border-border bg-secondary lg:w-96">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-base font-semibold text-foreground">Messages</h2>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          aria-label="New message"
        >
          <SquarePen className="size-4" />
        </Button>
      </div>

      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 bg-card pl-9 text-sm"
          />
        </div>
      </div>

      <Tabs defaultValue="cohorts" className="flex min-h-0 flex-1 flex-col">
        <div className="px-4">
          <TabsList className="w-full">
            <TabsTrigger value="cohorts" className="flex-1 text-xs">Cohorts</TabsTrigger>
            <TabsTrigger value="communities" className="flex-1 text-xs">Communities</TabsTrigger>
            <TabsTrigger value="dms" className="flex-1 text-xs">DMs</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="cohorts" className="mt-0 min-h-0 flex-1">
          <ScrollArea className="h-full">
            <ContactList contacts={cohorts} activeChatId={activeChatId} onSelectChat={onSelectChat} />
          </ScrollArea>
        </TabsContent>
        <TabsContent value="communities" className="mt-0 min-h-0 flex-1">
          <ScrollArea className="h-full">
            <ContactList contacts={communities} activeChatId={activeChatId} onSelectChat={onSelectChat} />
          </ScrollArea>
        </TabsContent>
        <TabsContent value="dms" className="mt-0 min-h-0 flex-1">
          <ScrollArea className="h-full">
            <ContactList contacts={dms} activeChatId={activeChatId} onSelectChat={onSelectChat} />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </aside>
  )
}
