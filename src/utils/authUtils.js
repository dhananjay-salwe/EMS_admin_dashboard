/**
 * Validates a JWT token's format and expiration timestamp (exp claim)
 * without requiring external third-party dependencies.
 * 
 * @param {string} token - The raw JWT token string
 * @returns {boolean} - Returns true if the token has a valid format and is not expired
 */
export const isTokenValid = (token) => {
  if (!token || typeof token !== 'string') return false;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const base64Url = parts[1];
    if (!base64Url) return false;

    // Convert Base64Url to standard Base64 with padding
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }

    // Safely decode UTF-8 characters from Base64
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const payload = JSON.parse(jsonPayload);

    // If there is no exp claim, cannot guarantee validity
    if (!payload || typeof payload.exp !== 'number') return false;

    // payload.exp is in seconds, Date.now() is in milliseconds
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};
