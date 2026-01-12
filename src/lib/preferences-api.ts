import { supabase } from "@/integrations/supabase/client";

export type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'custom';

export interface UserPreferences {
  id: string;
  user_id: string;
  role: 'employer' | 'worker';
  sort_option: SortOption;
  custom_order: string[];
  created_at: string;
  updated_at: string;
}

export async function getUserPreferences(
  userId: string, 
  role: 'employer' | 'worker'
): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .eq('role', role)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user preferences:', error);
    return null;
  }

  if (data) {
    return {
      ...data,
      role: data.role as 'employer' | 'worker',
      sort_option: data.sort_option as SortOption,
      custom_order: (data.custom_order as string[]) || [],
    };
  }

  return null;
}

export async function saveUserPreferences(
  userId: string,
  role: 'employer' | 'worker',
  sortOption: SortOption,
  customOrder: string[]
): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .upsert(
      {
        user_id: userId,
        role,
        sort_option: sortOption,
        custom_order: customOrder,
      },
      {
        onConflict: 'user_id,role',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Error saving user preferences:', error);
    throw error;
  }

  return {
    ...data,
    role: data.role as 'employer' | 'worker',
    sort_option: data.sort_option as SortOption,
    custom_order: (data.custom_order as string[]) || [],
  };
}
