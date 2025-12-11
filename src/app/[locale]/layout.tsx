import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "../globals.css";
import { ModeProvider } from "@/context/ModeContext";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { LanguageSelectorModal } from "@/components/LanguageSelectorModal";

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

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Ensure that the incoming `locale` is valid
  if (!['en', 'zh'].includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${inter.variable} ${mono.variable}`}>
      <body className="antialiased font-sans">
        <NextIntlClientProvider messages={messages}>
          <ModeProvider>
            {children}
            <LanguageSelectorModal />
          </ModeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
