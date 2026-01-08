const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scheduledAt: { type: Date }, // 예약 발송 시간
  isSent: { type: Boolean, default: false },
  targetType: { type: String, enum: ['all', 'organization'], default: 'all' },
  targetId: { type: mongoose.Schema.Types.ObjectId }, // 특정 조직 ID 등
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', notificationSchema);
