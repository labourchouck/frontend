/**
 * The Razorpay public key to open checkout with. The server sends it with every order (so it always matches the
 * key that created the order, whatever this build was compiled with); VITE_RAZORPAY_KEY_ID is only a fallback.
 * Throws a readable error instead of opening a checkout that can only fail.
 */
export function pickRazorpayKey(serverKeyId) {
  const key = [serverKeyId, import.meta.env.VITE_RAZORPAY_KEY_ID].find((k) => typeof k === 'string' && /^rzp_(test|live)_/.test(k))
  if (!key) throw new Error('Online payment is not available right now. Please try again later.')
  return key
}
