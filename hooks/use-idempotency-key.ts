"use client";

import { useRef } from "react";

/**
 * The key to send with a write. It stays the same while the request body is the same, so a double click
 * is recognised as one request, and it changes when the body changes, so correcting a rejected form and
 * sending it again is not mistaken for a replay of the first attempt.
 */
export function useIdempotencyKey() {
  const last = useRef<{ signature: string; key: string } | null>(null);
  return (body: unknown): string => {
    const signature = JSON.stringify(body ?? null);
    if (!last.current || last.current.signature !== signature) {
      last.current = { signature, key: crypto.randomUUID() };
    }
    return last.current.key;
  };
}
