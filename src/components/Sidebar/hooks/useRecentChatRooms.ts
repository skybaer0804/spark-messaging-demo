import { useEffect, useMemo, useState } from 'preact/hooks';

const STORAGE_KEY = 'spark-recent-chat-rooms';

const loadRooms = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((r) => typeof r === 'string' && r.trim().length > 0);
  } catch {
    return [];
  }
};

const saveRooms = (rooms: string[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
  } catch {
    // ignore
  }
};

export function useRecentChatRooms(params: { roomList: string[]; currentRoom: string | null; max?: number }) {
  const max = params.max ?? 8;
  const [recent, setRecent] = useState<string[]>(() => loadRooms().slice(0, max));

  useEffect(() => {
    if (!params.currentRoom) return;
    const room = params.currentRoom;

    setRecent((prev) => {
      const next = [room, ...prev.filter((r) => r !== room)].slice(0, max);
      saveRooms(next);
      return next;
    });
  }, [max, params.currentRoom]);

  // 최근 목록에서 실제로 존재하는 roomList만 노출(삭제된 방 정리)
  return useMemo(() => {
    const exists = new Set(params.roomList);
    return recent.filter((r) => exists.has(r)).slice(0, max);
  }, [max, params.roomList, recent]);
}


