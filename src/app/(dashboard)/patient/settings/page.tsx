'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PatientSettingsPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatient = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('patients')
        .select('first_name, last_name, email, phone')
        .eq('auth_user_id', user.id)
        .single();

      if (data) {
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
      }
      setLoading(false);
    };

    fetchPatient();
  }, []);

  if (loading) {
    return (
      <div className='container mx-auto px-4 py-8 max-w-2xl'>
        <div className='animate-pulse space-y-4'>
          <div className='h-8 bg-clinic-navy/10 rounded w-32' />
          <div className='h-48 bg-clinic-navy/10 rounded-2xl' />
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8 max-w-2xl'>
      <Link
        href='/patient'
        className='inline-flex items-center gap-2 text-sm text-clinic-text/60 dark:text-white/60 hover:text-clinic-navy dark:hover:text-white transition-colors mb-6'
      >
        <ArrowLeft className='w-4 h-4' />
        Back to Dashboard
      </Link>

      <h2 className='font-display text-xl font-bold text-clinic-navy dark:text-white mb-6'>
        Settings
      </h2>

      {/* Profile Section */}
      <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6 mb-6'>
        <h3 className='font-display font-semibold text-clinic-navy dark:text-white mb-4'>
          Profile
        </h3>

        <div className='space-y-4'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-clinic-text/70 dark:text-white/70 mb-1'>
                First Name
              </label>
              <Input
                value={firstName}
                disabled
                className='border-clinic-navy/10 dark:border-white/10 bg-clinic-navy/5 dark:bg-white/5'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-clinic-text/70 dark:text-white/70 mb-1'>
                Last Name
              </label>
              <Input
                value={lastName}
                disabled
                className='border-clinic-navy/10 dark:border-white/10 bg-clinic-navy/5 dark:bg-white/5'
              />
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-clinic-text/70 dark:text-white/70 mb-1'>
              Email
            </label>
            <Input
              value={email}
              disabled
              className='border-clinic-navy/10 dark:border-white/10 bg-clinic-navy/5 dark:bg-white/5'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-clinic-text/70 dark:text-white/70 mb-1'>
              Phone
            </label>
            <Input
              value={phone || 'Not set'}
              disabled
              className='border-clinic-navy/10 dark:border-white/10 bg-clinic-navy/5 dark:bg-white/5'
            />
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
        <h3 className='font-display font-semibold text-clinic-navy dark:text-white mb-4'>
          Security
        </h3>
        <Link href='/patient/settings/change-password'>
          <Button variant='outline' className='border-clinic-navy/10 dark:border-white/10'>
            <KeyRound className='w-4 h-4 mr-2' />
            Change Password
          </Button>
        </Link>
      </div>
    </div>
  );
}
