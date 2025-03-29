import React from 'react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div>
      <header>
        <h1>PDF Application</h1>
      </header>
      <main>{children}</main>
      <footer>
        <p>© 2023 PDF Application</p>
      </footer>
    </div>
  );
};

export default Layout;