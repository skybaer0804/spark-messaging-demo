const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  initials: { type: String },
  color: { type: String, default: '#4f46e5' },

  // 보안 및 연동 키
  projectPublicKey: { type: String, required: true, unique: true },
  projectPrivateKey: { type: String, required: true }, // 암호화 필요
  projectUrl: { type: String },

  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  allowPublicJoin: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

workspaceSchema.index({ projectPublicKey: 1 });

module.exports = mongoose.model('Workspace', workspaceSchema);
