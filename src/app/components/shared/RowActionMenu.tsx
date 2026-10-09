import type { ReactNode } from "react";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export function RowActionMenu({
  children,
  label = "Actions",
}: {
  children: ReactNode;
  label?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={label}
          title={label}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[220px] rounded-xl border-gray-200 bg-white py-1.5 shadow-2xl"
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function RowActionItem({
  children,
  icon,
  onSelect,
  destructive = false,
}: {
  children: ReactNode;
  icon: ReactNode;
  onSelect: () => void;
  destructive?: boolean;
}) {
  return (
    <DropdownMenuItem
      onSelect={onSelect}
      className={`gap-3 px-4 py-2.5 ${destructive ? "text-red-600 focus:text-red-700" : ""}`}
    >
      {icon}
      {children}
    </DropdownMenuItem>
  );
}