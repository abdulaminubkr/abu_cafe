---
name: forgot-password-email
description: Add SMTP-based password recovery for role-based auth flows, including temporary passwords, email delivery, and safe login handling.
---

# Forgot Password Email Skill

Use this skill when the project needs a secure “forgot password” flow that sends a temporary password by email instead of exposing a reset link or leaking whether an account exists.

## Goal

Add email-based password recovery for a role-based authentication system such as super_admin, admin, intern, and customer. The flow should:

- accept an email and role
- find the matching user without revealing account existence
- generate a short-lived temporary password
- send the temporary password by email through SMTP
- allow login with that temporary password for a limited time window
- keep the user’s original password unchanged unless they update it later

## Required project context

This project uses:

- Express + Node.js in the server
- role-based auth routes under `server/src/routes/auth.js`
- PostgreSQL queries via the shared database helper
- `nodemailer` for outgoing mail
- `.env` settings for SMTP configuration

## Workflow

### 1. Confirm the role and validate input

- Check that the route parameter matches an allowed role.
- Validate that the request contains an email.
- Normalize email with `String(email).toLowerCase()` before querying the database.
- Use a generic success response even when the email does not exist to avoid account enumeration.

### 2. Look up the matching user

- Query the correct table for the supplied role.
- Example pattern:

  ```js
  const user = await queryOne(
    `SELECT * FROM ${TABLES[role]} WHERE lower(email) = $1`,
    [String(email || '').toLowerCase()]
  );
  ```

- If the user does not exist, still return a success message to keep the response consistent.

### 3. Generate a temporary password

- Create a short, random temporary password.
- Use a secure generator such as `crypto.randomBytes(6).toString('base64url')`.
- Store a hashed version in a temporary in-memory map keyed by role + user ID.
- Set an expiration window such as 30 minutes.

Example:

```js
const TEMP_PASSWORDS = new Map();

function tempPasswordKey(role, userId) {
  return `${role}:${userId}`;
}

TEMP_PASSWORDS.set(tempPasswordKey(role, user.id), {
  hash: hashPassword(tempPassword),
  expiresAt: Date.now() + 1000 * 60 * 30,
});
```

### 4. Configure SMTP transport

Add these environment variables:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-app-password
MAIL_FROM=your-email@example.com
```

Use a transporter factory that returns `null` if configuration is incomplete:

```js
function createMailTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}
```

### 5. Send the email

- Build a message with a clear subject and readable text.
- Use `from: process.env.MAIL_FROM || process.env.SMTP_USER`.
- Send the temporary password to the user’s email address.
- Include instructions that the password expires in a limited time and that the original password remains unchanged unless the user updates it.

Example:

```js
await transporter.sendMail({
  from: process.env.MAIL_FROM || process.env.SMTP_USER,
  to: user.email,
  subject: 'Your temporary A.A Dynamic password',
  text: [
    `Hello ${user.full_name || 'there'},`,
    '',
    'A temporary password was requested for your A.A Dynamic account.',
    '',
    `Temporary password: ${tempPassword}`,
    '',
    'This password expires in 30 minutes. Your existing password remains unchanged unless you update it.',
    '',
    'If you did not request this, you can ignore this email.',
  ].join('\n'),
});
```

### 6. Handle failure safely

- If SMTP config is missing, return `503` with a helpful message such as: “Email service is not configured. Please contact the administrator.”
- If the mail send fails, return `503` and log the error.
- Do not leak whether the email existed or whether the mail was sent.

### 7. Allow login with the temporary password

- In the login flow, check both the real password hash and the temporary password hash.
- Accept the temporary password only while it is still valid and before expiry.
- If a temporary password was used, delete the temporary entry immediately after successful login.

Example logic:

```js
const tempKey = user ? tempPasswordKey(role, user.id) : null;
const tempReset = tempKey ? TEMP_PASSWORDS.get(tempKey) : null;
const tempPasswordValid = tempReset && Date.now() < tempReset.expiresAt && verifyPassword(password, tempReset.hash);

if (!user || (!originalPasswordValid && !tempPasswordValid)) {
  return res.status(401).json({ error: 'Invalid email or password' });
}

if (tempPasswordValid) {
  TEMP_PASSWORDS.delete(tempKey);
}
```

## Decision points

- If `SMTP_HOST`, `SMTP_USER`, or `SMTP_PASSWORD` is missing: fail with `503` instead of silently dropping the email.
- If the user is not found: still return the generic “If that email exists…” message.
- If `sendMail` throws: log the error and return `503` with a retry-friendly message.
- If the temp password is expired: reject login and treat it as invalid credentials.
- If the user logs in successfully using the temporary password: delete the temp entry so it cannot be reused.

## Completion checklist

The task is complete when all of the following are true:

- the forgot-password route responds for each allowed role
- the email service is configured in `.env`
- the temporary password is generated and stored with an expiry
- the email is sent using SMTP
- the login flow accepts the temporary password before expiry
- expired temporary passwords are rejected
- the response message is generic and does not confirm whether an account exists
- the project keeps the existing password unchanged unless a user later updates it

## Example prompts to use with this skill

- “Add forgot password email sending for the admin role using SMTP.”
- “Implement temporary password recovery for interns and customers with 30-minute expiry.”
- “Add a secure forgot-password flow that sends a short-lived password by email and accepts it at login.”
- “Update the auth route to send a temporary password email and validate it before the real password.”

## Related customizations to create next

- `reset-password` skill for a full token-based reset flow with database-backed tokens
- `email-template` skill for branded HTML email templates
- `smtp-setup` skill for production SMTP guidance across SendGrid, Mailgun, and Gmail
- `security-checklist` skill for auth hardening around rate limiting, cooldowns, and password rotation
