import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/sonner";
import { JsonLdSchema } from "@/components/seo/json-ld";

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
    process.env.NEXT_PUBLIC_APP_URL || "https://mediflow.apprisingcreatives.com"
  ),
  title: {
    default:
      "MediFlow | AI-Powered Clinic Management Software — Run Your Entire Clinic From One Platform",
    template: "%s | MediFlow",
  },
  description:
    "MediFlow is the AI-powered operating system for modern clinics. Manage appointments, patient records, staff, billing, and AI clinical notes in one secure platform. Replace Messenger, Viber, Excel, and paper charts. Start your free trial today.",
  keywords: [
    "clinic management software",
    "clinic management software Philippines",
    "AI clinic software",
    "appointment scheduling system",
    "patient records management",
    "electronic medical records Philippines",
    "healthcare management platform",
    "medical practice management",
    "reduce clinic no-shows",
    "AI medical notes",
    "HIPAA compliant clinic software",
    "dental clinic software",
    "dermatology clinic software",
    "pediatric clinic software",
    "OB-GYN clinic management",
    "MediFlow",
  ],
  authors: [{ name: "Apprising Creatives", url: "https://apprisingcreatives.com" }],
  creator: "Apprising Creatives",
  publisher: "Apprising Creatives",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mediflow.apprisingcreatives.com",
    siteName: "MediFlow",
    title:
      "MediFlow | AI-Powered Clinic Management Software — Run Your Entire Clinic From One Platform",
    description:
      "Manage appointments, patient records, staff, billing, and AI clinical notes in one secure platform. Replace Messenger, Viber, and paper charts.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "MediFlow — AI-Powered Clinic Management Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "MediFlow | AI-Powered Clinic Management Software",
    description:
      "Run your entire clinic from one AI-powered platform. Manage appointments, records, billing, and AI notes.",
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
  alternates: {
    canonical: "https://mediflow.apprisingcreatives.com",
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
          <AuthProvider>
            {children}
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </ThemeProvider>
        <JsonLdSchema />
      </body>
    </html>
  );
}
