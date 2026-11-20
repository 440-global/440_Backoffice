"use client";

import React, { useState } from "react";
import { cn } from "./utils";

type Props = {
  value: number;
  /** `typed` is false when the box was left empty, so a blank is not mistaken for a 0. */
  onChange: (value: number, typed: boolean) => void;
  tag?: string;
  name?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  styling?: string;
  genStyle?: string;
  /** Red asterisk on the label, and the native `required` attribute (an empty box blocks submit). */
  required?: boolean;
  /** Muted "(optional)" after the label. */
  optional?: boolean;
  error?: string;
  helperText?: string;
  /** The value is clamped into [min, max] when the field loses focus. */
  min?: number;
  max?: number;
  /** Whole numbers only: no decimal point can be typed. */
  integer?: boolean;
  /** A typed 0 stays visible. Without it 0 and "nothing typed" both show blank. */
  allowZero?: boolean;
};

function formatAmount(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 20 }).format(
    value,
  );
}

function parseAmount(str: string): number {
  const cleaned = str.replace(/,/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

const AmountInput = ({
  value,
  onChange,
  tag,
  name,
  id,
  placeholder = "0",
  disabled,
  styling = "",
  genStyle = "",
  required,
  optional,
  error,
  helperText,
  min,
  max,
  integer,
  allowZero,
}: Props) => {
  const [isFocused, setIsFocused] = useState(false);
  // Raw text, only used while the field is focused.
  const [inputValue, setInputValue] = useState("");
  // Set when the user typed a 0 on purpose, so it is not mistaken for an empty box.
  const [typedZero, setTypedZero] = useState(false);

  const fieldId = id ?? name;
  const messageId = fieldId ? `${fieldId}-message` : undefined;
  const hasMessage = !!(error || helperText);
  const pattern = integer ? /^[0-9]*$/ : /^[0-9]*\.?[0-9]*$/;

  // Whether a blank box or the number should be shown for the current value.
  const showValue = !!value || (!!allowZero && typedZero);

  // Derived during render: raw text while typing, formatted value otherwise.
  const displayValue = isFocused
    ? inputValue
    : showValue
      ? formatAmount(value)
      : "";

  const handleFocus = () => {
    setIsFocused(true);
    setInputValue(showValue ? String(value) : "");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (pattern.test(raw)) {
      setInputValue(raw);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const typed = inputValue.trim() !== "";
    let num = parseAmount(inputValue);
    if (typed) {
      if (min !== undefined && num < min) num = min;
      if (max !== undefined && num > max) num = max;
    }
    setTypedZero(typed && num === 0);
    onChange(num, typed);
  };

  return (
    <div className={cn("my-4", genStyle)}>
      {tag && (
        <label htmlFor={fieldId} className="block font-semibold mb-1">
          {tag}
          {required && (
            <span className="text-red-500 ml-1" aria-hidden="true">
              *
            </span>
          )}
          {!required && optional && (
            <span className="ml-1 text-xs font-normal text-(--muted)">
              (optional)
            </span>
          )}
        </label>
      )}
      <input
        id={fieldId}
        type="text"
        inputMode={integer ? "numeric" : "decimal"}
        name={name}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        aria-describedby={hasMessage ? messageId : undefined}
        className={cn(
          "w-full p-3 bg-(--bg-surface) rounded-lg border border-slate-200 focus:border focus:outline-(--primary) disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-red-400 focus:outline-red-400",
          styling,
        )}
      />
      {error ? (
        <p id={messageId} role="alert" className="mt-1 text-xs text-red-500">
          {error}
        </p>
      ) : helperText ? (
        <p id={messageId} className="mt-1 text-xs text-(--muted)">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};

export default AmountInput;