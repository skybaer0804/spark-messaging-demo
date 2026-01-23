import { useState, useEffect, useRef, useMemo } from 'preact/hooks';
import { memo } from 'preact/compat';
import { Paper } from '@/ui-components/Paper/Paper';
import { List } from '@/ui-components/List/List';
import { Avatar } from '@/ui-components/Avatar/Avatar';
import { Typography } from '@/ui-components/Typography/Typography';
import { Flex } from '@/ui-components/Layout/Flex';
import { ChatUser } from '../../../types';
import { useMentionPicker } from './hooks/useMentionPicker';
import './MentionPicker.scss';

interface MentionPickerProps {
  members: ChatUser[];
  roomMembers: ChatUser[];
  search: string;
  onSelect: (user: ChatUser | 'all' | 'here') => void;
  onClose: () => void;
  anchorRef: any;
}

function MentionPickerComponent({ members, roomMembers, search, onSelect, onClose, anchorRef }: MentionPickerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const position = useMentionPicker(anchorRef, true);
  const pickerRef = useRef<HTMLDivElement>(null);

  const specialMentions: Array<{ _id: 'all' | 'here'; username: string; description: string }> = [
    { _id: 'all', username: 'all', description: '이 대화방의 모든 이에게 알림' },
    { _id: 'here', username: 'here', description: '이 대화방에 있는 활성 사용자에게 알립니다.' },
  ];

  // 1. 중복 제거 및 검색 필터링
  // roomMembers에 있는 유저가 members(전체 유저)에도 있을 수 있으므로 ID 기준으로 유니크하게 합침
  const filteredMembers = members.filter(m => 
    m.username.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSpecial = specialMentions.filter(m => 
    m.username.toLowerCase().includes(search.toLowerCase())
  );

  const allItems = [...filteredSpecial, ...filteredMembers];

  // 방에 있는지 확인하는 헬퍼 함수
  // Set으로 최적화: O(n) some() 대신 O(1) Set.has() 사용
  const roomMemberIds = useMemo(() => {
    return new Set(roomMembers.map(rm => rm._id));
  }, [roomMembers]);

  const isInRoom = (userId: string) => {
    return roomMemberIds.has(userId);
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % allItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + allItems.length) % allItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allItems[selectedIndex]) {
          const item = allItems[selectedIndex];
          onSelect(item._id === 'all' || item._id === 'here' ? item._id : item as ChatUser);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, allItems, onSelect, onClose]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (pickerRef.current && !pickerRef.current.contains(target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (allItems.length === 0) return null;

  return (
    <div
      ref={pickerRef}
      className="mention-picker"
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 1100,
        visibility: position.isReady ? 'visible' : 'hidden',
      }}
    >
      <Paper elevation={8} className="mention-picker__paper">
        <Typography variant="caption" className="mention-picker__title" style={{ display: 'block', borderBottom: '1px solid var(--color-border-default)', padding: 'var(--space-gap-xs)' }}>
          사람들
        </Typography>
        <List className="mention-picker__list">
          {allItems.map((item, index) => {
            const isSelected = index === selectedIndex;
            const isSpecial = item._id === 'all' || item._id === 'here';
            
            return (
              <div
                key={item._id}
                className={`mention-item ${isSelected ? 'selected' : ''} chat-app__sidebar-item ${isSelected ? 'chat-app__sidebar-item--focused' : ''}`}
                onClick={() => onSelect(isSpecial ? item._id as any : item as ChatUser)}
                style={{
                  cursor: 'pointer',
                  margin: '0',
                  padding: '8px 12px',
                  borderRadius: '0',
                  borderBottom: index < allItems.length - 1 ? '1px solid var(--color-bg-subtle)' : 'none'
                }}
              >
                <Flex align="center" gap="sm" justify="space-between" style={{ width: '100%' }}>
                  <Flex align="center" gap="md">
                    <div className="avatar">
                      {isSpecial ? (
                        <Avatar size="sm" variant="rounded" style={{ backgroundColor: '#64748b', color: '#fff' }}>
                          {item.username.substring(0, 1).toUpperCase()}
                        </Avatar>
                      ) : (
                        <>
                          <Avatar 
                            src={(item as ChatUser).profileImage || (item as ChatUser).avatar} 
                            variant="rounded"
                            size="sm" 
                            style={{ backgroundColor: '#23D5AB' }}
                          >
                            {item.username.substring(0, 1).toUpperCase()}
                          </Avatar>
                          <div className={`avatar-status avatar-status--${(item as ChatUser).status || 'offline'}`} />
                        </>
                      )}
                    </div>
                    <div className="chat-app__sidebar-item-content">
                      <div className="chat-app__sidebar-item-name" style={{ color: 'var(--text-primary)', fontWeight: isSelected ? 700 : 500 }}>
                        {item.username}
                      </div>
                      <div className="chat-app__sidebar-item-sub" style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                        {isSpecial ? (item as { _id: 'all' | 'here'; username: string; description: string }).description : `${(item as ChatUser).status || 'offline'} • ${(item as ChatUser).role || 'Member'}`}
                      </div>
                    </div>
                  </Flex>
                  {!isSpecial && !isInRoom(item._id) && (
                    <Typography variant="caption" color="error" style={{ marginLeft: 'auto', fontWeight: 600 }}>
                      채널에 없음
                    </Typography>
                  )}
                </Flex>
              </div>
            );
          })}
        </List>
      </Paper>
    </div>
  );
}

export const MentionPicker = memo(MentionPickerComponent);
