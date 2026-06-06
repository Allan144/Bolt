import React, { useState } from 'react';
import { AppUser } from '../types';
import Sidebar from './Sidebar';
import DashboardHome from './DashboardHome';
import CalendarView from './CalendarView';
import StudentsView from './StudentsView';
import ClientsView from './ClientsView';
import BillingView from './BillingView';
import LessonHistoryView from './LessonHistoryView';
import TicklerView from './TicklerView';
import AdminPanel from './AdminPanel';
import { Menu, X } from 'lucide-react';

type ActiveView = 'dashboard' | 'calendar' | 'students' | 'clients' | 'billing' | 'history' | 'tickler' | 'admin';

interface DashboardProps {
  user: AppUser;
  onSignOut: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onSignOut }) => {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardHome user={user} onNavigate={v => setActiveView(v as ActiveView)} />;
      case 'calendar': return <CalendarView user={user} />;
      case 'students': return <StudentsView />;
      case 'clients': return <ClientsView />;
      case 'billing': return <BillingView />;
      case 'history': return <LessonHistoryView user={user} />;
      case 'tickler': return <TicklerView user={user} />;
      case 'admin': return user.role === 'admin' ? <AdminPanel user={user} /> : null;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-stone-950 text-white overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar — desktop always visible, mobile as drawer */}
      <div className={`fixed lg:relative inset-y-0 left-0 z-40 lg:z-auto transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <Sidebar
          user={user}
          activeView={activeView}
          onNavigate={(view) => { setActiveView(view); setSidebarOpen(false); }}
          onSignOut={onSignOut}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-800 lg:hidden bg-stone-900">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-white font-serif">LCE Lessons</span>
        </div>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
