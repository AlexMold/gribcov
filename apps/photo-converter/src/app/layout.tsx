import React from "react";
import { Metadata, Viewport } from "next";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { ThemeProvider } from "../contexts/ThemeContext";
import { ThemeToggle } from "../components/shared/ThemeToggle";
import "../styles/global.scss";
import { LanguageProvider } from "@photo-converter/contexts/LanguageContext";
import { LanguageSwitcher } from "@photo-converter/components/shared/LanguageSwitcher";
import { Footer } from "../components/shared/Footer";

// Separate viewport configuration
export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "light dark",
};

// Main metadata configuration
export const metadata: Metadata = {
  title: "Easy Image Converter | Convert HEIC to JPG, PNG to WebP & More",
  description:
    "Free online image converter. Convert HEIC to JPG/JPEG, PNG to WebP, create animated GIFs, and more. Fast, secure, and no registration required.",
  keywords: [
    "heic to jpg converter",
    "heic to jpeg",
    "png to webp",
    "webp converter",
    "jpg to png",
    "heic converter",
    "image format converter",
    "convert heic",
    "convert webp",
    "convert png",
    "convert jpg",
    "batch image converter",
    "free image converter",
    "online image converter",
    "convert photos online",
    "bulk image converter",
    "image format conversion",
    "convert images to gif",
    "convert multiple images",
    "secure image converter",
  ].join(", "),
  authors: [{ name: "Alex Gribcov" }],
  metadataBase: new URL("https://easy-converter.gribcov.me"),
  openGraph: {
    title: "Convert HEIC to JPG, PNG to WebP & More | Easy Image Converter",
    description:
      "Free online converter for HEIC, JPG, PNG, WebP images. Convert any image format instantly. No registration, no limits.",
    type: "website",
    locale: "en_US",
    siteName: "Easy Image Converter",
    images: [
      {
        url: "/og-image.png", // or .jpg
        width: 1200,
        height: 630,
        alt: "Easy Image Converter Preview",
        type: "image/png", // or 'image/jpeg'
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Convert HEIC to JPG, PNG to WebP & More | Easy Image Converter",
    description:
      "Free online converter for HEIC, JPG, PNG, WebP images. Convert any image format instantly. No registration, no limits.",
    images: ["/og-image.png"], // same as OG image
  },
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", sizes: "any" },
      { url: "/favicon/icon.svg", type: "image/svg+xml" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/favicon/apple-touch-icon.png", sizes: "180x180" }],
    other: [
      {
        rel: "mask-icon",
        url: "/favicon/favicon.svg",
        color: "#5bbad5",
      },
    ],
  },
  manifest: "/favicon/site.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://easy-converter.gribcov.me/", // Add your domain
  },
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <LanguageProvider>
        <ThemeProvider>
          <body>
            <div className="position-fixed top-0 end-0 p-3">
              <ThemeToggle />
            </div>
            <div className="position-fixed top-0 start-0 p-3">
              <LanguageSwitcher />
              </div>
            <noscript>
              <iframe
                src="https://www.googletagmanager.com/ns.html?id=GTM-PBJZLQNX"
                height="0"
                width="0"
                style={{ display: "none", visibility: "hidden" }}
              />
            </noscript>
            <main role="main" aria-label="Image converter application">
              {children}
            </main>
            <Footer />
            <GoogleAnalytics gaId="G-5XXM4V1YG4" />
            <GoogleTagManager gtmId="GTM-PBJZLQNX" />
          </body>
        </ThemeProvider>
      </LanguageProvider>
    </html>
  );
};

export default Layout;
