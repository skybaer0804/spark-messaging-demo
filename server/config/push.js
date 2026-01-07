const webpush = require('web-push');

const configureWebPush = () => {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidEmail = process.env.VAPID_EMAIL || 'mailto:example@yourdomain.com';

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('VAPID keys are missing. Web-Push notifications will not work.');
    return;
  }

  webpush.setVapidDetails(
    vapidEmail,
    vapidPublicKey,
    vapidPrivateKey
  );

  console.log('Web-Push configured successfully.');
};

module.exports = configureWebPush;

