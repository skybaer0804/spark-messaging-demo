import { ChatRoom } from '../types';

export const getDirectChatName = (room: ChatRoom, currentUserId?: string) => {
  if (room.type !== 'direct') return room.name || 'Unnamed Room';
  const otherMember = room.members.find((m) => {
    const memberId = typeof m === 'string' ? m : m._id;
    return memberId.toString() !== currentUserId?.toString();
  });
  return otherMember ? (typeof otherMember === 'string' ? 'User' : otherMember.username) : 'Unknown';
};
