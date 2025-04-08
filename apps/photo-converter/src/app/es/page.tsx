import React from "react";
import { Base } from "@photo-converter/components/base";
import { LanguageProvider } from "@photo-converter/contexts/LanguageContext";
import { Metadata } from "next/types";

// Main metadata configuration
export const metadata: Metadata = {
  title: "Conversor Simple de Imágenes | Conversión de HEIC a JPG, PNG a WebP y más",
  description:
    "Conversor de imágenes online gratuito. Convierte HEIC a JPG/JPEG, PNG a WebP, crea GIFs animados y mucho más. Rápido, seguro y sin registro.",
  keywords: [
    "conversor heic a jpg",
    "heic a jpeg conversor",
    "png a webp",
    "conversor webp",
    "jpg a png",
    "conversor heic",
    "conversor de imágenes",
    "convertir heic",
    "convertir webp",
    "convertir png",
    "convertir jpg",
    "conversor de imágenes por lotes",
    "conversor gratuito",
    "conversor online",
    "conversión de fotos online",
    "conversión masiva",
    "conversión de formatos",
    "crear gif",
    "convertir múltiples imágenes",
    "conversor seguro",
  ].join(", "),
  authors: [{ name: "Alex Gribcov" }],
  metadataBase: new URL("https://easy-converter.gribcov.me"),
  openGraph: {
    title: "Convierte HEIC a JPG, PNG a WebP y más | Conversor Simple",
    description:
      "Conversor online gratuito para imágenes HEIC, JPG, PNG, WebP. Conversión instantánea a cualquier formato. Sin registro, sin límites.",
    type: "website",
    locale: "es_ES",
    siteName: "Conversor Simple de Imágenes",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Conversor Simple de Imágenes",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Convierte HEIC a JPG, PNG a WebP y más | Conversor Simple",
    description:
      "Conversor online gratuito para imágenes HEIC, JPG, PNG, WebP. Conversión instantánea a cualquier formato. Sin registro, sin límites.",
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
    canonical: "https://easy-converter.gribcov.me/es",
  },
};

const PhotoConverterPage = () => {
  return (
    <LanguageProvider language="es">
      <Base />
    </LanguageProvider>
  );
};

export default PhotoConverterPage;
