/**
 * Validation module with regex patterns for form validation
 * Implements requirements 5.1, 5.2, 5.3, 5.4, 5.5
 */

// Regex patterns for validation
export const patterns = {
  // Title validation: no leading/trailing spaces, allows internal spaces
  title: /^\S(?:.*\S)?$/,
  
  // Duration validation: positive numbers with optional decimal (up to 2 places)
  duration: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
  
  // Date validation: YYYY-MM-DD format with basic month/day validation
  date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
  
  // Tag validation: letters, spaces, and hyphens only
  tag: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,
  
  // Advanced pattern: duplicate word detection using back-reference
  duplicateWords: /\b(\w+)\s+\1\b/i
};

// Error messages for each validation type
export const errorMessages = {
  title: {
    required: 'Title is required',
    invalid: 'Title cannot have leading or trailing spaces'
  },
  duration: {
    required: 'Duration is required',
    invalid: 'Duration must be a positive number (e.g., 1.5, 30, 120.25)'
  },
  date: {
    required: 'Due date is required',
    invalid: 'Date must be in YYYY-MM-DD format (e.g., 2025-01-15)'
  },
  tag: {
    required: 'Tag is required',
    invalid: 'Tag can only contain letters, spaces, and hyphens'
  },
  duplicateWords: {
    invalid: 'Text contains duplicate words'
  }
};

/**
 * Validates a single field value against its pattern
 * @param {string} fieldName - Name of the field to validate
 * @param {string} value - Value to validate
 * @returns {Object} Validation result with isValid and error properties
 */
export function validateField(fieldName, value) {
  // Check if field is required and empty
  if (!value || value.trim() === '') {
    return {
      isValid: false,
      error: errorMessages[fieldName]?.required || 'This field is required'
    };
  }

  // Get the appropriate pattern
  const pattern = patterns[fieldName];
  if (!pattern) {
    return {
      isValid: true,
      error: null
    };
  }

  // Test the value against the pattern
  const isValid = pattern.test(value);
  
  return {
    isValid,
    error: isValid ? null : (errorMessages[fieldName]?.invalid || 'Invalid format')
  };
}

/**
 * Validates an entire task object
 * @param {Object} task - Task object to validate
 * @returns {Object} Validation result with isValid, errors, and validFields properties
 */
export function validateTask(task) {
  const errors = {};
  const validFields = {};
  let isValid = true;

  // Required fields to validate
  const fieldsToValidate = ['title', 'duration', 'date', 'tag'];

  fieldsToValidate.forEach(field => {
    const result = validateField(field, task[field]);
    validFields[field] = result.isValid;
    
    if (!result.isValid) {
      errors[field] = result.error;
      isValid = false;
    }
  });

  // Check for duplicate words in title if title is valid
  if (validFields.title && task.title) {
    const duplicateResult = checkDuplicateWords(task.title);
    if (!duplicateResult.isValid) {
      errors.title = duplicateResult.error;
      validFields.title = false;
      isValid = false;
    }
  }

  return {
    isValid,
    errors,
    validFields
  };
}

/**
 * Checks for duplicate words in text using advanced regex pattern
 * @param {string} text - Text to check for duplicate words
 * @returns {Object} Validation result with isValid and error properties
 */
export function checkDuplicateWords(text) {
  if (!text || typeof text !== 'string') {
    return { isValid: true, error: null };
  }

  try {
    const hasDuplicates = patterns.duplicateWords.test(text);
    
    return {
      isValid: !hasDuplicates,
      error: hasDuplicates ? errorMessages.duplicateWords.invalid : null
    };
  } catch (error) {
    console.warn('Error checking duplicate words:', error);
    return { isValid: true, error: null };
  }
}

/**
 * Gets a user-friendly error message for a specific field and error type
 * @param {string} fieldName - Name of the field
 * @param {string} errorType - Type of error ('required' or 'invalid')
 * @returns {string} Error message
 */
export function getErrorMessage(fieldName, errorType = 'invalid') {
  return errorMessages[fieldName]?.[errorType] || 'Validation error';
}

/**
 * Validates a date string for additional date logic beyond regex
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Object} Validation result with isValid and error properties
 */
export function validateDate(dateString) {
  // First check basic format with regex
  const basicValidation = validateField('date', dateString);
  if (!basicValidation.isValid) {
    return basicValidation;
  }

  // Additional date validation
  try {
    const date = new Date(dateString);
    const [year, month, day] = dateString.split('-').map(Number);
    
    // Check if the date is valid (handles leap years, month lengths, etc.)
    if (date.getFullYear() !== year || 
        date.getMonth() !== month - 1 || 
        date.getDate() !== day) {
      return {
        isValid: false,
        error: 'Invalid date (check month and day values)'
      };
    }

    return { isValid: true, error: null };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid date format'
    };
  }
}

// Export default object for convenience
export default {
  patterns,
  errorMessages,
  validateField,
  validateTask,
  checkDuplicateWords,
  getErrorMessage,
  validateDate
};