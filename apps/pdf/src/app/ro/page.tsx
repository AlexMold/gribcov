"use client";
import React from "react";
import { Base } from "@pdf/components/Base";
import { LanguageProvider } from "@gribcov/shared";

const PdfPage = () => {
  return (
    <LanguageProvider language="ro" translations={{ en: {}, ru: {}, es: {}, ro: {} }}>
      <Base />
    </LanguageProvider>
  );
};

export default PdfPage;
