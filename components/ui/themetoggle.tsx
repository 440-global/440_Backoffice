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
      className="rounded-full w-10 h-10 p-0!"
      primary
    >
      {resolvedTheme === "dark" ? <RiSunLine /> : <RiMoonLine />}
    </Button>
  );
}
