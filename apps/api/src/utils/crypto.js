const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'smart_school_secret_encryption_key_2026'; // 32-character key fallback
const IV_LENGTH = 16;

function encrypt(text) {
  if (!text) return null;
  // Pad/slice to 32 bytes
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32).substring(0, 32));
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  if (!text) return null;
  try {
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32).substring(0, 32));
    const textParts = text.split(':');
    if (textParts.length < 2) return text; // Not encrypted/malformed
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    console.error('Decryption failed, returning original string:', err.message);
    return text;
  }
}

module.exports = {
  encrypt,
  decrypt
};
