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
  const socketUrl =
    process.env.NEXT_PUBLIC_BACKEND_SOCKET_URL || 'ws://localhost:3000';

  if (!socketUrl) {
    console.error(
      'NEXT_PUBLIC_BACKEND_SOCKET_URL missing'
    );

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

      transports: ['polling', 'websocket'],

      autoConnect: true,

      reconnection: true,

      reconnectionAttempts: 100, // tolerance for server restarts

      reconnectionDelay: 1000,
      
      reconnectionDelayMax: 10000,
      
      randomizationFactor: 0.5,
    }
  );

  return monitoringSocket;
}
