"use client";
import React from "react";
import { Base } from "@pdf/components/Base";
import { LanguageProvider } from "@gribcov/shared";
import { translations } from "@pdf/translations";

const PdfPage = () => {
  return (
    <LanguageProvider language="es" translations={translations}>
      <Base />
    </LanguageProvider>
  );
};

export default PdfPage;
