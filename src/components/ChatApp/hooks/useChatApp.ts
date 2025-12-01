import { useState, useEffect, useRef } from 'preact/hooks';
import sparkMessagingClient from '../../../config/sparkMessaging';
import { ConnectionService } from '../../../services/ConnectionService';
import { ChatService } from '../../../services/ChatService';
import { RoomService } from '../services/RoomService';
import type { Message } from '../types';
import { SparkMessagingError } from '@skybaer0804/spark-messaging-client';

export function useChatApp() {
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [roomIdInput, setRoomIdInput] = useState('chat');
    const [currentRoom, setCurrentRoom] = useState<string | null>(null);
    const [joinedRooms, setJoinedRooms] = useState<string[]>([]);

    const connectionServiceRef = useRef<ConnectionService | null>(null);
    const chatServiceRef = useRef<ChatService | null>(null);
    const roomServiceRef = useRef<RoomService | null>(null);

    useEffect(() => {
        // 서비스 초기화
        const connectionService = new ConnectionService(sparkMessagingClient);
        const chatService = new ChatService(sparkMessagingClient, connectionService);
        const roomService = new RoomService(sparkMessagingClient, connectionService);

        connectionServiceRef.current = connectionService;
        chatServiceRef.current = chatService;
        roomServiceRef.current = roomService;

        // 연결 상태 관리
        connectionService.onConnected(() => {
            setIsConnected(true);
        });

        connectionService.onConnectionStateChange((connected) => {
            setIsConnected(connected);
        });

        connectionService.onError((error) => {
            console.error('❌ Error:', error);
            setIsConnected(false);
        });

        // Room 관리
        roomService.onRoomJoined((roomId) => {
            setCurrentRoom(roomId);
            setJoinedRooms(roomService.getJoinedRooms());
            setMessages([]);
            chatService.setCurrentRoom(roomId);
        });

        roomService.onRoomLeft((roomId) => {
            if (currentRoom === roomId) {
                setCurrentRoom(null);
                setMessages([]);
                chatService.setCurrentRoom(null);
            }
            setJoinedRooms(roomService.getJoinedRooms());
        });

        // 메시지 수신
        chatService.onMessage((message) => {
            setMessages((prev) => [...prev, message]);
        }, true); // Room에 있으면 일반 메시지 무시

        chatService.onRoomMessage((message) => {
            setMessages((prev) => [...prev, message]);
        });

        // 초기 연결 상태 확인
        const status = connectionService.getConnectionStatus();
        if (status.isConnected) {
            setIsConnected(true);
        }

        return () => {
            connectionService.cleanup();
            chatService.cleanup();
            roomService.cleanup();
        };
    }, []);

    const sendMessage = async () => {
        if (!input.trim() || !isConnected || !chatServiceRef.current) return;

        const messageContent = input.trim();
        const room = roomServiceRef.current?.getCurrentRoom();

        try {
            if (room) {
                await chatServiceRef.current.sendRoomMessage(room, 'chat', messageContent);
            } else {
                await chatServiceRef.current.sendMessage('chat', messageContent);
            }
            setInput('');
        } catch (error) {
            console.error('Failed to send message:', error);
            if (error instanceof SparkMessagingError) {
                alert(`메시지 전송 실패: ${error.message} (코드: ${error.code})`);
            } else {
                alert('메시지 전송 실패');
            }
        }
    };

    const handleRoomSelect = async (roomId: string) => {
        if (!roomServiceRef.current) return;

        try {
            await roomServiceRef.current.joinRoom(roomId);
        } catch (error) {
            console.error('Failed to join room:', error);
            if (error instanceof SparkMessagingError) {
                alert(`Room 입장 실패: ${error.message} (코드: ${error.code})`);
            } else {
                alert('Room 입장 실패');
            }
        }
    };

    const handleCreateRoom = async () => {
        if (!roomIdInput.trim() || !isConnected) return;
        await handleRoomSelect(roomIdInput.trim());
    };

    const leaveRoom = async () => {
        if (!currentRoom || !isConnected || !roomServiceRef.current) return;

        try {
            await roomServiceRef.current.leaveRoom(currentRoom);
        } catch (error) {
            console.error('Failed to leave room:', error);
            if (error instanceof SparkMessagingError) {
                alert(`Room 나가기 실패: ${error.message} (코드: ${error.code})`);
            } else {
                alert('Room 나가기 실패');
            }
        }
    };

    return {
        isConnected,
        messages,
        input,
        setInput,
        roomIdInput,
        setRoomIdInput,
        currentRoom,
        joinedRooms,
        sendMessage,
        handleRoomSelect,
        handleCreateRoom,
        leaveRoom,
    };
}
