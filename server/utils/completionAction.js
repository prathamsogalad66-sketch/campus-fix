const crypto = require('crypto');

const TOKEN_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

function hashCompletionToken(token) {
    return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function getPublicAppOrigin() {
    const configuredOrigin = process.env.PUBLIC_APP_URL ||
        process.env.RENDER_EXTERNAL_URL ||
        process.env.CLIENT_URL ||
        (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5173');

    if (!configuredOrigin) {
        throw new Error('Set PUBLIC_APP_URL to the public URL of the deployed website.');
    }

    let parsedOrigin;
    try {
        parsedOrigin = new URL(configuredOrigin.split(',')[0].trim());
    } catch {
        throw new Error('PUBLIC_APP_URL must be a valid website URL.');
    }

    if (!['http:', 'https:'].includes(parsedOrigin.protocol)) {
        throw new Error('The task completion website URL must use HTTP or HTTPS.');
    }
    if (process.env.NODE_ENV === 'production' &&
        (parsedOrigin.protocol !== 'https:' || /^(localhost|127\.0\.0\.1)$/i.test(parsedOrigin.hostname))) {
        throw new Error('Production task completion links must use the public HTTPS website URL.');
    }

    return parsedOrigin.origin;
}

function createCompletionAction(issueId, assignedWorker) {
    const token = crypto.randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + TOKEN_LIFETIME_MS);
    const link = new URL('/', getPublicAppOrigin());
    link.hash = `complete/${encodeURIComponent(String(issueId))}/${token}`;

    return {
        token,
        tokenHash: hashCompletionToken(token),
        assignedWorker,
        expiresAt,
        url: link.toString(),
    };
}

function isValidCompletionAction(issue, token, now = Date.now()) {
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) return false;
    if (!issue?.completionActionTokenHash || !issue.completionActionExpiresAt || issue.completionActionUsedAt) {
        return false;
    }

    const expected = Buffer.from(issue.completionActionTokenHash, 'hex');
    const actual = Buffer.from(hashCompletionToken(token), 'hex');
    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return false;

    return new Date(issue.completionActionExpiresAt).getTime() > now &&
        issue.completionActionWorker === issue.assignedWorker &&
        !['Resolved', 'Rejected'].includes(issue.status);
}

module.exports = {
    createCompletionAction,
    hashCompletionToken,
    isValidCompletionAction,
};
