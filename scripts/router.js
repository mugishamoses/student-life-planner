/**
 * Campus Life Planner - Router Module
 * 
 * Implements client-side routing for single-page navigation using hash-based routing.
 * Provides browser history integration and navigation state management.
 */

/**
 * Router class for handling client-side navigation
 */
export class Router {
  constructor(routes = {}) {
    this.routes = new Map();
    this.currentRoute = null;
    this.defaultRoute = 'about';
    this.navigationHistory = [];
    this.maxHistoryLength = 50;
    
    // Initialize with provided routes
    Object.entries(routes).forEach(([path, handler]) => {
      this.addRoute(path, handler);
    });
    
    // Bind methods to preserve context
    this.handleHashChange = this.handleHashChange.bind(this);
    this.handlePopState = this.handlePopState.bind(this);
  }

  /**
   * Add a route to the router
   * @param {string} path - The route path (without #)
   * @param {Function} handler - The handler function for this route
   */
  addRoute(path, handler) {
    if (typeof path !== 'string' || typeof handler !== 'function') {
      throw new Error('Route path must be a string and handler must be a function');
    }
    
    this.routes.set(path, handler);
  }

  /**
   * Remove a route from the router
   * @param {string} path - The route path to remove
   */
  removeRoute(path) {
    return this.routes.delete(path);
  }

  /**
   * Get all registered routes
   * @returns {Array} Array of route paths
   */
  getRoutes() {
    return Array.from(this.routes.keys());
  }

  /**
   * Start the router and set up event listeners
   */
  start() {
    // Listen for hash changes
    window.addEventListener('hashchange', this.handleHashChange);
    
    // Listen for browser back/forward buttons
    window.addEventListener('popstate', this.handlePopState);
    
    // Handle initial route
    this.handleInitialRoute();
    
    console.log('Router started with routes:', this.getRoutes());
  }

  /**
   * Stop the router and clean up event listeners
   */
  stop() {
    window.removeEventListener('hashchange', this.handleHashChange);
    window.removeEventListener('popstate', this.handlePopState);
    
    console.log('Router stopped');
  }

  /**
   * Navigate to a specific route
   * @param {string} path - The route path to navigate to
   * @param {boolean} replace - Whether to replace current history entry
   * @param {Object} state - Optional state object to store with navigation
   */
  navigate(path, replace = false, state = null) {
    if (typeof path !== 'string') {
      console.error('Navigate path must be a string');
      return false;
    }

    // Clean the path (remove leading # if present)
    const cleanPath = path.startsWith('#') ? path.substring(1) : path;
    
    // Validate route exists or use default
    const targetRoute = this.routes.has(cleanPath) ? cleanPath : this.defaultRoute;
    
    // Don't navigate if already on this route
    if (this.currentRoute === targetRoute) {
      return true;
    }

    try {
      // Update browser history
      const url = `#${targetRoute}`;
      
      if (replace) {
        window.history.replaceState(state, '', url);
      } else {
        window.history.pushState(state, '', url);
      }

      // Execute the route handler
      this.executeRoute(targetRoute, state);
      
      // Add to navigation history
      this.addToHistory(targetRoute, state);
      
      return true;
    } catch (error) {
      console.error('Navigation failed:', error);
      return false;
    }
  }

  /**
   * Get the current route
   * @returns {string|null} Current route path
   */
  getCurrentRoute() {
    return this.currentRoute;
  }

  /**
   * Get navigation history
   * @returns {Array} Array of navigation history entries
   */
  getHistory() {
    return [...this.navigationHistory];
  }

  /**
   * Go back in navigation history
   */
  goBack() {
    if (this.navigationHistory.length > 1) {
      window.history.back();
    }
  }

  /**
   * Go forward in navigation history
   */
  goForward() {
    window.history.forward();
  }

  /**
   * Check if a route exists
   * @param {string} path - The route path to check
   * @returns {boolean} True if route exists
   */
  hasRoute(path) {
    return this.routes.has(path);
  }

  /**
   * Set the default route
   * @param {string} path - The default route path
   */
  setDefaultRoute(path) {
    if (this.routes.has(path)) {
      this.defaultRoute = path;
    } else {
      console.warn(`Default route "${path}" does not exist`);
    }
  }

  /**
   * Handle hash change events
   * @private
   */
  handleHashChange() {
    const hash = window.location.hash.substring(1) || this.defaultRoute;
    this.executeRoute(hash);
  }

  /**
   * Handle browser back/forward navigation
   * @private
   */
  handlePopState(event) {
    const hash = window.location.hash.substring(1) || this.defaultRoute;
    this.executeRoute(hash, event.state);
  }

  /**
   * Handle initial route when router starts
   * @private
   */
  handleInitialRoute() {
    const hash = window.location.hash.substring(1) || this.defaultRoute;
    
    // If no hash or invalid route, navigate to default
    if (!hash || !this.routes.has(hash)) {
      this.navigate(this.defaultRoute, true);
    } else {
      this.executeRoute(hash);
    }
  }

  /**
   * Execute a route handler
   * @private
   * @param {string} path - The route path
   * @param {Object} state - Optional state object
   */
  executeRoute(path, state = null) {
    // Validate route exists
    if (!this.routes.has(path)) {
      console.warn(`Route "${path}" not found, using default route`);
      path = this.defaultRoute;
    }

    const handler = this.routes.get(path);
    
    if (!handler) {
      console.error(`No handler found for route "${path}"`);
      return;
    }

    try {
      // Update current route
      const previousRoute = this.currentRoute;
      this.currentRoute = path;

      // Execute the route handler
      handler({
        path,
        previousRoute,
        state,
        params: this.extractParams(path),
        query: this.extractQuery()
      });

      // Update navigation UI
      this.updateNavigationUI(path);
      
      // Announce route change for accessibility
      this.announceRouteChange(path);
      
    } catch (error) {
      console.error(`Error executing route handler for "${path}":`, error);
    }
  }

  /**
   * Extract parameters from route path
   * @private
   * @param {string} path - The route path
   * @returns {Object} Extracted parameters
   */
  extractParams(path) {
    // For simple hash routing, we don't have complex params
    // This could be extended for more complex routing patterns
    return {};
  }

  /**
   * Extract query parameters from URL
   * @private
   * @returns {Object} Query parameters
   */
  extractQuery() {
    const params = new URLSearchParams(window.location.search);
    const query = {};
    
    for (const [key, value] of params) {
      query[key] = value;
    }
    
    return query;
  }

  /**
   * Update navigation UI to reflect current route
   * @private
   * @param {string} currentPath - The current route path
   */
  updateNavigationUI(currentPath) {
    // Update navigation links
    const navLinks = document.querySelectorAll('.nav__link');
    
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      
      if (href) {
        const linkPath = href.startsWith('#') ? href.substring(1) : href;
        
        if (linkPath === currentPath) {
          link.setAttribute('aria-current', 'page');
          link.classList.add('nav__link--active');
        } else {
          link.removeAttribute('aria-current');
          link.classList.remove('nav__link--active');
        }
      }
    });

    // Update page title
    this.updatePageTitle(currentPath);
  }

  /**
   * Update page title based on current route
   * @private
   * @param {string} path - The current route path
   */
  updatePageTitle(path) {
    const titles = {
      'about': 'About - Campus Life Planner',
      'dashboard': 'Dashboard - Campus Life Planner',
      'tasks': 'Tasks - Campus Life Planner',
      'settings': 'Settings - Campus Life Planner'
    };

    const title = titles[path] || 'Campus Life Planner';
    document.title = title;
  }

  /**
   * Announce route change for screen readers
   * @private
   * @param {string} path - The current route path
   */
  announceRouteChange(path) {
    const announcements = {
      'about': 'Navigated to About page',
      'dashboard': 'Navigated to Dashboard page',
      'tasks': 'Navigated to Tasks page',
      'settings': 'Navigated to Settings page'
    };

    const message = announcements[path] || `Navigated to ${path} page`;
    
    // Announce to screen readers
    const statusDiv = document.getElementById('status-messages');
    if (statusDiv) {
      statusDiv.textContent = message;
    }
  }

  /**
   * Add navigation to history
   * @private
   * @param {string} path - The route path
   * @param {Object} state - Optional state object
   */
  addToHistory(path, state = null) {
    const entry = {
      path,
      state,
      timestamp: new Date().toISOString()
    };

    this.navigationHistory.push(entry);

    // Limit history size
    if (this.navigationHistory.length > this.maxHistoryLength) {
      this.navigationHistory.shift();
    }
  }

  /**
   * Get router statistics
   * @returns {Object} Router statistics
   */
  getStats() {
    return {
      currentRoute: this.currentRoute,
      totalRoutes: this.routes.size,
      historyLength: this.navigationHistory.length,
      routes: this.getRoutes()
    };
  }
}

/**
 * Create a default router instance with standard routes
 * @returns {Router} Configured router instance
 */
export function createDefaultRouter() {
  const router = new Router();
  
  // Add default routes (handlers will be set by the UI manager)
  router.addRoute('about', () => {});
  router.addRoute('dashboard', () => {});
  router.addRoute('tasks', () => {});
  router.addRoute('settings', () => {});
  
  return router;
}

/**
 * Utility function to get current route from URL
 * @returns {string} Current route path
 */
export function getCurrentRouteFromURL() {
  return window.location.hash.substring(1) || 'about';
}

/**
 * Utility function to build route URL
 * @param {string} path - Route path
 * @returns {string} Full URL with hash
 */
export function buildRouteURL(path) {
  return `#${path}`;
}