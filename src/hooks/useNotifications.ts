'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Notification } from '@/types/database';

const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const userIdRef = useRef<string | null>(null);

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Not authenticated');
    return { Authorization: `Bearer ${session.access_token}` };
  };

  const lastFetchRef = useRef(0);

  const fetchNotifications = useCallback(async (silent = false) => {
    const now = Date.now();
    if (silent && now - lastFetchRef.current < 5_000) return;
    lastFetchRef.current = now;

    try {
      if (!silent) setLoading(true);
      setError(null);
      const headers = await getAuthHeaders();
      const { data } = await axios.get('/api/notifications', {
        headers,
        params: { limit: 20 },
      });
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unread_count ?? 0);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      if (!silent) setError(axiosErr.response?.data?.error ?? 'Failed to load notifications');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const headers = await getAuthHeaders();
      await axios.patch(`/api/notifications/${notificationId}/read`, {}, { headers });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      await axios.patch('/api/notifications/read-all', {}, { headers });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id || !mounted) return;

      userIdRef.current = session.user.id;
      await fetchNotifications();

      const channel = supabase
        .channel(`notifications:user:${session.user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${session.user.id}`,
          },
          (payload) => {
            if (!mounted) return;
            const newNotification = payload.new as Notification;
            setNotifications((prev) => [newNotification, ...prev].slice(0, 20));
            setUnreadCount((prev) => prev + 1);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${session.user.id}`,
          },
          (payload) => {
            if (!mounted) return;
            const updated = payload.new as Notification;
            setNotifications((prev) => {
              const next = prev.map((n) => (n.id === updated.id ? updated : n));
              setUnreadCount(next.filter((n) => !n.is_read).length);
              return next;
            });
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED' && mounted) {
            fetchNotifications(true);
          }
          if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && mounted) {
            fetchNotifications(true);
          }
        });

      channelRef.current = channel;

      pollInterval = setInterval(() => {
        if (mounted) fetchNotifications(true);
      }, 30_000);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && userIdRef.current) {
        fetchNotifications(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    init();

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', handleVisibility);
      if (pollInterval) clearInterval(pollInterval);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
};

export default useNotifications;
