import React, { useState, useEffect } from 'react';
import { format, parseISO, startOfDay, endOfDay, addDays, isSameDay } from 'date-fns';
import { X, Calendar, Clock, Check, CircleAlert as AlertCircle, Pill, ListFilter as Filter, Download, RefreshCw } from 'lucide-react';
import { Prescription, DoseSchedule, MedicationLog, MedicationHistory, supabase, AuthUser, generateScheduledTimes } from '../lib/supabase';
import { MedicationImage } from './MedicationImage';

interface DailyPrescriptionsModalProps {
  user: AuthUser;
  onClose: () => void;
}

interface ScheduledDose {
  prescription: Prescription;
  scheduledDateTime: Date;
  quantity: number;
  status: 'taken' | 'missed' | 'pending';
  log?: MedicationLog;
  historyEntry?: MedicationHistory;
}

export const DailyPrescriptionsModal: React.FC<DailyPrescriptionsModalProps> = ({
  user,
  onClose,
}) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [doseSchedules, setDoseSchedules] = useState<DoseSchedule[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [history, setHistory] = useState<MedicationHistory[]>([]);
  const [scheduledDoses, setScheduledDoses] = useState<ScheduledDose[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Date range filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleRefresh = async () => {
    setLoading(true);
    await fetchData();
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (prescriptions.length > 0 && doseSchedules.length > 0) {
      generateScheduledDoses();
    }
  }, [prescriptions, doseSchedules, logs, history, startDate, endDate, selectedPrescription, statusFilter, sortOrder]);

  const fetchData = async () => {
    try {
      // Set default date range to today
      const today = new Date();
      const localToday = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
      const todayStr = localToday.toISOString().split('T')[0];
      setStartDate(todayStr);
      setEndDate(todayStr);

      // Fetch all data
      const [prescriptionsRes, schedulesRes, logsRes, historyRes] = await Promise.all([
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
          .from('medication_logs')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('medication_history')
          .select('*')
          .eq('user_id', user.id)
      ]);

      if (prescriptionsRes.error) throw prescriptionsRes.error;
      if (schedulesRes.error) throw schedulesRes.error;
      if (logsRes.error) throw logsRes.error;
      if (historyRes.error) throw historyRes.error;

      setPrescriptions(prescriptionsRes.data || []);
      setDoseSchedules(schedulesRes.data || []);
      setLogs(logsRes.data || []);
      setHistory(historyRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateScheduledDoses = () => {
    if (!startDate || !endDate) return;

    // Parse dates as local dates to avoid timezone issues
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');
    const doses: ScheduledDose[] = [];

    // Generate doses for each day in the range
    for (let date = new Date(start); date <= end; date = addDays(date, 1)) {
      prescriptions.forEach(prescription => {
        const prescriptionSchedules = doseSchedules.filter(ds => ds.prescription_id === prescription.id);
        const scheduledTimes = generateScheduledTimes(prescriptionSchedules, date);

        scheduledTimes.forEach(scheduledTime => {
          const quantity = prescriptionSchedules.find(ds => {
            const scheduleTime = format(scheduledTime, 'HH:mm:ss');
            return ds.dose_time === scheduleTime;
          })?.quantity || 1;

          // Check if this dose was taken (look in history first, then logs)
          const historyEntry = history.find(h => 
            h.prescription_id === prescription.id &&
            h.scheduled_date === format(date, 'yyyy-MM-dd') &&
            h.scheduled_time === format(scheduledTime, 'HH:mm:ss')
          );

          let status: 'taken' | 'missed' | 'pending' = 'pending';
          let log: MedicationLog | undefined;

          if (historyEntry) {
            status = 'taken';
          } else {
            // Check logs for status
            log = logs.find(l => {
              const logTime = new Date(l.scheduled_time);
              return Math.abs(logTime.getTime() - scheduledTime.getTime()) < 60000; // Within 1 minute
            });
            
            if (log) {
              status = log.status as 'taken' | 'missed' | 'pending';
            } else if (scheduledTime < new Date()) {
              // If it's in the past and no log exists, consider it pending (not automatically missed)
              status = 'pending';
            }
          }

          doses.push({
            prescription,
            scheduledDateTime: scheduledTime,
            quantity,
            status,
            log,
            historyEntry
          });
        });
      });
    }

    // Apply filters
    let filteredDoses = doses;

    if (selectedPrescription !== 'all') {
      filteredDoses = filteredDoses.filter(dose => dose.prescription.name === selectedPrescription);
    }

    if (statusFilter !== 'all') {
      filteredDoses = filteredDoses.filter(dose => dose.status === statusFilter);
    }

    // Sort by scheduled date/time
    filteredDoses.sort((a, b) => {
      const comparison = a.scheduledDateTime.getTime() - b.scheduledDateTime.getTime();
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setScheduledDoses(filteredDoses);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'taken': return 'text-green-700 bg-green-50 border-green-200';
      case 'missed': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'taken': return <Check className="w-4 h-4" />;
      case 'missed': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTimeDifference = (scheduled: Date, actual: string) => {
   const actualDateTime = new Date(actual);
    const diffMinutes = Math.round((actualDateTime.getTime() - scheduled.getTime()) / (1000 * 60));
    
    if (diffMinutes === 0) return 'On time';
    if (diffMinutes > 0) return `${diffMinutes} min late`;
    return `${Math.abs(diffMinutes)} min early`;
  };

  const getTimeDifferenceColor = (scheduled: Date, actual: string) => {
   const actualDateTime = new Date(actual);
    const diffMinutes = Math.abs((actualDateTime.getTime() - scheduled.getTime()) / (1000 * 60));
    
    if (diffMinutes <= 15) return 'text-green-600';
    if (diffMinutes <= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const exportToCSV = () => {
    const headers = [
      'Date',
      'Time',
      'Prescription',
      'Dosage',
      'Quantity',
      'Status',
      'Actual Time Taken',
      'Timing Difference',
      'Notes'
    ];

    const csvData = scheduledDoses.map(dose => [
      format(dose.scheduledDateTime, 'yyyy-MM-dd'),
      format(dose.scheduledDateTime, 'HH:mm'),
      dose.prescription.name,
      dose.prescription.dosage,
      dose.quantity,
      dose.status,
      dose.historyEntry ? format(parseISO(dose.historyEntry.actual_taken_datetime), 'yyyy-MM-dd HH:mm') : '',
      dose.historyEntry ? getTimeDifference(dose.scheduledDateTime, dose.historyEntry.actual_taken_datetime) : '',
      dose.historyEntry?.notes || dose.log?.notes || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-prescriptions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStats = () => {
    const total = scheduledDoses.length;
    const taken = scheduledDoses.filter(d => d.status === 'taken').length;
    const missed = scheduledDoses.filter(d => d.status === 'missed').length;
    const pending = scheduledDoses.filter(d => d.status === 'pending').length;
    
    return { total, taken, missed, pending };
  };

  const stats = getStats();
  const uniquePrescriptions = [...new Set(prescriptions.map(p => p.name))];

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading daily prescriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Daily Prescriptions</h2>
              <p className="text-sm text-gray-600">Track scheduled doses and adherence by date range</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50 mr-2"
            title="Refresh Data"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Scheduled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.taken}</div>
              <div className="text-sm text-gray-600">Taken</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.missed}</div>
              <div className="text-sm text-gray-600">Missed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Prescription
              </label>
              <select
                value={selectedPrescription}
                onChange={(e) => setSelectedPrescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Prescriptions</option>
                {uniquePrescriptions.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="taken">Taken</option>
                <option value="missed">Missed</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sort Order
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="asc">Earliest First</option>
                <option value="desc">Latest First</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  const today = new Date();
                  const localToday = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
                  const todayStr = localToday.toISOString().split('T')[0];
                  setStartDate(todayStr);
                  setEndDate(todayStr);
                }}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const localToday = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
                  const weekAgo = new Date(localToday);
                  weekAgo.setDate(localToday.getDate() - 7);
                  setStartDate(weekAgo.toISOString().split('T')[0]);
                  setEndDate(localToday.toISOString().split('T')[0]);
                }}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                Last 7 Days
              </button>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Scheduled Doses List */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 450px)' }}>
          {scheduledDoses.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Scheduled Doses</h3>
              <p className="text-gray-600">
                {prescriptions.length === 0 
                  ? 'No active prescriptions found. Add prescriptions to see scheduled doses.'
                  : 'No doses match your current filters. Try adjusting the date range or filters.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {scheduledDoses.map((dose, index) => (
                <div
                  key={`${dose.prescription.id}-${dose.scheduledDateTime.getTime()}`}
                  className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center space-x-3 mb-3">
                        <MedicationImage 
                          drugName={dose.prescription.name}
                          dosage={dose.prescription.dosage}
                          size="md"
                          className="w-10 h-10"
                        />
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">{dose.prescription.name}</h4>
                          <p className="text-gray-600">{dose.prescription.dosage}</p>
                        </div>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full border-2 ${getStatusColor(dose.status)}`}>
                          {getStatusIcon(dose.status)}
                          <span className="ml-2 font-medium capitalize">{dose.status}</span>
                        </div>
                      </div>

                      {/* Time Information */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-white p-3 rounded-lg">
                          <div className="flex items-center space-x-2 mb-1">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-semibold text-gray-700">Scheduled</span>
                          </div>
                          <div className="text-sm text-gray-900">
                            {format(dose.scheduledDateTime, 'MMM d, yyyy')}
                          </div>
                          <div className="text-lg font-bold text-gray-900">
                            {format(dose.scheduledDateTime, 'h:mm a')}
                          </div>
                        </div>

                        {dose.historyEntry && (
                          <div className="bg-white p-3 rounded-lg">
                            <div className="flex items-center space-x-2 mb-1">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-semibold text-gray-700">Actually Taken</span>
                            </div>
                            <div className="text-sm text-gray-900">
                             {format(new Date(dose.historyEntry.actual_taken_datetime), 'MMM d, yyyy')}
                            </div>
                            <div className="text-lg font-bold text-gray-900">
                             {format(new Date(dose.historyEntry.actual_taken_datetime), 'h:mm a')}
                            </div>
                          </div>
                        )}

                        <div className="bg-white p-3 rounded-lg">
                          <div className="flex items-center space-x-2 mb-1">
                            <Pill className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-semibold text-gray-700">Quantity</span>
                          </div>
                          <div className="text-lg font-bold text-gray-900">
                            {dose.quantity} {dose.quantity === 1 ? 'unit' : 'units'}
                          </div>
                          {dose.historyEntry && (
                            <div className={`text-sm font-medium ${getTimeDifferenceColor(dose.scheduledDateTime, dose.historyEntry.actual_taken_datetime)}`}>
                              {getTimeDifference(dose.scheduledDateTime, dose.historyEntry.actual_taken_datetime)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Notes */}
                      {(dose.historyEntry?.notes || dose.log?.notes) && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <span className="text-sm text-gray-600">Notes: </span>
                          <span className="text-sm text-gray-900">
                            {dose.historyEntry?.notes || dose.log?.notes}
                          </span>
                        </div>
                      )}

                      {/* Correction Indicator */}
                      {dose.historyEntry && (() => {
                        const scheduledDateTime = dose.scheduledDateTime;
                        const actualDateTime = new Date(dose.historyEntry.actual_taken_datetime);
                        const timeDiffMinutes = Math.abs((actualDateTime.getTime() - scheduledDateTime.getTime()) / (1000 * 60));
                        return timeDiffMinutes > 1; // Show corrected if more than 1 minute difference
                      })() && (
                        <div className="mt-2 inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Time was corrected after initial entry
                        </div>
                      )}
                    </div>
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
              Showing {scheduledDoses.length} scheduled doses
              {startDate && endDate && (
                <span className="ml-2">
                  from {format(new Date(startDate), 'MMM d, yyyy')} to {format(new Date(endDate), 'MMM d, yyyy')}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};