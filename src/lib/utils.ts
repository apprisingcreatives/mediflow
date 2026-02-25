import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatTimeToAMPM = (timeStr: string | undefined) => {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  const hh = parseInt(parts[0] ?? '0', 10);
  const mm = parts[1] ?? '00';
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;
  const ampm = hh >= 12 ? 'PM' : 'AM';
  return `${hour12}:${mm} ${ampm}`;
};
