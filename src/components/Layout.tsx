import React from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  rightSidebar?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, rightSidebar }) => {
  return (
    <div className="app-container">
      <Sidebar isOpen={true} activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="main-content">
        {children}
      </main>

      <aside className="right-sidebar">
        {rightSidebar || (
          <div className="text-center py-20 text-text-muted">
            <p>Select a view to see details</p>
          </div>
        )}
      </aside>
    </div>
  );
};

export default Layout;
