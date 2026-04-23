import type { LLMProvider } from "./stream";

/** Identifiers surfaced to the client. */
export type ModelId =
  | "claude-sonnet-4-6"
  | "claude-haiku-4-5-20251001"
  | "claude-opus-4-7"
  | "deepseek-chat";

export type ModelInfo = {
  id: ModelId;
  label: string;
  hint: string;
  provider: LLMProvider;
  /** Free tier models are usable without a BYOK key (subject to IP rate limit). */
  freeTier: boolean;
};

export const MODELS: Record<ModelId, ModelInfo> = {
  "deepseek-chat": {
    id: "deepseek-chat",
    label: "DeepSeek V3",
    hint: "Free · 3/IP",
    provider: "deepseek",
    freeTier: true,
  },
  "claude-sonnet-4-6": {
    id: "claude-sonnet-4-6",
    label: "Sonnet 4.6",
    hint: "Recommended (BYOK)",
    provider: "anthropic",
    freeTier: false,
  },
  "claude-haiku-4-5-20251001": {
    id: "claude-haiku-4-5-20251001",
    label: "Haiku 4.5",
    hint: "Fast & cheap (BYOK)",
    provider: "anthropic",
    freeTier: false,
  },
  "claude-opus-4-7": {
    id: "claude-opus-4-7",
    label: "Opus 4.7",
    hint: "Most capable (BYOK)",
    provider: "anthropic",
    freeTier: false,
  },
};

export const DEFAULT_MODEL_FREE: ModelId = "deepseek-chat";
export const DEFAULT_MODEL_BYOK: ModelId = "claude-sonnet-4-6";

export function isKnownModel(x: string): x is ModelId {
  return Object.prototype.hasOwnProperty.call(MODELS, x);
}

export function modelInfoOrDefault(x: string | undefined, hasByok: boolean): ModelInfo {
  if (x && isKnownModel(x)) {
    const info = MODELS[x];
    // Users without a BYOK key can only use free-tier models.
    if (info.freeTier || hasByok) return info;
  }
  return MODELS[hasByok ? DEFAULT_MODEL_BYOK : DEFAULT_MODEL_FREE];
}
