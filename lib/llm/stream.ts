import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export type LLMProvider = "anthropic" | "deepseek";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type StreamArgs = {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  system: string;
  messages: ChatTurn[];
  maxTokens?: number;
  signal?: AbortSignal;
};

/**
 * Uniform text-delta iterator across providers.
 *
 * Both branches ultimately yield plain strings so our downstream
 * ProtocolParser doesn't care which model wrote them.
 */
export async function* streamCompletion(args: StreamArgs): AsyncGenerator<string, void, void> {
  if (args.provider === "anthropic") {
    yield* streamAnthropic(args);
  } else {
    yield* streamDeepseek(args);
  }
}

async function* streamAnthropic(args: StreamArgs): AsyncGenerator<string, void, void> {
  const client = new Anthropic({ apiKey: args.apiKey });
  const stream = await client.messages.create(
    {
      model: args.model,
      max_tokens: args.maxTokens ?? 8000,
      system: args.system,
      messages: args.messages as Anthropic.MessageParam[],
      stream: true,
    },
    { signal: args.signal }
  );
  for await (const chunk of stream) {
    if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
      yield chunk.delta.text;
    }
  }
}

async function* streamDeepseek(args: StreamArgs): AsyncGenerator<string, void, void> {
  const client = new OpenAI({
    apiKey: args.apiKey,
    baseURL: "https://api.deepseek.com",
  });
  const stream = await client.chat.completions.create(
    {
      model: args.model,
      max_tokens: args.maxTokens ?? 6000,
      stream: true,
      messages: [
        { role: "system", content: args.system },
        ...args.messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
    },
    { signal: args.signal }
  );
  for await (const chunk of stream) {
    const text = chunk.choices?.[0]?.delta?.content;
    if (text) yield text;
  }
}
