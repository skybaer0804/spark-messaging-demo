const mongoose = require('mongoose');

const videoMeetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom' }, // 연결된 채팅방 ID
  scheduledAt: { type: Date, required: true }, // 시작 예약 시간
  status: { type: String, enum: ['scheduled', 'ongoing', 'completed', 'cancelled'], default: 'scheduled' },
  invitedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  invitedOrgs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }],
  maxParticipants: { type: Number, default: 20 },
  recordingUrl: { type: String },
  isRecording: { type: Boolean, default: false },
  activeParticipants: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      joinedAt: { type: Date, default: Date.now },
      leftAt: { type: Date },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('VideoMeeting', videoMeetingSchema);
