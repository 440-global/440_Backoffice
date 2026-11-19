import type { AxiosError } from "axios";

export type FieldIssue = { field: string; message: string };

export type ApiError = {
  /** What to show as the headline. */
  message: string;
  /** One entry per rejected field, when the backend said which. */
  issues: FieldIssue[];
  /** Machine code such as CUSTOMER_EXISTS or OVERPAYMENT, when the backend sent one. */
  code?: string;
  /** Extra facts attached to the code (existing ids, remaining balance, matches...). */
  details?: unknown;
  status?: number;
};

type Body = {
  message?: string;
  errors?: unknown;
  code?: string;
  details?: unknown;
};

const GENERIC = "Something went wrong. Please try again.";

/** Zod issues use `path: (string|number)[]`; the app's own validation errors use `field`. */
function toIssues(raw: unknown): FieldIssue[] {
  if (!Array.isArray(raw)) return [];
  const issues: FieldIssue[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const e = item as { field?: unknown; path?: unknown; message?: unknown };
    const message = typeof e.message === "string" ? e.message : "";
    if (!message) continue;
    const field =
      typeof e.field === "string"
        ? e.field
        : Array.isArray(e.path)
          ? e.path.join(".")
          : "";
    issues.push({ field, message });
  }
  return issues;
}

/** Turns anything a request can throw into one shape every form can show. */
export function getApiError(error: unknown): ApiError {
  const err = error as AxiosError<Body> | undefined;
  const body = err?.response?.data;
  if (body && typeof body === "object") {
    return {
      message: body.message || err?.message || GENERIC,
      issues: toIssues(body.errors),
      code: body.code,
      details: body.details,
      status: err?.response?.status,
    };
  }
  if (err?.message) return { message: err.message, issues: [] };
  return { message: GENERIC, issues: [] };
}

/** "Name: too short; Email: invalid" for a toast; the headline alone when there are no field issues. */
export function describeApiError(error: ApiError): string {
  if (!error.issues.length) return error.message;
  const lines = error.issues.map((i) => (i.field ? `${labelize(i.field)}: ${i.message}` : i.message));
  return lines.join("\n");
}

/** `payment.bankReference` -> `Bank reference`. */
export function labelize(path: string): string {
  const last = path.split(".").pop() ?? path;
  const spaced = last.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

/** Maps backend issues to `{ "payment.bankReference": "message" }` so a form can mark each field. */
export function issuesByField(error: ApiError): Record<string, string> {
  const map: Record<string, string> = {};
  for (const i of error.issues) {
    if (i.field && !map[i.field]) map[i.field] = i.message;
  }
  return map;
}
