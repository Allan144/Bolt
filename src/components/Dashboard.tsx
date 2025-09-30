import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase, Prescription, DoseSchedule, MedicationLog, MedicationHistory, AuthUser, signOut } from '../lib/supabase';
import { PrescriptionCard } from './PrescriptionCard';
import { PrescriptionForm } from './PrescriptionForm';
import { HistoryModal } from './HistoryModal';
import { PrescriptionHistoryModal } from './PrescriptionHistoryModal';
import { DailyPrescriptionsModal } from './DailyPrescriptionsModal';
import { DoseScheduleScreen } from './DoseScheduleScreen';
import { Plus, LogOut, User as UserIcon, Bell, Activity, Calendar, TrendingUp, X, Shield, History, Clock } from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import { RefreshCw } from 'lucide-react';
import { AdminPanel } from './AdminPanel';
import { InactivePrescriptionsModal } from './InactivePrescriptionsModal';

interface DashboardProps {
  user: AuthUser;
  onSignOut: () => void;
  onExit: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onSignOut, onExit }) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [doseSchedules, setDoseSchedules] = useState<DoseSchedule[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [history, setHistory] = useState<MedicationHistory[]>([]);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showPrescriptionHistory, setShowPrescriptionHistory] = useState(false);
  const [showDailyPrescriptions, setShowDailyPrescriptions] = useState(false);
  const [showDoseSchedule, setShowDoseSchedule] = useState(false);
  const [showInactivePrescriptions, setShowInactivePrescriptions] = useState(false);
  const [inactivePrescriptions, setInactivePrescriptions] = useState<Prescription[]>([]);

  useEffect(() => {
    fetchPrescriptions();
    fetchInactivePrescriptions();
    fetchDoseSchedules();
    fetchLogs();
    fetchHistory();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrescriptions(data || []);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInactivePrescriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', false)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setInactivePrescriptions(data || []);
    } catch (error) {
      console.error('Error fetching inactive prescriptions:', error);
    }
  };

  const fetchDoseSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('dose_schedules')
        .select('*')
        .eq('is_active', true)
        .order('dose_time', { ascending: true });

      if (error) throw error;
      setDoseSchedules(data || []);
    } catch (error) {
      console.error('Error fetching dose schedules:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('medication_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_time', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('medication_history')
        .select('*')
        .eq('user_id', user.id)
        .order('actual_taken_datetime', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([
      fetchPrescriptions(),
      fetchInactivePrescriptions(),
      fetchDoseSchedules(),
      fetchLogs(),
      fetchHistory()
    ]);
    setLoading(false);
  };

  const handleAddPrescription = async (
    prescriptionData: Omit<Prescription, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    scheduleData: Omit<DoseSchedule, 'id' | 'prescription_id' | 'created_at'>[]
  ) => {
    try {
      const { data: prescription, error: prescriptionError } = await supabase
        .from('prescriptions')
        .insert([{ ...prescriptionData, user_id: user.id }])
        .select()
        .single();

      if (prescriptionError) throw prescriptionError;

      // Add dose schedules
      if (scheduleData.length > 0) {
        const { error: scheduleError } = await supabase
          .from('dose_schedules')
          .insert(
            scheduleData.map(schedule => ({
              ...schedule,
              prescription_id: prescription.id,
            }))
          );

        if (scheduleError) throw scheduleError;
      }

      fetchPrescriptions();
      fetchDoseSchedules();
    } catch (error) {
      console.error('Error adding prescription:', error);
    }
  };

  const handleEditPrescription = async (
    prescriptionData: Omit<Prescription, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    scheduleData: Omit<DoseSchedule, 'id' | 'prescription_id' | 'created_at'>[]
  ) => {
    if (!editingPrescription) return;

    try {
      const { error: prescriptionError } = await supabase
        .from('prescriptions')
        .update(prescriptionData)
        .eq('id', editingPrescription.id);

      if (prescriptionError) throw prescriptionError;

      // Delete existing schedules and add new ones
      await supabase
        .from('dose_schedules')
        .delete()
        .eq('prescription_id', editingPrescription.id);

      if (scheduleData.length > 0) {
        const { error: scheduleError } = await supabase
          .from('dose_schedules')
          .insert(
            scheduleData.map(schedule => ({
              ...schedule,
              prescription_id: editingPrescription.id,
            }))
          );

        if (scheduleError) throw scheduleError;
      }

      fetchPrescriptions();
      fetchDoseSchedules();
      setEditingPrescription(null);
    } catch (error) {
      console.error('Error updating prescription:', error);
    }
  };

  const handleDeletePrescription = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prescription?')) return;

    try {
      const { error } = await supabase
        .from('prescriptions')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      fetchPrescriptions();
      fetchInactivePrescriptions();
    } catch (error) {
      console.error('Error deleting prescription:', error);
    }
  };

  const handleReactivatePrescription = async (id: string) => {
    if (!confirm('Are you sure you want to reactivate this prescription?')) return;

    try {
      // Reactivate prescription
      const { error: prescriptionError } = await supabase
        .from('prescriptions')
        .update({ is_active: true })
        .eq('id', id);

      if (prescriptionError) throw prescriptionError;

      // Reactivate associated dose schedules
      const { error: scheduleError } = await supabase
        .from('dose_schedules')
        .update({ is_active: true })
        .eq('prescription_id', id);

      if (scheduleError) throw scheduleError;

      fetchPrescriptions();
      fetchInactivePrescriptions();
      fetchDoseSchedules();
    } catch (error) {
      console.error('Error reactivating prescription:', error);
    }
  };

  const handleMarkTaken = async (
    prescriptionId: string, 
    prescriptionName: string, 
    dosage: string, 
    scheduledDate: string, 
    scheduledTime: string, 
    quantity: number, 
    actualDateTime?: string
  ) => {
    try {
      // Add to history table
      const { error: historyError } = await supabase
        .from('medication_history')
        .insert({
          user_id: user.id,
          prescription_id: prescriptionId,
          prescription_name: prescriptionName,
          dosage: dosage,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          actual_taken_datetime: actualDateTime || new Date().toISOString(),
          quantity_taken: quantity,
          is_corrected: actualDateTime ? true : false
        });

      if (historyError) throw historyError;

      // Update existing logs table for compatibility
      const { error } = await supabase
        .from('medication_logs')
        .upsert({
          prescription_id: prescriptionId,
          user_id: user.id,
          scheduled_time: `${scheduledDate}T${scheduledTime}`,
          taken_time: actualDateTime || new Date().toISOString(),
          quantity_taken: quantity,
          status: 'taken'
        });

      if (error) throw error;
      fetchLogs();
      fetchHistory();
    } catch (error) {
      console.error('Error marking as taken:', error);
    }
  };

  const handleMarkMissed = async (prescriptionId: string, scheduledTime: string) => {
    try {
      const { error } = await supabase
        .from('medication_logs')
        .upsert({
          prescription_id: prescriptionId,
          user_id: user.id,
          scheduled_time: scheduledTime,
          status: 'missed'
        });

      if (error) throw error;
      fetchLogs();
    } catch (error) {
      console.error('Error marking as missed:', error);
    }
  };

  const handleCorrectTime = async (logId: string, newTime: string) => {
    try {
      const { error } = await supabase
        .from('medication_logs')
        .update({ 
          taken_time: newTime,
          is_time_corrected: true
        })
        .eq('id', logId);

      if (error) throw error;
      fetchLogs();
    } catch (error) {
      console.error('Error correcting time:', error);
    }
  };

  const handleSignOut = () => {
    signOut().then(() => {
      onSignOut();
    }).catch((error) => {
      console.error('Sign out error:', error);
      onSignOut(); // Sign out anyway
    });
  };

  const handleViewHistory = (prescriptionId: string) => {
    setShowHistory(prescriptionId);
  };

  const getActivePrescriptions = () => {
    return prescriptions.filter(p => p.is_active).length;
  };

  const getTodaysTaken = () => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    
    return history.filter(entry => {
      return entry.scheduled_date === todayStr;
    }).length;
  };

  const getAdherenceRate = () => {
    if (logs.length === 0) return 0;
    const takenLogs = logs.filter(l => l.status === 'taken').length;
    return Math.round((takenLogs / logs.length) * 100);
  };

  // Check if current user is an admin (you can modify this logic)
  const isAdmin = () => {
    // For now, make the first user or users with specific usernames admins
    // You can modify this logic as needed
    return user.username === 'admin' || user.username === 'superuser' || user.id === 'your-admin-user-id';
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg">Loading your prescriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">MedReminder Pro</h1>
                <p className="text-sm text-gray-600">Advanced medication management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {isAdmin() && (
                <button
                  onClick={() => setShowAdminPanel(true)}
                  className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all"
                  title="Admin Panel"
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin</span>
                </button>
              )}
              <button
                onClick={() => setShowPrescriptionHistory(true)}
                className="flex items-center space-x-2 px-4 py-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-all"
                title="View Complete History"
              >
                <History className="w-4 h-4" />
                <span>History</span>
              </button>
              <button
                onClick={() => setShowDailyPrescriptions(true)}
                className="flex items-center space-x-2 px-4 py-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-xl transition-all"
                title="View Daily Prescriptions"
              >
                <Calendar className="w-4 h-4" />
                <span>Daily View</span>
              </button>
              <button
                onClick={() => setShowDoseSchedule(true)}
                className="flex items-center space-x-2 px-4 py-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-all"
                title="View Dose Schedule"
              >
                <Clock className="w-4 h-4" />
                <span>Schedule</span>
              </button>
              {inactivePrescriptions.length > 0 && (
                <button
                  onClick={() => setShowInactivePrescriptions(true)}
                  className="flex items-center space-x-2 px-4 py-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-xl transition-all"
                  title="View Inactive Prescriptions"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Inactive ({inactivePrescriptions.length})</span>
                </button>
              )}
              <div className="flex items-center space-x-3 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-xl">
                <UserIcon className="w-4 h-4" />
                <span className="font-medium">@{user.username}</span>
                {user.full_name && <span className="text-gray-400">({user.full_name})</span>}
                <div className="w-2 h-2 bg-green-400 rounded-full" title="Authenticated"></div>
              </div>
              <button
                onClick={onExit}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                title="Exit Application"
              >
                <X className="w-4 h-4" />
                <span>Exit</span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Activity className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Active Prescriptions</p>
                <p className="text-3xl font-bold text-gray-900">{getActivePrescriptions()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Taken Today</p>
                <p className="text-3xl font-bold text-gray-900">{getTodaysTaken()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Adherence Rate</p>
                <p className="text-3xl font-bold text-gray-900">{getAdherenceRate()}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Add Prescription Button */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Your Prescriptions</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowPrescriptionHistory(true)}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <History className="w-5 h-5 mr-2" />
              View History
            </button>
            <button
              onClick={() => setShowDailyPrescriptions(true)}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Daily View
            </button>
            <button
              onClick={() => setShowDoseSchedule(true)}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-indigo-800 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Clock className="w-5 h-5 mr-2" />
              Dose Schedule
            </button>
            {inactivePrescriptions.length > 0 && (
              <button
                onClick={() => setShowInactivePrescriptions(true)}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-semibold hover:from-orange-700 hover:to-red-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <AlertCircle className="w-5 h-5 mr-2" />
                Inactive ({inactivePrescriptions.length})
              </button>
            )}
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Prescription
            </button>
          </div>
        </div>

        {/* Prescriptions Grid */}
        {prescriptions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <Bell className="w-16 h-16 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No prescriptions yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
              Get started by adding your first prescription with flexible scheduling and custom timing options.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-6 h-6 mr-3" />
              Add Your First Prescription
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {prescriptions.map((prescription) => (
              <PrescriptionCard
                key={prescription.id}
                prescription={prescription}
                doseSchedules={doseSchedules.filter(ds => ds.prescription_id === prescription.id)}
                logs={logs.filter(log => log.prescription_id === prescription.id)}
                onEdit={(p) => {
                  setEditingPrescription(p);
                  setShowForm(true);
                }}
                onDelete={handleDeletePrescription}
                onMarkTaken={handleMarkTaken}
                onMarkMissed={handleMarkMissed}
                onCorrectTime={handleCorrectTime}
                onViewHistory={handleViewHistory}
              />
            ))}
          </div>
        )}
      </main>

      {/* Form Modal */}
      <PrescriptionForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingPrescription(null);
        }}
        onSubmit={editingPrescription ? handleEditPrescription : handleAddPrescription}
        prescription={editingPrescription}
        doseSchedules={editingPrescription ? doseSchedules.filter(ds => ds.prescription_id === editingPrescription.id) : []}
      />

      {/* History Modal */}
      {showHistory && (
        <HistoryModal
          prescriptionId={showHistory}
          history={history.filter(h => h.prescription_id === showHistory)}
          onClose={() => setShowHistory(null)}
          onUpdateHistory={fetchHistory}
        />
      )}

      {/* Admin Panel */}
      {showAdminPanel && (
        <AdminPanel
          currentUser={user}
          onClose={() => setShowAdminPanel(false)}
        />
      )}

      {/* Prescription History Modal */}
      {showPrescriptionHistory && (
        <PrescriptionHistoryModal
          user={user}
          onClose={() => setShowPrescriptionHistory(false)}
        />
      )}

      {/* Daily Prescriptions Modal */}
      {showDailyPrescriptions && (
        <DailyPrescriptionsModal
          user={user}
          onClose={() => setShowDailyPrescriptions(false)}
        />
      )}

      {/* Dose Schedule Screen */}
      {showDoseSchedule && (
        <DoseScheduleScreen
          user={user}
          onClose={() => setShowDoseSchedule(false)}
        />
      )}

      {/* Inactive Prescriptions Modal */}
      {showInactivePrescriptions && (
        <InactivePrescriptionsModal
          inactivePrescriptions={inactivePrescriptions}
          onClose={() => setShowInactivePrescriptions(false)}
          onReactivate={handleReactivatePrescription}
        />
      )}
    </div>
  );
};