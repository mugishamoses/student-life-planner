/**
 * Campus Life Planner - Main Application Entry Point
 * 
 * This is the main entry point for the vanilla JavaScript Campus Life Planner.
 * It initializes the application and sets up the core modules.
 */

import { AppState } from './state.js';
import { UIManager } from './ui/index.js';
import { storage } from './storage.js';
import { Router, createDefaultRouter } from './router.js';
import { createEventManager } from './events.js';
import { createModalManager, createToastManager } from './modals.js';

// Application class to manage the entire app
export class App {
  constructor() {
    this.initialized = false;
    this.modules = {};
    this.state = null;
    this.ui = null;
    this.router = null;
    this.eventManager = null;
    this.modalManager = null;
    this.toastManager = null;
  }

  /**
   * Initialize the application
   */
  /**
   * Wait for state to be fully initialized
   * @private
   */
  async waitForStateInitialization() {
    if (!this.state) {
      throw new Error('State not initialized');
    }
    
    // Wait for up to 5 seconds for state to initialize
    for (let i = 0; i < 50; i++) {
      if (this.state.isInitialized) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error('State initialization timeout');
  }

  async init() {
    try {
      console.log('Initializing Campus Life Planner...');
      
      // Set up basic DOM structure if needed
      this.setupBasicStructure();
      
      // Initialize centralized event management
      this.eventManager = createEventManager();
      
      // Initialize modal and toast managers
      this.modalManager = createModalManager(this.eventManager);
      this.toastManager = createToastManager();
      
      // Initialize state management
      this.state = new AppState();
      this.state.storage = storage; // Attach storage module
      
      // Wait for state to be fully initialized
      await this.waitForStateInitialization();
      
      // Initialize router
      this.router = createDefaultRouter();
      
      // Initialize UI manager with all managers
      this.ui = new UIManager(this.state, this.router, this.eventManager, this.modalManager, this.toastManager);
      
      // Set up route handlers
      this.setupRoutes();
      
      // Set up application event handlers
      this.setupApplicationEventHandlers();
      
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
   * Set up application-specific event handlers using the centralized event manager
   */
  setupApplicationEventHandlers() {
    // Handle window resize for responsive behavior
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Handle visibility change (for pausing/resuming when tab is not active)
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Register application actions with event manager
    this.eventManager.on('navigate', ({ data }) => {
      this.navigateToPage(data.page);
    });
    
    this.eventManager.on('toggle-mobile-menu', () => {
      this.toggleMobileMenu();
    });
    
    this.eventManager.on('close-mobile-menu', () => {
      this.closeMobileMenu();
    });
    
    this.eventManager.on('show-help', () => {
      this.navigateToPage('about');
    });
    
    // Register task management actions
    this.eventManager.on('add-task', () => {
      if (this.modalManager) {
        this.modalManager.show('task', { mode: 'add' });
      }
    });
    
    this.eventManager.on('edit-task', ({ data }) => {
      if (this.modalManager && this.state) {
        const task = this.state.getTasks().find(t => t.id === data.taskId);
        if (task) {
          this.modalManager.show('task', { mode: 'edit', task });
        }
      }
    });
    

    
    this.eventManager.on('delete-task', (eventData) => {
      // EventManager passes: { action, data, element, preventDefault, stopPropagation }
      const data = eventData.data || eventData;
      const taskId = data.taskId;
      
      if (!taskId) {
        console.error('No taskId provided for deletion');
        this.toastManager?.show('Error: No task ID provided', 'error');
        return;
      }
      
      if (this.modalManager) {
        this.modalManager.show('confirm', {
          title: 'Delete Task',
          message: 'Are you sure you want to delete this task? This action cannot be undone.',
          confirmAction: 'confirm-delete-task',
          confirmData: { taskId: taskId },
          confirmClass: 'btn--danger',
          confirmText: 'Delete Task'
        });
      }
    });
    
    this.eventManager.on('confirm-delete-task', (eventData) => {
      // EventManager passes: { action, data, element, preventDefault, stopPropagation }
      const data = eventData.data || eventData;
      const taskId = data.taskId;
      
      if (!taskId) {
        console.error('No taskId provided for confirmation');
        this.toastManager?.show('Error: No task ID provided for deletion', 'error');
        return;
      }
      
      if (this.state && this.toastManager) {
        try {
          const deletedTask = this.state.deleteTask(taskId);
          this.modalManager?.hide();
          this.toastManager.show('Task deleted successfully', 'success');
        } catch (error) {
          console.error('Failed to delete task:', error);
          this.toastManager.show('Failed to delete task: ' + error.message, 'error');
        }
      }
    });
    
    this.eventManager.on('toggle-task-status', ({ data }) => {
      if (this.state && this.toastManager) {
        const task = this.state.getTasks().find(t => t.id === data.taskId);
        if (task) {
          const newStatus = task.status === 'Complete' ? 'Pending' : 'Complete';
          this.state.updateTask(data.taskId, { status: newStatus });
          
          const message = newStatus === 'Complete' ? 'Task completed!' : 'Task marked as pending';
          this.toastManager.show(message, 'success');
        }
      }
    });
    
    // Register search and filter actions
    this.eventManager.on('search-tasks', ({ data }) => {
      if (this.state) {
        this.state.updateUIState({ searchQuery: data.query });
      }
    });
    
    this.eventManager.on('clear-search', () => {
      if (this.state) {
        this.state.updateUIState({ searchQuery: '' });
      }
    });
    
    this.eventManager.on('filter-tasks', ({ data }) => {
      if (this.state) {
        this.state.updateUIState({ filterBy: data.filter });
      }
    });
    
    this.eventManager.on('sort-tasks', ({ data }) => {
      if (this.state) {
        this.state.updateUIState({ sortBy: data.sort });
      }
    });
    
    this.eventManager.on('set-view-mode', ({ data }) => {
      if (this.state) {
        this.state.updateUIState({ viewMode: data.view });
      }
    });
    
    this.eventManager.on('toggle-search-mode', () => {
      if (this.state) {
        const currentMode = this.state.getUIState().searchMode || 'text';
        const newMode = currentMode === 'text' ? 'regex' : 'text';
        this.state.updateUIState({ searchMode: newMode });
      }
    });
    
    // Register settings actions
    this.eventManager.on('update-setting', ({ data }) => {
      if (this.state) {
        this.state.updateSettings({ [data.setting]: data.value });
      }
    });
    
    this.eventManager.on('export-data', () => {
      if (this.state && this.toastManager) {
        try {
          const data = {
            tasks: this.state.getTasks(),
            settings: this.state.getSettings(),
            exportDate: new Date().toISOString(),
            version: '1.0.0'
          };
          
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `campus-life-planner-${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          URL.revokeObjectURL(url);
          
          this.toastManager.show('Data exported successfully', 'success');
        } catch (error) {
          console.error('Export failed:', error);
          this.toastManager.show('Export failed. Please try again.', 'error');
        }
      }
    });

    // Register manual backup action
    this.eventManager.on('create-backup', async () => {
      if (this.state && this.toastManager) {
        try {
          const result = await this.state.createManualBackup();
          if (result.success) {
            this.toastManager.show(result.message, 'success');
          } else {
            this.toastManager.show(result.message, 'error');
          }
        } catch (error) {
          console.error('Manual backup failed:', error);
          this.toastManager.show('Backup failed. Please try again.', 'error');
        }
      }
    });

    // Register file import action
    this.eventManager.on('import-from-file', async ({ data }) => {
      if (this.state && this.toastManager && data.file) {
        try {
          const result = await this.state.importFromFile(data.file);
          if (result.success) {
            this.toastManager.show(result.message, 'success');
            // Refresh UI
            if (this.ui) {
              this.ui.render();
            }
          } else {
            this.toastManager.show(result.message, 'error');
          }
        } catch (error) {
          console.error('File import failed:', error);
          this.toastManager.show('Import failed. Please try again.', 'error');
        }
      }
    });

    // Register auto-backup toggle
    this.eventManager.on('toggle-auto-backup', ({ data }) => {
      if (this.state && this.toastManager) {
        try {
          this.state.setAutoBackup(data.enabled);
          const message = data.enabled ? 
            'Auto-backup enabled. Backups will be downloaded automatically.' : 
            'Auto-backup disabled.';
          this.toastManager.show(message, 'success');
        } catch (error) {
          console.error('Auto-backup toggle failed:', error);
          this.toastManager.show('Failed to update auto-backup setting.', 'error');
        }
      }
    });
    
    this.eventManager.on('export-settings', () => {
      if (this.state && this.toastManager) {
        try {
          const data = {
            settings: this.state.getSettings(),
            exportDate: new Date().toISOString(),
            version: '1.0.0',
            type: 'settings-only'
          };
          
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `campus-life-planner-settings-${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          URL.revokeObjectURL(url);
          
          this.toastManager.show('Settings exported successfully', 'success');
        } catch (error) {
          console.error('Settings export failed:', error);
          this.toastManager.show('Settings export failed. Please try again.', 'error');
        }
      }
    });
    
    this.eventManager.on('import-data', ({ data }) => {
      if (this.state && this.toastManager) {
        try {
          // Validate import data structure
          if (!data.data || typeof data.data !== 'object') {
            throw new Error('Invalid data format');
          }
          
          const importData = data.data;
          
          // Import tasks if present
          if (importData.tasks && Array.isArray(importData.tasks)) {
            importData.tasks.forEach(task => {
              // Validate task structure and add if valid
              if (task.id && task.title) {
                this.state.addTask(task);
              }
            });
          }
          
          // Import settings if present
          if (importData.settings && typeof importData.settings === 'object') {
            this.state.updateSettings(importData.settings);
          }
          
          this.toastManager.show(`Data imported successfully from ${data.file}`, 'success');
        } catch (error) {
          console.error('Import failed:', error);
          this.toastManager.show('Import failed. Please check the file format.', 'error');
        }
      }
    });
    
    this.eventManager.on('clear-data', () => {
      if (this.modalManager) {
        this.modalManager.show('confirm', {
          title: 'Clear All Data',
          message: 'Are you sure you want to clear all data? This action cannot be undone and will remove all tasks and reset settings.',
          confirmAction: 'confirm-clear-data',
          confirmText: 'Clear All Data',
          confirmClass: 'btn--danger'
        });
      }
    });
    
    this.eventManager.on('confirm-clear-data', () => {
      if (this.state && this.modalManager && this.toastManager) {
        // Clear all data
        localStorage.clear();
        
        // Reinitialize state
        this.state = new AppState();
        this.state.storage = storage;
        
        // Update UI
        this.ui.state = this.state;
        this.ui.render();
        this.modalManager.hide();
        this.toastManager.show('All data cleared successfully', 'success');
      }
    });
    
    // Register modal actions
    this.eventManager.on('close-modal', () => {
      if (this.modalManager) {
        this.modalManager.hide();
      }
    });
    
    this.eventManager.on('show-error', ({ data }) => {
      if (this.toastManager) {
        this.toastManager.show(data.message, 'error');
      }
    });
    
    this.eventManager.on('show-success', ({ data }) => {
      if (this.toastManager) {
        this.toastManager.show(data.message, 'success');
      }
    });
    
    // Single canonical task form submission handler
    this.eventManager.on('submit-task-form', async ({ data }) => {
      console.log('=== TASK FORM SUBMISSION HANDLER CALLED ===');
      console.log('Received data:', data);
      
      // Get callbacks from modal manager
      const callbacks = this.modalManager._currentSubmissionCallbacks || {};
      const { onSuccess, onError } = callbacks;
      
      console.log('Callbacks available:', { 
        onSuccess: typeof onSuccess, 
        onError: typeof onError 
      });
      
      try {
        // Validate required fields
        if (!data.title?.trim() || !data.dueDate || !data.duration) {
          console.error('Validation failed - missing required fields:', {
            title: data.title,
            dueDate: data.dueDate,
            duration: data.duration
          });
          throw new Error('Please fill in all required fields');
        }
        
        // Clean and validate data
        const cleanData = {
          title: data.title.trim(),
          dueDate: data.dueDate,
          duration: parseInt(data.duration),
          tag: data.tag?.trim() || 'General',
          mode: data.mode || 'add'
        };
        
        console.log('Clean data prepared:', cleanData);
        
        if (isNaN(cleanData.duration) || cleanData.duration <= 0) {
          console.error('Duration validation failed:', cleanData.duration);
          throw new Error('Duration must be a positive number');
        }
        
        console.log('About to add task to state...');
        
        // Add task using state management
        const addedTask = this.state.addTask(cleanData);
        console.log('Task successfully added to state:', addedTask);
        
        // Show success message
        if (this.toastManager) {
          this.toastManager.show('Task added successfully', 'success');
          console.log('Success toast shown');
        }
        
        // Call success callback to close modal
        if (onSuccess) {
          console.log('Calling onSuccess callback...');
          onSuccess();
        } else {
          console.warn('No onSuccess callback provided');
        }
        
        // Clear callbacks
        if (this.modalManager._currentSubmissionCallbacks) {
          delete this.modalManager._currentSubmissionCallbacks;
        }
        
        console.log('=== TASK SUBMISSION COMPLETED SUCCESSFULLY ===');
      } catch (error) {
        console.error('=== TASK SUBMISSION FAILED ===');
        console.error('Error details:', error);
        
        if (this.toastManager) {
          this.toastManager.show(error.message || 'Failed to save task', 'error');
        }
        
        if (onError) {
          console.log('Calling onError callback...');
          onError(error);
        } else {
          console.warn('No onError callback provided');
        }
        
        // Clear callbacks
        if (this.modalManager._currentSubmissionCallbacks) {
          delete this.modalManager._currentSubmissionCallbacks;
        }
      }
    });
  }

  /**
   * Set up route handlers
   */
  setupRoutes = () => {
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
  };

  /**
   * Handle route changes
   */
  handleRouteChange = (page, routeInfo) => {
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
  };

  /**
   * Wait for state initialization to complete
   */
  waitForStateInitialization = async () => {
    return new Promise((resolve) => {
      if (this.state.isReady()) {
        resolve();
        return;
      }

      const unsubscribe = this.state.subscribe((changes) => {
        if (changes.type === 'STATE_INITIALIZED') {
          unsubscribe();
          resolve();
        }
      });

      // Fallback timeout
      setTimeout(() => {
        unsubscribe();
        resolve();
      }, 5000);
    });
  };

  /**
   * Navigate to a specific page using the router
   */
  navigateToPage = (page) => {
    if (this.router) {
      this.router.navigate(page);
    }
  };

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu = () => {
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
  closeMobileMenu = () => {
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
  };

  /**
   * Set up focus trap for mobile menu
   */
  setupMobileMenuFocusTrap = (menuElement) => {
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
  getStatus = () => {
    return {
      initialized: this.initialized,
      modules: Object.keys(this.modules),
      timestamp: new Date().toISOString()
    };
  };
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
  
  // Make app available globally for debugging
  window.app = app;
  
  // Add debugging functions
  window.debugTask = {
    checkLocalStorage: () => {
      const data = localStorage.getItem('campusLifePlannerState');
      console.log('localStorage data:', data ? JSON.parse(data) : 'No data');
      return data ? JSON.parse(data) : null;
    },
    addTestTask: () => {
      const testTask = {
        title: 'Test Task',
        dueDate: '2024-12-25',
        duration: 60,
        tag: 'Test'
      };
      console.log('Adding test task:', testTask);
      const result = app.state.addTask(testTask);
      console.log('Test task added:', result);
      return result;
    },
    getTasks: () => {
      const tasks = app.state.getTasks();
      console.log('Current tasks:', tasks);
      return tasks;
    },
    clearStorage: () => {
      localStorage.removeItem('campusLifePlannerState');
      console.log('localStorage cleared');
    }
  };
});