"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MeetingForm, toMeetingFormValue, type MeetingFormValue } from "@/app/projects/components/meetings";
import type { CalendarEvent } from "@/app/project/mock/mockEvents";
import { getEventById, hasEventOverlap, updateEvent } from "@/app/projects/utils/event-store";
import { parseEventDateTime } from "@/app/projects/utils/date";

export default function EditMeetingPage({
  params,
}: {
  params: Promise<{ projectId: string; eventId: string }>;
}) {
  const router = useRouter();
  const { projectId, eventId } = use(params);

  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  useEffect(() => {
    setHydrated(true);
    setEvent(getEventById(projectId, eventId));
  }, [projectId, eventId]);

  if (!hydrated) {
    return <div className="text-sm text-muted-foreground">Loading meeting...</div>;
  }

  if (!event) {
    return <div className="text-sm text-muted-foreground">Meeting not found.</div>;
  }

  const validate = (form: MeetingFormValue): string => {
    const start = parseEventDateTime(form.date, form.time);
    if (start.getTime() < Date.now()) {
      return "Meetings cannot be scheduled in the past. Please choose a future date and time.";
    }
    if (
      hasEventOverlap({
        projectId,
        start: start.toISOString(),
        durationMinutes: form.durationMinutes,
        excludeEventId: eventId,
      })
    ) {
      return "This time overlaps with an existing meeting. Choose a different slot.";
    }
    return "";
  };

  const handleSubmit = (form: MeetingFormValue) => {
    const msg = validate(form);
    if (msg) {
      setWarningMessage(msg);
      return;
    }

    setWarningMessage("");

    const startIso = parseEventDateTime(form.date, form.time).toISOString();

    updateEvent(projectId, eventId, {
      title: form.title.trim(),
      description: form.description.trim(),
      date: form.date,
      start: startIso,
      durationMinutes: form.durationMinutes,
      participants: form.participants,
      provider: form.provider,
      meetingLink: form.meetingLink,
    });

    router.push(`/project/${projectId}/calendar/${eventId}`);
  };

  return (
    <MeetingForm
      initial={toMeetingFormValue(event)}
      submitLabel="Save changes"
      warningMessage={warningMessage}
      onFieldChange={(form) => setWarningMessage(validate(form))}
      onSubmit={handleSubmit}
      onCancel={() => router.push(`/project/${projectId}/calendar/${eventId}`)}
    />
  );
}
