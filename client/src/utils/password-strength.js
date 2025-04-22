/**
 * Password strength indicator
 * Returns the strength of the password
 * @param {string} password - Password to check
 * @returns {number} - Strength score (0-4)
 */
export const strengthIndicator = (password) => {
  let strengths = 0;

  if (password.length > 5) strengths += 1;
  if (password.length > 7) strengths += 1;
  if (/[A-Z]/.test(password)) strengths += 1;
  if (/[0-9]/.test(password)) strengths += 1;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) strengths += 1;

  return strengths;
};

/**
 * Password strength color
 * Returns the color based on the strength score
 * @param {number} strength - Strength score
 * @returns {object} - Color and label
 */
export const strengthColor = (strength) => {
  if (strength <= 1) {
    return { label: 'Poor', color: '#FF1744' }; // Red
  } else if (strength <= 2) {
    return { label: 'Weak', color: '#FFAB00' }; // Amber
  } else if (strength <= 3) {
    return { label: 'Normal', color: '#FFC107' }; // Yellow
  } else if (strength <= 4) {
    return { label: 'Good', color: '#00E676' }; // Light Green
  } else {
    return { label: 'Strong', color: '#00C853' }; // Green
  }
};
