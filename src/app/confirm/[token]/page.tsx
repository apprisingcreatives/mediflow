'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { CheckCircle, Loader2, AlertCircle, Calendar, Clock, MapPin } from 'lucide-react';

interface AppointmentInfo {
  id: string;
  date: string;
  time: string;
  status: string;
  clinic: string | null;
  practitioner: string | null;
}

export default function ConfirmPage() {
  const { token } = useParams<{ token: string }>();
  const [appointment, setAppointment] = useState<AppointmentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await axios.get(`/api/appointments/confirm?token=${token}`);
        setAppointment(data.appointment);
        if (data.appointment.status === 'confirmed') {
          setConfirmed(true);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Invalid or expired link.');
      } finally {
        setLoading(false);
      }
    }
    if (token) load();
  }, [token]);

  const handleConfirm = async () => {
    try {
      setConfirming(true);
      const { data } = await axios.post('/api/appointments/confirm', { token });
      setConfirmed(true);
      if (data.already_confirmed) {
        setConfirmed(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to confirm appointment.');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading appointment...</p>
        </div>
      </div>
    );
  }

  if (error && !appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Unable to Confirm</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Appointment Confirmed!</h1>
          {appointment && (
            <>
              <p className="text-gray-600 mb-1">
                {appointment.date} at {appointment.time?.slice(0, 5)}
              </p>
              <p className="text-gray-500 text-sm">
                {appointment.clinic && `at ${appointment.clinic}`}
                {appointment.practitioner && ` with ${appointment.practitioner}`}
              </p>
            </>
          )}
          <p className="text-gray-400 text-sm mt-4">You can close this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Confirm Your Appointment</h1>
          <p className="text-gray-600 text-sm mb-6">Tap the button below to confirm.</p>

          {appointment && (
            <div className="flex flex-col gap-2 text-sm text-gray-600 mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{appointment.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{appointment.time?.slice(0, 5)}</span>
              </div>
              {appointment.clinic && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{appointment.clinic}</span>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {confirming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Confirm Appointment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
