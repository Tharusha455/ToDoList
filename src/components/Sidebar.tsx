import React from 'react';
import { LayoutDashboard, FileText, Calendar, Settings } from 'lucide-react';
import type { User } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  user?: User | null;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, user }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'assignments', label: 'Assignments', icon: <FileText size={20} /> },
    { id: 'lectures', label: 'Calendar', icon: <Calendar size={20} /> },
    ...(user?.role === 'admin' ? [
      { id: 'settings', label: 'Settings', icon: <Settings size={20} /> }
    ] : []),
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 text-white transform transition-transform duration-300 ease-in-out flex flex-col shadow-xl md:shadow-none ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
      <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800 mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="shrink-0 drop-shadow-md">
          <path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 12v5c3 3 9 3 12 0v-5" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-2xl font-bold tracking-tight tracking-tight text-white">UniFlow</span>
      </div>

      <div className="px-6 pb-8">
        <span className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Welcome back</span>
        <div className="text-xl font-bold leading-tight truncate text-white">
          {user?.name || 'Student'}!
        </div>
      </div>

      <div className="flex-1 px-4 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2 mb-3">Menu</div>
        <nav className="space-y-1.5">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-start gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-blue-600/10 text-blue-500 shadow-sm' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
