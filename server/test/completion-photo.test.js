const test = require('node:test');
const assert = require('node:assert/strict');
const { validateCompletionPhoto } = require('../utils/completionPhoto');

test('completion photos are optional and accept valid image data URLs', () => {
    assert.equal(validateCompletionPhoto(undefined), null);
    assert.equal(validateCompletionPhoto(''), null);
    assert.equal(validateCompletionPhoto('data:image/jpeg;base64,aGVsbG8='), null);
});

test('completion photos reject unsupported formats and oversized data', () => {
    assert.match(validateCompletionPhoto('not-an-image'), /JPEG, PNG, or WebP/);

    const tooLargePhoto = `data:image/jpeg;base64,${Buffer.alloc(8 * 1024 * 1024 + 1).toString('base64')}`;
    assert.match(validateCompletionPhoto(tooLargePhoto), /8 MB or smaller/);
});
