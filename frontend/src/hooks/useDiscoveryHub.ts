import { useEffect, useState, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { useQueryClient } from '@tanstack/react-query';
import type { DiscoveryHostDto, DiscoveryScanDto, DiscoveryScanEventDto } from '../types/discovery';

export type SignalRConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface UseDiscoveryHubReturn {
  connectionStatus: SignalRConnectionStatus;
  events: DiscoveryScanEventDto[];
  flashedHostIds: Set<string>;
  clearEvents: () => void;
}

export function useDiscoveryHub(scanId?: string): UseDiscoveryHubReturn {
  const queryClient = useQueryClient();
  const [connectionStatus, setConnectionStatus] = useState<SignalRConnectionStatus>('disconnected');
  const [events, setEvents] = useState<DiscoveryScanEventDto[]>([]);
  const [flashedHostIds, setFlashedHostIds] = useState<Set<string>>(new Set());
  const hubConnectionRef = useRef<signalR.HubConnection | null>(null);

  const triggerHostFlash = useCallback((hostId: string) => {
    setFlashedHostIds((prev) => new Set(prev).add(hostId));
    setTimeout(() => {
      setFlashedHostIds((prev) => {
        const next = new Set(prev);
        next.delete(hostId);
        return next;
      });
    }, 2000);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('ra_token') || '';
    const connection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/discovery', {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    hubConnectionRef.current = connection;
    setConnectionStatus('connecting');

    // Wire event handlers
    connection.on('scan.started', (scan: DiscoveryScanDto) => {
      queryClient.setQueryData(['discovery-scan', scan.id], scan);
      queryClient.invalidateQueries({ queryKey: ['discovery-scans'] });
    });

    connection.on('scan.progress', (progress: { scanId: string; progressPercent: number; hostsFound: number; hostsTotal: number }) => {
      queryClient.setQueryData<DiscoveryScanDto | undefined>(['discovery-scan', progress.scanId], (old) => {
        if (!old) return old;
        return {
          ...old,
          progressPercent: progress.progressPercent,
          hostsFound: progress.hostsFound,
          hostsTotal: progress.hostsTotal,
        };
      });
    });

    connection.on('host.discovered', (host: DiscoveryHostDto) => {
      triggerHostFlash(host.id);

      // Invalidate/update scan host cache for host's scanId
      queryClient.setQueryData<DiscoveryHostDto[] | undefined>(['discovery-hosts', host.scanId], (old) => {
        if (!old) return [host];
        const exists = old.some((h) => h.id === host.id);
        if (exists) {
          return old.map((h) => (h.id === host.id ? host : h));
        }
        return [host, ...old];
      });

      queryClient.invalidateQueries({ queryKey: ['discovery-scan', host.scanId] });
    });

    connection.on('host.updated', (host: DiscoveryHostDto) => {
      queryClient.setQueryData<DiscoveryHostDto[] | undefined>(['discovery-hosts', host.scanId], (old) => {
        if (!old) return [host];
        return old.map((h) => (h.id === host.id ? host : h));
      });
    });

    connection.on('scan.completed', (data: { scanId: string; hostsFound: number; totalDurationMs: number }) => {
      queryClient.invalidateQueries({ queryKey: ['discovery-scan', data.scanId] });
      queryClient.invalidateQueries({ queryKey: ['discovery-hosts', data.scanId] });
      queryClient.invalidateQueries({ queryKey: ['discovery-scans'] });
    });

    connection.on('scan.failed', (data: { scanId: string; error: string }) => {
      queryClient.invalidateQueries({ queryKey: ['discovery-scan', data.scanId] });
      queryClient.invalidateQueries({ queryKey: ['discovery-scans'] });
    });

    connection.on('scan.event', (eventDto: DiscoveryScanEventDto) => {
      setEvents((prev) => [eventDto, ...prev.slice(0, 499)]); // Keep last 500 events
    });

    connection.onreconnecting(() => setConnectionStatus('reconnecting'));
    connection.onreconnected(() => {
      setConnectionStatus('connected');
      if (scanId) {
        connection.invoke('JoinScanGroup', scanId).catch(console.error);
      }
    });

    connection.onclose(() => setConnectionStatus('disconnected'));

    // Start connection
    connection
      .start()
      .then(() => {
        setConnectionStatus('connected');
        if (scanId) {
          connection.invoke('JoinScanGroup', scanId).catch(console.error);
        }
      })
      .catch((err) => {
        console.error('SignalR connection failed:', err);
        setConnectionStatus('disconnected');
      });

    return () => {
      if (scanId && connection.state === signalR.HubConnectionState.Connected) {
        connection.invoke('LeaveScanGroup', scanId).catch(() => {});
      }
      connection.stop();
    };
  }, [queryClient, scanId, triggerHostFlash]);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  return {
    connectionStatus,
    events,
    flashedHostIds,
    clearEvents,
  };
}
