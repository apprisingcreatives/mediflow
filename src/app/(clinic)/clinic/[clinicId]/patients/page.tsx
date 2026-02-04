'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  MoreVertical,
} from 'lucide-react';
import { useClinicContext } from '../layout';

export default function PatientsPage() {
  const { isTrialExpired } = useClinicContext();
  const [searchQuery, setSearchQuery] = useState('');

  // Mock patients data
  const patients = [
    {
      id: '1',
      name: 'Maria Santos',
      email: 'maria.santos@email.com',
      phone: '+63 912 345 6789',
      lastVisit: '2026-02-01',
      totalVisits: 12,
    },
    {
      id: '2',
      name: 'Juan Dela Cruz',
      email: 'juan.delacruz@email.com',
      phone: '+63 923 456 7890',
      lastVisit: '2026-01-28',
      totalVisits: 8,
    },
    {
      id: '3',
      name: 'Anna Reyes',
      email: 'anna.reyes@email.com',
      phone: '+63 934 567 8901',
      lastVisit: '2026-01-25',
      totalVisits: 5,
    },
    {
      id: '4',
      name: 'Michael Lim',
      email: 'michael.lim@email.com',
      phone: '+63 945 678 9012',
      lastVisit: '2026-01-20',
      totalVisits: 3,
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
            Patients
          </h2>
          <p className='text-clinic-text/60 dark:text-white/60'>
            Manage your patient records
          </p>
        </div>
        <Button className='bg-clinic-teal hover:bg-clinic-teal/90 text-white'>
          <Plus className='w-4 h-4 mr-2' />
          Add Patient
        </Button>
      </div>

      {/* Filters */}
      <div className='flex items-center gap-4'>
        <div className='relative flex-1 max-w-md'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-clinic-text/40' />
          <Input
            placeholder='Search patients...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-10 border-clinic-navy/10'
          />
        </div>
        <Button variant='outline' size='icon'>
          <Filter className='w-4 h-4' />
        </Button>
      </div>

      {/* Patients Grid */}
      <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {patients.map((patient) => (
          <div
            key={patient.id}
            className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6 hover:shadow-lg transition-shadow'
          >
            <div className='flex items-start justify-between mb-4'>
              <div className='flex items-center gap-3'>
                <div className='w-12 h-12 rounded-full bg-clinic-teal/10 flex items-center justify-center'>
                  <Users className='w-6 h-6 text-clinic-teal' />
                </div>
                <div>
                  <h3 className='font-semibold text-clinic-navy dark:text-white'>
                    {patient.name}
                  </h3>
                  <p className='text-xs text-clinic-text/60 dark:text-white/60'>
                    {patient.totalVisits} visits
                  </p>
                </div>
              </div>
              <Button variant='ghost' size='icon'>
                <MoreVertical className='w-4 h-4' />
              </Button>
            </div>

            <div className='space-y-2'>
              <div className='flex items-center gap-2 text-sm text-clinic-text/70 dark:text-white/70'>
                <Mail className='w-4 h-4' />
                {patient.email}
              </div>
              <div className='flex items-center gap-2 text-sm text-clinic-text/70 dark:text-white/70'>
                <Phone className='w-4 h-4' />
                {patient.phone}
              </div>
            </div>

            <div className='mt-4 pt-4 border-t border-clinic-navy/10 dark:border-white/10'>
              <p className='text-xs text-clinic-text/50 dark:text-white/50'>
                Last visit: {new Date(patient.lastVisit).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
