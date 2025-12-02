import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ModeProvider } from "@/context/ModeContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ChefsManual - 厨房里的智能导航",
  description: "将烹饪拆解为精确的工程步骤。ChefsManual 提供实时计时、多菜调度与 SOP 标准化指导。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${mono.variable}`}>
      <body className="antialiased font-sans">
        <ModeProvider>
          {children}
        </ModeProvider>
      </body>
    </html>
  );
}
