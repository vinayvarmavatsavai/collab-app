"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AvailabilityGrid, DatePicker } from "@/app/project/components/meetings";
import type { AvailabilitySlot } from "@/app/project/mock/mockAvailability";
import { mockAvailability } from "@/app/project/mock/mockAvailability";
import { mockUsers } from "@/app/project/mock/mockUsers";
import { Button } from "@/app/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/ui/card";
import { Input } from "@/app/ui/input";
import { Textarea } from "@/app/ui/textarea";

export default function PublicSchedulePage({
  params,
}: {
  params: Promise<{ projectId: string; username: string }>;
}) {
  const router = useRouter();
  const { projectId, username } = use(params);

  const host = mockUsers.find((user) => user.username === username) ?? {
    username,
    fullName: username,
    role: "Host",
    email: "",
  };

  const initialDate = mockAvailability.find((slot) => slot.username === username)?.date ?? new Date().toISOString().slice(0, 10);

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const slots = useMemo(
    () => mockAvailability.filter((slot) => slot.username === username && slot.date === selectedDate),
    [username, selectedDate],
  );

  const handleBook = () => {
    if (!selectedSlot || !name.trim() || !email.trim()) return;

    const query = new URLSearchParams({
      date: selectedSlot.date,
      time: selectedSlot.timeLabel,
      link: `https://meetings.example.com/public/${projectId}/${username}/${Date.now()}`,
      host: host.fullName,
      attendee: name.trim(),
      notes: notes.trim(),
    });

    router.push(`/project/${projectId}/calendar/booking/confirmation?${query.toString()}`);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Host</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="font-medium">{host.fullName}</div>
          <div className="text-muted-foreground">{host.role}</div>
          <p className="text-muted-foreground">Pick a time that works and book instantly.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Choose a slot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs">
            <DatePicker value={selectedDate} onChange={setSelectedDate} />
          </div>

          <AvailabilityGrid
            slots={slots}
            selectedSlotId={selectedSlot?.id ?? null}
            onSelect={(slot) => setSelectedSlot(slot)}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Your name" value={name} onChange={(event) => setName(event.target.value)} />
            <Input placeholder="Your email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>

          <Textarea placeholder="Notes" value={notes} onChange={(event) => setNotes(event.target.value)} />

          <Button onClick={handleBook} disabled={!selectedSlot || !name.trim() || !email.trim()}>
            Book meeting
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
