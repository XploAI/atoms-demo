"use client";

import * as React from "react";
import { Code2, Eye, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SandpackRunner } from "./sandpack-runner";
import { CodeTab } from "./code-tab";

export function PreviewPanel({
  files,
  draftFiles,
  streamingPath,
  pending,
}: {
  /** Files committed to Sandpack — only updated on file_end / persisted. */
  files: Record<string, string>;
  /** Files including the currently-streaming file; used for the Code tab. */
  draftFiles?: Record<string, string>;
  /** The path of the file currently being streamed, if any. */
  streamingPath?: string | null;
  pending?: boolean;
}) {
  const codeFiles = draftFiles ?? files;
  const fileCount = Object.keys(codeFiles).length;

  return (
    <Tabs defaultValue="preview" className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-900 bg-zinc-950/40 px-3 py-2">
        <TabsList>
          <TabsTrigger value="preview">
            <Eye className="h-3 w-3" /> Preview
          </TabsTrigger>
          <TabsTrigger value="code">
            <Code2 className="h-3 w-3" /> Code
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-zinc-600">
          {pending && streamingPath && (
            <span className="flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-purple-200">
              <Loader2 className="h-3 w-3 animate-spin" />
              writing {streamingPath}
            </span>
          )}
          <span>
            {fileCount} file{fileCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <TabsContent value="preview" className="mt-0 flex-1 overflow-hidden bg-white">
        <SandpackRunner files={files} className="h-full" />
      </TabsContent>

      <TabsContent value="code" className="mt-0 flex-1 overflow-hidden">
        <CodeTab files={codeFiles} streamingPath={streamingPath ?? null} />
      </TabsContent>
    </Tabs>
  );
}
