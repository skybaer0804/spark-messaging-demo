const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  type: {
    type: String,
    enum: ['text', 'file', 'image', 'system'],
    default: 'text',
  },
  // [필수] 메시지 시퀀스: 방 내에서 1씩 증가하여 메시지 순서 및 누락 확인
  sequenceNumber: { type: Number, required: true },

  // [낙관적 업데이트용] 클라이언트에서 생성한 임시 ID 및 상태
  tempId: { type: String },
  status: {
    type: String,
    enum: ['sending', 'sent', 'failed'],
    default: 'sent',
  },

  fileUrl: { type: String },
  fileName: { type: String },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // 멘션 정보
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // @멘션된 사용자 ID 배열
  mentionAll: { type: Boolean, default: false }, // @all 사용 여부
  mentionHere: { type: Boolean, default: false }, // @here 사용 여부
  timestamp: { type: Date, default: Date.now },
});

// 특정 방의 시퀀스 번호로 빠른 조회를 위한 인덱스
messageSchema.index({ roomId: 1, sequenceNumber: 1 });

module.exports = mongoose.model('Message', messageSchema);
