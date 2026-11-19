"use client"

import { useChangePassword, useLoginMutation } from "@/api/auth";
import { Button, Card, Input } from "@/components/ui";
import { useToast } from "@/components/ui/toast/ToastContext";
import { useAuth } from "@/hooks/use-auth";
import { getCrossSubdomainCookie } from "@/lib/utils";
import { ChangePasswordFormTypes, LoginFormTypes } from "@/types/types";
import { AxiosError } from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { RiCopyrightLine, RiQuestionFill } from "react-icons/ri";

export default function ChangePassword() {
  const [formValues, setFormValues] = useState<ChangePasswordFormTypes>({
    token: '',
    newPassword: '',
    confirmPassword: ''
  });

  const { mutateAsync: changePassword, isPending: isChangePasswordLoading } = useChangePassword();
  const { toast } = useToast();
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setFormValues(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const { token, newPassword, confirmPassword } = formValues;

    try {
      const data: ChangePasswordFormTypes = {
        token,
        newPassword,
        confirmPassword
      };
      await changePassword(data);
      toast({
        variant: "success",
        title: "Success",
        description: "Password changed successfully",
        duration: 2000
      });
      router.push('/');
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      toast({
        variant: "danger",
        title: "Error",
        description: err.response?.data?.message ??
          err.message ??
          "Something went wrong, please try again",
      });
    }
  }

  return (
    <div className="flex justify-center items-center h-screen bg-(--background)">
      <div className="fixed top-0 w-full flex justify-between items-center px-8 py-4">
        <h2 className="text-xl font-bold">440 Global Shopping</h2>
        <Link href={''} className="inline-flex gap-1 items-center">
          <RiQuestionFill className="text-(--muted)" />
          <span className="text-(--muted)">Support</span>
        </Link>
      </div>
      <Card className="w-[90%] max-w-125 p-8!">
        <form onSubmit={handleSubmit}>
          <div className="mt-4 mb-8 text-center">
            <h3 className="text-2xl font-bold">Change Password</h3>
            <p className="text-(--muted)">Please enter your new password</p>
          </div>
          <Input 
            element="input"
            placeholder="Enter token sent to your email"
            tag="Token"
            name="token"
            value={formValues.token}
            handler={handleChange}
            required
          />
          <Input 
            input_type="password"
            element="input"
            placeholder="Enter your new password"
            tag="New Password"
            name="newPassword"
            value={formValues.newPassword}
            handler={handleChange}
            required
          />
          <Input
            input_type="password"
            element="input"
            tag="Confirm Password"
            placeholder="Confirm your new password"
            name="confirmPassword"
            value={formValues.confirmPassword}
            handler={handleChange}
            required
          />
          <Button 
            primary 
            isFullWidth
            type="submit"
            isLoading={isChangePasswordLoading}
          >
            {isChangePasswordLoading ? "Changing password..." : "Change Password"}
          </Button>
        </form>
      </Card>
      <div className="fixed bottom-0 w-full flex gap-1 justify-center items-center px-8 py-4 text-(--muted) text-sm">
        <RiCopyrightLine />
        <p>
          { new Date().getFullYear() } 440 GLOBAL SHOPPING LTD. ALL RIGHTS RESERVED.
        </p>
      </div>
    </div>
  );
}