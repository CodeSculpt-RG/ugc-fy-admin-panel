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
  if (
    monitoringSocket &&
    monitoringSocketToken === adminToken &&
    monitoringSocket.connected
  ) {
    return monitoringSocket;
  }

  if (monitoringSocket && monitoringSocketToken !== adminToken) {
    monitoringSocket.removeAllListeners();
    monitoringSocket.disconnect();
    monitoringSocket = null;
  }

  const socketUrl =
    process.env.NEXT_PUBLIC_BACKEND_SOCKET_URL;

  if (!socketUrl) {
    console.error(
      'NEXT_PUBLIC_BACKEND_SOCKET_URL missing'
    );

    return null;
  }

  monitoringSocketToken = adminToken;
  monitoringSocket = io(
    `${socketUrl}/admin-monitoring`,
    {
      auth: {
        token: adminToken,
      },

      transports: ['websocket'],

      autoConnect: true,

      reconnection: true,

      reconnectionAttempts: 10,

      reconnectionDelay: 1000,
    }
  );

  monitoringSocket.on("disconnect", () => {
    if (!monitoringSocket?.connected) {
      monitoringSocket = null;
      monitoringSocketToken = null;
    }
  });

  return monitoringSocket;
}
