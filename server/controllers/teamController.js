const Team = require('../models/Team');
const UserTeam = require('../models/UserTeam');
const User = require('../models/User');
const ChatRoom = require('../models/ChatRoom');
const UserChatRoom = require('../models/UserChatRoom');
const notificationService = require('../services/notificationService');
const socketService = require('../services/socketService');

// 팀 생성
exports.createTeam = async (req, res) => {
  try {
    const { teamName, teamDesc, private: isPrivate, members } = req.body;
    const currentUserId = req.user.id;
    const workspaceId = req.headers['x-workspace-id'] || req.body.workspaceId;

    if (!workspaceId) {
      return res.status(400).json({ message: 'workspaceId is required' });
    }

    if (!teamName || teamName.trim() === '') {
      return res.status(400).json({ message: 'teamName is required' });
    }

    // 1. Team 생성
    const newTeam = new Team({
      teamName: teamName.trim(),
      teamDesc: teamDesc ? teamDesc.trim() : '',
      private: isPrivate || false,
      workspaceId,
      createdBy: currentUserId,
    });
    await newTeam.save();

    // 2. 생성자를 owner로 UserTeam에 추가
    const ownerRecord = new UserTeam({
      userId: currentUserId,
      teamId: newTeam._id,
      role: 'owner',
    });
    await ownerRecord.save();

    // 3. 초기 멤버들 추가 (생성자 제외)
    const allMemberIds = [currentUserId, ...(members || [])];
    const uniqueMemberIds = [...new Set(allMemberIds.map((id) => id.toString()))];

    if (members && Array.isArray(members) && members.length > 0) {
      const memberRecords = members
        .filter((id) => id.toString() !== currentUserId.toString())
        .map((userId) => ({
          userId,
          teamId: newTeam._id,
          role: 'member',
          invitedBy: currentUserId,
        }));

      if (memberRecords.length > 0) {
        await UserTeam.insertMany(memberRecords);

        // 초대 알림 발송
        const creator = await User.findById(currentUserId).select('username');
        memberRecords.forEach((record) => {
          notificationService.sendPushNotification(
            record.userId,
            {
              title: `${newTeam.teamName} 팀 초대`,
              body: `${creator.username}님이 당신을 팀에 초대했습니다.`,
              icon: '/asset/spark_icon_192.png',
              data: {
                url: `/chatapp/team/${newTeam._id}`,
                teamId: newTeam._id.toString(),
                type: 'team_invitation',
              },
            },
            null,
          );
        });
      }
    }

    // 4. 팀 채팅방 생성
    const teamChatRoom = new ChatRoom({
      name: newTeam.teamName,
      description: newTeam.teamDesc || '',
      type: 'team',
      workspaceId,
      teamId: newTeam._id,
      members: uniqueMemberIds,
      isPrivate: isPrivate || false,
    });
    await teamChatRoom.save();

    // 5. 모든 멤버에 대해 UserChatRoom 초기 레코드 생성
    const userChatRoomPromises = uniqueMemberIds.map((userId) =>
      UserChatRoom.findOneAndUpdate(
        { userId, roomId: teamChatRoom._id },
        {
          userId,
          roomId: teamChatRoom._id,
          lastReadSequenceNumber: teamChatRoom.lastSequenceNumber,
          unreadCount: 0,
        },
        { upsert: true, new: true },
      ),
    );
    await Promise.all(userChatRoomPromises);

    // 6. 모든 멤버에게 방 목록 업데이트 알림
    uniqueMemberIds.forEach((userId) => {
      socketService.notifyRoomListUpdated(userId);
    });

    // 7. populate하여 응답
    const populatedTeam = await Team.findById(newTeam._id).populate('createdBy', 'username profileImage');

    // 멤버 정보도 함께 조회
    const teamMembers = await UserTeam.find({ teamId: newTeam._id })
      .populate('userId', 'username profileImage status')
      .populate('invitedBy', 'username');

    res.status(201).json({
      ...populatedTeam.toObject(),
      members: teamMembers.map((ut) => ({
        ...ut.userId.toObject(),
        role: ut.role,
        joinedAt: ut.joinedAt,
      })),
    });
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ message: 'Failed to create team', error: error.message });
  }
};

// 팀 목록 조회 (비공개 필터링 포함)
exports.getTeams = async (req, res) => {
  try {
    const userId = req.user.id;
    const { workspaceId } = req.query;

    if (!workspaceId) {
      return res.status(400).json({ message: 'workspaceId is required' });
    }

    // 1. 유저가 속한 팀 ID 목록 조회
    const userTeams = await UserTeam.find({ userId }).select('teamId');
    const userTeamIds = userTeams.map((ut) => ut.teamId);

    // 2. 팀 조회: 공개 팀 또는 유저가 속한 비공개 팀
    const teams = await Team.find({
      workspaceId,
      $or: [{ private: false }, { private: true, _id: { $in: userTeamIds } }],
    })
      .populate('createdBy', 'username profileImage')
      .sort({ createdAt: -1 });

    // 3. 각 팀의 멤버 정보도 함께 조회
    const teamsWithMembers = await Promise.all(
      teams.map(async (team) => {
        const members = await UserTeam.find({ teamId: team._id })
          .populate('userId', 'username profileImage status')
          .populate('invitedBy', 'username');

        const teamObj = team.toObject();
        return {
          ...teamObj,
          // createdBy가 ObjectId인 경우 그대로 유지 (클라이언트에서 처리)
          createdBy: teamObj.createdBy,
          members: members.map((ut) => ({
            ...ut.userId.toObject(),
            role: ut.role,
            joinedAt: ut.joinedAt,
          })),
        };
      }),
    );

    res.json(teamsWithMembers);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ message: 'Failed to fetch teams', error: error.message });
  }
};

// 특정 팀 조회
exports.getTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;

    const team = await Team.findById(teamId).populate('createdBy', 'username profileImage');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // 비공개 팀인 경우 멤버인지 확인
    if (team.private) {
      const userTeam = await UserTeam.findOne({ userId, teamId });
      if (!userTeam) {
        return res.status(403).json({ message: 'Access denied. This is a private team.' });
      }
    }

    // 멤버 정보 조회
    const members = await UserTeam.find({ teamId })
      .populate('userId', 'username profileImage status')
      .populate('invitedBy', 'username');

    res.json({
      ...team.toObject(),
      members: members.map((ut) => ({
        ...ut.userId.toObject(),
        role: ut.role,
        joinedAt: ut.joinedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ message: 'Failed to fetch team', error: error.message });
  }
};

// 팀 정보 수정
exports.updateTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { teamName, teamDesc, private: isPrivate } = req.body;
    const currentUserId = req.user.id;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // 권한 체크: owner 또는 admin만 수정 가능
    const userTeam = await UserTeam.findOne({ userId: currentUserId, teamId });
    if (!userTeam || !['owner', 'admin'].includes(userTeam.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const updateData = {};
    if (teamName !== undefined) updateData.teamName = teamName.trim();
    if (teamDesc !== undefined) updateData.teamDesc = teamDesc ? teamDesc.trim() : '';
    if (isPrivate !== undefined) updateData.private = isPrivate;

    const updatedTeam = await Team.findByIdAndUpdate(teamId, { $set: updateData }, { new: true }).populate(
      'createdBy',
      'username profileImage',
    );

    // 팀과 연결된 ChatRoom도 업데이트
    const teamChatRoom = await ChatRoom.findOne({ teamId, type: 'team' });
    if (teamChatRoom) {
      const roomUpdateData = {};
      if (teamName !== undefined) roomUpdateData.name = teamName.trim();
      if (teamDesc !== undefined) roomUpdateData.description = teamDesc ? teamDesc.trim() : '';
      if (isPrivate !== undefined) roomUpdateData.isPrivate = isPrivate;
      
      if (Object.keys(roomUpdateData).length > 0) {
        await ChatRoom.findByIdAndUpdate(teamChatRoom._id, { $set: roomUpdateData });
        // 모든 멤버에게 방 목록 업데이트 알림
        const teamMembers = await UserTeam.find({ teamId }).select('userId');
        teamMembers.forEach((ut) => {
          socketService.notifyRoomListUpdated(ut.userId);
        });
      }
    }

    // 멤버 정보도 함께 조회
    const members = await UserTeam.find({ teamId })
      .populate('userId', 'username profileImage status')
      .populate('invitedBy', 'username');

    res.json({
      ...updatedTeam.toObject(),
      members: members.map((ut) => ({
        ...ut.userId.toObject(),
        role: ut.role,
        joinedAt: ut.joinedAt,
      })),
    });
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ message: 'Failed to update team', error: error.message });
  }
};

// 팀 삭제
exports.deleteTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const currentUserId = req.user.id;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // owner만 삭제 가능
    const userTeam = await UserTeam.findOne({ userId: currentUserId, teamId });
    if (!userTeam || userTeam.role !== 'owner') {
      return res.status(403).json({ message: 'Only team owner can delete the team' });
    }

    // 팀과 연결된 ChatRoom 찾기 및 삭제
    const teamChatRoom = await ChatRoom.findOne({ teamId, type: 'team' });
    if (teamChatRoom) {
      // UserChatRoom 레코드 삭제
      await UserChatRoom.deleteMany({ roomId: teamChatRoom._id });
      // ChatRoom 삭제
      await ChatRoom.findByIdAndDelete(teamChatRoom._id);
      
      // 모든 멤버에게 방 목록 업데이트 알림
      const teamMembers = await UserTeam.find({ teamId }).select('userId');
      teamMembers.forEach((ut) => {
        socketService.notifyRoomListUpdated(ut.userId);
      });
    }

    // UserTeam 레코드도 함께 삭제 (cascade)
    await UserTeam.deleteMany({ teamId });

    // Team 삭제
    await Team.findByIdAndDelete(teamId);

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ message: 'Failed to delete team', error: error.message });
  }
};

// 멤버 초대 (비공개 팀)
exports.inviteMembers = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { userIds } = req.body; // 배열
    const currentUserId = req.user.id;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'userIds array is required' });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // 권한 체크: owner 또는 admin만 초대 가능
    const userTeam = await UserTeam.findOne({ userId: currentUserId, teamId });
    if (!userTeam || !['owner', 'admin'].includes(userTeam.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // 이미 멤버인지 체크
    const existingMembers = await UserTeam.find({
      teamId,
      userId: { $in: userIds },
    });
    const existingUserIds = existingMembers.map((em) => em.userId.toString());
    const newUserIds = userIds.filter((id) => !existingUserIds.includes(id.toString()));

    if (newUserIds.length === 0) {
      return res.status(400).json({ message: 'All users are already members' });
    }

    // 새 멤버 추가
    const memberRecords = newUserIds.map((userId) => ({
      userId,
      teamId,
      role: 'member',
      invitedBy: currentUserId,
    }));

    await UserTeam.insertMany(memberRecords);

    // 초대 알림 발송
    const creator = await User.findById(currentUserId).select('username');
    newUserIds.forEach((userId) => {
      notificationService.sendPushNotification(
        userId,
        {
          title: `${team.teamName} 팀 초대`,
          body: `${creator.username}님이 당신을 팀에 초대했습니다.`,
          icon: '/asset/spark_icon_192.png',
          data: {
            url: `/chatapp/team/${teamId}`,
            teamId: teamId.toString(),
            type: 'team_invitation',
          },
        },
        null,
      );
    });

    res.json({
      message: 'Members invited successfully',
      invitedCount: newUserIds.length,
    });
  } catch (error) {
    console.error('Error inviting members:', error);
    res.status(500).json({ message: 'Failed to invite members', error: error.message });
  }
};

// 멤버 제거
exports.removeMember = async (req, res) => {
  try {
    const { teamId, userId } = req.params;
    const currentUserId = req.user.id;

    // 권한 체크
    const currentUserTeam = await UserTeam.findOne({ userId: currentUserId, teamId });
    if (!currentUserTeam || !['owner', 'admin'].includes(currentUserTeam.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // owner는 자기 자신을 제거할 수 없음 (팀 삭제 필요)
    const targetUserTeam = await UserTeam.findOne({ userId, teamId });
    if (targetUserTeam?.role === 'owner') {
      return res.status(400).json({ message: 'Cannot remove team owner' });
    }

    await UserTeam.findOneAndDelete({ userId, teamId });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ message: 'Failed to remove member', error: error.message });
  }
};
