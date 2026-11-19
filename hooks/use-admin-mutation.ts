"use client";

import { useMutation, useQueryClient, type QueryKey, type UseMutationOptions } from "@tanstack/react-query";
import { useToast } from "@/components/ui/toast/ToastContext";
import { describeApiError, getApiError, type ApiError } from "@/lib/api-error";

type Options<TData, TVars> = Omit<UseMutationOptions<TData, unknown, TVars>, "onError" | "onSuccess"> & {
  /** Toast title on success. Leave out to stay silent (the form closes itself instead). */
  successMessage?: string | ((data: TData, vars: TVars) => string);
  /** Toast title on failure. Defaults to the backend's message. */
  errorTitle?: string;
  /** Every list or detail these writes make stale. */
  invalidate?: QueryKey[] | ((data: TData, vars: TVars) => QueryKey[]);
  /** Runs after the success toast and the invalidation. */
  onSuccess?: (data: TData, vars: TVars) => void;
  /** Runs after the error toast, with the parsed backend error (e.g. to mark fields or branch on `code`). */
  onError?: (error: ApiError, vars: TVars) => void;
  /** Skip the error toast when the caller shows the error itself (e.g. next to the field). */
  silentError?: boolean;
};

/**
 * `useMutation` plus what every admin form was hand-writing: refresh the affected queries, toast success,
 * and toast the backend's error *with its per-field reasons* instead of just "Validation error".
 */
export function useAdminMutation<TData = unknown, TVars = void>(options: Options<TData, TVars>) {
  const { successMessage, errorTitle, invalidate, onSuccess, onError, silentError, ...rest } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<TData, unknown, TVars>({
    ...rest,
    onSuccess: (data, vars) => {
      const keys = typeof invalidate === "function" ? invalidate(data, vars) : invalidate;
      keys?.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
      if (successMessage) {
        const title = typeof successMessage === "function" ? successMessage(data, vars) : successMessage;
        toast({ title, description: "", variant: "success" });
      }
      onSuccess?.(data, vars);
    },
    onError: (error, vars) => {
      const parsed = getApiError(error);
      if (!silentError) {
        toast({
          title: errorTitle ?? parsed.message,
          description: parsed.issues.length ? describeApiError(parsed) : errorTitle ? parsed.message : "",
          variant: "danger",
        });
      }
      onError?.(parsed, vars);
    },
  });
}
