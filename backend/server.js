require('dotenv').config(); // Load .env file

const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const cookieSession = require('cookie-session');

const app = express();

// === CONFIG ===
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:4000/auth/google/callback';
const SESSION_SECRET = process.env.SESSION_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const PORT = process.env.PORT || 4000;

// === MIDDLEWARE ===
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(cookieSession({
    name: 'session',
    keys: [SESSION_SECRET],
    maxAge: 24 * 60 * 60 * 1000 // 1 day
}));

// === OAUTH CLIENT ===
const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

// === ROUTES ===

// Redirect to Google OAuth
app.get('/auth/google', (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: SCOPES
    });
    res.redirect(url);
});

// OAuth2 callback
app.get('/auth/google/callback', async (req, res) => {
    const code = req.query.code;

    try {
        const { tokens } = await oauth2Client.getToken(code);
        req.session.tokens = tokens; // Save to session
        res.redirect(`${FRONTEND_URL}/mails`);
    } catch (err) {
        console.error('OAuth error:', err);
        res.status(500).send('Authentication failed');
    }
});

// Get Gmail emails
app.get('/api/emails', async (req, res) => {
    if (!req.session.tokens) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    oauth2Client.setCredentials(req.session.tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    try {
        const { data } = await gmail.users.messages.list({
            userId: 'me',
            maxResults: 10
        });

        const messages = data.messages || [];
        const emails = await Promise.all(messages.map(async ({ id }) => {
            const msg = await gmail.users.messages.get({
                userId: 'me',
                id,
                format: 'full',
            });

            const headers = msg.data.payload.headers;
            const getHeader = (name) =>
                headers.find(h => h.name === name)?.value || '';

            return {
                id,
                subject: getHeader('Subject'),
                from: getHeader('From'),
                date: getHeader('Date')
            };
        }));

        res.json(emails);
    } catch (err) {
        console.error('Failed to fetch emails:', err);
        res.status(500).json({ error: 'Failed to fetch emails' });
    }
});

// === START SERVER ===
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
