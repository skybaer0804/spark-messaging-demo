import { signal } from '@preact/signals';

export const chatRoomList = signal<any[]>([]);
export const chatCurrentRoom = signal<string | null>(null);
export const currentWorkspaceId = signal<string | null>(null);

// Sidebar 등에서 "이 룸으로 들어가고 싶다"를 요청하면,
// ChatApp 화면이 마운트된 뒤 실제 joinRoom을 수행하고 소비합니다.
export const chatPendingJoinRoom = signal<string | null>(null);

export function setChatRoomList(next: any[]) {
  chatRoomList.value = next;
}

export function setChatCurrentRoom(next: string | null) {
  chatCurrentRoom.value = next;
}

export function requestJoinChatRoom(roomId: string) {
  chatPendingJoinRoom.value = roomId;
}

export function clearPendingJoinChatRoom() {
  chatPendingJoinRoom.value = null;
}

export function setCurrentWorkspaceId(workspaceId: string | null) {
  currentWorkspaceId.value = workspaceId;
}
