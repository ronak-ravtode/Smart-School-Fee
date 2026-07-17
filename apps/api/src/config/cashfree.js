const crypto = require('crypto');

const CASHFREE_CLIENT_ID = process.env.CASHFREE_CLIENT_ID || 'TEST10340798a58a698a69d2ebad191989704301'; // Default sandbox fallback if not in env
const CASHFREE_CLIENT_SECRET = process.env.CASHFREE_CLIENT_SECRET || 'TEST494639cfc1a792476b7ba9c2d1b11b7dfb81'; // Default sandbox fallback if not in env

const CASHFREE_BASE_URL = 'https://sandbox.cashfree.com/pg';

/**
 * Verifies the webhook signature sent by Cashfree to guarantee payment authenticity.
 * @param {string} signature - x-webhook-signature header
 * @param {string} rawBody - raw stringified request payload
 * @param {string} timestamp - x-webhook-timestamp header
 * @returns {boolean} - true if signature matches
 */
const verifySignature = (signature, rawBody, timestamp) => {
  const secret = process.env.CASHFREE_CLIENT_SECRET || CASHFREE_CLIENT_SECRET;
  if (!signature || !timestamp || !secret) {
    console.error('Signature verification failed: Missing parameters', { signature, timestamp, hasSecret: !!secret });
    return false;
  }

  const signatureData = timestamp + rawBody;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signatureData)
    .digest('base64');

  return signature === expectedSignature;
};

module.exports = {
  CASHFREE_CLIENT_ID,
  CASHFREE_CLIENT_SECRET,
  CASHFREE_BASE_URL,
  verifySignature
};
