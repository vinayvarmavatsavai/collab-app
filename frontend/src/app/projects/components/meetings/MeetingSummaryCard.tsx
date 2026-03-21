import { Card, CardContent, CardHeader, CardTitle } from "@/app/ui/card";

export function MeetingSummaryCard({
  title,
  date,
  time,
  durationMinutes,
  participantCount,
  provider,
}: {
  title: string;
  date: string;
  time: string;
  durationMinutes: number;
  participantCount: number;
  provider: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Meeting Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="font-medium">{title || "Untitled meeting"}</div>
        <div className="text-muted-foreground">Date: {date || "-"}</div>
        <div className="text-muted-foreground">Time: {time || "-"}</div>
        <div className="text-muted-foreground">Duration: {durationMinutes} mins</div>
        <div className="text-muted-foreground">Participants: {participantCount}</div>
        <div className="text-muted-foreground">Provider: {provider}</div>
      </CardContent>
    </Card>
  );
}
