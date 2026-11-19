"use client"

import { useLoginMutation } from "@/api/auth";
import { Button, Card, Input } from "@/components/ui";
import { useToast } from "@/components/ui/toast/ToastContext";
import { useAuth } from "@/hooks/use-auth";
import { getCrossSubdomainCookie } from "@/lib/utils";
import { LoginFormTypes } from "@/types/types";
import { AxiosError } from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { RiCopyrightLine, RiQuestionFill } from "react-icons/ri";

export default function Home() {
  useEffect(() => {
    const token = getCrossSubdomainCookie("admin_token");

    if(token) {
      toast({
        title: "Redirect",
        description: "Redirecting to dashboard",
        duration: 2000
      });
      router.push('/dashboard');
    }
  }, []);
  

  const [formValues, setFormValues] = useState<LoginFormTypes>({
    email: '',
    password: ''
  });

  const { mutateAsync: loginUser, isPending: isLoginLoading } = useLoginMutation();
  const { authenticate } = useAuth();
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
    const { email, password } = formValues;

    try {
      const data: LoginFormTypes = {
        email,
        password
      }
      const res = await loginUser(data);
      if (res.status === 200) {
        toast({
          variant: "success",
          title: "Success",
          description: "Login successful",
          duration: 2000
        });

        const token = res.data?.data?.accessToken;
        const user = res.data?.data?.adminUser;
        const refresh = res.data?.data?.refreshToken;
        const role = res.data?.data?.role;
        const isSuper = res.data?.data?.isSuper;
        const permissions = res.data?.data?.permissions;

        authenticate({ user, token, refresh, role, isSuper, permissions });

        router.push('/dashboard')
      } else {
        toast({
          variant: "danger",
          title: "Error",
          description: "Something went wrong"
        });
      }
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
            <h3 className="text-2xl font-bold">Admin Back Office</h3>
            <p className="text-(--muted)">Please enter your credentials to manage global orders</p>
          </div>
          <Input 
            input_type="email"
            element="input"
            placeholder="Enter your email address"
            tag="Email Address"
            name="email"
            value={formValues.email}
            handler={handleChange}
            required
          />
          <Input
            input_type="password"
            element="input"
            tag="Password"
            placeholder="Enter your password"
            name="password"
            value={formValues.password}
            handler={handleChange}
            required
          />
          <div className="flex justify-between items-center mb-8">
            <div className="flex gap-1 items-center">
              <input type="checkbox" className="border border-(--muted)" />
              <span className="text-(--muted) text-sm">Remember device</span>
            </div>
            <Link href={'/reset-password'} className="text-(--primary) font-semibold">
              Forgot Password?
            </Link>
          </div>
          <Button 
            primary 
            isFullWidth
            type="submit"
            isLoading={isLoginLoading}
          >
            {isLoginLoading ? "Logging in..." : "Login"}
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
