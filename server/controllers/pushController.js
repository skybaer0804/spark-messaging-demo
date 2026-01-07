const User = require('../models/User');

exports.subscribe = async (req, res) => {
  try {
    const subscription = req.body;
    const userId = req.user.id;

    // 유저 정보에 푸시 구독 정보 저장
    await User.findByIdAndUpdate(userId, {
      pushSubscription: subscription
    });

    res.status(201).json({ message: 'Subscription saved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save subscription', error: error.message });
  }
};

exports.unsubscribe = async (req, res) => {
  try {
    const userId = req.user.id;

    // 푸시 구독 정보 삭제
    await User.findByIdAndUpdate(userId, {
      $unset: { pushSubscription: "" }
    });

    res.status(200).json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to unsubscribe', error: error.message });
  }
};

