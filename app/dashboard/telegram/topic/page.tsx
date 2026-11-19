"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TelegramMessagesThread from "@/components/telegram/TelegramMessagesThread";
import { useTelegramMessages } from "@/api/telegram";
import { RiArrowLeftLine } from "react-icons/ri";

export default function TelegramTopicMobilePage() {
  return (
    <Suspense>
      <TelegramTopicMobilePageInner />
    </Suspense>
  );
}

function TelegramTopicMobilePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const title = searchParams.get("title") ?? "Topic";
  const channelId = (searchParams.get("channelId") ?? "").trim() || null;
  const topicIdParam = searchParams.get("topicId");
  const topicId =
    topicIdParam != null && topicIdParam !== "" && !Number.isNaN(Number(topicIdParam))
      ? Number(topicIdParam)
      : null;

  const messagesQuery = useTelegramMessages(channelId, topicId);

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/dashboard/telegram");
  };

  return (
    <div className="md:hidden -mx-4 -mt-20 h-dvh bg-(--background) flex flex-col">
      <div className="sticky top-0 z-20 border-b border-(--table-border) bg-(--card) px-4 py-3">
        <button
          type="button"
          onClick={handleBack}
          className="mb-2 inline-flex items-center gap-2 text-sm text-(--muted)"
        >
          <RiArrowLeftLine />
          Back to topics
        </button>
        <h2 className="line-clamp-1 text-sm font-semibold">{decodeURIComponent(title)}</h2>
        <div className="mt-1 flex items-center gap-2 text-xs text-(--muted)">
          {topicId != null && <span>topic #{topicId}</span>}
          {channelId != null && <span className="truncate">ch. {channelId}</span>}
        </div>
      </div>

      <div className="min-h-0 flex-1 p-2">
        <TelegramMessagesThread
          data={messagesQuery.data?.messages ?? []}
          isPending={messagesQuery.isPending}
          isError={messagesQuery.isError}
        />
      </div>
    </div>
  );
}
