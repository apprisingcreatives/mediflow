'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  GitBranch,
  Plus,
  MapPin,
  Phone,
  Users,
  MoreHorizontal,
  Pencil,
  Power,
  Trash2,
  Loader2,
  Building2,
  X,
  Star,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useClinicContext } from '../clinic-context';
import useBranches from '@/hooks/useBranches';
import type { Branch } from '@/types/database';

interface BranchFormData {
  name: string;
  address: string;
  city: string;
  phone: string;
}

const EMPTY_FORM: BranchFormData = { name: '', address: '', city: '', phone: '' };

export default function BranchesPage() {
  const params = useParams();
  const clinicId = params.clinicId as string;
  const { clinic } = useClinicContext();
  const {
    branches,
    loading,
    error,
    fetchBranches,
    createBranch,
    updateBranch,
    deleteBranch,
    getBranchPractitioners,
  } = useBranches(clinicId);

  const [showDialog, setShowDialog] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<BranchFormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [practitionerCounts, setPractitionerCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    if (branches.length === 0) return;
    const loadCounts = async () => {
      const counts: Record<string, number> = {};
      for (const branch of branches) {
        try {
          const pracs = await getBranchPractitioners(branch.id);
          counts[branch.id] = pracs.length;
        } catch {
          counts[branch.id] = 0;
        }
      }
      setPractitionerCounts(counts);
    };
    loadCounts();
  }, [branches]);

  const isEnterprise = clinic?.subscription_plan === 'enterprise';

  const openCreate = () => {
    setEditingBranch(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
    setShowDialog(true);
  };

  const openEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address ?? '',
      city: branch.city ?? '',
      phone: branch.phone ?? '',
    });
    setFormError(null);
    setShowDialog(true);
    setOpenMenu(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Branch name is required');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      if (editingBranch) {
        await updateBranch(editingBranch.id, formData);
      } else {
        await createBranch(formData);
      }
      setShowDialog(false);
    } catch (err: any) {
      setFormError(err.response?.data?.error ?? 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (branch: Branch) => {
    setOpenMenu(null);
    try {
      await updateBranch(branch.id, { is_active: !branch.is_active });
    } catch (err: any) {
      alert(err.response?.data?.error ?? 'Failed to update branch');
    }
  };

  const handleDelete = async (branch: Branch) => {
    setOpenMenu(null);
    if (!confirm(`Delete "${branch.name}"? This cannot be undone.`)) return;
    try {
      await deleteBranch(branch.id);
    } catch (err: any) {
      alert(err.response?.data?.error ?? 'Failed to delete branch');
    }
  };

  if (!isEnterprise) {
    return (
      <div className='flex flex-col items-center justify-center py-20 text-center'>
        <div className='w-16 h-16 rounded-2xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mb-4'>
          <Building2 className='w-8 h-8 text-yellow-600' />
        </div>
        <h2 className='text-xl font-display font-bold text-clinic-navy dark:text-white mb-2'>
          Multi-Branch Management
        </h2>
        <p className='text-clinic-text/60 dark:text-white/60 max-w-md mb-6'>
          Manage multiple clinic locations from one dashboard. Available on the Enterprise plan.
        </p>
        <Button
          className='bg-clinic-teal hover:bg-clinic-teal/90 text-white'
          onClick={() => window.location.href = `/clinic/${clinicId}/billing`}
        >
          Upgrade to Enterprise
        </Button>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-display font-bold text-clinic-navy dark:text-white'>
            Branches
          </h2>
          <p className='text-clinic-text/60 dark:text-white/60'>
            Manage your clinic locations
          </p>
        </div>
        <Button
          className='bg-clinic-teal hover:bg-clinic-teal/90 text-white'
          onClick={openCreate}
        >
          <Plus className='w-4 h-4 mr-2' />
          Add Branch
        </Button>
      </div>

      {error && (
        <div className='p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
          <p className='text-sm text-red-600 dark:text-red-400'>{error}</p>
        </div>
      )}

      {/* Branch cards */}
      {loading ? (
        <div className='flex justify-center py-12'>
          <Loader2 className='w-8 h-8 text-clinic-teal animate-spin' />
        </div>
      ) : (
        <div className='grid md:grid-cols-2 xl:grid-cols-3 gap-4'>
          {branches.map((branch) => (
            <div
              key={branch.id}
              className={cn(
                'relative bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border-2 transition-colors',
                branch.is_active
                  ? 'border-transparent hover:border-clinic-teal/20'
                  : 'border-transparent opacity-60',
              )}
            >
              {/* Header */}
              <div className='flex items-start justify-between mb-3'>
                <div className='flex items-center gap-2'>
                  <div className='w-10 h-10 rounded-xl bg-clinic-teal/10 flex items-center justify-center'>
                    <GitBranch className='w-5 h-5 text-clinic-teal' />
                  </div>
                  <div>
                    <h3 className='font-semibold text-clinic-navy dark:text-white flex items-center gap-1.5'>
                      {branch.name}
                      {branch.is_default && (
                        <Star className='w-3.5 h-3.5 text-yellow-500 fill-yellow-500' />
                      )}
                    </h3>
                    <Badge
                      variant={branch.is_active ? 'default' : 'secondary'}
                      className={cn(
                        'text-xs',
                        branch.is_active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-slate-100 text-slate-500',
                      )}
                    >
                      {branch.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                {/* Actions menu */}
                {!branch.is_default && (
                  <div className='relative'>
                    <button
                      onClick={() => setOpenMenu(openMenu === branch.id ? null : branch.id)}
                      className='p-1.5 rounded-lg hover:bg-clinic-navy/5 dark:hover:bg-white/5'
                    >
                      <MoreHorizontal className='w-4 h-4 text-clinic-text/50' />
                    </button>
                    {openMenu === branch.id && (
                      <div className='absolute right-0 top-8 w-40 bg-white dark:bg-slate-700 border border-clinic-navy/10 dark:border-white/10 rounded-lg shadow-lg py-1 z-10'>
                        <button
                          onClick={() => openEdit(branch)}
                          className='w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-clinic-navy/5 dark:hover:bg-white/5 text-clinic-navy dark:text-white'
                        >
                          <Pencil className='w-3.5 h-3.5' /> Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(branch)}
                          className='w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-clinic-navy/5 dark:hover:bg-white/5 text-clinic-navy dark:text-white'
                        >
                          <Power className='w-3.5 h-3.5' />
                          {branch.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(branch)}
                          className='w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600'
                        >
                          <Trash2 className='w-3.5 h-3.5' /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className='space-y-1.5 text-sm text-clinic-text/60 dark:text-white/60'>
                {branch.address && (
                  <div className='flex items-center gap-2'>
                    <MapPin className='w-3.5 h-3.5 flex-shrink-0' />
                    <span className='truncate'>{branch.address}{branch.city ? `, ${branch.city}` : ''}</span>
                  </div>
                )}
                {branch.phone && (
                  <div className='flex items-center gap-2'>
                    <Phone className='w-3.5 h-3.5 flex-shrink-0' />
                    <span>{branch.phone}</span>
                  </div>
                )}
                <div className='flex items-center gap-2'>
                  <Users className='w-3.5 h-3.5 flex-shrink-0' />
                  <span>{practitionerCounts[branch.id] ?? 0} practitioner(s)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      {showDialog && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-display font-bold text-clinic-navy dark:text-white'>
                {editingBranch ? 'Edit Branch' : 'Add Branch'}
              </h3>
              <button onClick={() => setShowDialog(false)} className='p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg'>
                <X className='w-5 h-5' />
              </button>
            </div>

            {formError && (
              <div className='mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2'>
                <AlertTriangle className='w-4 h-4 text-red-500 flex-shrink-0' />
                <p className='text-sm text-red-600 dark:text-red-400'>{formError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-clinic-navy dark:text-white mb-1'>
                  Branch Name *
                </label>
                <input
                  type='text'
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder='e.g., Downtown Branch'
                  className='w-full h-10 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-clinic-teal'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-clinic-navy dark:text-white mb-1'>
                  Address
                </label>
                <input
                  type='text'
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder='Street address'
                  className='w-full h-10 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-clinic-teal'
                />
              </div>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='block text-sm font-medium text-clinic-navy dark:text-white mb-1'>
                    City
                  </label>
                  <input
                    type='text'
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder='City'
                    className='w-full h-10 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-clinic-teal'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-clinic-navy dark:text-white mb-1'>
                    Phone
                  </label>
                  <input
                    type='text'
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder='Phone number'
                    className='w-full h-10 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-clinic-teal'
                  />
                </div>
              </div>
              <div className='flex gap-3 pt-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setShowDialog(false)}
                  className='flex-1'
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={submitting || !formData.name.trim()}
                  className='flex-1 bg-clinic-teal hover:bg-clinic-teal/90 text-white'
                >
                  {submitting ? (
                    <Loader2 className='w-4 h-4 animate-spin' />
                  ) : editingBranch ? (
                    'Save Changes'
                  ) : (
                    'Create Branch'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
