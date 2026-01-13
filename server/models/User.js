const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImage: { type: String },
  // 사용자 상태 관리 추가
  status: {
    type: String,
    enum: ['online', 'away', 'busy', 'offline'],
    default: 'offline',
  },
  statusText: { type: String, default: '' }, // 상태 메시지
  role: {
    type: String,
    enum: ['admin', 'user', 'guest'],
    default: 'user',
  },
  workspaces: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' }],
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  deptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dept' },
  lastLogoutAt: { type: Date, default: Date.now },
  lastSyncAt: { type: Date, default: null }, // v2.3.0: 알림 동기화 시점 기록
  createdAt: { type: Date, default: Date.now },
});

// Password comparison method
userSchema.methods.comparePassword = async function (candidatePassword) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
