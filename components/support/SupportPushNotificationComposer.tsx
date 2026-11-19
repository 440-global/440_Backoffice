"use client";

import { useSendAdminPushNotification, useAdminPushNotificationRecipientSearch } from "@/api/push-notifications";
import { Button, Card } from "@/components/ui";
import { useToast } from "@/components/ui/toast/ToastContext";
import type { FinanceCustomer } from "@/types/types";
import { cn } from "@/components/ui/utils";
import { useDeferredValue, useMemo, useState } from "react";
import { RiCloseLine, RiNotification4Line, RiUserAddLine, RiUserStarLine } from "react-icons/ri";

type Props = {
  /** Override Card spacing (e.g. embed inside a mobile drawer). */
  cardClassName?: string;
};

function extractErrorMessage(e: unknown): string {
  if (e && typeof e === "object" && "response" in e) {
    const r = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (typeof r === "string" && r.trim()) return r;
  }
  if (e instanceof Error && e.message) return e.message;
  return "Request failed.";
}

export default function SupportPushNotificationComposer({ cardClassName }: Props) {
  const { toast } = useToast();
  const sendPush = useSendAdminPushNotification();

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [message, setMessage] = useState("");
  const [broadcastAll, setBroadcastAll] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const deferredSearch = useDeferredValue(searchInput);
  const [selected, setSelected] = useState<FinanceCustomer[]>([]);

  const searchQuery = useMemo(() => deferredSearch.trim(), [deferredSearch]);
  const search = useAdminPushNotificationRecipientSearch(searchQuery, 25);

  const addRecipient = (c: FinanceCustomer) => {
    setSelected((prev) => (prev.some((x) => x.id === c.id) ? prev : [...prev, c]));
    setSearchInput("");
  };

  const removeRecipient = (id: number) => {
    setSelected((prev) => prev.filter((x) => x.id !== id));
  };

  const canSubmit =
    title.trim().length > 0 &&
    subtitle.trim().length > 0 &&
    message.trim().length > 0 &&
    (broadcastAll || selected.length > 0);

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast({
        title: "Incomplete form",
        description: broadcastAll
          ? "Fill in title, subtitle, and message."
          : "Fill in title, subtitle, message, and pick at least one customer.",
        variant: "warning",
      });
      return;
    }

    const body = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      message: message.trim(),
      broadcastToAllCustomers: broadcastAll,
      ...(broadcastAll ? {} : { customerIds: selected.map((c) => c.id) }),
    };

    try {
      await sendPush.mutateAsync(body);
      toast({ title: "Notification sent", description: "Push was queued for delivery." });
      setTitle("");
      setSubtitle("");
      setMessage("");
      setSelected([]);
      setSearchInput("");
      setBroadcastAll(true);
    } catch (e) {
      toast({
        title: "Send failed",
        description: extractErrorMessage(e),
        variant: "danger",
      });
    }
  };

  return (
    <Card className={cn("m-3 p-3", cardClassName)}>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <RiNotification4Line className="text-(--primary)" />
        Push notification
      </div>
      <p className="mb-3 text-xs text-(--muted)">
        Sends a mobile push with title, subtitle, and message. Choose all customers or search and select
        specific recipients.
      </p>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-(--muted)" htmlFor="push-title">
            Title
          </label>
          <input
            id="push-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short headline"
            className="w-full rounded-md border border-(--table-border) bg-(--background) px-2 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-(--muted)" htmlFor="push-subtitle">
            Subtitle
          </label>
          <input
            id="push-subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Supporting line under the title"
            className="w-full rounded-md border border-(--table-border) bg-(--background) px-2 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-(--muted)" htmlFor="push-message">
            Message
          </label>
          <textarea
            id="push-message"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Body text shown in the notification"
            className="w-full resize-none rounded-md border border-(--table-border) bg-(--background) px-2 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="mb-1 text-xs font-medium text-(--muted)">Recipients</legend>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="push-audience"
              checked={broadcastAll}
              onChange={() => setBroadcastAll(true)}
              className="accent-(--primary)"
            />
            <RiUserStarLine className="text-(--muted)" />
            All customers
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="push-audience"
              checked={!broadcastAll}
              onChange={() => setBroadcastAll(false)}
              className="accent-(--primary)"
            />
            <RiUserAddLine className="text-(--muted)" />
            Search and select customers
          </label>
        </fieldset>

        {!broadcastAll && (
          <div className="rounded-md border border-(--table-border) bg-(--background) p-2">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Type name, email, or phone (min 2 characters)"
              className="mb-2 w-full rounded border border-(--table-border) bg-(--card) px-2 py-1.5 text-xs outline-none"
              aria-label="Search customers"
            />
            {selected.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1">
                {selected.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex max-w-full items-center gap-1 rounded-full bg-(--primary)/15 px-2 py-0.5 text-[11px] text-(--text)"
                  >
                    <span className="truncate">{c.name}</span>
                    <button
                      type="button"
                      onClick={() => removeRecipient(c.id)}
                      className="shrink-0 rounded p-0.5 hover:bg-(--table-border)"
                      aria-label={`Remove ${c.name}`}
                    >
                      <RiCloseLine className="text-sm" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {searchQuery.length >= 2 && (
              <div className="max-h-36 overflow-y-auto rounded border border-(--table-border) bg-(--card)">
                {search.isPending ? (
                  <p className="p-2 text-xs text-(--muted)">Searching…</p>
                ) : search.isError ? (
                  <p className="p-2 text-xs text-red-600">Could not load results.</p>
                ) : (search.data?.length ?? 0) === 0 ? (
                  <p className="p-2 text-xs text-(--muted)">No matches.</p>
                ) : (
                  <ul>
                    {search.data!.map((c) => {
                      const already = selected.some((x) => x.id === c.id);
                      return (
                        <li key={c.id}>
                          <button
                            type="button"
                            disabled={already}
                            onClick={() => addRecipient(c)}
                            className="flex w-full flex-col items-start gap-0.5 border-b border-(--table-border) px-2 py-1.5 text-left text-xs last:border-b-0 hover:bg-(--elevatedHover) disabled:opacity-50"
                          >
                            <span className="font-medium">{c.name}</span>
                            <span className="text-(--muted)">
                              {[c.email, c.phone].filter(Boolean).join(" · ") || `ID ${c.id}`}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
            {searchQuery.length > 0 && searchQuery.length < 2 && (
              <p className="text-[11px] text-(--muted)">Enter at least 2 characters to search.</p>
            )}
          </div>
        )}

        <Button
          primary
          type="button"
          className="w-full rounded-md py-2!"
          disabled={!canSubmit || sendPush.isPending}
          onClick={() => void handleSubmit()}
        >
          {sendPush.isPending ? "Sending…" : "Send push notification"}
        </Button>
      </div>
    </Card>
  );
}
