"use client";

import { usePathname } from "next/navigation";
import { getProjectById } from "@/app/project/mock/mockProjects";
import { Button } from "@/app/ui/button";

function getTitle(pathname: string) {
  if (pathname.includes("/calendar/create")) return "Create Meeting";
  if (pathname.includes("/calendar/edit/")) return "Edit Meeting";
  if (pathname.includes("/calendar/schedule/")) return "Public Scheduling";
  if (pathname.includes("/calendar/booking/confirmation")) return "Booking Confirmation";
  if (pathname.includes("/calendar/")) return "Meeting Details";
  if (pathname.endsWith("/calendar")) return "Meetings";
  return "Project Dashboard";
}

export function ProjectShell({
  projectId,
  children,
}: {
  projectId: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const project = getProjectById(projectId);

  return (
    <div className="h-dvh flex flex-col bg-background">
      <header className="shrink-0 sticky top-0 z-20 border-b bg-background/95 backdrop-blur px-4 py-3 md:px-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold md:text-lg">{getTitle(pathname)}</h1>
            <p className="text-xs text-muted-foreground md:text-sm">{project.name}</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" disabled>
            <span aria-hidden>📅</span>
            <span>Meetings</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-hidden px-4 py-4 md:px-6 md:py-6">{children}</main>
    </div>
  );
}
