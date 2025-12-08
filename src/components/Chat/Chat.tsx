import { useEffect } from 'preact/hooks';
import { memo } from 'preact/compat';
import type { ChatAdapter, ChatConfig, ChatMessage } from './types';
import type { Signal } from '@preact/signals';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { ImageModal } from './ImageModal';
import { useChatCore } from './hooks/useChatCore';
import './Chat.scss';

interface ChatProps {
    adapter: ChatAdapter;
    config?: ChatConfig;
    classNamePrefix?: string;
}

function ChatComponent({ adapter, config = {}, classNamePrefix = 'chat' }: ChatProps) {
    const baseClass = config.classNamePrefix || classNamePrefix;
    
    const {
        input,
        setInput,
        selectedFiles,
        imageModal,
        handleKeyPress,
        handleSendMessage,
        handleFileSelect,
        handleFileSend,
        handleFileRemove,
        handleImageClick,
        handleCloseImageModal,
    } = useChatCore(adapter);

    // Signal 기반 메시지 가져오기 (반응형 업데이트)
    // Signal.value를 읽으면 자동으로 구독되어 Signal이 변경될 때 컴포넌트가 리렌더링됨
    const messagesSignal = (adapter as any).getMessagesSignal?.() as Signal<ChatMessage[]> | undefined;
    const messages = messagesSignal ? messagesSignal.value : adapter.getMessages();
    
    // Signal이 있으면 명시적으로 읽어서 구독 (컴포넌트 리렌더링 보장)
    if (messagesSignal) {
        // Signal.value를 읽어서 구독
        void messagesSignal.value;
    }

    const showFileUpload = config.showFileUpload !== false && adapter.showFileUpload?.() !== false;
    const showImageModal = config.showImageModal !== false;

    return (
        <div className={baseClass} style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
            <ChatMessages
                messages={messages}
                onImageClick={handleImageClick}
                emptyMessage={adapter.getEmptyMessage?.() || config.emptyMessage}
                classNamePrefix={baseClass}
            />
            <ChatInput
                input={input}
                setInput={setInput}
                selectedFiles={selectedFiles}
                uploadingFile={adapter.getUploadingFile?.() || null}
                uploadProgress={adapter.getUploadProgress?.() || 0}
                isConnected={adapter.isConnected()}
                placeholder={adapter.getPlaceholder?.() || config.placeholder}
                showFileUpload={showFileUpload}
                onSendMessage={handleSendMessage}
                onSendFile={handleFileSend}
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                onKeyPress={handleKeyPress}
                classNamePrefix={baseClass}
            />
            {showImageModal && imageModal && (
                <ImageModal url={imageModal.url} fileName={imageModal.fileName} onClose={handleCloseImageModal} classNamePrefix={baseClass} />
            )}
        </div>
    );
}

// Signal을 사용하는 경우 memo를 사용하지 않음 (Signal이 자동으로 리렌더링 처리)
// Signal이 없으면 memo 사용
export const Chat = ChatComponent;
