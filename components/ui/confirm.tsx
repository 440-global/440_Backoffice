"use client";

import React, { createContext, useContext, useState } from "react";

type ConfirmOptions = {
  title?: string;
  message: string;
};

type ConfirmContextType = {
  confirm: (options: string | ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside ConfirmProvider");
  return ctx.confirm;
};

export const ConfirmProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<(value: boolean) => void>();

  const confirm = (opts: string | ConfirmOptions) => {
    const normalized = typeof opts === "string" ? { message: opts } : opts;

    setOptions(normalized);
    setOpen(true);

    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  };

  const handleClose = () => {
    setOpen(false);
    resolver?.(false);
  };

  const handleConfirm = () => {
    setOpen(false);
    resolver?.(true);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-100">
          <div className="bg-(--card) p-6 rounded-xl w-100">
            <h2 className="text-lg font-semibold mb-2">
              {options?.title || "Confirm Action"}
            </h2>

            <p className="text-sm text-(--muted) mb-6">{options?.message}</p>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-(--table-border) rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};