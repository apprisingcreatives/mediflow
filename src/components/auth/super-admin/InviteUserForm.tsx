'use client';

import { useState } from 'react';
import { useInviteUser } from '@/hooks/useInviteUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, User, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface InviteUserFormProps {
  onSuccess?: () => void;
}

export function InviteUserForm({ onSuccess }: InviteUserFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const { inviteUser, loading, error, success, resetState } = useInviteUser();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await inviteUser({ email, name });
      setEmail('');
      setName('');
      
      // Call onSuccess after a brief delay to show success message
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  return (
    <form onSubmit={handleInvite} className="space-y-5">
      <div className="space-y-2">
        <Label 
          htmlFor="name" 
          className="text-sm font-medium text-clinic-navy dark:text-white"
        >
          Full Name
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clinic-text/40" />
          <Input
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              resetState();
            }}
            placeholder="Enter admin name"
            className="pl-10 h-11 border-clinic-navy/10 dark:border-white/10 focus:border-clinic-teal"
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label 
          htmlFor="email" 
          className="text-sm font-medium text-clinic-navy dark:text-white"
        >
          Email Address
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clinic-text/40" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              resetState();
            }}
            placeholder="admin@example.com"
            className="pl-10 h-11 border-clinic-navy/10 dark:border-white/10 focus:border-clinic-teal"
            required
            disabled={loading}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-green-600 dark:text-green-400">
            Invitation sent successfully! The user will receive an email to set up their account.
          </p>
        </div>
      )}

      <Button 
        type="submit" 
        disabled={loading}
        className="w-full h-11 bg-clinic-teal hover:bg-clinic-teal/90 text-white font-medium"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Sending Invitation...
          </>
        ) : (
          <>
            <Mail className="w-4 h-4 mr-2" />
            Send Invitation
          </>
        )}
      </Button>
    </form>
  );
}