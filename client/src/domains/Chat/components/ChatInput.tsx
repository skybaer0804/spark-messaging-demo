import { useRef } from 'preact/hooks';
import { memo } from 'preact/compat';
import { FilePreview } from './FilePreview';
import { Input } from '@/ui-components/Input/Input';
import { IconButton } from '@/ui-components/Button/IconButton';
import { Paper } from '@/ui-components/Paper/Paper';
import { Stack } from '@/ui-components/Layout/Stack';
import { Flex } from '@/ui-components/Layout/Flex';
import { Box } from '@/ui-components/Layout/Box';
import { IconPaperclip, IconSend } from '@tabler/icons-react';
import './Chat.scss';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  selectedFiles: File[];
  uploadingFile?: File | null;
  uploadProgress?: number;
  isConnected: boolean;
  placeholder?: string;
  showFileUpload?: boolean;
  onSendMessage: () => void;
  onSendFile: () => void;
  onFileSelect: (e: Event) => void;
  onFileRemove: (index: number) => void;
  onKeyPress: (e: KeyboardEvent) => void;
  classNamePrefix?: string;
}

function ChatInputComponent({
  input,
  setInput,
  selectedFiles,
  uploadingFile,
  uploadProgress = 0,
  isConnected,
  placeholder,
  showFileUpload = true,
  onSendMessage,
  onSendFile,
  onFileSelect,
  onFileRemove,
  onKeyPress,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Paper
      square
      elevation={4}
      padding="md"
      style={{ flexShrink: 0, borderTop: '1px solid var(--color-border-default)' }}
    >
      <Stack spacing="sm">
        <FilePreview
          files={selectedFiles}
          uploadingFile={uploadingFile}
          uploadProgress={uploadProgress}
          onRemove={onFileRemove}
        />
        <Box style={{ position: 'relative', width: '100%' }}>
          <Input
            multiline
            value={input}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              setInput(target.value);
              // 높이 자동 조절
              target.style.height = 'auto';
              const scrollHeight = target.scrollHeight;
              const lineHeight = parseFloat(getComputedStyle(target).lineHeight) || 24;
              const minHeight = lineHeight * 2 + 24;
              const maxHeight = lineHeight * 5 + 24;
              const targetHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
              target.style.height = `${targetHeight}px`;
            }}
            onKeyPress={onKeyPress}
            placeholder={placeholder || (isConnected ? '메시지를 입력하세요...' : '연결 중...')}
            disabled={!isConnected}
            fullWidth
            rows={2}
            style={{ paddingRight: '80px' }} // 아이콘 버튼 공간 확보
          />
          <Flex
            gap="xs"
            align="center"
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
            }}
          >
            {showFileUpload && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={onFileSelect}
                  style={{ display: 'none' }}
                  multiple
                  accept="image/*,.xlsx,.xls,.csv,.md,.docx,.doc,.pdf"
                />
                <IconButton onClick={() => fileInputRef.current?.click()} color="secondary" size="small">
                  <IconPaperclip size={18} />
                </IconButton>
              </>
            )}
            <IconButton
              onClick={selectedFiles.length > 0 ? onSendFile : onSendMessage}
              color="primary"
              disabled={!isConnected || (!input.trim() && selectedFiles.length === 0)}
              size="small"
            >
              <IconSend size={18} />
            </IconButton>
          </Flex>
        </Box>
      </Stack>
    </Paper>
  );
}

// memo로 메모이제이션하여 props가 변경되지 않으면 리렌더링 방지
export const ChatInput = memo(ChatInputComponent, (prevProps, nextProps) => {
  return (
    prevProps.input === nextProps.input &&
    prevProps.isConnected === nextProps.isConnected &&
    prevProps.uploadProgress === nextProps.uploadProgress &&
    prevProps.selectedFiles.length === nextProps.selectedFiles.length &&
    prevProps.classNamePrefix === nextProps.classNamePrefix &&
    prevProps.showFileUpload === nextProps.showFileUpload &&
    prevProps.placeholder === nextProps.placeholder
  );
});
