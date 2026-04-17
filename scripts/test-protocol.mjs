#!/usr/bin/env node
/**
 * Smoke test for lib/anthropic/protocol.ts. Run with: pnpm tsx scripts/test-protocol.mjs
 *
 * We feed a representative agent response one character at a time (worst-case
 * for tag boundary handling) and assert the final accumulated state.
 */

// Inline a tiny TS-free copy of the parser so we don't need a build step.
// Source of truth lives at lib/anthropic/protocol.ts.

import { ProtocolParser } from "../lib/anthropic/protocol.ts";

const SAMPLE = `<agent role="planner">
- Build a counter
- Add increment / reset
</agent>
<agent role="engineer">
Writing App.tsx now.
</agent>
<file path="App.tsx">
import { useState } from "react";
export default function App() {
  const [n, setN] = useState(0);
  return (
    <div style={{ padding: 24 }}>
      <h1>Count: {n}</h1>
      <button onClick={() => setN(n + 1)}>+1</button>
      <button onClick={() => setN(0)}>Reset</button>
    </div>
  );
}
</file>
<agent role="qa">
Verified click increments and reset returns to 0.
</agent>
<done/>`;

function runOnce(chunkSize) {
  const parser = new ProtocolParser();
  const events = [];
  for (let i = 0; i < SAMPLE.length; i += chunkSize) {
    events.push(...parser.feed(SAMPLE.slice(i, i + chunkSize)));
  }
  events.push(...parser.end());
  return events;
}

function summarize(events) {
  const agents = {};
  const files = {};
  let curAgent = null;
  let curFile = null;
  let done = false;
  for (const e of events) {
    if (e.type === "agent_start") {
      curAgent = e.role;
      agents[curAgent] = "";
    } else if (e.type === "agent_delta") {
      agents[e.role] = (agents[e.role] ?? "") + e.text;
    } else if (e.type === "agent_end") {
      curAgent = null;
    } else if (e.type === "file_start") {
      curFile = e.path;
      files[curFile] = "";
    } else if (e.type === "file_delta") {
      files[e.path] = (files[e.path] ?? "") + e.text;
    } else if (e.type === "file_end") {
      curFile = null;
    } else if (e.type === "done") {
      done = true;
    }
  }
  return { agents, files, done };
}

const expectedAgents = ["planner", "engineer", "qa"];
const expectedFile = "App.tsx";

let pass = 0;
let fail = 0;

for (const chunkSize of [1, 3, 7, 13, 64, 9999]) {
  const events = runOnce(chunkSize);
  const { agents, files, done } = summarize(events);

  const missingAgents = expectedAgents.filter((r) => !agents[r] || !agents[r].trim());
  const ok =
    missingAgents.length === 0 &&
    files[expectedFile] &&
    files[expectedFile].includes("export default function App") &&
    done;

  if (ok) {
    pass++;
    console.log(`✓ chunk=${chunkSize.toString().padStart(4)}  agents=${Object.keys(agents).join(",")}  files=${Object.keys(files).join(",")}`);
  } else {
    fail++;
    console.log(`✗ chunk=${chunkSize.toString().padStart(4)}  missing=${missingAgents.join(",")}  fileOk=${!!files[expectedFile]}  done=${done}`);
  }
}

console.log(`\n${pass} pass / ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
