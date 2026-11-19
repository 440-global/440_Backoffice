"use client";

import React, { useState } from "react";
import { RiEyeLine, RiEyeOffLine } from "react-icons/ri";
import { cn } from "./utils";
import AmountInput from "./amount-input";

type CheckboxOption = {
  value: string;
  label?: string;
  node?: React.ReactNode;
};

type Props = {
  element: "input" | "select" | "textarea";
  input_type?:
    | "text"
    | "email"
    | "tel"
    | "password"
    | "radio"
    | "checkbox"
    | "number"
    | "date"
    | "datetime-local";
  name: string;
  value: string | string[] | number | number[] | null;
  handler: (e: React.ChangeEvent<any>) => void;
  onFocus?: () => void;

  tag?: string;
  placeholder?: string;
  /** Red asterisk on the label, and the native `required` attribute. */
  required?: boolean;
  /** Muted "(optional)" after the label. Use on every field that is not required. */
  optional?: boolean;
  disabled?: boolean;
  /** Defaults to `name`; ties the label to the control. */
  id?: string;
  /** Shown under the field in red and read out by screen readers. */
  error?: string;
  helperText?: string;
  min?: number;
  max?: number;
  /** Number fields: whole numbers only. */
  integer?: boolean;
  /** Number fields: a typed 0 stays visible instead of turning blank. */
  allowZero?: boolean;
  maxLength?: number;

  selectOptions?: {
    label: string;
    value: string;
  }[];
  radioOptions?: string[];
  checkboxOptions?: CheckboxOption[];
  invisible?: boolean;

  styling?: string;
  genStyle?: string;

  leftIcon?: React.ReactNode;
};

const InputWrapper = ({
  children,
  leftIcon,
}: {
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
}) => (
  <div className="relative flex items-center">
    {leftIcon && (
      <span className="absolute left-3 text-gray-400 pointer-events-none">
        {leftIcon}
      </span>
    )}
    {children}
  </div>
);

const FieldLabel = ({
  htmlFor,
  tag,
  required,
  optional,
}: {
  htmlFor?: string;
  tag?: string;
  required?: boolean;
  optional?: boolean;
}) =>
  tag ? (
    <label htmlFor={htmlFor} className="block font-semibold mb-1">
      {tag}
      {required && (
        <span className="text-red-500 ml-1" aria-hidden="true">
          *
        </span>
      )}
      {!required && optional && (
        <span className="ml-1 text-xs font-normal text-(--muted)">(optional)</span>
      )}
    </label>
  ) : null;

const FieldMessage = ({ id, error, helperText }: { id: string; error?: string; helperText?: string }) => {
  if (error) {
    return (
      <p id={id} role="alert" className="mt-1 text-xs text-red-500">
        {error}
      </p>
    );
  }
  return helperText ? (
    <p id={id} className="mt-1 text-xs text-(--muted)">
      {helperText}
    </p>
  ) : null;
};

const errorRing = "border-red-400 focus:outline-red-400";

const Input = React.memo(({
  element,
  input_type = "text",
  name,
  value,
  handler,
  onFocus,
  tag,
  placeholder,
  required,
  optional,
  disabled,
  id,
  error,
  helperText,
  min,
  max,
  integer,
  allowZero,
  maxLength,
  selectOptions = [],
  radioOptions = [],
  checkboxOptions = [],
  styling = "",
  genStyle = "",
  leftIcon,
}: Props) => {
  const [visible, setVisible] = useState(false);
  const fieldId = id ?? name;
  const messageId = `${fieldId}-message`;
  const describedBy = error || helperText ? messageId : undefined;
  const message = <FieldMessage id={messageId} error={error} helperText={helperText} />;
  const togglePassword = () => setVisible((prev) => !prev);

  // SELECT
  if (element === "select") {
    return (
      <div className={cn("my-4", genStyle)}>
        <FieldLabel htmlFor={fieldId} tag={tag} required={required} optional={optional} />
        <select
          id={fieldId}
          name={name}
          value={value as string}
          onChange={handler}
          required={required}
          disabled={disabled}
          onFocus={onFocus}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(
            "w-full p-3 bg-(--card) rounded-lg border border-slate-200 focus:border focus:outline-(--primary) disabled:cursor-not-allowed disabled:opacity-50",
            disabled && "opacity-50 cursor-not-allowed",
            error && errorRing,
            styling,
          )}
        >
          <option value="" disabled className="text-(--muted)!">
            {placeholder}
          </option>
          {selectOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {message}
      </div>
    );
  }

  // TEXTAREA
  if (element === "textarea") {
    return (
      <div className={cn("my-4", genStyle)}>
        <FieldLabel htmlFor={fieldId} tag={tag} required={required} optional={optional} />
        <textarea
          id={fieldId}
          name={name}
          value={value as string}
          onChange={handler}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          maxLength={maxLength}
          rows={5}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(
            "w-full p-3 bg-(--card) rounded-lg border border-slate-200 focus:border focus:outline-(--primary) disabled:cursor-not-allowed disabled:opacity-50",
            error && errorRing,
            styling,
          )}
        />
        {message}
      </div>
    );
  }

  // RADIO
  if (input_type === "radio" && radioOptions.length > 0) {
    return (
      <div className={cn("my-4", genStyle)}>
        <FieldLabel htmlFor={fieldId} tag={tag} required={required} optional={optional} />
        <div
          className={`grid grid-cols-1 ${radioOptions.length < 3 ? "sm:grid-cols-2" : "sm:grid-cols-3"} gap-3`}
        >
          {radioOptions.map((option) => {
            const checked = value === option;
            return (
              <label
                key={option}
                className={cn(
                  "border rounded-lg p-3 cursor-pointer transition focus-within:ring-2 focus-within:ring-(--primary) disabled:cursor-not-allowed disabled:opacity-50",
                  checked
                    ? "border-(--primary) bg-(--primary) text-white"
                    : "border-gray-300 hover:border-(--primary)",
                  styling,
                )}
              >
                <input
                  type="radio"
                  name={name}
                  value={option}
                  checked={checked}
                  onChange={handler}
                  required={required}
                  disabled={disabled}
                  className="sr-only"
                />
                <span className="capitalize">{option}</span>
              </label>
            );
          })}
        </div>
        {message}
      </div>
    );
  }

  // CHECKBOX
  if (input_type === "checkbox" && checkboxOptions.length > 0) {
    return (
      <div className={cn("my-4", genStyle)}>
        <FieldLabel htmlFor={fieldId} tag={tag} required={required} optional={optional} />
        <div className="flex flex-wrap gap-2">
          {checkboxOptions.map((option) => {
            const checked =
              Array.isArray(value) &&
              (value as string[]).includes(option.value);
            return (
              <label
                key={option.value}
                className={cn(
                  "border rounded-md p-2 cursor-pointer transition flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50",
                  checked
                    ? "border-(--primary) ring ring-(--primary) text-(--primary) bg-(--primary)/10"
                    : "border-gray-300 hover:border-(--primary)",
                  styling,
                )}
              >
                <input
                  type="checkbox"
                  name={name}
                  value={option.value}
                  checked={checked}
                  onChange={handler}
                  disabled={disabled}
                  className="sr-only"
                />
                {option.node ?? (
                  <span className="capitalize text-sm">{option.label}</span>
                )}
              </label>
            );
          })}
        </div>
        {message}
      </div>
    );
  }

  // NUMBER
  if (input_type === "number") {
    return (
      <AmountInput
        name={name}
        tag={tag}
        placeholder={placeholder}
        disabled={disabled}
        styling={styling}
        genStyle={genStyle}
        value={Number(value) || 0}
        required={required}
        optional={optional}
        id={fieldId}
        error={error}
        helperText={helperText}
        min={min}
        max={max}
        integer={integer}
        allowZero={allowZero}
        onChange={(num) =>
          handler({
            target: { name, value: num, type: "number" },
          } as unknown as React.ChangeEvent<any>)
        }
      />
    );
  }

  // INPUT (password or default)
  return (
    <div className={cn("my-4", genStyle)}>
      <FieldLabel htmlFor={fieldId} tag={tag} required={required} optional={optional} />
      <InputWrapper leftIcon={leftIcon}>
        <input
          id={fieldId}
          type={
            input_type === "password"
              ? visible
                ? "text"
                : "password"
              : input_type
          }
          name={name}
          value={value as string}
          onChange={handler}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          maxLength={maxLength}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(
            "w-full p-3 bg-(--bg-surface) rounded-lg border border-slate-200 focus:border focus:outline-(--primary) disabled:cursor-not-allowed disabled:opacity-50",
            !!leftIcon && "pl-10",
            error && errorRing,
            styling,
          )}
        />
        {input_type === "password" && (
          <button
            type="button"
            onClick={togglePassword}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xl"
          >
            {visible ? <RiEyeOffLine /> : <RiEyeLine />}
          </button>
        )}
      </InputWrapper>
      {message}
    </div>
  );
});

export default Input;