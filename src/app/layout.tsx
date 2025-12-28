import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://a0f02019-16a7-41a9-82aa-ae5d66692014.canvases.tempo.build"
  ),
  title: "MediFlow | Intelligent Healthcare Management Platform",
  description:
    "Transform your clinic with AI-powered patient intake, intelligent scheduling, and streamlined operations. HIPAA-compliant, secure, and designed for modern healthcare practices.",
  keywords: [
    "healthcare management",
    "clinic software",
    "AI patient intake",
    "medical practice management",
    "HIPAA compliant",
    "telehealth",
    "appointment scheduling",
  ],
  authors: [{ name: "MediFlow AI" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mediflow.ai",
    siteName: "MediFlow",
    title: "MediFlow | Intelligent Healthcare Management Platform",
    description:
      "Transform your clinic with AI-powered patient intake, intelligent scheduling, and streamlined operations.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "MediFlow AI Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MediFlow | Intelligent Healthcare Management Platform",
    description:
      "Transform your clinic with AI-powered patient intake, intelligent scheduling, and streamlined operations.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
        className={`${inter.variable} ${dmSans.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
