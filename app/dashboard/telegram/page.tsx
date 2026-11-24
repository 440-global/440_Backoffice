"use client";

import {
  useCompleteTelegramAuth,
  useSendTelegramCode,
  useTelegramGroups,
  useTelegramMessages,
  type TelegramGroup,
  type TelegramGroupsPayload,
} from "@/api/telegram";
import MyModal from "@/components/dashboard/Modal";
import TelegramMessagesThread, {
  type TelegramApiMessage,
} from "@/components/telegram/TelegramMessagesThread";
import { Button, Card, Input } from "@/components/ui";
import { useToast } from "@/components/ui/toast/ToastContext";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RiHashtag,
  RiInformationLine,
  RiLoader4Fill,
  RiSearchLine,
  RiTelegramFill,
} from "react-icons/ri";
import { useCanManage } from "@/hooks/use-can";

function hasTelegramConnection(data: TelegramGroupsPayload) {
  if (data.telegramSession === true) return true;
  if (data.groups?.length) return true;
  if (data.communityName?.trim()) return true;
  if (data.parentChannelId?.trim()) return true;
  return false;
}

export default function TelegramPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data, isPending, isError, error, refetch } = useTelegramGroups();
  const sendCode = useSendTelegramCode();
  const completeAuth = useCompleteTelegramAuth();

  const [authOpen, setAuthOpen] = useState(false);
  const [authDismissed, setAuthDismissed] = useState(false);
  const [phoneCode, setPhoneCode] = useState("");
  const [password, setPassword] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<TelegramGroup | null>(null);
  const [topicQuery, setTopicQuery] = useState("");
  const [beforeMessageId, setBeforeMessageId] = useState<number | null>(null);
  const [nextBeforeMessageId, setNextBeforeMessageId] = useState<number | null>(
    null
  );
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [threadMessages, setThreadMessages] = useState<TelegramApiMessage[]>([]);
  const requestedCursorRef = useRef<Set<string>>(new Set());

  const messagesChannelId =
    selectedGroup != null
      ? (selectedGroup.channelId ?? "").trim() || null
      : null;

  const messagesTopicId =
    selectedGroup != null &&
    selectedGroup.topicId != null &&
    !Number.isNaN(Number(selectedGroup.topicId))
      ? Number(selectedGroup.topicId)
      : null;

  const topicThreadKey = `${messagesChannelId ?? "none"}:${messagesTopicId ?? "none"}`;

  const messagesQuery = useTelegramMessages(
    messagesChannelId,
    messagesTopicId,
    beforeMessageId
  );

  useEffect(() => {
    setBeforeMessageId(null);
    setNextBeforeMessageId(null);
    setHasMoreMessages(false);
    setThreadMessages([]);
    requestedCursorRef.current = new Set();
  }, [topicThreadKey]);

  useEffect(() => {
    if (!messagesQuery.data) return;
    const incoming = Array.isArray(messagesQuery.data.messages)
      ? (messagesQuery.data.messages as TelegramApiMessage[])
      : [];

    if (beforeMessageId == null) {
      setThreadMessages(incoming);
    } else {
      setThreadMessages((prev) => {
        if (prev.length === 0) return incoming;
        const existingIds = new Set(prev.map((msg) => msg.id));
        const dedupedIncoming = incoming.filter((msg) => !existingIds.has(msg.id));
        return [...prev, ...dedupedIncoming];
      });
    }

    const nextCursor =
      typeof messagesQuery.data.nextBeforeMessageId === "number" &&
      Number.isFinite(messagesQuery.data.nextBeforeMessageId)
        ? messagesQuery.data.nextBeforeMessageId
        : null;
    setNextBeforeMessageId(nextCursor);
    setHasMoreMessages(Boolean(messagesQuery.data.hasMore && nextCursor != null));
  }, [beforeMessageId, messagesQuery.data]);

  useEffect(() => {
    if (!messagesQuery.isError || beforeMessageId == null) return;
    requestedCursorRef.current.delete(`${topicThreadKey}:${beforeMessageId}`);
  }, [beforeMessageId, messagesQuery.isError, topicThreadKey]);

  const handleLoadMoreMessages = useCallback(() => {
    if (!hasMoreMessages || messagesQuery.isFetching) return;
    if (nextBeforeMessageId == null) return;
    const cursorKey = `${topicThreadKey}:${nextBeforeMessageId}`;
    if (requestedCursorRef.current.has(cursorKey)) return;
    requestedCursorRef.current.add(cursorKey);
    setBeforeMessageId(nextBeforeMessageId);
  }, [
    hasMoreMessages,
    messagesQuery.isFetching,
    nextBeforeMessageId,
    topicThreadKey,
  ]);

  const needsAuth = useMemo(() => {
    if (isPending || isError) return false;
    if (!data) return false;
    return !hasTelegramConnection(data);
  }, [data, isPending, isError]);

  useEffect(() => {
    if (data && hasTelegramConnection(data)) {
      setAuthDismissed(false);
    }
  }, [data]);

  const authModalOpen = authOpen || (needsAuth && !authDismissed);

  const handleSendCode = async () => {
    try {
      await sendCode.mutateAsync();
      toast({ title: "Code sent", description: "Check Telegram for the login code." });
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed to send code")
          : "Failed to send code";
      toast({ title: "Error", description: msg, variant: "danger" });
    }
  };

  const handleCompleteAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneCode.trim()) {
      toast({ title: "Phone code required", description: "", variant: "danger" });
      return;
    }
    try {
      await completeAuth.mutateAsync({
        phoneCode: phoneCode.trim(),
        password: password,
      });
      toast({ title: "Telegram connected", description: "Your session is active." });
      setAuthOpen(false);
      setPhoneCode("");
      setPassword("");
      refetch();
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Authentication failed")
          : "Authentication failed";
      toast({ title: "Error", description: msg, variant: "danger" });
    }
  };

  const groups = data?.groups ?? [];

  const filteredGroups = useMemo(() => {
    const q = topicQuery.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => {
      const label = `${g.title ?? ""} ${g.name ?? ""} ${g.id} ${g.topicId ?? ""}`.toLowerCase();
      return label.includes(q);
    });
  }, [groups, topicQuery]);

  const openTopic = (g: TelegramGroup) => {
    if (window.innerWidth < 768) {
      const title = encodeURIComponent(g.title ?? g.name ?? `Topic ${g.id}`);
      const channelId = encodeURIComponent(String(g.channelId ?? ""));
      const topicId =
        g.topicId != null && !Number.isNaN(Number(g.topicId))
          ? String(Number(g.topicId))
          : "";
      router.push(
        `/dashboard/telegram/topic?title=${title}&channelId=${channelId}&topicId=${topicId}`
      );
      return;
    }
    setSelectedGroup(g);
  };

  useEffect(() => {
    if (groups.length === 0) return;
    if (selectedGroup == null) {
      setSelectedGroup(groups[0]);
      return;
    }
    const stillExists = groups.some((g) => String(g.id) === String(selectedGroup.id));
    if (!stillExists) {
      setSelectedGroup(groups[0]);
    }
  }, [groups, selectedGroup]);

  // Permissions
  const canManage = useCanManage('telegram');

  return (
    <>
      <div className="mx-auto max-w-350">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-sky-400 to-cyan-600 text-white shadow-lg shadow-sky-500/25">
              <RiTelegramFill className="text-2xl" aria-hidden />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Telegram</h1>
              <p className="text-xs text-(--muted)">
                {data?.communityName ?? "Topics and messages"}
              </p>
            </div>
          </div>
          {!isPending && data && needsAuth && canManage && (
            <Button
              primary
              type="button"
              onClick={() => {
                setAuthDismissed(false);
                setAuthOpen(true);
              }}
            >
              Connect Telegram
            </Button>
          )}
        </div>

        {isError && (
          <Card className="mb-6 border-red-200/80 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20">
            <p className="text-sm text-red-700 dark:text-red-300">
              {error && typeof error === "object" && "message" in error
                ? String((error as Error).message)
                : "Could not load Telegram groups."}
            </p>
            <Button type="button" className="mt-4" onClick={() => refetch()}>
              Retry
            </Button>
          </Card>
        )}

        {isPending && (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-(--muted)">
            <RiLoader4Fill className="animate-spin text-3xl text-sky-500" />
            <p className="text-sm">Loading forum…</p>
          </div>
        )}

        {!isPending && !isError && (
          <>
            {groups.length === 0 && data && hasTelegramConnection(data) ? (
              <Card className="py-16 text-center">
                <p className="text-(--muted)">
                  {data.communityName
                    ? "No topics in this forum yet."
                    : "No groups yet. Your account is connected."}
                </p>
              </Card>
            ) : groups.length === 0 ? (
              <Card className="py-16 text-center">
                <p className="text-(--muted)">Connect Telegram to see topics.</p>
              </Card>
            ) : (
              <div className="grid h-[calc(100vh-180px)] min-h-155 grid-cols-1 gap-4 md:grid-cols-[350px_minmax(0,1fr)]">
                <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-(--table-border) bg-(--card)">
                  <div className="border-b border-(--table-border) p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        {data?.communityName ?? "Topics"}
                      </p>
                      <span className="text-xs text-(--muted)">{groups.length}</span>
                    </div>
                    <div className="relative">
                      <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--muted)" />
                      <input
                        type="search"
                        value={topicQuery}
                        onChange={(e) => setTopicQuery(e.target.value)}
                        placeholder="Search topics..."
                        className="w-full rounded-xl border border-(--table-border) bg-(--background) py-2.5 pl-9 pr-3 text-sm outline-none focus:border-sky-500/40"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2">
                    {filteredGroups.length === 0 ? (
                      <p className="p-4 text-sm text-(--muted)">No topic found.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {filteredGroups.map((g) => {
                          const active =
                            selectedGroup != null &&
                            String(selectedGroup.id) === String(g.id);
                          return (
                            <li key={String(g.id)}>
                              <button
                                type="button"
                                onClick={() => openTopic(g)}
                                className={`w-full rounded-xl px-3 py-2.5 text-left transition-colors ${
                                  active
                                    ? "bg-sky-500/15 ring-1 ring-sky-500/40"
                                    : "hover:bg-(--background)"
                                }`}
                              >
                                <p className="line-clamp-1 text-sm font-medium">
                                  {g.title ?? g.name ?? `Topic ${g.id}`}
                                </p>
                                <div className="mt-1 flex items-center gap-2 text-[11px] text-(--muted)">
                                  {g.topicId != null && (
                                    <span className="inline-flex items-center gap-1">
                                      <RiHashtag />
                                      {g.topicId}
                                    </span>
                                  )}
                                  {g.username ? <span>@{g.username}</span> : null}
                                </div>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="hidden h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-(--table-border) bg-(--card) md:flex">
                  <div className="border-b border-(--table-border) px-4 py-3">
                    {selectedGroup ? (
                      <>
                        <p className="line-clamp-1 text-sm font-semibold">
                          {selectedGroup.title ?? selectedGroup.name ?? `Topic ${selectedGroup.id}`}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-(--muted)">
                          {selectedGroup.topicId != null && (
                            <span>topic #{selectedGroup.topicId}</span>
                          )}
                          {messagesChannelId != null && (
                            <span className="truncate">ch. {messagesChannelId}</span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-(--muted)">
                        <RiInformationLine />
                        Select a topic
                      </div>
                    )}
                  </div>
                  <div className="min-h-0 flex-1 p-3">
                    <TelegramMessagesThread
                      data={threadMessages}
                      isPending={messagesQuery.isPending && threadMessages.length === 0}
                      isError={messagesQuery.isError && threadMessages.length === 0}
                      hasMore={hasMoreMessages}
                      isFetchingMore={
                        messagesQuery.isFetching &&
                        beforeMessageId != null &&
                        threadMessages.length > 0
                      }
                      onLoadMore={handleLoadMoreMessages}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <MyModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthOpen(false);
          if (needsAuth) setAuthDismissed(true);
        }}
        title="Connect Telegram"
        modalStyle="w-[90%] max-w-md max-h-[90vh] bg-(--card) rounded-2xl flex flex-col shadow-xl border border-(--table-border)"
      >
        <p className="text-sm text-(--muted) mb-4">
          Send a login code from the server, then enter the code Telegram shows you
          and your cloud password if prompted.
        </p>
        <Button
          type="button"
          primary
          className="mb-6"
          onClick={handleSendCode}
          isLoading={sendCode.isPending}
          disabled={sendCode.isPending}
        >
          Send code
        </Button>
        <form onSubmit={handleCompleteAuth} className="flex flex-col gap-4">
          <Input
            element="input"
            input_type="text"
            name="phoneCode"
            value={phoneCode}
            handler={(e) => setPhoneCode(e.target.value)}
            placeholder="Phone code (e.g. 12345)"
            required
          />
          <Input
            element="input"
            input_type="password"
            name="password"
            value={password}
            handler={(e) => setPassword(e.target.value)}
            placeholder="Password (2FA / cloud password if required)"
          />
          <Button
            primary
            type="submit"
            isLoading={completeAuth.isPending}
            disabled={completeAuth.isPending}
          >
            Complete sign in
          </Button>
        </form>
      </MyModal>

    </>
  );
}
