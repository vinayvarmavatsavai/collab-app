"use client"

import { MessageCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface NavbarProps {
  onMessagesClick: () => void
  onBackClick?: () => void
  showBack?: boolean
}

export function Navbar({ onMessagesClick, onBackClick, showBack }: NavbarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-3">
        {showBack && onBackClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBackClick}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Go back"
          >
            <ArrowLeft className="size-5" />
          </Button>
        )}
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">P</span>
          </div>
          <span className="text-lg font-semibold text-foreground tracking-tight">Platform</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMessagesClick}
          className="relative text-muted-foreground hover:text-foreground"
          aria-label="Messages"
        >
          <MessageCircle className="size-5" />
          <span className="absolute right-1.5 top-1.5 size-2.5 rounded-full bg-primary" />
        </Button>
        <Avatar className="size-8">
          <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
            JD
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
