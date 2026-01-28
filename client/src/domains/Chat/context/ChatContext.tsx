import { createContext } from 'preact';
import { useContext, useState, useEffect, useRef, useCallback, useMemo } from 'preact/hooks';
import { useSignalEffect } from '@preact/signals';
import sparkMessagingClient from '../../../config/sparkMessaging';
import { ConnectionService } from '@/core/socket/ConnectionService';
import { ChatService } from '@/core/socket/ChatService';
import { RoomService } from '../services/RoomService';
import { FileTransferService } from '@/core/api/FileTransferService';
import { useAuth } from '@/core/hooks/useAuth';
import { authApi, workspaceApi, notificationApi } from '@/core/api/ApiService';
import { messagesSignal } from '../hooks/useOptimisticUpdate';
import { ChatRoom, ChatUser, Workspace } from '../types';
import { currentWorkspaceId, chatRoomList } from '@/stores/chatRoomsStore';

interface ChatContextType {
  isConnected: boolean;
  socketId: string | null;
  roomList: ChatRoom[];
  userList: ChatUser[];
  workspaceList: Workspace[];
  currentRoom: ChatRoom | null; // 현재 선택된 룸 추가
  services: {
    connection: ConnectionService;
    chat: ChatService;
    room: RoomService;
    fileTransfer: FileTransferService;
  };
  refreshRoomList: () => Promise<void>;
  refreshUserList: () => Promise<void>;
  refreshWorkspaceList: () => Promise<void>;
  setCurrentRoom: (room: ChatRoom | null) => void; // 설정 함수 추가
  isLoading: boolean;
  debugEnabled: boolean;
  toggleDebug: () => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: any }) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [roomList, setRoomList] = useState<ChatRoom[]>([]);
  const [userList, setUserList] = useState<ChatUser[]>([]);
  const [workspaceList, setWorkspaceList] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);

  // v2.2.0: 전역 Signal과 로컬 상태 동기화 (Reactivity 보장)
  // Signal이 변경될 때마다 Context의 roomList 상태를 업데이트하여 구독 중인 컴포넌트들을 리렌더링함
  useSignalEffect(() => {
    const signalValue = chatRoomList.value;
    if (Array.isArray(signalValue)) {
      setRoomList([...signalValue]);
    }
  });

  const updateRoomList = (rooms: ChatRoom[], isSocketUpdate = false) => {
    // v2.4.0: 소켓 우선 정책 (Socket-First Policy)
    const currentRooms = chatRoomList.value;

    const mergedRooms = rooms.map((newRoom) => {
      const existingRoom = currentRooms.find((r: any) => r._id === (newRoom as any)._id);
      if (existingRoom) {
        let finalUnreadCount = (newRoom as any).unreadCount;

        // v2.4.0: 소켓 업데이트가 아닌 경우(예: 일반 API 조회)에만 로컬 상태와 병합 시도
        // 소켓 업데이트(실시간 알림)인 경우 서버의 카운트를 100% 신뢰함
        if (!isSocketUpdate) {
          finalUnreadCount = Math.max(existingRoom.unreadCount || 0, (newRoom as any).unreadCount || 0);
        }

        return {
          ...newRoom,
          unreadCount: finalUnreadCount,
        };
      }
      return newRoom;
    });

    chatRoomList.value = [...mergedRooms] as any;
    // setRoomList는 useSignalEffect에서 자동으로 처리됨
  };
  const [debugEnabled, setDebugEnabled] = useState(localStorage.getItem('chat_debug_mode') === 'true');

  const connectionServiceRef = useRef<ConnectionService>(new ConnectionService(sparkMessagingClient));
  const chatServiceRef = useRef<ChatService>(new ChatService(sparkMessagingClient));
  const roomServiceRef = useRef<RoomService>(new RoomService(sparkMessagingClient, connectionServiceRef.current));
  const fileTransferServiceRef = useRef<FileTransferService>(
    new FileTransferService(sparkMessagingClient, connectionServiceRef.current, chatServiceRef.current),
  );

  const refreshRoomList = useCallback(async () => {
    try {
      const workspaceId = currentWorkspaceId.value;
      const rooms = await chatServiceRef.current.getRooms(workspaceId || undefined);
      updateRoomList(rooms);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  }, []);

  const refreshUserList = useCallback(async () => {
    try {
      const workspaceId = currentWorkspaceId.value;
      const response = await authApi.getUsers(workspaceId || undefined);
      setUserList(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, []);

  const refreshWorkspaceList = useCallback(async () => {
    try {
      const response = await workspaceApi.getWorkspaces();
      const workspaces = response.data;
      setWorkspaceList(workspaces);

      // v2.2.0: 워크스페이스가 있고 현재 선택된 워크스페이스가 없으면 첫 번째 것으로 자동 선택
      if (workspaces.length > 0 && !currentWorkspaceId.value) {
        currentWorkspaceId.value = workspaces[0]._id;
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    }
  }, []);

  const toggleDebug = useCallback(() => {
    setDebugEnabled((prev) => {
      const nextValue = !prev;
      localStorage.setItem('chat_debug_mode', String(nextValue));
      chatServiceRef.current.setDebugMode(nextValue);
      return nextValue;
    });
  }, []);

  useEffect(() => {
    if (user?.id) {
      chatServiceRef.current.setUserId(user.id);
    }

    const connectionService = connectionServiceRef.current;
    // const roomService = roomServiceRef.current; // Removed unused variable

    const unsubConnected = connectionService.onConnected(() => {
      setIsConnected(true);
      const status = connectionService.getConnectionStatus();
      setSocketId(status.socketId);
    });

    const unsubStateChange = connectionService.onConnectionStateChange((connected) => {
      setIsConnected(connected);
      if (connected) {
        const status = connectionService.getConnectionStatus();
        setSocketId(status.socketId);
      } else {
        setSocketId(null);
      }
    });

    const unsubError = connectionService.onError((error) => {
      console.error('❌ Chat Connection Error:', error);
      setIsConnected(false);
    });

    // v2.4.0: 전역 소켓 메시지 리스너 통합 (리스너 덮어쓰기 방지)
    const unsubGlobalMessages = connectionServiceRef.current['client'].onMessage((msg: any) => {
      // 0. 방 목록 새로고침
      // v2.4.0: 성능 최적화 - 채팅 메시지 및 진행률 관련 이벤트는 방 목록을 새로고침하지 않음
      // 이미 ROOM_LIST_UPDATED 또는 개별 메시지 이벤트를 통해 상태가 관리되기 때문
      const skipRefreshTypes = [
        'text', 'file', 'image', '3d', 'video', 'audio', 
        'MESSAGE_PROGRESS', 'MESSAGE_UPDATED', 
        'message-progress', 'message-updated'
      ];
      if (msg && !skipRefreshTypes.includes(msg.type)) {
        refreshRoomList();
      }

      // 1. 방 목록 업데이트 알림 수신
      if (msg.type === 'ROOM_LIST_UPDATED') {
        const updateData = msg.data || msg.content || {};
        
        // 데이터가 실제로 변경되었을 때만 처리 (최소한의 필터링)
        if (!updateData._id) return;

        const currentUserId = user?.id || (user as any)?._id;
        if (updateData.targetUserId && updateData.targetUserId !== currentUserId) return;

        const roomId = updateData._id;
        const currentRooms = chatRoomList.value;

        if (roomId) {
          if (updateData.isRemoved) {
            chatRoomList.value = currentRooms.filter((r: any) => r._id !== roomId) as any;
            return;
          }

          const roomExists = currentRooms.some((r: any) => r._id === roomId);
          let updatedRooms;

          if (roomExists) {
            updatedRooms = currentRooms.map((room: any) => {
              if (room._id === roomId) {
                const newUnreadCount = updateData.unreadCount !== undefined ? updateData.unreadCount : room.unreadCount;
                return {
                  ...room,
                  ...updateData,
                  unreadCount: newUnreadCount,
                  updatedAt: updateData.updatedAt || new Date().toISOString(),
                };
              }
              return room;
            });
          } else {
            updatedRooms = [updateData, ...currentRooms];
          }

          updatedRooms.sort(
            (a: any, b: any) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime(),
          );
          updateRoomList(updatedRooms as any, true);
        } else {
          refreshRoomList();
        }
      }

      // 2. 메시지 읽음 확인 처리
      if (msg.type === 'MESSAGE_READ') {
        const { roomId, userId } = msg.data || {};
        const currentMessages = messagesSignal.value;
        if (currentMessages.length > 0 && currentMessages[0].roomId === roomId) {
          messagesSignal.value = currentMessages.map((m) => {
            if (m.senderId !== userId && (!m.readBy || !m.readBy.includes(userId))) {
              return { ...m, readBy: [...(m.readBy || []), userId] };
            }
            return m;
          });
        }
      }

      // 3. 유저 상태 변경 감지
      if (msg.type === 'USER_STATUS_CHANGED') {
        const { userId, status } = msg.content || msg.data || {};
        if (userId) {
          setUserList((prev) => prev.map((u) => (u._id === userId ? { ...u, status } : u)));
        }
      }
    });

    // Initial load
    const init = async () => {
      setIsLoading(true);
      if (user && user.workspaces && user.workspaces.length > 0 && !currentWorkspaceId.value) {
        currentWorkspaceId.value = user.workspaces[0];
      }
      await Promise.all([refreshRoomList(), refreshUserList(), refreshWorkspaceList()]);

      try {
        const response = await notificationApi.syncNotifications();
        const pendingNotifications = response.data;
        if (pendingNotifications && pendingNotifications.length > 0) {
          if (pendingNotifications.length > 3) {
            window.dispatchEvent(new CustomEvent('api-info', { detail: { message: `[공지] ${pendingNotifications.length}개의 새로운 공지사항이 있습니다.` } }));
          } else {
            pendingNotifications.forEach((notif: any) => {
              window.dispatchEvent(new CustomEvent('api-info', { detail: { message: `[공지] ${notif.title}\n${notif.content}` } }));
            });
          }
        }
      } catch (error) {
        console.error('Failed to sync notifications:', error);
      }

      const status = connectionService.getConnectionStatus();
      if (status.isConnected) {
        setIsConnected(true);
        setSocketId(status.socketId);
      }
      setIsLoading(false);
    };

    init();

    return () => {
      unsubConnected();
      unsubStateChange();
      unsubError();
      unsubGlobalMessages();
    };
  }, [user?.id, refreshRoomList, refreshUserList, refreshWorkspaceList]);

  // 워크스페이스 변경 시 데이터 새로고침
  useEffect(() => {
    if (user?.id) {
      refreshRoomList();
      refreshUserList();
    }
  }, [currentWorkspaceId.value, user?.id, refreshRoomList, refreshUserList]);

  const value: ChatContextType = useMemo(
    () => ({
      isConnected,
      socketId,
      roomList,
      userList,
      workspaceList,
      currentRoom,
      services: {
        connection: connectionServiceRef.current,
        chat: chatServiceRef.current,
        room: roomServiceRef.current,
        fileTransfer: fileTransferServiceRef.current,
      },
      refreshRoomList,
      refreshUserList,
      refreshWorkspaceList,
      setCurrentRoom,
      isLoading,
      debugEnabled,
      toggleDebug,
    }),
    [
      isConnected,
      socketId,
      roomList,
      userList,
      workspaceList,
      currentRoom,
      refreshRoomList,
      refreshUserList,
      refreshWorkspaceList,
      isLoading,
      debugEnabled,
      toggleDebug,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
}
