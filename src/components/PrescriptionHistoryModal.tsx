import React, { useState, useEffect } from 'react';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { X, Calendar, Clock, ListFilter as Filter, Download, Pill, TrendingUp, CircleAlert as AlertCircle, CreditCard as Edit2, Trash2, RefreshCw } from 'lucide-react';
import { MedicationHistory, supabase, AuthUser } from '../lib/supabase';
import { MedicationImage } from './MedicationImage';

interface PrescriptionHistoryModalProps {
  user: AuthUser;
  onClose: () => void;
}

export const PrescriptionHistoryModal: React.FC<PrescriptionHistoryModalProps> = ({
  user,
  onClose,
}) => {
  const [history, setHistory] = useState<MedicationHistory[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<MedicationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState('all');
  const [sortBy, setSortBy] = useState<'scheduled' | 'actual'>('actual');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [prescriptionNames, setPrescriptionNames] = useState<string[]>([]);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editDateTime, setEditDateTime] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [deletingEntry, setDeletingEntry] = useState<string | null>(null);

  const handleRefresh = async () => {
    setLoading(true);
    await fetchHistory();
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [history, startDate, endDate, selectedPrescription, sortBy, sortOrder]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('medication_history')
        .select('*')
        .eq('user_id', user.id)
        .order('actual_taken_datetime', { ascending: false });

      if (error) throw error;
      
      setHistory(data || []);
      
      // Extract unique prescription names for filter
      const uniqueNames = [...new Set((data || []).map(h => h.prescription_name))];
      setPrescriptionNames(uniqueNames);
      
      // Set default date range to last 30 days
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      setStartDate(format(thirtyDaysAgo, 'yyyy-MM-dd'));
      setEndDate(format(today, 'yyyy-MM-dd'));
      
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...history];

    // Filter by date range
    if (startDate && endDate) {
      // Parse dates as local dates to avoid timezone issues
      const start = startOfDay(new Date(startDate + 'T00:00:00'));
      const end = endOfDay(new Date(endDate + 'T23:59:59'));
      
      filtered = filtered.filter(entry => {
        const entryDate = parseISO(entry.actual_taken_datetime);
        return entryDate >= start && entryDate <= end;
      });
    }

    // Filter by prescription
    if (selectedPrescription !== 'all') {
      filtered = filtered.filter(entry => entry.prescription_name === selectedPrescription);
    }

    // Sort
    filtered.sort((a, b) => {
      const dateA = sortBy === 'scheduled' 
        ? new Date(`${a.scheduled_date}T${a.scheduled_time}`)
        : parseISO(a.actual_taken_datetime);
      const dateB = sortBy === 'scheduled'
        ? new Date(`${b.scheduled_date}T${b.scheduled_time}`)
        : parseISO(b.actual_taken_datetime);

      const comparison = dateA.getTime() - dateB.getTime();
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredHistory(filtered);
  };

  const handleEditEntry = (entry: MedicationHistory) => {
    setEditingEntry(entry.id);
    setEditDateTime(format(parseISO(entry.actual_taken_datetime), "yyyy-MM-dd'T'HH:mm"));
    setEditNotes(entry.notes || '');
  };

  const handleSaveEdit = async () => {
    if (!editingEntry || !editDateTime) return;

    try {
      // Create date object from local datetime-local input
      // This preserves the user's intended local time
      const localDateTime = new Date(editDateTime);
      
      const { error } = await supabase
        .from('medication_history')
        .update({
          actual_taken_datetime: localDateTime.toISOString(),
          notes: editNotes,
          is_corrected: true
        })
        .eq('id', editingEntry);

      if (error) throw error;

      setEditingEntry(null);
      setEditDateTime('');
      setEditNotes('');
      fetchHistory();
    } catch (error) {
      console.error('Error updating history entry:', error);
      alert('Failed to update history entry. Please try again.');
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this history entry? This action cannot be undone.')) {
      return;
    }

    setDeletingEntry(entryId);
    
    try {
      const { error } = await supabase
        .from('medication_history')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      fetchHistory();
    } catch (error) {
      console.error('Error deleting history entry:', error);
      alert('Failed to delete history entry. Please try again.');
    } finally {
      setDeletingEntry(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setEditDateTime('');
    setEditNotes('');
  };

  const formatScheduledDateTime = (date: string, time: string) => {
    const dateTime = new Date(`${date}T${time}`);
    return format(dateTime, 'MMM d, yyyy h:mm a');
  };

  const formatActualDateTime = (dateTime: string) => {
   return format(new Date(dateTime), 'MMM d, yyyy h:mm a');
  };

  const getTimeDifference = (scheduled: string, scheduledTime: string, actual: string) => {
    const scheduledDateTime = new Date(`${scheduled}T${scheduledTime}`);
   const actualDateTime = new Date(actual);
    const diffMinutes = Math.round((actualDateTime.getTime() - scheduledDateTime.getTime()) / (1000 * 60));
    
    if (diffMinutes === 0) return 'On time';
    if (diffMinutes > 0) return `${diffMinutes} min late`;
    return `${Math.abs(diffMinutes)} min early`;
  };

  const getTimeDifferenceColor = (scheduled: string, scheduledTime: string, actual: string) => {
    const scheduledDateTime = new Date(`${scheduled}T${scheduledTime}`);
   const actualDateTime = new Date(actual);
    const diffMinutes = Math.round((actualDateTime.getTime() - scheduledDateTime.getTime()) / (1000 * 60));
    
    if (Math.abs(diffMinutes) <= 15) return 'text-green-600 bg-green-50';
    if (Math.abs(diffMinutes) <= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const exportToCSV = () => {
    const headers = [
      'Prescription',
      'Dosage',
      'Scheduled Date',
      'Scheduled Time',
      'Actual Date & Time',
      'Quantity Taken',
      'Timing',
      'Corrected',
      'Notes'
    ];

    const csvData = filteredHistory.map(entry => [
      entry.prescription_name,
      entry.dosage,
      entry.scheduled_date,
      entry.scheduled_time,
      formatActualDateTime(entry.actual_taken_datetime),
      entry.quantity_taken,
      getTimeDifference(entry.scheduled_date, entry.scheduled_time, entry.actual_taken_datetime),
      entry.is_corrected ? 'Yes' : 'No',
      entry.notes || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medication-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStats = () => {
    const total = filteredHistory.length;
    const onTime = filteredHistory.filter(entry => {
      const scheduledDateTime = new Date(`${entry.scheduled_date}T${entry.scheduled_time}`);
      const actualDateTime = parseISO(entry.actual_taken_datetime);
      const diffMinutes = Math.abs((actualDateTime.getTime() - scheduledDateTime.getTime()) / (1000 * 60));
      return diffMinutes <= 15;
    }).length;
    
    const corrected = filteredHistory.filter(entry => entry.is_corrected).length;
    
    return { total, onTime, corrected };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading prescription history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Prescription History</h2>
              <p className="text-sm text-gray-600">Complete medication tracking and adherence analysis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Entries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.total > 0 ? Math.round((stats.onTime / stats.total) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">On Time (±15 min)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.corrected}</div>
              <div className="text-sm text-gray-600">Time Corrected</div>
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
                {prescriptionNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [by, order] = e.target.value.split('-');
                  setSortBy(by as 'scheduled' | 'actual');
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="actual-desc">Actual Time (Newest)</option>
                <option value="actual-asc">Actual Time (Oldest)</option>
                <option value="scheduled-desc">Scheduled Time (Newest)</option>
                <option value="scheduled-asc">Scheduled Time (Oldest)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={exportToCSV}
                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* History List */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 380px)' }}>
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No History Found</h3>
              <p className="text-gray-600">
                {history.length === 0 
                  ? 'No medication history entries yet. Start taking your medications to build your history.'
                  : 'No entries match your current filters. Try adjusting the date range or prescription filter.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all"
                >
                  {editingEntry === entry.id ? (
                    /* Edit Mode */
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Actual Date & Time Taken
                          </label>
                          <input
                            type="datetime-local"
                            value={editDateTime}
                            onChange={(e) => setEditDateTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Notes (Optional)
                          </label>
                          <input
                            type="text"
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Add notes about this dose..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={handleSaveEdit}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Header */}
                        <div className="flex items-center space-x-3 mb-3">
                          <MedicationImage
                            drugName={entry.prescription_name}
                            dosage={entry.dosage}
                            size="md"
                            className="w-10 h-10"
                          />
                          <div>
                            <h4 className="font-bold text-gray-900 text-lg">{entry.prescription_name}</h4>
                            <p className="text-gray-600">{entry.dosage}</p>
                          </div>
                          {entry.is_corrected && (() => {
                            const scheduledDateTime = new Date(`${entry.scheduled_date}T${entry.scheduled_time}`);
                            const actualDateTime = new Date(entry.actual_taken_datetime);
                            const timeDiffMinutes = Math.abs((actualDateTime.getTime() - scheduledDateTime.getTime()) / (1000 * 60));
                            return timeDiffMinutes > 1;
                          })() && (
                            <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Time Corrected
                            </span>
                          )}
                          <div className="text-sm text-gray-900">
                            {formatActualDateTime(entry.actual_taken_datetime)}
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-lg">
                          <div className="flex items-center space-x-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-semibold text-gray-700">Timing</span>
                          </div>
                          <div className={`text-sm font-medium px-2 py-1 rounded-full ${getTimeDifferenceColor(entry.scheduled_date, entry.scheduled_time, entry.actual_taken_datetime)}`}>
                            {getTimeDifference(entry.scheduled_date, entry.scheduled_time, entry.actual_taken_datetime)}
                          </div>
                        </div>
                      </div>

                      {/* Additional Details */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Quantity Taken:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {entry.quantity_taken} {entry.quantity_taken === 1 ? 'unit' : 'units'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Recorded:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {format(parseISO(entry.created_at), 'MMM d, h:mm a')}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Scheduled:</span>
                            <div className="font-medium text-gray-900">
                              {formatScheduledDateTime(entry.scheduled_date, entry.scheduled_time)}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Actually Taken:</span>
                            <div className="font-medium text-gray-900">
                              {formatActualDateTime(entry.actual_taken_datetime)}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Timing:</span>
                            <div className={`font-medium ${getTimeDifferenceColor(entry.scheduled_date, entry.scheduled_time, entry.actual_taken_datetime)}`}>
                              {getTimeDifference(entry.scheduled_date, entry.scheduled_time, entry.actual_taken_datetime)}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                          <div>
                            <span className="text-gray-600">Quantity:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {entry.quantity_taken} {entry.quantity_taken === 1 ? 'unit' : 'units'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Recorded:</span>
                            <span className="ml-2 font-medium text-gray-900">
                             {format(new Date(entry.created_at), 'MMM d, h:mm a')}
                            </span>
                          </div>
                        </div>

                        {/* Notes */}
                        {entry.notes && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <span className="text-sm text-gray-600">Notes: </span>
                            <span className="text-sm text-gray-900">{entry.notes}</span>
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex items-center space-x-2">
                        <button
                          onClick={() => handleEditEntry(entry)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                          title="Edit entry"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          disabled={deletingEntry === entry.id}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete entry"
                        >
                          {deletingEntry === entry.id ? (
                            <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent"></div>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {filteredHistory.length} of {history.length} entries
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