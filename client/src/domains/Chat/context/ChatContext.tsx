import { createContext } from 'preact';
import { useContext, useState, useEffect, useRef } from 'preact/hooks';
import sparkMessagingClient from '../../../config/sparkMessaging';
import { ConnectionService } from '@/core/socket/ConnectionService';
import { ChatService } from '@/core/socket/ChatService';
import { RoomService } from '../services/RoomService';
import { FileTransferService } from '@/core/api/FileTransferService';
import { useAuth } from '@/core/hooks/useAuth';
import { authApi, workspaceApi } from '@/core/api/ApiService';
import { ChatRoom, ChatUser, Workspace } from '../types';
import { currentWorkspaceId } from '@/stores/chatRoomsStore';

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
      setRoomList(rooms);
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
      setWorkspaceList(response.data);
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
