import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { X, Clock, Calendar, Edit2, Check, AlertCircle, Trash2, RefreshCw } from 'lucide-react';
import { MedicationHistory, supabase } from '../lib/supabase';
import { MedicationImage } from './MedicationImage';

interface HistoryModalProps {
  prescriptionId: string;
  history: MedicationHistory[];
  onClose: () => void;
  onUpdateHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  prescriptionId,
  history,
  onClose,
  onUpdateHistory,
}) => {
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editDateTime, setEditDateTime] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [deletingEntry, setDeletingEntry] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onUpdateHistory();
    setRefreshing(false);
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
      onUpdateHistory();
    } catch (error) {
      console.error('Error updating history entry:', error);
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

      onUpdateHistory();
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
    
    if (Math.abs(diffMinutes) <= 15) return 'text-green-600';
    if (Math.abs(diffMinutes) <= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Medication History</h2>
              <p className="text-sm text-gray-600">
                {history.length > 0 ? history[0].prescription_name : 'No entries found'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              title="Refresh History"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* History List */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {history.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No History Yet</h3>
              <p className="text-gray-600">
                History entries will appear here when you mark doses as taken.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all"
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
                        <div className="flex items-center space-x-3 mb-3">
                          <MedicationImage 
                            drugName={entry.prescription_name}
                            dosage={entry.dosage}
                            size="md"
                            className="w-10 h-10"
                          />
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="font-semibold text-gray-900">
                              Scheduled: {formatScheduledDateTime(entry.scheduled_date, entry.scheduled_time)}
                            </span>
                          </div>
                          {entry.is_corrected && (
                            <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Corrected
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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
                          <div>
                            <span className="text-gray-600">Quantity:</span>
                            <div className="font-medium text-gray-900">
                              {entry.quantity_taken} {entry.quantity_taken === 1 ? 'unit' : 'units'}
                            </div>
                          </div>
                        </div>

                        {entry.notes && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <span className="text-sm text-gray-600">Notes: </span>
                            <span className="text-sm text-gray-900">{entry.notes}</span>
                          </div>
                        )}

                        <div className="mt-3 text-xs text-gray-500">
                         Recorded: {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                        </div>
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
              {history.length} {history.length === 1 ? 'entry' : 'entries'} total
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};