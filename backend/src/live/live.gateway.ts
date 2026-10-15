import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LiveSessionStatus } from '@prisma/client';

interface ClientMetadata {
  sessionId: string;
  role: 'broadcaster' | 'viewer' | 'moderator';
  userId?: string;
  userName?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  pingInterval: 10000,
  pingTimeout: 25000,
  maxHttpBufferSize: 1e7,
})
export class LiveGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('LiveGateway');
  private clients = new Map<string, ClientMetadata>(); // socketId -> metadata
  private sessionBroadcasters = new Map<string, string>(); // sessionId -> broadcasterSocketId
  private sessionViewers = new Map<string, Set<string>>(); // sessionId -> Set of viewerSocketIds

  constructor(private readonly prisma: PrismaService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const meta = this.clients.get(client.id);
    if (!meta) return;

    const { sessionId, role } = meta;
    this.clients.delete(client.id);

    if (role === 'broadcaster') {
      if (this.sessionBroadcasters.get(sessionId) === client.id) {
        this.sessionBroadcasters.delete(sessionId);
        this.logger.log(`Broadcaster disconnected from session ${sessionId}`);
        this.server.to(`session_${sessionId}`).emit('broadcaster-offline', { sessionId });
      }
    } else {
      const viewers = this.sessionViewers.get(sessionId);
      if (viewers) {
        viewers.delete(client.id);
        const broadcasterSocketId = this.sessionBroadcasters.get(sessionId);
        if (broadcasterSocketId) {
          this.server.to(broadcasterSocketId).emit('viewer-left', {
            viewerSocketId: client.id,
            viewersCount: viewers.size,
          });
        }
        this.server.to(`session_${sessionId}`).emit('viewers-count', {
          count: viewers.size,
        });
      }
    }
  }

  @SubscribeMessage('join-session')
  async handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { sessionId: string; role: 'broadcaster' | 'viewer' | 'moderator'; userId?: string; userName?: string },
  ) {
    const { sessionId, role, userId, userName } = payload;
    if (!sessionId) return { success: false, error: 'Session ID is required' };

    client.join(`session_${sessionId}`);
    this.clients.set(client.id, { sessionId, role, userId, userName });

    if (role === 'broadcaster') {
      this.sessionBroadcasters.set(sessionId, client.id);
      this.logger.log(`Broadcaster registered for session ${sessionId} (Socket: ${client.id})`);

      // Notify all current viewers in this session room that broadcaster is online
      this.server.to(`session_${sessionId}`).emit('broadcaster-online', {
        sessionId,
        broadcasterSocketId: client.id,
      });

      const viewers = this.sessionViewers.get(sessionId) || new Set();
      return {
        success: true,
        role: 'broadcaster',
        viewersCount: viewers.size,
        existingViewers: Array.from(viewers),
      };
    } else if (role === 'moderator') {
      this.logger.log(`Moderator registered for session ${sessionId} (Socket: ${client.id})`);
      const viewers = this.sessionViewers.get(sessionId) || new Set();
      return {
        success: true,
        role: 'moderator',
        viewersCount: viewers.size,
      };
    } else {
      if (!this.sessionViewers.has(sessionId)) {
        this.sessionViewers.set(sessionId, new Set());
      }
      this.sessionViewers.get(sessionId)!.add(client.id);

      const broadcasterSocketId = this.sessionBroadcasters.get(sessionId);
      const isBroadcasterOnline = Boolean(broadcasterSocketId);

      if (broadcasterSocketId) {
        // Notify broadcaster that a new viewer wants to receive the stream
        this.server.to(broadcasterSocketId).emit('viewer-joined', {
          viewerSocketId: client.id,
          userId,
          userName: userName || 'متداول',
          viewersCount: this.sessionViewers.get(sessionId)!.size,
        });
      }

      this.server.to(`session_${sessionId}`).emit('viewers-count', {
        count: this.sessionViewers.get(sessionId)!.size,
      });

      return {
        success: true,
        role: 'viewer',
        isBroadcasterOnline,
        broadcasterSocketId,
        viewersCount: this.sessionViewers.get(sessionId)!.size,
      };
    }
  }

  @SubscribeMessage('broadcaster-start')
  async handleBroadcasterStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { sessionId: string },
  ) {
    const { sessionId } = payload;
    this.sessionBroadcasters.set(sessionId, client.id);

    try {
      await this.prisma.liveSession.update({
        where: { id: sessionId },
        data: {
          status: LiveSessionStatus.LIVE,
          streamType: 'BROWSER_WEBRTC',
          actualStartTime: new Date(),
        },
      });
    } catch (err) {
      this.logger.warn(`Could not update DB for session ${sessionId}: ${err.message}`);
    }

    this.server.to(`session_${sessionId}`).emit('stream-started', {
      sessionId,
      broadcasterSocketId: client.id,
    });

    return { success: true };
  }

  @SubscribeMessage('broadcaster-stop')
  async handleBroadcasterStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { sessionId: string },
  ) {
    const { sessionId } = payload;
    this.sessionBroadcasters.delete(sessionId);

    try {
      await this.prisma.liveSession.update({
        where: { id: sessionId },
        data: {
          status: LiveSessionStatus.ENDED,
          actualEndTime: new Date(),
        },
      });
    } catch (err) {
      this.logger.warn(`Could not update DB for session ${sessionId}: ${err.message}`);
    }

    this.server.to(`session_${sessionId}`).emit('stream-stopped', {
      sessionId,
    });

    return { success: true };
  }

  // WebRTC Signaling: Offer from Broadcaster to Viewer
  @SubscribeMessage('webrtc-offer')
  handleWebrtcOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { targetSocketId: string; sdp: any },
  ) {
    this.server.to(payload.targetSocketId).emit('webrtc-offer', {
      fromSocketId: client.id,
      sdp: payload.sdp,
    });
  }

  // WebRTC Signaling: Answer from Viewer to Broadcaster
  @SubscribeMessage('webrtc-answer')
  handleWebrtcAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { targetSocketId: string; sdp: any },
  ) {
    this.server.to(payload.targetSocketId).emit('webrtc-answer', {
      fromSocketId: client.id,
      sdp: payload.sdp,
    });
  }

  // WebRTC Signaling: ICE Candidate exchange
  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { targetSocketId: string; candidate: any },
  ) {
    this.server.to(payload.targetSocketId).emit('ice-candidate', {
      fromSocketId: client.id,
      candidate: payload.candidate,
    });
  }

  // Real-time Chat message over WebSockets
  @SubscribeMessage('send-chat')
  async handleSendChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { sessionId: string; message: string; userId?: string; userName?: string; userRole?: string; isModerator?: boolean },
  ) {
    const { sessionId, message, userId, userName, userRole, isModerator } = payload;
    if (!sessionId || !message?.trim()) return { success: false };

    const clientInfo = this.clients.get(client.id);
    const isBroadcaster = clientInfo?.role === 'broadcaster';

    const chatPayload = {
      id: `ws-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      sessionId,
      senderName: userName || (isBroadcaster ? 'المحاضر / الإدارة' : 'متداول'),
      userRole: userRole || (isBroadcaster ? 'INSTRUCTOR' : (userId ? 'TRADER' : 'GUEST')),
      isModerator: isModerator !== undefined ? isModerator : isBroadcaster,
      message: message.trim(),
      createdAt: new Date().toISOString(),
      isPinned: false,
    };

    // Prevent rapid duplicate insertion within 2 seconds
    try {
      const recentDuplicate = await this.prisma.liveChatMessage.findFirst({
        where: {
          liveSessionId: sessionId,
          message: chatPayload.message,
          createdAt: {
            gte: new Date(Date.now() - 2000),
          },
        },
      });

      if (recentDuplicate) {
        return { success: true, message: recentDuplicate };
      }
    } catch (err: any) {
      this.logger.warn(`Could not check recent duplicate: ${err.message}`);
    }

    try {
      if (userId && userId !== 'admin') {
        const created = await this.prisma.liveChatMessage.create({
          data: {
            liveSessionId: sessionId,
            userId,
            senderName: chatPayload.senderName,
            message: chatPayload.message,
            isModerator: chatPayload.isModerator,
          },
        });
        chatPayload.id = created.id;
      } else {
        const staffUser = await this.prisma.user.findFirst({
          where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
        });
        if (staffUser) {
          const created = await this.prisma.liveChatMessage.create({
            data: {
              liveSessionId: sessionId,
              userId: staffUser.id,
              senderName: chatPayload.senderName,
              message: chatPayload.message,
              isModerator: true,
            },
          });
          chatPayload.id = created.id;
        }
      }
    } catch (err: any) {
      this.logger.warn(`Could not persist chat message: ${err.message}`);
    }

    this.server.to(`session_${sessionId}`).emit('new-chat-message', chatPayload);
    return { success: true, message: chatPayload };
  }

  broadcastChatMessage(sessionId: string, chatPayload: any) {
    if (this.server) {
      this.server.to(`session_${sessionId}`).emit('new-chat-message', chatPayload);
    }
  }

  broadcastPinMessage(sessionId: string, messageId: string, isPinned: boolean) {
    if (this.server) {
      this.server.to(`session_${sessionId}`).emit('chat-message-pinned', { messageId, isPinned });
    }
  }

  broadcastDeleteMessage(sessionId: string, messageId: string) {
    if (this.server) {
      this.server.to(`session_${sessionId}`).emit('chat-message-deleted', { messageId });
    }
  }
}
