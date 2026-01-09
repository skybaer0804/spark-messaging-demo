const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const User = require('../models/User');
const UserChatRoom = require('../models/UserChatRoom');
const socketService = require('../services/socketService');
const notificationService = require('../services/notificationService');
const userService = require('../services/userService');
const imageService = require('../services/imageService');

// 채팅방 생성
exports.createRoom = async (req, res) => {
  try {
    const { name, members, invitedOrgs, isGroup } = req.body;
    const currentUserId = req.user.id;

    // 멤버 목록에 현재 사용자 추가 (중복 방지)
    const roomMembers = [...new Set([...(members || []), currentUserId])];

    const newRoom = new ChatRoom({
      name: name || (isGroup ? 'Group Chat' : 'Direct Message'),
      members: roomMembers,
      invitedOrgs: invitedOrgs || [],
      isGroup: !!isGroup || (invitedOrgs && invitedOrgs.length > 0),
    });

    await newRoom.save();

    // 모든 멤버에 대해 UserChatRoom 초기 레코드 생성
    const userChatRoomPromises = roomMembers.map(userId => 
      UserChatRoom.findOneAndUpdate(
        { userId, roomId: newRoom._id },
        { userId, roomId: newRoom._id },
        { upsert: true, new: true }
      )
    );
    await Promise.all(userChatRoomPromises);

    // 생성된 방 정보를 멤버들과 함께 리턴
    const populatedRoom = await ChatRoom.findById(newRoom._id).populate('members', 'username avatar status');

    res.status(201).json(populatedRoom);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create room', error: error.message });
  }
};

// 사용자가 속한 채팅방 목록 조회 (UserChatRoom 기반)
exports.getRooms = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // UserChatRoom에서 해당 유저의 방 목록 조회
    const userRooms = await UserChatRoom.find({ userId })
      .populate({
        path: 'roomId',
        populate: [
          { path: 'members', select: 'username avatar status' },
          { 
            path: 'lastMessage',
            populate: { path: 'senderId', select: 'username' }
          }
        ]
      })
      .sort({ 'roomId.updatedAt': -1 });

    // 응답 포맷팅 (프론트엔드 호환성 유지)
    const formattedRooms = userRooms.map(ur => {
      const room = ur.roomId.toObject();
      return {
        ...room,
        unreadCount: ur.unreadCount,
        isPinned: ur.isPinned,
        notificationEnabled: ur.notificationEnabled
      };
    });

    res.json(formattedRooms);
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
    const sender = room.members.find((m) => m._id.toString() === senderId);

    await socketService.sendRoomMessage(
      roomId,
      type,
      {
        content: newMessage.content,
        fileUrl: newMessage.fileUrl,
        thumbnailUrl: newMessage.thumbnailUrl,
        fileName: newMessage.fileName,
        fileSize: newMessage.fileSize,
        senderName: sender ? sender.username : 'Unknown',
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
    const { roomId, content, type, tempId } = req.body;
    const senderId = req.user.id;

    // 1. 시퀀스 번호 결정 (방별 고유)
    const lastMessage = await Message.findOne({ roomId }).sort({ sequenceNumber: -1 });
    const sequenceNumber = lastMessage ? lastMessage.sequenceNumber + 1 : 1;

    // 2. DB에 메시지 저장
    const newMessage = new Message({
      roomId,
      senderId,
      content,
      type: type === 'chat' ? 'text' : type || 'text',
      sequenceNumber,
      tempId,
    });
    await newMessage.save();

    // 3. 채팅방 정보 업데이트
    const room = await ChatRoom.findById(roomId).populate('members', 'username');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    room.lastMessage = newMessage._id;
    await room.save();

    // 4. 수신자들의 unreadCount 증가
    const allMemberIds = room.members.map(m => m._id.toString());
    const recipientIds = allMemberIds.filter(id => id !== senderId);
    
    await UserChatRoom.updateMany(
      { roomId, userId: { $in: recipientIds } },
      { $inc: { unreadCount: 1 } }
    );

    const sender = room.members.find((m) => m._id.toString() === senderId);

    // 5. Socket SDK를 통해 실시간 브로드캐스트 (MESSAGE_ADDED)
    await socketService.sendRoomMessage(
      roomId,
      newMessage.type,
      {
        _id: newMessage._id,
        content,
        senderId,
        senderName: sender ? sender.username : 'Unknown',
        sequenceNumber,
        tempId,
        timestamp: newMessage.timestamp,
      },
      senderId,
    );

    // 6. 소켓으로 UNREAD_COUNT_UPDATED 브로드캐스트 (선택적 구현, 현재는 SDK가 sendRoomMessage로 처리)

    // 7. 푸시 알림 전송 (오프라인이거나 현재 방에 있지 않은 유저에게만)
    if (recipientIds.length > 0) {
      const [userStatuses, activeRooms] = await Promise.all([
        userService.getUsersStatus(recipientIds),
        userService.getUsersActiveRooms(recipientIds),
      ]);

      const recipientIdsToNotify = recipientIds.filter((id) => {
        const isOffline = userStatuses[id] === 'offline';
        const isNotInRoom = activeRooms[id] !== roomId;
        return isOffline || isNotInRoom;
      });

      if (recipientIdsToNotify.length > 0) {
        notificationService.notifyNewMessage(
          recipientIdsToNotify,
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

// 메시지 동기화 (누락 메시지 조회)
exports.syncMessages = async (req, res) => {
  try {
    const { roomId, fromSequence } = req.query;
    
    const messages = await Message.find({
      roomId,
      sequenceNumber: { $gt: parseInt(fromSequence) || 0 }
    })
    .populate('senderId', 'username avatar')
    .sort({ sequenceNumber: 1 });

    res.json({
      messages,
      count: messages.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to sync messages', error: error.message });
  }
};

// 읽음 처리 (unreadCount 초기화)
exports.markAsRead = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    await UserChatRoom.findOneAndUpdate(
      { userId, roomId },
      { unreadCount: 0 }
    );

    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark as read', error: error.message });
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

// 사용자의 활성 채팅방 상태 업데이트 (푸시 발송 필터링용)
exports.setActiveRoom = async (req, res) => {
  try {
    const { roomId } = req.body;
    const userId = req.user.id;

    await userService.setActiveRoom(userId, roomId);
    res.json({ message: 'Active room updated' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update active room', error: error.message });
  }
};
