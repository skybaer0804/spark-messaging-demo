import { createContext } from 'preact';
import { useContext, useState, useEffect, useRef } from 'preact/hooks';
import sparkMessagingClient from '../../../config/sparkMessaging';
import { ConnectionService } from '@/core/socket/ConnectionService';
import { ChatService } from '@/core/socket/ChatService';
import { RoomService } from '../services/RoomService';
import { FileTransferService } from '@/core/api/FileTransferService';
import { useAuth } from '@/core/hooks/useAuth';
import { authApi, orgApi } from '@/core/api/ApiService';
import { ChatRoom, ChatUser } from '../types';
import { Organization } from '../hooks/useChatApp';

interface ChatContextType {
  isConnected: boolean;
  socketId: string | null;
  roomList: ChatRoom[];
  userList: ChatUser[];
  orgList: Organization[];
  services: {
    connection: ConnectionService;
    chat: ChatService;
    room: RoomService;
    fileTransfer: FileTransferService;
  };
  refreshRoomList: () => Promise<void>;
  refreshUserList: () => Promise<void>;
  refreshOrgList: () => Promise<void>;
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
  const [orgList, setOrgList] = useState<Organization[]>([]);
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
      const rooms = await chatServiceRef.current.getRooms();
      setRoomList(rooms);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  };

  const refreshUserList = async () => {
    try {
      const response = await authApi.getUsers();
      setUserList(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const refreshOrgList = async () => {
    try {
      const response = await orgApi.getOrganizations();
      setOrgList(response.data);
    } catch (error) {
      console.error('Failed to load organizations:', error);
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

    // Initial load
    const init = async () => {
      setIsLoading(true);
      await Promise.all([refreshRoomList(), refreshUserList(), refreshOrgList()]);

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
    };
  }, [user]);

  const value: ChatContextType = {
    isConnected,
    socketId,
    roomList,
    userList,
    orgList,
    services: {
      connection: connectionServiceRef.current,
      chat: chatServiceRef.current,
      room: roomServiceRef.current,
      fileTransfer: fileTransferServiceRef.current,
    },
    refreshRoomList,
    refreshUserList,
    refreshOrgList,
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
