import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CONTENT_TYPES = [
  'campaign',
  'daily_challenge',
  'cosmetic_collection',
  'premium_product',
] as const;
const CONTENT_STATUSES = ['draft', 'published', 'archived'] as const;
const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store',
  Vary: 'Origin',
};

type ContentType = (typeof CONTENT_TYPES)[number];
type ContentStatus = (typeof CONTENT_STATUSES)[number];
type AdminContent = {
  id: string;
  content_type: ContentType;
  slug: string;
  title: string;
  description: string;
  payload: Record<string, unknown>;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
};

function response(body: unknown, status: number, origin: string | null): Response {
  if (status === 204) {
    return new Response(null, {
      status,
      headers: {
        ...corsHeaders,
        ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
      },
    });
  }
  return Response.json(body, {
    status,
    headers: {
      ...corsHeaders,
      ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseContent(value: unknown): Omit<AdminContent, 'created_at' | 'updated_at'> | null {
  if (!isRecord(value)) return null;
  const { id, content_type, slug, title, description, payload, status } = value;
  if (
    (id !== undefined &&
      (typeof id !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))) ||
    typeof content_type !== 'string' ||
    !CONTENT_TYPES.includes(content_type as ContentType) ||
    typeof slug !== 'string' ||
    slug.length > 100 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
    typeof title !== 'string' ||
    title.trim().length < 1 ||
    title.length > 120 ||
    typeof description !== 'string' ||
    description.length > 2000 ||
    !isRecord(payload) ||
    JSON.stringify(payload).length > 20_000 ||
    typeof status !== 'string' ||
    !CONTENT_STATUSES.includes(status as ContentStatus)
  ) {
    return null;
  }
  return {
    ...(typeof id === 'string' ? { id } : {}),
    content_type: content_type as ContentType,
    slug,
    title: title.trim(),
    description: description.trim(),
    payload,
    status: status as ContentStatus,
  };
}

function asErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected admin service error.';
}

async function getStripeMetrics(secret: string) {
  const headers = { Authorization: `Bearer ${secret}` };

  const listAll = async <T>(path: string, params: Record<string, string> = {}): Promise<T[]> => {
    const records: T[] = [];
    let startingAfter: string | undefined;
    for (let page = 0; page < 100; page++) {
      const url = new URL(`https://api.stripe.com/v1/${path}`);
      url.searchParams.set('limit', '100');
      for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
      if (startingAfter) url.searchParams.set('starting_after', startingAfter);

      const result = await fetch(url, { headers });
      if (!result.ok) throw new Error(`Stripe request failed (${result.status}).`);
      const payload = await result.json();
      if (!Array.isArray(payload.data))
        throw new Error('Stripe returned an invalid list response.');
      records.push(...(payload.data as T[]));
      if (!payload.has_more) return records;
      const last = payload.data.at(-1);
      if (!last || typeof last.id !== 'string') {
        throw new Error('Stripe returned an invalid pagination cursor.');
      }
      startingAfter = last.id;
    }
    throw new Error('Stripe metrics exceeded the pagination safety limit.');
  };

  type Charge = {
    amount: number;
    currency: string;
    paid: boolean;
    status: 'failed' | 'pending' | 'succeeded';
    failure_code: string | null;
  };
  type Refund = { amount: number; currency: string };
  type CheckoutSession = { id: string };
  type Subscription = {
    items: {
      data: Array<{
        quantity?: number;
        price: {
          currency: string;
          unit_amount: number | null;
          unit_amount_decimal: string | null;
          recurring: { interval: string; interval_count: number } | null;
        };
      }>;
    };
  };

  const [charges, refunds, purchases, subscriptions] = await Promise.all([
    listAll<Charge>('charges'),
    listAll<Refund>('refunds'),
    listAll<CheckoutSession>('checkout/sessions', { payment_status: 'paid' }),
    listAll<Subscription>('subscriptions', { status: 'active' }),
  ]);
  const byCurrency: Record<
    string,
    {
      revenue: number;
      refunds: number;
      monthlyRecurringRevenue: number;
      annualRecurringRevenue: number;
    }
  > = {};
  const bucket = (currency: string) =>
    (byCurrency[currency] ??= {
      revenue: 0,
      refunds: 0,
      monthlyRecurringRevenue: 0,
      annualRecurringRevenue: 0,
    });

  let failedPayments = 0;
  let refundCount = 0;
  for (const charge of charges) {
    if (!charge.paid) {
      if (charge.status === 'failed' || charge.failure_code) failedPayments++;
      continue;
    }
    const totals = bucket(charge.currency);
    totals.revenue += charge.amount;
  }
  for (const refund of refunds) {
    bucket(refund.currency).refunds += refund.amount;
    refundCount++;
  }

  for (const subscription of subscriptions) {
    for (const item of subscription.items.data) {
      const amount =
        item.price.unit_amount ?? Number.parseFloat(item.price.unit_amount_decimal ?? 'NaN');
      const recurring = item.price.recurring;
      if (!Number.isFinite(amount) || !recurring) continue;
      const quantity = item.quantity ?? 1;
      const months =
        recurring.interval === 'year'
          ? 12 * recurring.interval_count
          : recurring.interval === 'month'
            ? recurring.interval_count
            : recurring.interval === 'week'
              ? recurring.interval_count * (12 / 52)
              : recurring.interval === 'day'
                ? recurring.interval_count * (12 / 365)
                : null;
      if (months === null || months <= 0) continue;
      const currency = item.price.currency;
      const totals = bucket(currency);
      totals.monthlyRecurringRevenue += (amount * quantity) / months;
      totals.annualRecurringRevenue += (amount * quantity * 12) / months;
    }
  }

  return {
    configured: true,
    by_currency: byCurrency,
    premium_purchases: purchases.length,
    active_subscriptions: subscriptions.length,
    refunds: refundCount,
    failed_payments: failedPayments,
  };
}

async function handle(request: Request, admin: SupabaseClient, origin: string | null) {
  const authorization = request.headers.get('Authorization');
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return response({ error: 'Authentication required.' }, 401, origin);

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const allowlistedIds = new Set(
    (Deno.env.get('ADMIN_USER_IDS') ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean),
  );
  if (!url || !anonKey || allowlistedIds.size === 0) {
    return response({ error: 'Admin service is not configured.' }, 503, origin);
  }

  const authClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user)
    return response({ error: 'Invalid authentication.' }, 401, origin);
  if (!allowlistedIds.has(authData.user.id)) {
    return response({ error: 'Administrator access required.' }, 403, origin);
  }

  const contentLength = Number(request.headers.get('Content-Length') ?? 0);
  if (contentLength > 32_000) {
    return response({ error: 'Request body is too large.' }, 413, origin);
  }
  let body: unknown;
  try {
    const rawBody = await request.text();
    if (rawBody.length > 32_000) {
      return response({ error: 'Request body is too large.' }, 413, origin);
    }
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return response({ error: 'Request body must be valid JSON.' }, 400, origin);
  }
  if (!isRecord(body) || typeof body.action !== 'string') {
    return response({ error: 'Invalid admin action.' }, 400, origin);
  }

  if (body.action === 'metrics') {
    const { data: metrics, error: metricsError } = await admin.rpc('latrunculi_admin_metrics', {
      window_days: 30,
    });
    if (metricsError) throw metricsError;

    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecret) {
      return response(
        { metrics, stripe: { configured: false }, tracking: { completions: false } },
        200,
        origin,
      );
    }
    try {
      const stripe = await getStripeMetrics(stripeSecret);
      return response({ metrics, stripe, tracking: { completions: false } }, 200, origin);
    } catch (error) {
      console.error('Unable to load Stripe admin metrics:', error);
      return response(
        {
          metrics,
          stripe: { configured: true, error: 'Stripe metrics could not be loaded.' },
          tracking: { completions: false },
        },
        200,
        origin,
      );
    }
  }

  if (body.action === 'list_content') {
    const { data, error } = await admin
      .from('admin_content')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return response({ content: data }, 200, origin);
  }

  if (body.action === 'save_content') {
    const content = parseContent(body.content);
    if (!content) return response({ error: 'Invalid content record.' }, 400, origin);
    const { data, error } = await admin.from('admin_content').upsert(content).select('*').single();
    if (error?.code === '23505') {
      return response(
        { error: 'A record with that category and slug already exists.' },
        409,
        origin,
      );
    }
    if (error) throw error;
    return response({ content: data }, 200, origin);
  }

  if (body.action === 'delete_content') {
    if (
      typeof body.id !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.id)
    ) {
      return response({ error: 'Invalid content id.' }, 400, origin);
    }
    const { error } = await admin.from('admin_content').delete().eq('id', body.id);
    if (error) throw error;
    return response({ deleted: true }, 200, origin);
  }

  return response({ error: 'Unsupported admin action.' }, 400, origin);
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get('Origin');
  if (request.method === 'OPTIONS') return response({}, 204, origin);
  if (request.method !== 'POST') return response({ error: 'Method not allowed.' }, 405, origin);

  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceRoleKey) {
    return response({ error: 'Admin service is not configured.' }, 503, origin);
  }
  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    return await handle(request, admin, origin);
  } catch (error) {
    console.error('LATRUNCULI admin request failed:', error);
    return response({ error: `Admin request failed: ${asErrorMessage(error)}` }, 500, origin);
  }
});
