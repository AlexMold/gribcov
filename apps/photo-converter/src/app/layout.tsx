import React from "react";
import '../styles/global.scss'

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
        <footer>
          
        </footer>
      </body>
    </html>
  );
};

export default Layout;
