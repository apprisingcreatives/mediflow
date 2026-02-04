'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { PublicClinicWithDetails } from '@/hooks/useGetClinics';
import { supabase } from '@/lib/supabase';

interface ClinicFormProps {
  clinic?: PublicClinicWithDetails | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

interface ClinicFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  subscription_plan: string;
  is_active: boolean;
  admin_email: string;
  admin_name: string;
}

export function ClinicForm({ clinic, onSuccess, onCancel }: ClinicFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<ClinicFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    subscription_plan: 'basic',
    is_active: true,
    admin_email: '',
    admin_name: '',
  });

  // Populate form if editing
  useEffect(() => {
    if (clinic) {
      setFormData({
        name: clinic.name || '',
        email: clinic.email || '',
        phone: clinic.phone || '',
        address: clinic.address || '',
        city: clinic.city || '',
        subscription_plan: clinic.subscription_plan || 'basic',
        is_active: clinic.is_active ?? true,
        admin_email: '', // Not needed for edit mode
        admin_name: '', // Not needed for edit mode
      });
    }
  }, [clinic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Get the current session token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session. Please log in again.');
      }

      const endpoint = clinic
        ? `/api/super-admin/clinics/${clinic.id}`
        : '/api/super-admin/clinics';
      
      const method = clinic ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${clinic ? 'update' : 'create'} clinic`);
      }

      // Show success message
      if (!clinic && data.message) {
        setSuccessMessage(data.message);
        // Wait a moment before closing to show the message
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        onSuccess();
      }
    } catch (err) {
      console.error('Clinic form error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof ClinicFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name" className="text-clinic-navy dark:text-white">
          Clinic Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Enter clinic name"
          required
          className="border-clinic-navy/10 dark:border-white/10"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-clinic-navy dark:text-white">
          Clinic Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="clinic@example.com"
          required
          className="border-clinic-navy/10 dark:border-white/10"
        />
      </div>

      {/* Admin fields - only show when creating new clinic */}
      {!clinic && (
        <>
          <div className="space-y-2 pt-4 border-t border-clinic-navy/10 dark:border-white/10">
            <Label className="text-clinic-navy dark:text-white font-semibold">
              Clinic Administrator
            </Label>
            <p className="text-xs text-clinic-text/60 dark:text-white/60">
              An invitation will be sent to this email to set up the clinic admin account.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin_name" className="text-clinic-navy dark:text-white">
              Admin Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="admin_name"
              value={formData.admin_name}
              onChange={(e) => handleChange('admin_name', e.target.value)}
              placeholder="John Doe"
              required
              className="border-clinic-navy/10 dark:border-white/10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin_email" className="text-clinic-navy dark:text-white">
              Admin Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="admin_email"
              type="email"
              value={formData.admin_email}
              onChange={(e) => handleChange('admin_email', e.target.value)}
              placeholder="admin@example.com"
              required
              className="border-clinic-navy/10 dark:border-white/10"
            />
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-clinic-navy dark:text-white">
            Phone
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+1 (555) 000-0000"
            className="border-clinic-navy/10 dark:border-white/10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subscription_plan" className="text-clinic-navy dark:text-white">
            Subscription Plan
          </Label>
          <Select
            value={formData.subscription_plan}
            onValueChange={(value) => handleChange('subscription_plan', value)}
          >
            <SelectTrigger className="border-clinic-navy/10 dark:border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address" className="text-clinic-navy dark:text-white">
          Address
        </Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="Street address"
          className="border-clinic-navy/10 dark:border-white/10"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="city" className="text-clinic-navy dark:text-white">
          City
        </Label>
        <Input
          id="city"
          value={formData.city}
          onChange={(e) => handleChange('city', e.target.value)}
          placeholder="City"
          className="border-clinic-navy/10 dark:border-white/10"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="is_active" className="text-clinic-navy dark:text-white">
          Status
        </Label>
        <Select
          value={formData.is_active ? 'active' : 'inactive'}
          onValueChange={(value) => handleChange('is_active', value === 'active')}
        >
          <SelectTrigger className="border-clinic-navy/10 dark:border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isLoading || !!successMessage}
          className="flex-1 bg-clinic-teal hover:bg-clinic-teal/90 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {clinic ? 'Updating...' : 'Creating...'}
            </>
          ) : successMessage ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Success! Closing...
            </>
          ) : (
            <>{clinic ? 'Update Clinic' : 'Create Clinic'}</>
          )}
        </Button>
      </div>
    </form>
  );
}
