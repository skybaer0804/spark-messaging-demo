const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  name: { type: String, default: 'Group Chat' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  invitedOrgs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }], // 가상 멤버십을 위한 조직 ID 목록
  roomType: { type: String, enum: ['DEFAULT', 'VIDEO_MEETING'], default: 'DEFAULT' },
  isGroup: { type: Boolean, default: false },
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatRoom', chatRoomSchema);

