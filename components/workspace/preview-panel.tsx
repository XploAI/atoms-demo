"use client";

import * as React from "react";
import { Code2, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SandpackRunner } from "./sandpack-runner";
import { CodeTab } from "./code-tab";

export function PreviewPanel({ files }: { files: Record<string, string> }) {
  return (
    <Tabs defaultValue="preview" className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-900 bg-zinc-950/40 px-3 py-2">
        <TabsList>
          <TabsTrigger value="preview">
            <Eye className="h-3 w-3" /> Preview
          </TabsTrigger>
          <TabsTrigger value="code">
            <Code2 className="h-3 w-3" /> Code
          </TabsTrigger>
        </TabsList>
        <span className="text-[10px] uppercase tracking-wider text-zinc-600">
          {Object.keys(files).length} file{Object.keys(files).length === 1 ? "" : "s"}
        </span>
      </div>

      <TabsContent value="preview" className="mt-0 flex-1 overflow-hidden bg-white">
        <SandpackRunner files={files} className="h-full" />
      </TabsContent>

      <TabsContent value="code" className="mt-0 flex-1 overflow-hidden">
        <CodeTab files={files} />
      </TabsContent>
    </Tabs>
  );
}
