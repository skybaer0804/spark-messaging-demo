const Workspace = require('../models/Workspace');
const crypto = require('crypto');
const { encrypt } = require('./encryption');

/**
 * 시스템 초기화: 최소 1개의 워크스페이스 보장
 */
async function initializeSystem() {
  try {
    const count = await Workspace.countDocuments();

    if (count === 0) {
      console.log('--- Initializing System: Creating Default Workspace ---');

      const projectPublicKey = `pk_${crypto.randomBytes(16).toString('hex')}`;
      const projectPrivateKeyRaw = `sk_${crypto.randomBytes(32).toString('hex')}`;
      const projectPrivateKey = encrypt(projectPrivateKeyRaw);

      const defaultWorkspace = new Workspace({
        name: 'Spark Default',
        initials: 'S',
        color: '#4f46e5',
        projectPublicKey,
        projectPrivateKey,
        projectUrl: 'http://localhost:5173',
        allowPublicJoin: true, // 누구나 참여 가능하도록 설정
        // 초기 생성 시 owner는 시스템이므로 지정하지 않거나 첫 번째 가입 유저에게 위임 가능
      });

      await defaultWorkspace.save();
      console.log('Default workspace created:', defaultWorkspace.name);
      console.log('Public Key:', projectPublicKey);
    }
  } catch (error) {
    console.error('System initialization failed:', error);
  }
}

module.exports = { initializeSystem };
