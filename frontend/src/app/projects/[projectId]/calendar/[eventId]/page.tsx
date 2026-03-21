"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/app/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/ui/card";
import { ConfirmationModal } from "@/app/projects/components/meetings";
import type { CalendarEvent } from "@/app/projects/mock/mockEvents";
import { getEventById, removeEvent } from "@/app/projects/utils/event-store";
import { getProjectById } from "@/app/projects/mock/mockProjects";

export default function MeetingDetailsPage({
  params,
}: {
  params: Promise<{ projectId: string; eventId: string }>;
}) {
  const router = useRouter();
  const { projectId, eventId } = use(params);

  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [openCancelConfirm, setOpenCancelConfirm] = useState(false);

  useEffect(() => {
    setHydrated(true);
    setEvent(getEventById(projectId, eventId));
  }, [projectId, eventId]);

  if (!hydrated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading meeting…</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!event) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Meeting not found</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href={`/project/${projectId}/calendar`}>Back to calendar</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const project = getProjectById(projectId);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(event.meetingLink);
    } catch {
      // no-op for unsupported clipboard contexts
    }
  };

  const handleCancelMeeting = () => {
    removeEvent(projectId, event.id);
    router.push(`/project/${projectId}/calendar`);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{event.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {event.date} · {new Date(event.start).toTimeString().slice(0, 5)} · {project.name}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push(`/project/${projectId}/calendar`)}>
              Back to calendar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <div className="font-medium">Description</div>
            <p className="text-muted-foreground">{event.description || "No description"}</p>
          </div>

          <div>
            <div className="font-medium">Participants</div>
            <div className="text-muted-foreground">{event.participants.join(", ") || "No participants"}</div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <div className="font-medium">Provider</div>
              <div className="text-muted-foreground">{event.provider}</div>
            </div>
            <div>
              <div className="font-medium">Meeting link</div>
              <a href={event.meetingLink} target="_blank" rel="noreferrer" className="text-primary underline">
                {event.meetingLink}
              </a>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <a href={event.meetingLink} target="_blank" rel="noreferrer">Join meeting</a>
            </Button>
            <Button variant="outline" onClick={handleCopy}>Copy link</Button>
            <Button variant="outline" onClick={() => router.push(`/project/${projectId}/calendar/edit/${event.id}`)}>
              Edit
            </Button>
            <Button variant="destructive" onClick={() => setOpenCancelConfirm(true)}>
              Cancel meeting
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmationModal
        open={openCancelConfirm}
        title="Cancel this meeting?"
        description="This action removes the meeting from your project calendar."
        confirmText="Cancel meeting"
        onOpenChange={setOpenCancelConfirm}
        onConfirm={handleCancelMeeting}
      />
    </div>
  );
}
