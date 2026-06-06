import React from 'react';
import {
  Music, Calendar, Users, DollarSign, BookOpen, Bell, Settings,
  LogOut, LayoutDashboard, ClipboardList, Shield
} from 'lucide-react';
import { AppUser } from '../types';

type ActiveView = 'dashboard' | 'calendar' | 'students' | 'clients' | 'billing' | 'history' | 'tickler' | 'admin';

interface SidebarProps {
  user: AppUser;
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onSignOut: () => void;
  collapsed?: boolean;
}

const navItems: { view: ActiveView; label: string; icon: React.FC<{ className?: string }> }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'calendar', label: 'Calendar', icon: Calendar },
  { view: 'students', label: 'Students', icon: Users },
  { view: 'clients', label: 'Clients', icon: Users },
  { view: 'billing', label: 'Billing', icon: DollarSign },
  { view: 'history', label: 'Lesson History', icon: BookOpen },
  { view: 'tickler', label: 'Reminders', icon: Bell },
];

const Sidebar: React.FC<SidebarProps> = ({ user, activeView, onNavigate, onSignOut, collapsed = false }) => {
  const isAdmin = user.role === 'admin';

  return (
    <aside className={`flex flex-col bg-stone-900 border-r border-stone-800 transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'}`}>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-stone-800 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-lg bg-amber-700 flex items-center justify-center flex-shrink-0">
          <Music className="w-4 h-4 text-amber-100" />
        </div>
        {!collapsed && <span className="text-white font-serif text-base">LCE Lessons</span>}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
        {navItems.map(({ view, label, icon: Icon }) => (
          <button
            key={view}
            onClick={() => onNavigate(view)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
              activeView === view
                ? 'bg-amber-700/30 text-amber-300 border border-amber-700/30'
                : 'text-stone-400 hover:text-white hover:bg-stone-800'
            } ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? label : undefined}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </button>
        ))}

        {isAdmin && (
          <button
            onClick={() => onNavigate('admin')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
              activeView === 'admin'
                ? 'bg-amber-700/30 text-amber-300 border border-amber-700/30'
                : 'text-stone-400 hover:text-white hover:bg-stone-800'
            } ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'Admin' : undefined}
          >
            <Shield className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Admin</span>}
          </button>
        )}
      </nav>

      {/* User / Sign out */}
      <div className="border-t border-stone-800 p-3">
        {!collapsed && (
          <div className="px-2 pb-3">
            <p className="text-white text-sm font-medium truncate">{user.display_name}</p>
            <p className="text-stone-500 text-xs truncate">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-amber-700/30 text-amber-400 text-xs rounded-full capitalize">{user.role}</span>
          </div>
        )}
        <button
          onClick={onSignOut}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-stone-400 hover:text-red-400 hover:bg-red-900/20 transition-colors ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
