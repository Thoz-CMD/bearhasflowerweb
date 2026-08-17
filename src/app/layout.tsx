import type { Metadata } from "next";
import { Cormorant_Garamond, Noto_Sans_Thai, Italiana } from "next/font/google";
import "./globals.css";
import PresenceTracker from "@/components/PresenceTracker";

const cormorant = Cormorant_Garamond({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: '--font-cormorant'
});

const notoSansThai = Noto_Sans_Thai({ 
  subsets: ["thai"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: '--font-noto'
});

const italiana = Italiana({ 
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: '--font-italiana'
});

export const metadata: Metadata = {
  title: "Bear has flower",
  description: "ร้านดอกไม้ Bear has flower ออกแบบช่อดอกไม้ กุหลาบกลิตเตอร์ ดอกไม้ลวดกำมะหยี่",
  icons: {
    icon: [{ url: "/images/logo/logo.png", type: "image/png" }],
    shortcut: ["/images/logo/logo.png"],
    apple: [{ url: "/images/logo/logo.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <link
          rel="preload"
          as="image"
          href="/images/brandner/ChatGPT%20Image%2030%20%E0%B8%9E.%E0%B8%84.%202569%2003_10_36.webp"
          type="image/webp"
        />
      </head>
      <body className={`${cormorant.variable} ${notoSansThai.variable} ${italiana.variable}`}>
        {children}
        <PresenceTracker />
      </body>
    </html>
  );
}
