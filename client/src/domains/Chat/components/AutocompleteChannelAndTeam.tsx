import { useMemo } from 'preact/hooks';
import { Autocomplete, AutocompleteOption } from '@/ui-components/Autocomplete/Autocomplete';
import { Avatar } from '@/ui-components/Avatar/Avatar';
import { Flex } from '@/ui-components/Layout/Flex';
import { Stack } from '@/ui-components/Layout/Stack';
import { Typography } from '@/ui-components/Typography/Typography';
import { IconHash, IconLock, IconHierarchy } from '@tabler/icons-preact';
import type { ChatRoom } from '../types';

export interface AutocompleteChannelAndTeamProps {
  roomList: ChatRoom[];
  selectedRoom: ChatRoom | null;
  onRoomChange: (room: ChatRoom | null) => void;
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function AutocompleteChannelAndTeam({
  roomList,
  selectedRoom,
  onRoomChange,
  placeholder = '채널 또는 그룹 선택',
  label = '상위 채널 또는 그룹',
  helperText,
  error = false,
  disabled = false,
  fullWidth = true,
}: AutocompleteChannelAndTeamProps) {
  // 토론의 부모가 될 수 있는 룸 목록 (공개 채널, 비공개 채널, 팀)
  const filteredRoomList = useMemo(() => {
    return roomList.filter((room) => ['public', 'private', 'team'].includes(room.type));
  }, [roomList]);

  // Autocomplete 옵션으로 변환
  const options: AutocompleteOption<ChatRoom>[] = useMemo(() => {
    return filteredRoomList.map((room) => ({
      label: room.name || room.displayName || '이름 없음',
      value: room,
    }));
  }, [filteredRoomList]);

  // 옵션 필터링
  const filterOptions = (options: AutocompleteOption<ChatRoom>[], inputValue: string): AutocompleteOption<ChatRoom>[] => {
    if (!inputValue.trim()) {
      return options;
    }

    const lowerInput = inputValue.toLowerCase();
    return options.filter((option) => {
      const room = option.value;
      const roomName = (room.name || room.displayName || '').toLowerCase();
      return roomName.includes(lowerInput);
    });
  };

  // 룸 타입별 아이콘 렌더링
  const getRoomIcon = (type: string) => {
    switch (type) {
      case 'public':
        return <IconHash size={18} />;
      case 'private':
        return <IconLock size={18} />;
      case 'team':
        return <IconHierarchy size={18} />;
      default:
        return <IconHash size={18} />;
    }
  };

  // 옵션 렌더링
  const renderOption = (option: AutocompleteOption<ChatRoom>) => {
    const room = option.value;

    return (
      <Flex align="center" gap="sm" style={{ width: '100%' }}>
        <Avatar src={room.displayAvatar || undefined} size="sm">
          {getRoomIcon(room.type)}
        </Avatar>
        <Flex direction="column" style={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body-medium" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {room.name || room.displayName}
          </Typography>
          {room.description && (
            <Typography variant="caption" color="text-secondary" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {room.description}
            </Typography>
          )}
        </Flex>
      </Flex>
    );
  };

  return (
    <Stack spacing="sm">
      <Autocomplete<ChatRoom>
        options={options}
        value={selectedRoom || undefined}
        onChange={(newValue) => {
          onRoomChange(newValue as ChatRoom | null);
        }}
        filterOptions={filterOptions}
        renderOption={renderOption}
        placeholder={placeholder}
        label={label}
        helperText={helperText}
        error={error}
        disabled={disabled}
        fullWidth={fullWidth}
        openOnFocus
        autoHighlight
        clearOnEscape
      />
    </Stack>
  );
}
