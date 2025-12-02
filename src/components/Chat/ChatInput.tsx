import { useRef, useEffect } from 'preact/hooks';
import { memo } from 'preact/compat';
import { FilePreview } from './FilePreview';
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
    classNamePrefix = 'chat',
}: ChatInputProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const baseClass = classNamePrefix;

    // textarea 높이 자동 조절
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            // 높이 초기화
            textarea.style.height = 'auto';
            // 스크롤 높이에 맞춰 조절 (최대 5줄)
            const scrollHeight = textarea.scrollHeight;
            const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 24;
            const minHeight = lineHeight * 2 + 24; // 기본 2줄
            const maxHeight = lineHeight * 5 + 24; // 최대 5줄
            
            const targetHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
            textarea.style.height = `${targetHeight}px`;
        }
    }, [input]);

    return (
        <div className={`${baseClass}__input-container`}>
            <FilePreview
                files={selectedFiles}
                uploadingFile={uploadingFile}
                uploadProgress={uploadProgress}
                onRemove={onFileRemove}
                classNamePrefix={classNamePrefix}
            />
            <div className={`${baseClass}__input-wrapper`}>
                <textarea
                    ref={textareaRef}
                    className={`${baseClass}__input`}
                    value={input}
                    onInput={(e) => setInput(e.currentTarget.value)}
                    onKeyPress={onKeyPress}
                    placeholder={placeholder || (isConnected ? '메시지를 입력하세요...' : '연결 중...')}
                    disabled={!isConnected}
                    rows={2}
                />
            </div>
            <div className={`${baseClass}__input-actions`}>
                {showFileUpload && (
                    <>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className={`${baseClass}__file-input`}
                            onChange={onFileSelect}
                            accept="image/*,.xlsx,.xls,.csv,.md,.docx,.doc,.pdf"
                            multiple
                            id={`${baseClass}-file-input`}
                            style={{ display: 'none' }}
                        />
                        <label htmlFor={`${baseClass}-file-input`} className={`${baseClass}__file-label`} title="파일 첨부">
                            📎
                        </label>
                    </>
                )}
                <button
                    onClick={selectedFiles.length > 0 ? onSendFile : onSendMessage}
                    disabled={!isConnected || (!input.trim() && selectedFiles.length === 0)}
                    className={`${baseClass}__send-button`}
                >
                    전송
                </button>
            </div>
        </div>
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
