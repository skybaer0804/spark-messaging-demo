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
    const { name, members, type = 'public', description, workspaceId, teamId, parentId, isPrivate } = req.body;
    const currentUserId = req.user.id;

    // 멤버 목록에 현재 사용자 추가 (중복 방지)
    const roomMembers = [...new Set([...(members || []), currentUserId])];

    let roomIdentifier = null;

    // 1:1 대화방(direct)인 경우 고유 식별자 생성 및 중복 체크
    if (type === 'direct' && roomMembers.length === 2) {
      // 두 유저 ID를 정렬하여 고유한 식별자 생성 (A_B 형태)
      roomIdentifier = roomMembers.sort().join('_');

      const existingRoom = await ChatRoom.findOne({
        identifier: roomIdentifier,
        workspaceId,
      });

      if (existingRoom) {
        const populatedRoom = await ChatRoom.findById(existingRoom._id).populate(
          'members',
          'username profileImage status',
        );
        return res.status(200).json(populatedRoom);
      }
    }

    const newRoom = new ChatRoom({
      identifier: roomIdentifier,
      name: type === 'direct' ? null : name || 'New Room',
      description,
      members: roomMembers,
      workspaceId,
      type,
      teamId,
      parentId,
      isPrivate: !!isPrivate,
    });

    await newRoom.save();

    // 모든 멤버에 대해 UserChatRoom 초기 레코드 생성
    const userChatRoomPromises = roomMembers.map((userId) =>
      UserChatRoom.findOneAndUpdate(
        { userId, roomId: newRoom._id },
        { userId, roomId: newRoom._id },
        { upsert: true, new: true },
      ),
    );
    await Promise.all(userChatRoomPromises);

    // 2.2.0: 모든 멤버에게 방 목록 업데이트 알림
    roomMembers.forEach((userId) => {
      socketService.notifyRoomListUpdated(userId);
    });

    // 생성된 방 정보를 멤버들과 함께 리턴
    const populatedRoom = await ChatRoom.findById(newRoom._id).populate(
      'members',
      'username profileImage status statusText',
    );

    const roomObj = populatedRoom.toObject();
    if (roomObj.type === 'direct') {
      const otherMember = roomObj.members.find((m) => m._id.toString() !== currentUserId.toString());
      roomObj.displayName = otherMember ? otherMember.username : 'Unknown';
      roomObj.displayAvatar = otherMember ? otherMember.profileImage || otherMember.avatar : null;
      roomObj.displayStatus = otherMember ? otherMember.status : 'offline';
      roomObj.displayStatusText = otherMember ? otherMember.statusText : '';
    } else {
      roomObj.displayName = roomObj.name;
    }

    res.status(201).json(roomObj);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ message: 'Failed to create room', error: error.message });
  }
};

// 사용자가 속한 채팅방 목록 조회 (UserChatRoom 기반)
exports.getRooms = async (req, res) => {
  try {
    const userId = req.user.id;
    const { workspaceId } = req.query;

    const query = { userId };

    // UserChatRoom에서 해당 유저의 방 목록 조회
    let userRooms = await UserChatRoom.find(query).populate({
      path: 'roomId',
      populate: [
        { path: 'members', select: 'username profileImage status statusText' },
        {
          path: 'lastMessage',
          populate: { path: 'senderId', select: 'username' },
        },
      ],
    });

    // 워크스페이스 필터링 및 응답 포맷팅
    const formattedRooms = userRooms
      .filter(
        (ur) =>
          ur.roomId && !ur.roomId.isArchived && (!workspaceId || ur.roomId.workspaceId.toString() === workspaceId),
      )
      .map((ur) => {
        const room = ur.roomId.toObject();

        // 1:1 대화방의 경우 상대적 이름 처리
        if (room.type === 'direct') {
          const otherMember = room.members.find((m) => m._id.toString() !== userId.toString());
          room.displayName = otherMember ? otherMember.username : 'Unknown';
          room.displayAvatar = otherMember ? otherMember.profileImage || otherMember.avatar : null;
          room.displayStatus = otherMember ? otherMember.status : 'offline';
          room.displayStatusText = otherMember ? otherMember.statusText : '';
        } else {
          room.displayName = room.name;
        }

        return {
          ...room,
          unreadCount: ur.unreadCount,
          isPinned: ur.isPinned,
          notificationEnabled: ur.notificationEnabled,
        };
      })
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    res.json(formattedRooms);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch rooms', error: error.message });
  }
};

// 채팅방 나가기
exports.leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // 1. UserChatRoom 레코드 삭제 (사용자의 방 목록에서 제거)
    await UserChatRoom.findOneAndDelete({ userId, roomId });

    // 2. ChatRoom의 members 배열에서 사용자 제거
    room.members = room.members.filter((id) => id.toString() !== userId.toString());

    // 3. 1:1 대화방(direct)인 경우 추가 처리
    if (room.type === 'direct') {
      // 상대방이 이미 나갔거나 내가 나감으로써 더 이상 '활성' 1:1 방이 아님
      // identifier를 제거하여 나중에 같은 상대와 채팅 시 새 방이 생성되도록 함
      room.identifier = null;

      // 방에 아무도 없으면 아카이브 처리, 한 명이라도 있으면 목록 유지 위해 아카이브 안 함
      if (room.members.length === 0) {
        room.isArchived = true;
      }
    } else {
      // 그룹 방의 경우에도 멤버가 없으면 아카이브
      if (room.members.length === 0) {
        room.isArchived = true;
      }
    }

    await room.save();

    // 4. 방에 남아있는 사람들에게 멤버가 나갔음을 알림 (Unknown 처리를 위해 목록 갱신)
    room.members.forEach((memberId) => {
      socketService.notifyRoomListUpdated(memberId.toString());
    });

    res.json({ message: 'Successfully left the room', roomId });
  } catch (error) {
    res.status(500).json({ message: 'Failed to leave room', error: error.message });
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

    // 1. 시퀀스 번호 원자적 증가 및 방 정보 업데이트
    const room = await ChatRoom.findByIdAndUpdate(roomId, { $inc: { lastSequenceNumber: 1 } }, { new: true }).populate(
      'members',
      'username',
    );

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const sequenceNumber = room.lastSequenceNumber;

    // 2. DB에 메시지 저장
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
      sequenceNumber,
    });
    await newMessage.save();

    // 3. 채팅방 마지막 메시지 업데이트
    room.lastMessage = newMessage._id;
    await room.save();

    // 4. Socket 브로드캐스트 (파일 정보 포함)
    const sender = room.members.find((m) => m._id.toString() === senderId);

    const messageData = {
      _id: newMessage._id,
      roomId,
      content: newMessage.content,
      fileUrl: newMessage.fileUrl,
      thumbnailUrl: newMessage.thumbnailUrl,
      fileName: newMessage.fileName,
      fileSize: newMessage.fileSize,
      senderId,
      senderName: sender ? sender.username : 'Unknown',
      sequenceNumber,
      timestamp: newMessage.timestamp,
    };

    await socketService.sendRoomMessage(roomId, type, messageData, senderId);

    // 4. 수신자들의 unreadCount 증가 및 목록 업데이트 알림
    const allMemberIds = room.members.map((m) => m._id.toString());
    const recipientIds = allMemberIds.filter((id) => id !== senderId);

    if (recipientIds.length > 0) {
      // 현재 방을 보고 있지 않은 유저들만 필터링하여 unreadCount 증가
      const activeRooms = await userService.getUsersActiveRooms(recipientIds);
      const recipientIdsToIncrement = recipientIds.filter((id) => activeRooms[id] !== roomId.toString());

      if (recipientIdsToIncrement.length > 0) {
        await UserChatRoom.updateMany(
          { roomId, userId: { $in: recipientIdsToIncrement } },
          { $inc: { unreadCount: 1 } },
        );

        recipientIdsToIncrement.forEach(async (userId) => {
          const userChatRoom = await UserChatRoom.findOne({ userId, roomId });
          if (userChatRoom) {
            socketService.notifyUnreadCount(userId, roomId, userChatRoom.unreadCount);
          }
        });
      }

      // 목록 정보(마지막 메시지 등)는 모든 수신자에게 업데이트 알림
      recipientIds.forEach((userId) => {
        socketService.notifyRoomListUpdated(userId, {
          roomId,
          lastMessage: messageData,
          unreadCountIncrement: recipientIdsToIncrement.includes(userId) ? 1 : 0,
        });
      });
    }

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

    // 1. 시퀀스 번호 원자적 증가 및 방 정보 업데이트
    const room = await ChatRoom.findByIdAndUpdate(roomId, { $inc: { lastSequenceNumber: 1 } }, { new: true }).populate(
      'members',
      'username',
    );

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const sequenceNumber = room.lastSequenceNumber;

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

    // 3. 채팅방 마지막 메시지 업데이트
    room.lastMessage = newMessage._id;
    await room.save();

    // 4. 수신자들의 unreadCount 증가
    const allMemberIds = room.members.map((m) => m._id.toString());
    const recipientIds = allMemberIds.filter((id) => id !== senderId);

    // Socket SDK를 통해 실시간 브로드캐스트를 위한 데이터 준비
    const sender = room.members.find((m) => m._id.toString() === senderId);
    const messageData = {
      _id: newMessage._id,
      roomId,
      content,
      senderId,
      senderName: sender ? sender.username : 'Unknown',
      sequenceNumber,
      tempId,
      timestamp: newMessage.timestamp,
    };

    if (recipientIds.length > 0) {
      // 현재 방을 보고 있지 않은 유저들만 필터링하여 unreadCount 증가
      const activeRooms = await userService.getUsersActiveRooms(recipientIds);
      const recipientIdsToIncrement = recipientIds.filter((id) => activeRooms[id] !== roomId.toString());

      if (recipientIdsToIncrement.length > 0) {
        await UserChatRoom.updateMany(
          { roomId, userId: { $in: recipientIdsToIncrement } },
          { $inc: { unreadCount: 1 } },
        );

        // 2.2.0: 수신자들에게 실시간 안읽음 카운트 알림
        recipientIdsToIncrement.forEach(async (userId) => {
          const userChatRoom = await UserChatRoom.findOne({ userId, roomId });
          if (userChatRoom) {
            socketService.notifyUnreadCount(userId, roomId, userChatRoom.unreadCount);
          }
        });
      }

      // 목록 정보는 모든 수신자에게 업데이트 알림
      recipientIds.forEach((userId) => {
        socketService.notifyRoomListUpdated(userId, {
          roomId,
          lastMessage: messageData,
          unreadCountIncrement: recipientIdsToIncrement.includes(userId) ? 1 : 0,
        });
      });
    }

    // 5. Socket SDK를 통해 실시간 브로드캐스트 (MESSAGE_ADDED)
    await socketService.sendRoomMessage(roomId, newMessage.type, messageData, senderId);

    // 6. 푸시 알림 전송 (현재 방에 있지 않은 모든 유저에게)
    if (recipientIds.length > 0) {
      console.log(`[Push] Attempting to send push to recipients: ${recipientIds}`);
      const activeRooms = await userService.getUsersActiveRooms(recipientIds);

      const recipientIdsToNotify = recipientIds.filter((id) => {
        const isNotInRoom = activeRooms[id] !== roomId.toString(); // ID 비교 안정화
        return isNotInRoom;
      });

      console.log(`[Push] Filtered recipients to notify: ${recipientIdsToNotify}`);

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
    const { roomId } = req.params;
    const { fromSequence } = req.query;

    const messages = await Message.find({
      roomId,
      sequenceNumber: { $gt: parseInt(fromSequence) || 0 },
    })
      .populate('senderId', 'username profileImage')
      .sort({ sequenceNumber: 1 });

    res.json({
      messages,
      count: messages.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to sync messages', error: error.message });
  }
};

// 읽음 처리 (unreadCount 초기화 및 메시지 readBy 업데이트)
exports.markAsRead = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // 1. 유저의 해당 방 안읽음 카운트 초기화
    await UserChatRoom.findOneAndUpdate({ userId, roomId }, { unreadCount: 0 });

    // 2. 해당 방의 내가 읽지 않은 메시지들에 대해 내 ID 추가
    await Message.updateMany(
      { roomId, senderId: { $ne: userId }, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } },
    );

    // 3. 방의 모든 멤버에게 읽음 상태가 변경되었음을 알림
    // 나 자신에게는 목록 업데이트 알림을 보낼 필요가 없음 (이미 읽었음을 알고 있음)
    socketService.notifyMessageRead(roomId, userId);

    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark as read', error: error.message });
  }
};

// 채팅방 메시지 이력 조회
exports.getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, beforeSequence } = req.query;

    const query = { roomId };
    if (beforeSequence) {
      query.sequenceNumber = { $lt: parseInt(beforeSequence) };
    }

    const messages = await Message.find(query)
      .populate('senderId', 'username profileImage status')
      .sort({ sequenceNumber: -1 })
      .limit(parseInt(limit));

    res.json(messages.reverse());
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
