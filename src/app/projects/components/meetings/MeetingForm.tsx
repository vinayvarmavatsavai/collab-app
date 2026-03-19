"use client";

import { useMemo, useState } from "react";
import { Button } from "@/app/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/ui/card";
import { Input } from "@/app/ui/input";
import { Textarea } from "@/app/ui/textarea";
import type { CalendarEvent } from "@/app/projects/mock/mockEvents";
import { DatePicker } from "./DatePicker";
import { DurationSelector } from "./DurationSelector";
import { MeetingProviderSelect } from "./MeetingProviderSelect";
import { MeetingSummaryCard } from "./MeetingSummaryCard";
import { ParticipantSelector } from "./ParticipantSelector";
import { TimePicker } from "./TimePicker";

export type MeetingFormValue = {
  title: string;
  description: string;
  participants: string[];
  date: string;
  time: string;
  durationMinutes: number;
  provider: CalendarEvent["provider"];
  meetingLink: string;
};

export function toMeetingFormValue(event?: CalendarEvent): MeetingFormValue {
  if (!event) {
    return {
      title: "",
      description: "",
      participants: [],
      date: new Date().toISOString().slice(0, 10),
      time: "09:00",
      durationMinutes: 30,
      provider: "Teams",
      meetingLink: "",
    };
  }

  const start = new Date(event.start);
  return {
    title: event.title,
    description: event.description,
    participants: event.participants,
    date: event.date,
    time: start.toTimeString().slice(0, 5),
    durationMinutes: event.durationMinutes,
    provider: event.provider,
    meetingLink: event.meetingLink,
  };
}

export function MeetingForm({
  initial,
  submitLabel,
  warningMessage,
  onSubmit,
  onCancel,
  onFieldChange,
}: {
  initial: MeetingFormValue;
  submitLabel: string;
  warningMessage?: string;
  onSubmit: (value: MeetingFormValue) => void;
  onCancel: () => void;
  onFieldChange?: (value: MeetingFormValue) => void;
}) {
  const [form, setForm] = useState<MeetingFormValue>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const summaryTitle = useMemo(() => (form.title.trim() ? form.title : "Untitled meeting"), [form.title]);

  const VALIDATED_FIELDS: (keyof MeetingFormValue)[] = ["date", "time", "durationMinutes"];

  const update = <K extends keyof MeetingFormValue>(key: K, value: MeetingFormValue[K]) => {
    const next = { ...form, [key]: value };
    setForm(next);
    if (VALIDATED_FIELDS.includes(key)) {
      onFieldChange?.(next);
    }
  };

  const handleSubmit = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.title.trim()) nextErrors.title = "Title is required";
    if (!form.date) nextErrors.date = "Date is required";
    if (!form.time) nextErrors.time = "Time is required";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSubmit(form);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
      <Card className="border shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="text-base">Meeting details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          {warningMessage ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {warningMessage}
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-medium">Meeting title *</label>
            <Input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="Sprint planning" />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Agenda and context" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Participants</label>
            <ParticipantSelector value={form.participants} onChange={(value) => update("participants", value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date *</label>
              <DatePicker value={form.date} onChange={(value) => update("date", value)} />
              {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Time *</label>
              <TimePicker value={form.time} onChange={(value) => update("time", value)} />
              {errors.time && <p className="text-xs text-destructive">{errors.time}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Duration</label>
              <DurationSelector value={form.durationMinutes} onChange={(value) => update("durationMinutes", value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Meeting provider</label>
              <MeetingProviderSelect value={form.provider} onChange={(value) => update("provider", value as CalendarEvent["provider"])} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Meeting link</label>
            <Input
              value={form.meetingLink}
              onChange={(event) => update("meetingLink", event.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button onClick={handleSubmit}>{submitLabel}</Button>
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        </CardContent>
      </Card>

      <MeetingSummaryCard
        title={summaryTitle}
        date={form.date}
        time={form.time}
        durationMinutes={form.durationMinutes}
        participantCount={form.participants.length}
        provider={form.provider}
      />
    </div>
  );
}
