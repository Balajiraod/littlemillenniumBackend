const logger = require('../utils/logger');

let firebaseAdmin = null;
try {
  if (process.env.FIREBASE_PROJECT_ID) {
    firebaseAdmin = require('firebase-admin');
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    logger.info('Firebase Admin initialized');
  }
} catch (err) {
  logger.warn('Firebase not initialized:', err.message);
}

const sendPushNotification = async ({ tokens, title, body, data = {} }) => {
  if (!firebaseAdmin || !tokens || tokens.length === 0) {
    logger.info(`[FCM Mock] ${title}: ${body}`);
    return { success: true, mock: true };
  }

  const message = {
    notification: { title, body },
    data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    tokens: Array.isArray(tokens) ? tokens : [tokens],
  };

  try {
    const response = await firebaseAdmin.messaging().sendEachForMulticast(message);
    logger.info(`FCM sent: ${response.successCount}/${tokens.length} delivered`);
    return response;
  } catch (error) {
    logger.error('FCM error:', error);
    throw error;
  }
};

const sendAttendanceNotification = async (child, status, parentFcmTokens) => {
  const statusMessages = {
    present: `✅ ${child.firstName} has arrived at school safely.`,
    absent: `❌ ${child.firstName} is marked absent today.`,
    late: `⏰ ${child.firstName} arrived late to school.`,
  };

  return sendPushNotification({
    tokens: parentFcmTokens,
    title: `Attendance Update - ${child.firstName}`,
    body: statusMessages[status] || `Attendance status: ${status}`,
    data: { type: 'attendance', childId: child._id.toString(), status },
  });
};

const sendFeeReminder = async (parentFcmTokens, invoiceData) => {
  return sendPushNotification({
    tokens: parentFcmTokens,
    title: '💳 Fee Reminder',
    body: `Fee of ₹${invoiceData.balance} is due by ${new Date(invoiceData.dueDate).toLocaleDateString()}`,
    data: { type: 'fee', invoiceId: invoiceData._id.toString() },
  });
};

const sendReportNotification = async (parentFcmTokens, childName, reportType) => {
  return sendPushNotification({
    tokens: parentFcmTokens,
    title: `📊 New Report Available`,
    body: `${reportType} progress report for ${childName} is ready to view.`,
    data: { type: 'report' },
  });
};

const sendActivityUpdate = async (parentFcmTokens, childName, activityTitle) => {
  return sendPushNotification({
    tokens: parentFcmTokens,
    title: `🎯 Activity Update`,
    body: `${childName} participated in "${activityTitle}" today!`,
    data: { type: 'activity' },
  });
};

module.exports = {
  sendPushNotification,
  sendAttendanceNotification,
  sendFeeReminder,
  sendReportNotification,
  sendActivityUpdate,
};
