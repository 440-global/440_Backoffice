"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  RiChatQuoteLine,
  RiFileLine,
  RiFilmLine,
  RiImageLine,
  RiLoader4Fill,
  RiMapPinLine,
  RiPushpinLine,
} from "react-icons/ri";
import Button from "@/components/ui/button";
import MyModal from "@/components/dashboard/Modal";
import AddProduct, {
  type AddProductInitialDraft,
} from "@/components/products/AddProduct";


export type TelegramMessageEntity = {
  className: string;
  offset: number;
  length: number;
};

export type TelegramApiMessage = {
  id: number;
  text: string;
  date: number;
  out: boolean;
  groupedId: string | null;
  media: Record<string, unknown> | null;
  action: { className: string } | null;
  entities?: TelegramMessageEntity[];
};

function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function formatMessageTime(sec: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(sec * 1000));
}

export function normalizeTelegramMessages(raw: unknown): TelegramApiMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw as TelegramApiMessage[];
}

function getLineValue(text: string, label: string): string {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`^\\s*${escapedLabel}\\s*:\\s*(.+)$`, "im"));
  return match?.[1]?.trim() ?? "";
}

function parsePriceFromText(text: string): {
  currency: AddProductInitialDraft["currency"];
  price: AddProductInitialDraft["price"];
} {
  const priceMatch = text.match(/(?:^|\n)\s*(?:Price\s*:?\s*)?([₦N$£¥])\s*([\d,]+(?:\.\d+)?)/im);
  if (!priceMatch) return { currency: undefined, price: undefined };
  const symbol = priceMatch[1] === "N" ? "₦" : priceMatch[1];
  const numericPrice = Number(priceMatch[2].replace(/,/g, ""));
  return {
    currency: symbol,
    price: Number.isFinite(numericPrice) ? numericPrice : undefined,
  };
}

function toAbsoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (typeof window !== "undefined") {
    try {
      return new URL(url, window.location.origin).toString();
    } catch {
      return url;
    }
  }
  const base = (process.env.NEXT_PUBLIC_BASE_URL ?? "").trim().replace(/\/+$/, "");
  if (!base) return url;
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

function parseAvailableSizes(text: string): string[] {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const markerIndex = lines.findIndex((line) => /available sizes?/i.test(line));
  if (markerIndex === -1) return [];

  const sizes = new Set<number>();
  for (let i = markerIndex; i < lines.length; i++) {
    const line = lines[i].replace(/^[\-\u2022]\s*/, "").trim();

    // Stop when we hit another field-like label that is not size-related.
    if (
      i > markerIndex &&
      /^[A-Za-z][A-Za-z\s]+:\s*/.test(line) &&
      !/(male|female|unisex|size)/i.test(line)
    ) {
      break;
    }

    const rangeMatches = [...line.matchAll(/(\d{1,2})\s*(?:to|-)\s*(\d{1,2})/gi)];
    if (rangeMatches.length > 0) {
      for (const match of rangeMatches) {
        const start = Number(match[1]);
        const end = Number(match[2]);
        if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
        const from = Math.min(start, end);
        const to = Math.max(start, end);
        for (let size = from; size <= to; size++) sizes.add(size);
      }
      continue;
    }

    const numberMatches = [...line.matchAll(/\b(\d{1,2})\b/g)];
    for (const match of numberMatches) {
      const size = Number(match[1]);
      if (Number.isFinite(size)) sizes.add(size);
    }
  }

  return [...sizes].sort((a, b) => a - b).map(String);
}

function parseFirstLink(text: string): string | undefined {
  const match = text.match(/https?:\/\/[^\s)]+/i);
  return match ? match[0] : undefined;
}

function buildDraftFromTelegramMessage(messageText: string): AddProductInitialDraft {
  const cleanText = messageText.trim();
  const productId = getLineValue(cleanText, "Product ID");
  const productName = getLineValue(cleanText, "Product Name");
  const { currency, price } = parsePriceFromText(cleanText);
  const sizes = parseAvailableSizes(cleanText);

  return {
    name: productName || productId || "",
    description: cleanText,
    currency,
    price,
    sizes,
    link: parseFirstLink(cleanText),
  };
}

function MessageText({
  text,
  entities,
  outgoing,
}: {
  text: string;
  entities?: TelegramMessageEntity[];
  outgoing?: boolean;
}) {
  if (!text) return null;
  const bodyCls = outgoing
    ? "text-sm leading-relaxed whitespace-pre-wrap break-words text-white"
    : "text-sm leading-relaxed whitespace-pre-wrap break-words text-(--foreground)";
  const mentionCls = outgoing
    ? "font-medium text-sky-100"
    : "font-medium text-sky-600 dark:text-sky-400";
  const urlCls = outgoing
    ? "text-sky-100 underline underline-offset-2 break-all"
    : "text-sky-600 dark:text-sky-400 underline underline-offset-2 break-all";

  if (!entities?.length) {
    return <p className={bodyCls}>{text}</p>;
  }

  const sorted = [...entities].sort((a, b) => a.offset - b.offset);
  const parts: React.ReactNode[] = [];
  let cursor = 0;

  for (let i = 0; i < sorted.length; i++) {
    const ent = sorted[i];
    const { offset, length, className } = ent;
    if (offset > cursor) {
      parts.push(
        <span key={`t-${cursor}-${offset}`}>{text.slice(cursor, offset)}</span>
      );
    }
    const segment = text.slice(offset, offset + length);
    const key = `e-${offset}-${length}-${i}`;

    if (className === "MessageEntityBold") {
      parts.push(
        <strong
          key={key}
          className={outgoing ? "font-semibold text-white" : "font-semibold"}
        >
          {segment}
        </strong>
      );
    } else if (className === "MessageEntityMention") {
      parts.push(
        <span key={key} className={mentionCls}>
          {segment}
        </span>
      );
    } else if (className === "MessageEntityUrl") {
      const href = segment.startsWith("http") ? segment : `https://${segment}`;
      parts.push(
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={urlCls}
        >
          {segment}
        </a>
      );
    } else {
      parts.push(<span key={key}>{segment}</span>);
    }
    cursor = offset + length;
  }
  if (cursor < text.length) {
    parts.push(<span key={`t-end-${cursor}`}>{text.slice(cursor)}</span>);
  }

  return <p className={bodyCls}>{parts}</p>;
}

function videoMetaFromDoc(media: Record<string, unknown>) {
  const attrs = media.attributes as
    | Array<{ type?: string; w?: number; h?: number; duration?: number }>
    | undefined;
  if (!Array.isArray(attrs)) return null;
  return attrs.find((a) => a?.type === "video") ?? null;
}

function largestPhotoDimensions(photo: Record<string, unknown>): {
  w: number;
  h: number;
} | null {
  const sizes = photo.sizes as unknown[] | undefined;
  if (!Array.isArray(sizes)) return null;
  let best: { w: number; h: number } | null = null;
  for (const s of sizes) {
    if (!s || typeof s !== "object") continue;
    const o = s as Record<string, unknown>;
    if (o._ === "PhotoSize" || o._ === "PhotoSizeProgressive") {
      const w = Number(o.w);
      const h = Number(o.h);
      if (Number.isFinite(w) && Number.isFinite(h)) {
        if (!best || w * h > best.w * best.h) best = { w, h };
      }
    }
  }
  return best;
}

const mediaFrameClass =
  "max-h-[min(360px,55vh)] w-full rounded-xl border border-(--table-border) bg-black/30 object-contain";

function readDirectMediaUrl(media: Record<string, unknown>): string | null {
  const raw =
    typeof media.url === "string" && media.url.length > 0
      ? media.url
      : typeof media.thumbUrl === "string" && media.thumbUrl.length > 0
        ? media.thumbUrl
        : null;
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  if (!base) return raw;
  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedRaw = raw.startsWith("/") ? raw : `/${raw}`;
  return `${normalizedBase}${normalizedRaw}`;
}

function hasRenderableUrl(url: string | null): url is string {
  return typeof url === "string" && /^https?:\/\//i.test(url);
}

function FallbackMediaMeta({
  kind,
  outgoing,
  dims,
  title,
}: {
  kind: "photo" | "video";
  outgoing?: boolean;
  dims?: { w: number; h: number } | null;
  title?: string;
}) {
  const box = outgoing
    ? "flex items-start gap-3 rounded-xl border border-white/25 bg-black/15 px-3 py-3 text-white"
    : "flex items-start gap-3 rounded-xl border border-(--table-border) bg-(--background)/80 px-3 py-3";
  return (
    <div className={box}>
      <span
        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          kind === "photo"
            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            : "bg-violet-500/15 text-violet-600 dark:text-violet-400"
        }`}
      >
        {kind === "photo" ? (
          <RiImageLine className="text-xl" />
        ) : (
          <RiFilmLine className="text-xl" />
        )}
      </span>
      <div className="min-w-0">
        <p className={`text-sm font-medium ${outgoing ? "text-white" : ""}`}>
          {title ?? (kind === "photo" ? "Photo" : "Video")}
        </p>
        {dims && (
          <p
            className={
              outgoing ? "text-xs text-white/75" : "text-xs text-(--muted)"
            }
          >
            {dims.w} × {dims.h}px
          </p>
        )}
      </div>
    </div>
  );
}

function MediaBlock({
  media,
  outgoing,
}: {
  media: Record<string, unknown>;
  outgoing?: boolean;
}) {
  const kind = String(media.kind ?? "");
  const box = outgoing
    ? "flex items-start gap-3 rounded-xl border border-white/25 bg-black/15 px-3 py-3 text-white"
    : "flex items-start gap-3 rounded-xl border border-(--table-border) bg-(--background)/80 px-3 py-3";

  if (kind === "photo") {
    const photo = media.photo as Record<string, unknown> | undefined;
    const dims = photo ? largestPhotoDimensions(photo) : null;
    const directUrl = readDirectMediaUrl(media);

    return (
      <div className="mt-2 space-y-2">
        {directUrl ? (
          <img
            src={directUrl}
            alt=""
            className={mediaFrameClass}
            loading="lazy"
          />
        ) : (
          <FallbackMediaMeta kind="photo" outgoing={outgoing} dims={dims} />
        )}
        {hasRenderableUrl(directUrl) && dims != null && (
          <p
            className={`text-[10px] tabular-nums ${outgoing ? "text-white/70" : "text-(--muted)"}`}
          >
            {dims.w} × {dims.h}px
          </p>
        )}
      </div>
    );
  }

  if (kind === "document") {
    const mime = String(media.mimeType ?? "file");
    const fileName = String(media.fileName ?? "Document");
    const size = typeof media.size === "number" ? media.size : 0;
    const vm = videoMetaFromDoc(media);
    const isVideo = mime.startsWith("video/") || vm != null;
    const directUrl = readDirectMediaUrl(media);

    if (isVideo) {
      return (
        <div className="mt-2 space-y-2">
          {directUrl ? (
            <video
              src={directUrl}
              controls
              playsInline
              className={mediaFrameClass}
              preload="metadata"
            />
          ) : (
            <FallbackMediaMeta
              kind="video"
              outgoing={outgoing}
              dims={
                vm?.w != null && vm?.h != null ? { w: vm.w, h: vm.h } : null
              }
              title={fileName}
            />
          )}
          <div
            className={`flex flex-wrap gap-x-2 text-[10px] ${outgoing ? "text-white/75" : "text-(--muted)"}`}
          >
            <span className="truncate font-medium" title={fileName}>
              {fileName}
            </span>
            <span>{mime}</span>
            {size > 0 && <span>{formatBytes(size)}</span>}
            {vm?.duration != null && (
              <span>{Number(vm.duration).toFixed(1)}s</span>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className={box}>
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400">
          <RiFileLine className="text-xl" />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-medium truncate ${outgoing ? "text-white" : ""}`}
            title={fileName}
          >
            {fileName}
          </p>
          <p
            className={
              outgoing ? "text-xs text-white/75" : "text-xs text-(--muted)"
            }
          >
            {mime} · {formatBytes(size)}
          </p>
        </div>
      </div>
    );
  }

  if (kind === "geo") {
    return (
      <div
        className={
          outgoing
            ? "mt-2 flex items-center gap-2 rounded-xl border border-white/25 bg-black/15 px-3 py-2.5 text-sm text-white/90"
            : "mt-2 flex items-center gap-2 rounded-xl border border-(--table-border) bg-(--background)/80 px-3 py-2.5 text-sm text-(--muted)"
        }
      >
        <RiMapPinLine className="shrink-0 text-rose-500" />
        Location shared
      </div>
    );
  }

  return (
    <div
      className={
        outgoing
          ? "mt-2 rounded-lg border border-dashed border-white/30 px-3 py-2 text-xs text-white/80"
          : "mt-2 rounded-lg border border-dashed border-(--table-border) px-3 py-2 text-xs text-(--muted)"
      }
    >
      Media: {kind || "attachment"}
    </div>
  );
}

function actionLabel(action: { className: string }): string {
  switch (action.className) {
    case "MessageActionTopicCreate":
      return "Topic created";
    case "MessageActionTopicEdit":
      return "Topic updated";
    default:
      return action.className.replace(/^MessageAction/, "") || "Event";
  }
}

function MessageBubble({
  msg,
  isGroupedWithPrev,
  isSelected,
  onToggleImage,
  showCreatePool,
  onCreatePool,
}: {
  msg: TelegramApiMessage;
  isGroupedWithPrev: boolean;
  isSelected: (id: number) => boolean;
  onToggleImage: (id: number) => void;
  showCreatePool: boolean;
  onCreatePool: (msg: TelegramApiMessage) => void;
}) {
  if (msg.action) {
    return (
      <div
        className={`flex justify-center px-2 ${isGroupedWithPrev ? "mt-1" : "mt-5"}`}
      >
        <div className="inline-flex max-w-[90%] items-center gap-1.5 rounded-full border border-(--table-border) bg-(--background)/90 px-3 py-1.5 text-xs text-(--muted) shadow-sm">
          <RiPushpinLine className="shrink-0 opacity-70" />
          {actionLabel(msg.action)}
          <span className="opacity-60">·</span>
          <span>{formatMessageTime(msg.date)}</span>
        </div>
      </div>
    );
  }

  const outgoing = msg.out;
  const grouped = isGroupedWithPrev && msg.groupedId != null;

  return (
    <div
      className={`flex px-2 ${grouped ? "mt-1" : "mt-3"} ${outgoing ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[min(100%,520px)] rounded-2xl px-3.5 py-2.5 shadow-sm ${
          outgoing
            ? "rounded-br-md bg-sky-600 text-white dark:bg-sky-700"
            : "rounded-bl-md border border-(--table-border) bg-(--card) text-(--foreground)"
        }`}
      >
        {msg.media &&
          (() => {
            const media = msg.media as Record<string, unknown>;
            const kind = String(media.kind ?? "");
            const isVideo = isVideoMedia(media);
            const selectableMedia = kind === "photo" || isVideo;
            if (!selectableMedia) {
              return <MediaBlock media={media} outgoing={outgoing} />;
            }
            const url = readDirectMediaUrl(media);
            const checked = isSelected(msg.id);
            return (
              <div className="mt-2 relative">
                {isVideo && hasRenderableUrl(url) ? (
                  <video
                    src={url}
                    controls
                    playsInline
                    preload="metadata"
                    className={`${mediaFrameClass} ${checked ? "ring-2 ring-sky-400" : ""}`}
                  />
                ) : hasRenderableUrl(url) ? (
                  <img
                    src={url}
                    alt=""
                    loading="lazy"
                    className={`${mediaFrameClass} ${checked ? "ring-2 ring-sky-400" : ""}`}
                  />
                ) : (
                  <MediaBlock media={media} outgoing={outgoing} />
                )}
                <label className="absolute top-2 left-2 z-10 rounded-md bg-black/55 px-1.5 py-1 text-white">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleImage(msg.id)}
                    className="h-3.5 w-3.5 accent-sky-500"
                  />
                </label>
              </div>
            );
          })()}
        {(msg.text || msg.entities?.length) && (
          <div className={msg.media ? "mt-2" : ""}>
            <MessageText
              text={msg.text}
              entities={msg.entities}
              outgoing={outgoing}
            />
          </div>
        )}
        {!msg.text && !msg.entities?.length && !msg.media && (
          <p
            className={`text-xs italic ${outgoing ? "text-white/75" : "opacity-70"}`}
          >
            No content
          </p>
        )}
        <p
          className={`mt-1.5 text-[10px] tabular-nums ${
            outgoing
              ? "text-right text-white/70"
              : "text-right text-(--muted)"
          }`}
        >
          {formatMessageTime(msg.date)} · #{msg.id}
        </p>
        {showCreatePool && !msg.media && (msg.text ?? "").trim().length > 0 && (
          <div className="mt-3">
            <Button primary className="w-full" onClick={() => onCreatePool(msg)}>
              create pool
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function isVideoMedia(media: Record<string, unknown>): boolean {
  const kind = String(media.kind ?? "");
  if (kind !== "document") return false;
  const mime = String(media.mimeType ?? "");
  return mime.startsWith("video/") || videoMetaFromDoc(media) != null;
}

function GroupedAlbumBubble({
  items,
  isSelected,
  onToggleImage,
}: {
  items: TelegramApiMessage[];
  isSelected: (id: number) => boolean;
  onToggleImage: (id: number) => void;
}) {
  const outgoing = items.some((i) => i.out);
  const mediaItems = items.filter(
    (m) => m.media && (String((m.media as Record<string, unknown>).kind ?? "") === "photo" || isVideoMedia(m.media as Record<string, unknown>))
  );
  const captionSource = items.find((m) => (m.text ?? "").trim().length > 0);
  const caption = captionSource?.text ?? "";
  const captionEntities = captionSource?.entities;
  const last = items[items.length - 1];

  return (
    <div className={`flex px-2 mt-3 ${outgoing ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[min(100%,560px)] rounded-2xl p-2 shadow-sm ${
          outgoing
            ? "rounded-br-md bg-sky-600 text-white dark:bg-sky-700"
            : "rounded-bl-md border border-(--table-border) bg-(--card) text-(--foreground)"
        }`}
      >
        {mediaItems.length > 0 && (
          <div className={`grid gap-1 ${mediaItems.length === 1 ? "grid-cols-1" : mediaItems.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
            {mediaItems.map((m) => {
              const media = m.media as Record<string, unknown>;
              const url = readDirectMediaUrl(media);
              const video = isVideoMedia(media);
              const checked = isSelected(m.id);
              if (video && hasRenderableUrl(url)) {
                return (
                  <div key={m.id} className="relative">
                    <video
                      src={url}
                      controls
                      playsInline
                      preload="metadata"
                      className={`aspect-square w-full rounded-lg border border-(--table-border) bg-black/40 object-cover ${
                        checked ? "ring-2 ring-sky-400" : ""
                      }`}
                    />
                    <label className="absolute top-2 left-2 z-10 rounded-md bg-black/55 px-1.5 py-1 text-white">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleImage(m.id)}
                        className="h-3.5 w-3.5 accent-sky-500"
                      />
                    </label>
                  </div>
                );
              }
              if (hasRenderableUrl(url)) {
                return (
                  <div key={m.id} className="relative">
                    <img
                      src={url}
                      alt=""
                      loading="lazy"
                      className={`aspect-square w-full rounded-lg border border-(--table-border) bg-black/40 object-cover ${
                        checked ? "ring-2 ring-sky-400" : ""
                      }`}
                    />
                    <label className="absolute top-2 left-2 z-10 rounded-md bg-black/55 px-1.5 py-1 text-white">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleImage(m.id)}
                        className="h-3.5 w-3.5 accent-sky-500"
                      />
                    </label>
                  </div>
                );
              }
              return (
                <div key={m.id}>
                  <MediaBlock media={media} outgoing={outgoing} />
                </div>
              );
            })}
          </div>
        )}

        {caption && (
          <div className={mediaItems.length > 0 ? "mt-2 px-1" : "px-1"}>
            <MessageText
              text={caption}
              entities={captionEntities}
              outgoing={outgoing}
            />
          </div>
        )}

        <p
          className={`mt-1.5 px-1 text-[10px] tabular-nums ${
            outgoing
              ? "text-right text-white/70"
              : "text-right text-(--muted)"
          }`}
        >
          {formatMessageTime(last.date)} · #{last.id}
        </p>
      </div>
    </div>
  );
}

type Props = {
  data: unknown;
  isPending: boolean;
  isError: boolean;
  hasMore?: boolean;
  isFetchingMore?: boolean;
  onLoadMore?: () => void;
};

export default function TelegramMessagesThread({
  data,
  isPending,
  isError,
  hasMore = false,
  isFetchingMore = false,
  onLoadMore,
}: Props) {
  const [selectedImageIds, setSelectedImageIds] = useState<number[]>([]);
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
  const [draftForCreateProduct, setDraftForCreateProduct] =
    useState<AddProductInitialDraft | null>(null);
  const [createProductModalOpen, setCreateProductModalOpen] = useState(false);
  const [createDraftNonce, setCreateDraftNonce] = useState(0);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const pendingRestoreRef = useRef(false);
  const previousScrollHeightRef = useRef(0);
  const messages = useMemo(() => normalizeTelegramMessages(data), [data]);
  const chronological = useMemo(
    () => [...messages].sort((a, b) => a.date - b.date),
    [messages]
  );
  const selectableMediaUrlByMessageId = useMemo(() => {
    const result = new Map<number, string>();
    for (const msg of chronological) {
      if (!msg.media) continue;
      const media = msg.media as Record<string, unknown>;
      const kind = String(media.kind ?? "");
      if (kind !== "photo" && !isVideoMedia(media)) continue;
      const directUrl = readDirectMediaUrl(media);
      if (!directUrl) continue;
      result.set(msg.id, toAbsoluteUrl(directUrl));
    }
    return result;
  }, [chronological]);
  const isSelected = (id: number) => selectedImageIds.includes(id);
  const onToggleImage = (id: number, groupKey: string) => {
    setSelectedImageIds((prev) => {
      const alreadyChecked = prev.includes(id);
      // Switching to another group clears previous selections first.
      if (!alreadyChecked && selectedGroupKey != null && selectedGroupKey !== groupKey) {
        setSelectedGroupKey(groupKey);
        return [id];
      }
      if (alreadyChecked) {
        const next = prev.filter((x) => x !== id);
        if (next.length === 0) setSelectedGroupKey(null);
        return next;
      }
      if (selectedGroupKey == null) setSelectedGroupKey(groupKey);
      return [...prev, id];
    });
  };

  const openCreateProductModal = (msg: TelegramApiMessage) => {
    const baseDraft = buildDraftFromTelegramMessage(msg.text ?? "");
    const selectedUrls = selectedImageIds
      .map((id) => selectableMediaUrlByMessageId.get(id))
      .filter((url): url is string => !!url);
    setDraftForCreateProduct({
      ...baseDraft,
      images: selectedUrls,
    });
    setCreateDraftNonce((prev) => prev + 1);
    setCreateProductModalOpen(true);
  };

  const maybeLoadOlderMessages = () => {
    if (!onLoadMore || !hasMore || isFetchingMore) return;
    const node = threadRef.current;
    if (!node) return;
    const distanceToBottom =
      node.scrollHeight - node.scrollTop - node.clientHeight;
    if (distanceToBottom > 120) return;
    previousScrollHeightRef.current = node.scrollHeight;
    pendingRestoreRef.current = true;
    onLoadMore();
  };

  useEffect(() => {
    if (!pendingRestoreRef.current || isFetchingMore) return;
    const node = threadRef.current;
    if (!node) return;
    const delta = node.scrollHeight - previousScrollHeightRef.current;
    if (delta > 0) {
      node.scrollTop = node.scrollTop + delta;
    }
    pendingRestoreRef.current = false;
  }, [chronological.length, isFetchingMore]);

  useEffect(() => {
    if (!hasMore) {
      pendingRestoreRef.current = false;
    }
  }, [hasMore]);

  useEffect(() => {
    const node = threadRef.current;
    if (!node || !onLoadMore || !hasMore || isFetchingMore) return;
    if (node.scrollHeight <= node.clientHeight + 8) {
      previousScrollHeightRef.current = node.scrollHeight;
      pendingRestoreRef.current = true;
      onLoadMore();
    }
  }, [chronological.length, hasMore, isFetchingMore, onLoadMore]);

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-(--muted)">
        <RiLoader4Fill className="animate-spin text-2xl text-sky-500" />
        <p className="text-sm">Loading messages…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
        Could not load messages. Try again.
      </div>
    );
  }

  if (chronological.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-(--muted)">
        <RiChatQuoteLine className="text-4xl opacity-40" />
        <p className="text-sm">No messages in this topic yet.</p>
      </div>
    );
  }

  return (
    <>
      <div
        ref={threadRef}
        onScroll={maybeLoadOlderMessages}
        className="relative max-h-[min(72vh,700px)] overflow-y-auto rounded-xl border border-(--table-border) bg-[linear-gradient(180deg,var(--background)_0%,color-mix(in_oklch,var(--card)_85%,transparent)_100%)] px-1 py-3 scroll-smooth"
      >
        <div className="sticky top-0 z-10 mx-2 mb-2 flex justify-center">
          <span className="rounded-full border border-(--table-border) bg-(--card)/95 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-(--muted) shadow-sm backdrop-blur-sm">
            {chronological.length} messages
            {selectedImageIds.length > 0 ? ` · ${selectedImageIds.length} selected` : ""}
          </span>
        </div>
        {isFetchingMore && (
          <div className="mb-2 flex items-center justify-center gap-2 text-xs text-(--muted)">
            <RiLoader4Fill className="animate-spin" />
            Loading more messages...
          </div>
        )}
        {(() => {
          const nodes: React.ReactNode[] = [];
          let i = 0;
          while (i < chronological.length) {
            const current = chronological[i];
            if (!current.action && current.groupedId != null) {
              const grouped: TelegramApiMessage[] = [current];
              let j = i + 1;
              while (
                j < chronological.length &&
                !chronological[j].action &&
                chronological[j].groupedId === current.groupedId
              ) {
                grouped.push(chronological[j]);
                j++;
              }
              if (grouped.length > 1) {
                nodes.push(
                  <GroupedAlbumBubble
                    key={`group-${String(current.groupedId)}-${current.id}`}
                    items={grouped}
                    isSelected={isSelected}
                    onToggleImage={(id) => onToggleImage(id, `group:${String(current.groupedId)}`)}
                  />
                );
                i = j;
                continue;
              }
            }

            const prev = chronological[i - 1];
            const isGroupedWithPrev =
              !!prev &&
              prev.groupedId != null &&
              prev.groupedId === current.groupedId &&
              !current.action &&
              !prev.action;
            nodes.push(
              <MessageBubble
                key={current.id}
                msg={current}
                isGroupedWithPrev={isGroupedWithPrev}
                isSelected={isSelected}
                onToggleImage={(id) => onToggleImage(id, `single:${String(current.id)}`)}
                showCreatePool={selectedImageIds.length > 0}
                onCreatePool={openCreateProductModal}
              />
            );
            i++;
          }
          return nodes;
        })()}
      </div>

      <MyModal
        isOpen={createProductModalOpen}
        onClose={() => setCreateProductModalOpen(false)}
        title="Create product from Telegram"
      >
        <AddProduct
          key={`telegram-create-${createDraftNonce}`}
          initialDraft={draftForCreateProduct}
        />
      </MyModal>
    </>
  );
}
