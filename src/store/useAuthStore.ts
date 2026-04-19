import { create } from 'zustand';
import { supabase, Profile } from '../lib/supabase';

interface AuthState {
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  loading: true,
  initialized: false,

  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),

  fetchProfile: async (userId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    let { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!data && user) {
      const email = user.email || '';
      const role = email.startsWith('admin@') ? 'admin'
        : email.startsWith('operator@') ? 'operator'
        : 'student';
      const { data: inserted } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email,
          full_name: user.user_metadata?.full_name || email.split('@')[0],
          role,
        })
        .select()
        .maybeSingle();
      data = inserted;
    }
    set({ profile: data, loading: false, initialized: true });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ profile: null, initialized: true });
  },
}));
