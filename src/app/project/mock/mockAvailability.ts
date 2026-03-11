export type AvailabilitySlot = {
  id: string;
  username: string;
  date: string;
  timeLabel: string;
  isoStart: string;
  minutes: number;
};

export const mockAvailability: AvailabilitySlot[] = [
  {
    id: "a1",
    username: "saanvi",
    date: "2026-03-14",
    timeLabel: "09:30",
    isoStart: "2026-03-14T09:30:00.000Z",
    minutes: 30,
  },
  {
    id: "a2",
    username: "saanvi",
    date: "2026-03-14",
    timeLabel: "10:30",
    isoStart: "2026-03-14T10:30:00.000Z",
    minutes: 30,
  },
  {
    id: "a3",
    username: "saanvi",
    date: "2026-03-15",
    timeLabel: "14:00",
    isoStart: "2026-03-15T14:00:00.000Z",
    minutes: 45,
  },
  {
    id: "a4",
    username: "saanvi",
    date: "2026-03-15",
    timeLabel: "16:30",
    isoStart: "2026-03-15T16:30:00.000Z",
    minutes: 30,
  },
];
