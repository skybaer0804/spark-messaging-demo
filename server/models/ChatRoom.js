const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  identifier: { type: String, sparse: true }, // 1:1 채팅용 고유 식별자 (정렬된 userId 조합). index는 아래에서 별도로 정의
  slug: { type: String, unique: true, sparse: true }, // 공개/비공개 채널용 유니크 ID (URL 등 활용)
  name: { type: String }, // 그룹 채팅방 이름 (1:1은 null 가능)
  description: { type: String },
  type: {
    type: String,
    enum: ['public', 'private', 'direct', 'team', 'discussion'], // team, discussion 추가
    default: 'public',
  },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true }, // 워크스페이스 연결 필수화
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }, // 팀 채팅방인 경우 Team 참조
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom' }, // 토론방인 경우 상위 방 ID
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  lastSequenceNumber: { type: Number, default: 0 }, // 해당 방의 마지막 메시지 번호 추적
  isArchived: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// v2.2.0: identifier에 대해 partial index 적용하여 null/undefined인 경우 유니크 체크 제외
chatRoomSchema.index(
  { identifier: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { identifier: { $type: 'string' } },
  },
);

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
