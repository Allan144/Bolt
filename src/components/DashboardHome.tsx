import React, { useEffect, useState } from 'react';
import { Calendar, Users, DollarSign, BookOpen, Bell, TrendingUp, Clock, CircleAlert as AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AppUser, BillingRecord, TicklerItem, CalendarEvent } from '../types';
import { format, isToday, isFuture, parseISO, startOfDay, endOfDay } from 'date-fns';

interface DashboardHomeProps {
  user: AppUser;
  onNavigate: (view: string) => void;
}

interface Stats {
  activeStudents: number;
  pendingBilling: number;
  todayLessons: number;
  overdueItems: number;
}

const StatCard: React.FC<{ icon: React.FC<{ className?: string }>; label: string; value: string | number; color: string; onClick?: () => void }> =
  ({ icon: Icon, label, value, color, onClick }) => (
    <button
      onClick={onClick}
      className={`bg-stone-800 border border-stone-700/50 rounded-2xl p-5 text-left hover:border-stone-600 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-stone-400 text-sm mt-0.5">{label}</p>
    </button>
  );

const DashboardHome: React.FC<DashboardHomeProps> = ({ user, onNavigate }) => {
  const [stats, setStats] = useState<Stats>({ activeStudents: 0, pendingBilling: 0, todayLessons: 0, overdueItems: 0 });
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [upcomingTickler, setUpcomingTickler] = useState<TicklerItem[]>([]);
  const [recentBilling, setRecentBilling] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const today = new Date();
      const todayStart = startOfDay(today).toISOString();
      const todayEnd = endOfDay(today).toISOString();

      const [studentsRes, billingRes, eventsRes, ticklerRes, overdueRes] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('billing_records').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('calendar_events').select('*, student:students(first_name,last_name)').gte('start_time', todayStart).lte('start_time', todayEnd).order('start_time'),
        supabase.from('tickler').select('*, student:students(first_name,last_name)').eq('user_id', user.id).eq('is_completed', false).order('due_date').limit(5),
        supabase.from('billing_records').select('id', { count: 'exact' }).eq('status', 'overdue'),
      ]);

      const [recentBillingRes] = await Promise.all([
        supabase.from('billing_records').select('*, student:students(first_name,last_name)').order('created_at', { ascending: false }).limit(5),
      ]);

      setStats({
        activeStudents: studentsRes.count ?? 0,
        pendingBilling: billingRes.count ?? 0,
        todayLessons: eventsRes.data?.length ?? 0,
        overdueItems: overdueRes.count ?? 0,
      });
      setTodayEvents((eventsRes.data ?? []) as CalendarEvent[]);
      setUpcomingTickler((ticklerRes.data ?? []) as TicklerItem[]);
      setRecentBilling((recentBillingRes.data ?? []) as BillingRecord[]);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusColor: Record<string, string> = {
    scheduled: 'bg-blue-500/20 text-blue-300',
    completed: 'bg-green-500/20 text-green-300',
    cancelled: 'bg-red-500/20 text-red-300',
    no_show: 'bg-orange-500/20 text-orange-300',
  };

  const priorityColor: Record<string, string> = {
    high: 'text-red-400',
    medium: 'text-amber-400',
    low: 'text-stone-400',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif text-white">Welcome back, {user.display_name}</h1>
        <p className="text-stone-400 text-sm mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Active Students" value={stats.activeStudents} color="bg-blue-600" onClick={() => onNavigate('students')} />
        <StatCard icon={Calendar} label="Today's Lessons" value={stats.todayLessons} color="bg-amber-700" onClick={() => onNavigate('calendar')} />
        <StatCard icon={DollarSign} label="Pending Invoices" value={stats.pendingBilling} color="bg-emerald-700" onClick={() => onNavigate('billing')} />
        <StatCard icon={AlertCircle} label="Overdue Billing" value={stats.overdueItems} color="bg-red-700" onClick={() => onNavigate('billing')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's schedule */}
        <div className="lg:col-span-2 bg-stone-800 border border-stone-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              Today's Schedule
            </h2>
            <button onClick={() => onNavigate('calendar')} className="text-amber-500 text-xs hover:text-amber-400">View Calendar</button>
          </div>
          {todayEvents.length === 0 ? (
            <p className="text-stone-500 text-sm py-6 text-center">No lessons scheduled for today</p>
          ) : (
            <div className="space-y-2">
              {todayEvents.map(evt => (
                <div key={evt.id} className="flex items-center justify-between p-3 bg-stone-900 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 rounded-full" style={{ backgroundColor: evt.color || '#b45309' }} />
                    <div>
                      <p className="text-white text-sm font-medium">{evt.title}</p>
                      <p className="text-stone-400 text-xs">
                        {format(parseISO(evt.start_time), 'h:mm a')} — {format(parseISO(evt.end_time), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${statusColor[evt.status] || 'bg-stone-700 text-stone-300'}`}>
                    {evt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reminders */}
        <div className="bg-stone-800 border border-stone-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-medium flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              Reminders
            </h2>
            <button onClick={() => onNavigate('tickler')} className="text-amber-500 text-xs hover:text-amber-400">View All</button>
          </div>
          {upcomingTickler.length === 0 ? (
            <p className="text-stone-500 text-sm py-6 text-center">No pending reminders</p>
          ) : (
            <div className="space-y-2">
              {upcomingTickler.map(item => (
                <div key={item.id} className="p-3 bg-stone-900 rounded-xl">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-white text-sm font-medium leading-tight">{item.title}</p>
                    <span className={`text-xs flex-shrink-0 ${priorityColor[item.priority]}`}>
                      {item.priority}
                    </span>
                  </div>
                  {item.due_date && (
                    <p className="text-stone-500 text-xs mt-1">{format(parseISO(item.due_date), 'MMM d')}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent billing */}
      <div className="bg-stone-800 border border-stone-700/50 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-medium flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-500" />
            Recent Billing
          </h2>
          <button onClick={() => onNavigate('billing')} className="text-amber-500 text-xs hover:text-amber-400">View All</button>
        </div>
        {recentBilling.length === 0 ? (
          <p className="text-stone-500 text-sm py-4 text-center">No billing records yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-stone-500 text-xs uppercase tracking-wide border-b border-stone-700">
                  <th className="pb-2 text-left">Student</th>
                  <th className="pb-2 text-left">Description</th>
                  <th className="pb-2 text-right">Amount</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-700/50">
                {recentBilling.map(r => (
                  <tr key={r.id} className="text-stone-300">
                    <td className="py-2.5">{(r as any).student ? `${(r as any).student.first_name} ${(r as any).student.last_name}` : '—'}</td>
                    <td className="py-2.5 text-stone-400">{r.description}</td>
                    <td className="py-2.5 text-right font-medium">${r.amount.toFixed(2)}</td>
                    <td className="py-2.5 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        r.status === 'paid' ? 'bg-green-900/40 text-green-400' :
                        r.status === 'overdue' ? 'bg-red-900/40 text-red-400' :
                        'bg-amber-900/40 text-amber-400'
                      }`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardHome;
