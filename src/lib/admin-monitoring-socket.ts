import { io, type Socket } from 'socket.io-client';

export type ChatMessagePayload = {
  conversationId: string;
  message: {
    id: string;
    body: string;
    senderId: string;
    receiverId?: string;
    createdAt: string;
    isFlagged?: boolean;
  };
};

export type ConversationUpdatedPayload = {
  conversationId: string;
  status?: string;
  lastMessageAt?: string;
};

export interface ServerToClientEvents {
  connect: () => void;
  disconnect: () => void;
  connect_error: (error: Error) => void;

  'chat:new-message': (
    payload: ChatMessagePayload
  ) => void;

  'chat:conversation-updated': (
    payload: ConversationUpdatedPayload
  ) => void;
}

export interface ClientToServerEvents {
  'admin:join-monitoring': () => void;

  'admin:leave-monitoring': () => void;

  'admin:join-conversation': (
    payload: {
      conversationId: string;
    }
  ) => void;

  'admin:leave-conversation': (
    payload: {
      conversationId: string;
    }
  ) => void;
}

export type AdminMonitoringSocket = Socket<
  ServerToClientEvents,
  ClientToServerEvents
>;

let monitoringSocket: AdminMonitoringSocket | null = null;
let monitoringSocketToken: string | null = null;

export function createAdminMonitoringSocket(
  adminToken: string
): AdminMonitoringSocket | null {
  const socketUrl = process.env.NEXT_PUBLIC_BACKEND_SOCKET_URL;

  if (!socketUrl) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[socket] NEXT_PUBLIC_BACKEND_SOCKET_URL is not configured. Realtime disabled.');
    }
    return null;
  }

  // Singleton instance checks
  if (monitoringSocket) {
    if (monitoringSocketToken === adminToken) {
      if (!monitoringSocket.connected) {
        monitoringSocket.connect();
      }
      return monitoringSocket;
    }

    // Token changed, destroy existing socket connection first
    monitoringSocket.disconnect();
    monitoringSocket = null;
  }

  monitoringSocketToken = adminToken;
  monitoringSocket = io(
    `${socketUrl}/admin-monitoring`,
    {
      auth: {
        token: adminToken,
      },
      autoConnect: false,
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 8000,
    }
  );

  monitoringSocket.on('connect_error', () => {
    // Silently handle connection errors to prevent console spam when realtime is unavailable
    // The UI should gracefully handle offline states independently
  });

  return monitoringSocket;
}

export function disconnectAdminMonitoringSocket() {
  if (monitoringSocket) {
    monitoringSocket.disconnect();
    monitoringSocket = null;
    monitoringSocketToken = null;
  }
}

