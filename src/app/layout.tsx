import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export const metadata: Metadata = {
  title: "HenoBuild Event - Créer des événements inoubliables intelligemment",
  description:
    "HenoBuild Event est la plateforme premium de gestion d'événements. Créez, gérez et suivez vos événements avec intelligence et élégance.",
  keywords: [
    "HenoBuild Event",
    "événements",
    "gestion événements",
    "event management",
    "création événements",
    "billetterie",
    "RSVP",
    "événements premium",
  ],
  authors: [{ name: "HenoBuild" }],
  creator: "HenoBuild",
  publisher: "HenoBuild",
  icons: {
    icon: "/henobuildEvents.png",
    apple: "/henobuildEvents.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "HenoBuild Event - Créer des événements inoubliables intelligemment",
    description:
      "La plateforme premium de gestion d'événements. Créez, gérez et suivez vos événements avec intelligence et élégance.",
    url: "https://henobuild.event",
    siteName: "HenoBuild Event",
    type: "website",
    locale: "fr_FR",
    images: [
      {
        url: "/henobuildEvents.png",
        width: 1200,
        height: 630,
        alt: "HenoBuild Event",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HenoBuild Event - Créer des événements inoubliables intelligemment",
    description:
      "La plateforme premium de gestion d'événements. Créez, gérez et suivez vos événements avec intelligence et élégance.",
    images: ["/henobuildEvents.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HenoBuild Event",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
