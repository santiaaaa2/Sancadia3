import { supabase } from '@/lib/supabase';

export const adminContentTypes = [
  'campaign',
  'daily_challenge',
  'cosmetic_collection',
  'premium_product',
] as const;
export type AdminContentType = (typeof adminContentTypes)[number];
export type AdminContentStatus = 'draft' | 'published' | 'archived';

export interface AdminContent {
  id: string;
  content_type: AdminContentType;
  slug: string;
  title: string;
  description: string;
  payload: Record<string, unknown>;
  status: AdminContentStatus;
  created_at: string;
  updated_at: string;
}

export interface SupabaseAdminMetrics {
  registered_users: number;
  new_registrations: number;
  active_users: number;
  returning_players: number;
  games_played: number;
  ai_matches: number;
  multiplayer_matches: number;
  daily_challenges_completed: number | null;
  campaign_completions: number | null;
  window_days: number;
}

export interface StripeAdminMetrics {
  configured: boolean;
  error?: string;
  by_currency?: Record<
    string,
    {
      revenue: number;
      refunds: number;
      monthlyRecurringRevenue: number;
      annualRecurringRevenue: number;
    }
  >;
  premium_purchases?: number;
  active_subscriptions?: number;
  refunds?: number;
  failed_payments?: number;
}

export class AdminApiError extends Error {}

export async function invokeAdmin<T>(
  action: string,
  fields: Record<string, unknown> = {},
): Promise<T> {
  if (!supabase) throw new AdminApiError('Supabase is not configured for this deployment.');

  const { data, error } = await supabase.functions.invoke<Record<string, unknown>>(
    'latrunculi-admin',
    { body: { action, ...fields } },
  );
  if (error) {
    let message = error.message || 'Admin request failed.';
    if ('context' in error && error.context instanceof Response) {
      try {
        const body = (await error.context.clone().json()) as { error?: unknown };
        if (typeof body.error === 'string') message = body.error;
      } catch {
        // Keep the Functions client error when the response has no JSON body.
      }
    }
    throw new AdminApiError(message);
  }
  if (!data) throw new AdminApiError('Admin service returned an empty response.');
  if (typeof data.error === 'string') throw new AdminApiError(data.error);
  return data as T;
}
