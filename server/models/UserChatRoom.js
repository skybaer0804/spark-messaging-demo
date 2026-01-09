const mongoose = require('mongoose');

const userChatRoomSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true
  },
  unreadCount: {
    type: Number,
    default: 0
  },
  lastReadMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  notificationEnabled: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 복합 인덱스 (조회 최적화)
userChatRoomSchema.index({ userId: 1, roomId: 1 }, { unique: true });

module.exports = mongoose.model('UserChatRoom', userChatRoomSchema);
