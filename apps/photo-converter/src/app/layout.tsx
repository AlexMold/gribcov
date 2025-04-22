import React from "react";
import { Viewport } from "next";
import { Layout as SharedLayout } from "@gribcov/shared";

import "../styles/global.scss";
import "../components/converter/converter.scss";

// Separate viewport configuration
export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "light dark",
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SharedLayout gtmId="GTM-PBJZLQNX" gaId="G-5XXM4V1YG4">{children}</SharedLayout>
  );
};

export default Layout;
