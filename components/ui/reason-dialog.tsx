"use client";

import { useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Field,
  Label,
  Description,
  Switch, } from "@headlessui/react";
import { RiLoader4Fill } from "react-icons/ri";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  reasonLabel?: string;
  placeholder?: string;
  confirmLabel: string;
  /** The backend refuses reasons shorter than this (void payment: 5, void/reverse charge: 3). */
  minLength?: number;
  maxLength?: number;
  danger?: boolean;
  isPending?: boolean;
  /** Shown under the box, e.g. the backend's message when the last attempt failed. */
  error?: string;
  toggle?: {
    label: string;
    description?: string;
    defaultChecked?: boolean;
  };
  onConfirm: (reason: string, toggled: boolean) => void;
  onClose: () => void;
};

/**
 * One "why are you doing this" dialog for void and reverse actions. It traps focus, closes on Esc, trims the
 * reason before sending it, and cannot be confirmed while the reason is too short or a request is running.
 */
const ReasonDialog = ({
  open,
  title,
  description,
  reasonLabel = "Reason",
  placeholder,
  confirmLabel,
  minLength = 3,
  maxLength = 500,
  danger = true,
  isPending,
  error,
  toggle,
  onConfirm,
  onClose,
}: Props) => {
  const [reason, setReason] = useState("");
  const [toggled, setToggled] = useState(toggle?.defaultChecked ?? false);
  const trimmed = reason.trim();
  const tooShort = trimmed.length < minLength;

  const close = () => {
    if (isPending) return;
    setReason("");
    setToggled(toggle?.defaultChecked ?? false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={close} className="relative z-60">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-lg rounded-xl bg-(--card) p-6">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          {description && (
            <p className="mt-2 text-sm text-(--muted)">{description}</p>
          )}

          <form
            className="mt-5 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!tooShort && !isPending) onConfirm(trimmed, toggled);
            }}
          >
            <label className="block text-sm font-semibold">
              {reasonLabel} <span className="text-red-500">*</span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={placeholder}
                required
                minLength={minLength}
                maxLength={maxLength}
                rows={4}
                autoFocus
                aria-invalid={!!error}
                className="mt-2 w-full rounded-lg border border-(--table-border) bg-transparent p-3 text-sm focus-within:outline-none focus-within:ring-2 focus-within:ring-(--primary)"
              />
            </label>
            <p className="-mt-2 text-xs text-(--muted)">
              At least {minLength} characters.
            </p>
            {error && (
              <p role="alert" className="text-sm text-red-500">
                {error}
              </p>
            )}

            {toggle && (
              <Field className="flex items-center justify-between gap-4">
                <div>
                  <Label className="text-sm font-semibold">{toggle.label}</Label>
                  {toggle.description && (
                    <Description className="text-xs text-(--muted)">
                      {toggle.description}
                    </Description>
                  )}
                </div>
                <Switch
                  checked={toggled}
                  onChange={setToggled}
                  disabled={isPending}
                  className="group relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-gray-300 transition data-checked:bg-(--primary) disabled:opacity-50"
                >
                  <span className="size-4 translate-x-1 rounded-full bg-white transition group-data-checked:translate-x-6" />
                </Switch>
              </Field>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={close}
                disabled={isPending}
                className="rounded-lg border border-(--table-border) px-4 py-2 text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={tooShort || isPending}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-white disabled:opacity-50 ${
                  danger ? "bg-red-600" : "bg-(--primary)"
                }`}
              >
                {isPending && <RiLoader4Fill className="animate-spin" />}
                {confirmLabel}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default ReasonDialog;
