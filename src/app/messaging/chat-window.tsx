"use client"

import { useMemo, useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import type { ChatContact, Message } from "@/components/messaging/chat-data"
import { getMessagesForContact } from "@/components/messaging/chat-data"

interface ChatWindowProps {
  contact: ChatContact
  showMobileBack?: boolean
  onMobileBack?: () => void
}

export function ChatWindow({ contact, showMobileBack = false, onMobileBack }: ChatWindowProps) {
  const [messagesByContact, setMessagesByContact] = useState<Record<string, Message[]>>({})
  const [draftByContact, setDraftByContact] = useState<Record<string, string>>({})
  const bottomRef = useRef<HTMLDivElement>(null)

  const messages = useMemo(
    () => messagesByContact[contact.id] ?? getMessagesForContact(contact.id),
    [contact.id, messagesByContact]
  )

  const inputValue = draftByContact[contact.id] ?? ""

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return

    setMessagesByContact((prev) => {
      const current = prev[contact.id] ?? getMessagesForContact(contact.id)
      return {
        ...prev,
        [contact.id]: [
          ...current,
          {
            id: `user-${Date.now()}`,
            sender: "me",
            text: trimmed,
            time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
          },
        ],
      }
    })

    setDraftByContact((prev) => ({
      ...prev,
      [contact.id]: "",
    }))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          {showMobileBack && (
            <button
              type="button"
              onClick={onMobileBack}
              className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:text-foreground md:hidden"
              aria-label="Back to conversations"
            >
              ←
            </button>
          )}
          <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
            {contact.initials}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">{contact.name}</span>
            <span className="text-xs text-muted-foreground">Active now</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button type="button" aria-label="Voice call">📞</button>
          <button type="button" aria-label="Video call">🎥</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 md:px-6 md:py-4">
        <div className="flex flex-col gap-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col gap-1",
                msg.sender === "me" ? "items-end" : "items-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed sm:max-w-[75%] sm:px-4",
                  msg.sender === "me"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                )}
              >
                {msg.text}
              </div>
              <span className="px-1 text-[10px] text-muted-foreground">{msg.time}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-border px-3 py-3 sm:gap-3 sm:px-4">
        <button type="button" className="text-muted-foreground" aria-label="Attach file">📎</button>
        <input
          placeholder="Type a message..."
          value={inputValue}
          onChange={(e) =>
            setDraftByContact((prev) => ({
              ...prev,
              [contact.id]: e.target.value,
            }))
          }
          onKeyDown={handleKeyDown}
          className="h-10 w-full rounded-full border border-slate-300 bg-white px-4 text-sm"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!inputValue.trim()}
          className="shrink-0 rounded-full bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-40 sm:px-4"
          aria-label="Send message"
        >
          Send
        </button>
      </div>
    </div>
  )
}
