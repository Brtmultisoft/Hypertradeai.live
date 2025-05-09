import { AuthContext } from '../context/AuthContext';

/**
 * Get the authentication token from localStorage
 * @returns {string|null} The authentication token or null if not found
 */
export const getToken = () => {
  return localStorage.getItem('admin_token');
};

/**
 * Set the authentication token in localStorage
 * @param {string} token - The authentication token to store
 */
export const setToken = (token) => {
  if (token) {
    localStorage.setItem('admin_token', token);
  } else {
    localStorage.removeItem('admin_token');
  }
};

/**
 * Remove the authentication token from localStorage
 */
export const removeToken = () => {
  localStorage.removeItem('admin_token');
};

/**
 * Check if the user is authenticated
 * @returns {boolean} True if the user is authenticated, false otherwise
 */
export const isAuthenticated = () => {
  return !!getToken();
};

export default {
  getToken,
  setToken,
  removeToken,
  isAuthenticated
};
