import React from "react";
import { Header } from "../shared/Header";

export const ServerWrapper: React.FC<{ children: React.ReactNode }> = ({children}) => {
  return (
    <div className="container py-4">
      <Header />
      <div className="row justify-content-center">
        <div className="col-12 col-md-10 col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body p-0">
              {children}
              <div id="converter-mount-point" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};