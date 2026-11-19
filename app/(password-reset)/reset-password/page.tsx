"use client";

import { useResetPassword } from "@/api/auth";
import { Button, Card, Input } from "@/components/ui";
import { useToast } from "@/components/ui/toast/ToastContext";
import { AxiosError } from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { RiCopyrightLine, RiQuestionFill } from "react-icons/ri";

export default function ResetPassword() {
  const [email, setEmail] = useState<string>("");
  const { mutateAsync: resetPassword, isPending: isResetLoading } =
    useResetPassword();
  const { toast } = useToast();
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        email,
      };
      const res = await resetPassword(data);
      if (res.status === 200) {
        toast({
          variant: "success",
          title: "Success",
          description: res.data.message ?? "Reset instructions sent to your email",
          duration: 2000,
        });

        router.push("/change-password");
      } else {
        toast({
          variant: "danger",
          title: "Error",
          description: "Something went wrong",
        });
      }
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      toast({
        variant: "danger",
        title: "Error",
        description:
          err.response?.data?.message ??
          err.message ??
          "Something went wrong, please try again",
      });
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-(--background)">
      <div className="fixed top-0 w-full flex justify-between items-center px-8 py-4">
        <h2 className="text-xl font-bold">440 Global Shopping</h2>
        <Link href={""} className="inline-flex gap-1 items-center">
          <RiQuestionFill className="text-(--muted)" />
          <span className="text-(--muted)">Support</span>
        </Link>
      </div>
      <Card className="w-[90%] max-w-125 p-8!">
        <form onSubmit={handleSubmit}>
          <div className="mt-4 mb-8 text-center">
            <h3 className="text-2xl font-bold">Reset Password</h3>
            <p className="text-(--muted)">
              Please enter your email address to receive password reset instructions
            </p>
          </div>
          <Input
            input_type="email"
            element="input"
            placeholder="Enter your email address"
            tag="Email Address"
            name="email"
            value={email}
            handler={handleChange}
            required
          />
          <Button primary isFullWidth type="submit" isLoading={isResetLoading}>
            {isResetLoading ? "Sending reset instructions..." : "Reset Password"}
          </Button>
        </form>
      </Card>
      <div className="fixed bottom-0 w-full flex gap-1 justify-center items-center px-8 py-4 text-(--muted) text-sm">
        <RiCopyrightLine />
        <p>
          {new Date().getFullYear()} 440 GLOBAL SHOPPING LTD. ALL RIGHTS
          RESERVED.
        </p>
      </div>
    </div>
  );
}