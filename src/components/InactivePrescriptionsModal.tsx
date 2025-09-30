import React from 'react';
import { format } from 'date-fns';
import { X, RotateCcw, AlertCircle, Calendar, Pill } from 'lucide-react';
import { Prescription } from '../lib/supabase';
import { MedicationImage } from './MedicationImage';

interface InactivePrescriptionsModalProps {
  inactivePrescriptions: Prescription[];
  onClose: () => void;
  onReactivate: (id: string) => void;
}

export const InactivePrescriptionsModal: React.FC<InactivePrescriptionsModalProps> = ({
  inactivePrescriptions,
  onClose,
  onReactivate,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Inactive Prescriptions</h2>
              <p className="text-sm text-gray-600">Reactivate cancelled prescriptions and their schedules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="p-4 bg-orange-50 border-b border-orange-200">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
            <div className="text-sm text-orange-800">
              <strong>Note:</strong> Reactivating a prescription will restore it and all its dose schedules. You can continue tracking from where you left off.
            </div>
          </div>
        </div>

        {/* Inactive Prescriptions List */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {inactivePrescriptions.length === 0 ? (
            <div className="text-center py-12">
              <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Inactive Prescriptions</h3>
              <p className="text-gray-600">
                All your prescriptions are currently active. Cancelled prescriptions will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {inactivePrescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center space-x-3 mb-3">
                        <MedicationImage 
                          drugName={prescription.name}
                          dosage={prescription.dosage}
                          size="md"
                          className="w-12 h-12 opacity-60"
                        />
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">{prescription.name}</h4>
                          <p className="text-gray-600">{prescription.dosage}</p>
                          <div className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full mt-1">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Inactive
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-white p-3 rounded-lg">
                          <div className="flex items-center space-x-2 mb-1">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-semibold text-gray-700">Created</span>
                          </div>
                          <div className="text-sm text-gray-900">
                            {format(new Date(prescription.created_at), 'MMM d, yyyy h:mm a')}
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-lg">
                          <div className="flex items-center space-x-2 mb-1">
                            <AlertCircle className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-semibold text-gray-700">Cancelled</span>
                          </div>
                          <div className="text-sm text-gray-900">
                            {format(new Date(prescription.updated_at), 'MMM d, yyyy h:mm a')}
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      {prescription.notes && (
                        <div className="p-3 bg-blue-50 rounded-lg mb-4">
                          <span className="text-sm text-gray-600">Notes: </span>
                          <span className="text-sm text-gray-900">{prescription.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Reactivate Button */}
                    <div className="ml-4">
                      <button
                        onClick={() => onReactivate(prescription.id)}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
                        title="Reactivate this prescription"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Reactivate</span>
                      </button>
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
              {inactivePrescriptions.length} inactive {inactivePrescriptions.length === 1 ? 'prescription' : 'prescriptions'}
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