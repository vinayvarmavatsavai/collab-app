"use client"

import { useState, useRef, useEffect } from "react"
import { Phone, Video, Paperclip, Smile, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { ChatContact, Message } from "@/components/messaging/chat-data"
import { getMessagesForContact } from "@/components/messaging/chat-data"

interface ChatWindowProps {
  contact: ChatContact
}

export function ChatWindow({ contact }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(() =>
    getMessagesForContact(contact.id)
  )
  const [inputValue, setInputValue] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages(getMessagesForContact(contact.id))
    setInputValue("")
  }, [contact.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: "me",
        text: trimmed,
        time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      },
    ])
    setInputValue("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-card">
      {/* Chat header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {contact.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">{contact.name}</span>
            <span className="text-xs text-muted-foreground">Active now</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label="Voice call">
            <Phone className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label="Video call">
            <Video className="size-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-6 py-4">
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
                  "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
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
      </ScrollArea>

      {/* Input area */}
      <div className="flex items-center gap-3 border-t border-border px-4 py-3">
        <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground" aria-label="Attach file">
          <Paperclip className="size-4" />
        </Button>
        <div className="relative flex-1">
          <Input
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-10 rounded-full bg-muted pr-10 text-sm"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Emoji"
          >
            <Smile className="size-4" />
          </Button>
        </div>
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!inputValue.trim()}
          className="shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          aria-label="Send message"
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  )
}
