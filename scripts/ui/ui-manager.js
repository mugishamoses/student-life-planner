/**
 * Modular UIManager - Main UI orchestrator
 * Coordinates page rendering, component updates, and event handling
 */

import { FocusManager } from './focus-manager.js';
import { AboutPage } from './pages/about-page.js';
import { DashboardPage } from './pages/dashboard-page.js';
import { TasksPage } from './pages/tasks-page.js';
import { SettingsPage } from './pages/settings-page.js';

export class UIManager {
  constructor(state, router = null, eventManager = null, modalManager = null, toastManager = null) {
    this.state = state;
    this.router = router;
    this.eventManager = eventManager;
    this.modalManager = modalManager;
    this.toastManager = toastManager;
    this.currentPage = null;
    this.currentPageRenderer = null;
    
    // Initialize focus manager
    this.focusManager = new FocusManager();
    
    // Component cache for efficient updates
    this.componentCache = new Map();
    
    // Modal stack for managing multiple modals
    this.modalStack = [];
    
    // Initialize page renderers
    this.pageRenderers = {
      about: new AboutPage(state, eventManager),
      dashboard: new DashboardPage(state, eventManager),
      tasks: new TasksPage(state, eventManager),
      settings: new SettingsPage(state, eventManager)
    };
    
    // Initialize DOM references
    this.initializeDOMReferences();
    
    // Subscribe to state changes
    this.unsubscribe = this.state.subscribe(this.handleStateChange.bind(this));
  }

  /**
   * Initialize DOM element references
   */
  initializeDOMReferences() {
    this.elements = {
      mainContent: document.getElementById('main-content'),
      statusMessages: document.getElementById('status-messages'),
      errorMessages: document.getElementById('error-messages'),
      navLinks: document.querySelectorAll('.nav__link'),
      mobileMenuToggle: document.querySelector('[data-action="toggle-mobile-menu"]'),
      mobileMenuOverlay: document.querySelector('.mobile-menu-overlay')
    };
    
    // Ensure required elements exist
    if (!this.elements.mainContent) {
      throw new Error('Main content element not found');
    }
  }

  /**
   * Handle state changes from AppState
   */
  handleStateChange(changes, state) {
    switch (changes.type) {
      case 'UI_STATE_UPDATED':
        if (changes.uiState.currentPage !== changes.previousUIState.currentPage) {
          this.renderPage(changes.uiState.currentPage);
        }
        if (changes.uiState.modalOpen !== changes.previousUIState.modalOpen) {
          if (changes.uiState.modalOpen) {
            this.showModal(changes.uiState.modalOpen);
          } else {
            this.hideModal();
          }
        }
        if (changes.uiState.toastMessage !== changes.previousUIState.toastMessage) {
          if (changes.uiState.toastMessage) {
            this.showToast(changes.uiState.toastMessage);
          }
        }
        break;
      
      case 'TASK_ADDED':
      case 'TASK_UPDATED':
      case 'TASK_DELETED':
        // Update task-related components if on tasks page
        if (this.currentPage === 'tasks' && this.currentPageRenderer) {
          this.currentPageRenderer.updateComponents();
        }
        // Update dashboard if visible and announce progress changes
        if (this.currentPage === 'dashboard' && this.currentPageRenderer) {
          this.currentPageRenderer.updateComponents();
          // Announce progress updates for completed tasks
          if (changes.type === 'TASK_UPDATED' && changes.task.status === 'Complete') {
            this.announceProgressUpdate();
          }
        }
        break;
      
      case 'SETTINGS_UPDATED':
        // Re-render settings page if visible
        if (this.currentPage === 'settings') {
          this.renderPage(this.currentPage);
        }
        // Update dashboard progress if weekly target changed
        if (changes.settings.weeklyHourTarget !== changes.previousSettings.weeklyHourTarget) {
          if (this.currentPage === 'dashboard' && this.currentPageRenderer) {
            this.currentPageRenderer.updateComponents();
            this.announceProgressUpdate();
          }
        }
        break;
    }
  }

  /**
   * Render the main application
   */
  render() {
    const uiState = this.state.getUIState();
    this.renderPage(uiState.currentPage);
    this.updateNavigation(uiState.currentPage);
  }

  /**
   * Render a specific page
   */
  renderPage(pageName) {
    if (this.currentPage === pageName) {
      return; // Already on this page
    }

    // Cleanup previous page
    if (this.currentPageRenderer && this.currentPageRenderer.cleanup) {
      this.currentPageRenderer.cleanup();
    }

    this.currentPage = pageName;
    
    // Clear main content
    this.elements.mainContent.innerHTML = '';
    
    // Add loading state
    this.showLoadingState();
    
    // Render page content
    setTimeout(() => {
      try {
        const pageRenderer = this.pageRenderers[pageName];
        if (pageRenderer) {
          this.currentPageRenderer = pageRenderer;
          this.elements.mainContent.innerHTML = pageRenderer.render();
          pageRenderer.setupEventListeners();
        } else {
          this.renderNotFoundPage();
        }
        
        this.updateNavigation(pageName);
        this.announcePageChange(pageName);
      } catch (error) {
        console.error('Error rendering page:', error);
        this.renderErrorPage(error.message);
      }
    }, 100); // Small delay for smooth transition
  }

  /**
   * Show loading state
   */
  showLoadingState() {
    this.elements.mainContent.innerHTML = `
      <div class="container">
        <div class="loading-container" aria-live="polite">
          <div class="loading-spinner" aria-label="Loading page content"></div>
          <p>Loading...</p>
        </div>
      </div>
    `;
  }

  /**
   * Render error page
   */
  renderErrorPage(message) {
    const content = `
      <div class="container">
        <div class="error-page">
          <div class="error-page__icon">⚠️</div>
          <h1 class="error-page__title">Something went wrong</h1>
          <p class="error-page__message">${this.escapeHtml(message)}</p>
          <button class="btn btn--primary" onclick="location.reload()">
            Reload Page
          </button>
        </div>
      </div>
    `;
    
    this.elements.mainContent.innerHTML = content;
  }

  /**
   * Render 404 page
   */
  renderNotFoundPage() {
    const content = `
      <div class="container">
        <div class="error-page">
          <div class="error-page__icon">🔍</div>
          <h1 class="error-page__title">Page Not Found</h1>
          <p class="error-page__message">The page you're looking for doesn't exist.</p>
          <button class="btn btn--primary" data-action="navigate" data-page="about">
            Go to About Page
          </button>
        </div>
      </div>
    `;
    
    this.elements.mainContent.innerHTML = content;
    this.setupPageEventListeners();
  }

  /**
   * Show modal using the modal manager
   */
  showModal(type, options = {}) {
    if (this.modalManager) {
      this.modalManager.show(type, options);
    }
  }

  /**
   * Hide current modal
   */
  hideModal() {
    if (this.modalManager) {
      this.modalManager.hide();
    }
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info', duration = 5000) {
    if (this.toastManager) {
      this.toastManager.show(message, type, duration);
    }
  }

  /**
   * Update navigation active state
   */
  updateNavigation(currentPage) {
    this.elements.navLinks.forEach(link => {
      const href = link.getAttribute('href');
      const isActive = href === `#${currentPage}`;
      
      if (isActive) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('nav__link--active');
      } else {
        link.removeAttribute('aria-current');
        link.classList.remove('nav__link--active');
      }
    });
  }

  /**
   * Announce page change to screen readers
   */
  announcePageChange(pageName) {
    const pageNames = {
      about: 'About page',
      dashboard: 'Dashboard page',
      tasks: 'Tasks page',
      settings: 'Settings page'
    };
    
    const announcement = `Navigated to ${pageNames[pageName] || pageName}`;
    this.elements.statusMessages.textContent = announcement;
  }

  /**
   * Announce progress updates for weekly tracking with appropriate ARIA live regions
   */
  announceProgressUpdate() {
    const tasks = this.state.getTasks();
    const settings = this.state.getSettings();
    const weeklyTarget = settings.weeklyHourTarget || 40;
    
    // Calculate current week progress
    const today = new Date();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);
    
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59, 999);
    
    const currentWeekCompletedHours = tasks
      .filter(task => {
        if (task.status !== 'Complete') return false;
        const completedDate = new Date(task.updatedAt || task.createdAt);
        return completedDate >= currentWeekStart && completedDate <= currentWeekEnd;
      })
      .reduce((sum, task) => sum + (task.duration || 0), 0) / 60;
    
    const isOverTarget = currentWeekCompletedHours > weeklyTarget;
    const remainingHours = Math.max(weeklyTarget - currentWeekCompletedHours, 0);
    
    if (isOverTarget) {
      // Use assertive announcement for over-target alerts
      const overHours = (currentWeekCompletedHours - weeklyTarget).toFixed(1);
      const message = `Alert: Weekly target exceeded by ${overHours} hours. Total completed: ${currentWeekCompletedHours.toFixed(1)} hours.`;
      this.announceError(message);
    } else if (currentWeekCompletedHours > 0) {
      // Use polite announcement for under-target progress
      const message = `Weekly progress updated. ${currentWeekCompletedHours.toFixed(1)} of ${weeklyTarget} hours completed. ${remainingHours.toFixed(1)} hours remaining.`;
      this.announceStatus(message);
    }
  }

  /**
   * Set up basic page event listeners (for error pages, etc.)
   */
  setupPageEventListeners() {
    // Navigation buttons
    document.querySelectorAll('[data-action="navigate"]').forEach(button => {
      button.addEventListener('click', (e) => {
        const page = e.target.dataset.page;
        if (page && this.eventManager) {
          this.eventManager.emit('navigate', { page });
        }
      });
    });
  }

  /**
   * Announce status message to screen readers
   */
  announceStatus(message) {
    const statusElement = this.elements.statusMessages;
    if (statusElement) {
      statusElement.textContent = message;
      setTimeout(() => {
        statusElement.textContent = '';
      }, 1000);
    }
  }

  /**
   * Announce error message to screen readers
   */
  announceError(message) {
    const errorElement = this.elements.errorMessages;
    if (errorElement) {
      errorElement.textContent = message;
      setTimeout(() => {
        errorElement.textContent = '';
      }, 3000);
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Handle bulk status change for selected tasks
   */
  handleBulkStatusChange(newStatus) {
    const uiState = this.state.getUIState();
    const selectedTaskIds = uiState.selectedTasks || [];
    
    if (selectedTaskIds.length === 0) {
      this.showToast('No tasks selected', 'warning');
      return;
    }

    try {
      selectedTaskIds.forEach(taskId => {
        this.state.updateTask(taskId, { status: newStatus });
      });
      
      this.showToast(
        `${selectedTaskIds.length} task${selectedTaskIds.length !== 1 ? 's' : ''} marked as ${newStatus.toLowerCase()}`,
        'success'
      );
      
      // Clear selection
      this.state.updateUIState({ selectedTasks: [] });
    } catch (error) {
      console.error('Error updating tasks:', error);
      this.showToast('Error updating tasks. Please try again.', 'error');
    }
  }

  /**
   * Update select all checkbox state
   */
  updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('select-all-tasks');
    if (selectAllCheckbox) {
      const tasks = this.state.getTasks();
      const uiState = this.state.getUIState();
      const selectedCount = (uiState.selectedTasks || []).length;
      
      if (selectedCount === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
      } else if (selectedCount === tasks.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
      } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
      }
    }
  }

  /**
   * Cleanup when UIManager is destroyed
   */
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    // Cleanup current page renderer
    if (this.currentPageRenderer && this.currentPageRenderer.cleanup) {
      this.currentPageRenderer.cleanup();
    }
    
    // Cleanup focus manager
    if (this.focusManager) {
      this.focusManager.destroy();
    }
    
    // Clean up any remaining modals
    this.modalStack.forEach(modal => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    });
    
    this.modalStack = [];
  }
}