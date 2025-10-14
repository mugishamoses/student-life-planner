/**
 * Campus Life Planner - Main Application Entry Point
 * 
 * This is the main entry point for the vanilla JavaScript Campus Life Planner.
 * It initializes the application and sets up the core modules.
 */

// Application class to manage the entire app
class App {
  constructor() {
    this.initialized = false;
    this.modules = {};
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      console.log('Initializing Campus Life Planner...');
      
      // Set up basic DOM structure if needed
      this.setupBasicStructure();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Mark as initialized
      this.initialized = true;
      
      console.log('Campus Life Planner initialized successfully');
      
      // Show welcome message
      this.showWelcomeMessage();
      
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
    // Handle keyboard navigation
    document.addEventListener('keydown', this.handleKeydown.bind(this));
    
    // Handle window resize for responsive behavior
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Handle visibility change (for pausing/resuming when tab is not active)
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  /**
   * Handle global keyboard events
   */
  handleKeydown(event) {
    // Handle Escape key to close modals/menus
    if (event.key === 'Escape') {
      this.handleEscapeKey();
    }
    
    // Handle Enter key for button-like elements
    if (event.key === 'Enter' && event.target.getAttribute('role') === 'button') {
      event.target.click();
    }
  }

  /**
   * Handle Escape key press
   */
  handleEscapeKey() {
    // Close any open modals
    const openModal = document.querySelector('.modal-overlay');
    if (openModal) {
      this.closeModal();
    }
    
    // Close mobile menu if open
    const mobileMenu = document.querySelector('.mobile-menu.open');
    if (mobileMenu) {
      this.closeMobileMenu();
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
   * Close any open modal
   */
  closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
      modal.remove();
    }
  }

  /**
   * Close mobile menu
   */
  closeMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    const overlay = document.querySelector('.mobile-menu-overlay');
    
    if (mobileMenu) {
      mobileMenu.classList.remove('open');
    }
    
    if (overlay) {
      overlay.classList.remove('open');
    }
  }

  /**
   * Show welcome message
   */
  showWelcomeMessage() {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.innerHTML = `
        <div class="container">
          <div class="card">
            <div class="card__header">
              <h1 class="card__title">Welcome to Campus Life Planner</h1>
            </div>
            <div class="card__body">
              <p>Your personal academic task management system is ready to help you stay organized and productive.</p>
              <p>This application will help you:</p>
              <ul>
                <li>Track your academic tasks and assignments</li>
                <li>Set and monitor weekly time goals</li>
                <li>Organize tasks by categories and due dates</li>
                <li>Search and filter your tasks efficiently</li>
              </ul>
            </div>
            <div class="card__footer">
              <button class="btn btn--primary" onclick="app.showGettingStarted()">
                Get Started
              </button>
            </div>
          </div>
        </div>
      `;
    }
  }

  /**
   * Show getting started guide
   */
  showGettingStarted() {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.innerHTML = `
        <div class="container">
          <div class="card">
            <div class="card__header">
              <h1 class="card__title">Getting Started</h1>
            </div>
            <div class="card__body">
              <p>The Campus Life Planner is currently being set up. Here's what's available:</p>
              
              <h2>Current Features</h2>
              <ul>
                <li>✅ Responsive design framework</li>
                <li>✅ Accessibility features (ARIA, keyboard navigation)</li>
                <li>✅ Mobile-first CSS architecture</li>
                <li>✅ Component-based styling system</li>
              </ul>
              
              <h2>Coming Soon</h2>
              <ul>
                <li>🔄 Task management system</li>
                <li>🔄 Data persistence with localStorage</li>
                <li>🔄 Advanced search and filtering</li>
                <li>🔄 Statistics dashboard</li>
                <li>🔄 Settings and preferences</li>
              </ul>
              
              <h2>Keyboard Navigation</h2>
              <p>This application is fully keyboard accessible:</p>
              <ul>
                <li><kbd>Tab</kbd> - Navigate between interactive elements</li>
                <li><kbd>Enter</kbd> - Activate buttons and links</li>
                <li><kbd>Escape</kbd> - Close modals and menus</li>
                <li><kbd>Space</kbd> - Toggle checkboxes and buttons</li>
              </ul>
            </div>
            <div class="card__footer">
              <button class="btn btn--secondary" onclick="app.showWelcomeMessage()">
                Back to Welcome
              </button>
            </div>
          </div>
        </div>
      `;
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