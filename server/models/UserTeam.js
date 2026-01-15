const mongoose = require('mongoose');

const userTeamSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'member'],
    default: 'member',
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

// 복합 인덱스: 한 유저가 같은 팀에 중복 가입 방지
userTeamSchema.index({ userId: 1, teamId: 1 }, { unique: true });
// 팀별 멤버 조회 최적화
userTeamSchema.index({ teamId: 1 });
// 유저별 팀 목록 조회 최적화
userTeamSchema.index({ userId: 1 });

module.exports = mongoose.model('UserTeam', userTeamSchema);
