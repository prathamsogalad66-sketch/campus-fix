const test = require('node:test');
const assert = require('node:assert/strict');
const { createCompletionAction, isValidCompletionAction } = require('../utils/completionAction');
const { getWhatsAppUrl } = require('../utils/whatsapp');

test('completion links are random, assignment-bound, expiring, and one-time', () => {
    const previousEnvironment = {
        nodeEnv: process.env.NODE_ENV,
        publicAppUrl: process.env.PUBLIC_APP_URL,
        renderExternalUrl: process.env.RENDER_EXTERNAL_URL,
        clientUrl: process.env.CLIENT_URL,
    };
    process.env.NODE_ENV = 'production';
    process.env.RENDER_EXTERNAL_URL = 'https://campus-fix.onrender.com';
    delete process.env.PUBLIC_APP_URL;
    delete process.env.CLIENT_URL;

    try {
        const action = createCompletionAction('task-123', 'Ramesh Kumar (Electrician)');
        const issue = {
            assignedWorker: action.assignedWorker,
            completionActionTokenHash: action.tokenHash,
            completionActionWorker: action.assignedWorker,
            completionActionExpiresAt: action.expiresAt,
            completionActionUsedAt: null,
            status: 'In progress',
        };

        assert.match(action.url, /^https:\/\/campus-fix\.onrender\.com\/#complete\/task-123\/[A-Za-z0-9_-]{43}$/);
        assert.equal(isValidCompletionAction(issue, action.token), true);
        assert.equal(isValidCompletionAction(issue, `${action.token.slice(0, -1)}x`), false);
        assert.equal(isValidCompletionAction({ ...issue, assignedWorker: 'Another worker' }, action.token), false);
        assert.equal(isValidCompletionAction({ ...issue, completionActionUsedAt: new Date() }, action.token), false);
        assert.equal(isValidCompletionAction(issue, action.token, action.expiresAt.getTime()), false);
    } finally {
        if (previousEnvironment.nodeEnv === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = previousEnvironment.nodeEnv;
        if (previousEnvironment.publicAppUrl === undefined) delete process.env.PUBLIC_APP_URL;
        else process.env.PUBLIC_APP_URL = previousEnvironment.publicAppUrl;
        if (previousEnvironment.renderExternalUrl === undefined) delete process.env.RENDER_EXTERNAL_URL;
        else process.env.RENDER_EXTERNAL_URL = previousEnvironment.renderExternalUrl;
        if (previousEnvironment.clientUrl === undefined) delete process.env.CLIENT_URL;
        else process.env.CLIENT_URL = previousEnvironment.clientUrl;
    }
});

test('production completion links reject non-HTTPS website origins', () => {
    const previousEnvironment = {
        nodeEnv: process.env.NODE_ENV,
        publicAppUrl: process.env.PUBLIC_APP_URL,
        renderExternalUrl: process.env.RENDER_EXTERNAL_URL,
        clientUrl: process.env.CLIENT_URL,
    };
    process.env.NODE_ENV = 'production';
    process.env.PUBLIC_APP_URL = 'http://localhost:5173';
    delete process.env.RENDER_EXTERNAL_URL;
    delete process.env.CLIENT_URL;

    try {
        assert.throws(
            () => createCompletionAction('task-123', 'Ramesh Kumar'),
            /public HTTPS website URL/
        );
    } finally {
        if (previousEnvironment.nodeEnv === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = previousEnvironment.nodeEnv;
        if (previousEnvironment.publicAppUrl === undefined) delete process.env.PUBLIC_APP_URL;
        else process.env.PUBLIC_APP_URL = previousEnvironment.publicAppUrl;
        if (previousEnvironment.renderExternalUrl === undefined) delete process.env.RENDER_EXTERNAL_URL;
        else process.env.RENDER_EXTERNAL_URL = previousEnvironment.renderExternalUrl;
        if (previousEnvironment.clientUrl === undefined) delete process.env.CLIENT_URL;
        else process.env.CLIENT_URL = previousEnvironment.clientUrl;
    }
});

test('WhatsApp dispatch text contains the worker completion link', () => {
    const completionUrl = 'https://campus-fix.onrender.com/#complete/task-123/abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG';
    const whatsappUrl = getWhatsAppUrl('918123751706', {
        issueTitle: 'Block A Cleaning',
        location: 'Block A',
        priority: 'High',
        adminNotes: '',
        completionUrl,
    });

    assert.ok(new URL(whatsappUrl).searchParams.get('text').includes(completionUrl));
});
