import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tnmgfvumwlcrbyohckre.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRubWdmdnVtd2xjcmJ5b2hja3JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MzQ1NTEsImV4cCI6MjA4MzExMDU1MX0.ojV0M3wv3N6SvIYJg1_5C3_Wf0qUCdpJzDESd0317-s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'admin' | 'user';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
}