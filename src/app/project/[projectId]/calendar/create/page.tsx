"use client";

import { use, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MeetingForm, toMeetingFormValue, type MeetingFormValue } from "@/app/project/components/meetings";
import { createEvent, hasEventOverlap } from "@/app/project/utils/event-store";
import { parseEventDateTime } from "@/app/project/utils/date";

export default function CreateMeetingPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projectId } = use(params);
  const [warningMessage, setWarningMessage] = useState("");

  const initial = useMemo(() => {
    const next = toMeetingFormValue();
    const date = searchParams.get("date");
    const time = searchParams.get("time");

    if (date) next.date = date;
    if (time) next.time = time;
    next.meetingLink = `https://meetings.example.com/project/${projectId}/new-meeting`;
    return next;
  }, [projectId, searchParams]);

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

    const event = createEvent({
      projectId,
      title: form.title.trim(),
      description: form.description.trim(),
      date: form.date,
      start: startIso,
      durationMinutes: form.durationMinutes,
      participants: form.participants,
      provider: form.provider,
      meetingLink: form.meetingLink || `https://meetings.example.com/project/${projectId}/${Date.now()}`,
      createdBy: "vinay",
    });

    router.push(`/project/${projectId}/calendar/${event.id}`);
  };

  return (
    <MeetingForm
      initial={initial}
      submitLabel="Create meeting"
      warningMessage={warningMessage}
      onFieldChange={(form) => setWarningMessage(validate(form))}
      onSubmit={handleSubmit}
      onCancel={() => router.push(`/project/${projectId}/calendar`)}
    />
  );
}
