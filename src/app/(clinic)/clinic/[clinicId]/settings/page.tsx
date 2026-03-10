'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Settings,
  Building2,
  Bell,
  Shield,
  Palette,
  Save,
  Loader2,
} from 'lucide-react';
import { useClinicContext } from '../layout';

export default function SettingsPage() {
  const { clinic, admin } = useClinicContext();
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [clinicName, setClinicName] = useState(clinic?.name || '');
  const [clinicEmail, setClinicEmail] = useState(clinic?.email || '');
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    appointmentReminders: true,
    marketingEmails: false,
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-display font-bold text-clinic-navy dark:text-white'>
          Settings
        </h2>
        <p className='text-clinic-text/60 dark:text-white/60'>
          Manage your clinic settings and preferences
        </p>
      </div>

      {/* Clinic Information */}
      <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='w-10 h-10 rounded-xl bg-clinic-teal/10 flex items-center justify-center'>
            <Building2 className='w-5 h-5 text-clinic-teal' />
          </div>
          <div>
            <h3 className='font-semibold text-clinic-navy dark:text-white'>
              Clinic Information
            </h3>
            <p className='text-sm text-clinic-text/60 dark:text-white/60'>
              Basic information about your clinic
            </p>
          </div>
        </div>

        <div className='grid md:grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='clinicName'>Clinic Name</Label>
            <Input
              id='clinicName'
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              className='border-clinic-navy/10'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='clinicEmail'>Clinic Email</Label>
            <Input
              id='clinicEmail'
              type='email'
              value={clinicEmail}
              onChange={(e) => setClinicEmail(e.target.value)}
              className='border-clinic-navy/10'
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center'>
            <Bell className='w-5 h-5 text-yellow-500' />
          </div>
          <div>
            <h3 className='font-semibold text-clinic-navy dark:text-white'>
              Notifications
            </h3>
            <p className='text-sm text-clinic-text/60 dark:text-white/60'>
              Configure how you receive notifications
            </p>
          </div>
        </div>

        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='font-medium text-clinic-navy dark:text-white'>
                Email Notifications
              </p>
              <p className='text-sm text-clinic-text/60 dark:text-white/60'>
                Receive notifications via email
              </p>
            </div>
            <Switch
              checked={notifications.email}
              onCheckedChange={(checked) =>
                setNotifications((prev) => ({ ...prev, email: checked }))
              }
            />
          </div>

          <div className='flex items-center justify-between'>
            <div>
              <p className='font-medium text-clinic-navy dark:text-white'>
                SMS Notifications
              </p>
              <p className='text-sm text-clinic-text/60 dark:text-white/60'>
                Receive notifications via SMS
              </p>
            </div>
            <Switch
              checked={notifications.sms}
              onCheckedChange={(checked) =>
                setNotifications((prev) => ({ ...prev, sms: checked }))
              }
            />
          </div>

          <div className='flex items-center justify-between'>
            <div>
              <p className='font-medium text-clinic-navy dark:text-white'>
                Appointment Reminders
              </p>
              <p className='text-sm text-clinic-text/60 dark:text-white/60'>
                Send reminders to patients before appointments
              </p>
            </div>
            <Switch
              checked={notifications.appointmentReminders}
              onCheckedChange={(checked) =>
                setNotifications((prev) => ({
                  ...prev,
                  appointmentReminders: checked,
                }))
              }
            />
          </div>

          <div className='flex items-center justify-between'>
            <div>
              <p className='font-medium text-clinic-navy dark:text-white'>
                Marketing Emails
              </p>
              <p className='text-sm text-clinic-text/60 dark:text-white/60'>
                Receive updates about new features and promotions
              </p>
            </div>
            <Switch
              checked={notifications.marketingEmails}
              onCheckedChange={(checked) =>
                setNotifications((prev) => ({
                  ...prev,
                  marketingEmails: checked,
                }))
              }
            />
          </div>
        </div>
      </div>

      {/* Security */}
      <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center'>
            <Shield className='w-5 h-5 text-red-500' />
          </div>
          <div>
            <h3 className='font-semibold text-clinic-navy dark:text-white'>
              Security
            </h3>
            <p className='text-sm text-clinic-text/60 dark:text-white/60'>
              Manage your account security settings
            </p>
          </div>
        </div>

        <div className='space-y-4'>
          <Button variant='outline'>Change Password</Button>
          <Button variant='outline'>Enable Two-Factor Authentication</Button>
        </div>
      </div>

      {/* Save Button */}
      <div className='flex justify-end'>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className='bg-clinic-teal hover:bg-clinic-teal/90 text-white'
        >
          {isSaving ? (
            <>
              <Loader2 className='w-4 h-4 mr-2 animate-spin' />
              Saving...
            </>
          ) : (
            <>
              <Save className='w-4 h-4 mr-2' />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
