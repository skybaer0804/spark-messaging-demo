const Workspace = require('../models/Workspace');
const ChatRoom = require('../models/ChatRoom');
const crypto = require('crypto');
const { encrypt } = require('./encryption');

/**
 * 시스템 초기화: 최소 1개의 워크스페이스 보장
 */
async function initializeSystem() {
  try {
    // v2.2.0: ChatRoom의 identifier 필드 데이터 정리 (null -> undefined)
    // E11000 duplicate key error { identifier: null } 해결 위함
    await ChatRoom.updateMany({ identifier: null }, { $unset: { identifier: '' } });

    // 기존의 잘못된 유니크 인덱스가 있다면 삭제 시도 (새로운 sparse/partial index로 대체됨)
    try {
      await ChatRoom.collection.dropIndex('identifier_1');
      console.log('Old identifier index dropped successfully');
    } catch (e) {
      // 인덱스가 없으면 무시
    }

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
