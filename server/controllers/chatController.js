const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const User = require('../models/User');
const socketService = require('../services/socketService');
const notificationService = require('../services/notificationService');
const userService = require('../services/userService');
const imageService = require('../services/imageService');

// 채팅방 생성
exports.createRoom = async (req, res) => {
  try {
    const { name, members, isGroup } = req.body;
    const currentUserId = req.user.id;

    // 멤버 목록에 현재 사용자 추가 (중복 방지)
    const roomMembers = [...new Set([...(members || []), currentUserId])];

    const newRoom = new ChatRoom({
      name: name || (isGroup ? 'Group Chat' : 'Direct Message'),
      members: roomMembers,
      isGroup: !!isGroup,
    });

    await newRoom.save();

    // 생성된 방 정보를 멤버들과 함께 리턴
    const populatedRoom = await ChatRoom.findById(newRoom._id).populate('members', 'username avatar status');

    res.status(201).json(populatedRoom);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create room', error: error.message });
  }
};

// 사용자가 속한 채팅방 목록 조회
exports.getRooms = async (req, res) => {
  try {
    const userId = req.user.id;

    const rooms = await ChatRoom.find({ members: userId })
      .populate('members', 'username avatar status')
      .populate({
        path: 'lastMessage',
        populate: { path: 'senderId', select: 'username' },
      })
      .sort({ updatedAt: -1 });

    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch rooms', error: error.message });
  }
};

// 파일 업로드 처리
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { roomId } = req.body;
    const senderId = req.user.id;
    const file = req.file;

    let type = 'file';
    let thumbnailUrl = null;

    // 이미지일 경우 썸네일 생성
    if (file.mimetype.startsWith('image/')) {
      type = 'image';
      thumbnailUrl = await imageService.createThumbnail(file.path, file.filename);
    }

    // 1. DB에 메시지 저장
    const newMessage = new Message({
      roomId,
      senderId,
      content: `File: ${file.originalname}`,
      type,
      fileUrl: file.path,
      thumbnailUrl: thumbnailUrl,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    });
    await newMessage.save();

    // 2. 채팅방 정보 가져오기 및 업데이트
    const room = await ChatRoom.findById(roomId).populate('members', 'username');
    if (room) {
      room.lastMessage = newMessage._id;
      await room.save();
    }

    // 3. Socket 브로드캐스트 (파일 정보 포함)
    await socketService.sendRoomMessage(
      roomId,
      type,
      {
        content: newMessage.content,
        fileUrl: newMessage.fileUrl,
        thumbnailUrl: newMessage.thumbnailUrl,
        fileName: newMessage.fileName,
        fileSize: newMessage.fileSize,
      },
      senderId,
    );

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: 'File upload failed', error: error.message });
  }
};

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
      type: type || 'text',
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

    // 5. 푸시 알림 전송 (오프라인인 유저에게만)
    const sender = room.members.find((m) => m._id.toString() === senderId);
    const potentialRecipientIds = room.members
      .filter((m) => m._id.toString() !== senderId)
      .map((m) => m._id.toString());

    if (potentialRecipientIds.length > 0) {
      // Redis에서 유저들의 상태를 확인
      const userStatuses = await userService.getUsersStatus(potentialRecipientIds);

      const offlineRecipientIds = potentialRecipientIds.filter((id) => userStatuses[id] === 'offline');

      if (offlineRecipientIds.length > 0) {
        notificationService.notifyNewMessage(
          offlineRecipientIds,
          sender ? sender.username : 'Unknown',
          content,
          roomId,
        );
      }
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
    const messages = await Message.find({ roomId }).populate('senderId', 'username avatar').sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
  }
};
