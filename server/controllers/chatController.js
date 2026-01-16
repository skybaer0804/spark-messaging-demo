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
    let { name, members, type = 'public', description, workspaceId, teamId, parentId, isPrivate } = req.body;
    const currentUserId = req.user.id;

    // v2.2.0: workspaceId가 body에 없으면 헤더에서 확인
    if (!workspaceId) {
      workspaceId = req.headers['x-workspace-id'];
    }

    if (!workspaceId) {
      return res.status(400).json({ message: 'workspaceId is required' });
    }

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

    // 팀 채팅방인 경우 기존 방이 있는지 확인 및 멤버십 보장
    if (type === 'team' && teamId) {
      const existingRoom = await ChatRoom.findOne({ teamId, type: 'team' });
      if (existingRoom) {
        // 멤버십 확인 및 추가
        const isMember = existingRoom.members.some((m) => m.toString() === currentUserId.toString());
        if (!isMember) {
          existingRoom.members.push(currentUserId);
          await existingRoom.save();
        }

        // UserChatRoom 레코드 보장
        await UserChatRoom.findOneAndUpdate(
          { userId: currentUserId, roomId: existingRoom._id },
          {
            userId: currentUserId,
            roomId: existingRoom._id,
          },
          { upsert: true, new: true },
        );

        // 멤버들에게 방 목록 업데이트 알림
        socketService.notifyRoomListUpdated(currentUserId);

        const populatedRoom = await ChatRoom.findById(existingRoom._id).populate(
          'members',
          'username profileImage status statusText',
        );
        
        const roomObj = populatedRoom.toObject();
        roomObj.displayName = roomObj.name;
        
        return res.status(200).json(roomObj);
      }
    }

    // Private 채널인 경우 slug 생성
    let slug = null;
    if ((type === 'private' || isPrivate) && type !== 'direct') {
      // 이름 기반으로 slug 생성 (영문, 숫자, 하이픈, 언더스코어만 허용)
      const baseSlug = (name || 'channel')
        .toLowerCase()
        .replace(/[^a-z0-9가-힣_-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      // 고유한 slug 생성 (중복 방지)
      let uniqueSlug = baseSlug;
      let counter = 1;
      while (await ChatRoom.findOne({ slug: uniqueSlug, workspaceId })) {
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      slug = uniqueSlug;
    }

    const roomData = {
      name: type === 'direct' ? null : name || 'New Room',
      description,
      members: roomMembers,
      workspaceId,
      type,
      teamId,
      parentId,
      isPrivate: !!isPrivate,
      createdBy: currentUserId,
      identifier: roomIdentifier || undefined, // null 대신 undefined 사용하여 sparse index 활용
      slug: slug || undefined,
    };

    const newRoom = new ChatRoom(roomData);

    await newRoom.save();

    // 모든 멤버에 대해 UserChatRoom 초기 레코드 생성
    const userChatRoomPromises = roomMembers.map((userId) =>
      UserChatRoom.findOneAndUpdate(
        { userId, roomId: newRoom._id },
        {
          userId,
          roomId: newRoom._id,
          lastReadSequenceNumber: newRoom.lastSequenceNumber, // [v2.4.0] 초기 참여자는 현재까지 읽은 것으로 간주
          unreadCount: 0,
        },
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
        const lastSequenceNumber = room.lastSequenceNumber || 0;
        const lastReadSequenceNumber = ur.lastReadSequenceNumber || 0;
        const unreadCount = Math.max(0, lastSequenceNumber - lastReadSequenceNumber);

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
          unreadCount,
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

// 채팅방 수정
exports.updateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { name, description, members, isPrivate, type } = req.body;
    const currentUserId = req.user.id;

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // 권한 확인: 현재 사용자가 방의 멤버인지 확인
    const isMember = room.members.some((m) => m.toString() === currentUserId.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this room' });
    }

    // 업데이트할 데이터 구성
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isPrivate !== undefined) {
      updateData.isPrivate = isPrivate;
      // Private로 변경 시 slug 생성
      if (isPrivate && !room.slug && room.type !== 'direct') {
        const baseSlug = (name || room.name || 'channel')
          .toLowerCase()
          .replace(/[^a-z0-9가-힣_-]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        
        let uniqueSlug = baseSlug;
        let counter = 1;
        while (await ChatRoom.findOne({ slug: uniqueSlug, workspaceId: room.workspaceId, _id: { $ne: roomId } })) {
          uniqueSlug = `${baseSlug}-${counter}`;
          counter++;
        }
        updateData.slug = uniqueSlug;
      }
    }
    if (type !== undefined) updateData.type = type;
    if (members !== undefined && Array.isArray(members)) {
      // 멤버 목록에 현재 사용자 포함 (방장은 항상 멤버여야 함)
      const roomMembers = [...new Set([...members, currentUserId])];
      updateData.members = roomMembers;
    }

    // 방 정보 업데이트
    const updatedRoom = await ChatRoom.findByIdAndUpdate(roomId, updateData, { new: true }).populate(
      'members',
      'username profileImage status statusText',
    );

    // 멤버 목록이 변경된 경우 UserChatRoom 레코드 업데이트
    if (members !== undefined && Array.isArray(members)) {
      const roomMembers = [...new Set([...members, currentUserId])];
      
      // 기존 멤버들의 UserChatRoom 레코드 유지
      const existingUserChatRooms = await UserChatRoom.find({ roomId });
      const existingUserIds = existingUserChatRooms.map((ucr) => ucr.userId.toString());
      
      // 새로 추가된 멤버들에 대한 UserChatRoom 레코드 생성
      const newMemberIds = roomMembers.filter((id) => !existingUserIds.includes(id.toString()));
      for (const userId of newMemberIds) {
        await UserChatRoom.findOneAndUpdate(
          { userId, roomId },
          {
            userId,
            roomId,
            lastReadSequenceNumber: updatedRoom.lastSequenceNumber || 0,
            unreadCount: 0,
          },
          { upsert: true, new: true },
        );
      }

      // 제거된 멤버들의 UserChatRoom 레코드 삭제
      const removedUserIds = existingUserIds.filter((id) => !roomMembers.some((m) => m.toString() === id));
      for (const userId of removedUserIds) {
        await UserChatRoom.findOneAndDelete({ userId, roomId });
      }

      // 모든 멤버에게 방 목록 업데이트 알림
      roomMembers.forEach((userId) => {
        socketService.notifyRoomListUpdated(userId.toString());
      });
    } else {
      // 멤버 목록이 변경되지 않은 경우에도 방 목록 업데이트 알림
      updatedRoom.members.forEach((member) => {
        socketService.notifyRoomListUpdated(member._id.toString());
      });
    }

    const roomObj = updatedRoom.toObject();
    if (roomObj.type === 'direct') {
      const otherMember = roomObj.members.find((m) => m._id.toString() !== currentUserId.toString());
      roomObj.displayName = otherMember ? otherMember.username : 'Unknown';
      roomObj.displayAvatar = otherMember ? otherMember.profileImage || otherMember.avatar : null;
      roomObj.displayStatus = otherMember ? otherMember.status : 'offline';
      roomObj.displayStatusText = otherMember ? otherMember.statusText : '';
    } else {
      roomObj.displayName = roomObj.name;
    }

    res.json(roomObj);
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ message: 'Failed to update room', error: error.message });
  }
};

// 초대 링크로 채팅방 입장
exports.joinRoomByInvite = async (req, res) => {
  try {
    const { slug } = req.params;
    const currentUserId = req.user.id;
    const workspaceId = req.headers['x-workspace-id'] || req.body.workspaceId;

    if (!workspaceId) {
      return res.status(400).json({ message: 'workspaceId is required' });
    }

    // slug로 채팅방 찾기
    const room = await ChatRoom.findOne({ slug, workspaceId, type: 'private' });
    if (!room) {
      return res.status(404).json({ message: 'Room not found or invalid invite link' });
    }

    // 이미 멤버인지 확인
    const isMember = room.members.some((m) => m.toString() === currentUserId.toString());
    if (isMember) {
      // 이미 멤버인 경우 방 정보 반환
      const populatedRoom = await ChatRoom.findById(room._id).populate(
        'members',
        'username profileImage status statusText',
      );
      const roomObj = populatedRoom.toObject();
      roomObj.displayName = roomObj.name;
      return res.json(roomObj);
    }

    // 멤버 추가
    room.members.push(currentUserId);
    await room.save();

    // UserChatRoom 레코드 생성
    await UserChatRoom.findOneAndUpdate(
      { userId: currentUserId, roomId: room._id },
      {
        userId: currentUserId,
        roomId: room._id,
        lastReadSequenceNumber: room.lastSequenceNumber || 0,
        unreadCount: 0,
      },
      { upsert: true, new: true },
    );

    // 모든 멤버에게 방 목록 업데이트 알림
    room.members.forEach((memberId) => {
      socketService.notifyRoomListUpdated(memberId.toString());
    });

    const populatedRoom = await ChatRoom.findById(room._id).populate(
      'members',
      'username profileImage status statusText',
    );
    const roomObj = populatedRoom.toObject();
    roomObj.displayName = roomObj.name;

    res.json(roomObj);
  } catch (error) {
    console.error('Error joining room by invite:', error);
    res.status(500).json({ message: 'Failed to join room', error: error.message });
  }
};

// 채팅방 삭제
exports.deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const currentUserId = req.user.id;

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // 권한 확인: 현재 사용자가 방의 멤버인지 확인
    const isMember = room.members.some((m) => m.toString() === currentUserId.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this room' });
    }

    // 모든 멤버의 UserChatRoom 레코드 삭제
    await UserChatRoom.deleteMany({ roomId });

    // 방 삭제 (실제로는 아카이브 처리)
    room.isArchived = true;
    await room.save();

    // 모든 멤버에게 방 목록 업데이트 알림
    room.members.forEach((memberId) => {
      socketService.notifyRoomListUpdated(memberId.toString());
    });

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ message: 'Failed to delete room', error: error.message });
  }
};

// 채팅방 나가기
exports.leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const room = await ChatRoom.findById(roomId).populate('members', 'username');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const user = room.members.find((m) => m._id.toString() === userId.toString());
    const username = user ? user.username : 'Unknown';

    // 1. UserChatRoom 레코드 삭제 (사용자의 방 목록에서 제거)
    await UserChatRoom.findOneAndDelete({ userId, roomId });

    // 2. ChatRoom의 members 배열에서 사용자 제거
    room.members = room.members.filter((m) => m._id.toString() !== userId.toString());

    // 3. 1:1 대화방(direct)인 경우 추가 처리
    if (room.type === 'direct') {
      room.identifier = undefined; // null 대신 undefined로 설정하여 유니크 인덱스 충돌 방지 (sparse)
      if (room.members.length === 0) {
        room.isArchived = true;
      }
    } else {
      // 그룹 방의 경우에도 멤버가 없으면 아카이브
      if (room.members.length === 0) {
        room.isArchived = true;
      }
    }

    // v2.3.0: 시스템 메시지 생성 (퇴장 알림)
    if (room.members.length > 0) {
      // 시퀀스 번호 증가
      room.lastSequenceNumber += 1;
      const sequenceNumber = room.lastSequenceNumber;

      const systemMessage = new Message({
        roomId,
        senderId: userId, // 나간 사람이 보낸 것처럼 처리하거나 별도 시스템 ID 사용 가능
        content: `${username}님이 나갔습니다.`,
        type: 'system',
        sequenceNumber,
      });
      await systemMessage.save();
      room.lastMessage = systemMessage._id;

      // 남은 멤버들에게 실시간 메시지 브로드캐스트
      const messageData = {
        _id: systemMessage._id,
        roomId,
        content: systemMessage.content,
        senderId: userId,
        senderName: 'System',
        sequenceNumber,
        timestamp: systemMessage.timestamp,
      };
      await socketService.sendRoomMessage(roomId, 'system', messageData, userId);
    }

    await room.save();

    // 4. 방에 남아있는 사람들에게 목록 갱신 알림
    for (const memberId of room.members) {
      try {
        const userIdStr = memberId.toString();
        const userChatRoom = await UserChatRoom.findOne({ userId: userIdStr, roomId });
        if (!userChatRoom) continue;

        const unreadCount = Math.max(0, room.lastSequenceNumber - (userChatRoom.lastReadSequenceNumber || 0));

        socketService.notifyRoomListUpdated(userIdStr, {
          _id: roomId,
          isArchived: room.isArchived,
          members: room.members,
          lastMessage: room.lastMessage,
          updatedAt: room.updatedAt,
          unreadCount,
        });
      } catch (err) {
        console.error(`Failed to notify leave room update for user ${memberId}:`, err);
      }
    }

    // 5. v2.3.0: 나간 본인에게도 방 목록이 갱신(제거)되어야 함을 알림
    // 클라이언트가 이 응답을 받으면 목록에서 제거함
    socketService.notifyRoomListUpdated(userId, {
      _id: roomId,
      isRemoved: true, // [v2.4.0] 이 플래그를 통해 프론트엔드에서 즉시 제거
      targetUserId: userId,
    });

    res.json({ message: 'Successfully left the room', roomId });
  } catch (error) {
    console.error('LeaveRoom error:', error);
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
      readBy: [senderId], // [v2.4.0] 보낸 사람은 자동으로 읽음 처리
    });
    await newMessage.save();

    // 3. 채팅방 마지막 메시지 업데이트 및 송신자 읽음 처리
    room.lastMessage = newMessage._id;
    await room.save();

    await UserChatRoom.findOneAndUpdate(
      { userId: senderId, roomId },
      { lastReadSequenceNumber: sequenceNumber, unreadCount: 0 },
    );

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
      readBy: newMessage.readBy,
      timestamp: newMessage.timestamp,
    };

    await socketService.sendRoomMessage(roomId, type, messageData, senderId);

    const allMemberIds = room.members.map((m) => m._id.toString());

    // v2.4.0: 실시간 안읽음 카운트 계산 및 통지
    for (const userId of allMemberIds) {
      try {
        // [v2.4.0] 송신자 본인에게는 불필요한 목록 업데이트 전송 방지 (이미 읽음 상태임)
        if (userId === senderId) continue;

        const userChatRoom = await UserChatRoom.findOne({ userId, roomId });
        if (!userChatRoom) continue;

        const roomObj = room.toObject();
        const unreadCount = Math.max(0, sequenceNumber - (userChatRoom.lastReadSequenceNumber || 0));

        if (roomObj.type === 'direct') {
          const otherMember = roomObj.members.find((m) => m._id.toString() !== userId);
          roomObj.displayName = otherMember ? otherMember.username : 'Unknown';
          roomObj.displayAvatar = otherMember ? otherMember.profileImage : null;
          roomObj.displayStatus = otherMember ? otherMember.status : 'offline';
        } else {
          roomObj.displayName = roomObj.name;
        }

        socketService.notifyRoomListUpdated(userId, {
          ...roomObj,
          targetUserId: userId,
          unreadCount,
          lastMessage: messageData,
        });
      } catch (err) {
        console.error(`Failed to notify room list update for user ${userId}:`, err);
      }
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
      readBy: [senderId], // [v2.4.0] 보낸 사람은 자동으로 읽음 처리
    });
    await newMessage.save();

    // 3. 채팅방 마지막 메시지 업데이트 및 송신자 읽음 처리 (lastReadSequenceNumber 갱신)
    room.lastMessage = newMessage._id;
    await room.save();

    await UserChatRoom.findOneAndUpdate(
      { userId: senderId, roomId },
      { lastReadSequenceNumber: sequenceNumber, unreadCount: 0 },
    );

    // 4. 모든 참여자에게 방 목록 업데이트 알림 (안읽음 카운트 포함)
    const allMemberIds = room.members.map((m) => m._id.toString());
    const sender = room.members.find((m) => m._id.toString() === senderId);

    const messageData = {
      _id: newMessage._id,
      roomId,
      content,
      senderId,
      senderName: sender ? sender.username : 'Unknown',
      sequenceNumber,
      tempId,
      readBy: newMessage.readBy,
      timestamp: newMessage.timestamp,
    };

    for (const userId of allMemberIds) {
      try {
        // [v2.4.0] 송신자 본인에게는 불필요한 목록 업데이트 전송 방지 (이미 읽음 상태임)
        if (userId === senderId) continue;

        const userChatRoom = await UserChatRoom.findOne({ userId, roomId });
        if (!userChatRoom) continue;

        const roomObj = room.toObject();
        const unreadCount = Math.max(0, sequenceNumber - (userChatRoom.lastReadSequenceNumber || 0));

        if (roomObj.type === 'direct') {
          const otherMember = roomObj.members.find((m) => m._id.toString() !== userId);
          roomObj.displayName = otherMember ? otherMember.username : 'Unknown';
          roomObj.displayAvatar = otherMember ? otherMember.profileImage : null;
          roomObj.displayStatus = otherMember ? otherMember.status : 'offline';
        } else {
          roomObj.displayName = roomObj.name;
        }

        socketService.notifyRoomListUpdated(userId, {
          ...roomObj,
          targetUserId: userId,
          unreadCount: unreadCount,
          lastMessage: messageData,
        });
      } catch (err) {
        console.error(`Failed to notify room list update for user ${userId}:`, err);
      }
    }

    // 5. Socket SDK를 통해 실시간 브로드캐스트 (MESSAGE_ADDED)
    await socketService.sendRoomMessage(roomId, newMessage.type, messageData, senderId);

    // 6. 푸시 알림 전송 (현재 방에 있지 않은 모든 유저에게)
    const recipientIds = allMemberIds.filter((id) => id !== senderId);

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

    // 1. 유저의 해당 방 마지막 읽은 시퀀스 갱신 (unreadCount는 이제 이 값으로 계산됨)
    const room = await ChatRoom.findById(roomId).populate('members', 'username profileImage status');
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    await UserChatRoom.findOneAndUpdate(
      { userId, roomId },
      { lastReadSequenceNumber: room.lastSequenceNumber, unreadCount: 0 },
    );

    // 2. 해당 방의 내가 읽지 않은 메시지들에 대해 내 ID 추가
    await Message.updateMany(
      { roomId, senderId: { $ne: userId }, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } },
    );

    // 3. 방의 모든 멤버에게 읽음 상태가 변경되었음을 알림
    socketService.notifyMessageRead(roomId, userId);

    // [v2.4.0] 읽음 처리 시 본인의 방 목록 뱃지도 갱신
    const roomObj = room.toObject();
    if (roomObj.type === 'direct') {
      const otherMember = roomObj.members.find((m) => m._id.toString() !== userId);
      roomObj.displayName = otherMember ? otherMember.username : 'Unknown';
      roomObj.displayAvatar = otherMember ? otherMember.profileImage : null;
    } else {
      roomObj.displayName = roomObj.name;
    }

    socketService.notifyRoomListUpdated(userId, {
      ...roomObj,
      targetUserId: userId,
      unreadCount: 0,
    });

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
