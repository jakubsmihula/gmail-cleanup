require('dotenv').config({ path: '/Users/jakubsmihula/WebstormProjects/gmail-cleanup-git/backend/.env' });

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
const SCOPES = ['https://mail.google.com'];
const PORT = process.env.PORT || 4000;

// === VALIDATE ESSENTIAL ENV VARS ===
if (!SESSION_SECRET) {
    console.error('Error: SESSION_SECRET environment variable is not set.');
    process.exit(1);
}

// === MIDDLEWARE ===
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
}));

app.use(cookieSession({
    name: 'session',
    keys: [SESSION_SECRET],  // safe now because SESSION_SECRET is validated
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
}));

// === OAUTH CLIENT ===
const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

// === ROUTES ===

// Start Google OAuth login flow
app.get('/auth/google', (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: SCOPES,
    });
    res.redirect(url);
});

// OAuth2 callback - handle Google response and store tokens in session
app.get('/auth/google/callback', async (req, res) => {
    const code = req.query.code;

    try {
        const { tokens } = await oauth2Client.getToken(code);
        req.session.tokens = tokens;
        res.redirect(`${FRONTEND_URL}/mails`);
    } catch (err) {
        console.error('OAuth error:', err);
        res.status(500).send('Authentication failed');
    }
});

// Logout route - clear session
app.get('/auth/logout', (req, res) => {
    req.session = null;
    res.redirect(FRONTEND_URL);
});

// Get emails from Gmail API
// In your backend /api/emails route handler:

app.get('/api/emails', async (req, res) => {
    if (!req.session.tokens) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    oauth2Client.setCredentials(req.session.tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const maxResults = parseInt(req.query.maxResults) || 20;
    const pageToken = req.query.pageToken;
    const labelIds = req.query.labelIds ? req.query.labelIds.split(',') : undefined;
    const includeSpamTrash = req.query.includeSpamTrash === 'true';

    let q = req.query.q || '';

    // Handle dateFrom and dateTo using Gmail's query syntax
    const { dateFrom, dateTo } = req.query;

    if (dateFrom) {
        const after = Math.floor(new Date(dateFrom).getTime() / 1000);
        q += ` after:${after}`;
    }

    if (dateTo) {
        const before = Math.floor(new Date(dateTo).getTime() / 1000);
        q += ` before:${before}`;
    }

    try {
        const response = await gmail.users.messages.list({
            userId: 'me',
            maxResults,
            pageToken,
            labelIds,
            q: q.trim(),
            includeSpamTrash
        });

        const messages = response.data.messages || [];
        const nextPageToken = response.data.nextPageToken;

        const emails = await Promise.all(
            messages.map(async (msg) => {
                const message = await gmail.users.messages.get({
                    userId: 'me',
                    id: msg.id,
                    format: 'metadata',
                    metadataHeaders: ['Subject', 'From', 'Date']
                });

                const headers = message.data.payload.headers;
                const getHeader = (name) => headers.find(h => h.name === name)?.value || '';

                return {
                    id: msg.id,
                    subject: getHeader('Subject'),
                    from: getHeader('From'),
                    date: getHeader('Date')
                };
            })
        );

        res.json({ emails, nextPageToken });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch emails' });
    }
});

app.post('/api/emails/delete', express.json(), async (req, res) => {
    if (!req.session.tokens) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const ids  = req.body.emailIds;
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'No email IDs provided' });
    }

    oauth2Client.setCredentials(req.session.tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    try {
        await Promise.all(ids.map(id =>
            gmail.users.messages.delete({
                userId: 'me',
                id
            })
        ));

        res.json({ success: true });
    } catch (err) {
        console.error('Failed to delete emails:', err);
        res.status(500).json({ error: 'Failed to delete emails' });
    }
});

app.get('/auth/logout', (req, res) => {
    req.session = null;
    res.redirect(FRONTEND_URL);
});

app.get('/api/auth/status', (req, res) => {
    if (req.session.tokens) {
        res.json({ loggedIn: true });
    } else {
        res.json({ loggedIn: false });
    }
});

app.get('/api/emails/summary', async (req, res) => {
    if (!req.session.tokens) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    oauth2Client.setCredentials(req.session.tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    try {
        const labelResponse = await gmail.users.labels.list({
            userId: 'me'
        });

        const labels = labelResponse.data.labels;

        const unreadLabel = labels.find(l => l.id === 'UNREAD');

        if (!unreadLabel) {
            return res.status(500).json({ error: 'Required labels not found' });
        }

        const unread = await gmail.users.labels.get({ userId: 'me', id: unreadLabel.id });

        res.json({
            unreadEmails: unread.data.messagesUnread
        });
    } catch (err) {
        console.error('Failed to fetch email summary:', err);
        res.status(500).json({ error: 'Failed to fetch email summary' });
    }
});


// === START SERVER ===
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
