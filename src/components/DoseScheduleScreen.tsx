import React, { useState, useEffect } from 'react';
import { format, startOfDay, endOfDay, addDays, subDays } from 'date-fns';
import { X, Calendar, Clock, Pill, Check, CircleAlert as AlertCircle, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Prescription, DoseSchedule, MedicationHistory, supabase, AuthUser, generateScheduledTimes } from '../lib/supabase';
import { MedicationImage } from './MedicationImage';

interface DoseScheduleScreenProps {
  user: AuthUser;
  onClose: () => void;
}

interface ScheduledDose {
  prescription: Prescription;
  scheduledDateTime: Date;
  quantity: number;
  taken: boolean;
  historyEntry?: MedicationHistory;
}

export const DoseScheduleScreen: React.FC<DoseScheduleScreenProps> = ({
  user,
  onClose,
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [doseSchedules, setDoseSchedules] = useState<DoseSchedule[]>([]);
  const [history, setHistory] = useState<MedicationHistory[]>([]);
  const [scheduledDoses, setScheduledDoses] = useState<ScheduledDose[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (prescriptions.length > 0 && doseSchedules.length > 0) {
      generateDosesForDate();
    }
  }, [prescriptions, doseSchedules, history, selectedDate]);

  const fetchData = async () => {
    try {
      const [prescriptionsRes, schedulesRes, historyRes] = await Promise.all([
        supabase
          .from('prescriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true),
        supabase
          .from('dose_schedules')
          .select('*')
          .eq('is_active', true),
        supabase
          .from('medication_history')
          .select('*')
          .eq('user_id', user.id)
      ]);

      if (prescriptionsRes.error) throw prescriptionsRes.error;
      if (schedulesRes.error) throw schedulesRes.error;
      if (historyRes.error) throw historyRes.error;

      setPrescriptions(prescriptionsRes.data || []);
      setDoseSchedules(schedulesRes.data || []);
      setHistory(historyRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDosesForDate = () => {
    const doses: ScheduledDose[] = [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    prescriptions.forEach(prescription => {
      const prescriptionSchedules = doseSchedules.filter(ds => ds.prescription_id === prescription.id);
      const scheduledTimes = generateScheduledTimes(prescriptionSchedules, selectedDate);

      scheduledTimes.forEach(scheduledTime => {
        const quantity = prescriptionSchedules.find(ds => {
          const scheduleTime = format(scheduledTime, 'HH:mm:ss');
          return ds.dose_time === scheduleTime;
        })?.quantity || 1;

        // Check if this dose was taken
        const historyEntry = history.find(h => 
          h.prescription_id === prescription.id &&
          h.scheduled_date === dateStr &&
          h.scheduled_time === format(scheduledTime, 'HH:mm:ss')
        );

        doses.push({
          prescription,
          scheduledDateTime: scheduledTime,
          quantity,
          taken: !!historyEntry,
          historyEntry
        });
      });
    });

    // Sort by scheduled date/time
    doses.sort((a, b) => a.scheduledDateTime.getTime() - b.scheduledDateTime.getTime());
    setScheduledDoses(doses);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedDate(subDays(selectedDate, 1));
    } else {
      setSelectedDate(addDays(selectedDate, 1));
    }
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const getStats = () => {
    const total = scheduledDoses.length;
    const taken = scheduledDoses.filter(d => d.taken).length;
    const pending = total - taken;
    
    return { total, taken, pending };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dose schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Dose Schedule</h2>
              <p className="text-sm text-gray-600">Daily medication schedule overview</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Date Navigation */}
        <div className="p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </h3>
                <p className="text-sm text-gray-600">
                  {format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'Today' : 
                   format(selectedDate, 'yyyy-MM-dd') === format(addDays(new Date(), 1), 'yyyy-MM-dd') ? 'Tomorrow' :
                   format(selectedDate, 'yyyy-MM-dd') === format(subDays(new Date(), 1), 'yyyy-MM-dd') ? 'Yesterday' :
                   format(selectedDate, 'EEEE')}
                </p>
              </div>
              
              <button
                onClick={() => navigateDate('next')}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                Today
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                title="Refresh Data"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Doses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.taken}</div>
              <div className="text-sm text-gray-600">Taken</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </div>
        </div>

        {/* Dose List */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 280px)' }}>
          {scheduledDoses.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Doses Scheduled</h3>
              <p className="text-gray-600">
                No medications are scheduled for this day.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledDoses.map((dose, index) => (
                <div
                  key={`${dose.prescription.id}-${dose.scheduledDateTime.getTime()}`}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    dose.taken 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-white hover:shadow-md'
                  }`}
                >
                  {/* Left Side - Time */}
                  <div className="flex items-center space-x-4">
                    <div className="text-center min-w-[80px]">
                      <div className="text-lg font-bold text-gray-900">
                        {format(dose.scheduledDateTime, 'h:mm')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(dose.scheduledDateTime, 'a')}
                      </div>
                    </div>

                    {/* Status Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      dose.taken ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {dose.taken ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  </div>

                  {/* Center - Medication Info */}
                  <div className="flex-1 mx-4">
                    <div className="flex items-center space-x-3">
                      <MedicationImage 
                        drugName={dose.prescription.name}
                        dosage={dose.prescription.dosage}
                        size="sm"
                        className="w-8 h-8"
                      />
                      <div>
                        <h4 className="font-bold text-gray-900">{dose.prescription.name}</h4>
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          <span>{dose.prescription.dosage}</span>
                          <span>•</span>
                          <span>{dose.quantity} {dose.quantity === 1 ? 'pill' : 'pills'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Status */}
                  <div className="text-right min-w-[100px]">
                    {dose.taken ? (
                      <div className="space-y-1">
                        <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          <Check className="w-3 h-3 mr-1" />
                          Taken
                        </div>
                        {dose.historyEntry && (
                          <div className="text-xs text-gray-500">
                            {format(new Date(dose.historyEntry.actual_taken_datetime), 'h:mm a')}
                            {(() => {
                              const scheduledDateTime = dose.scheduledDateTime;
                              const actualDateTime = new Date(dose.historyEntry.actual_taken_datetime);
                              const timeDiffMinutes = Math.abs((actualDateTime.getTime() - scheduledDateTime.getTime()) / (1000 * 60));
                              return timeDiffMinutes > 1; // Show corrected if more than 1 minute difference
                            })() && (
                              <span className="ml-1 text-orange-600">(corrected)</span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {scheduledDoses.length} doses scheduled for {format(selectedDate, 'MMMM d, yyyy')}
              {stats.taken > 0 && (
                <span className="ml-2 text-green-600 font-medium">
                  • {stats.taken} completed
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};