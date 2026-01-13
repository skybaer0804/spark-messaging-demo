const VideoMeeting = require('../models/VideoMeeting');
const ChatRoom = require('../models/ChatRoom');
const notificationService = require('../services/notificationService');
const User = require('../models/User');
const crypto = require('crypto');

exports.getMeetings = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    const meetings = await VideoMeeting.find({
      $or: [{ hostId: userId }, { invitedUsers: userId }, { invitedWorkspaces: { $in: user.workspaces } }],
    })
      .populate('hostId', 'username profileImage')
      .populate('invitedUsers', 'username profileImage')
      .populate('invitedWorkspaces')
      .sort({ scheduledAt: 1 });

    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch meetings', error: error.message });
  }
};

exports.createMeeting = async (req, res) => {
  try {
    const {
      title,
      description,
      scheduledAt,
      invitedUsers,
      invitedWorkspaces,
      isReserved,
      isPrivate,
      password,
      workspaceId: bodyWorkspaceId,
    } = req.body;
    const hostId = req.user.id;

    // v2.2.0: workspaceId가 body에 없으면 헤더에서 확인
    const workspaceId = bodyWorkspaceId || req.headers['x-workspace-id'];

    if (!workspaceId) {
      return res.status(400).json({ message: 'workspaceId is required' });
    }

    if (isReserved && !scheduledAt) {
      return res.status(400).json({ message: 'scheduledAt is required for reserved meetings' });
    }

    // joinHash 생성 (랜덤 12자리)
    const joinHash = crypto.randomBytes(6).toString('hex');

    // .env에서 최대 참가자 수 가져오기
    const maxParticipants = parseInt(process.env.VIDEO_MEETING_MAX_PARTICIPANTS || '20', 10);

    // 1. 화상회의 데이터 생성
    const newMeeting = new VideoMeeting({
      title,
      description,
      hostId,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(), // 없으면 현재 시간으로 설정
      invitedUsers: invitedUsers || [],
      invitedWorkspaces: invitedWorkspaces || [],
      isReserved: isReserved || false,
      isPrivate: isPrivate || false,
      password: password || null,
      joinHash,
      status: 'scheduled',
      maxParticipants, // 설정 적용
    });

    await newMeeting.save();

    // 2. 채팅방 자동 생성
    const newRoom = new ChatRoom({
      name: `Meeting: ${title}`,
      members: [hostId, ...(invitedUsers || [])],
      workspaceId,
      type: 'public',
    });

    await newRoom.save();
    newMeeting.roomId = newRoom._id;
    await newMeeting.save();

    // 3. 초대 대상자들에게 푸시 알림 즉시 전송
    let recipientIds = [...(invitedUsers || [])];
    if (invitedWorkspaces && invitedWorkspaces.length > 0) {
      const workspaceUsers = await User.find({ workspaces: { $in: invitedWorkspaces } }).select('_id');
      recipientIds = [...new Set([...recipientIds, ...workspaceUsers.map((u) => u._id.toString())])];
    }

    if (recipientIds.length > 0) {
      notificationService.notifyGlobal(recipientIds, '새 회의 초대', `${title} 회의에 초대되었습니다.`, {
        actionUrl: `/video-meeting/join/${joinHash}`,
        metadata: { type: 'meeting', meetingId: newMeeting._id.toString() },
      });
    }

    // 4. 예약 회의인 경우 1분 전 알림 예약 로직은 schedulerService에서 별도로 처리하거나
    // 여기에 Notification 모델을 생성하여 저장 (schedulerService가 긁어갈 수 있도록)
    if (isReserved) {
      const Notification = require('../models/Notification');
      const reminderTime = new Date(new Date(scheduledAt).getTime() - 60000); // 1분 전

      const reminderNotification = new Notification({
        title: `회의 시작 1분 전: ${title}`,
        content: `잠시 후 ${title} 회의가 시작됩니다. 참여를 준비해주세요.`,
        senderId: hostId,
        scheduledAt: reminderTime,
        targetType: 'all', // 단순화를 위해 all로 설정 (필요시 invitedUsers 타겟팅 로직 추가)
        actionUrl: `/video-meeting/join/${joinHash}`,
        metadata: { type: 'meeting_reminder', meetingId: newMeeting._id.toString() },
      });
      await reminderNotification.save();
    }

    res.status(201).json(newMeeting);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create meeting', error: error.message });
  }
};

exports.getMeetingByHash = async (req, res) => {
  try {
    const { hash } = req.params;
    const meeting = await VideoMeeting.findOne({ joinHash: hash })
      .populate('hostId', 'username profileImage')
      .select('-password'); // 비밀번호는 제외하고 반환

    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch meeting', error: error.message });
  }
};

exports.verifyMeetingPassword = async (req, res) => {
  try {
    const { hash } = req.params;
    const { password } = req.body;

    const meeting = await VideoMeeting.findOne({ joinHash: hash });
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    if (meeting.isPrivate && meeting.password !== password) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    res.json({ success: true, message: 'Password verified' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify password', error: error.message });
  }
};

exports.startMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meeting = await VideoMeeting.findById(meetingId);

    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    if (meeting.hostId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only host can start the meeting' });
    }

    meeting.status = 'ongoing';
    await meeting.save();

    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: 'Failed to start meeting', error: error.message });
  }
};

exports.deleteMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meeting = await VideoMeeting.findById(meetingId);

    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    if (meeting.hostId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only host can delete the meeting' });
    }

    // 연관된 채팅방 삭제 (또는 아카이브)
    if (meeting.roomId) {
      await ChatRoom.findByIdAndUpdate(meeting.roomId, { isArchived: true });
    }

    await VideoMeeting.findByIdAndDelete(meetingId);

    res.json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete meeting', error: error.message });
  }
};
