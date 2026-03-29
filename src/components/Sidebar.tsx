import React from 'react';
import { LayoutDashboard, BookOpen, Settings } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'lectures', label: 'Calendar', icon: <BookOpen size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 12v5c3 3 9 3 12 0v-5" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>UniFlow</span>
      </div>

      <div className="sidebar-greeting">
        <span>Welcome back</span>
        Good Morning,<br />Tharusha!
      </div>

      <div className="nav-section">
        <div className="nav-label">Menu</div>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
          >
            {item.icon}
            <span className="nav-link-text">{item.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
