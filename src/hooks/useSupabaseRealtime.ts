'use client';

import { useEffect, useRef } from 'react';
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';

import { supabase as createClient } from '@/app/lib/supabase';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export type UseSupabaseRealtimeOptions<T extends Record<string, unknown> = Record<string, unknown>> = {
  channelName: string;
  table: string;
  event?: RealtimeEvent;
  schema?: string;
  filter?: string;
  enabled?: boolean;
  onPayload: (payload: RealtimePostgresChangesPayload<T>) => void;
  onSubscribed?: () => void;
  onError?: (error: Error) => void;
  onReconnect?: () => void;
};

function normalizeChannelName(channelName: string) {
  return channelName.startsWith('realtime:')
    ? channelName
    : `realtime:${channelName}`;
}

// Support both positional arguments (legacy) and the new options object
export function useSupabaseRealtime<T extends Record<string, unknown> = Record<string, unknown>>(
  optionsOrTable: string | UseSupabaseRealtimeOptions<T>,
  legacyEvent?: RealtimeEvent,
  legacyCallback?: (payload: RealtimePostgresChangesPayload<T>) => void,
  legacyFilter?: string,
  legacyOnReconnect?: () => void
) {
  let options: UseSupabaseRealtimeOptions<T>;

  if (typeof optionsOrTable === 'string') {
    options = {
      channelName: optionsOrTable, // Use table name as channel base
      table: optionsOrTable,
      event: legacyEvent || '*',
      filter: legacyFilter,
      onPayload: legacyCallback || (() => {}),
      onReconnect: legacyOnReconnect,
      enabled: true,
    };
  } else {
    options = optionsOrTable;
  }

  const {
    channelName,
    table,
    event = '*',
    schema = 'public',
    filter,
    enabled = true,
    onPayload,
    onSubscribed,
    onError,
    onReconnect,
  } = options;

  const onPayloadRef = useRef(onPayload);
  const onSubscribedRef = useRef(onSubscribed);
  const onErrorRef = useRef(onError);
  const onReconnectRef = useRef(onReconnect);

  useEffect(() => {
    onPayloadRef.current = onPayload;
  }, [onPayload]);

  useEffect(() => {
    onSubscribedRef.current = onSubscribed;
  }, [onSubscribed]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onReconnectRef.current = onReconnect;
  }, [onReconnect]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const supabase = createClient;
    const normalizedChannelName = normalizeChannelName(channelName);

    // Using Date.now() in the channel name ensures a unique channel instance per effect run,
    // avoiding the "cannot add postgres_changes callbacks after subscribe()" error
    let channel: RealtimeChannel | null = supabase.channel(
      `${normalizedChannelName}:${table}:${event}:${filter ?? 'all'}:${Date.now()}`
    );

    const postgresConfig = {
      event,
      schema,
      table,
      ...(filter ? { filter } : {}),
    } as const;

    channel
      .on(
        'postgres_changes',
        postgresConfig,
        (payload: RealtimePostgresChangesPayload<T>) => {
          onPayloadRef.current(payload);
        }
      )
      .subscribe((status, error) => {
        if (status === 'SUBSCRIBED') {
          onSubscribedRef.current?.();
          return;
        }

        if (status === 'CHANNEL_ERROR') {
          onErrorRef.current?.(
            error instanceof Error
              ? error
              : new Error('Supabase realtime channel error')
          );
          return;
        }

        if (status === 'TIMED_OUT') {
          onErrorRef.current?.(new Error('Supabase realtime subscription timed out'));
          return;
        }

        if (status === 'CLOSED') {
          onReconnectRef.current?.();
        }
      });

    return () => {
      if (channel) {
        void supabase.removeChannel(channel);
        channel = null;
      }
    };
  }, [channelName, table, event, schema, filter, enabled]);
}
