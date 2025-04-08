import React from "react";
import { Base } from "@photo-converter/components/base";
import { LanguageProvider } from "@photo-converter/contexts/LanguageContext";
import { Metadata } from "next/types";

// Main metadata configuration
export const metadata: Metadata = {
  title: "Convertor Simplu de Imagini | Conversie HEIC în JPG, PNG în WebP și altele",
  description:
    "Convertor gratuit de imagini online. Convertiți HEIC în JPG/JPEG, PNG în WebP, creați GIF-uri animate și multe altele. Rapid, sigur și fără înregistrare.",
  keywords: [
    "convertor heic în jpg",
    "heic în jpeg convertor",
    "png în webp",
    "convertor webp",
    "jpg în png",
    "convertor heic",
    "convertor de imagini",
    "convertire heic",
    "convertire webp",
    "convertire png",
    "convertire jpg",
    "convertor de imagini în lot",
    "convertor gratuit",
    "convertor online",
    "conversie foto online",
    "conversie în masă",
    "conversie formate",
    "creare gif",
    "convertire mai multe imagini",
    "convertor sigur",
  ].join(", "),
  authors: [{ name: "Alex Gribcov" }],
  metadataBase: new URL("https://easy-converter.gribcov.me"),
  openGraph: {
    title: "Convertiți HEIC în JPG, PNG în WebP și altele | Convertor Simplu",
    description:
      "Convertor online gratuit pentru imagini HEIC, JPG, PNG, WebP. Conversie instantanee în orice format. Fără înregistrare, fără limite.",
    type: "website",
    locale: "ro_RO",
    siteName: "Convertor Simplu de Imagini",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Convertor Simplu de Imagini",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Convertiți HEIC în JPG, PNG în WebP și altele | Convertor Simplu",
    description:
      "Convertor online gratuit pentru imagini HEIC, JPG, PNG, WebP. Conversie instantanee în orice format. Fără înregistrare, fără limite.",
    images: ["/og-image.png"],
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
    canonical: "https://easy-converter.gribcov.me/ro",
  },
};

const PhotoConverterPage = () => {
  return (
    <LanguageProvider language="ro">
      <Base />
    </LanguageProvider>
  );
};

export default PhotoConverterPage;
