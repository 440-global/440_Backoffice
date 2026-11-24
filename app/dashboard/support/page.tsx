"use client";

import {
  useAdminSupportConversations,
  useAdminSupportMessages,
  useAdminSupportStats,
  useChangeAdminSupportConversationStatus,
  useMarkAdminSupportRead,
  useSendAdminSupportMessage,
} from "@/api/support";
import { Button, Card } from "@/components/ui";
import { useToast } from "@/components/ui/toast/ToastContext";
import { useAuth } from "@/hooks/use-auth";
import SupportPushNotificationComposer from "@/components/support/SupportPushNotificationComposer";
import { getCrossSubdomainCookie } from "@/lib/utils";
import { SupportConversation, SupportConversationStatus, SupportMessage } from "@/types/types";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  RiArrowDownSLine,
  RiCheckboxCircleLine,
  RiLoader4Fill,
  RiMenuLine,
  RiNotification3Line,
  RiPlugFill,
  RiSearchLine,
  RiSendPlaneFill,
} from "react-icons/ri";
import { useCanUpdate } from "@/hooks/use-can";

type ClientSocket = {
  /** True when the client socket has an active connection to the server. */
  connected: boolean;
  on: (event: string, cb: (...args: any[]) => void) => void;
  off: (event: string, cb?: (...args: any[]) => void) => void;
  emit: (event: string, payload?: unknown) => void;
  disconnect: () => void;
};

type SupportNotification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

type SupportInboxView = {
  id: string;
  label: string;
  status: SupportConversationStatus | "all";
  onlyUnassigned?: boolean;
};

const INBOX_VIEWS: SupportInboxView[] = [
  {
    id: "all-open-unassigned",
    label: "All open and unassigned conversations",
    status: "open",
    onlyUnassigned: true,
  },
  { id: "all-open", label: "All open conversations", status: "open" },
  { id: "all-waiting", label: "All waiting conversations", status: "waiting" },
  { id: "all-resolved", label: "All resolved conversations", status: "resolved" },
  { id: "all-closed", label: "All closed conversations", status: "closed" },
  { id: "all", label: "All conversations", status: "all" },
];

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function shortTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function mergeMessages(prev: SupportMessage[], incoming: SupportMessage) {
  if (prev.some((m) => m.id === incoming.id)) return prev;
  return [...prev, incoming].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

function withReadReceipt(prev: SupportMessage[], messageId: number, readAt: string) {
  return prev.map((m) => (m.id === messageId ? { ...m, readAt } : m));
}

async function ensureSocketClientLoaded() {
  if (typeof window === "undefined") return;
  if (typeof (window as any).io === "function") return;

  await new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector("script[data-socket-io-client='true']");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Failed to load socket client")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.socket.io/4.8.1/socket.io.min.js";
    script.async = true;
    script.dataset.socketIoClient = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load socket client"));
    document.head.appendChild(script);
  });
}

export default function SupportPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const socketRef = useRef<ClientSocket | null>(null);
  const selectedConversationIdRef = useRef<number | null>(null);
  const notifiedReadIdsRef = useRef<Set<number>>(new Set());

  const [selectedViewId, setSelectedViewId] = useState<string>("all-open-unassigned");
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [viewsOpen, setViewsOpen] = useState(false);
  const [unreadByConversation, setUnreadByConversation] = useState<Record<number, number>>({});
  const [messagesByConversation, setMessagesByConversation] = useState<Record<number, SupportMessage[]>>(
    {}
  );
  const [notifications, setNotifications] = useState<SupportNotification[]>([]);

  const selectedView = useMemo(
    () => INBOX_VIEWS.find((item) => item.id === selectedViewId) ?? INBOX_VIEWS[0],
    [selectedViewId]
  );

  const conversationsQuery = useAdminSupportConversations({
    status: selectedView.status,
    page: 1,
    limit: 100,
  });
  const statsQuery = useAdminSupportStats();
  const messagesQuery = useAdminSupportMessages(selectedConversationId, 100);
  const sendMessage = useSendAdminSupportMessage();
  const { mutate: markConversationRead } = useMarkAdminSupportRead();
  const updateStatus = useChangeAdminSupportConversationStatus();

  const conversations = conversationsQuery.data?.conversations ?? [];
  const stats = statsQuery.data;
  const totalFromStats =
    (stats?.open ?? 0) +
    (stats?.waiting ?? 0) +
    (stats?.resolved ?? 0) +
    (stats?.closed ?? 0);

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return conversations
      .filter((conv) => (selectedView.onlyUnassigned ? conv.assignedAgentId == null : true))
      .filter((conv) => {
        if (!q) return true;
        const haystack = `${conv.referenceCode} ${conv.subject ?? ""}`.toLowerCase();
        return haystack.includes(q);
      });
  }, [conversations, searchQuery, selectedView.onlyUnassigned]);

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  useEffect(() => {
    if (filteredConversations.length === 0) {
      setSelectedConversationId(null);
      return;
    }
    if (selectedConversationId == null) {
      setSelectedConversationId(filteredConversations[0].id);
      return;
    }
    const exists = filteredConversations.some((item) => item.id === selectedConversationId);
    if (!exists) setSelectedConversationId(filteredConversations[0].id);
  }, [filteredConversations, selectedConversationId]);

  useEffect(() => {
    if (selectedConversationId == null) return;
    const list = messagesQuery.data?.messages ?? [];
    if (!list.length) return;
    setMessagesByConversation((prev) => ({ ...prev, [selectedConversationId]: list }));
  }, [messagesQuery.data?.messages, selectedConversationId]);

  const selectedConversation = useMemo(
    () => filteredConversations.find((item) => item.id === selectedConversationId) ?? null,
    [filteredConversations, selectedConversationId]
  );

  const selectedMessages = useMemo(() => {
    if (selectedConversationId == null) return [];
    return messagesByConversation[selectedConversationId] ?? [];
  }, [messagesByConversation, selectedConversationId]);

  useEffect(() => {
    if (selectedConversationId == null) return;
    if (selectedMessages.length === 0) return;

    const unreadCustomerMessages = selectedMessages.filter(
      (msg) => msg.senderType === "customer" && !msg.readAt
    );
    if (unreadCustomerMessages.length === 0) return;

    unreadCustomerMessages.forEach((msg) => {
      if (notifiedReadIdsRef.current.has(msg.id)) return;
      notifiedReadIdsRef.current.add(msg.id);
      markConversationRead({ conversationId: selectedConversationId, messageId: msg.id });
      socketRef.current?.emit("support:read", { messageId: msg.id });
    });
    setUnreadByConversation((prev) => {
      if ((prev[selectedConversationId] ?? 0) === 0) return prev;
      return { ...prev, [selectedConversationId]: 0 };
    });
  }, [markConversationRead, selectedConversationId, selectedMessages]);

  useEffect(() => {
    const token = getCrossSubdomainCookie("admin_token");
    if (!token) return;

    let mounted = true;
    let socket: ClientSocket | null = null;

    const bootSocket = async () => {
      try {
        await ensureSocketClientLoaded();
        if (!mounted) return;

        const socketUrl =
          process.env.NEXT_PUBLIC_SOCKET_URL ||
          process.env.NEXT_PUBLIC_BASE_URL ||
          window.location.origin;

        const createSocket = (window as any).io as
          | ((url: string, options: Record<string, unknown>) => ClientSocket)
          | undefined;
        if (!createSocket) throw new Error("Socket client not available");

        socket = createSocket(socketUrl, {
          auth: { token },
          transports: ["websocket", "polling"],
        });
        socketRef.current = socket;

        const confirmSocketConnected = () => {
          if (!mounted || !socket?.connected) return;
          setSocketConnected(true);
        };
        const markSocketDisconnected = () => setSocketConnected(false);

        socket.on("connect", confirmSocketConnected);
        socket.on("disconnect", markSocketDisconnected);
        socket.on("connect_error", markSocketDisconnected);

        if (socket.connected) confirmSocketConnected();

        socket.on("support:message", ({ message }: { message: SupportMessage }) => {
          if (!message?.conversationId) return;
          setMessagesByConversation((prev) => {
            const existing = prev[message.conversationId] ?? [];
            return { ...prev, [message.conversationId]: mergeMessages(existing, message) };
          });

          queryClient.invalidateQueries({ queryKey: ["support", "conversations"], exact: false });
          queryClient.invalidateQueries({ queryKey: ["support", "stats"], exact: false });

          const fromCustomer = message.senderType === "customer";
          const isActive = selectedConversationIdRef.current === message.conversationId;
          if (fromCustomer && !isActive) {
            setUnreadByConversation((prev) => ({
              ...prev,
              [message.conversationId]: (prev[message.conversationId] ?? 0) + 1,
            }));
          }

          if (fromCustomer && !isActive) {
            const notification: SupportNotification = {
              id: `${Date.now()}-${message.id}`,
              title: "New customer message",
              body: message.content?.trim() || "Customer sent an attachment.",
              createdAt: new Date().toISOString(),
            };
            setNotifications((prev) => [notification, ...prev].slice(0, 15));
            toast({ title: notification.title, description: notification.body });
          }
        });

        socket.on(
          "support:read-receipt",
          ({ messageId, readAt }: { messageId: number; readAt: string }) => {
            setMessagesByConversation((prev) => {
              const updated: Record<number, SupportMessage[]> = {};
              for (const [key, list] of Object.entries(prev)) {
                updated[Number(key)] = withReadReceipt(list, messageId, readAt);
              }
              return { ...prev, ...updated };
            });
          }
        );

        socket.on("support:conversation-updated", () => {
          queryClient.invalidateQueries({ queryKey: ["support", "conversations"], exact: false });
          queryClient.invalidateQueries({ queryKey: ["support", "stats"], exact: false });
        });

        socket.on("support:new-conversation", ({ conversation }: { conversation: SupportConversation }) => {
          queryClient.invalidateQueries({ queryKey: ["support", "conversations"], exact: false });
          queryClient.invalidateQueries({ queryKey: ["support", "stats"], exact: false });
          const notification: SupportNotification = {
            id: `${Date.now()}-new-${conversation.id}`,
            title: "New support conversation",
            body: `${conversation.referenceCode} requires attention.`,
            createdAt: new Date().toISOString(),
          };
          setNotifications((prev) => [notification, ...prev].slice(0, 15));
          toast({ title: notification.title, description: notification.body });
        });

        socket.on("support:error", ({ message }: { message: string }) => {
          toast({ title: "Chat error", description: message, variant: "danger" });
        });
      } catch {
        setSocketConnected(false);
        toast({
          title: "Live chat unavailable",
          description: "Socket connection could not be initialized. REST fallback is active.",
          variant: "danger",
        });
      }
    };

    void bootSocket();

    return () => {
      mounted = false;
      socket?.off("connect");
      socket?.off("disconnect");
      socket?.off("connect_error");
      socket?.off("support:message");
      socket?.off("support:read-receipt");
      socket?.off("support:conversation-updated");
      socket?.off("support:new-conversation");
      socket?.off("support:error");
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [queryClient, toast]);

  const handleSendMessage = async () => {
    const content = draftMessage.trim();
    if (!content || selectedConversationId == null) return;

    setDraftMessage("");
    const socketPayload = { conversationId: selectedConversationId, content, contentType: "text" as const };
    const restPayload = { content, contentType: "text" as const };

    if (socketConnected && socketRef.current) {
      socketRef.current.emit("support:message", socketPayload);
      return;
    }

    try {
      await sendMessage.mutateAsync({ conversationId: selectedConversationId, body: restPayload });
    } catch {
      toast({
        title: "Message not sent",
        description: "Could not send message. Please retry.",
        variant: "danger",
      });
      setDraftMessage(content);
    }
  };

  const handleStatusChange = async (next: SupportConversationStatus) => {
    if (selectedConversationId == null) return;
    try {
      await updateStatus.mutateAsync({
        conversationId: selectedConversationId,
        body: { status: next },
      });
      toast({ title: "Conversation updated", description: `Status set to ${next}.` });
    } catch {
      toast({
        title: "Status update failed",
        description: "Could not update conversation status.",
        variant: "danger",
      });
    }
  };

  // Permissions
  const canUpdate = useCanUpdate('support');

  return (
    <div className="relative mx-auto max-w-425">
      <details className="mb-3 rounded-2xl border border-(--table-border) bg-(--surface) xl:hidden">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            <RiNotification3Line />
            Send push notification
          </span>
        </summary>
        <div className="border-t border-(--table-border)">
          <SupportPushNotificationComposer cardClassName="!m-0 rounded-none border-0 shadow-none !px-4 !py-3" />
        </div>
      </details>

      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Team Inbox</h1>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ${
            socketConnected ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
          }`}
        >
          <RiPlugFill />
          {socketConnected ? "Live" : "Reconnecting"}
        </span>
      </div>

      <div className="relative grid h-[calc(100vh-138px)] min-h-180 grid-cols-1 gap-0 overflow-hidden rounded-2xl border border-(--table-border) bg-(--surface) xl:grid-cols-[340px_minmax(0,1fr)_320px]">
        <aside className="border-r border-(--table-border)">
          <div className="border-b border-(--table-border) px-3 py-3">
            <div className="mb-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewsOpen(true)}
                className="rounded-md border border-(--table-border) p-2 hover:bg-(--background)"
                aria-label="Open views menu"
              >
                <RiMenuLine />
              </button>
              <div className="relative flex-1">
                <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--muted)" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full rounded-md border border-(--table-border) bg-(--background) py-2 pl-8 pr-3 text-sm outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setViewsOpen(true)}
              className="flex w-full items-center justify-between rounded-md bg-(--background) px-3 py-2 text-left text-sm hover:bg-(--table-border)"
            >
              <span className="line-clamp-1">{selectedView.label}</span>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-(--table-border) px-2 py-0.5 text-xs">
                  {filteredConversations.length}
                </span>
                <RiArrowDownSLine />
              </div>
            </button>
          </div>

          <div className="h-[calc(100%-102px)] overflow-y-auto">
            {conversationsQuery.isPending ? (
              <div className="flex h-full items-center justify-center text-(--muted)">
                <RiLoader4Fill className="animate-spin text-2xl" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <p className="p-4 text-sm text-(--muted)">No conversations found.</p>
            ) : (
              <ul>
                {filteredConversations.map((conv) => {
                  const isActive = selectedConversationId === conv.id;
                  const unreadCount = unreadByConversation[conv.id] ?? 0;
                  return (
                    <li key={conv.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedConversationId(conv.id);
                          setUnreadByConversation((prev) => ({ ...prev, [conv.id]: 0 }));
                        }}
                        className={`w-full border-b border-(--table-border) px-3 py-3 text-left transition-colors ${
                          isActive ? "bg-(--primary)/10" : "hover:bg-(--background)"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-1 text-sm font-semibold">
                            {conv.subject || "Web Chat - Chat with us"}
                          </p>
                          <span className="text-xs text-(--muted)">{shortTime(conv.updatedAt)}</span>
                        </div>
                        <p className="mt-1 line-clamp-1 text-xs text-(--muted)">
                          {conv.referenceCode}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="rounded-full bg-(--background) px-2 py-0.5 text-[11px]">
                            {conv.customerType}
                          </span>
                          {unreadCount > 0 && (
                            <span className="rounded-full bg-(--primary) px-2 py-0.5 text-[11px] text-white">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col border-r border-(--table-border)">
          <div className="border-b border-(--table-border) px-4 py-3">
            {selectedConversation ? (
              <>
                <p className="text-sm font-semibold">
                  {selectedConversation.subject || "Web Chat - Chat with us"}
                </p>
                <p className="text-xs text-(--muted)">{selectedConversation.referenceCode}</p>
              </>
            ) : (
              <p className="text-sm text-(--muted)">Select a conversation</p>
            )}
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-(--background)/40 px-5 py-4">
            {selectedConversationId == null ? (
              <p className="text-sm text-(--muted)">No conversation selected.</p>
            ) : messagesQuery.isPending && selectedMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-(--muted)">
                <RiLoader4Fill className="animate-spin text-2xl" />
              </div>
            ) : selectedMessages.length === 0 ? (
              <p className="text-sm text-(--muted)">No messages yet.</p>
            ) : (
              selectedMessages.map((msg) => {
                const mine = msg.senderType === "agent" && msg.senderId === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                        mine
                          ? "bg-(--primary)/90 text-white"
                          : "border border-(--table-border) bg-white text-slate-700"
                      }`}
                    >
                      <p className="whitespace-pre-wrap wrap-break-word text-sm">
                        {msg.content ||
                          (msg.attachmentUrl
                            ? "Attachment sent"
                            : "No content")}
                      </p>
                      <div className="mt-1 flex items-center justify-end gap-1 text-[11px] opacity-75">
                        <span>{shortTime(msg.createdAt)}</span>
                        {mine && msg.readAt && <RiCheckboxCircleLine />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-(--table-border) px-4 py-3">
            {
              canUpdate && 
              <div className="flex items-end gap-2">
                <textarea
                  rows={2}
                  value={draftMessage}
                  onChange={(e) => setDraftMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSendMessage();
                    }
                  }}
                  placeholder="Type your message here"
                  className="min-h-11.5 flex-1 resize-none rounded-md border border-(--table-border) bg-(--card) px-3 py-2 text-sm outline-none"
                />
                <Button
                  primary
                  type="button"
                  onClick={() => void handleSendMessage()}
                  disabled={!draftMessage.trim() || selectedConversationId == null}
                  className="rounded-md px-4 py-2!"
                >
                  <RiSendPlaneFill />
                </Button>
              </div>
            }
          </div>
        </section>

        <aside className="hidden min-h-0 flex-col overflow-y-auto bg-(--background)/30 xl:flex">
          <SupportPushNotificationComposer />

          <Card className="m-3 mb-2 p-3">
            <p className="mb-2 text-xs font-bold uppercase text-(--muted)">Contact info</p>
            {selectedConversation ? (
              <>
                <p className="text-sm font-semibold">Customer #{selectedConversation.chatCustomerId ?? "N/A"}</p>
                <p className="mt-1 text-xs text-(--muted)">
                  Ref: {selectedConversation.referenceCode}
                </p>
                <p className="mt-1 text-xs text-(--muted)">
                  Started: {formatDateTime(selectedConversation.createdAt)}
                </p>
              </>
            ) : (
              <p className="text-sm text-(--muted)">No active conversation.</p>
            )}
          </Card>

          <Card className="m-3 mt-2 p-3">
            <p className="mb-2 text-xs font-bold uppercase text-(--muted)">Conversation properties</p>
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-xs text-(--muted)">Agent</p>
                <p className="rounded-md border border-(--table-border) px-2 py-1.5 text-sm">
                  {user?.name ?? "Unknown"}
                </p>
              </div>
              {
                canUpdate &&
                <div>
                  <p className="mb-1 text-xs text-(--muted)">Status</p>
                  <select
                    value={selectedConversation?.status ?? "open"}
                    onChange={(e) => handleStatusChange(e.target.value as SupportConversationStatus)}
                    disabled={!selectedConversation}
                    className="w-full rounded-md border border-(--table-border) bg-(--card) px-2 py-2 text-sm outline-none"
                  >
                    <option value="open">Open</option>
                    <option value="waiting">Waiting</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              }
              <div>
                <p className="mb-1 text-xs text-(--muted)">Inbox totals</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="rounded bg-(--card) px-2 py-1">Open: {stats?.open ?? 0}</span>
                  <span className="rounded bg-(--card) px-2 py-1">Waiting: {stats?.waiting ?? 0}</span>
                  <span className="rounded bg-(--card) px-2 py-1">Resolved: {stats?.resolved ?? 0}</span>
                  <span className="rounded bg-(--card) px-2 py-1">Unassigned: {stats?.unassigned ?? 0}</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="mx-3 mt-auto mb-3 rounded-xl border border-(--table-border) bg-(--card) p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <RiNotification3Line />
              Notifications
            </div>
            {notifications.length === 0 ? (
              <p className="text-xs text-(--muted)">No new alerts.</p>
            ) : (
              <ul className="space-y-2">
                {notifications.slice(0, 4).map((item) => (
                  <li key={item.id} className="rounded-md bg-(--background) px-2 py-1.5 text-xs">
                    <p className="font-semibold">{item.title}</p>
                    <p className="line-clamp-2 text-(--muted)">{item.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {viewsOpen && (
          <>
            <div
              className="absolute inset-0 z-20 bg-slate-900/35"
              onClick={() => setViewsOpen(false)}
            />
            <div className="absolute left-0 top-0 z-30 h-full w-[320px] border-r border-(--table-border) bg-(--surface) p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold">Default Views</p>
                <button
                  type="button"
                  onClick={() => setViewsOpen(false)}
                  className="rounded p-1 hover:bg-(--background)"
                >
                  x
                </button>
              </div>
              <ul className="space-y-1">
                {INBOX_VIEWS.map((view) => {
                  const count =
                    view.id === "all-open-unassigned"
                      ? stats?.unassigned ?? 0
                      : view.status === "open"
                        ? stats?.open ?? 0
                        : view.status === "waiting"
                          ? stats?.waiting ?? 0
                          : view.status === "resolved"
                            ? stats?.resolved ?? 0
                            : view.status === "closed"
                              ? stats?.closed ?? 0
                              : totalFromStats;
                  return (
                    <li key={view.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedViewId(view.id);
                          setViewsOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm ${
                          selectedViewId === view.id
                            ? "bg-(--primary)/10 text-(--primary)"
                            : "hover:bg-(--background)"
                        }`}
                      >
                        <span className="pr-2">{view.label}</span>
                        <span className="rounded-full bg-(--table-border) px-2 py-0.5 text-xs">{count}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
