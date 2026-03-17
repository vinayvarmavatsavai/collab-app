"use client";

import { mockUsers } from "@/app/projects/mock/mockUsers";
import { Badge } from "@/app/ui/badge";
import { Button } from "@/app/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/ui/dropdown-menu";

export function ParticipantSelector({
  value,
  onChange,
}: {
  value: string[];
  onChange: (users: string[]) => void;
}) {
  const allUsernames = mockUsers.map((user) => user.username);
  const allSelected = allUsernames.every((username) => value.includes(username));

  const toggleAll = () => {
    onChange(allSelected ? [] : allUsernames);
  };

  const toggle = (username: string) => {
    if (value.includes(username)) {
      onChange(value.filter((item) => item !== username));
      return;
    }
    onChange([...value, username]);
  };

  return (
    <div className="space-y-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" className="w-full justify-between">
            <span>Select participants</span>
            <span className="text-xs text-muted-foreground">{value.length} selected</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-72 overflow-y-auto">
          <DropdownMenuLabel>Participants</DropdownMenuLabel>
          <DropdownMenuCheckboxItem checked={allSelected} onCheckedChange={toggleAll}>
            All
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          {mockUsers.map((user) => (
            <DropdownMenuCheckboxItem
              key={user.username}
              checked={value.includes(user.username)}
              onCheckedChange={() => toggle(user.username)}
            >
              {user.fullName}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex flex-wrap gap-1">
        {value.length === 0 ? (
          <span className="text-xs text-muted-foreground">No participants selected</span>
        ) : (
          value.map((username) => <Badge key={username} variant="secondary">{username}</Badge>)
        )}
      </div>
    </div>
  );
}
