import React, { useState } from 'react';
import { Appointment } from '@/types/patient';
import { PRIMARY_BUTTON } from '@/styles/buttonStyles';

interface AppointmentManagementProps {
  patientId: string;
  appointments: Appointment[];
  canEdit: boolean;
  onSave?: () => Promise<void>;
}

const AppointmentManagement: React.FC<AppointmentManagementProps> = ({
  patientId,
  appointments,
  canEdit,
  onSave
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for new/editing appointment
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    type: '',
    provider: '',
    status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled'
  });

  const appointmentTypes = [
    'Check-up',
    'Cleaning',
    'Consultation',
    'Follow-up',
    'Emergency',
    'Root Canal',
    'Filling',
    'Extraction',
    'Crown/Bridge',
    'Orthodontics',
    'X-Ray',
    'Other'
  ];

  const handleStartAdd = () => {
    setFormData({
      date: '',
      time: '',
      type: '',
      provider: '',
      status: 'scheduled'
    });
    setIsAdding(true);
    setIsEditing(false);
    setEditingAppointment(null);
    setError(null);
  };

  const handleStartEdit = (appointment: Appointment) => {
    setFormData({
      date: appointment.date,
      time: appointment.time,
      type: appointment.type,
      provider: appointment.provider || '',
      status: appointment.status
    });
    setEditingAppointment(appointment);
    setIsEditing(true);
    setIsAdding(false);
    setError(null);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setIsEditing(false);
    setEditingAppointment(null);
    setError(null);
  };

  const handleSaveNew = async () => {
    if (!formData.date || !formData.time || !formData.type) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/patients/${patientId}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create appointment');
      }

      setIsAdding(false);
      if (onSave) await onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create appointment');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingAppointment || !formData.date || !formData.time || !formData.type) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/patients/${patientId}/appointments/${(editingAppointment as any).id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update appointment');
      }

      setIsEditing(false);
      setEditingAppointment(null);
      if (onSave) await onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update appointment');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (appointmentId: string) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/patients/${patientId}/appointments/${appointmentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete appointment');
      }

      if (onSave) await onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete appointment');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-status-green/20 text-status-green';
      case 'scheduled':
        return 'bg-blue-500/20 text-blue-600';
      case 'cancelled':
        return 'bg-status-red/20 text-status-red';
      default:
        return 'bg-slate-500/20 text-slate-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      {canEdit && !isAdding && !isEditing && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Appointment Information
          </h3>
          <button
            onClick={handleStartAdd}
            className={PRIMARY_BUTTON}
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Add Appointment</span>
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-status-red/10 border border-status-red/20 text-status-red px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {(isAdding || isEditing) && (
        <div className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 space-y-4">
          <h4 className="text-md font-semibold text-slate-900 dark:text-white mb-4">
            {isAdding ? 'Add New Appointment' : 'Edit Appointment'}
          </h4>

          <div className="grid grid-cols-2 gap-4">
            {/* Appointment Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Appointment Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {/* Appointment Time */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Appointment Time
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {/* Appointment Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Appointment Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">Select Type</option>
                {appointmentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Provider Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Provider Name
              </label>
              <input
                type="text"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                placeholder="Dr. Smith"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>

            {/* Status */}
            {isEditing && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={isAdding ? handleSaveNew : handleSaveEdit}
              disabled={isSaving}
              className={`${PRIMARY_BUTTON} disabled:opacity-50`}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Appointments List */}
      {!isAdding && !isEditing && (
        appointments && appointments.length > 0 ? (
          <div className="space-y-3">
            {appointments.map((appointment) => (
              <div
                key={(appointment as any).id || `${appointment.date}-${appointment.time}`}
                className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {appointment.date} at {appointment.time}
                      </p>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(appointment.status)}`}>
                        {appointment.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Type: {appointment.type}
                    </p>
                    {appointment.provider && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Provider: {appointment.provider}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {canEdit && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStartEdit(appointment)}
                        className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
                        title="Edit appointment"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete((appointment as any).id)}
                        className="p-2 text-status-red hover:bg-status-red/10 rounded-md"
                        title="Delete appointment"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-12 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No appointments scheduled
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default AppointmentManagement;
