'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { Calendar, Clock, MapPin, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

interface SlotDay {
  date: string;
  times: string[];
}

interface RebookData {
  clinic: { id: string; name: string } | null;
  practitioner: { id: string; name: string; specialization: string | null } | null;
  service: { id: string; name: string; duration_minutes: number; price: number } | null;
  available_slots: SlotDay[];
}

export default function RebookPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [data, setData] = useState<RebookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    async function loadSlots() {
      try {
        const { data: res } = await axios.get(`/api/appointments/rebook?token=${token}`);
        setData(res);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Invalid or expired rebooking link.');
      } finally {
        setLoading(false);
      }
    }
    if (token) loadSlots();
  }, [token]);

  const handleRebook = async () => {
    if (!selectedSlot) return;
    try {
      setBooking(true);
      await axios.post('/api/appointments/rebook', {
        token,
        selected_slot: selectedSlot,
      });
      setBooked(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to rebook. The slot may no longer be available.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading available slots...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Unable to Rebook</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (booked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Appointment Booked!</h1>
          <p className="text-gray-600 mb-1">
            {selectedSlot?.date} at {selectedSlot?.time?.slice(0, 5)}
          </p>
          <p className="text-gray-500 text-sm">
            at {data?.clinic?.name} with {data?.practitioner?.name}
          </p>
          <p className="text-gray-400 text-sm mt-4">You can close this page.</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-PH', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Rebook Your Appointment</h1>
          <p className="text-gray-600 text-sm mb-4">Select a new time slot below.</p>

          <div className="flex flex-col gap-2 text-sm text-gray-600">
            {data?.clinic && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{data.clinic.name}</span>
              </div>
            )}
            {data?.practitioner && (
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 text-center text-xs">Dr</span>
                <span>
                  {data.practitioner.name}
                  {data.practitioner.specialization && ` — ${data.practitioner.specialization}`}
                </span>
              </div>
            )}
            {data?.service && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>
                  {data.service.name} ({data.service.duration_minutes} min)
                </span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {data?.available_slots && data.available_slots.length > 0 ? (
          <div className="space-y-4">
            {data.available_slots.map(day => (
              <div key={day.date} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  <h2 className="font-medium text-gray-900">{formatDate(day.date)}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {day.times.slice(0, 8).map(time => {
                    const timeStr = typeof time === 'string' ? time : (time as any).time_slot || '';
                    const isSelected =
                      selectedSlot?.date === day.date && selectedSlot?.time === timeStr;
                    return (
                      <button
                        key={timeStr}
                        onClick={() => setSelectedSlot({ date: day.date, time: timeStr })}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-teal-50 hover:text-teal-700'
                        }`}
                      >
                        {timeStr.slice(0, 5)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <button
              onClick={handleRebook}
              disabled={!selectedSlot || booking}
              className="w-full bg-teal-600 text-white py-3 rounded-xl font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {booking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Booking...
                </>
              ) : (
                'Confirm Rebooking'
              )}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-gray-600">No available slots found. Please contact the clinic directly.</p>
          </div>
        )}
      </div>
    </div>
  );
}
