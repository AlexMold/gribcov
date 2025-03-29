// filepath: /nextjs-monorepo/apps/photo-converter/src/app/layout.tsx
import React from 'react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div>
      <header>
        <h1>Photo Converter</h1>
      </header>
      <main>{children}</main>
      <footer>
        <p>© 2023 Photo Converter. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Layout;