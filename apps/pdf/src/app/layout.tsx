import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Layout as SharedLayout } from "@gribcov/shared";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SharedLayout>
      {children}
    </SharedLayout>
  );
};

export default Layout;
