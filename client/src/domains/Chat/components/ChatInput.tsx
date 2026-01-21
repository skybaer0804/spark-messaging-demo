import { useRef, useState, useEffect } from 'preact/hooks';
import { memo, lazy, Suspense } from 'preact/compat';
import { FilePreview } from './FilePreview';
import { Input } from '@/ui-components/Input/Input';
import { Paper } from '@/ui-components/Paper/Paper';
import { Stack } from '@/ui-components/Layout/Stack';
import { MessageInputToolbar } from './MessageInput/MessageInputToolbar';
import { AddLinkModal } from './MessageInput/AddLinkModal';
import { MentionPicker } from './MessageInput/MentionPicker/MentionPicker';
import { useFormatting } from './MessageInput/hooks/useFormatting';
import './Chat.scss';

// 이모지 피커 lazy loading
const EmojiPicker = lazy(() => import('./MessageInput/EmojiPicker/EmojiPicker').then(module => ({ default: module.EmojiPicker })));

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  members?: any[];
  roomMembers?: any[];
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
  members = [],
  roomMembers = [],
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const savedSelectionRef = useRef<{ start: number; end: number } | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPos, setMentionPos] = useState(0);
  const [selectedTextForLink, setSelectedTextForLink] = useState('');

  // @ 감지 및 MentionPicker 제어
  useEffect(() => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = input.substring(0, cursorPos);
    const lastAtIdx = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIdx !== -1 && (lastAtIdx === 0 || textBeforeCursor[lastAtIdx - 1] === ' ')) {
      const searchStr = textBeforeCursor.substring(lastAtIdx + 1);
      // 공백이 포함되지 않은 경우에만 멘션 모드 유지
      if (!searchStr.includes(' ')) {
        setMentionSearch(searchStr);
        setMentionOpen(true);
        setMentionPos(lastAtIdx);
        return;
      }
    }
    
    setMentionOpen(false);
  }, [input]);

  // 포맷팅 훅 (단축키 핸들러 포함)
  const { applyFormat, handleKeyDown: handleFormatKeyDown, setIsComposing: setFormattingComposing, saveSelection, insertLink } = useFormatting({
    setInput,
  });

  // textarea ref 업데이트 (Input 컴포넌트 내부의 textarea를 찾아서 저장)
  useEffect(() => {
    const updateTextareaRef = () => {
      const textarea = document.querySelector('.chat-input-container textarea') as HTMLTextAreaElement;
      if (textarea) {
        textareaRef.current = textarea;
      }
    };
    
    updateTextareaRef();
    // input이 변경될 때마다 ref 업데이트
    const interval = setInterval(updateTextareaRef, 100);
    return () => clearInterval(interval);
  }, [input]);

  return (
    <Paper square elevation={4} padding="md" style={{ flexShrink: 0 }}>
      <Stack spacing="sm">
        <FilePreview
          files={selectedFiles}
          uploadingFile={uploadingFile}
          uploadProgress={uploadProgress}
          onRemove={onFileRemove}
        />
        <div ref={containerRef} className="chat-input-container" style={{ position: 'relative', width: '100%' }}>
          <Input
            multiline
            value={input}
            onCompositionStart={() => {
              setIsComposing(true);
              setFormattingComposing(true);
            }}
            onCompositionEnd={() => {
              setIsComposing(false);
              setFormattingComposing(false);
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              setInput(target.value);
              
              // textarea ref 업데이트
              textareaRef.current = target;
              
              // 높이 자동 조절
              target.style.height = 'auto';
              const scrollHeight = target.scrollHeight;
              const lineHeight = parseFloat(getComputedStyle(target).lineHeight) || 24;
              const minHeight = lineHeight * 2 + 24;
              const maxHeight = lineHeight * 5 + 24;
              const targetHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
              target.style.height = `${targetHeight}px`;
              // 한글 입력 시 포커스 유지 로직 최적화
              if (isComposing) {
                const inputElement = e.currentTarget;
                requestAnimationFrame(() => {
                  if (document.activeElement !== inputElement) {
                    inputElement.focus();
                  }
                });
              }
            }}
            onKeyPress={(e) => {
              if (!isComposing) {
                onKeyPress(e);
              }
            }}
            onKeyDown={(e) => {
              // 포맷팅 단축키 처리
              handleFormatKeyDown(e);
              
              // Ctrl+L (링크 모달 열기)
              const isModifierPressed = e.ctrlKey || e.metaKey;
              if (isModifierPressed && e.key.toLowerCase() === 'l' && !isComposing) {
                e.preventDefault();
                // 현재 선택된 텍스트 가져오기
                const target = e.target as HTMLTextAreaElement;
                // textarea ref 업데이트
                textareaRef.current = target;
                const start = target.selectionStart;
                const end = target.selectionEnd;
                // 선택 영역 저장 (모달이 닫힌 후 사용)
                savedSelectionRef.current = { start, end };
                const selectedText = start !== end ? target.value.substring(start, end) : '';
                setSelectedTextForLink(selectedText);
                setLinkModalOpen(true);
              }
              // 기존 onKeyPress는 onKeyPress 이벤트에서만 처리
            }}
            placeholder={placeholder || (isConnected ? '메시지를 입력하세요...' : '연결 중...')}
            disabled={!isConnected}
            fullWidth
            rows={2}
            style={{ paddingBottom: '48px', borderRadius: '8px 8px 0 0' }} // 툴바 공간 확보 및 상단 모서리만 둥글게
          />
          {/* 파일 입력 (숨김) */}
          {showFileUpload && (
            <input
              ref={fileInputRef}
              type="file"
              onChange={onFileSelect}
              style={{ display: 'none' }}
              multiple
              accept="image/*,video/*,audio/*,.xlsx,.xls,.csv,.md,.docx,.doc,.pdf,.txt"
            />
          )}

          {/* 포맷팅 툴바 */}
          <MessageInputToolbar
            onFormat={(type) => {
              if (type === 'link') {
                // 링크 버튼 클릭 시 모달 열기
                // textarea ref가 있으면 사용, 없으면 activeElement 사용
                const targetTextarea = textareaRef.current || (document.activeElement as HTMLTextAreaElement);
                if (targetTextarea && targetTextarea.tagName === 'TEXTAREA') {
                  // textarea ref 업데이트
                  if (!textareaRef.current) {
                    textareaRef.current = targetTextarea;
                  }
                  const start = targetTextarea.selectionStart;
                  const end = targetTextarea.selectionEnd;
                  // 선택 영역 저장 (모달이 닫힌 후 사용)
                  savedSelectionRef.current = { start, end };
                  const selectedText = start !== end ? targetTextarea.value.substring(start, end) : '';
                  setSelectedTextForLink(selectedText);
                  setLinkModalOpen(true);
                }
              } else {
                applyFormat(type);
              }
            }}
            onSaveSelection={saveSelection}
            onEmojiClick={() => {
              setEmojiPickerOpen(!emojiPickerOpen);
            }}
            onEmojiButtonRef={(el) => {
              if (el) {
                emojiButtonRef.current = el;
              }
            }}
            onVoiceClick={() => {
              // TODO: 음성 메시지 구현
            }}
            onVideoClick={() => {
              // TODO: 화상 메시지 구현
            }}
            onFileClick={() => fileInputRef.current?.click()}
            onSendClick={selectedFiles.length > 0 ? onSendFile : onSendMessage}
            disabled={!isConnected}
            showFileUpload={showFileUpload}
            canSend={input.trim().length > 0 || selectedFiles.length > 0}
          />
        </div>
      </Stack>
      
      {/* 링크 추가 모달 */}
      <AddLinkModal
        open={linkModalOpen}
        onClose={() => {
          setLinkModalOpen(false);
          // 모달이 닫힌 후 textarea에 포커스 복원
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.focus();
            }
          }, 100);
        }}
        onAdd={(text, url) => {
          // 모달이 닫힌 후 textarea에 링크 삽입
          const targetTextarea = textareaRef.current || document.querySelector('textarea') as HTMLTextAreaElement;
          if (targetTextarea && savedSelectionRef.current) {
            // 저장된 선택 영역 위치에 커서 설정
            const { start, end } = savedSelectionRef.current;
            targetTextarea.setSelectionRange(start, end);
            // 모달이 닫힌 후 실행되도록 약간의 지연
            setTimeout(() => {
              insertLink(text, url, targetTextarea);
              // textarea에 포커스 복원
              targetTextarea.focus();
            }, 100);
            // 사용 후 초기화
            savedSelectionRef.current = null;
          }
        }}
        initialText={selectedTextForLink}
      />
      
      {/* 이모지 피커 (lazy loading) */}
      {emojiPickerOpen && (
        <Suspense fallback={null}>
          <EmojiPicker
            anchorRef={containerRef}
            isOpen={emojiPickerOpen}
            onClose={() => setEmojiPickerOpen(false)}
            onSelect={(emoji) => {
              const targetTextarea = textareaRef.current;
              if (!targetTextarea) return;
              
              const start = targetTextarea.selectionStart;
              const end = targetTextarea.selectionEnd;
              const before = input.substring(0, start);
              const after = input.substring(end);
              const newText = before + emoji + after;
              
              setInput(newText);
              
              // 커서 위치 조정
              setTimeout(() => {
                const newPos = start + emoji.length;
                targetTextarea.setSelectionRange(newPos, newPos);
                targetTextarea.focus();
              }, 0);
            }}
          />
        </Suspense>
      )}

      {/* 멘션 피커 */}
      {mentionOpen && (
        <MentionPicker
          members={members}
          roomMembers={roomMembers}
          search={mentionSearch}
          anchorRef={containerRef}
          onClose={() => setMentionOpen(false)}
          onSelect={(item) => {
            const targetTextarea = textareaRef.current;
            if (!targetTextarea) return;
            
            const cursorPos = targetTextarea.selectionStart;
            const beforeMention = input.substring(0, mentionPos);
            const afterMention = input.substring(cursorPos);
            
            const mentionText = typeof item === 'string' ? item : item.username;
            const newText = beforeMention + '@' + mentionText + ' ' + afterMention;
            
            setInput(newText);
            setMentionOpen(false);
            
            // 커서 위치 조정
            setTimeout(() => {
              const newPos = beforeMention.length + mentionText.length + 2; // @ + text + space
              targetTextarea.setSelectionRange(newPos, newPos);
              targetTextarea.focus();
            }, 0);
          }}
        />
      )}
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
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.members === nextProps.members &&
    prevProps.roomMembers === nextProps.roomMembers
  );
});
