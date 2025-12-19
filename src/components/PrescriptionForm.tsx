import React, { useState, useEffect } from 'react';
import { X, Clock, Pill, Calendar, Plus, Trash2 } from 'lucide-react';
import { Prescription, DoseSchedule } from '../lib/supabase';

interface PrescriptionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    prescriptionData: Omit<Prescription, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    scheduleData: Omit<DoseSchedule, 'id' | 'prescription_id' | 'created_at'>[]
  ) => void;
  prescription?: Prescription | null;
  doseSchedules?: DoseSchedule[];
}

export const PrescriptionForm: React.FC<PrescriptionFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  prescription,
  doseSchedules = [],
}) => {
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    notes: '',
    is_active: true,
    ndc_code: '',
    unit: 'tablet',
    units_per_dose: 1,
  });

  const [schedules, setSchedules] = useState<{
    dose_time: string;
    quantity: number;
    days_of_week: number[];
  }[]>([
    { dose_time: '08:00', quantity: 1, days_of_week: [1, 2, 3, 4, 5, 6, 7] }
  ]);

  const daysOfWeek = [
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
    { value: 7, label: 'Sun' },
  ];

  useEffect(() => {
    if (prescription) {
      setFormData({
        name: prescription.name,
        dosage: prescription.dosage,
        notes: prescription.notes,
        is_active: prescription.is_active,
        ndc_code: prescription.ndc_code || '',
        unit: prescription.unit || 'tablet',
        units_per_dose: prescription.units_per_dose || 1,
      });

      if (doseSchedules.length > 0) {
        setSchedules(doseSchedules.map(ds => ({
          dose_time: ds.dose_time.substring(0, 5),
          quantity: ds.quantity,
          days_of_week: ds.days_of_week,
        })));
      }
    } else {
      setFormData({
        name: '',
        dosage: '',
        notes: '',
        is_active: true,
        ndc_code: '',
        unit: 'tablet',
        units_per_dose: 1,
      });
      setSchedules([
        { dose_time: '08:00', quantity: 1, days_of_week: [1, 2, 3, 4, 5, 6, 7] }
      ]);
    }
  }, [prescription, doseSchedules]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const scheduleData = schedules.map(s => ({
      dose_time: s.dose_time + ':00',
      quantity: s.quantity,
      days_of_week: s.days_of_week,
      is_active: true,
    }));

    onSubmit(formData, scheduleData);
    onClose();
  };

  const addSchedule = () => {
    setSchedules([
      ...schedules,
      { dose_time: '12:00', quantity: 1, days_of_week: [1, 2, 3, 4, 5, 6, 7] }
    ]);
  };

  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const updateSchedule = (index: number, field: string, value: any) => {
    const updated = [...schedules];
    updated[index] = { ...updated[index], [field]: value };
    setSchedules(updated);
  };

  const toggleDay = (timeIndex: number, day: number) => {
    const updated = [...schedules];
    const currentDays = updated[timeIndex].days_of_week;
    
    if (currentDays.includes(day)) {
      updated[timeIndex].days_of_week = currentDays.filter(d => d !== day);
    } else {
      updated[timeIndex].days_of_week = [...currentDays, day].sort();
    }
    
    setSchedules(updated);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {prescription ? 'Edit Prescription' : 'Add New Prescription'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Medication Name */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
              <Pill className="w-4 h-4 mr-2" />
              Medication Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
              placeholder="e.g., Aspirin, Vitamins, Metformin"
              required
            />
          </div>

          {/* Dosage */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Dosage *
            </label>
            <input
              type="text"
              value={formData.dosage}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
              placeholder="100mg, 5ml, 2 tablets"
              required
            />
          </div>

          {/* NDC Code, Unit, and Units per Dose */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                NDC Code (Optional)
              </label>
              <input
                type="text"
                value={formData.ndc_code}
                onChange={(e) => setFormData({ ...formData, ndc_code: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                placeholder="12345-678-90"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Unit *
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                required
              >
                <option value="tablet">Tablet</option>
                <option value="capsule">Capsule</option>
                <option value="ml">Milliliter (ml)</option>
                <option value="mg">Milligram (mg)</option>
                <option value="drop">Drop</option>
                <option value="spray">Spray</option>
                <option value="patch">Patch</option>
                <option value="injection">Injection</option>
                <option value="inhaler">Inhaler</option>
                <option value="suppository">Suppository</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Units per Dose *
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.units_per_dose}
                onChange={(e) => setFormData({ ...formData, units_per_dose: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                required
              />
            </div>
          </div>

          {/* Dose Schedules */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-semibold text-gray-700">
                Dose Schedule *
              </label>
              <button
                type="button"
                onClick={addSchedule}
                className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Time
              </button>
            </div>

            <div className="space-y-4">
              {schedules.map((schedule, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-700">Dose {index + 1}</h4>
                    {schedules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSchedule(index)}
                        className="p-1 text-red-500 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">
                        Time
                      </label>
                      <input
                        type="time"
                        value={schedule.dose_time}
                        onChange={(e) => updateSchedule(index, 'dose_time', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={schedule.quantity}
                        onChange={(e) => updateSchedule(index, 'quantity', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">
                      Days of Week
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {daysOfWeek.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(index, day.value)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                            schedule.days_of_week.includes(day.value)
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
              rows={3}
              placeholder="Take with food, avoid alcohol, etc."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {prescription ? 'Update Prescription' : 'Add Prescription'}
          </button>
        </form>
      </div>
    </div>
  );
};