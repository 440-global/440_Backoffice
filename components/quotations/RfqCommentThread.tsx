"use client";

import { useEffect, useRef, useState } from "react";
import QuotationLoader from "@/components/quotations/QuotationLoader";
import { RiLoader4Fill } from "react-icons/ri";

export type RfqSessionComment = {
  at: string;
  text: string;
  id?: number | string;
  /** Audit `adminName`, or fallback label */
  authorLabel?: string;
};

type Props = {
  messages: RfqSessionComment[];
  onSend: (text: string) => void | Promise<void>;
  /** GET audit log / comments */
  isLoading?: boolean;
  /** POST comment in flight */
  isSending?: boolean;
};

/**
 * Comment UI aligned with `Quotations/Comment.tsx`: scroll thread + sticky textarea bar,
 * explicit light/dark text colors so typed content stays visible.
 */
export default function RfqCommentThread({
  messages,
  onSend,
  isLoading = false,
  isSending = false,
}: Props) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const t = draft.trim();
    if (!t || isSending) return;
    try {
      await Promise.resolve(onSend(t));
      setDraft("");
    } catch {
      /* parent shows error banner */
    }
  };

  if (isLoading) {
    return <QuotationLoader />;
  }

  /**
   * Same structure as `Quotations/Comment.tsx`: column `flex flex-col` with fixed height from parent,
   * scrollable messages (`flex-1 overflow-y-auto`), input bar as last sibling (`shrink-0`, full-width border-t).
   */
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 pt-3 pb-2">
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[160px] items-center justify-center text-sm text-(--muted)">
            No comments yet.
          </div>
        ) : (
          [...messages].reverse().map((result, i) => (
            <div key={result.id != null ? String(result.id) : `${result.at}-${i}`} className="flex gap-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-(--table-border) bg-(--elevated) text-sm font-bold text-(--primary)"
                aria-hidden
              >
                Y
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-(--text)">{result.authorLabel ?? "Comment"}</p>
                <p className="mt-1 text-sm text-(--text)">{result.text}</p>
                <p className="mt-1 text-xs text-(--muted)">{result.at}</p>
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <div className="w-full shrink-0 border-t border-(--table-border) bg-(--card) px-4 py-4">
        <div className="flex items-end gap-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSubmit();
              }
            }}
            rows={2}
            placeholder="Type your response..."
            className="flex-1 resize-none rounded-2xl border border-(--table-border) bg-(--surface) px-4 py-2 text-sm text-(--text) placeholder:text-(--muted) focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
          <button
            type="button"
            disabled={draft.trim() === "" || isSending}
            onClick={() => void handleSubmit()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSending ? <RiLoader4Fill className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
