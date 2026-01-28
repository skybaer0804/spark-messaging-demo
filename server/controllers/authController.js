const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userService = require('../services/userService');

exports.register = async (req, res, next) => {
  try {
    const { email, password, username } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ email, password: hashedPassword, username });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: {
        id: user._id,
        email,
        username,
        workspaces: user.workspaces,
        companyId: user.companyId,
        deptId: user.deptId,
      },
    });
  } catch (error) {
    console.error('--- Register Handler Error ---');
    console.error('Error detail:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
      stack: error.stack,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Redis에 온라인 상태 저장
    await userService.setUserStatus(user._id, 'online');

    res.json({
      token,
      user: {
        id: user._id,
        email,
        username: user.username,
        workspaces: user.workspaces,
        companyId: user.companyId,
        deptId: user.deptId,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const userId = req.user.id;
    // Redis에 오프라인 상태 저장
    await userService.setUserStatus(userId, 'offline');
    
    // v2.3.0: 로그아웃 시간 기록
    await User.findByIdAndUpdate(userId, { lastLogoutAt: new Date() });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { workspaceId } = req.query;
    const query = { _id: { $ne: req.user.id } };

    if (workspaceId) {
      query.workspaces = workspaceId;
    }

    const users = await User.find(query).select('username email profileImage status workspaces companyId deptId');

    // Redis에서 실시간 상태 가져오기
    const userIds = users.map((u) => u._id.toString());
    const statuses = await userService.getUsersStatus(userIds);

    const usersWithStatus = users.map((user) => {
      const userObj = user.toObject();
      return {
        ...userObj,
        status: statuses[user._id.toString()] || userObj.status || 'offline',
      };
    });

    res.json(usersWithStatus);
  } catch (error) {
    console.error('GetAllUsers error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { username, profileImage, status, statusText, role } = req.body;
    const userId = req.user.id;

    const updateData = {};
    if (username) updateData.username = username;
    if (profileImage) updateData.profileImage = profileImage;
    if (status) updateData.status = status;
    if (statusText !== undefined) updateData.statusText = statusText;
    if (role) updateData.role = role;

    const updatedUser = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true }).select('-password');

    res.json(updatedUser);
  } catch (error) {
    console.error('UpdateProfile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
