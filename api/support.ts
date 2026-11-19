import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import http from "@/lib/http";
import {
  SupportConversation,
  SupportConversationListPayload,
  SupportConversationMessagesPayload,
  SupportConversationStatus,
  SupportMessage,
  SupportStats,
} from "@/types/types";

type SupportConversationsParams = {
  status?: SupportConversationStatus | "all";
  agentId?: number;
  page?: number;
  limit?: number;
};

type SendSupportMessageBody = {
  content?: string;
  contentType?: "text" | "image" | "file";
  attachmentUrl?: string;
  attachmentKey?: string;
  attachmentMimeType?: string;
  attachmentSize?: number;
};

type ChangeSupportStatusBody = {
  status: SupportConversationStatus;
};

type MarkSupportReadInput = {
  conversationId: number;
  messageId: number;
};

const SUPPORT_CONVERSATIONS_KEY = ["support", "conversations"] as const;

function unwrapData<T>(res: { data?: { data?: T } | T }): T {
  const node = res?.data;
  if (node && typeof node === "object" && "data" in node) {
    return (node as { data: T }).data;
  }
  return node as T;
}

export const useAdminSupportConversations = (params: SupportConversationsParams) => {
  return useQuery({
    queryKey: [...SUPPORT_CONVERSATIONS_KEY, params],
    queryFn: async () => {
      const query: Record<string, string | number> = {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      };
      if (params.status && params.status !== "all") query.status = params.status;
      if (params.agentId != null) query.agentId = params.agentId;

      const res = await http.get("/admin/support/conversations", { params: query });
      const data = unwrapData<{
        conversations?: SupportConversation[];
        rows?: SupportConversation[];
        total?: number;
        count?: number;
        page?: number;
        limit?: number;
      }>(res);
      const list = data?.conversations ?? data?.rows ?? [];

      return {
        conversations: list,
        page: Number(data?.page ?? params.page ?? 1),
        limit: Number(data?.limit ?? params.limit ?? 20),
        total: Number(data?.total ?? data?.count ?? list.length),
      } satisfies SupportConversationListPayload;
    },
  });
};

export const useAdminSupportConversation = (conversationId: number | null) => {
  return useQuery({
    queryKey: ["support", "conversation", conversationId],
    enabled: conversationId != null,
    queryFn: async () => {
      const res = await http.get(`/admin/support/conversations/${conversationId}`);
      const data = unwrapData<{ conversation?: SupportConversation }>(res);
      return data?.conversation ?? null;
    },
  });
};

export const useAdminSupportMessages = (conversationId: number | null, limit = 50) => {
  return useQuery({
    queryKey: ["support", "messages", conversationId, limit],
    enabled: conversationId != null,
    queryFn: async () => {
      const res = await http.get(`/admin/support/conversations/${conversationId}/messages`, {
        params: { page: 1, limit },
      });
      const data = unwrapData<{
        messages?: SupportMessage[];
        rows?: SupportMessage[];
        total?: number;
        count?: number;
        page?: number;
        limit?: number;
      }>(res);
      const list = data?.messages ?? data?.rows ?? [];
      return {
        messages: list,
        page: Number(data?.page ?? 1),
        limit: Number(data?.limit ?? limit),
        total: Number(data?.total ?? data?.count ?? list.length),
      } satisfies SupportConversationMessagesPayload;
    },
  });
};

export const useAdminSupportStats = () => {
  return useQuery({
    queryKey: ["support", "stats"],
    queryFn: async () => {
      const res = await http.get("/admin/support/stats");
      const data = unwrapData<{ stats?: Partial<SupportStats> }>(res);
      const stats = data?.stats;
      return {
        open: Number(stats?.open ?? 0),
        waiting: Number(stats?.waiting ?? 0),
        resolved: Number(stats?.resolved ?? 0),
        closed: Number(stats?.closed ?? 0),
        unassigned: Number(stats?.unassigned ?? 0),
        avgResponseTimeMs: Number(stats?.avgResponseTimeMs ?? 0),
      } satisfies SupportStats;
    },
  });
};

export const useSendAdminSupportMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conversationId,
      body,
    }: {
      conversationId: number;
      body: SendSupportMessageBody;
    }) => {
      const res = await http.post(
        `/admin/support/conversations/${conversationId}/messages`,
        body
      );
      const data = unwrapData<{ message?: SupportMessage }>(res);
      return data?.message ?? null;
    },
    onSuccess: (_message, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["support", "messages", vars.conversationId],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: SUPPORT_CONVERSATIONS_KEY,
        exact: false,
      });
      queryClient.invalidateQueries({ queryKey: ["support", "stats"] });
    },
  });
};

export const useMarkAdminSupportRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId, messageId }: MarkSupportReadInput) => {
      await http.put(
        `/admin/support/conversations/${conversationId}/messages/${messageId}/read`
      );
      return { conversationId, messageId };
    },
    onSuccess: ({ conversationId }) => {
      queryClient.invalidateQueries({
        queryKey: ["support", "messages", conversationId],
        exact: false,
      });
    },
  });
};

export const useChangeAdminSupportConversationStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conversationId,
      body,
    }: {
      conversationId: number;
      body: ChangeSupportStatusBody;
    }) => {
      const res = await http.patch(
        `/admin/support/conversations/${conversationId}/status`,
        body
      );
      const data = unwrapData<{ conversation?: SupportConversation }>(res);
      return data?.conversation ?? null;
    },
    onSuccess: (_conversation, vars) => {
      queryClient.invalidateQueries({ queryKey: ["support", "conversation", vars.conversationId] });
      queryClient.invalidateQueries({ queryKey: SUPPORT_CONVERSATIONS_KEY, exact: false });
      queryClient.invalidateQueries({ queryKey: ["support", "stats"] });
    },
  });
};
