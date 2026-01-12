const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userService = require('../services/userService');

exports.register = async (req, res, next) => {
  try {
    console.log('--- Register Handler Start ---');
    const { email, password, username } = req.body;
    console.log('Register attempt payload:', { email, username });

    // Check if user already exists
    console.log('Step 1: Checking if user exists...');
    let user = await User.findOne({ email });
    if (user) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    console.log('Step 2: Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log('Step 3: Creating and saving user...');
    user = new User({ email, password: hashedPassword, username });
    await user.save();
    console.log('User saved successfully:', user._id);

    console.log('Step 4: Signing JWT...');
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    console.log('Step 5: Sending response...');
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
    console.log('--- Register Handler End ---');
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
    console.log('Login attempt:', email);

    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Password mismatch for:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Redis에 온라인 상태 저장
    await userService.setUserStatus(user._id, 'online');
    console.log('Login successful:', email);

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
    console.log('Logout successful for user:', userId);
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

exports.updateNotificationSettings = async (req, res) => {
  try {
    const { globalEnabled, roomPreferences } = req.body;
    const userId = req.user.id;

    const updateData = {};
    if (globalEnabled !== undefined) updateData['notificationSettings.globalEnabled'] = globalEnabled;
    if (roomPreferences !== undefined) {
      // roomPreferences is expected to be { roomId: boolean }
      for (const [roomId, enabled] of Object.entries(roomPreferences)) {
        updateData[`notificationSettings.roomPreferences.${roomId}`] = enabled;
      }
    }

    await User.findByIdAndUpdate(userId, { $set: updateData });
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('UpdateSettings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { username, profileImage, status, statusText } = req.body;
    const userId = req.user.id;

    const updateData = {};
    if (username) updateData.username = username;
    if (profileImage) updateData.profileImage = profileImage;
    if (status) updateData.status = status;
    if (statusText !== undefined) updateData.statusText = statusText;

    const updatedUser = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true }).select('-password');

    res.json(updatedUser);
  } catch (error) {
    console.error('UpdateProfile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
