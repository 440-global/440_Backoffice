import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import http from "@/lib/http";

export type TelegramGroup = {
  id: string | number;
  title?: string;
  name?: string;
  username?: string;
  topicId?: number;
  channelId?: string;
  topMessageId?: number;
};

export type TelegramGroupsPayload = {
  groups: TelegramGroup[];
  telegramSession?: boolean;
  /** Forum-style `/admin/telegram/groups` payload */
  communityName?: string;
  mode?: string;
  parentChannelId?: string;
};

function mapForumTopicsToGroups(
  topics: unknown,
  obj: Record<string, unknown>
): TelegramGroupsPayload {
  const list = Array.isArray(topics) ? topics : [];
  const groups: TelegramGroup[] = list.map((t) => {
    const row = t as Record<string, unknown>;
    const id =
      row.id != null
        ? String(row.id)
        : row.channelId != null && row.topicId != null
          ? `${row.channelId}:${row.topicId}`
          : "";
    return {
      id,
      name: row.name != null ? String(row.name) : undefined,
      title: row.name != null ? String(row.name) : undefined,
      topicId:
        typeof row.topicId === "number"
          ? row.topicId
          : row.topicId != null
            ? Number(row.topicId)
            : undefined,
      channelId: row.channelId != null ? String(row.channelId) : undefined,
      topMessageId:
        typeof row.topMessageId === "number"
          ? row.topMessageId
          : row.topMessageId != null
            ? Number(row.topMessageId)
            : undefined,
    };
  });
  return {
    groups,
    telegramSession: true,
    communityName:
      obj.communityName != null ? String(obj.communityName) : undefined,
    mode: obj.mode != null ? String(obj.mode) : undefined,
    parentChannelId:
      obj.parentChannelId != null ? String(obj.parentChannelId) : undefined,
  };
}

function normalizeGroupsPayload(raw: unknown): TelegramGroupsPayload {
  if (raw == null) {
    return { groups: [], telegramSession: false };
  }
  if (Array.isArray(raw)) {
    return {
      groups: raw as TelegramGroup[],
      telegramSession: raw.length > 0 ? true : undefined,
    };
  }
  const obj = raw as Record<string, unknown>;

  if (Array.isArray(obj.topics) || obj.communityName != null || obj.parentChannelId != null) {
    return mapForumTopicsToGroups(obj.topics, obj);
  }

  const groups =
    (obj.groups as TelegramGroup[]) ??
    (obj.items as TelegramGroup[]) ??
    [];
  const telegramSession = obj.telegramSession as boolean | undefined;
  return { groups, telegramSession };
}

/** Axios may return the forum either on `data` or nested as `data.data` (and similar envelopes). */
function extractTelegramGroupsBody(res: { data?: unknown }): unknown {
  const root = res?.data;
  if (root == null) return null;

  const looksLikePayload = (node: unknown): boolean => {
    if (node == null || typeof node !== "object" || Array.isArray(node)) {
      return Array.isArray(node);
    }
    const o = node as Record<string, unknown>;
    return (
      Array.isArray(o.topics) ||
      o.communityName != null ||
      o.parentChannelId != null ||
      Array.isArray(o.groups) ||
      Array.isArray(o.items) ||
      o.telegramSession != null
    );
  };

  const unwrap = (node: unknown): unknown => {
    if (node == null) return null;
    if (Array.isArray(node)) return node;
    if (typeof node !== "object") return node;
    if (looksLikePayload(node)) return node;
    const o = node as Record<string, unknown>;
    if (o.data !== undefined) return unwrap(o.data);
    if (o.result !== undefined) return unwrap(o.result);
    return node;
  };

  return unwrap(root);
}

const TELEGRAM_GROUPS_KEY = ["telegram", "groups"] as const;

/** Backend returns this when Telegram is not linked yet (e.g. 4xx with message body). */
export const NO_TELEGRAM_SESSION_MESSAGE =
  "No Telegram session linked. Use GET /admin/telegram/auth/send-code and POST /admin/telegram/auth/complete first";

function getAxiosErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object" || !("response" in error)) return "";
  const data = (error as { response?: { data?: unknown } }).response?.data;
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (obj.message != null) return String(obj.message);
    if (obj.error != null) return String(obj.error);
  }
  return "";
}

export function isNoTelegramSessionLinkedError(error: unknown): boolean {
  const msg = getAxiosErrorMessage(error);
  return (
    msg.includes("No Telegram session linked") ||
    msg === NO_TELEGRAM_SESSION_MESSAGE
  );
}

export const useTelegramGroups = () => {
  return useQuery({
    queryKey: TELEGRAM_GROUPS_KEY,
    queryFn: async () => {
      try {
        const res = await http.get("/admin/telegram/groups");
        return normalizeGroupsPayload(extractTelegramGroupsBody(res));
      } catch (e: unknown) {
        if (isNoTelegramSessionLinkedError(e)) {
          return { groups: [], telegramSession: false } satisfies TelegramGroupsPayload;
        }
        throw e;
      }
    },
  });
};

export const useSendTelegramCode = () => {
  return useMutation({
    mutationFn: async () => {
      const res = await http.get("/admin/telegram/auth/send-code");
      return res?.data?.data;
    },
  });
};

type CompleteTelegramAuthBody = {
  phoneCode: string;
  password: string;
};

export const useCompleteTelegramAuth = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CompleteTelegramAuthBody) => {
      const res = await http.post("/admin/telegram/auth/complete", body);
      return res?.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TELEGRAM_GROUPS_KEY });
    },
  });
};

/**
 * Message list from GET /admin/telegram/messages.
 *
 * **Media previews** in the UI use either a `url` / `thumbUrl` on each media
 * object, or an authenticated binary endpoint:
 * `GET /admin/telegram/media?channelId=&topicId=&messageId=&kind=photo|video`
 * (`topicId` optional; `kind` is `photo` or `video`).
 */
export const useTelegramMessages = (
  channelId: string | number | null,
  topicId: number | null = null,
  beforeMessageId: number | null = null,
  limit = 50
) => {
  return useQuery({
    queryKey: ["telegram", "messages", channelId, topicId, beforeMessageId, limit],
    enabled: channelId != null && channelId !== "",
    queryFn: async () => {
      const params: Record<string, string | number> = {
        channelId: String(channelId),
        limit,
      };
      if (topicId != null && !Number.isNaN(Number(topicId))) {
        params.topicId = Number(topicId);
      }
      if (beforeMessageId != null && !Number.isNaN(Number(beforeMessageId))) {
        params.beforeMessageId = Number(beforeMessageId);
      }
      const res = await http.get("/admin/telegram/messages", { params });
      const raw = res?.data?.data ?? res?.data;
      if (Array.isArray(raw)) {
        return {
          messages: raw,
          limit,
          hasMore: false,
          nextBeforeMessageId: null,
        };
      }
      if (raw && typeof raw === "object") {
        const node = raw as Record<string, unknown>;
        const list = Array.isArray(node.messages) ? node.messages : [];
        return {
          messages: list,
          limit:
            typeof node.limit === "number"
              ? node.limit
              : node.limit != null
                ? Number(node.limit)
                : limit,
          hasMore: Boolean(node.hasMore),
          nextBeforeMessageId:
            typeof node.nextBeforeMessageId === "number"
              ? node.nextBeforeMessageId
              : node.nextBeforeMessageId != null
                ? Number(node.nextBeforeMessageId)
                : null,
        };
      }
      // TanStack Query v5: queryFn must not return undefined.
      return {
        messages: [],
        limit,
        hasMore: false,
        nextBeforeMessageId: null,
      };
    },
  });
};
