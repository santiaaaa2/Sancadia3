import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import ScreenHeader from '@/components/ScreenHeader';
import {
  adminContentTypes,
  invokeAdmin,
  type AdminContent,
  type AdminContentStatus,
  type AdminContentType,
  type StripeAdminMetrics,
  type SupabaseAdminMetrics,
} from '@/lib/admin';

interface DashboardResponse {
  metrics: SupabaseAdminMetrics;
  stripe: StripeAdminMetrics;
  tracking: { completions: boolean };
}

const categoryLabels: Record<AdminContentType, string> = {
  campaign: 'Historical campaigns',
  daily_challenge: 'Daily challenges',
  cosmetic_collection: 'Cosmetic collections',
  premium_product: 'Premium products',
};

const emptyForm = {
  content_type: 'campaign' as AdminContentType,
  slug: '',
  title: '',
  description: '',
  payloadText: '{}',
  status: 'draft' as AdminContentStatus,
};

function number(value: number | null | undefined): string {
  return value == null ? '—' : new Intl.NumberFormat().format(value);
}

function money(amount: number, currency: string): string {
  const formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency });
  const fractionDigits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(amount / 10 ** fractionDigits);
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Card className="grid gap-1">
      <p className="text-sm font-semibold text-subtle">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {note && <p className="text-xs text-subtle">{note}</p>}
    </Card>
  );
}

export default function AdminScreen() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [content, setContent] = useState<AdminContent[]>([]);
  const [category, setCategory] = useState<AdminContentType>('campaign');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [metrics, records] = await Promise.all([
        invokeAdmin<DashboardResponse>('metrics'),
        invokeAdmin<{ content: AdminContent[] }>('list_content'),
      ]);
      setDashboard(metrics);
      setContent(records.content);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load the admin dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredContent = useMemo(
    () => content.filter((item) => item.content_type === category),
    [category, content],
  );

  const startEditing = (item: AdminContent) => {
    setEditingId(item.id);
    setForm({
      content_type: item.content_type,
      slug: item.slug,
      title: item.title,
      description: item.description,
      payloadText: JSON.stringify(item.payload, null, 2),
      status: item.status,
    });
    setError(null);
    setNotice(null);
  };

  const resetForm = (contentType: AdminContentType = category) => {
    setEditingId(null);
    setForm({ ...emptyForm, content_type: contentType });
  };

  const saveContent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const payload: unknown = JSON.parse(form.payloadText);
      if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
        throw new Error('Content data must be a JSON object.');
      }
      const response = await invokeAdmin<{ content: AdminContent }>('save_content', {
        content: {
          ...(editingId ? { id: editingId } : {}),
          content_type: form.content_type,
          slug: form.slug,
          title: form.title,
          description: form.description,
          payload,
          status: form.status,
        },
      });
      setContent((current) => [
        response.content,
        ...current.filter((item) => item.id !== response.content.id),
      ]);
      setCategory(form.content_type);
      setNotice('Content saved.');
      resetForm(form.content_type);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save content.');
    } finally {
      setBusy(false);
    }
  };

  const deleteContent = async (id: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await invokeAdmin<{ deleted: boolean }>('delete_content', { id });
      setContent((current) => current.filter((item) => item.id !== id));
      if (editingId === id) resetForm();
      setNotice('Content deleted.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to delete content.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <ScreenHeader title="LATRUNCULI Admin" backTo="/" />
      <div className="grid gap-5 pb-6">
        <p className="text-sm text-subtle">
          Administrator access is verified by the server for every request.
        </p>

        {loading && <p role="status">Loading administrator data…</p>}
        {error && (
          <Card role="alert" className="grid gap-3">
            <p className="font-semibold">{error}</p>
            <Button variant="secondary" onClick={() => void load()}>
              Retry
            </Button>
          </Card>
        )}
        {notice && (
          <p role="status" className="text-sm font-semibold text-primary">
            {notice}
          </p>
        )}

        {dashboard && (
          <>
            <section className="grid gap-3" aria-labelledby="user-metrics">
              <h2 id="user-metrics" className="text-lg font-bold">
                User metrics · last 30 days
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <Metric
                  label="Registered users"
                  value={number(dashboard.metrics.registered_users)}
                />
                <Metric label="Active users" value={number(dashboard.metrics.active_users)} />
                <Metric
                  label="New registrations"
                  value={number(dashboard.metrics.new_registrations)}
                />
                <Metric
                  label="Returning players"
                  value={number(dashboard.metrics.returning_players)}
                />
              </div>
            </section>

            <section className="grid gap-3" aria-labelledby="revenue-metrics">
              <h2 id="revenue-metrics" className="text-lg font-bold">
                Revenue
              </h2>
              {!dashboard.stripe.configured ? (
                <Card role="status">
                  Stripe metrics are unavailable until the server-side Stripe secret is configured.
                </Card>
              ) : dashboard.stripe.error ? (
                <Card role="alert">{dashboard.stripe.error}</Card>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Metric
                      label="Premium purchases"
                      value={number(dashboard.stripe.premium_purchases)}
                    />
                    <Metric
                      label="Active subscriptions"
                      value={number(dashboard.stripe.active_subscriptions)}
                    />
                    <Metric label="Refunds" value={number(dashboard.stripe.refunds)} />
                    <Metric
                      label="Failed payments"
                      value={number(dashboard.stripe.failed_payments)}
                    />
                  </div>
                  {Object.entries(dashboard.stripe.by_currency ?? {}).map(([currency, totals]) => (
                    <Card key={currency} className="grid gap-2">
                      <h3 className="font-bold">{currency.toUpperCase()}</h3>
                      <p className="text-sm">Total revenue: {money(totals.revenue, currency)}</p>
                      <p className="text-sm">Refund amount: {money(totals.refunds, currency)}</p>
                      <p className="text-sm">
                        Monthly recurring revenue: {money(totals.monthlyRecurringRevenue, currency)}
                      </p>
                      <p className="text-sm">
                        Annual recurring revenue: {money(totals.annualRecurringRevenue, currency)}
                      </p>
                    </Card>
                  ))}
                  {Object.keys(dashboard.stripe.by_currency ?? {}).length === 0 && (
                    <Card className="grid gap-1">
                      <p className="font-bold">No Stripe transactions yet</p>
                      <p className="text-sm text-subtle">
                        Revenue, refunds, MRR, and ARR are zero; currency will appear after the
                        first payment or subscription.
                      </p>
                    </Card>
                  )}
                </>
              )}
            </section>

            <section className="grid gap-3" aria-labelledby="engagement-metrics">
              <h2 id="engagement-metrics" className="text-lg font-bold">
                Engagement · last 30 days
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <Metric label="Games played" value={number(dashboard.metrics.games_played)} />
                <Metric label="AI matches" value={number(dashboard.metrics.ai_matches)} />
                <Metric
                  label="Multiplayer matches"
                  value={number(dashboard.metrics.multiplayer_matches)}
                />
                <Metric
                  label="Daily challenges completed"
                  value={number(dashboard.metrics.daily_challenges_completed)}
                  note="Not tracked: challenge gameplay is not implemented."
                />
                <Metric
                  label="Campaign completion"
                  value={number(dashboard.metrics.campaign_completions)}
                  note="Not tracked: campaign gameplay is not implemented."
                />
              </div>
            </section>
          </>
        )}

        {dashboard && (
          <section className="grid gap-3" aria-labelledby="content-management">
            <h2 id="content-management" className="text-lg font-bold">
              Content management
            </h2>
            <label className="grid gap-1 text-sm font-semibold" htmlFor="content-category">
              Content type
              <select
                id="content-category"
                className="rounded-xl border border-border bg-background px-3 py-2"
                value={category}
                onChange={(event) => {
                  const nextCategory = event.target.value as AdminContentType;
                  setCategory(nextCategory);
                  resetForm(nextCategory);
                }}
              >
                {adminContentTypes.map((type) => (
                  <option key={type} value={type}>
                    {categoryLabels[type]}
                  </option>
                ))}
              </select>
            </label>

            {filteredContent.map((item) => (
              <Card key={item.id} className="grid gap-3">
                <div>
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="text-sm text-subtle">
                    {item.slug} · {item.status}
                  </p>
                </div>
                {item.description && <p className="text-sm">{item.description}</p>}
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => startEditing(item)} disabled={busy}>
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => void deleteContent(item.id)}
                    disabled={busy}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
            {dashboard && filteredContent.length === 0 && (
              <p className="text-sm text-subtle">
                No {categoryLabels[category].toLowerCase()} yet.
              </p>
            )}

            <Card>
              <form className="grid gap-3" onSubmit={(event) => void saveContent(event)}>
                <h3 className="font-bold">{editingId ? 'Edit content' : 'Add content'}</h3>
                <label className="grid gap-1 text-sm font-semibold">
                  Slug
                  <input
                    required
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                    maxLength={100}
                    value={form.slug}
                    onChange={(event) => setForm({ ...form, slug: event.target.value })}
                    className="rounded-xl border border-border bg-background px-3 py-2"
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  Title
                  <input
                    required
                    maxLength={120}
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    className="rounded-xl border border-border bg-background px-3 py-2"
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  Description
                  <textarea
                    rows={3}
                    maxLength={2000}
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    className="rounded-xl border border-border bg-background px-3 py-2"
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  Content data (JSON object)
                  <textarea
                    required
                    rows={6}
                    value={form.payloadText}
                    onChange={(event) => setForm({ ...form, payloadText: event.target.value })}
                    className="rounded-xl border border-border bg-background px-3 py-2 font-mono text-xs"
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  Publication status
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm({ ...form, status: event.target.value as AdminContentStatus })
                    }
                    className="rounded-xl border border-border bg-background px-3 py-2"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
                <div className="flex gap-2">
                  <Button type="submit" disabled={busy}>
                    {busy ? 'Saving…' : editingId ? 'Save changes' : 'Create content'}
                  </Button>
                  {editingId && (
                    <Button variant="secondary" onClick={() => resetForm()} disabled={busy}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Card>
          </section>
        )}
      </div>
    </>
  );
}
