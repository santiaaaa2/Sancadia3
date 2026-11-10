# LATRUNCULI administrator dashboard

The `/admin` route provides user and engagement metrics, Stripe revenue metrics, and CRUD for
campaigns, daily challenges, cosmetic collections, and premium products. Published content is
available to the public app; drafts and archived records are only returned through the admin
function.

## Deployment

1. Apply the migration with the Supabase database migration workflow. It creates `admin_content`,
   public-read-only RLS for published records, and the service-role-only metrics function.
2. Deploy the `latrunculi-admin` Edge Function.
3. Configure the Edge Function secret `ADMIN_USER_IDS` with a comma-separated list of Supabase
   Auth user UUIDs. Do not use user-editable metadata to grant administrator access.
4. Configure the Edge Function secret `STRIPE_SECRET_KEY` with a restricted Stripe secret key that
   can read charges, Checkout Sessions, and subscriptions. If it is absent, Stripe metrics are
   explicitly reported as unavailable.
5. Sign in as an allowlisted user and open `/admin`.

The Supabase service-role key and Stripe secret key are read only by the Edge Function. Do not add
them to a `VITE_` variable, the browser bundle, or client configuration. Each admin request verifies
the bearer token with Supabase Auth and checks the user's UUID against `ADMIN_USER_IDS` before
performing privileged database or Stripe operations.

## Metric definitions and current tracking

- Registered users: profiles in Supabase.
- Active users, games played, AI matches, multiplayer matches, and returning players: game results
  during the trailing 30 days. A returning player has results on at least two distinct UTC dates.
- New registrations: profiles created during the trailing 30 days.
- Stripe revenue, purchases, subscriptions, refunds, and failed charges: Stripe API data, grouped by
  currency where applicable. MRR and ARR normalize recurring subscription prices by their interval.
- Daily challenge completions and campaign completions are shown as unavailable until player-facing
  completion flows are implemented. They are not inferred from content publication.

Published campaigns and daily challenges appear on the home screen. Published cosmetic collections
and premium products appear in the shop. Product checkout and challenge/campaign gameplay are not
implemented by this dashboard.
