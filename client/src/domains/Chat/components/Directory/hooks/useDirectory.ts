import { useState, useMemo } from 'preact/hooks';
import { useChatApp } from '../../../hooks/useChatApp';
import { useRouterState } from '@/routes/RouterState';

export const useDirectory = () => {
  const [activeTab, setActiveTab] = useState<'channel' | 'team' | 'user'>('channel');
  const { roomList, userList, handleRoomSelect, handleCreateRoom } = useChatApp();
  const { pathname, navigate } = useRouterState();

  const filteredChannels = useMemo(() => roomList.filter((r) => r.type === 'public'), [roomList]);

  const filteredTeams = useMemo(() => roomList.filter((r) => r.type === 'team'), [roomList]);

  const startDirectChat = async (userId: string) => {
    await handleCreateRoom('direct', { members: [userId] });
  };

  const onRoomSelect = (roomId: string) => {
    const room = roomList.find((r) => r._id === roomId);
    if (room) {
      handleRoomSelect(room);
      if (pathname !== `/chatapp/chat/${roomId}`) {
        navigate(`/chatapp/chat/${roomId}`);
      }
    }
  };

  return {
    activeTab,
    setActiveTab,
    filteredChannels,
    filteredTeams,
    userList,
    onRoomSelect,
    startDirectChat,
  };
};
