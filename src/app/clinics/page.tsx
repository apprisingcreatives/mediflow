'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Activity,
  Building2,
  MapPin,
  Users,
  Stethoscope,
  ArrowLeft,
  Search,
  BadgeCheck,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PatientChatbot } from '@/components/chatbot/patient-chatbot';
import { useGetClinics } from '@/hooks';

interface Clinic {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  logo_url: string | null;
  description: string | null;
  subscription_plan: string;
  clinic_services: { id: string; name: string; price: number }[];
  practitioners: { id: string; name: string; specialization: string }[];
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function ClinicsPage() {
  const [filteredClinics, setFilteredClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const { sendRequest, clinics } = useGetClinics();

  useEffect(() => {
    sendRequest();
  }, []);

  useEffect(() => {
    let result = clinics;

    if (searchQuery) {
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (selectedCity) {
      result = result.filter((c) => c.city === selectedCity);
    }

    setFilteredClinics(result as Clinic[]);
  }, [clinics, searchQuery, selectedCity]);

  const cities = Array.from(
    new Set(clinics.map((c) => c.city).filter(Boolean)),
  );

  return (
    <div className='min-h-screen bg-clinic-bg dark:bg-slate-900'>
      {/* Header */}
      <header className='bg-white dark:bg-slate-800 border-b border-clinic-navy/5 dark:border-white/5 sticky top-0 z-50'>
        <div className='container mx-auto px-4'>
          <div className='flex items-center justify-between h-16'>
            <Link href='/' className='flex items-center gap-2'>
              <div className='w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-clinic-navy to-clinic-teal'>
                <Activity className='w-5 h-5 text-white' />
              </div>
              <span className='text-xl font-display font-bold text-clinic-navy dark:text-white'>
                MediFlow
              </span>
            </Link>
            <div className='flex items-center gap-4'>
              <Button
                variant='ghost'
                asChild
                className='text-clinic-text/60 hover:text-clinic-navy'
              >
                <Link href='/'>
                  <ArrowLeft className='w-4 h-4 mr-2' />
                  Back to Home
                </Link>
              </Button>
              <Button
                className='bg-clinic-teal hover:bg-clinic-teal/90 text-white'
                asChild
              >
                <Link href='/clinic/register'>Register Your Clinic</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className='bg-gradient-to-br from-clinic-navy via-clinic-navy/95 to-clinic-navy py-16'>
        <div className='container mx-auto px-4 text-center'>
          <div className='inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6'>
            <Building2 className='w-4 h-4 text-clinic-teal' />
            <span className='text-sm font-medium text-white/80'>
              Partner Network
            </span>
          </div>
          <h1 className='font-display text-4xl md:text-5xl font-bold text-white mb-4'>
            Find Your{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-clinic-teal to-clinic-ai'>
              Healthcare Partner
            </span>
          </h1>
          <p className='text-lg text-white/70 max-w-2xl mx-auto mb-8'>
            Discover our network of AI-powered clinics committed to providing
            exceptional healthcare services.
          </p>

          {/* Search */}
          <div className='max-w-xl mx-auto'>
            <div className='relative'>
              <Search className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-clinic-text/40' />
              <Input
                placeholder='Search clinics by name, city, or specialty...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-12 h-14 text-lg bg-white border-0 shadow-lg'
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filters & Results */}
      <main className='container mx-auto px-4 py-12'>
        {/* City Filters */}
        {cities.length > 0 && (
          <div className='flex flex-wrap gap-2 mb-8'>
            <button
              onClick={() => setSelectedCity(null)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all',
                !selectedCity
                  ? 'bg-clinic-teal text-white'
                  : 'bg-white dark:bg-slate-800 text-clinic-text/70 dark:text-white/70 hover:bg-clinic-teal/10',
              )}
            >
              All Cities
            </button>
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city as string)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all',
                  selectedCity === city
                    ? 'bg-clinic-teal text-white'
                    : 'bg-white dark:bg-slate-800 text-clinic-text/70 dark:text-white/70 hover:bg-clinic-teal/10',
                )}
              >
                {city}
              </button>
            ))}
          </div>
        )}

        {/* Results Count */}
        <div className='flex items-center justify-between mb-6'>
          <p className='text-clinic-text/60 dark:text-white/60'>
            Showing{' '}
            <span className='font-semibold text-clinic-navy dark:text-white'>
              {filteredClinics.length}
            </span>{' '}
            {filteredClinics.length === 1 ? 'clinic' : 'clinics'}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className='h-64 bg-white dark:bg-slate-800 rounded-2xl animate-pulse'
              />
            ))}
          </div>
        )}

        {/* Clinics Grid */}
        {!isLoading && (
          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {filteredClinics.map((clinic, index) => (
              <div
                key={clinic.id}
                className='group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-glass border border-clinic-navy/5 dark:border-white/5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1'
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className='h-2 bg-gradient-to-r from-clinic-teal to-clinic-ai' />

                <div className='p-6 flex flex-col justify-between h-full'>
                  <div className='flex items-start justify-between mb-4'>
                    <div className='flex items-center gap-3'>
                      <div className='w-14 h-14 rounded-xl bg-gradient-to-br from-clinic-navy/10 to-clinic-teal/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
                        <Building2 className='w-7 h-7 text-clinic-navy dark:text-white' />
                      </div>
                      <div>
                        <h3 className='font-display font-bold text-lg text-clinic-navy dark:text-white group-hover:text-clinic-teal transition-colors'>
                          {clinic.name}
                        </h3>
                        {clinic.city && (
                          <p className='flex items-center gap-1 text-sm text-clinic-text/60 dark:text-white/60'>
                            <MapPin className='w-3 h-3' />
                            {clinic.city}
                          </p>
                        )}
                      </div>
                    </div>
                    {clinic.subscription_plan === 'professional' && (
                      <span className='flex items-center gap-1 text-xs font-medium px-2 py-1 bg-clinic-ai/10 text-clinic-ai rounded-full'>
                        <BadgeCheck className='w-3 h-3' />
                        Pro
                      </span>
                    )}
                  </div>

                  {clinic.description && (
                    <p className='text-sm text-clinic-text/70 dark:text-white/70 mb-4 line-clamp-2'>
                      {clinic.description}
                    </p>
                  )}

                  <div className='grid grid-cols-2 gap-3 mb-4'>
                    <div className='flex items-center gap-2 p-3 bg-clinic-bg dark:bg-slate-700/50 rounded-xl'>
                      <Stethoscope className='w-4 h-4 text-clinic-teal' />
                      <div>
                        <p className='text-xs text-clinic-text/50 dark:text-white/50'>
                          Services
                        </p>
                        <p className='font-semibold text-clinic-navy dark:text-white'>
                          {clinic.clinic_services?.length || 0}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-2 p-3 bg-clinic-bg dark:bg-slate-700/50 rounded-xl'>
                      <Users className='w-4 h-4 text-clinic-ai' />
                      <div>
                        <p className='text-xs text-clinic-text/50 dark:text-white/50'>
                          Doctors
                        </p>
                        <p className='font-semibold text-clinic-navy dark:text-white'>
                          {clinic.practitioners?.length || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {clinic.clinic_services &&
                    clinic.clinic_services.length > 0 && (
                      <div className='mb-4'>
                        <div className='flex flex-wrap gap-1'>
                          {clinic.clinic_services.slice(0, 2).map((service) => (
                            <span
                              key={service.id}
                              className='text-xs px-2 py-1 bg-clinic-teal/10 text-clinic-teal rounded-full'
                            >
                              {service.name}
                            </span>
                          ))}
                          {clinic.clinic_services.length > 2 && (
                            <span className='text-xs px-2 py-1 bg-clinic-navy/10 text-clinic-navy dark:bg-white/10 dark:text-white rounded-full'>
                              +{clinic.clinic_services.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                  <Link href={`/clinics/${clinic.id}`}>
                    <Button className='w-full bg-clinic-navy hover:bg-clinic-navy/90 text-white group/btn'>
                      View Clinic
                      <ChevronRight className='w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform' />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!isLoading && filteredClinics.length === 0 && (
          <div className='text-center py-16'>
            <Building2 className='w-16 h-16 text-clinic-navy/20 mx-auto mb-4' />
            <h3 className='text-xl font-display font-bold text-clinic-navy dark:text-white mb-2'>
              No clinics found
            </h3>
            <p className='text-clinic-text/60 dark:text-white/60 mb-6'>
              Try adjusting your search or filters
            </p>
            <Button
              onClick={() => {
                setSearchQuery('');
                setSelectedCity(null);
              }}
              variant='outline'
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* CTA */}
        <div className='mt-16 text-center'>
          <div className='bg-gradient-to-r from-clinic-navy to-clinic-navy/90 rounded-2xl p-12'>
            <h2 className='font-display text-3xl font-bold text-white mb-4'>
              Are You a Healthcare Provider?
            </h2>
            <p className='text-white/70 mb-8 max-w-xl mx-auto'>
              Join our network of AI-powered clinics and transform your patient
              experience with MediFlow.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Button
                size='lg'
                className='bg-clinic-teal hover:bg-clinic-teal/90 text-white'
                asChild
              >
                <Link href='/clinic/register'>Register Your Clinic</Link>
              </Button>
              <Button
                size='lg'
                variant='outline'
                className='border-white/30 text-gray-800 hover:bg-white/10'
                asChild
              >
                <Link href='/demo'>Request Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className='bg-white dark:bg-slate-800 border-t border-clinic-navy/5 dark:border-white/5 py-8'>
        <div className='container mx-auto px-4 text-center'>
          <p className='text-sm text-clinic-text/60 dark:text-white/60'>
            © 2026{' '}
            <Link href='/' className='text-clinic-teal hover:underline'>
              MediFlow
            </Link>{' '}
            • AI-Powered Healthcare Platform
          </p>
        </div>
      </footer>

      <PatientChatbot />
    </div>
  );
}
