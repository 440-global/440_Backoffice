"use client";

import React, { useState } from "react";
import { useAddCustomer } from "@/api/customers";
import { useToast } from "../ui/toast/ToastContext";
import { getApiError, issuesByField } from "@/lib/api-error";
import type { AddCustomerPayload } from "@/types/types";
import { Button, Input } from "../ui";

type Props = {
  onSuccess: () => void;
};

type FormValues = Required<AddCustomerPayload>;

const defaultValues: FormValues = {
  name: "",
  email: "",
  phone: "",
  shopName: "",
  address: "",
  temporaryPassword: "",
};

const AddCustomer = ({ onSuccess }: Props) => {
  const [values, setValues] = useState<FormValues>(defaultValues);
  const { toast } = useToast();
  const { mutate, isPending, error } = useAddCustomer();
  const parsed = error ? getApiError(error) : null;
  const fieldErrors = parsed ? issuesByField(parsed) : {};

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // A blank optional box means "not given": the backend fills in the shop name and the password.
    const trimmed = (v: string) => v.trim() || undefined;
    const payload: AddCustomerPayload = {
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      shopName: trimmed(values.shopName),
      address: trimmed(values.address),
      temporaryPassword: values.temporaryPassword || undefined,
    };

    mutate(payload, {
      onSuccess: (res) => {
        // The customer exists either way. If the email failed they cannot log in yet, so say so plainly.
        if (res.data.welcomeEmailSent) {
          toast({ title: "Customer added", description: "A welcome email with their login has been sent.", variant: "success" });
        } else {
          toast({
            title: "Customer added, but the email did not send",
            description: "Use \"Resend welcome email\" on their row so they get their login details.",
            variant: "warning",
            duration: 10000,
          });
        }
        setValues(defaultValues);
        onSuccess();
      },
    });
  };

  const passwordTooShort = values.temporaryPassword.length > 0 && values.temporaryPassword.length < 8;

  return (
    <form onSubmit={handleSubmit}>
      <Input
        element="input"
        name="name"
        value={values.name}
        handler={handleChange}
        placeholder="Enter customer name"
        tag="Customer name"
        required
        maxLength={120}
        error={fieldErrors.name}
      />
      <Input
        element="input"
        input_type="email"
        name="email"
        value={values.email}
        handler={handleChange}
        placeholder="Enter customer email"
        tag="Customer email"
        required
        maxLength={190}
        error={fieldErrors.email}
      />
      <Input
        element="input"
        input_type="tel"
        name="phone"
        value={values.phone}
        handler={handleChange}
        placeholder="08031234567 or +2348031234567"
        tag="Customer phone"
        required
        maxLength={32}
        error={fieldErrors.phone}
      />
      <Input
        element="input"
        name="shopName"
        value={values.shopName}
        handler={handleChange}
        placeholder="Enter business name"
        tag="Business name"
        helperText="Leave empty to use the customer's name."
        optional
        maxLength={190}
        error={fieldErrors.shopName}
      />
      <Input
        element="input"
        name="address"
        value={values.address}
        handler={handleChange}
        placeholder="Enter business address"
        tag="Business address"
        optional
        maxLength={500}
        error={fieldErrors.address}
      />
      <Input
        element="input"
        input_type="password"
        name="temporaryPassword"
        value={values.temporaryPassword}
        handler={handleChange}
        placeholder="At least 8 characters"
        tag="Temporary password"
        helperText="Leave empty and a password is generated and emailed to the customer. They must change it at first login."
        optional
        maxLength={128}
        error={fieldErrors.temporaryPassword ?? (passwordTooShort ? "Use at least 8 characters." : undefined)}
      />
      {parsed && !Object.keys(fieldErrors).length && (
        <p role="alert" className="mb-3 text-sm text-red-500">
          {parsed.code === "CUSTOMER_EXISTS" ? "A customer with this email or phone already exists." : parsed.message}
        </p>
      )}
      <Button type="submit" primary isFullWidth isLoading={isPending} disabled={passwordTooShort}>
        {isPending ? "Adding customer..." : "Add customer"}
      </Button>
    </form>
  );
};

export default AddCustomer;
