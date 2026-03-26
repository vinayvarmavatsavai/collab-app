import { apiRequest } from "./api";

export type ConversationParticipant = {
  id: string;
  identityId: string;
  username: string | null;
  email: string | null;
  joinedAt: string;
  lastReadAt: string | null;
};

export type ConversationSummary = {
  id: string;
  type: "direct" | "group";
  title: string | null;
  displayName: string;
  lastMessage: {
    id: string;
    body: string;
    createdAt: string;
    senderId: string;
    senderUsername: string | null;
  } | null;
  unreadCount: number;
  participants: ConversationParticipant[];
  updatedAt: string;
  createdAt: string;
};

export type ConversationMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderUsername: string | null;
  type: string;
  body: string;
  isDeleted: boolean;
  createdAt: string;
  editedAt: string | null;
  mine: boolean;
};

export async function getConversations() {
  return apiRequest<ConversationSummary[]>("/messages/conversations", {
    method: "GET",
  });
}

export async function getConversationMessages(conversationId: string) {
  return apiRequest<ConversationMessage[]>(
    `/messages/conversations/${conversationId}/messages`,
    {
      method: "GET",
    }
  );
}

export async function sendConversationMessage(
  conversationId: string,
  body: string
) {
  return apiRequest<ConversationMessage>(
    `/messages/conversations/${conversationId}/messages`,
    {
      method: "POST",
      body: { body },
    }
  );
}

export async function markConversationRead(conversationId: string) {
  return apiRequest<{ success: boolean; conversationId: string; lastReadAt: string }>(
    `/messages/conversations/${conversationId}/read`,
    {
      method: "PATCH",
    }
  );
}