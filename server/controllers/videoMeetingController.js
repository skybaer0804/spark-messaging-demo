const VideoMeeting = require('../models/VideoMeeting');
const ChatRoom = require('../models/ChatRoom');
const notificationService = require('../services/notificationService');
const User = require('../models/User');

exports.getMeetings = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    const meetings = await VideoMeeting.find({
      $or: [
        { hostId: userId },
        { invitedUsers: userId },
        { invitedOrgs: user.orgId }
      ]
    })
      .populate('hostId', 'username avatar')
      .populate('invitedUsers', 'username avatar')
      .populate('invitedOrgs')
      .sort({ scheduledAt: 1 });

    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch meetings', error: error.message });
  }
};

exports.createMeeting = async (req, res) => {
  try {
    const { title, description, scheduledAt, invitedUsers, invitedOrgs } = req.body;
    const hostId = req.user.id;

    // 1. 화상회의 데이터 생성
    const newMeeting = new VideoMeeting({
      title,
      description,
      hostId,
      scheduledAt: new Date(scheduledAt),
      invitedUsers: invitedUsers || [],
      invitedOrgs: invitedOrgs || [],
    });

    await newMeeting.save();

    // 2. 채팅방 자동 생성
    const newRoom = new ChatRoom({
      name: `Meeting: ${title}`,
      members: [hostId, ...(invitedUsers || [])],
      invitedOrgs: invitedOrgs || [],
      roomType: 'VIDEO_MEETING',
      isGroup: true,
    });

    await newRoom.save();
    newMeeting.roomId = newRoom._id;
    await newMeeting.save();

    // 3. 초대 대상자들에게 푸시 알림 예약 (또는 즉시 알림)
    // 여기서는 즉시 "회의가 예약되었습니다" 알림을 보냄
    let recipientIds = [...(invitedUsers || [])];
    if (invitedOrgs && invitedOrgs.length > 0) {
      const orgUsers = await User.find({ orgId: { $in: invitedOrgs } }).select('_id');
      recipientIds = [...new Set([...recipientIds, ...orgUsers.map(u => u._id.toString())])];
    }

    if (recipientIds.length > 0) {
      notificationService.notifyGlobal(
        recipientIds,
        '새 회의 예약',
        `${title} 회의가 ${new Date(scheduledAt).toLocaleString()}에 예약되었습니다.`
      );
    }

    res.status(201).json(newMeeting);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create meeting', error: error.message });
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
