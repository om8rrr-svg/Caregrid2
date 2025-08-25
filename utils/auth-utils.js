// utils/auth-utils.js

const TOKEN_KEY = 'careGridToken';
const USER_KEY = 'careGridCurrentUser';

// ----- TOKEN -----
function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(TOKEN_KEY, token);
    // Optional cookie for SSR if needed
    document.cookie = `${TOKEN_KEY}=${token};path=/;domain=.caregrid.co.uk;secure;samesite=None`;
  } catch (err) {
    console.error('Error setting token:', err);
  }
}

function getToken() {
  try {
    return (
      localStorage.getItem(TOKEN_KEY) ||
      sessionStorage.getItem(TOKEN_KEY) ||
      getCookie(TOKEN_KEY)
    );
  } catch {
    return null;
  }
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.caregrid.co.uk`;
}

// ----- USER -----
function setUser(userObj) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(userObj));
  } catch (err) {
    console.error('Error saving user:', err);
  }
}

function getUser() {
  try {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function clearUser() {
  localStorage.removeItem(USER_KEY);
}

// ----- COOKIES -----
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

// ----- AUTH CHECK -----
function isAuthenticated() {
  return !!getToken();
}

// ----- LOGOUT -----
function logout() {
  clearToken();
  clearUser();
  window.location.href = '/auth.html';
}

// Make functions available globally
window.AuthUtils = {
  setToken,
  getToken,
  clearToken,
  setUser,
  getUser,
  clearUser,
  isAuthenticated,
  logout
};