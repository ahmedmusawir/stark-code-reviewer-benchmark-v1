import React from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { LayoutDashboard, UserPlus } from "lucide-react";
import Link from "next/link";

const SuperadminSidebar = () => {
  return (
    <Command className="bg-secondary">
      <CommandInput placeholder="Type a command or search..." />
      <CommandList className="px-8">
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="User Management">
          <CommandItem>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <Link href="/superadmin-portal">Dashboard</Link>
          </CommandItem>
          <CommandItem>
            <UserPlus className="mr-2 h-4 w-4" />
            <Link href="/superadmin-portal/add-user">Add User</Link>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
      </CommandList>
    </Command>
  );
};

export default SuperadminSidebar;
