import { useMemo } from 'preact/hooks';
import { Autocomplete, AutocompleteOption } from '@/ui-components/Autocomplete/Autocomplete';
import { Chip } from '@/ui-components/Chip/Chip';
import { Avatar } from '@/ui-components/Avatar/Avatar';
import { Flex } from '@/ui-components/Layout/Flex';
import { Stack } from '@/ui-components/Layout/Stack';
import type { ChatUser } from '../types';

export interface AutocompleteMemberProps {
  userList: ChatUser[];
  selectedUsers: ChatUser[];
  onUsersChange: (users: ChatUser[]) => void;
  currentUserId?: string;
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function AutocompleteMember({
  userList,
  selectedUsers,
  onUsersChange,
  currentUserId,
  placeholder = '사용자 검색',
  label,
  helperText,
  error = false,
  disabled = false,
  fullWidth = true,
}: AutocompleteMemberProps) {
  // 현재 사용자 제외한 사용자 목록
  const filteredUserList = useMemo(() => {
    return userList.filter((user) => user._id !== currentUserId);
  }, [userList, currentUserId]);

  // 선택된 사용자 ID Set
  const selectedUserIds = useMemo(() => {
    return new Set(selectedUsers.map((u) => u._id));
  }, [selectedUsers]);

  // Autocomplete 옵션으로 변환 (선택된 사용자는 disabled로 표시)
  const options: AutocompleteOption<ChatUser>[] = useMemo(() => {
    return filteredUserList.map((user) => ({
      label: user.username,
      value: user,
      disabled: selectedUserIds.has(user._id),
    }));
  }, [filteredUserList, selectedUserIds]);

  // 선택된 사용자 ID 배열
  const selectedValues = useMemo(() => {
    return selectedUsers;
  }, [selectedUsers]);

  // 옵션 필터링 (검색 기능만, 선택된 사용자는 disabled로 표시되므로 제외하지 않음)
  const filterOptions = (options: AutocompleteOption<ChatUser>[], inputValue: string): AutocompleteOption<ChatUser>[] => {
    // 검색어가 없으면 모든 옵션 반환
    if (!inputValue.trim()) {
      return options;
    }

    // 검색어가 있으면 필터링
    const lowerInput = inputValue.toLowerCase();
    return options.filter((option) => {
      const user = option.value;
      return (
        user.username.toLowerCase().includes(lowerInput) ||
        user.email?.toLowerCase().includes(lowerInput) ||
        false
      );
    });
  };

  // 옵션 렌더링
  const renderOption = (option: AutocompleteOption<ChatUser>) => {
    const user = option.value;

    return (
      <Flex align="center" gap="sm" style={{ width: '100%' }}>
        <Avatar src={user.profileImage || user.avatar} size="sm">
          {user.username.substring(0, 1)}
        </Avatar>
        <Flex direction="column" style={{ flex: 1, minWidth: 0 }}>
          <span>{user.username}</span>
          {user.email && (
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{user.email}</span>
          )}
        </Flex>
      </Flex>
    );
  };

  // 선택된 값 렌더링 (Chip으로 표시)
  const renderValue = (value: ChatUser | ChatUser[], getItemProps: (index: number) => any) => {
    const values = Array.isArray(value) ? value : [value];
    if (values.length === 0) return null;

    return (
      <>
        {values.map((user, index) => (
          <Chip
            key={user._id}
            label={user.username}
            onDelete={() => {
              const newUsers = selectedUsers.filter((u) => u._id !== user._id);
              onUsersChange(newUsers);
            }}
            variant="primary"
            size="sm"
            avatar={
              <Avatar src={user.profileImage || user.avatar} size="sm">
                {user.username.substring(0, 1)}
              </Avatar>
            }
            {...getItemProps(index)}
          />
        ))}
      </>
    );
  };

  return (
    <Stack spacing="sm">
      <Autocomplete<ChatUser>
        options={options}
        value={selectedValues}
        onChange={(newValue) => {
          if (Array.isArray(newValue)) {
            onUsersChange(newValue);
          } else if (newValue === null) {
            onUsersChange([]);
          }
        }}
        multiple
        filterOptions={filterOptions}
        renderOption={renderOption}
        renderValue={renderValue}
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
