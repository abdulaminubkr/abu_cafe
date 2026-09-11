const { query } = require('../db');

async function logAction(user, action, details = '') {
  if (!user || !['admin', 'super_admin'].includes(user.role)) return;
  await query(
    'INSERT INTO audit_logs (actor_type, actor_id, actor_name, action, details) VALUES ($1, $2, $3, $4, $5)',
    [user.role, user.userId, user.name, action, details]
  );
}

async function notify(recipientType, recipientId, title, message) {
  await query(
    'INSERT INTO notifications (recipient_type, recipient_id, title, message) VALUES ($1, $2, $3, $4)',
    [recipientType, recipientId, title, message]
  );
}

module.exports = { logAction, notify };
