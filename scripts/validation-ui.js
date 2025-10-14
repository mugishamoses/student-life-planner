/**
 * Real-time validation feedback system
 * Implements requirements 5.6, 5.7, 2.6
 */

import { validateField, checkDuplicateWords } from './validators.js';

/**
 * ValidationUI class manages real-time form validation feedback
 */
export class ValidationUI {
  constructor() {
    this.validationTimeouts = new Map();
    this.ariaLiveRegion = null;
    this.init();
  }

  /**
   * Initialize the validation UI system
   */
  init() {
    this.createAriaLiveRegion();
    this.setupEventListeners();
  }

  /**
   * Create ARIA live region for screen reader announcements
   */
  createAriaLiveRegion() {
    // Create polite live region for validation messages
    this.ariaLiveRegion = document.createElement('div');
    this.ariaLiveRegion.id = 'validation-announcements';
    this.ariaLiveRegion.setAttribute('aria-live', 'polite');
    this.ariaLiveRegion.setAttribute('aria-atomic', 'true');
    this.ariaLiveRegion.className = 'sr-only';
    
    // Add to document
    document.body.appendChild(this.ariaLiveRegion);
  }

  /**
   * Set up event listeners for real-time validation
   */
  setupEventListeners() {
    // Use event delegation for input validation
    document.addEventListener('input', this.handleInput.bind(this));
    document.addEventListener('blur', this.handleBlur.bind(this));
    document.addEventListener('focus', this.handleFocus.bind(this));
  }

  /**
   * Handle input events for real-time validation
   * @param {Event} event - Input event
   */
  handleInput(event) {
    const input = event.target;
    
    // Only validate inputs with validation attributes
    if (!input.dataset.validate) return;

    const fieldName = input.dataset.validate;
    const value = input.value;

    // Clear existing timeout for this field
    if (this.validationTimeouts.has(input)) {
      clearTimeout(this.validationTimeouts.get(input));
    }

    // Debounce validation to avoid excessive calls
    const timeoutId = setTimeout(() => {
      this.validateInput(input, fieldName, value);
    }, 300);

    this.validationTimeouts.set(input, timeoutId);
  }

  /**
   * Handle blur events for immediate validation
   * @param {Event} event - Blur event
   */
  handleBlur(event) {
    const input = event.target;
    
    if (!input.dataset.validate) return;

    const fieldName = input.dataset.validate;
    const value = input.value;

    // Clear timeout and validate immediately on blur
    if (this.validationTimeouts.has(input)) {
      clearTimeout(this.validationTimeouts.get(input));
      this.validationTimeouts.delete(input);
    }

    this.validateInput(input, fieldName, value);
  }

  /**
   * Handle focus events to clear validation state
   * @param {Event} event - Focus event
   */
  handleFocus(event) {
    const input = event.target;
    
    if (!input.dataset.validate) return;

    // Clear validation state when user focuses on input
    this.clearValidationState(input);
  }

  /**
   * Validate an input field and show feedback
   * @param {HTMLElement} input - Input element to validate
   * @param {string} fieldName - Name of the field being validated
   * @param {string} value - Value to validate
   */
  validateInput(input, fieldName, value) {
    // Perform validation
    const result = validateField(fieldName, value);
    
    // Check for duplicate words if it's a text field and validation passed
    if (result.isValid && (fieldName === 'title' || fieldName === 'description')) {
      const duplicateResult = checkDuplicateWords(value);
      if (!duplicateResult.isValid) {
        result.isValid = false;
        result.error = duplicateResult.error;
      }
    }

    // Update UI based on validation result
    this.updateValidationUI(input, result);
    
    // Announce validation result to screen readers
    this.announceValidationResult(input, result);
  }

  /**
   * Update the validation UI for an input
   * @param {HTMLElement} input - Input element
   * @param {Object} result - Validation result
   */
  updateValidationUI(input, result) {
    const errorElement = this.getOrCreateErrorElement(input);
    
    if (result.isValid) {
      // Valid input
      input.classList.remove('invalid');
      input.classList.add('valid');
      input.setAttribute('aria-invalid', 'false');
      
      // Clear error message
      errorElement.textContent = '';
      errorElement.style.display = 'none';
      
    } else {
      // Invalid input
      input.classList.remove('valid');
      input.classList.add('invalid');
      input.setAttribute('aria-invalid', 'true');
      
      // Show error message
      errorElement.textContent = result.error;
      errorElement.style.display = 'block';
    }
  }

  /**
   * Get or create error element for an input
   * @param {HTMLElement} input - Input element
   * @returns {HTMLElement} Error element
   */
  getOrCreateErrorElement(input) {
    const errorId = `${input.id}-error`;
    let errorElement = document.getElementById(errorId);
    
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.id = errorId;
      errorElement.className = 'validation-error';
      errorElement.setAttribute('role', 'alert');
      errorElement.style.display = 'none';
      
      // Insert after the input
      input.parentNode.insertBefore(errorElement, input.nextSibling);
      
      // Update input's aria-describedby
      const describedBy = input.getAttribute('aria-describedby') || '';
      const newDescribedBy = describedBy ? `${describedBy} ${errorId}` : errorId;
      input.setAttribute('aria-describedby', newDescribedBy);
    }
    
    return errorElement;
  }

  /**
   * Clear validation state for an input
   * @param {HTMLElement} input - Input element to clear
   */
  clearValidationState(input) {
    input.classList.remove('valid', 'invalid');
    input.setAttribute('aria-invalid', 'false');
    
    const errorElement = this.getOrCreateErrorElement(input);
    errorElement.textContent = '';
    errorElement.style.display = 'none';
  }

  /**
   * Announce validation result to screen readers
   * @param {HTMLElement} input - Input element
   * @param {Object} result - Validation result
   */
  announceValidationResult(input, result) {
    if (!this.ariaLiveRegion) return;

    const fieldLabel = this.getFieldLabel(input);
    
    if (result.isValid) {
      // Announce when field becomes valid (helpful for screen reader users)
      this.ariaLiveRegion.textContent = `${fieldLabel} is now valid`;
    } else {
      // Announce validation error
      this.ariaLiveRegion.textContent = `${fieldLabel}: ${result.error}`;
    }
  }

  /**
   * Get the label text for a field
   * @param {HTMLElement} input - Input element
   * @returns {string} Label text
   */
  getFieldLabel(input) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) {
      return label.textContent.replace('*', '').trim();
    }
    
    // Fallback to placeholder or field name
    return input.placeholder || input.dataset.validate || 'Field';
  }

  /**
   * Validate all inputs in a form
   * @param {HTMLElement} form - Form element to validate
   * @returns {boolean} True if all inputs are valid
   */
  validateForm(form) {
    const inputs = form.querySelectorAll('[data-validate]');
    let isFormValid = true;
    
    inputs.forEach(input => {
      const fieldName = input.dataset.validate;
      const value = input.value;
      
      this.validateInput(input, fieldName, value);
      
      if (input.classList.contains('invalid')) {
        isFormValid = false;
      }
    });
    
    return isFormValid;
  }

  /**
   * Reset validation for all inputs in a form
   * @param {HTMLElement} form - Form element to reset
   */
  resetFormValidation(form) {
    const inputs = form.querySelectorAll('[data-validate]');
    
    inputs.forEach(input => {
      this.clearValidationState(input);
    });
  }

  /**
   * Add validation to an input element
   * @param {HTMLElement} input - Input element
   * @param {string} fieldName - Field name for validation
   */
  addValidation(input, fieldName) {
    input.dataset.validate = fieldName;
    input.setAttribute('aria-invalid', 'false');
    
    // Ensure error element exists
    this.getOrCreateErrorElement(input);
  }

  /**
   * Remove validation from an input element
   * @param {HTMLElement} input - Input element
   */
  removeValidation(input) {
    delete input.dataset.validate;
    this.clearValidationState(input);
    
    // Remove error element
    const errorId = `${input.id}-error`;
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
      errorElement.remove();
    }
  }

  /**
   * Destroy the validation UI system
   */
  destroy() {
    // Clear all timeouts
    this.validationTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.validationTimeouts.clear();
    
    // Remove event listeners
    document.removeEventListener('input', this.handleInput.bind(this));
    document.removeEventListener('blur', this.handleBlur.bind(this));
    document.removeEventListener('focus', this.handleFocus.bind(this));
    
    // Remove ARIA live region
    if (this.ariaLiveRegion) {
      this.ariaLiveRegion.remove();
    }
  }
}

// Create and export a singleton instance
export const validationUI = new ValidationUI();

// Export the class for custom instances
export default ValidationUI;
/**
 * Uti
lity functions for easy validation setup
 */

/**
 * Set up validation for a form with common field types
 * @param {HTMLElement} form - Form element
 * @param {Object} fieldConfig - Configuration for fields
 */
export function setupFormValidation(form, fieldConfig = {}) {
  const defaultConfig = {
    title: 'title',
    duration: 'duration', 
    date: 'date',
    tag: 'tag'
  };
  
  const config = { ...defaultConfig, ...fieldConfig };
  
  Object.entries(config).forEach(([inputName, validationType]) => {
    const input = form.querySelector(`[name="${inputName}"], #${inputName}`);
    if (input) {
      validationUI.addValidation(input, validationType);
    }
  });
}

/**
 * Create a validation-ready input element
 * @param {Object} options - Input configuration
 * @returns {HTMLElement} Configured input element
 */
export function createValidatedInput(options) {
  const {
    type = 'text',
    id,
    name,
    label,
    required = false,
    validation,
    placeholder = '',
    helpText = ''
  } = options;
  
  // Create form group container
  const formGroup = document.createElement('div');
  formGroup.className = 'form-group';
  
  // Create label
  const labelElement = document.createElement('label');
  labelElement.className = 'form-label';
  labelElement.setAttribute('for', id);
  labelElement.innerHTML = `${label}${required ? ' <span class="required" aria-label="required">*</span>' : ''}`;
  
  // Create input
  const input = document.createElement('input');
  input.type = type;
  input.id = id;
  input.name = name || id;
  input.className = 'form-input';
  input.placeholder = placeholder;
  
  if (required) {
    input.required = true;
  }
  
  if (validation) {
    input.dataset.validate = validation;
  }
  
  // Create help text if provided
  let helpElement = null;
  if (helpText) {
    helpElement = document.createElement('div');
    helpElement.className = 'form-help';
    helpElement.id = `${id}-help`;
    helpElement.textContent = helpText;
    
    input.setAttribute('aria-describedby', `${id}-help`);
  }
  
  // Assemble form group
  formGroup.appendChild(labelElement);
  formGroup.appendChild(input);
  if (helpElement) {
    formGroup.appendChild(helpElement);
  }
  
  return formGroup;
}