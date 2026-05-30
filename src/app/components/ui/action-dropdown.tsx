"use client";

import React from "react";
import { MoreVertical, LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/app/components/ui/dropdown-menu";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";

export interface ActionItem {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "default" | "blue" | "orange";
  isSeparator?: boolean;
  sectionLabel?: string;
  hidden?: boolean;
}

interface ActionDropdownProps {
  actions: ActionItem[];
  align?: "start" | "end";
  triggerClassName?: string;
  menuWidth?: string;
}

export function ActionDropdown({
  actions,
  align = "end",
  triggerClassName,
  menuWidth = "w-64",
}: ActionDropdownProps) {
  const visibleActions = actions.filter((action) => !action.hidden);

  if (visibleActions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "h-12 w-12 p-0 rounded-2xl text-foreground/20 hover:text-foreground hover:bg-surface-elevated hover:bg-foreground/5 transition-all outline-none",
            triggerClassName
          )}
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        sideOffset={8}
        collisionPadding={16}
        className={cn("p-2 bg-surface border border-border rounded-[28px] shadow-2xl z-[110]", menuWidth)}
      >
        {visibleActions.map((action, index) => (
          <React.Fragment key={index}>
            {action.sectionLabel && (
              <div className="px-4 py-3 border-b border-border mb-2">
                <p className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.3em]">
                  {action.sectionLabel}
                </p>
              </div>
            )}
            {action.isSeparator && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onSelect={() => {
                setTimeout(() => {
                  document.body.style.pointerEvents = "";
                  document.body.style.overflow = "";
                  action.onClick();
                }, 150);
              }}
              className={cn(
                "flex items-center space-x-3 p-4 rounded-2xl cursor-pointer transition-all outline-none group focus:bg-primary focus:text-white",
                action.variant === "blue" ? "text-primary" : "",
                action.variant === "orange" ? "text-accent-orange" : ""
              )}
            >
              <action.icon className="w-4 h-4 opacity-40 group-focus:opacity-100 transition-opacity" />
              <span className="text-xs font-black">{action.label}</span>
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
