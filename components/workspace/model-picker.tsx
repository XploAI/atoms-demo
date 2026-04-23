"use client";

import * as React from "react";
import { Check, ChevronDown, Cpu, Lock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MODELS, type ModelId } from "@/lib/llm/models";
import { cn } from "@/lib/utils";

export function ModelPicker({
  value,
  onChange,
  disabled,
  hasByok,
  onLockedClick,
}: {
  value: string;
  onChange: (model: ModelId) => void;
  disabled?: boolean;
  hasByok: boolean;
  /** Fired when the user clicks a locked (BYOK-only) model without a key. */
  onLockedClick?: () => void;
}) {
  const current = MODELS[value as ModelId] ?? MODELS["deepseek-chat"];
  const ordered = Object.values(MODELS);
  const freeModels = ordered.filter((m) => m.freeTier);
  const byokModels = ordered.filter((m) => !m.freeTier);

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
          {current.label}
          <ChevronDown className="h-3 w-3 text-zinc-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[16rem]">
        {freeModels.map((m) => (
          <ModelRow
            key={m.id}
            model={m}
            active={m.id === value}
            onSelect={() => onChange(m.id)}
          />
        ))}
        <DropdownMenuSeparator />
        <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-600">
          Claude · bring your own key
        </div>
        {byokModels.map((m) => {
          const locked = !hasByok;
          return (
            <ModelRow
              key={m.id}
              model={m}
              active={m.id === value}
              locked={locked}
              onSelect={() => (locked ? onLockedClick?.() : onChange(m.id))}
            />
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ModelRow({
  model,
  active,
  locked,
  onSelect,
}: {
  model: (typeof MODELS)[ModelId];
  active: boolean;
  locked?: boolean;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem
      onSelect={(e) => {
        e.preventDefault();
        onSelect();
      }}
      className={cn("flex items-center gap-3", locked && "opacity-60")}
    >
      <Check
        className={cn("h-3.5 w-3.5", active ? "text-purple-300" : "opacity-0")}
      />
      <div className="flex-1">
        <div className="flex items-center gap-1.5 text-sm">
          {model.label}
          {locked && <Lock className="h-3 w-3 text-zinc-500" />}
        </div>
        <div className="text-[11px] text-zinc-500">{model.hint}</div>
      </div>
    </DropdownMenuItem>
  );
}
