"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Settings, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Project } from "@/lib/db/schema";

export function Topbar({
  project,
  onOpenSettings,
  onShare,
  rightSlot,
  status,
}: {
  project: Project;
  onOpenSettings?: () => void;
  onShare?: () => void;
  rightSlot?: React.ReactNode;
  status?: string;
}) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-zinc-900 bg-zinc-950/80 px-3 backdrop-blur">
      <Link
        href="/"
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Home
      </Link>
      <div className="h-4 w-px bg-zinc-800" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-zinc-100">{project.title}</div>
        {status && (
          <div className="truncate text-[10px] uppercase tracking-wider text-zinc-500">
            {status}
          </div>
        )}
      </div>
      {rightSlot}
      {onShare && (
        <Button variant="ghost" size="sm" onClick={onShare} className="gap-1.5">
          <Share2 className="h-3.5 w-3.5" /> Share
        </Button>
      )}
      {onOpenSettings && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSettings}
          aria-label="Settings"
          className="h-8 w-8"
        >
          <Settings className="h-4 w-4" />
        </Button>
      )}
    </header>
  );
}
