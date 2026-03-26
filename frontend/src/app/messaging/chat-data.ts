export interface ChatContact {
  id: string;
  name: string;
  initials: string;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
  category: "cohorts" | "communities" | "dms";
  avatarUrl?: string | null;
}

export interface Message {
  id: string;
  sender: "me" | "them";
  text: string;
  time: string;
}