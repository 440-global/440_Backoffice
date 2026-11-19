import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/providers/providers";
import { ThemeProvider } from "next-themes";

export const metadata: Metadata = {
  title: {
    default: "Merchant Back Office",
    template: "%s | Merchant Back Office",
  },
  description: "Back office dashboard for merchants",
  icons: {
    icon: "/images/favicon.svg",
    shortcut: "/images/favicon.svg",
    apple: "/images/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`antialiased`}
      >
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
