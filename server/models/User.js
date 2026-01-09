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
  workspaces: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' }],
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  deptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dept' },
  createdAt: { type: Date, default: Date.now },
});

// Password comparison method
userSchema.methods.comparePassword = async function (candidatePassword) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
