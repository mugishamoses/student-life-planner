/**
 * Campus Life Planner - Modal and Dialog Management System
 * 
 * Provides modal management with focus trapping, confirmation dialogs,
 * and toast notifications with proper accessibility support.
 */

/**
 * FocusManager class for handling focus management in modals
 */
export class FocusManager {
  constructor() {
    this.focusStack = [];
    this.trapHandlers = new Map();
  }

  /**
   * Push current focus to stack and focus new element
   * @param {Element} element - Element to focus
   */
  pushFocus(element) {
    if (document.activeElement) {
      this.focusStack.push(document.activeElement);
    }
    
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  }

  /**
   * Pop focus from stack and restore previous focus
   */
  popFocus() {
    const previousElement = this.focusStack.pop();
    
    if (previousElement && typeof previousElement.focus === 'function') {
      // Small delay to ensure modal is hidden before restoring focus
      setTimeout(() => {
        previousElement.focus();
      }, 100);
    }
  }

  /**
   * Set up focus trap for a container
   * @param {Element} container - Container to trap focus within
   * @returns {Function} Cleanup function
   */
  trapFocus(container) {
    if (!container) {
      return () => {};
    }

    const focusableElements = this.getFocusableElements(container);
    
    if (focusableElements.length === 0) {
      return () => {};
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeydown = (event) => {
      if (event.key === 'Tab') {
        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        this.releaseFocusTrap(container);
      }
    };

    container.addEventListener('keydown', handleKeydown);
    this.trapHandlers.set(container, handleKeydown);

    // Focus first element
    firstElement.focus();

    // Return cleanup function
    return () => {
      this.releaseFocusTrap(container);
    };
  }

  /**
   * Release focus trap for a container
   * @param {Element} container - Container to release focus trap from
   */
  releaseFocusTrap(container) {
    const handler = this.trapHandlers.get(container);
    
    if (handler) {
      container.removeEventListener('keydown', handler);
      this.trapHandlers.delete(container);
    }
  }

  /**
   * Get focusable elements within a container
   * @param {Element} container - Container to search within
   * @returns {Array} Array of focusable elements
   */
  getFocusableElements(container) {
    const selector = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(container.querySelectorAll(selector)).filter(element => {
      return element.offsetWidth > 0 && element.offsetHeight > 0;
    });
  }

  /**
   * Clear all focus traps and stack
   */
  clear() {
    this.trapHandlers.forEach((handler, container) => {
      container.removeEventListener('keydown', handler);
    });
    
    this.trapHandlers.clear();
    this.focusStack = [];
  }
}

/**
 * ModalManager class for handling modal dialogs
 */
export class ModalManager {
  constructor(eventManager = null) {
    this.eventManager = eventManager;
    this.focusManager = new FocusManager();
    this.modalStack = [];
    this.currentModal = null;
    this.modalContainer = null;
    this.backdrop = null;
    
    this.init();
  }

  /**
   * Initialize modal manager
   */
  init() {
    this.createModalContainer();
    this.setupEventListeners();
  }

  /**
   * Create modal container and backdrop
   * @private
   */
  createModalContainer() {
    // Create modal container if it doesn't exist
    this.modalContainer = document.getElementById('modal-container');
    
    if (!this.modalContainer) {
      this.modalContainer = document.createElement('div');
      this.modalContainer.id = 'modal-container';
      this.modalContainer.className = 'modal-container';
      this.modalContainer.setAttribute('aria-hidden', 'true');
      
      // Set initial styles to ensure proper positioning
      this.modalContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1000;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
      `;
      
      document.body.appendChild(this.modalContainer);
      console.log('Modal container created and added to body');
    }
    
    // Don't use backdrop - it's causing conflicts
    // The modal container itself will serve as the backdrop
  }

  /**
   * Set up event listeners
   * @private
   */
  setupEventListeners() {
    // Handle escape key globally
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.currentModal) {
        event.preventDefault();
        this.hide();
      }
    });

    // Handle modal container clicks (for backdrop)
    this.modalContainer.addEventListener('click', (event) => {
      if (event.target === this.modalContainer) {
        this.hide();
      }
    });
  }

  /**
   * Show a modal
   * @param {string} type - Type of modal ('task', 'confirm', 'custom')
   * @param {Object} options - Modal options
   */
  show(type, options = {}) {
    console.log(`Showing modal of type: ${type}`, options);
    
    // Hide current modal if exists
    if (this.currentModal) {
      this.hide(false);
    }

    // Create modal based on type
    let modalElement;
    
    switch (type) {
      case 'task':
        modalElement = this.createTaskModal(options);
        break;
      case 'confirm':
        modalElement = this.createConfirmModal(options);
        break;
      case 'custom':
        modalElement = this.createCustomModal(options);
        break;
      default:
        console.error(`Unknown modal type: ${type}`);
        return;
    }

    if (!modalElement) {
      console.error('Failed to create modal element');
      return;
    }

    console.log('Modal element created:', modalElement);
    console.log('Modal innerHTML length:', modalElement.innerHTML.length);
    console.log('Modal first 200 chars:', modalElement.innerHTML.substring(0, 200));

    // Add to stack and set as current
    this.modalStack.push({
      type,
      options,
      element: modalElement
    });
    
    this.currentModal = modalElement;

    // Clear any existing modals first
    const existingModals = this.modalContainer.querySelectorAll('.modal');
    existingModals.forEach(modal => modal.remove());

    // Add modal to container
    this.modalContainer.appendChild(modalElement);
    console.log('Modal added to container');
    console.log('Modal container children:', this.modalContainer.children.length);
    console.log('Modal container HTML:', this.modalContainer.innerHTML.substring(0, 200));

    // Show modal with animation
    this.showModal(modalElement);

    // Set up focus management
    this.focusManager.pushFocus(modalElement);
    this.focusManager.trapFocus(modalElement);

    // Announce to screen readers
    this.announceModal(type, options);
    
    console.log('Modal should now be visible');
  }

  /**
   * Hide the current modal
   * @param {boolean} restoreFocus - Whether to restore focus
   */
  hide(restoreFocus = true) {
    if (!this.currentModal) {
      return;
    }

    const modal = this.currentModal;
    
    // Release focus trap
    this.focusManager.releaseFocusTrap(modal);
    
    // Restore focus if requested
    if (restoreFocus) {
      this.focusManager.popFocus();
    }

    // Hide modal with animation
    this.hideModal(modal);

    // Remove from stack
    this.modalStack.pop();
    
    // Set previous modal as current or null
    this.currentModal = this.modalStack.length > 0 
      ? this.modalStack[this.modalStack.length - 1].element 
      : null;

    // Update container visibility
    if (this.modalStack.length === 0) {
      this.modalContainer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
    }
  }

  /**
   * Show modal with animation
   * @private
   */
  showModal(modalElement) {
    console.log('showModal called with element:', modalElement);
    
    // Set container styles for backdrop effect
    this.modalContainer.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      z-index: 1000 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 1rem !important;
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
      background-color: rgba(0, 0, 0, 0.5) !important;
    `;
    
    // Show container
    this.modalContainer.setAttribute('aria-hidden', 'false');
    this.modalContainer.classList.add('modal-container--open');
    
    // Prevent body scroll
    document.body.classList.add('modal-open');

    // Style the modal element
    modalElement.style.cssText = `
      position: relative !important;
      background: white !important;
      border-radius: 8px !important;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
      max-width: 500px !important;
      width: 100% !important;
      max-height: 90vh !important;
      overflow-y: auto !important;
      z-index: 1002 !important;
      margin: 0 !important;
      display: block !important;
      opacity: 1 !important;
      transform: scale(1) translateY(0) !important;
      visibility: visible !important;
    `;

    // Add classes for proper styling
    modalElement.classList.add('modal--open');
    
    console.log('Modal should now be visible');
  }

  /**
   * Hide modal with animation
   * @private
   */
  hideModal(modalElement) {
    modalElement.classList.remove('modal--open');
    modalElement.classList.add('modal--closing');

    // Use requestAnimationFrame for smoother animation
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (modalElement && modalElement.parentNode) {
          modalElement.parentNode.removeChild(modalElement);
        }
        
        // Hide container if no more modals
        if (this.modalStack.length === 0) {
          this.modalContainer.classList.remove('modal-container--open');
          this.modalContainer.setAttribute('aria-hidden', 'true');
          document.body.classList.remove('modal-open');
          
          // Clear any inline styles
          this.modalContainer.style.cssText = '';
        }
      }, 200); // Reduced timeout for faster response
    });
  }

  /**
   * Create task modal
   * @private
   */
  createTaskModal(options) {
    const { mode = 'add', task = null } = options;
    const isEdit = mode === 'edit' && task;
    
    const modal = document.createElement('div');
    modal.className = 'modal modal--task';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'task-modal-title');
    modal.setAttribute('aria-describedby', 'task-modal-description');

    modal.innerHTML = `
      <div class="modal__content">
        <div class="modal__header">
          <h2 id="task-modal-title" class="modal__title">
            ${isEdit ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button 
            type="button" 
            class="modal__close" 
            aria-label="Close modal"
            data-action="close-modal"
          >
            ×
          </button>
        </div>
        
        <div class="modal__body">
          <p id="task-modal-description" class="modal__description">
            ${isEdit ? 'Update the task details below.' : 'Fill in the details for your new task.'}
          </p>
          
          <form id="task-form" class="task-form" data-form="task-form" novalidate>
            <div class="form-group">
              <label for="task-title" class="form-label">
                Task Title <span class="required" aria-label="required">*</span>
              </label>
              <input 
                type="text" 
                id="task-title" 
                name="title"
                class="form-input" 
                required
                autocomplete="off"
                aria-describedby="title-help title-error"
                value="${isEdit ? this.escapeHtml(task.title) : ''}"
              >
              <div id="title-help" class="form-help">
                Enter a descriptive title for your task
              </div>
              <div id="title-error" class="form-error" role="alert"></div>
            </div>
            
            <div class="form-group">
              <label for="task-due-date" class="form-label">
                Due Date <span class="required" aria-label="required">*</span>
              </label>
              <input 
                type="date" 
                id="task-due-date" 
                name="dueDate"
                class="form-input" 
                required
                aria-describedby="date-help date-error"
                value="${isEdit ? task.dueDate : ''}"
              >
              <div id="date-help" class="form-help">
                Select when this task is due
              </div>
              <div id="date-error" class="form-error" role="alert"></div>
            </div>
            
            <div class="form-group">
              <label for="task-duration" class="form-label">
                Duration (minutes) <span class="required" aria-label="required">*</span>
              </label>
              <input 
                type="number" 
                id="task-duration" 
                name="duration"
                class="form-input" 
                min="1"
                step="1"
                required
                aria-describedby="duration-help duration-error"
                value="${isEdit ? task.duration || '' : ''}"
              >
              <div id="duration-help" class="form-help">
                Estimated time to complete this task in minutes
              </div>
              <div id="duration-error" class="form-error" role="alert"></div>
            </div>
            
            <div class="form-group">
              <label for="task-tag" class="form-label">
                Category/Tag
              </label>
              <input 
                type="text" 
                id="task-tag" 
                name="tag"
                class="form-input" 
                aria-describedby="tag-help tag-error"
                value="${isEdit ? this.escapeHtml(task.tag || '') : ''}"
                placeholder="e.g., Programming, Study, Assignment"
              >
              <div id="tag-help" class="form-help">
                Optional category to organize your tasks
              </div>
              <div id="tag-error" class="form-error" role="alert"></div>
            </div>
            
            ${isEdit ? `
              <input type="hidden" name="id" value="${task.id}">
              <input type="hidden" name="mode" value="edit">
            ` : `
              <input type="hidden" name="mode" value="add">
            `}
          </form>
        </div>
        
        <div class="modal__footer">
          <button 
            type="button" 
            class="btn btn--secondary" 
            data-action="close-modal"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="task-form"
            class="btn btn--primary"
            data-action="submit-task"
          >
            ${isEdit ? 'Update Task' : 'Add Task'}
          </button>
        </div>
      </div>
    `;

    // Set up form validation and submission
    this.setupTaskFormHandlers(modal);

    return modal;
  }

  /**
   * Create confirmation modal
   * @private
   */
  createConfirmModal(options) {
    const {
      title = 'Confirm Action',
      message = 'Are you sure you want to proceed?',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      confirmAction = null,
      confirmData = {},
      confirmClass = 'btn--primary'
    } = options;

    const modal = document.createElement('div');
    modal.className = 'modal modal--confirm';
    modal.setAttribute('role', 'alertdialog');
    modal.setAttribute('aria-labelledby', 'confirm-modal-title');
    modal.setAttribute('aria-describedby', 'confirm-modal-message');

    modal.innerHTML = `
      <div class="modal__content">
        <div class="modal__header">
          <h2 id="confirm-modal-title" class="modal__title">
            ${this.escapeHtml(title)}
          </h2>
        </div>
        
        <div class="modal__body">
          <p id="confirm-modal-message" class="modal__message">
            ${this.escapeHtml(message)}
          </p>
        </div>
        
        <div class="modal__footer">
          <button 
            type="button" 
            class="btn btn--secondary" 
            data-action="close-modal"
          >
            ${this.escapeHtml(cancelText)}
          </button>
          <button 
            type="button" 
            class="btn ${confirmClass}" 
            data-action="${confirmAction || 'close-modal'}"
            ${confirmData ? Object.entries(confirmData).map(([key, value]) => {
              // Convert camelCase to kebab-case for data attributes
              const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
              const dataAttr = `data-${kebabKey}="${this.escapeHtml(String(value))}"`;
              return dataAttr;
            }).join(' ') : ''}
          >
            ${this.escapeHtml(confirmText)}
          </button>
        </div>
      </div>
    `;

    return modal;
  }

  /**
   * Create custom modal
   * @private
   */
  createCustomModal(options) {
    const {
      title = 'Modal',
      content = '',
      className = '',
      footer = null
    } = options;

    const modal = document.createElement('div');
    modal.className = `modal modal--custom ${className}`;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'custom-modal-title');

    modal.innerHTML = `
      <div class="modal__content">
        <div class="modal__header">
          <h2 id="custom-modal-title" class="modal__title">
            ${this.escapeHtml(title)}
          </h2>
          <button 
            type="button" 
            class="modal__close" 
            aria-label="Close modal"
            data-action="close-modal"
          >
            ×
          </button>
        </div>
        
        <div class="modal__body">
          ${content}
        </div>
        
        ${footer ? `
          <div class="modal__footer">
            ${footer}
          </div>
        ` : ''}
      </div>
    `;

    return modal;
  }

  /**
   * Set up task form handlers
   * @private
   */
  setupTaskFormHandlers(modal) {
    const form = modal.querySelector('.task-form');
    
    if (!form) {
      console.error('Task form not found in modal');
      return;
    }

    // Set up real-time validation
    const inputs = form.querySelectorAll('input[required]');
    
    inputs.forEach(input => {
      input.addEventListener('blur', () => {
        this.validateField(input);
      });
      
      input.addEventListener('input', () => {
        this.clearFieldError(input);
      });
    });

    // Handle form submission
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      
      // Prevent multiple submissions
      if (form.dataset.submitting === 'true') {
        console.log('Form already submitting, ignoring duplicate submission');
        return false;
      }
      
      form.dataset.submitting = 'true';
      
      // Clear any existing error messages
      const errorMessages = form.querySelectorAll('.form-error');
      errorMessages.forEach(error => {
        if (error.textContent) {
          error.textContent = '';
        }
      });
      
      // Validate form
      let isValid = true;
      inputs.forEach(input => {
        if (!this.validateField(input)) {
          isValid = false;
        }
      });
      
      if (!isValid) {
        form.dataset.submitting = 'false';
        // Focus first invalid field
        const firstError = form.querySelector('.form-input--error');
        if (firstError) {
          firstError.focus();
        }
        return false;
      }
      
      console.log('Form is valid, submitting...');
      
      // Disable submit button to prevent double submission
      const submitButton = form.querySelector('button[type="submit"]');
      const originalText = submitButton ? submitButton.textContent : '';
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Adding...';
      }
      
      // Get form data and ensure all fields are present
      const formData = new FormData(form);
      const formEntries = Object.fromEntries(formData.entries());
      
      // Validate all required fields have values
      const title = formEntries.title?.trim();
      const dueDate = formEntries.dueDate;
      const duration = formEntries.duration;
      
      if (!title || !dueDate || !duration) {
        console.error('Missing required fields:', { title, dueDate, duration });
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error';
        errorDiv.textContent = 'Please fill in all required fields';
        form.insertBefore(errorDiv, form.firstChild);
        
        // Re-enable form
        form.dataset.submitting = 'false';
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalText || 'Add Task';
        }
        return false;
      }
      
      // Clean up and validate the data before submitting
      const cleanData = {
        title: title,
        dueDate: dueDate,
        duration: parseInt(duration),
        tag: formEntries.tag?.trim() || 'General',
        mode: formEntries.mode || 'add'
      };
      
      // Additional validation
      if (isNaN(cleanData.duration) || cleanData.duration <= 0) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error';
        errorDiv.textContent = 'Duration must be a positive number';
        form.insertBefore(errorDiv, form.firstChild);
        
        // Re-enable form
        form.dataset.submitting = 'false';
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalText || 'Add Task';
        }
        return false;
      }
      
      console.log('=== MODAL FORM SUBMISSION ===');
      console.log('Clean form data:', cleanData);
      console.log('Event manager available:', !!this.eventManager);
      
      // Submit form - DON'T hide modal yet, wait for success/error
      if (this.eventManager) {
        console.log('Emitting submit-task-form event...');
        
        // Store callbacks for the handler to use
        this._currentSubmissionCallbacks = {
          onSuccess: () => {
            console.log('=== MODAL: Task submission successful, closing modal ===');
            this.hide();
          },
          onError: (error) => {
            console.error('=== MODAL: Task submission failed ===', error);
            // Re-enable form
            form.dataset.submitting = 'false';
            if (submitButton) {
              submitButton.disabled = false;
              submitButton.textContent = originalText || 'Add Task';
            }
            // Show error in form
            const errorDiv = document.createElement('div');
            errorDiv.className = 'form-error';
            errorDiv.textContent = error.message || 'Failed to save task. Please try again.';
            form.insertBefore(errorDiv, form.firstChild);
          }
        };
        
        this.eventManager.emit('submit-task-form', cleanData);
        
        console.log('Event emitted, waiting for response...');
      } else {
        console.error('Event manager not available in modal');
        form.dataset.submitting = 'false';
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalText || 'Add Task';
        }
      }
      
      return false;
    });
  }

  /**
   * Validate a form field
   * @private
   */
  validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    let isValid = true;
    let errorMessage = '';

    // Basic required validation
    if (field.hasAttribute('required') && !value) {
      isValid = false;
      errorMessage = `${this.getFieldLabel(field)} is required`;
    }

    // Field-specific validation
    if (isValid && value) {
      switch (fieldName) {
        case 'title':
          // Title validation: no leading/trailing spaces, no empty
          if (!/^\S(?:.*\S)?$/.test(value)) {
            isValid = false;
            errorMessage = 'Title cannot have leading or trailing spaces';
          }
          break;
          
        case 'duration':
          // Duration validation: positive number
          if (!/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(value) || parseFloat(value) <= 0) {
            isValid = false;
            errorMessage = 'Duration must be a positive number';
          }
          break;
          
        case 'dueDate':
          // Date validation: YYYY-MM-DD format and not in past
          if (!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid date';
          } else {
            const selectedDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (selectedDate < today) {
              isValid = false;
              errorMessage = 'Due date cannot be in the past';
            }
          }
          break;
          
        case 'tag':
          // Tag validation: letters, spaces, hyphens only
          if (value && !/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/.test(value)) {
            isValid = false;
            errorMessage = 'Category can only contain letters, spaces, and hyphens';
          }
          break;
      }
    }

    // Show/hide error
    if (isValid) {
      this.clearFieldError(field);
    } else {
      this.showFieldError(field, errorMessage);
    }

    return isValid;
  }

  /**
   * Show field error
   * @private
   */
  showFieldError(field, message) {
    const errorElement = document.getElementById(`${field.name}-error`);
    
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
    
    field.setAttribute('aria-invalid', 'true');
    field.classList.add('form-input--error');
  }

  /**
   * Clear field error
   * @private
   */
  clearFieldError(field) {
    const errorElement = document.getElementById(`${field.name}-error`);
    
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
    
    field.setAttribute('aria-invalid', 'false');
    field.classList.remove('form-input--error');
  }

  /**
   * Get field label text
   * @private
   */
  getFieldLabel(field) {
    const label = document.querySelector(`label[for="${field.id}"]`);
    return label ? label.textContent.replace('*', '').trim() : field.name;
  }



  /**
   * Announce modal to screen readers
   * @private
   */
  announceModal(type, options) {
    const messages = {
      task: options.mode === 'edit' ? 'Edit task dialog opened' : 'Add task dialog opened',
      confirm: 'Confirmation dialog opened',
      custom: `${options.title || 'Dialog'} opened`
    };

    const message = messages[type] || 'Dialog opened';
    
    // Announce to screen readers
    const statusDiv = document.getElementById('status-messages');
    if (statusDiv) {
      statusDiv.textContent = message;
    }
  }

  /**
   * Escape HTML to prevent XSS
   * @private
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Get current modal info
   */
  getCurrentModal() {
    return this.currentModal ? {
      element: this.currentModal,
      stack: [...this.modalStack]
    } : null;
  }

  /**
   * Check if any modal is open
   */
  isModalOpen() {
    return this.currentModal !== null;
  }

  /**
   * Destroy modal manager
   */
  destroy() {
    this.focusManager.clear();
    
    if (this.modalContainer && this.modalContainer.parentNode) {
      this.modalContainer.parentNode.removeChild(this.modalContainer);
    }
    
    this.modalStack = [];
    this.currentModal = null;
  }
}

/**
 * ToastManager class for handling toast notifications
 */
export class ToastManager {
  constructor() {
    this.toastContainer = null;
    this.toastQueue = [];
    this.maxToasts = 5;
    this.defaultDuration = 5000;
    
    this.init();
  }

  /**
   * Initialize toast manager
   */
  init() {
    this.createToastContainer();
  }

  /**
   * Create toast container
   * @private
   */
  createToastContainer() {
    this.toastContainer = document.getElementById('toast-container');
    
    if (!this.toastContainer) {
      this.toastContainer = document.createElement('div');
      this.toastContainer.id = 'toast-container';
      this.toastContainer.className = 'toast-container';
      this.toastContainer.setAttribute('aria-live', 'polite');
      this.toastContainer.setAttribute('aria-atomic', 'false');
      document.body.appendChild(this.toastContainer);
    }
  }

  /**
   * Show a toast notification
   * @param {string} message - Toast message
   * @param {string} type - Toast type ('success', 'error', 'warning', 'info')
   * @param {number} duration - Duration in milliseconds
   */
  show(message, type = 'info', duration = this.defaultDuration) {
    const toast = this.createToast(message, type, duration);
    
    // Add to queue
    this.toastQueue.push(toast);
    
    // Remove excess toasts
    while (this.toastQueue.length > this.maxToasts) {
      const oldToast = this.toastQueue.shift();
      this.removeToast(oldToast);
    }
    
    // Add to DOM
    this.toastContainer.appendChild(toast.element);
    
    // Show with animation
    setTimeout(() => {
      toast.element.classList.add('toast--show');
    }, 100);
    
    // Auto-hide after duration
    if (duration > 0) {
      toast.timeout = setTimeout(() => {
        this.hide(toast);
      }, duration);
    }
    
    return toast;
  }

  /**
   * Create toast element
   * @private
   */
  createToast(message, type, duration) {
    const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const element = document.createElement('div');
    element.id = toastId;
    element.className = `toast toast--${type}`;
    element.setAttribute('role', type === 'error' ? 'alert' : 'status');
    
    element.innerHTML = `
      <div class="toast__content">
        <div class="toast__icon" aria-hidden="true">
          ${this.getToastIcon(type)}
        </div>
        <div class="toast__message">
          ${this.escapeHtml(message)}
        </div>
        <button 
          type="button" 
          class="toast__close" 
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
      ${duration > 0 ? `
        <div class="toast__progress">
          <div class="toast__progress-bar" style="animation-duration: ${duration}ms;"></div>
        </div>
      ` : ''}
    `;

    const toast = {
      id: toastId,
      element,
      type,
      message,
      duration,
      timeout: null
    };

    // Handle close button
    const closeButton = element.querySelector('.toast__close');
    closeButton.addEventListener('click', () => {
      this.hide(toast);
    });

    return toast;
  }

  /**
   * Hide a toast
   * @param {Object} toast - Toast object to hide
   */
  hide(toast) {
    if (!toast || !toast.element) {
      return;
    }

    // Clear timeout
    if (toast.timeout) {
      clearTimeout(toast.timeout);
    }

    // Hide with animation
    toast.element.classList.add('toast--hide');
    
    setTimeout(() => {
      this.removeToast(toast);
    }, 300);
  }

  /**
   * Remove toast from DOM and queue
   * @private
   */
  removeToast(toast) {
    if (toast.element && toast.element.parentNode) {
      toast.element.parentNode.removeChild(toast.element);
    }
    
    const index = this.toastQueue.indexOf(toast);
    if (index > -1) {
      this.toastQueue.splice(index, 1);
    }
  }

  /**
   * Get icon for toast type
   * @private
   */
  getToastIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    
    return icons[type] || icons.info;
  }

  /**
   * Clear all toasts
   */
  clearAll() {
    this.toastQueue.forEach(toast => {
      this.removeToast(toast);
    });
    
    this.toastQueue = [];
  }

  /**
   * Escape HTML to prevent XSS
   * @private
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Destroy toast manager
   */
  destroy() {
    this.clearAll();
    
    if (this.toastContainer && this.toastContainer.parentNode) {
      this.toastContainer.parentNode.removeChild(this.toastContainer);
    }
  }
}

/**
 * Create global modal and toast managers
 */
let globalModalManager = null;
let globalToastManager = null;

export function createModalManager(eventManager = null) {
  if (!globalModalManager) {
    globalModalManager = new ModalManager(eventManager);
  }
  
  return globalModalManager;
}

export function createToastManager() {
  if (!globalToastManager) {
    globalToastManager = new ToastManager();
  }
  
  return globalToastManager;
}

export function getModalManager() {
  return globalModalManager;
}

export function getToastManager() {
  return globalToastManager;
}

export function destroyModalManager() {
  if (globalModalManager) {
    globalModalManager.destroy();
    globalModalManager = null;
  }
}

export function destroyToastManager() {
  if (globalToastManager) {
    globalToastManager.destroy();
    globalToastManager = null;
  }
}