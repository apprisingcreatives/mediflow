import { Portal } from '@/types/auth';

export const getPortalFromPath = (pathname: string): Portal => {
  if (pathname.includes('super-admin')) return 'super-admin';
  if (pathname.includes('clinic')) return 'clinic';
  return 'patient';
};
