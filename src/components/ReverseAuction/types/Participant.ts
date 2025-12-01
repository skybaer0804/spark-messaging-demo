export type UserRole = 'demander' | 'supplier';

export interface Participant {
    socketId: string;
    name: string;
    role: UserRole;
    stream?: MediaStream;
    peerConnection?: RTCPeerConnection;
}
