'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Clock,
  User,
  MoreVertical,
} from 'lucide-react';
import { useClinicContext } from '../layout';

export default function AppointmentsPage() {
  const { isTrialExpired } = useClinicContext();
  const [searchQuery, setSearchQuery] = useState('');

  // Mock appointments data
  const appointments = [
    {
      id: '1',
      time: '9:00 AM',
      patient: 'Maria Santos',
      service: 'General Consultation',
      status: 'completed',
      date: '2026-02-04',
    },
    {
      id: '2',
      time: '10:00 AM',
      patient: 'Juan Dela Cruz',
      service: 'Physical Exam',
      status: 'in-progress',
      date: '2026-02-04',
    },
    {
      id: '3',
      time: '11:00 AM',
      patient: 'Anna Reyes',
      service: 'Vaccination',
      status: 'upcoming',
      date: '2026-02-04',
    },
    {
      id: '4',
      time: '2:00 PM',
      patient: 'Michael Lim',
      service: 'Follow-up',
      status: 'upcoming',
      date: '2026-02-04',
    },
    {
      id: '5',
      time: '3:00 PM',
      patient: 'Sarah Garcia',
      service: 'Dental Checkup',
      status: 'upcoming',
      date: '2026-02-04',
    },
  ];

  if (isTrialExpired) {
    return (
      <div className='text-center py-12'>
        <p className='text-clinic-text/60'>
          This feature is locked. Please upgrade your plan.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-display font-bold text-clinic-navy dark:text-white'>
            Appointments
          </h2>
          <p className='text-clinic-text/60 dark:text-white/60'>
            Manage your clinic appointments
          </p>
        </div>
        <Button className='bg-clinic-teal hover:bg-clinic-teal/90 text-white'>
          <Plus className='w-4 h-4 mr-2' />
          New Appointment
        </Button>
      </div>

      {/* Filters */}
      <div className='flex items-center gap-4'>
        <div className='relative flex-1 max-w-md'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-clinic-text/40' />
          <Input
            placeholder='Search appointments...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-10 border-clinic-navy/10'
          />
        </div>
        <Button variant='outline' size='icon'>
          <Filter className='w-4 h-4' />
        </Button>
        <Button variant='outline' size='icon'>
          <Calendar className='w-4 h-4' />
        </Button>
      </div>

      {/* Appointments List */}
      <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-clinic-navy/5 dark:bg-white/5'>
              <tr>
                <th className='px-6 py-4 text-left text-xs font-medium text-clinic-text/60 dark:text-white/60 uppercase tracking-wider'>
                  Time
                </th>
                <th className='px-6 py-4 text-left text-xs font-medium text-clinic-text/60 dark:text-white/60 uppercase tracking-wider'>
                  Patient
                </th>
                <th className='px-6 py-4 text-left text-xs font-medium text-clinic-text/60 dark:text-white/60 uppercase tracking-wider'>
                  Service
                </th>
                <th className='px-6 py-4 text-left text-xs font-medium text-clinic-text/60 dark:text-white/60 uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-6 py-4 text-right text-xs font-medium text-clinic-text/60 dark:text-white/60 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-clinic-navy/10 dark:divide-white/10'>
              {appointments.map((apt) => (
                <tr
                  key={apt.id}
                  className='hover:bg-clinic-navy/5 dark:hover:bg-white/5 transition-colors'
                >
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex items-center gap-2'>
                      <Clock className='w-4 h-4 text-clinic-text/40' />
                      <span className='text-sm font-medium text-clinic-navy dark:text-white'>
                        {apt.time}
                      </span>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex items-center gap-3'>
                      <div className='w-8 h-8 rounded-full bg-clinic-teal/10 flex items-center justify-center'>
                        <User className='w-4 h-4 text-clinic-teal' />
                      </div>
                      <span className='text-sm text-clinic-navy dark:text-white'>
                        {apt.patient}
                      </span>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span className='text-sm text-clinic-text/70 dark:text-white/70'>
                      {apt.service}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        apt.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : apt.status === 'in-progress'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {apt.status}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-right'>
                    <Button variant='ghost' size='icon'>
                      <MoreVertical className='w-4 h-4' />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
