import type { Metadata } from "next";
import { Cormorant_Garamond, Noto_Sans_Thai, Italiana } from "next/font/google";
import "./globals.css";
import PresenceTracker from "@/components/PresenceTracker";

const cormorant = Cormorant_Garamond({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: '--font-cormorant'
});

const notoSansThai = Noto_Sans_Thai({ 
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: '--font-noto'
});

const italiana = Italiana({ 
  subsets: ["latin"],
  weight: ["400"],
  variable: '--font-italiana'
});

export const metadata: Metadata = {
  title: "Bear has flower",
  description: "ร้านดอกไม้ Bear has flower ออกแบบช่อดอกไม้ กุหลาบกลิตเตอร์ ดอกไม้ลวดกำมะหยี่",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${cormorant.variable} ${notoSansThai.variable} ${italiana.variable}`}>
        {children}
        <PresenceTracker />
      </body>
    </html>
  );
}
