import React, { useState } from 'react';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { Pill, Clock, Calendar, MoveVertical as MoreVertical, CreditCard as Edit, Trash2, Check, X, CircleAlert as AlertCircle, Settings, History } from 'lucide-react';
import { Prescription, MedicationLog, DoseSchedule, generateScheduledTimes } from '../lib/supabase';
import { triggerHaptic } from '../lib/capacitor';
import { MedicationImage } from './MedicationImage';

interface PrescriptionCardProps {
  prescription: Prescription;
  doseSchedules: DoseSchedule[];
  logs: MedicationLog[];
  onEdit: (prescription: Prescription) => void;
  onDelete: (id: string) => void;
  onMarkTaken: (prescriptionId: string, prescriptionName: string, dosage: string, scheduledDate: string, scheduledTime: string, quantity: number, actualDateTime?: string) => void;
  onMarkMissed: (prescriptionId: string, scheduledTime: string) => void;
  onCorrectTime: (logId: string, newTime: string) => void;
  onViewHistory: (prescriptionId: string) => void;
}

export const PrescriptionCard: React.FC<PrescriptionCardProps> = ({
  prescription,
  doseSchedules,
  logs,
  onEdit,
  onDelete,
  onMarkTaken,
  onMarkMissed,
  onCorrectTime,
  onViewHistory,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [correctingLog, setCorrectingLog] = useState<string | null>(null);
  const [correctionTime, setCorrectionTime] = useState('');
  const [showTakenDialog, setShowTakenDialog] = useState<{
    prescriptionId: string;
    prescriptionName: string;
    dosage: string;
    scheduledTime: Date;
    quantity: number;
  } | null>(null);
  const [actualDateTime, setActualDateTime] = useState('');
  const [correctedScheduledDateTime, setCorrectedScheduledDateTime] = useState('');
  const [showScheduleCorrection, setShowScheduleCorrection] = useState(false);

  const getTodaysDoses = () => {
    const today = new Date();
    const scheduledTimes = generateScheduledTimes(doseSchedules, today);
    
    return scheduledTimes.map(time => {
      const log = logs.find(log => {
        const logTime = new Date(log.scheduled_time);
        return Math.abs(logTime.getTime() - time.getTime()) < 60000; // Within 1 minute
      });
      
      return {
        time,
        log,
        status: log?.status || 'pending'
      };
    });
  };

  const getQuantityForTime = (time: Date): number => {
    const timeStr = format(time, 'HH:mm:ss');
    const schedule = doseSchedules.find(ds => ds.dose_time === timeStr);
    return schedule?.quantity || 1;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'taken': return 'text-green-700 bg-green-50 border-green-200';
      case 'missed': return 'text-red-700 bg-red-50 border-red-200';
      case 'skipped': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'taken': return <Check className="w-4 h-4" />;
      case 'missed': return <X className="w-4 h-4" />;
      case 'skipped': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatTime = (date: Date) => {
    return format(date, 'h:mm a');
  };

  const formatDate = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  };

  const handleTimeCorrection = (logId: string) => {
    if (correctionTime) {
      const now = new Date();
      const [hours, minutes] = correctionTime.split(':');
      now.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      onCorrectTime(logId, now.toISOString());
      setCorrectingLog(null);
      setCorrectionTime('');
    }
  };

  const handleMarkTaken = (prescriptionId: string, scheduledTime: Date, quantity: number) => {
    setShowTakenDialog({
      prescriptionId,
      prescriptionName: prescription.name,
      dosage: prescription.dosage,
      scheduledTime,
      quantity
    });
    // Set default to current local time without timezone conversion
    const now = new Date();
    const localDateTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
    setActualDateTime(localDateTime.toISOString().slice(0, 16));
  };

  const confirmMarkTaken = () => {
    if (showTakenDialog && actualDateTime) {
      // Trigger haptic feedback on mobile
      triggerHaptic('medium');
      
      // Create date object from local datetime-local input
      // This preserves the user's intended local time
      const localDateTime = new Date(actualDateTime);
      
      // Use corrected scheduled time if provided, otherwise use original
      let finalScheduledDate: string;
      let finalScheduledTime: string;
      
      if (correctedScheduledDateTime) {
        const correctedDateTime = new Date(correctedScheduledDateTime);
        finalScheduledDate = format(correctedDateTime, 'yyyy-MM-dd');
        finalScheduledTime = format(correctedDateTime, 'HH:mm:ss');
      } else {
        finalScheduledDate = format(showTakenDialog.scheduledTime, 'yyyy-MM-dd');
        finalScheduledTime = format(showTakenDialog.scheduledTime, 'HH:mm:ss');
      }
      
      onMarkTaken(
        showTakenDialog.prescriptionId,
        showTakenDialog.prescriptionName,
        showTakenDialog.dosage,
        finalScheduledDate,
        finalScheduledTime,
        showTakenDialog.quantity,
        localDateTime.toISOString()
      );
      
      setShowTakenDialog(null);
      setActualDateTime('');
      setCorrectedScheduledDateTime('');
      setShowScheduleCorrection(false);
    }
  };

  const todaysDoses = getTodaysDoses();
  const nextDose = todaysDoses.find(dose => dose.status === 'pending');

  const getScheduleDescription = () => {
    return `${doseSchedules.length} scheduled ${doseSchedules.length === 1 ? 'time' : 'times'}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <MedicationImage 
              drugName={prescription.name}
              dosage={prescription.dosage}
              size="lg"
              className="w-14 h-14"
            />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{prescription.name}</h3>
            <p className="text-gray-600 mb-2">{prescription.dosage}</p>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                <Clock className="w-3 h-3 mr-1" />
                {getScheduleDescription()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-gray-400" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10">
              <button
                onClick={() => {
                  onViewHistory(prescription.id);
                  setShowMenu(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <History className="w-4 h-4 mr-3" />
                View History
              </button>
              <button
                onClick={() => {
                  onEdit(prescription);
                  setShowMenu(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Edit className="w-4 h-4 mr-3" />
                Edit Prescription
              </button>
              <button
                onClick={() => {
                  onDelete(prescription.id);
                  setShowMenu(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-3" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Next Dose Alert */}
      {nextDose && (
        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-blue-900">Next Dose</p>
              <p className="text-blue-700">
                {formatTime(nextDose.time)} • {getQuantityForTime(nextDose.time)} {getQuantityForTime(nextDose.time) === 1 ? 'unit' : 'units'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleMarkTaken(prescription.id, nextDose.time, getQuantityForTime(nextDose.time))}
                className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                title="Mark as taken"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => onMarkMissed(prescription.id, nextDose.time.toISOString())}
                className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                title="Mark as missed"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Today's Schedule */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">Today's Schedule</h4>
        {todaysDoses.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No doses scheduled for today</p>
        ) : (
          todaysDoses.map((dose, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-xl border-2 ${getStatusColor(dose.status)} transition-all`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white bg-opacity-50">
                  {getStatusIcon(dose.status)}
                </div>
                <div>
                  <div className="font-semibold">
                    {formatTime(dose.time)}
                  </div>
                  <div className="text-sm opacity-75">
                    {getQuantityForTime(dose.time)} {getQuantityForTime(dose.time) === 1 ? 'unit' : 'units'}
                  </div>
                  {dose.log?.taken_time && (
                    <div className="text-xs opacity-75 flex items-center">
                     Taken at {format(new Date(dose.log.taken_time), 'h:mm a')}
                      {dose.log.is_time_corrected && (
                        <span className="ml-1 text-orange-600">(corrected)</span>
                      )}
                      <button
                        onClick={() => {
                          setCorrectingLog(dose.log!.id);
                         setCorrectionTime(format(new Date(dose.log!.taken_time!), 'HH:mm'));
                        }}
                        className="ml-2 p-1 hover:bg-white hover:bg-opacity-50 rounded"
                        title="Correct time"
                      >
                        <Settings className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {dose.status === 'pending' && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleMarkTaken(prescription.id, dose.time, getQuantityForTime(dose.time))}
                    className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                    title="Mark as taken"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onMarkMissed(prescription.id, dose.time.toISOString())}
                    className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                    title="Mark as missed"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Time Correction Modal */}
              {correctingLog === dose.log?.id && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
                  <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h4 className="font-semibold mb-4">Correct Time Taken</h4>
                    <div className="flex items-center space-x-3 mb-4">
                      <input
                        type="time"
                        value={correctionTime}
                        onChange={(e) => setCorrectionTime(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleTimeCorrection(dose.log!.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => {
                          setCorrectingLog(null);
                          setCorrectionTime('');
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Schedule Display */}
      {doseSchedules.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
          <h5 className="text-sm font-semibold text-gray-700 mb-2">Dose Schedule</h5>
          <div className="space-y-2">
            {doseSchedules.map((schedule, index) => (
              <div key={index} className="text-sm text-gray-600">
                <span className="font-medium">{schedule.dose_time.substring(0, 5)}</span>
                <span className="mx-2">•</span>
                <span>{schedule.quantity} {schedule.quantity === 1 ? 'unit' : 'units'}</span>
                <span className="mx-2">•</span>
                <span>
                  {schedule.days_of_week.length === 7 
                    ? 'Daily' 
                    : schedule.days_of_week.map(d => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][d-1]).join(', ')
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {prescription.notes && (
        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
          <p className="text-sm text-gray-700">{prescription.notes}</p>
        </div>
      )}

      {/* Mark Taken Dialog */}
      {showTakenDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-lg w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Mark as Taken</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>{showTakenDialog.prescriptionName}</strong> - {showTakenDialog.dosage}
                </p>
                <p className="text-sm text-gray-600">
                  Scheduled: {format(showTakenDialog.scheduledTime, 'MMM d, yyyy h:mm a')}
                </p>
                <p className="text-sm text-gray-600">
                  Quantity: {showTakenDialog.quantity} {showTakenDialog.quantity === 1 ? 'unit' : 'units'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  When did you actually take it?
                </label>
                <input
                  type="datetime-local"
                  value={actualDateTime}
                  onChange={(e) => setActualDateTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can adjust this if you took it earlier than now
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const scheduledDateTime = format(showTakenDialog.scheduledTime, "yyyy-MM-dd'T'HH:mm");
                    setActualDateTime(scheduledDateTime);
                  }}
                  className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                >
                  Use Scheduled Time
                </button>
              </div>
              
              {/* Schedule Correction Toggle */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-gray-700">
                    Need to correct the scheduled time?
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowScheduleCorrection(!showScheduleCorrection);
                      if (!showScheduleCorrection) {
                        // Set default to original scheduled time
                        setCorrectedScheduledDateTime(format(showTakenDialog.scheduledTime, "yyyy-MM-dd'T'HH:mm"));
                      } else {
                        setCorrectedScheduledDateTime('');
                      }
                    }}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      showScheduleCorrection 
                        ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {showScheduleCorrection ? 'Cancel Correction' : 'Correct Schedule'}
                  </button>
                </div>
                
                {showScheduleCorrection && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      What was the intended scheduled time?
                    </label>
                    <input
                      type="datetime-local"
                      value={correctedScheduledDateTime}
                      onChange={(e) => setCorrectedScheduledDateTime(e.target.value)}
                      className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-orange-50"
                    />
                    <p className="text-xs text-orange-600 mt-1">
                      Use this when you took a dose after midnight that was scheduled for the previous day, or when the original schedule was incorrect
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={confirmMarkTaken}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Confirm Taken
              </button>
              <button
                onClick={() => {
                  setShowTakenDialog(null);
                  setActualDateTime('');
                  setCorrectedScheduledDateTime('');
                  setShowScheduleCorrection(false);
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};