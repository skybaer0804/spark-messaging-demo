import { useState, useEffect } from 'preact/hooks';
import { IconButton } from '@/ui-components/Button/IconButton';
import { IconMessageCircle, IconHash, IconHierarchy, IconEdit } from '@tabler/icons-preact';

interface ChatCreateMenuProps {
  setShowInviteList: (val: boolean) => void;
  setShowCreateChannelDialog: (val: boolean) => void;
  setShowCreateTeamDialog: (val: boolean) => void;
}

export const ChatCreateMenu = ({
  setShowInviteList,
  setShowCreateChannelDialog,
  setShowCreateTeamDialog,
}: ChatCreateMenuProps) => {
  const [showCreateMenu, setShowCreateMenu] = useState(false);

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
    </>
  );
};
