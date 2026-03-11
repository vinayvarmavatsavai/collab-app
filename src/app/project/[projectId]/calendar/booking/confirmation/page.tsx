"use client";

import { use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/app/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/ui/card";

export default function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const searchParams = useSearchParams();
  const { projectId } = use(params);

  const date = searchParams.get("date") ?? "-";
  const time = searchParams.get("time") ?? "-";
  const host = searchParams.get("host") ?? "Host";
  const attendee = searchParams.get("attendee") ?? "Attendee";
  const link = searchParams.get("link") ?? "https://meetings.example.com";

  const addToCalendarHref = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Meeting+with+${encodeURIComponent(host)}&dates=${date.replaceAll("-", "")}/${date.replaceAll("-", "")}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // no-op
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking confirmed</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="rounded-md border bg-muted/40 p-3">
          <div className="font-medium">{attendee} ↔ {host}</div>
          <div className="text-muted-foreground">{date} at {time}</div>
          <a href={link} target="_blank" rel="noreferrer" className="text-primary underline">
            {link}
          </a>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <a href={addToCalendarHref} target="_blank" rel="noreferrer">Add to calendar</a>
          </Button>
          <Button variant="outline" onClick={copyLink}>Copy link</Button>
          <Button variant="outline" asChild>
            <Link href={`/project/${projectId}`}>Return to project</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
