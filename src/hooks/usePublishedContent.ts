import { useEffect, useState } from 'react';
import type { AdminContentType } from '@/lib/admin';
import { supabase } from '@/lib/supabase';

export interface PublishedContent {
  id: string;
  content_type: AdminContentType;
  slug: string;
  title: string;
  description: string;
  payload: Record<string, unknown>;
}

export function usePublishedContent(types: readonly AdminContentType[]) {
  const [content, setContent] = useState<PublishedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const typeKey = types.join(',');

  useEffect(() => {
    let active = true;
    const client = supabase;
    if (!client) {
      setError('Content is unavailable because Supabase is not configured.');
      setLoading(false);
      return;
    }

    void Promise.resolve(
      client
        .from('admin_content')
        .select('id, content_type, slug, title, description, payload')
        .in('content_type', typeKey.split(',') as AdminContentType[])
        .eq('status', 'published')
        .order('updated_at', { ascending: false }),
    )
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) {
          setError(`Unable to load published content: ${queryError.message}`);
          return;
        }
        setContent(
          (data ?? []).map((item) => ({
            ...item,
            payload:
              typeof item.payload === 'object' &&
              item.payload !== null &&
              !Array.isArray(item.payload)
                ? (item.payload as Record<string, unknown>)
                : {},
          })),
        );
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(
            `Unable to load published content: ${cause instanceof Error ? cause.message : 'Unexpected error.'}`,
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [typeKey]);

  return { content, loading, error };
}
