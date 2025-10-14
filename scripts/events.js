/**
 * Campus Life Planner - Centralized Event Management System
 * 
 * Provides centralized event delegation, keyboard handling, and form submission management
 * for performance optimization and consistent event handling across the application.
 */

/**
 * EventManager class for centralized event handling
 */
export class EventManager {
  constructor() {
    this.handlers = new Map();
    this.keyboardHandlers = new Map();
    this.formHandlers = new Map();
    this.globalKeyboardHandler = null;
    this.isInitialized = false;
    
    // Bind methods to preserve context
    this.handleClick = this.handleClick.bind(this);
    this.handleInput = this.handleInput.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleKeyup = this.handleKeyup.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
  }

  /**
   * Initialize the event management system
   */
  init() {
    if (this.isInitialized) {
      console.warn('EventManager already initialized');
      return;
    }

    this.setupEventDelegation();
    this.setupGlobalKeyboardHandling();
    this.isInitialized = true;
    
    console.log('EventManager initialized');
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    if (!this.isInitialized) {
      return;
    }

    this.removeEventDelegation();
    this.removeGlobalKeyboardHandling();
    this.handlers.clear();
    this.keyboardHandlers.clear();
    this.formHandlers.clear();
    this.isInitialized = false;
    
    console.log('EventManager destroyed');
  }

  /**
   * Set up event delegation for performance
   * @private
   */
  setupEventDelegation() {
    // Use event delegation on document for better performance
    document.addEventListener('click', this.handleClick, true);
    document.addEventListener('input', this.handleInput, true);
    document.addEventListener('change', this.handleChange, true);
    document.addEventListener('submit', this.handleSubmit, true);
    document.addEventListener('keydown', this.handleKeydown, true);
    document.addEventListener('keyup', this.handleKeyup, true);
    document.addEventListener('focus', this.handleFocus, true);
    document.addEventListener('blur', this.handleBlur, true);
  }

  /**
   * Remove event delegation
   * @private
   */
  removeEventDelegation() {
    document.removeEventListener('click', this.handleClick, true);
    document.removeEventListener('input', this.handleInput, true);
    document.removeEventListener('change', this.handleChange, true);
    document.removeEventListener('submit', this.handleSubmit, true);
    document.removeEventListener('keydown', this.handleKeydown, true);
    document.removeEventListener('keyup', this.handleKeyup, true);
    document.removeEventListener('focus', this.handleFocus, true);
    document.removeEventListener('blur', this.handleBlur, true);
  }

  /**
   * Set up global keyboard handling
   * @private
   */
  setupGlobalKeyboardHandling() {
    this.globalKeyboardHandler = (event) => {
      // Handle global keyboard shortcuts
      switch (event.key) {
        case 'Escape':
          this.handleEscapeKey(event);
          break;
        case 'Enter':
          this.handleEnterKey(event);
          break;
        case 'Tab':
          this.handleTabKey(event);
          break;
        case 'F1':
          // Help shortcut
          event.preventDefault();
          this.triggerAction('show-help');
          break;
        case '/':
          // Quick search shortcut (when not in input)
          if (!this.isInputElement(event.target)) {
            event.preventDefault();
            this.focusSearchInput();
          }
          break;
      }

      // Handle keyboard shortcuts with modifiers
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            // Save/Export shortcut
            event.preventDefault();
            this.triggerAction('export-data');
            break;
          case 'n':
            // New task shortcut
            event.preventDefault();
            this.triggerAction('add-task');
            break;
          case 'f':
            // Focus search
            event.preventDefault();
            this.focusSearchInput();
            break;
        }
      }
    };

    document.addEventListener('keydown', this.globalKeyboardHandler);
  }

  /**
   * Remove global keyboard handling
   * @private
   */
  removeGlobalKeyboardHandling() {
    if (this.globalKeyboardHandler) {
      document.removeEventListener('keydown', this.globalKeyboardHandler);
      this.globalKeyboardHandler = null;
    }
  }

  /**
   * Register an action handler
   * @param {string} action - The action name
   * @param {Function} handler - The handler function
   */
  on(action, handler) {
    if (typeof action !== 'string' || typeof handler !== 'function') {
      throw new Error('Action must be a string and handler must be a function');
    }

    if (!this.handlers.has(action)) {
      this.handlers.set(action, []);
    }
    
    this.handlers.get(action).push(handler);
  }

  /**
   * Unregister an action handler
   * @param {string} action - The action name
   * @param {Function} handler - The handler function to remove
   */
  off(action, handler) {
    if (!this.handlers.has(action)) {
      return;
    }

    const handlers = this.handlers.get(action);
    const index = handlers.indexOf(handler);
    
    if (index > -1) {
      handlers.splice(index, 1);
      
      // Remove action if no handlers left
      if (handlers.length === 0) {
        this.handlers.delete(action);
      }
    }
  }

  /**
   * Register a keyboard handler for specific keys
   * @param {string|Array} keys - Key or array of keys to handle
   * @param {Function} handler - The handler function
   * @param {Object} options - Options (element, preventDefault, etc.)
   */
  onKeyboard(keys, handler, options = {}) {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    
    keyArray.forEach(key => {
      if (!this.keyboardHandlers.has(key)) {
        this.keyboardHandlers.set(key, []);
      }
      
      this.keyboardHandlers.get(key).push({
        handler,
        options
      });
    });
  }

  /**
   * Register a form submission handler
   * @param {string} formSelector - CSS selector for the form
   * @param {Function} handler - The handler function
   */
  onFormSubmit(formSelector, handler) {
    this.formHandlers.set(formSelector, handler);
  }

  /**
   * Trigger an action programmatically
   * @param {string} action - The action name
   * @param {Object} data - Optional data to pass to handlers
   * @param {Element} element - Optional element that triggered the action
   */
  triggerAction(action, data = {}, element = null) {
    if (!this.handlers.has(action)) {
      console.warn(`No handlers registered for action: ${action}`);
      return false;
    }

    const handlers = this.handlers.get(action);
    let handled = false;

    handlers.forEach(handler => {
      try {
        const result = handler({
          action,
          data,
          element,
          preventDefault: () => {},
          stopPropagation: () => {}
        });
        
        if (result !== false) {
          handled = true;
        }
      } catch (error) {
        console.error(`Error in action handler for ${action}:`, error);
      }
    });

    return handled;
  }

  /**
   * Emit an event (alias for triggerAction for compatibility)
   * @param {string} action - The action name
   * @param {Object} data - Optional data to pass to handlers
   * @param {Element} element - Optional element that triggered the action
   */
  emit(action, data = {}, element = null) {
    return this.triggerAction(action, data, element);
  }

  /**
   * Handle click events
   * @private
   */
  handleClick(event) {
    const element = event.target;
    const action = this.getActionFromElement(element);
    
    if (action) {
      const data = this.getDataFromElement(element);
      const handled = this.triggerAction(action, data, element);
      
      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    // Handle navigation links
    if (element.matches('.nav__link') || element.closest('.nav__link')) {
      const link = element.matches('.nav__link') ? element : element.closest('.nav__link');
      const href = link.getAttribute('href');
      
      if (href && href.startsWith('#')) {
        event.preventDefault();
        const page = href.substring(1) || 'about';
        this.triggerAction('navigate', { page }, link);
      }
    }
  }

  /**
   * Handle input events
   * @private
   */
  handleInput(event) {
    const element = event.target;
    const action = this.getActionFromElement(element, 'input');
    
    if (action) {
      const data = this.getDataFromElement(element);
      data.value = element.value;
      this.triggerAction(action, data, element);
    }

    // Handle search input
    if (element.matches('#task-search')) {
      this.handleSearchInput(element, event);
    }

    // Handle settings inputs
    if (element.matches('[data-setting]')) {
      this.handleSettingInput(element, event);
    }
  }

  /**
   * Handle change events
   * @private
   */
  handleChange(event) {
    const element = event.target;
    const action = this.getActionFromElement(element, 'change');
    
    if (action) {
      const data = this.getDataFromElement(element);
      data.value = element.type === 'checkbox' ? element.checked : element.value;
      this.triggerAction(action, data, element);
    }

    // Handle filter and sort changes
    if (element.matches('#task-filter, #task-sort')) {
      this.handleFilterSortChange(element, event);
    }

    // Handle file input for import
    if (element.matches('#import-file')) {
      this.handleFileImport(element, event);
    }
  }

  /**
   * Handle form submission
   * @private
   */
  handleSubmit(event) {
    const form = event.target;
    
    // Check for registered form handlers
    for (const [selector, handler] of this.formHandlers) {
      if (form.matches(selector)) {
        event.preventDefault();
        
        try {
          const formData = new FormData(form);
          const data = Object.fromEntries(formData.entries());
          handler({ form, data, event });
        } catch (error) {
          console.error('Error in form handler:', error);
        }
        
        return;
      }
    }

    // Handle task form submission
    if (form.matches('[data-form="task-form"]')) {
      event.preventDefault();
      this.handleTaskFormSubmit(form, event);
    }

    // Handle settings form submission
    if (form.matches('[data-form="time-settings"]')) {
      event.preventDefault();
      this.handleSettingsFormSubmit(form, event);
    }
  }

  /**
   * Handle keydown events
   * @private
   */
  handleKeydown(event) {
    const element = event.target;
    const key = event.key;

    // Check for registered keyboard handlers
    if (this.keyboardHandlers.has(key)) {
      const handlers = this.keyboardHandlers.get(key);
      
      handlers.forEach(({ handler, options }) => {
        // Check if handler applies to this element
        if (options.element && !element.matches(options.element)) {
          return;
        }

        try {
          const result = handler({
            key,
            element,
            event,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            altKey: event.altKey,
            metaKey: event.metaKey
          });

          if (result === false || options.preventDefault) {
            event.preventDefault();
          }
        } catch (error) {
          console.error('Error in keyboard handler:', error);
        }
      });
    }
  }

  /**
   * Handle keyup events
   * @private
   */
  handleKeyup(event) {
    // Handle any keyup-specific logic here
  }

  /**
   * Handle focus events
   * @private
   */
  handleFocus(event) {
    const element = event.target;
    
    // Add focus class for styling
    element.classList.add('focused');
    
    // Handle focus announcements for screen readers
    if (element.hasAttribute('aria-describedby')) {
      const descriptionId = element.getAttribute('aria-describedby');
      const description = document.getElementById(descriptionId);
      
      if (description && description.textContent.trim()) {
        this.announceToScreenReader(description.textContent, 'polite');
      }
    }
  }

  /**
   * Handle blur events
   * @private
   */
  handleBlur(event) {
    const element = event.target;
    
    // Remove focus class
    element.classList.remove('focused');
  }

  /**
   * Handle Escape key globally
   * @private
   */
  handleEscapeKey(event) {
    // Close modals
    const openModal = document.querySelector('.modal--open');
    if (openModal) {
      event.preventDefault();
      this.triggerAction('close-modal');
      return;
    }

    // Close mobile menu
    const mobileMenu = document.querySelector('.nav__menu--open');
    if (mobileMenu) {
      event.preventDefault();
      this.triggerAction('close-mobile-menu');
      return;
    }

    // Clear search
    const searchInput = document.querySelector('#task-search');
    if (searchInput && searchInput.value) {
      event.preventDefault();
      searchInput.value = '';
      this.triggerAction('clear-search');
      return;
    }
  }

  /**
   * Handle Enter key globally
   * @private
   */
  handleEnterKey(event) {
    const element = event.target;

    // Handle Enter on buttons (for accessibility)
    if (element.matches('button') && !element.disabled) {
      element.click();
      return;
    }

    // Handle Enter on custom interactive elements
    if (element.matches('[role="button"]') && !element.hasAttribute('disabled')) {
      event.preventDefault();
      element.click();
      return;
    }
  }

  /**
   * Handle Tab key for focus management
   * @private
   */
  handleTabKey(event) {
    // Handle focus trapping in modals
    const modal = document.querySelector('.modal--open');
    if (modal) {
      this.handleModalFocusTrap(event, modal);
    }
  }

  /**
   * Handle focus trapping in modals
   * @private
   */
  handleModalFocusTrap(event, modal) {
    const focusableElements = modal.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  /**
   * Get action from element's data attributes
   * @private
   */
  getActionFromElement(element, eventType = 'click') {
    // Check for data-action attribute
    let action = element.getAttribute('data-action');
    
    if (!action) {
      // Check for event-specific action
      action = element.getAttribute(`data-${eventType}-action`);
    }

    if (!action) {
      // Check parent elements
      const parent = element.closest('[data-action]');
      if (parent) {
        action = parent.getAttribute('data-action');
      }
    }

    return action;
  }

  /**
   * Get data from element's data attributes
   * @private
   */
  getDataFromElement(element) {
    const data = {};
    
    // Get all data attributes
    for (const attr of element.attributes) {
      if (attr.name.startsWith('data-') && attr.name !== 'data-action') {
        const key = attr.name.substring(5).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        data[key] = attr.value;
      }
    }

    return data;
  }

  /**
   * Check if element is an input element
   * @private
   */
  isInputElement(element) {
    return element.matches('input, textarea, select, [contenteditable="true"]');
  }

  /**
   * Focus search input
   * @private
   */
  focusSearchInput() {
    const searchInput = document.querySelector('#task-search');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  /**
   * Handle search input with debouncing
   * @private
   */
  handleSearchInput(element, event) {
    clearTimeout(this.searchTimeout);
    
    this.searchTimeout = setTimeout(() => {
      this.triggerAction('search-tasks', {
        query: element.value,
        mode: 'text' // Default mode, can be changed by UI
      });
    }, 300); // 300ms debounce
  }

  /**
   * Handle setting input changes
   * @private
   */
  handleSettingInput(element, event) {
    const setting = element.getAttribute('data-setting');
    const value = element.type === 'checkbox' ? element.checked : element.value;
    
    this.triggerAction('update-setting', {
      setting,
      value
    });
  }

  /**
   * Handle filter and sort changes
   * @private
   */
  handleFilterSortChange(element, event) {
    if (element.id === 'task-filter') {
      this.triggerAction('filter-tasks', { filter: element.value });
    } else if (element.id === 'task-sort') {
      this.triggerAction('sort-tasks', { sort: element.value });
    }
  }

  /**
   * Handle file import
   * @private
   */
  handleFileImport(element, event) {
    const file = element.files[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          this.triggerAction('import-data', { data, file: file.name });
        } catch (error) {
          this.triggerAction('show-error', {
            message: 'Invalid JSON file format'
          });
        }
      };
      
      reader.readAsText(file);
    } else {
      this.triggerAction('show-error', {
        message: 'Please select a valid JSON file'
      });
    }
  }

  /**
   * Handle task form submission
   * @private
   */
  handleTaskFormSubmit(form, event) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    this.triggerAction('submit-task-form', { data, form });
  }

  /**
   * Handle settings form submission
   * @private
   */
  handleSettingsFormSubmit(form, event) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    this.triggerAction('submit-settings-form', { data, form });
  }

  /**
   * Announce message to screen readers
   * @private
   */
  announceToScreenReader(message, priority = 'polite') {
    const elementId = priority === 'assertive' ? 'error-messages' : 'status-messages';
    const element = document.getElementById(elementId);
    
    if (element) {
      element.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        element.textContent = '';
      }, 1000);
    }
  }

  /**
   * Get event manager statistics
   */
  getStats() {
    return {
      initialized: this.isInitialized,
      totalHandlers: this.handlers.size,
      keyboardHandlers: this.keyboardHandlers.size,
      formHandlers: this.formHandlers.size,
      actions: Array.from(this.handlers.keys())
    };
  }
}

/**
 * Create and initialize a global event manager instance
 */
let globalEventManager = null;

export function createEventManager() {
  if (!globalEventManager) {
    globalEventManager = new EventManager();
    globalEventManager.init();
  }
  
  return globalEventManager;
}

export function getEventManager() {
  return globalEventManager;
}

export function destroyEventManager() {
  if (globalEventManager) {
    globalEventManager.destroy();
    globalEventManager = null;
  }
}