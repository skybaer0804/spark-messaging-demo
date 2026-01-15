import { useState, useEffect } from 'preact/hooks';
import { IconButton } from '@/ui-components/Button/IconButton';
import { IconMessageCircle, IconHash, IconHierarchy, IconEdit } from '@tabler/icons-preact';
import { DialogChatOne } from '../DialogChatOne';
import type { ChatUser } from '../../types';

interface ChatCreateMenuProps {
  userList: ChatUser[];
  selectedUserIds: string[];
  toggleUserSelection: (userId: string) => void;
  handleCreateRoom: (type: 'direct' | 'discussion') => void;
  roomIdInput: string;
  setRoomIdInput: (val: string) => void;
  setShowCreateChannelDialog: (val: boolean) => void;
  setShowCreateTeamDialog: (val: boolean) => void;
}

export const ChatCreateMenu = ({
  userList,
  selectedUserIds,
  toggleUserSelection,
  handleCreateRoom,
  roomIdInput,
  setRoomIdInput,
  setShowCreateChannelDialog,
  setShowCreateTeamDialog,
}: ChatCreateMenuProps) => {
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showInviteList, setShowInviteList] = useState(false);

  useEffect(() => {
    const handleClick = () => {
      setShowCreateMenu(false);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <>
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          setShowCreateMenu(!showCreateMenu);
        }}
      >
        <IconEdit size={20} />
      </IconButton>

      {showCreateMenu && (
        <div className="chat-app__create-menu" onClick={(e) => e.stopPropagation()}>
          <div className="chat-app__create-menu-header">새로 만들기</div>
          <div
            className="chat-app__create-menu-item"
            onClick={() => {
              setShowInviteList(true);
              setShowCreateMenu(false);
            }}
          >
            <IconMessageCircle size={18} className="icon" /> 1:1 대화방
          </div>
          <div className="chat-app__create-menu-item">
            <IconMessageCircle size={18} className="icon" /> 토론
          </div>
          <div
            className="chat-app__create-menu-item"
            onClick={() => {
              setShowCreateChannelDialog(true);
              setShowCreateMenu(false);
            }}
          >
            <IconHash size={18} className="icon" /> 채널
          </div>
          <div
            className="chat-app__create-menu-item"
            onClick={() => {
              setShowCreateTeamDialog(true);
              setShowCreateMenu(false);
            }}
          >
            <IconHierarchy size={18} className="icon" /> 팀
          </div>
        </div>
      )}

      <DialogChatOne
        open={showInviteList}
        onClose={() => setShowInviteList(false)}
        userList={userList}
        selectedUserIds={selectedUserIds}
        toggleUserSelection={toggleUserSelection}
        handleCreateRoom={handleCreateRoom}
        roomIdInput={roomIdInput}
        setRoomIdInput={setRoomIdInput}
      />
    </>
  );
};
