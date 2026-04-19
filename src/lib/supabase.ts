import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'student' | 'operator' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  venue: string;
  event_date: string;
  capacity: number;
  registered: number;
  image_url: string;
  tags: string[];
  organizer_id: string;
  created_at: string;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  location: string;
  amenities: string[];
  available: boolean;
}

export interface Booking {
  id: string;
  room_id: string;
  user_id: string;
  date: string;
  time_slot: string;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  created_at: string;
}

export interface VolunteerEvent {
  id: string;
  event_id: string;
  title: string;
  description: string;
  application_open: string;
  application_close: string;
  spots: number;
}

export interface VolunteerApplication {
  id: string;
  volunteer_event_id: string;
  user_id: string;
  full_name: string;
  email: string;
  motivation: string;
  skills: string[];
  experience: string;
  status: 'pending' | 'approved' | 'rejected';
  applied_at: string;
}

export const BLOCKED_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
  'live.com', 'icloud.com', 'aol.com', 'protonmail.com',
  'mail.com', 'ymail.com', 'msn.com',
];

export const enforceInstitutionalEmails = import.meta.env.VITE_ENFORCE_INSTITUTIONAL_EMAILS === 'true';

export function isValidDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  if (!enforceInstitutionalEmails) return true;
  return !BLOCKED_EMAIL_DOMAINS.includes(domain);
}

export function getRoleFromEmail(email: string): UserRole {
  if (email.startsWith('admin@')) return 'admin';
  if (email.startsWith('operator@')) return 'operator';
  return 'student';
}
