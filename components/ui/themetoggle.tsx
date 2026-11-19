"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { RiSunLine, RiMoonLine } from "react-icons/ri";
import Button from "./button";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <Button
      onClick={() =>
        setTheme(resolvedTheme === "dark" ? "light" : "dark")
      }
      className="p-2! rounded-lg"
      primary
      isFullWidth
    >
      {resolvedTheme === "dark" ? <span className="flex gap-1 items-center">Light Mode: <RiSunLine /></span> : <span className="flex gap-1 items-center">Dark Mode: <RiMoonLine /></span>}
    </Button>
  );
}
