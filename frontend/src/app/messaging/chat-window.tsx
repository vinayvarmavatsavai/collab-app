"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { ChatContact, Message } from "./chat-data";

interface ChatWindowProps {
  contact: ChatContact;
  messages: Message[];
  onSendMessage: (text: string) => Promise<void>;
  isSending?: boolean;
  isLoadingMessages?: boolean;
  showMobileBack?: boolean;
  onMobileBack?: () => void;
}

export function ChatWindow({
  contact,
  messages,
  onSendMessage,
  isSending = false,
  isLoadingMessages = false,
  showMobileBack = false,
  onMobileBack,
}: ChatWindowProps) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!trimmed || isSending) return;

    try {
      await onSendMessage(trimmed);
      setDraft("");
    } catch (error) {
      console.error("Failed to send message", error);
      alert("Failed to send message.");
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      await handleSend();
    }
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-[var(--surface-solid)] text-[var(--text-main)]">
      <div className="flex items-center justify-between border-b border-[var(--line-soft)] px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {showMobileBack ? (
            <button
              type="button"
              onClick={onMobileBack}
              className="rounded-full border border-[var(--line-soft)] bg-[var(--surface-solid)] px-3 py-1.5 text-sm text-[var(--text-muted-2)] transition hover:bg-[var(--muted)] hover:text-[var(--text-main)] md:hidden"
              aria-label="Back to conversations"
            >
              ←
            </button>
          ) : null}

          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[var(--muted)] text-xs font-semibold text-[var(--text-main)]">
            {contact.initials}
          </div>

          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold text-[var(--text-main)]">
              {contact.name}
            </span>
            <span className="text-xs text-[var(--text-muted-2)]">
              Direct message
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Voice call"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[var(--surface-solid)] text-[15px] text-[var(--text-muted-2)] transition hover:bg-[var(--muted)] hover:text-[var(--text-main)]"
          >
            📞
          </button>
          <button
            type="button"
            aria-label="Video call"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[var(--surface-solid)] text-[15px] text-[var(--text-muted-2)] transition hover:bg-[var(--muted)] hover:text-[var(--text-main)]"
          >
            🎥
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[var(--app-bg)] px-3 py-3 md:px-6 md:py-4">
        {isLoadingMessages ? (
          <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted-2)]">
            Loading messages...
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center py-10 text-sm text-[var(--text-muted-2)]">
                No messages yet. Start the conversation.
              </div>
            ) : null}

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
                    "max-w-[85%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed shadow-sm sm:max-w-[75%] sm:px-4",
                    msg.sender === "me"
                      ? "rounded-br-md bg-[var(--primary-btn-bg)] text-[var(--primary-btn-text)]"
                      : "rounded-bl-md border border-[var(--line-soft)] bg-[var(--surface-solid)] text-[var(--text-main)]"
                  )}
                >
                  {msg.text}
                </div>

                <span className="px-1 text-[10px] text-[var(--text-muted-2)]">
                  {msg.time}
                </span>
              </div>
            ))}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-[var(--line-soft)] bg-[var(--surface-solid)] px-3 py-3 sm:gap-3 sm:px-4">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[var(--surface-solid)] text-[16px] text-[var(--text-muted-2)] transition hover:bg-[var(--muted)] hover:text-[var(--text-main)]"
          aria-label="Attach file"
        >
          📎
        </button>

        <input
          placeholder="Type a message..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-11 w-full rounded-full border border-[var(--field-border)] bg-[var(--field-bg)] px-4 text-sm text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted-2)] focus:border-[var(--field-focus)]"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!draft.trim() || isSending}
          className="shrink-0 rounded-full bg-[var(--primary-btn-bg)] px-4 py-2.5 text-sm font-medium text-[var(--primary-btn-text)] transition disabled:opacity-40"
          aria-label="Send message"
        >
          {isSending ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}