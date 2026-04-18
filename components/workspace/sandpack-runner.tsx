"use client";

import * as React from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
} from "@codesandbox/sandpack-react";

const REACT_TS_DEPS = {
  react: "^19.0.0",
  "react-dom": "^19.0.0",
};

const PLACEHOLDER_FILES: Record<string, string> = {
  "/App.tsx": `export default function App() {
  return (
    <div style={{
      fontFamily: 'ui-sans-serif, system-ui',
      display: 'grid',
      placeItems: 'center',
      minHeight: '100dvh',
      color: '#a1a1aa',
      background: '#09090b',
      padding: 24,
      textAlign: 'center'
    }}>
      <div>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚛️</div>
        <div style={{ color: '#e4e4e7', fontWeight: 600, marginBottom: 6 }}>
          Sandbox ready
        </div>
        <div style={{ fontSize: 13 }}>
          Send a prompt — your app will appear here as the agent writes it.
        </div>
      </div>
    </div>
  );
}
`,
  "/index.tsx": `import { createRoot } from "react-dom/client";
import App from "./App";
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
`,
  "/index.html": `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Preview</title>
<style>html,body,#root{margin:0;padding:0;height:100%;}</style>
</head><body><div id="root"></div></body></html>
`,
};

export type SandpackRunnerProps = {
  files?: Record<string, string>;
  className?: string;
};

/**
 * Wraps Sandpack with our preferred defaults.
 *
 * Files passed in are normalized to leading-slash paths. If `files` is empty
 * (no agent output yet) we render a friendly placeholder instead of a blank
 * white iframe.
 */
export function SandpackRunner({ files, className }: SandpackRunnerProps) {
  const normalized = React.useMemo(() => {
    if (!files || Object.keys(files).length === 0) return PLACEHOLDER_FILES;
    const out: Record<string, string> = {};
    for (const [path, content] of Object.entries(files)) {
      const key = path.startsWith("/") ? path : `/${path}`;
      out[key] = content;
    }
    if (!out["/index.tsx"] && !out["/index.ts"] && !out["/index.jsx"] && !out["/index.js"]) {
      out["/index.tsx"] = PLACEHOLDER_FILES["/index.tsx"];
    }
    if (!out["/index.html"]) out["/index.html"] = PLACEHOLDER_FILES["/index.html"];
    return out;
  }, [files]);

  return (
    <div className={`sandpack-full ${className ?? ""}`}>
      <SandpackProvider
        template="react-ts"
        theme="dark"
        files={normalized}
        customSetup={{ dependencies: REACT_TS_DEPS }}
        options={{
          recompileMode: "delayed",
          recompileDelay: 250,
          activeFile: "/App.tsx",
        }}
      >
        <SandpackLayout>
          <SandpackPreview
            showOpenInCodeSandbox={false}
            showRefreshButton
            showSandpackErrorOverlay
          />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
}
