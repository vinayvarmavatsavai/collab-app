export interface ChatContact {
  id: string
  name: string
  initials: string
  lastMessage: string
  timestamp: string
  unread?: boolean
  category: "cohorts" | "communities" | "dms"
}

export interface Message {
  id: string
  sender: "me" | "them"
  text: string
  time: string
}

export const contacts: ChatContact[] = [
  {
    id: "1",
    name: "Startup Cohort 2026",
    initials: "SC",
    lastMessage: "Welcome aboard! Let's get started with...",
    timestamp: "2m",
    unread: true,
    category: "cohorts",
  },
  {
    id: "2",
    name: "AI Builders Cohort",
    initials: "AB",
    lastMessage: "The next session is scheduled for...",
    timestamp: "1h",
    category: "cohorts",
  },
  {
    id: "3",
    name: "FinTech Network",
    initials: "FN",
    lastMessage: "Great news! We secured a partnership...",
    timestamp: "3h",
    unread: true,
    category: "communities",
  },
  {
    id: "4",
    name: "Founders Circle",
    initials: "FC",
    lastMessage: "Don't forget about the pitch night...",
    timestamp: "5h",
    category: "communities",
  },
  {
    id: "5",
    name: "Climate Innovators",
    initials: "CI",
    lastMessage: "Shared the deck in the drive folder.",
    timestamp: "1d",
    category: "communities",
  },
  {
    id: "6",
    name: "Sarah Chen",
    initials: "SC",
    lastMessage: "Thanks for the feedback on the pitch!",
    timestamp: "10m",
    unread: true,
    category: "dms",
  },
  {
    id: "7",
    name: "Alex Rivera",
    initials: "AR",
    lastMessage: "Can we sync up tomorrow morning?",
    timestamp: "2h",
    category: "dms",
  },
  {
    id: "8",
    name: "Priya Sharma",
    initials: "PS",
    lastMessage: "I sent over the contract. Please review.",
    timestamp: "4h",
    category: "dms",
  },
]

export const dummyMessages: Record<string, Message[]> = {
  "1": [
    { id: "m1", sender: "them", text: "Welcome to Startup Cohort 2026! We're excited to have you.", time: "9:00 AM" },
    { id: "m2", sender: "them", text: "Please review the onboarding materials shared in the resources tab.", time: "9:01 AM" },
    { id: "m3", sender: "me", text: "Thanks! Just went through the overview doc. Looks great.", time: "9:15 AM" },
    { id: "m4", sender: "them", text: "Perfect. Our kickoff session is next Monday at 10 AM. See you there!", time: "9:18 AM" },
    { id: "m5", sender: "me", text: "Looking forward to it. Quick question -- will mentors be assigned this week?", time: "9:22 AM" },
    { id: "m6", sender: "them", text: "Yes! Mentor assignments go out on Friday. You'll get an email notification.", time: "9:25 AM" },
  ],
  "6": [
    { id: "m1", sender: "them", text: "Hey! I just watched the recording of your pitch. Really compelling narrative.", time: "2:30 PM" },
    { id: "m2", sender: "me", text: "Thanks Sarah! I reworked the slides based on your earlier suggestions.", time: "2:32 PM" },
    { id: "m3", sender: "them", text: "It shows. The market sizing section is much stronger now.", time: "2:33 PM" },
    { id: "m4", sender: "me", text: "Appreciate it. Any thoughts on the financial projections slide?", time: "2:35 PM" },
    { id: "m5", sender: "them", text: "I'd add a sensitivity analysis. Investors love seeing that you've stress-tested your assumptions.", time: "2:38 PM" },
    { id: "m6", sender: "me", text: "Great call. I'll add that before the demo day.", time: "2:40 PM" },
    { id: "m7", sender: "them", text: "Thanks for the feedback on the pitch!", time: "2:45 PM" },
  ],
}

// Provide a generic fallback for contacts without specific messages
export function getMessagesForContact(contactId: string): Message[] {
  if (dummyMessages[contactId]) return dummyMessages[contactId]
  return [
    { id: "g1", sender: "them", text: "Hey there! How's everything going?", time: "10:00 AM" },
    { id: "g2", sender: "me", text: "Going well, thanks! Been busy with the new project.", time: "10:05 AM" },
    { id: "g3", sender: "them", text: "That sounds exciting. Let me know if you need any help.", time: "10:08 AM" },
  ]
}
