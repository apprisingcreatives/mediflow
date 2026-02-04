'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileText,
  Plus,
  Search,
  Clock,
  DollarSign,
  MoreVertical,
  Edit,
  Trash2,
} from 'lucide-react';
import { useClinicContext } from '../layout';

export default function ServicesPage() {
  const { isTrialExpired } = useClinicContext();
  const [searchQuery, setSearchQuery] = useState('');

  // Mock services data
  const services = [
    {
      id: '1',
      name: 'General Consultation',
      description: 'Standard doctor consultation for general health concerns',
      duration: 30,
      price: 500,
      isActive: true,
    },
    {
      id: '2',
      name: 'Physical Exam',
      description: 'Comprehensive physical examination',
      duration: 60,
      price: 2500,
      isActive: true,
    },
    {
      id: '3',
      name: 'Vaccination',
      description: 'Various vaccines available',
      duration: 15,
      price: 800,
      isActive: true,
    },
    {
      id: '4',
      name: 'Follow-up Consultation',
      description: 'Follow-up appointment for existing patients',
      duration: 20,
      price: 300,
      isActive: true,
    },
    {
      id: '5',
      name: 'Lab Work',
      description: 'Blood tests and other laboratory services',
      duration: 45,
      price: 1500,
      isActive: false,
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
            Services
          </h2>
          <p className='text-clinic-text/60 dark:text-white/60'>
            Manage your clinic services and pricing
          </p>
        </div>
        <Button className='bg-clinic-teal hover:bg-clinic-teal/90 text-white'>
          <Plus className='w-4 h-4 mr-2' />
          Add Service
        </Button>
      </div>

      {/* Search */}
      <div className='relative max-w-md'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-clinic-text/40' />
        <Input
          placeholder='Search services...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='pl-10 border-clinic-navy/10'
        />
      </div>

      {/* Services List */}
      <div className='space-y-4'>
        {services.map((service) => (
          <div
            key={service.id}
            className={`bg-white dark:bg-slate-800 rounded-2xl shadow-glass p-6 ${
              !service.isActive ? 'opacity-60' : ''
            }`}
          >
            <div className='flex items-start justify-between'>
              <div className='flex items-start gap-4'>
                <div className='w-12 h-12 rounded-xl bg-clinic-ai/10 flex items-center justify-center'>
                  <FileText className='w-6 h-6 text-clinic-ai' />
                </div>
                <div>
                  <div className='flex items-center gap-2'>
                    <h3 className='font-semibold text-clinic-navy dark:text-white'>
                      {service.name}
                    </h3>
                    {!service.isActive && (
                      <span className='text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600'>
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className='text-sm text-clinic-text/60 dark:text-white/60 mt-1'>
                    {service.description}
                  </p>
                  <div className='flex items-center gap-4 mt-3'>
                    <div className='flex items-center gap-1 text-sm text-clinic-text/70 dark:text-white/70'>
                      <Clock className='w-4 h-4' />
                      {service.duration} min
                    </div>
                    <div className='flex items-center gap-1 text-sm font-medium text-clinic-teal'>
                      <DollarSign className='w-4 h-4' />₱
                      {service.price.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Button variant='ghost' size='icon'>
                  <Edit className='w-4 h-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='text-red-500 hover:text-red-600'
                >
                  <Trash2 className='w-4 h-4' />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
