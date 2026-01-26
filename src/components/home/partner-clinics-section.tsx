'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Building2,
  MapPin,
  Users,
  Star,
  ArrowRight,
  ChevronRight,
  Stethoscope,
  Clock,
  BadgeCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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

const fallbackClinics: Clinic[] = [
  {
    id: 'demo-clinic-1',
    name: 'Downtown Medical Center',
    email: 'contact@downtownmed.com',
    phone: '(555) 123-4567',
    address: '123 Main Street',
    city: 'San Francisco',
    logo_url: null,
    description:
      'A comprehensive healthcare facility offering primary care, specialist consultations, and advanced diagnostic services.',
    subscription_plan: 'professional',
    clinic_services: [
      { id: 's1', name: 'General Checkup', price: 150 },
      { id: 's2', name: 'Cardiology', price: 250 },
      { id: 's3', name: 'Pediatrics', price: 125 },
    ],
    practitioners: [
      {
        id: 'p1',
        name: 'Dr. Sarah Johnson',
        specialization: 'Internal Medicine',
      },
      { id: 'p2', name: 'Dr. Michael Chen', specialization: 'Cardiology' },
    ],
  },
  {
    id: 'demo-clinic-2',
    name: 'Wellness Family Clinic',
    email: 'info@wellnessfamily.com',
    phone: '(555) 987-6543',
    address: '456 Oak Avenue',
    city: 'Los Angeles',
    logo_url: null,
    description:
      'Family-oriented healthcare with a focus on preventive medicine and holistic wellness approaches.',
    subscription_plan: 'basic',
    clinic_services: [
      { id: 's4', name: 'Family Medicine', price: 120 },
      { id: 's5', name: 'Vaccinations', price: 50 },
    ],
    practitioners: [
      { id: 'p3', name: 'Dr. Emily Davis', specialization: 'Family Medicine' },
    ],
  },
  {
    id: 'demo-clinic-3',
    name: 'Advanced Specialty Care',
    email: 'care@advancedspecialty.com',
    phone: '(555) 456-7890',
    address: '789 Medical Plaza',
    city: 'New York',
    logo_url: null,
    description:
      'State-of-the-art specialty care featuring cutting-edge technology and expert specialists.',
    subscription_plan: 'professional',
    clinic_services: [
      { id: 's6', name: 'Neurology', price: 300 },
      { id: 's7', name: 'Orthopedics', price: 275 },
      { id: 's8', name: 'Dermatology', price: 175 },
      { id: 's9', name: 'Oncology', price: 350 },
    ],
    practitioners: [
      { id: 'p4', name: 'Dr. James Wilson', specialization: 'Neurology' },
      { id: 'p5', name: 'Dr. Lisa Park', specialization: 'Orthopedics' },
      { id: 'p6', name: 'Dr. Robert Brown', specialization: 'Oncology' },
    ],
  },
];

export function PartnerClinicsSection() {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const sectionRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hasFetched = useRef(false);

  const {
    clinics,
    loading: isLoading,
    error,
    sendRequest: fetchClinics,
  } = useGetClinics();

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetchClinics();
  }, []);

  useEffect(() => {
    if (clinics.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = itemRefs.current.findIndex(
              (ref) => ref === entry.target,
            );
            if (index !== -1) {
              setVisibleItems((prev) => {
                const newSet = new Set(prev);
                newSet.add(index);
                return newSet;
              });
            }
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
    );

    itemRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [clinics]);

  if (isLoading) {
    return (
      <section className='py-20 bg-white dark:bg-slate-800'>
        <div className='container mx-auto px-4'>
          <div className='text-center mb-12'>
            <div className='h-8 w-48 bg-clinic-navy/10 dark:bg-white/10 rounded-lg mx-auto mb-4 animate-pulse' />
            <div className='h-6 w-96 bg-clinic-navy/10 dark:bg-white/10 rounded-lg mx-auto animate-pulse' />
          </div>
          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className='h-64 bg-clinic-navy/5 dark:bg-white/5 rounded-2xl animate-pulse'
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (clinics.length === 0) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      id='partner-clinics'
      className='py-20 bg-gradient-to-b from-white to-clinic-bg dark:from-slate-800 dark:to-slate-900 overflow-hidden'
    >
      <div className='container mx-auto px-4'>
        {/* Section Header */}
        <div className='text-center mb-16'>
          <div className='inline-flex items-center gap-2 px-4 py-2 bg-clinic-teal/10 rounded-full mb-6'>
            <Building2 className='w-4 h-4 text-clinic-teal' />
            <span className='text-sm font-medium text-clinic-teal'>
              Trusted Healthcare Partners
            </span>
          </div>
          <h2 className='font-display text-4xl md:text-5xl font-bold text-clinic-navy dark:text-white mb-4'>
            Our Partner{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-clinic-teal to-clinic-ai'>
              Clinics
            </span>
          </h2>
          <p className='text-lg text-clinic-text/70 dark:text-white/70 max-w-2xl mx-auto'>
            Discover our network of certified healthcare providers committed to
            delivering exceptional patient care with AI-powered assistance.
          </p>
        </div>

        {/* Clinics Grid */}
        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {clinics.map((clinic, index) => (
            <div
              key={clinic.id}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              className={cn(
                'group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-glass border border-clinic-navy/5 dark:border-white/5 transition-all duration-700 transform',
                visibleItems.has(index)
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-10',
              )}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className='flex flex-col h-full'>
                {/* Card Gradient Top */}
                <div className='h-2 bg-gradient-to-r from-clinic-teal to-clinic-ai' />

                <div className='p-6 flex flex-col justify-between h-full'>
                  <>
                    {/* Clinic Header */}
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

                    {/* Description */}
                    {clinic.description && (
                      <p className='text-sm text-clinic-text/70 dark:text-white/70 mb-4 line-clamp-2'>
                        {clinic.description}
                      </p>
                    )}

                    {/* Stats */}
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

                    {/* Services Preview */}
                    {clinic.clinic_services &&
                      clinic.clinic_services.length > 0 && (
                        <div className='mb-4'>
                          <p className='text-xs font-medium text-clinic-text/50 dark:text-white/50 mb-2'>
                            Popular Services:
                          </p>
                          <div className='flex flex-wrap gap-1'>
                            {clinic.clinic_services
                              .slice(0, 3)
                              .map((service) => (
                                <span
                                  key={service.id}
                                  className='text-xs px-2 py-1 bg-clinic-teal/10 text-clinic-teal rounded-full'
                                >
                                  {service.name}
                                </span>
                              ))}
                            {clinic.clinic_services.length > 3 && (
                              <span className='text-xs px-2 py-1 bg-clinic-navy/10 text-clinic-navy dark:bg-white/10 dark:text-white rounded-full'>
                                +{clinic.clinic_services.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                  </>
                  {/* CTA */}
                  <Link
                    href={`/clinics/${generateSlug(clinic.name)}-${clinic.id.slice(0, 8)}`}
                  >
                    <Button className='w-full bg-clinic-navy hover:bg-clinic-navy/90 text-white group/btn'>
                      View Clinic
                      <ChevronRight className='w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform' />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Hover Glow Effect */}
              <div className='absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-clinic-teal/5 via-transparent to-clinic-ai/5' />
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className='text-center mt-12'>
          <p className='text-clinic-text/60 dark:text-white/60 mb-4'>
            Are you a healthcare provider?
          </p>
          <Button
            variant='outline'
            className='border-clinic-teal text-clinic-teal hover:bg-clinic-teal hover:text-white'
            asChild
          >
            <Link href='/clinic/register'>
              Register Your Clinic
              <ArrowRight className='w-4 h-4 ml-2' />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
