import React, { FC } from "react";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { ThemeToggle } from "../shared/ThemeToggle";
import { LanguageSwitcher } from "@photo-converter/components/shared/LanguageSwitcher";
import { Footer } from "../shared/Footer";
import { Wrapper } from "../wrapper";

export const Base: FC = () => {
  return (
    <ThemeProvider>
      <div className="position-fixed top-0 end-0 p-3">
        <ThemeToggle />
      </div>
      <div className="position-fixed top-0 start-0 p-3">
        <LanguageSwitcher />
      </div>
      <main role="main" aria-label="Image converter application">
        <div>
          <Wrapper />
        </div>
      </main>
      <Footer />
    </ThemeProvider>
  );
};
