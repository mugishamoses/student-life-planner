/**
 * Focus Management utility class for accessibility
 * Handles focus trapping, restoration, and keyboard navigation
 */

export class FocusManager {
  constructor() {
    this.focusStack = [];
    this.trapStack = [];
    this.setupGlobalKeyboardHandlers();
  }

  /**
   * Set up global keyboard event handlers
   */
  setupGlobalKeyboardHandlers() {
    document.addEventListener('keydown', (e) => {
      // Handle Escape key globally
      if (e.key === 'Escape') {
        this.handleEscapeKey(e);
      }
      
      // Handle Tab key for skip links
      if (e.key === 'Tab' && !e.shiftKey) {
        this.handleTabKey(e);
      }
    });
  }

  /**
   * Handle Escape key press
   */
  handleEscapeKey(e) {
    // Close topmost modal if any
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
      e.preventDefault();
      const closeButton = modal.querySelector('[data-action="close-modal"]');
      if (closeButton) {
        closeButton.click();
      }
      return;
    }
    
    // Close mobile menu if open
    const mobileMenu = document.querySelector('.nav__menu.open');
    if (mobileMenu) {
      e.preventDefault();
      const toggleButton = document.querySelector('[data-action="toggle-mobile-menu"]');
      if (toggleButton) {
        toggleButton.click();
      }
      return;
    }
    
    // Clear search if focused
    const searchInput = document.querySelector('#task-search:focus');
    if (searchInput && searchInput.value) {
      e.preventDefault();
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));
    }
  }

  /**
   * Handle Tab key for skip links and navigation
   */
  handleTabKey(e) {
    // If we're at the beginning of the document and there's a skip link, ensure it's visible
    const skipLink = document.querySelector('.skip-link');
    if (skipLink && document.activeElement === document.body) {
      // Focus will naturally move to skip link, but ensure it's visible
      setTimeout(() => {
        if (document.activeElement === skipLink) {
          skipLink.classList.add('skip-link--visible');
        }
      }, 0);
    }
  }

  /**
   * Push current focus to stack and set new focus
   */
  pushFocus(element) {
    // Store current focus
    const currentFocus = document.activeElement;
    if (currentFocus && currentFocus !== document.body) {
      this.focusStack.push(currentFocus);
    }
    
    // Set new focus
    if (element && element.focus) {
      // Use setTimeout to ensure element is ready for focus
      setTimeout(() => {
        element.focus();
        
        // Ensure element is visible
        if (element.scrollIntoView) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
          });
        }
      }, 0);
    }
  }

  /**
   * Restore focus from stack
   */
  popFocus() {
    const previousElement = this.focusStack.pop();
    if (previousElement && previousElement.focus && document.contains(previousElement)) {
      setTimeout(() => {
        previousElement.focus();
        
        // Ensure element is visible
        if (previousElement.scrollIntoView) {
          previousElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
          });
        }
      }, 0);
    } else {
      // Fallback to main content or body
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.focus();
      }
    }
  }

  /**
   * Trap focus within a container (for modals, menus, etc.)
   */
  trapFocus(container) {
    if (!container) return;
    
    const focusableSelector = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"]):not([disabled])',
      '[contenteditable="true"]'
    ].join(', ');
    
    const focusableElements = container.querySelectorAll(focusableSelector);
    
    if (focusableElements.length === 0) {
      // If no focusable elements, make container focusable
      container.tabIndex = -1;
      container.focus();
      return;
    }
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };
    
    // Add event listener
    container.addEventListener('keydown', handleKeyDown);
    
    // Store cleanup function and add to trap stack
    const trapInfo = {
      container,
      cleanup: () => {
        container.removeEventListener('keydown', handleKeyDown);
      }
    };
    
    this.trapStack.push(trapInfo);
    
    // Focus first element
    firstElement.focus();
    
    return trapInfo;
  }

  /**
   * Remove focus trap
   */
  removeFocusTrap(container) {
    const trapIndex = this.trapStack.findIndex(trap => trap.container === container);
    if (trapIndex !== -1) {
      const trap = this.trapStack[trapIndex];
      trap.cleanup();
      this.trapStack.splice(trapIndex, 1);
    }
  }

  /**
   * Remove all focus traps
   */
  removeAllFocusTraps() {
    this.trapStack.forEach(trap => trap.cleanup());
    this.trapStack = [];
  }

  /**
   * Set up keyboard navigation for a specific container
   */
  setupKeyboardNavigation(container, options = {}) {
    if (!container) return;
    
    const {
      arrowKeys = true,
      enterActivation = true,
      spaceActivation = true,
      homeEnd = false
    } = options;
    
    const handleKeyDown = (e) => {
      const focusableElements = container.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
      );
      
      const currentIndex = Array.from(focusableElements).indexOf(document.activeElement);
      
      if (arrowKeys && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();
        
        let nextIndex;
        if (e.key === 'ArrowDown') {
          nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
        }
        
        focusableElements[nextIndex].focus();
      }
      
      if (homeEnd && (e.key === 'Home' || e.key === 'End')) {
        e.preventDefault();
        
        if (e.key === 'Home') {
          focusableElements[0].focus();
        } else {
          focusableElements[focusableElements.length - 1].focus();
        }
      }
      
      if (enterActivation && e.key === 'Enter' && e.target.getAttribute('role') === 'button') {
        e.preventDefault();
        e.target.click();
      }
      
      if (spaceActivation && e.key === ' ') {
        if (e.target.type === 'checkbox' || e.target.getAttribute('role') === 'button') {
          e.preventDefault();
          e.target.click();
        }
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }

  /**
   * Announce content to screen readers
   */
  announce(message, priority = 'polite') {
    const announcer = document.getElementById(
      priority === 'assertive' ? 'error-messages' : 'status-messages'
    );
    
    if (announcer) {
      // Clear previous message
      announcer.textContent = '';
      
      // Set new message after a brief delay to ensure it's announced
      setTimeout(() => {
        announcer.textContent = message;
      }, 100);
      
      // Clear message after announcement
      setTimeout(() => {
        announcer.textContent = '';
      }, 5000);
    }
  }

  /**
   * Ensure element is visible and focusable
   */
  ensureVisible(element) {
    if (!element) return;
    
    // Remove any hidden attributes temporarily
    const wasHidden = element.hidden;
    const wasAriaHidden = element.getAttribute('aria-hidden');
    
    if (wasHidden) element.hidden = false;
    if (wasAriaHidden === 'true') element.setAttribute('aria-hidden', 'false');
    
    // Scroll into view
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'nearest',
      inline: 'nearest'
    });
    
    // Restore hidden state after focus
    setTimeout(() => {
      if (wasHidden) element.hidden = true;
      if (wasAriaHidden === 'true') element.setAttribute('aria-hidden', 'true');
    }, 100);
  }

  /**
   * Get all focusable elements in container
   */
  getFocusableElements(container = document) {
    const selector = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"]):not([disabled])',
      '[contenteditable="true"]'
    ].join(', ');
    
    return container.querySelectorAll(selector);
  }

  /**
   * Check if element is focusable
   */
  isFocusable(element) {
    if (!element || element.disabled || element.hidden) return false;
    if (element.getAttribute('aria-hidden') === 'true') return false;
    if (element.tabIndex === -1) return false;
    
    const focusableElements = this.getFocusableElements();
    return Array.from(focusableElements).includes(element);
  }

  /**
   * Cleanup all focus management
   */
  destroy() {
    this.removeAllFocusTraps();
    this.focusStack = [];
  }
}