"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatSidebar } from "./chat-sidebar";
import { ChatWindow } from "./chat-window";
import type { ChatContact, Message } from "./chat-data";
import { useIsMobile } from "@/hooks/use-mobile";
import Header from "../navigation/Header";
import {
  getConversationMessages,
  getConversations,
  markConversationRead,
  sendConversationMessage,
  type ConversationSummary,
} from "@/lib/messages";
import { getAccessToken, getStoredIdentity } from "@/lib/auth";

function formatTimestamp(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function mapConversationToContact(conversation: ConversationSummary): ChatContact {
  return {
    id: conversation.id,
    name: conversation.displayName || "Unknown user",
    initials: buildInitials(conversation.displayName || "Unknown user"),
    lastMessage: conversation.lastMessage?.body || "No messages yet",
    timestamp: formatTimestamp(
      conversation.lastMessage?.createdAt || conversation.updatedAt
    ),
    unreadCount: conversation.unreadCount || 0,
    category: conversation.type === "direct" ? "dms" : "cohorts",
  };
}

function mapMessages(apiMessages: Awaited<ReturnType<typeof getConversationMessages>>): Message[] {
  return apiMessages.map((message) => ({
    id: message.id,
    sender: message.mine ? "me" : "them",
    text: message.body,
    time: formatTimestamp(message.createdAt),
  }));
}

export function MessagingPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const identity = getStoredIdentity();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, Message[]>>({});
  const [activeChatId, setActiveChatId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);

  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const contacts = useMemo(
    () => conversations.map(mapConversationToContact),
    [conversations]
  );

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.replace("/auth/login");
      return;
    }

    async function loadConversations() {
      try {
        setIsLoadingConversations(true);
        setError("");

        const data = await getConversations();
        setConversations(data);

        if (data.length > 0) {
          setActiveChatId((prev) => prev || data[0].id);
        }
      } catch (err) {
        console.error("Failed to load conversations", err);
        setError("Failed to load conversations.");
      } finally {
        setIsLoadingConversations(false);
      }
    }

    void loadConversations();
  }, [router]);

  useEffect(() => {
    if (!activeChatId) return;

    async function loadMessages() {
      try {
        setIsLoadingMessages(true);

        const data = await getConversationMessages(activeChatId);

        setMessagesByConversation((prev) => ({
          ...prev,
          [activeChatId]: mapMessages(data),
        }));

        await markConversationRead(activeChatId);

        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === activeChatId
              ? { ...conversation, unreadCount: 0 }
              : conversation
          )
        );
      } catch (err) {
        console.error("Failed to load messages", err);
      } finally {
        setIsLoadingMessages(false);
      }
    }

    void loadMessages();
  }, [activeChatId]);

  const activeContact =
    contacts.find((c) => c.id === activeChatId) ?? contacts[0];

  const activeMessages =
    activeChatId && messagesByConversation[activeChatId]
      ? messagesByConversation[activeChatId]
      : [];

  const showSidebar = !isMobile || !showMobileChat;
  const showChat = !isMobile || showMobileChat;

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    if (isMobile) setShowMobileChat(true);
  };

  const handleSendMessage = async (text: string) => {
    if (!activeChatId || !identity?.username) return;

    setIsSending(true);

    try {
      const saved = await sendConversationMessage(activeChatId, text);

      const optimisticMessage: Message = {
        id: saved.id,
        sender: "me",
        text: saved.body,
        time: formatTimestamp(saved.createdAt),
      };

      setMessagesByConversation((prev) => ({
        ...prev,
        [activeChatId]: [...(prev[activeChatId] || []), optimisticMessage],
      }));

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === activeChatId
            ? {
                ...conversation,
                lastMessage: {
                  id: saved.id,
                  body: saved.body,
                  createdAt: saved.createdAt,
                  senderId: saved.senderId,
                  senderUsername: identity.username,
                },
                updatedAt: saved.createdAt,
              }
            : conversation
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  if (isLoadingConversations) {
    return (
      <div className="flex h-screen flex-col">
        <Header title="Chats" />
        <div className="flex flex-1 items-center justify-center text-sm text-[var(--text-muted-2)]">
          Loading conversations...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col">
        <Header title="Chats" />
        <div className="flex flex-1 items-center justify-center px-4 text-center text-sm text-red-600">
          {error}
        </div>
      </div>
    );
  }

  if (!activeContact) {
    return (
      <div className="flex h-screen flex-col">
        <Header title="Chats" />
        <div className="flex flex-1 items-center justify-center text-sm text-[var(--text-muted-2)]">
          No conversations yet.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <Header title="Chats" />
      <div className="flex min-h-0 flex-1">
        {showSidebar ? (
          <ChatSidebar
            contacts={contacts}
            activeChatId={activeChatId}
            onSelectChat={handleSelectChat}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        ) : null}

        {showChat ? (
          <ChatWindow
            contact={activeContact}
            messages={activeMessages}
            onSendMessage={handleSendMessage}
            isSending={isSending}
            isLoadingMessages={isLoadingMessages}
            showMobileBack={isMobile}
            onMobileBack={() => setShowMobileChat(false)}
          />
        ) : null}
      </div>
    </div>
  );
}