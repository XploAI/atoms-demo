"use client";

import * as React from "react";
import { Check, ChevronDown, Cpu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ModelOption = {
  id: string;
  name: string;
  hint: string;
};

const MODELS: ModelOption[] = [
  { id: "claude-sonnet-4-6", name: "Sonnet 4.6", hint: "Balanced — recommended" },
  { id: "claude-haiku-4-5-20251001", name: "Haiku 4.5", hint: "Fast & cheap" },
  { id: "claude-opus-4-7", name: "Opus 4.7", hint: "Most capable, slower" },
];

export function ModelPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (model: string) => void;
  disabled?: boolean;
}) {
  const current = MODELS.find((m) => m.id === value) ?? MODELS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-xs text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          <Cpu className="h-3 w-3" />
          {current.name}
          <ChevronDown className="h-3 w-3 text-zinc-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[14rem]">
        {MODELS.map((m) => (
          <DropdownMenuItem
            key={m.id}
            onSelect={() => onChange(m.id)}
            className="flex items-center gap-3"
          >
            <Check
              className={cn(
                "h-3.5 w-3.5",
                m.id === value ? "text-purple-300" : "opacity-0"
              )}
            />
            <div className="flex-1">
              <div className="text-sm">{m.name}</div>
              <div className="text-[11px] text-zinc-500">{m.hint}</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
