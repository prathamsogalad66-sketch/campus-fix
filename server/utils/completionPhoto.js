const MAX_COMPLETION_PHOTO_BYTES = 8 * 1024 * 1024;

function validateCompletionPhoto(photo) {
    if (photo === undefined || photo === null || photo === '') return null;
    if (typeof photo !== 'string') return 'The completion photo must be an image.';

    const match = photo.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
    if (!match) return 'Upload a JPEG, PNG, or WebP completion photo.';

    const image = Buffer.from(match[2], 'base64');
    if (!image.length || image.toString('base64') !== match[2]) {
        return 'The completion photo is invalid.';
    }
    if (image.length > MAX_COMPLETION_PHOTO_BYTES) {
        return 'The completion photo must be 8 MB or smaller.';
    }

    return null;
}

module.exports = { validateCompletionPhoto };
