/**
 * Streaming parser for the Atoms agent protocol.
 *
 * Feeds raw token-stream deltas in, emits typed structural events out.
 * Robust to tag boundaries split across chunks.
 *
 * Supported tags (no nesting):
 *   <agent role="planner|engineer|qa"> ... </agent>
 *   <file path="..."> ... </file>
 *   <done/>
 *
 * Unknown text outside tags is emitted as `text_delta` events (skipped if
 * whitespace-only).
 */

export type AgentRole = "planner" | "engineer" | "qa";

export type StreamEvent =
  | { type: "agent_start"; role: AgentRole }
  | { type: "agent_delta"; role: AgentRole; text: string }
  | { type: "agent_end"; role: AgentRole }
  | { type: "file_start"; path: string }
  | { type: "file_delta"; path: string; text: string }
  | { type: "file_end"; path: string }
  | { type: "text_delta"; text: string }
  | { type: "done" };

const AGENT_OPEN = /<agent\s+role="(planner|engineer|qa)"\s*>/;
const FILE_OPEN = /<file\s+path="([^"]+)"\s*>/;
const DONE_TAG = /<done\s*\/>/;

const AGENT_CLOSE = "</agent>";
const FILE_CLOSE = "</file>";

/** How many trailing chars to keep buffered in case they're the start of a closing tag. */
const TAIL_SAFETY_AGENT = AGENT_CLOSE.length;
const TAIL_SAFETY_FILE = FILE_CLOSE.length;
const TAIL_SAFETY_IDLE = Math.max(
  '<agent role="planner">'.length, // longest open we might be mid-typing
  '<file path="">'.length,
  "<done/>".length
);

type State =
  | { kind: "idle" }
  | { kind: "agent"; role: AgentRole }
  | { kind: "file"; path: string };

export class ProtocolParser {
  private buffer = "";
  private state: State = { kind: "idle" };

  /** Push a new chunk; receive any newly-determinable events. */
  feed(chunk: string): StreamEvent[] {
    this.buffer += chunk;
    const out: StreamEvent[] = [];
    let progress = true;
    // Keep grinding through the buffer until we either:
    //   - Can't find a complete tag boundary in the current state, AND
    //   - Have flushed every safe content delta.
    while (progress) {
      progress = this.step(out);
    }
    return out;
  }

  /** Flush whatever's left in the buffer at end-of-stream. */
  end(): StreamEvent[] {
    const out: StreamEvent[] = [];
    if (this.state.kind === "agent") {
      if (this.buffer) {
        out.push({ type: "agent_delta", role: this.state.role, text: this.buffer });
        this.buffer = "";
      }
      out.push({ type: "agent_end", role: this.state.role });
    } else if (this.state.kind === "file") {
      if (this.buffer) {
        out.push({ type: "file_delta", path: this.state.path, text: this.buffer });
        this.buffer = "";
      }
      out.push({ type: "file_end", path: this.state.path });
    }
    this.state = { kind: "idle" };
    return out;
  }

  private step(out: StreamEvent[]): boolean {
    if (this.state.kind === "idle") {
      return this.stepIdle(out);
    }
    if (this.state.kind === "agent") {
      return this.stepInside(out, AGENT_CLOSE, TAIL_SAFETY_AGENT, (text) => ({
        type: "agent_delta",
        role: (this.state as { kind: "agent"; role: AgentRole }).role,
        text,
      }), () => ({
        type: "agent_end",
        role: (this.state as { kind: "agent"; role: AgentRole }).role,
      }));
    }
    return this.stepInside(out, FILE_CLOSE, TAIL_SAFETY_FILE, (text) => ({
      type: "file_delta",
      path: (this.state as { kind: "file"; path: string }).path,
      text,
    }), () => ({
      type: "file_end",
      path: (this.state as { kind: "file"; path: string }).path,
    }));
  }

  /** Idle: look for the next opening tag (or <done/>). */
  private stepIdle(out: StreamEvent[]): boolean {
    const candidates: Array<{ index: number; match: RegExpMatchArray; kind: "agent" | "file" | "done" }> = [];

    const a = this.buffer.match(AGENT_OPEN);
    if (a && a.index !== undefined) candidates.push({ index: a.index, match: a, kind: "agent" });

    const f = this.buffer.match(FILE_OPEN);
    if (f && f.index !== undefined) candidates.push({ index: f.index, match: f, kind: "file" });

    const d = this.buffer.match(DONE_TAG);
    if (d && d.index !== undefined) candidates.push({ index: d.index, match: d, kind: "done" });

    if (candidates.length === 0) {
      // No complete tag in buffer. Hold tail in case a tag is forming.
      const flushUpTo = Math.max(0, this.buffer.length - TAIL_SAFETY_IDLE);
      const text = this.buffer.slice(0, flushUpTo);
      if (text) {
        if (text.trim()) out.push({ type: "text_delta", text });
        this.buffer = this.buffer.slice(flushUpTo);
      }
      return false;
    }

    candidates.sort((x, y) => x.index - y.index);
    const next = candidates[0];

    // Drop / surface content before the next tag.
    if (next.index > 0) {
      const before = this.buffer.slice(0, next.index);
      if (before.trim()) out.push({ type: "text_delta", text: before });
    }
    this.buffer = this.buffer.slice(next.index + next.match[0].length);

    if (next.kind === "agent") {
      const role = next.match[1] as AgentRole;
      this.state = { kind: "agent", role };
      out.push({ type: "agent_start", role });
    } else if (next.kind === "file") {
      const path = next.match[1];
      this.state = { kind: "file", path };
      out.push({ type: "file_start", path });
    } else {
      out.push({ type: "done" });
    }
    return true;
  }

  /** Inside a tagged block: stream content, look for the closing tag. */
  private stepInside(
    out: StreamEvent[],
    closeTag: string,
    tailSafety: number,
    makeDelta: (text: string) => StreamEvent,
    makeEnd: () => StreamEvent
  ): boolean {
    const closeIdx = this.buffer.indexOf(closeTag);
    if (closeIdx === -1) {
      // No close yet — flush most of what we have but hold the tail in case
      // it's the prefix of the closing tag.
      const flushUpTo = Math.max(0, this.buffer.length - tailSafety);
      if (flushUpTo > 0) {
        out.push(makeDelta(this.buffer.slice(0, flushUpTo)));
        this.buffer = this.buffer.slice(flushUpTo);
        return true; // keep stepping in case more flush chunks accumulate
      }
      return false;
    }
    // Closing tag found: flush content + emit end + transition to idle.
    if (closeIdx > 0) out.push(makeDelta(this.buffer.slice(0, closeIdx)));
    this.buffer = this.buffer.slice(closeIdx + closeTag.length);
    out.push(makeEnd());
    this.state = { kind: "idle" };
    return true;
  }
}
