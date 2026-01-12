import { createContext } from 'preact';
import { useContext, useState, useEffect, useRef } from 'preact/hooks';
import { useSignalEffect } from '@preact/signals';
import sparkMessagingClient from '../../../config/sparkMessaging';
import { ConnectionService } from '@/core/socket/ConnectionService';
import { ChatService } from '@/core/socket/ChatService';
import { RoomService } from '../services/RoomService';
import { FileTransferService } from '@/core/api/FileTransferService';
import { useAuth } from '@/core/hooks/useAuth';
import { authApi, workspaceApi } from '@/core/api/ApiService';
import { messagesSignal } from '../hooks/useOptimisticUpdate';
import { ChatRoom, ChatUser, Workspace } from '../types';
import { currentWorkspaceId, chatRoomList } from '@/stores/chatRoomsStore';

interface ChatContextType {
  isConnected: boolean;
  socketId: string | null;
  roomList: ChatRoom[];
  userList: ChatUser[];
  workspaceList: Workspace[];
  services: {
    connection: ConnectionService;
    chat: ChatService;
    room: RoomService;
    fileTransfer: FileTransferService;
  };
  refreshRoomList: () => Promise<void>;
  refreshUserList: () => Promise<void>;
  refreshWorkspaceList: () => Promise<void>;
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

  // v2.2.0: 전역 Signal과 로컬 상태 동기화 (Reactivity 보장)
  // Signal이 변경될 때마다 Context의 roomList 상태를 업데이트하여 구독 중인 컴포넌트들을 리렌더링함
  useSignalEffect(() => {
    const signalValue = chatRoomList.value;
    if (Array.isArray(signalValue)) {
      setRoomList([...signalValue] as any);
    }
  });

  const updateRoomList = (rooms: ChatRoom[]) => {
    chatRoomList.value = rooms as any;
    setRoomList(rooms);
  };
  const [debugEnabled, setDebugEnabled] = useState(localStorage.getItem('chat_debug_mode') === 'true');

  const connectionServiceRef = useRef<ConnectionService>(new ConnectionService(sparkMessagingClient));
  const chatServiceRef = useRef<ChatService>(new ChatService(sparkMessagingClient));
  const roomServiceRef = useRef<RoomService>(new RoomService(sparkMessagingClient, connectionServiceRef.current));
  const fileTransferServiceRef = useRef<FileTransferService>(
    new FileTransferService(sparkMessagingClient, connectionServiceRef.current, chatServiceRef.current),
  );

  const refreshRoomList = async () => {
    try {
      const workspaceId = currentWorkspaceId.value;
      const rooms = await chatServiceRef.current.getRooms(workspaceId || undefined);
      updateRoomList(rooms);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  };

  const refreshUserList = async () => {
    try {
      const workspaceId = currentWorkspaceId.value;
      const response = await authApi.getUsers(workspaceId || undefined);
      setUserList(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const refreshWorkspaceList = async () => {
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
  };

  const toggleDebug = () => {
    const nextValue = !debugEnabled;
    setDebugEnabled(nextValue);
    chatServiceRef.current.setDebugMode(nextValue);
  };

  useEffect(() => {
    if (user) {
      chatServiceRef.current.setUserId(user.id);
    }

    const connectionService = connectionServiceRef.current;
    const roomService = roomServiceRef.current;

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

    const unsubRoomMessage = roomService.onMessage(() => {
      refreshRoomList();
    });

    // v2.2.0: 방 목록 업데이트 알림 수신
    const unsubRoomListUpdate = connectionServiceRef.current['client'].onMessage((msg: any) => {
      // 서버에서 보내는 이벤트 타입이 'ROOM_LIST_UPDATED'인지 확인
      if (msg.type === 'ROOM_LIST_UPDATED') {
        const updateData = msg.data || msg.content || {}; // content 필드도 확인

        console.log('[ChatContext] Received ROOM_LIST_UPDATED:', updateData);

        // 데이터가 있는 경우 로컬 상태 즉시 반영 (Signal 활용)
        if (updateData.roomId) {
          const { roomId, lastMessage, unreadCountIncrement } = updateData;

          const currentRooms = chatRoomList.value;
          const updatedRooms = currentRooms.map((room: any) => {
            if (room._id === roomId) {
              return {
                ...room,
                lastMessage: lastMessage || room.lastMessage,
                unreadCount: (room.unreadCount || 0) + (unreadCountIncrement || 0),
                updatedAt: new Date().toISOString(),
              };
            }
            return room;
          });

          // 리스트 상단으로 이동 (Sorting)
          updatedRooms.sort(
            (a: any, b: any) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime(),
          );

          updateRoomList(updatedRooms as any);
        } else {
          // 데이터가 없으면 기존처럼 전체 새로고침
          refreshRoomList();
        }
      }
      if (msg.type === 'MESSAGE_READ') {
        // 읽음 처리 시 메시지 목록의 readBy를 업데이트하기 위해 이벤트를 전파하거나 직접 처리
        // 여기서는 간단히 현재 열려있는 방이라면 메시지 목록을 갱신하도록 처리
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
    });

    // v2.2.0: 실시간 유저 상태 변경 감지
    const unsubStatusChange = connectionServiceRef.current['client'].onMessage((msg: any) => {
      if (msg.type === 'USER_STATUS_CHANGED') {
        const { userId, status } = msg.content;
        setUserList((prev) => prev.map((user) => (user._id === userId ? { ...user, status } : user)));
      }
    });

    // Initial load
    const init = async () => {
      setIsLoading(true);

      // v2.2.0: 유저 정보에 이미 워크스페이스가 있다면 초기값으로 설정
      if (user && user.workspaces && user.workspaces.length > 0 && !currentWorkspaceId.value) {
        currentWorkspaceId.value = user.workspaces[0];
      }

      await Promise.all([refreshRoomList(), refreshUserList(), refreshWorkspaceList()]);

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
      unsubRoomMessage();
      unsubStatusChange();
      unsubRoomListUpdate();
    };
  }, [user]);

  // 워크스페이스 변경 시 데이터 새로고침
  useEffect(() => {
    if (user) {
      refreshRoomList();
      refreshUserList();
    }
  }, [currentWorkspaceId.value]);

  const value: ChatContextType = {
    isConnected,
    socketId,
    roomList,
    userList,
    workspaceList,
    services: {
      connection: connectionServiceRef.current,
      chat: chatServiceRef.current,
      room: roomServiceRef.current,
      fileTransfer: fileTransferServiceRef.current,
    },
    refreshRoomList,
    refreshUserList,
    refreshWorkspaceList,
    isLoading,
    debugEnabled,
    toggleDebug,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
}
