import { useEffect } from 'react';
// import { useQueryClient } from '@tanstack/react-query';
// import { useSocket } from '../contexts/SocketContext';

// SyncEvents mirroring the Backend Enum
export enum SyncEvent {
  CAMPAIGN_CREATED = 'sync:campaign_created',
  CAMPAIGN_UPDATED = 'sync:campaign_updated',
  APPLICATION_SUBMITTED = 'sync:application_submitted',
  PAYMENT_RELEASED = 'sync:payment_released',
}

/**
 * Web Cross-Platform Synchronization Manager
 * 
 * 1. Listens to WebSocket events and instantly invalidates React Query cache (Online Mode).
 * 2. Attaches to window focus to fetch missed 'Delta' events if the tab was asleep.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export const useSyncManager = (socket: any, queryClient: any) => {

  useEffect(() => {
    if (!socket || !queryClient) return;

    // --- 1. Zero-Latency Socket Listeners (Online Mode) ---
    
    const handleCampaignUpdated = (payload: any) => {
      console.log('[SYNC] Campaign Updated via Socket', payload);
      
      // Multi-Tenant Safety: Ensure the payload belongs to the current org before hydrating
      // if (payload._org_id !== currentOrgId) return;

      // Invalidate the campaign list query to force a background refetch
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      
      // Optionally, manually hydrate the cache for instantaneous UI updates without network request
      if (payload.id) {
        queryClient.setQueryData(['campaign', payload.id], (oldData: any) => ({
          ...oldData,
          ...payload,
        }));
      }
    };

    const handleApplicationSubmitted = (payload: any) => {
      console.log('[SYNC] Application Submitted via Socket', payload);
      queryClient.invalidateQueries({ queryKey: ['applications', payload.campaignId] });
    };

    socket.on(SyncEvent.CAMPAIGN_UPDATED, handleCampaignUpdated);
    socket.on(SyncEvent.APPLICATION_SUBMITTED, handleApplicationSubmitted);

    // --- 2. Sync-on-Reconnect (Delta Fetching for Sleeping Tabs) ---
    
    const handleWindowFocus = () => {
      console.log('[SYNC] Window focused. Initiating Delta Fetch for stale queries.');
      // React Query handles window focus automatically if configured (`refetchOnWindowFocus`), 
      // but if we rely on sockets, we might manually invalidate specific keys here to ensure 
      // the dashboard fetches the absolute latest data from the Postgres DB upon return.
      queryClient.invalidateQueries({ 
        queryKey: ['campaigns'], 
        refetchType: 'active' 
      });
    };

    window.addEventListener('focus', handleWindowFocus);

    // --- Cleanup ---
    return () => {
      socket.off(SyncEvent.CAMPAIGN_UPDATED, handleCampaignUpdated);
      socket.off(SyncEvent.APPLICATION_SUBMITTED, handleApplicationSubmitted);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [socket, queryClient]);
};
