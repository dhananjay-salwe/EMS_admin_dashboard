/**
 * Generates a secure, randomized 6-character password containing at least:
 * - One uppercase letter (A-Z)
 * - One lowercase letter (a-z)
 * - One digit (0-9)
 *
 * Remaining 3 characters are chosen randomly from the combined alphanumeric pool.
 * All characters are shuffled using Fisher-Yates shuffle.
 */
export const generateRandomPassword = () => {
  const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const LOWER = 'abcdefghijklmnopqrstuvwxyz';
  const DIGITS = '0123456789';
  const ALL = UPPER + LOWER + DIGITS;

  const getSecureRandomIndex = (max) => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      return array[0] % max;
    }
    return Math.floor(Math.random() * max);
  };

  const getRandomChar = (pool) => {
    return pool[getSecureRandomIndex(pool.length)];
  };

  // Pick 1 character from each required pool
  // and fill remaining 3 characters from the combined alphanumeric pool
  const chars = [
    getRandomChar(UPPER),
    getRandomChar(LOWER),
    getRandomChar(DIGITS),
    getRandomChar(ALL),
    getRandomChar(ALL),
    getRandomChar(ALL),
  ];

  // Fisher-Yates shuffle so required characters appear in random positions
  for (let i = chars.length - 1; i > 0; i--) {
    const j = getSecureRandomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
};
