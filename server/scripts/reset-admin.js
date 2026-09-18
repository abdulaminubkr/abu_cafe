const { query } = require('../src/db');
const { hashPassword } = require('../src/utils/password');

(async () => {
  const email = 'abdulaminubkr@gmail.com';
  const newPassword = 'Admin@123';

  const result = await query(
    'UPDATE admins SET password_hash = $1 WHERE lower(email) = lower($2) RETURNING id, email, full_name',
    [hashPassword(newPassword), email]
  );

  console.log('Updated admin rows:', JSON.stringify(result.rows, null, 2));
})();
