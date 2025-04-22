import React from "react";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { interpolate, LanguageProvider, useLanguage } from "./contexts/LanguageContext";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";

export {
  LanguageProvider,
  useLanguage,
  ThemeProvider,
  useTheme,
  interpolate,
};


type Props = {
  children: React.ReactNode;
  gaId?: string;
  gtmId?: string;
};

export const Layout: React.FC<Props> = ({children, gaId, gtmId}) => {
    return (
        <html lang="en" dir="ltr">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
          <link 
            rel="stylesheet" 
            href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css"
            fetchPriority="low"
            crossOrigin="anonymous"
          />
        </head>
        <body>
          {gtmId && <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>}
          {children}
          {gaId && <GoogleAnalytics gaId={gaId} />}
          {gtmId && <GoogleTagManager gtmId={gtmId} />}
        </body>
      </html>
    )
}