/**
 * Campus Life Planner - Main Application Entry Point
 * 
 * This is the main entry point for the vanilla JavaScript Campus Life Planner.
 * It initializes the application and sets up the core modules.
 */

import { AppState } from './state.js';
import { UIManager } from './ui.js';
import { storage } from './storage.js';
import { Router, createDefaultRouter } from './router.js';

// Application class to manage the entire app
class App {
  constructor() {
    this.initialized = false;
    this.modules = {};
    this.state = null;
    this.ui = null;
    this.router = null;
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      console.log('Initializing Campus Life Planner...');
      
      // Set up basic DOM structure if needed
      this.setupBasicStructure();
      
      // Initialize state management
      this.state = new AppState();
      this.state.storage = storage; // Attach storage module
      
      // Initialize router
      this.router = createDefaultRouter();
      
      // Initialize UI manager with router
      this.ui = new UIManager(this.state, this.router);
      
      // Set up route handlers
      this.setupRoutes();
      
      // Set up global event listeners
      this.setupEventListeners();
      
      // Start router (this will handle initial navigation)
      this.router.start();
      
      // Render initial page
      this.ui.render();
      
      // Mark as initialized
      this.initialized = true;
      
      console.log('Campus Life Planner initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Campus Life Planner:', error);
      this.showErrorMessage('Failed to initialize application. Please refresh the page.');
    }
  }

  /**
   * Set up basic DOM structure if elements are missing
   */
  setupBasicStructure() {
    // Ensure main content area exists
    if (!document.getElementById('main-content')) {
      const main = document.createElement('main');
      main.id = 'main-content';
      main.setAttribute('role', 'main');
      document.body.appendChild(main);
    }

    // Ensure status message areas exist for accessibility
    if (!document.getElementById('status-messages')) {
      const statusDiv = document.createElement('div');
      statusDiv.id = 'status-messages';
      statusDiv.setAttribute('aria-live', 'polite');
      statusDiv.setAttribute('aria-atomic', 'true');
      statusDiv.className = 'sr-only';
      document.body.appendChild(statusDiv);
    }

    if (!document.getElementById('error-messages')) {
      const errorDiv = document.createElement('div');
      errorDiv.id = 'error-messages';
      errorDiv.setAttribute('aria-live', 'assertive');
      errorDiv.setAttribute('aria-atomic', 'true');
      errorDiv.className = 'sr-only';
      document.body.appendChild(errorDiv);
    }
  }

  /**
   * Set up global event listeners
   */
  setupEventListeners() {
    // Handle window resize for responsive behavior
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Handle visibility change (for pausing/resuming when tab is not active)
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Handle navigation links with router
    document.addEventListener('click', (e) => {
      const link = e.target.closest('.nav__link');
      if (link) {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          const page = href.substring(1) || 'about';
          this.navigateToPage(page);
        }
      }
    });
    
    // Handle mobile menu toggle
    const mobileToggle = document.querySelector('[data-action="toggle-mobile-menu"]');
    if (mobileToggle) {
      mobileToggle.addEventListener('click', this.toggleMobileMenu.bind(this));
    }
    
    // Handle mobile menu overlay
    const mobileOverlay = document.querySelector('.mobile-menu-overlay');
    if (mobileOverlay) {
      mobileOverlay.addEventListener('click', this.closeMobileMenu.bind(this));
    }
    
    // Handle keyboard events for navigation
    document.addEventListener('keydown', (e) => {
      // Close mobile menu on Escape key
      if (e.key === 'Escape') {
        const navMenu = document.querySelector('.nav__menu');
        if (navMenu && navMenu.classList.contains('nav__menu--open')) {
          this.closeMobileMenu();
        }
      }
    });
  }

  /**
   * Set up route handlers
   */
  setupRoutes() {
    // Set up route handlers for each page
    this.router.addRoute('about', (routeInfo) => {
      this.handleRouteChange('about', routeInfo);
    });
    
    this.router.addRoute('dashboard', (routeInfo) => {
      this.handleRouteChange('dashboard', routeInfo);
    });
    
    this.router.addRoute('tasks', (routeInfo) => {
      this.handleRouteChange('tasks', routeInfo);
    });
    
    this.router.addRoute('settings', (routeInfo) => {
      this.handleRouteChange('settings', routeInfo);
    });
  }

  /**
   * Handle route changes
   */
  handleRouteChange(page, routeInfo) {
    if (this.state) {
      this.state.updateUIState({ currentPage: page });
    }
    
    // Let UI manager handle the page rendering
    if (this.ui) {
      this.ui.renderPage(page);
    }
    
    // Close mobile menu if open
    this.closeMobileMenu();
    
    console.log(`Navigated to ${page} page`, routeInfo);
  }

  /**
   * Navigate to a specific page using the router
   */
  navigateToPage(page) {
    if (this.router) {
      this.router.navigate(page);
    }
  }

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu() {
    const navMenu = document.querySelector('.nav__menu');
    const mobileToggle = document.querySelector('[data-action="toggle-mobile-menu"]');
    const overlay = document.querySelector('.mobile-menu-overlay');
    
    if (navMenu && mobileToggle) {
      const isOpen = navMenu.classList.contains('nav__menu--open');
      
      if (isOpen) {
        this.closeMobileMenu();
      } else {
        navMenu.classList.add('nav__menu--open');
        overlay?.classList.add('mobile-menu-overlay--open');
        mobileToggle.setAttribute('aria-expanded', 'true');
        
        // Focus first menu item for keyboard accessibility
        const firstLink = navMenu.querySelector('.nav__link');
        if (firstLink) {
          firstLink.focus();
        }
        
        // Set up focus trap for mobile menu
        this.setupMobileMenuFocusTrap(navMenu);
      }
    }
  }

  /**
   * Close mobile menu
   */
  closeMobileMenu() {
    const navMenu = document.querySelector('.nav__menu');
    const mobileToggle = document.querySelector('[data-action="toggle-mobile-menu"]');
    const overlay = document.querySelector('.mobile-menu-overlay');
    
    if (navMenu && mobileToggle) {
      navMenu.classList.remove('nav__menu--open');
      overlay?.classList.remove('mobile-menu-overlay--open');
      mobileToggle.setAttribute('aria-expanded', 'false');
      
      // Return focus to toggle button for keyboard accessibility
      mobileToggle.focus();
      
      // Remove focus trap
      this.removeMobileMenuFocusTrap();
    }
  }

  /**
   * Set up focus trap for mobile menu
   */
  setupMobileMenuFocusTrap(menuElement) {
    const focusableElements = menuElement.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    this.mobileMenuKeyHandler = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.closeMobileMenu();
      }
    };
    
    document.addEventListener('keydown', this.mobileMenuKeyHandler);
  }

  /**
   * Remove focus trap for mobile menu
   */
  removeMobileMenuFocusTrap() {
    if (this.mobileMenuKeyHandler) {
      document.removeEventListener('keydown', this.mobileMenuKeyHandler);
      this.mobileMenuKeyHandler = null;
    }
  }



  /**
   * Handle window resize
   */
  handleResize() {
    // Debounce resize events
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      this.onResize();
    }, 250);
  }

  /**
   * Handle resize events (debounced)
   */
  onResize() {
    // Close mobile menu on desktop
    if (window.innerWidth >= 768) {
      this.closeMobileMenu();
    }
  }

  /**
   * Handle visibility change (tab focus/blur)
   */
  handleVisibilityChange() {
    if (document.hidden) {
      // Tab is not visible - pause any animations or timers
      console.log('App paused (tab not visible)');
    } else {
      // Tab is visible - resume normal operation
      console.log('App resumed (tab visible)');
    }
  }





  /**
   * Show error message to user
   */
  showErrorMessage(message) {
    const errorDiv = document.getElementById('error-messages');
    if (errorDiv) {
      errorDiv.textContent = message;
    }
    
    // Also show visual error
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.innerHTML = `
        <div class="container">
          <div class="card">
            <div class="card__header">
              <h1 class="card__title">Error</h1>
            </div>
            <div class="card__body">
              <p class="text-error">${message}</p>
              <button class="btn btn--primary" onclick="location.reload()">
                Reload Page
              </button>
            </div>
          </div>
        </div>
      `;
    }
  }

  /**
   * Get application status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      modules: Object.keys(this.modules),
      timestamp: new Date().toISOString()
    };
  }
}

// Global app instance
let app;

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  app = new App();
  app.init();
});

// Make app available globally for debugging
window.app = app;

// Export for ES modules (if needed)
export { App };