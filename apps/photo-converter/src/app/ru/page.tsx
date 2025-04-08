import React from "react";
import { Base } from "@photo-converter/components/base";
import { LanguageProvider } from "@photo-converter/contexts/LanguageContext";
import { Metadata } from "next/types";

// Main metadata configuration
export const metadata: Metadata = {
  title: "Простой Конвертер Изображений | Конвертация HEIC в JPG, PNG в WebP и другие",
  description:
    "Бесплатный онлайн конвертер изображений. Конвертируйте HEIC в JPG/JPEG, PNG в WebP, создавайте анимированные GIF и многое другое. Быстро, безопасно и без регистрации.",
  keywords: [
    "конвертер heic в jpg",
    "heic в jpeg конвертер",
    "png в webp",
    "webp конвертер",
    "jpg в png",
    "конвертер heic",
    "конвертер изображений",
    "конвертировать heic",
    "конвертировать webp",
    "конвертировать png",
    "конвертировать jpg",
    "пакетный конвертер изображений",
    "бесплатный конвертер",
    "онлайн конвертер",
    "конвертация фото онлайн",
    "массовая конвертация",
    "конвертация форматов",
    "создать gif",
    "конвертировать несколько изображений",
    "безопасный конвертер",
  ].join(", "),
  authors: [{ name: "Alex Gribcov" }],
  metadataBase: new URL("https://easy-converter.gribcov.me"),
  openGraph: {
    title: "Конвертируйте HEIC в JPG, PNG в WebP и другие | Простой Конвертер",
    description:
      "Бесплатный онлайн конвертер для HEIC, JPG, PNG, WebP изображений. Мгновенная конвертация в любой формат. Без регистрации, без ограничений.",
    type: "website",
    locale: "ru_RU",
    siteName: "Простой Конвертер Изображений",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Простой Конвертер Изображений",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Конвертируйте HEIC в JPG, PNG в WebP и другие | Простой Конвертер",
    description:
      "Бесплатный онлайн конвертер для HEIC, JPG, PNG, WebP изображений. Мгновенная конвертация в любой формат. Без регистрации, без ограничений.",
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
    canonical: "https://easy-converter.gribcov.me/ru",
  },
};

const PhotoConverterPage = () => {
  return (
    <LanguageProvider language="ru">
      <Base />
    </LanguageProvider>
  );
};

export default PhotoConverterPage;
