import React from "react";
import { PdfEditor } from "./PdfEditor";
import { ThemeProvider } from "@gribcov/shared";
import { Footer, LanguageSwitcher, ThemeToggle, Header } from "@gribcov/shared/dist/common";

export const Base = () => {
  return (
    <ThemeProvider>
      <div className="position-fixed top-0 end-0 p-3">
        <ThemeToggle />
      </div>
      <div className="position-fixed top-0 start-0 p-3">
        <LanguageSwitcher />
      </div>
      <main role="main" aria-label="Image converter application">
        <div className="container py-4">
          <Header />
          <div className="row justify-content-center">
            <div className="col-12 col-md-10 col-lg-8">
              <div className="card shadow-sm">
                <div className="card-body p-0">
                  <PdfEditor />
                  <div id="converter-mount-point" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </ThemeProvider>
  );
};
