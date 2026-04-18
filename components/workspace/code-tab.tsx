"use client";

import * as React from "react";
import { File } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function CodeTab({
  files,
  streamingPath,
}: {
  files: Record<string, string>;
  streamingPath?: string | null;
}) {
  const fileNames = Object.keys(files).sort();
  const [active, setActive] = React.useState<string | null>(fileNames[0] ?? null);

  React.useEffect(() => {
    if (!active && fileNames.length) setActive(fileNames[0]);
    if (active && !files[active] && fileNames.length) setActive(fileNames[0]);
  }, [files, fileNames, active]);

  // When a new file starts streaming, jump to it so users see it being written.
  React.useEffect(() => {
    if (streamingPath && files[streamingPath] !== undefined) setActive(streamingPath);
  }, [streamingPath, files]);

  if (fileNames.length === 0) {
    return (
      <div className="grid h-full place-items-center text-xs text-zinc-600">
        No files yet — send a prompt to get started.
      </div>
    );
  }

  const activeContent = active ? files[active] : "";

  return (
    <div className="grid h-full grid-cols-[180px_1fr]">
      <ScrollArea className="border-r border-zinc-900 bg-zinc-950/40">
        <ul className="p-1.5">
          {fileNames.map((name) => (
            <li key={name}>
              <button
                onClick={() => setActive(name)}
                className={cn(
                  "flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-xs transition-colors",
                  active === name
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                )}
              >
                <File className="h-3 w-3 shrink-0" />
                <span className="truncate font-mono">{name}</span>
              </button>
            </li>
          ))}
        </ul>
      </ScrollArea>
      <ScrollArea className="bg-zinc-950">
        <pre className="p-4 font-mono text-xs leading-relaxed text-zinc-200">
          <code>{activeContent}</code>
        </pre>
      </ScrollArea>
    </div>
  );
}
