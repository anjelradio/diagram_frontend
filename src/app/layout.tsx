import type { Metadata } from "next";
import "@/styles/globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sileo";
import { appFontVariables } from "@/styles/fonts";

export const metadata: Metadata = {
  title: "Diagram - ERD With IA",
  description:
    "Crea y Disena tus bases de datos colaborativamente.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        appFontVariables,
        "font-sans",
      )}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-center" theme="light" />
      </body>
    </html>
  );
}
