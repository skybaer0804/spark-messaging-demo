const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true }, // 회사명
  dept1: { type: String, required: true }, // 상위 부서
  dept2: { type: String }, // 하위 부서 (선택 사항)
  createdAt: { type: Date, default: Date.now },
});

// 동일 회사/부서 조합 중복 방지
organizationSchema.index({ name: 1, dept1: 1, dept2: 1 }, { unique: true });

module.exports = mongoose.model('Organization', organizationSchema);
