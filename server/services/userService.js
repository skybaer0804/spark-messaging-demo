const { client } = require('../config/redis');
const socketService = require('./socketService');

class UserService {
  // 유저 상태 설정 (Online/Offline)
  async setUserStatus(userId, status) {
    try {
      // Redis에 유저 상태 저장 (key: user:status:id)
      // 상태는 'online' 또는 'offline'
      await client.set(`user:status:${userId}`, status);

      // 만약 'online'이면 마지막 활동 시간도 저장 (TTL 설정 가능)
      if (status === 'online') {
        await client.set(`user:lastSeen:${userId}`, Date.now().toString());
      }

      // v2.2.0: 유저 상태 변경 이벤트 브로드캐스트
      socketService.broadcastEvent('USER_STATUS_CHANGED', { userId, status });
    } catch (error) {
      console.error('Error setting user status in Redis:', error);
    }
  }

  // 유저 상태 조회
  async getUserStatus(userId) {
    try {
      const status = await client.get(`user:status:${userId}`);
      return status || 'offline';
    } catch (error) {
      console.error('Error getting user status from Redis:', error);
      return 'offline';
    }
  }

  // 여러 유저의 상태 동시 조회
  async getUsersStatus(userIds) {
    try {
      const pipeline = client.multi();
      userIds.forEach((id) => {
        pipeline.get(`user:status:${id}`);
      });
      const results = await pipeline.exec();
      return userIds.reduce((acc, id, index) => {
        acc[id] = results[index] || 'offline';
        return acc;
      }, {});
    } catch (error) {
      console.error('Error getting multiple users status from Redis:', error);
      return {};
    }
  }

  // 사용자가 현재 보고 있는 활성 채팅방 설정
  async setActiveRoom(userId, roomId) {
    try {
      if (roomId) {
        await client.set(`user:activeRoom:${userId}`, roomId);
      } else {
        await client.del(`user:activeRoom:${userId}`);
      }
    } catch (error) {
      console.error('Error setting user active room in Redis:', error);
    }
  }

  // 사용자의 현재 활성 채팅방 조회
  async getActiveRoom(userId) {
    try {
      return await client.get(`user:activeRoom:${userId}`);
    } catch (error) {
      console.error('Error getting user active room from Redis:', error);
      return null;
    }
  }

  // 여러 유저의 활성 채팅방 동시 조회
  async getUsersActiveRooms(userIds) {
    try {
      if (!userIds || userIds.length === 0) return {};
      const pipeline = client.multi();
      userIds.forEach((id) => {
        pipeline.get(`user:activeRoom:${id}`);
      });
      const results = await pipeline.exec();
      return userIds.reduce((acc, id, index) => {
        acc[id] = results[index] || null;
        return acc;
      }, {});
    } catch (error) {
      console.error('Error getting multiple users active rooms from Redis:', error);
      return {};
    }
  }
}

module.exports = new UserService();
