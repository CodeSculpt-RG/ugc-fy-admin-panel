"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, AlertTriangle } from "lucide-react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { useRef } from "react";
import { adminFetch, getAdminAuthHeaders, isAdminSessionExpiredError } from "@/app/services/adminApiClient";
import {
  createAdminMonitoringSocket,
  type AdminMonitoringSocket,
  type ChatMessagePayload,
} from '@/lib/admin-monitoring-socket';

interface Conversation {
  id: string;
  status: string;
  updated_at: string;
}

const COPY = {
  description: "Monitor brand-creator conversations for safety, fraud prevention, and policy enforcement.",
  privacyNotice: "Privacy Notice",
  privacyBody:
    "Chat monitoring is used strictly for safety, fraud prevention, dispute resolution, and policy enforcement. All actions are logged.",
  noConversations: "No conversations found",
  noConversationsBody: "There are currently no active conversations to monitor.",
  conversation: "Conversation",
  status: "Status:",
} as const;

export default function ChatMonitoringPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  
  const socketRef = useRef<AdminMonitoringSocket | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchConversations() {
      try {
        const headers = await getAdminAuthHeaders();
        const token = headers.Authorization.replace("Bearer ", "");
        setAdminToken(token);

        const res = await adminFetch("/api/admin/chat-monitoring", {
          signal: controller.signal,
        });
        
        const json = await res.json();
        if (json.success) {
          setConversations(json.data);
        } else {
          setError(json.error?.message || "Failed to load");
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (isAdminSessionExpiredError(err)) return;
        setError("Network error");
      } finally {
        setLoading(false);
      }
    }
    void fetchConversations();

    return () => controller.abort(new DOMException("Chat monitoring request cancelled", "AbortError"));
  }, []);

  useEffect(() => {
    if (!adminToken) return;

    const newSocket =
      createAdminMonitoringSocket(adminToken);

    if (!newSocket) {
      // eslint-disable-next-line
      setSocketConnected(false);
      return;
    }

    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      setSocketConnected(true);
    });

    newSocket.on('disconnect', () => {
      setSocketConnected(false);
    });

    newSocket.on('connect_error', (error: Error) => {
      console.error(
        'Socket connection error',
        error
      );
      setSocketConnected(false);
    });

    newSocket.on('chat:new-message', (payload: ChatMessagePayload) => {
      console.log('New monitored message', payload);
      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === payload.conversationId);
        if (idx > -1) {
          const updated = [...prev];
          updated[idx].updated_at = payload.message.createdAt;
          return updated.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        }
        return prev;
      });
    });

    newSocket.emit('admin:join-monitoring');

    return () => {
      newSocket.emit('admin:leave-monitoring');
      newSocket.removeAllListeners();
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [adminToken]);

  return (
    <DashboardShell>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-primary" />
            Chat Monitoring
          </h1>
          <p className="text-foreground/60 mt-2">
            {COPY.description}
          </p>
        </div>
        <div className={`px-4 py-2 rounded-full text-sm font-medium border ${
          socketConnected ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
          'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
          ● {socketConnected ? 'Live' : 'Offline'} Monitoring
        </div>
      </div>
      
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start space-x-4">
        <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
        <div>
          <h4 className="text-red-400 font-medium">{COPY.privacyNotice}</h4>
          <p className="text-red-400/80 text-sm mt-1">
            {COPY.privacyBody}
          </p>
        </div>
      </div>

      <div className="bg-sidebar-bg border border-border rounded-2xl p-6 min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : error ? (
          <div className="text-red-400 text-center py-8">{error}</div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center">
            <MessageSquare className="w-12 h-12 text-foreground/20 mb-4" />
            <h3 className="text-white font-medium text-lg">{COPY.noConversations}</h3>
            <p className="text-foreground/40 mt-2">{COPY.noConversationsBody}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((conv: Conversation) => (
              <div key={conv.id} className="p-4 border border-border rounded-xl hover:bg-foreground/5 cursor-pointer transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-white font-medium">{COPY.conversation} {conv.id.split('-')[0]}...</h4>
                    <p className="text-foreground/40 text-sm mt-1">{COPY.status} {conv.status}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-foreground/40">
                      {new Date(conv.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
