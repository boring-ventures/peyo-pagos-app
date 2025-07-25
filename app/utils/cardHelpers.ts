/**
 * Card Helper Utilities
 * Common functions for card display and formatting
 */

/**
 * Format card PAN for display
 * @param pan - The primary account number
 * @param showFull - Whether to show full number or masked
 */
export const formatCardPan = (pan: string, showFull: boolean = false): string => {
  if (!pan) return '•••• •••• •••• ••••';
  
  if (showFull) {
    // Format as groups of 4: 1234 5678 9012 3456
    return pan.replace(/(.{4})/g, '$1 ').trim();
  } else {
    // Show only last 4 digits: •••• •••• •••• 3456
    const lastFour = pan.slice(-4);
    return `•••• •••• •••• ${lastFour}`;
  }
};

/**
 * Format card expiry date
 * @param expiryDate - The expiry date in MM/YY format
 */
export const formatCardExpiry = (expiryDate: string): string => {
  if (!expiryDate) return '••/••';
  return expiryDate;
};

/**
 * Format currency amount
 * @param amount - The amount to format
 * @param currency - The currency code (default: USD)
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('es-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Validate card data
 * @param pan - Primary account number
 * @param cvv - Card verification value
 * @param expiry - Expiry date
 */
export const validateCardData = (pan: string, cvv: string, expiry: string): boolean => {
  // Basic validation - in production you'd want more robust validation
  const panValid = Boolean(pan && pan.length >= 13 && pan.length <= 19);
  const cvvValid = Boolean(cvv && cvv.length >= 3 && cvv.length <= 4);
  const expiryValid = Boolean(expiry && /^\d{2}\/\d{2}$/.test(expiry));
  
  return panValid && cvvValid && expiryValid;
};

/**
 * Get card brand from PAN
 * @param pan - Primary account number
 */
export const getCardBrand = (pan: string): 'visa' | 'mastercard' | 'amex' | 'unknown' => {
  if (!pan) return 'unknown';
  
  const firstDigit = pan.charAt(0);
  const firstTwoDigits = pan.substring(0, 2);
  const firstFourDigits = pan.substring(0, 4);
  
  // Visa
  if (firstDigit === '4') {
    return 'visa';
  }
  
  // Mastercard
  if (firstDigit === '5' || 
      (parseInt(firstTwoDigits) >= 22 && parseInt(firstTwoDigits) <= 27)) {
    return 'mastercard';
  }
  
  // American Express
  if (firstTwoDigits === '34' || firstTwoDigits === '37') {
    return 'amex';
  }
  
  return 'unknown';
};

/**
 * Check if card is expired
 * @param expiryDate - The expiry date in MM/YY format
 */
export const isCardExpired = (expiryDate: string): boolean => {
  if (!expiryDate || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
    return true;
  }
  
  const [month, year] = expiryDate.split('/');
  const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
  const now = new Date();
  
  return expiry < now;
}; 