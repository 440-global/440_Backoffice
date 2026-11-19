"use client";

import http from "@/lib/http";
import { useEffect, useRef, useState } from "react";
import { RiErrorWarningLine, RiLoader4Fill } from "react-icons/ri";

export type TelegramMediaKind = "photo" | "video";

type Props = {
  channelId: string;
  topicId: number | null;
  messageId: number;
  kind: TelegramMediaKind;
  /** CSS classes for the img / video element */
  className?: string;
};

/**
 * Loads binary media through the admin API (Bearer auth). Expects:
 * GET /admin/telegram/media?channelId=&topicId=&messageId=&kind=photo|video
 * returning the file bytes with a correct Content-Type.
 */
export default function TelegramFetchedMedia({
  channelId,
  topicId,
  messageId,
  kind,
  className,
}: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    urlRef.current = null;
    setSrc(null);
    setError(false);
    setLoading(true);

    let cancelled = false;

    const params: Record<string, string | number> = {
      channelId: String(channelId),
      messageId: Number(messageId),
      kind,
    };
    if (topicId != null && !Number.isNaN(Number(topicId))) {
      params.topicId = Number(topicId);
    }

    (async () => {
      try {
        const res = await http.get("/admin/telegram/media", {
          params,
          responseType: "blob",
        });
        const blob = res.data as Blob;
        if (cancelled) return;
        if (!(blob instanceof Blob) || blob.size === 0) {
          setError(true);
          return;
        }
        const u = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(u);
          return;
        }
        urlRef.current = u;
        setSrc(u);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [channelId, topicId, messageId, kind]);

  if (loading) {
    return (
      <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-(--table-border) bg-(--background)/60 text-(--muted)">
        <RiLoader4Fill className="animate-spin text-2xl" aria-hidden />
      </div>
    );
  }

  if (error || !src) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-(--table-border) bg-(--background)/60 px-3 py-3 text-xs text-(--muted)">
        <RiErrorWarningLine className="shrink-0 text-lg text-amber-500" />
        <span>
          Could not load media. Implement{" "}
          <code className="rounded bg-(--card) px-1 py-0.5 text-[10px]">
            GET /admin/telegram/media
          </code>{" "}
          on the server, or return a <code className="text-[10px]">url</code>{" "}
          field on each attachment.
        </span>
      </div>
    );
  }

  const frame =
    className ??
    "max-h-[min(360px,55vh)] w-full rounded-xl border border-(--table-border) bg-black/40 object-contain";

  if (kind === "video") {
    return (
      <video
        src={src}
        controls
        playsInline
        className={frame}
        preload="metadata"
      />
    );
  }

  return (
    <img
      src={src}
      alt=""
      className={frame}
      loading="lazy"
    />
  );
}
