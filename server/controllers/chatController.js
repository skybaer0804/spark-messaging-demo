const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const User = require('../models/User');
const socketService = require('../services/socketService');
const notificationService = require('../services/notificationService');

// ... (existing code for createRoom and getRooms)

// 메시지 전송 (DB 저장 후 소켓 브로드캐스트 및 푸시 알림)
exports.sendMessage = async (req, res) => {
  try {
    const { roomId, content, type } = req.body;
    const senderId = req.user.id;

    // 1. DB에 메시지 저장
    const newMessage = new Message({
      roomId,
      senderId,
      content,
      type: type || 'text'
    });
    await newMessage.save();

    // 2. 채팅방 정보 가져오기 (멤버 확인용)
    const room = await ChatRoom.findById(roomId).populate('members', 'username');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // 3. 채팅방의 마지막 메시지 업데이트
    room.lastMessage = newMessage._id;
    await room.save();

    // 4. Socket SDK를 통해 실시간 브로드캐스트
    await socketService.sendRoomMessage(roomId, type || 'chat', content, senderId);

    // 5. 푸시 알림 전송 (본인 제외)
    const sender = room.members.find(m => m._id.toString() === senderId);
    const recipientIds = room.members
      .filter(m => m._id.toString() !== senderId)
      .map(m => m._id);

    if (recipientIds.length > 0) {
      notificationService.notifyNewMessage(
        recipientIds, 
        sender ? sender.username : 'Unknown', 
        content, 
        roomId
      );
    }

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};

// 채팅방 메시지 이력 조회
exports.getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await Message.find({ roomId })
      .populate('senderId', 'username avatar')
      .sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
  }
};

