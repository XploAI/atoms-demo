"use client";

import * as React from "react";

const STORAGE_KEY = "atoms-demo:anthropic-key";

/** Browser-side key store. The key never leaves the user's device except as a request header. */
export function readStoredKey(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeStoredKey(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, key);
    window.dispatchEvent(new Event("byok:changed"));
  } catch {
    /* ignore quota / private mode errors */
  }
}

export function clearStoredKey() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("byok:changed"));
  } catch {
    /* ignore */
  }
}

/**
 * React hook returning the currently-stored Anthropic key (or null) and helpers
 * to mutate it. Updates across tabs/components via a custom event.
 */
export function useAnthropicKey() {
  const [key, setKey] = React.useState<string | null>(null);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setKey(readStoredKey());
    setHydrated(true);
    const onChange = () => setKey(readStoredKey());
    window.addEventListener("byok:changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("byok:changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return {
    key,
    hydrated,
    save: (k: string) => {
      writeStoredKey(k);
      setKey(k);
    },
    clear: () => {
      clearStoredKey();
      setKey(null);
    },
  };
}

/** Mask a key for display: first 7 + last 4. */
export function maskKey(key: string): string {
  if (key.length <= 11) return "•".repeat(key.length);
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}
