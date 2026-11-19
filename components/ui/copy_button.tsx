"use client"

import { useState } from "react";
import { RiCheckLine, RiFileCopyLine } from "react-icons/ri";
import { useToast } from "./toast/ToastContext";
import { cn } from "./utils";

function CopyButton({
  value,
  label = "Copy",
  type,
  showLabel = false,
  className,
}: {
  value: string;
  label?: string;
  type: "link" | "text" | "token";
  showLabel?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast({
        variant: "success",
        title: "Success",
        description:
          type == "link"
            ? "Link copied"
            : type == "token"
              ? "Token copied"
              : "Text copied",
        duration: 2000,
      });
    } catch {
      /* clipboard unavailable, ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className={cn(
        "rounded-md p-1 text-(--text-muted) transition hover:bg-black/5 hover:text-(--primary) dark:hover:bg-white/10",
        showLabel && "flex w-full items-center gap-2 px-3 py-2 text-sm",
        className,
      )}
    >
      {copied ? (
        <RiCheckLine className="text-emerald-500" />
      ) : (
        <RiFileCopyLine />
      )}
      {showLabel && <span>{copied ? "Copied" : label}</span>}
    </button>
  );
}

export default CopyButton