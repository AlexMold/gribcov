import React from "react";
import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import { Layout as SharedLayout } from "@gribcov/shared";

export const metadata: Metadata = {
  title: "PDF Merger – Merge PDFs Online Free",
  description:
    "Merge PDF files into one document online. Fast, free and secure – your files never leave your browser.",
  metadataBase: new URL("https://pdf.gribcov.me"),
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", sizes: "any" },
      { url: "/favicon/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/favicon/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "PDF Merger – Merge PDFs Online Free",
    description:
      "Merge PDF files into one document online. Fast, free and secure.",
    type: "website",
    siteName: "PDF Merger",
  },
  twitter: {
    card: "summary",
    title: "PDF Merger – Merge PDFs Online Free",
    description:
      "Merge PDF files into one document online. Fast, free and secure.",
  },
  alternates: {
    canonical: "https://pdf.gribcov.me/",
  },
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SharedLayout>
      {children}
    </SharedLayout>
  );
};

export default Layout;
