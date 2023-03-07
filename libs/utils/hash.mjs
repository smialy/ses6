import crypto from 'crypto';

export function sha1(name) {
    const hash = crypto.createHash('sha1');
    hash.update(name);
    return hash.digest('hex');
}
