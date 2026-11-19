import { cn } from "@/components/ui/utils";

/** Spinner matching `Quotations/Loader` — sized for cards/panels (not full viewport). */
export default function QuotationLoader({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex min-h-[200px] items-center justify-center rounded-lg bg-(--card)",
        className
      )}
    >
      <div
        className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-[var(--primary)] border-t-transparent"
        aria-hidden
      />
    </div>
  );
}
