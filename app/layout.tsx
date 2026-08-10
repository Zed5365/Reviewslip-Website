import type { Metadata, Viewport } from "next";
import { Trirong, Bai_Jamjuree } from "next/font/google";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import "./globals.css";

const trirong = Trirong({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
  display: "swap",
});

const baiJamjuree = Bai_Jamjuree({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://reviewslip.app"),
  title: {
    default: "Reviewslip — Turn great visits into 5-star reviews",
    template: "%s · Reviewslip",
  },
  description:
    "Reviewslip helps your happy customers write and post a genuine Google review in seconds. Scan a QR code, get a tailored draft, edit, and post.",
  openGraph: {
    title: "Reviewslip — Turn great visits into 5-star reviews",
    description:
      "Help happy customers leave a genuine Google review in seconds.",
    type: "website",
    siteName: "Reviewslip",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c1f19",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${trirong.variable} ${baiJamjuree.variable}`}>
      <body suppressHydrationWarning>
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
