import { addDays, setHours, setMinutes, toDateInputValue } from "../utils/date";

export type CalendarEvent = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  date: string;
  start: string;
  durationMinutes: number;
  participants: string[];
  provider: "Zoom" | "Google Meet" | "Teams" | "Custom";
  meetingLink: string;
  createdBy: string;
};

const now = new Date();
const tomorrow = addDays(now, 1);
const nextTwoDays = addDays(now, 2);

export const mockEvents: CalendarEvent[] = [
  {
    id: "ev-1001",
    projectId: "901",
    title: "Weekly Model Sync",
    description: "Review model KPI deltas and unblock sprint tasks.",
    date: toDateInputValue(tomorrow),
    start: setMinutes(setHours(new Date(tomorrow), 10), 30).toISOString(),
    durationMinutes: 45,
    participants: ["vinay", "saanvi", "rahul"],
    provider: "Teams",
    meetingLink: "https://teams.example.com/901-weekly-model-sync",
    createdBy: "vinay",
  },
  {
    id: "ev-1002",
    projectId: "901",
    title: "Deployment Readiness",
    description: "Finalize release checklist before demo day.",
    date: toDateInputValue(nextTwoDays),
    start: setMinutes(setHours(new Date(nextTwoDays), 14), 0).toISOString(),
    durationMinutes: 30,
    participants: ["vinay", "nora"],
    provider: "Google Meet",
    meetingLink: "https://meet.google.com/mock-901-ready",
    createdBy: "saanvi",
  },
  {
    id: "ev-2001",
    projectId: "902",
    title: "Sensor Calibration Plan",
    description: "Finalize LiDAR + camera calibration sequence for field testing.",
    date: toDateInputValue(tomorrow),
    start: setMinutes(setHours(new Date(tomorrow), 16), 0).toISOString(),
    durationMinutes: 60,
    participants: ["vinay", "arjun", "meera", "karthik"],
    provider: "Zoom",
    meetingLink: "https://zoom.example.com/902-sensor-calibration",
    createdBy: "arjun",
  },
];
