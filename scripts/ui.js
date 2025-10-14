/**
 * UIManager - DOM manipulation and component rendering system
 * Handles efficient DOM updates, component rendering, and modal/toast management
 */

export class UIManager {
  constructor(state, router = null, eventManager = null, modalManager = null, toastManager = null) {
    this.state = state;
    this.router = router;
    this.eventManager = eventManager;
    this.modalManager = modalManager;
    this.toastManager = toastManager;
    this.currentPage = null;
    // Focus manager is now handled by modalManager
    
    // Component cache for efficient updates
    this.componentCache = new Map();
    
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
        // Re-render task-related components if on tasks page
        if (this.currentPage === 'tasks') {
          this.updateComponent('task-list');
          this.updateComponent('task-stats');
        }
        // Update dashboard if visible and announce progress changes
        if (this.currentPage === 'dashboard') {
          this.updateComponent('dashboard-stats');
          this.updateComponent('progress-chart');
          // Announce progress updates for completed tasks
          if (changes.type === 'TASK_UPDATED' && changes.task.status === 'Complete') {
            this.announceProgressUpdate();
          }
        }
        break;
      
      case 'SETTINGS_UPDATED':
        // Re-render settings page if visible
        if (this.currentPage === 'settings') {
          this.updateComponent('settings-form');
        }
        // Update dashboard progress if weekly target changed
        if (changes.settings.weeklyHourTarget !== changes.previousSettings.weeklyHourTarget) {
          if (this.currentPage === 'dashboard') {
            this.updateComponent('progress-chart');
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

    this.currentPage = pageName;
    
    // Clear main content
    this.elements.mainContent.innerHTML = '';
    
    // Add loading state
    this.showLoadingState();
    
    // Render page content
    setTimeout(() => {
      try {
        switch (pageName) {
          case 'about':
            this.renderAboutPage();
            break;
          case 'dashboard':
            this.renderDashboardPage();
            break;
          case 'tasks':
            this.renderTasksPage();
            break;
          case 'settings':
            this.renderSettingsPage();
            break;
          default:
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
   * Render About page
   */
  renderAboutPage() {
    const content = `
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">About Campus Life Planner</h1>
          <p class="page-description">
            Your personal academic task management system designed to help you stay organized and achieve your goals.
          </p>
        </div>
        
        <div class="grid grid--2-col">
          <div class="card">
            <div class="card__header">
              <h2 class="card__title">Purpose</h2>
            </div>
            <div class="card__body">
              <p>
                Campus Life Planner is designed specifically for students who need to manage their academic workload effectively. 
                Whether you're tracking assignments, planning study sessions, or monitoring your weekly progress, this tool 
                provides the structure and insights you need to succeed.
              </p>
              <ul class="feature-list">
                <li>Track academic tasks and assignments</li>
                <li>Set and monitor weekly time goals</li>
                <li>Organize tasks by categories and due dates</li>
                <li>Search and filter tasks efficiently</li>
                <li>Export and import your data</li>
              </ul>
            </div>
          </div>
          
          <div class="card">
            <div class="card__header">
              <h2 class="card__title">Contact Information</h2>
            </div>
            <div class="card__body">
              <div class="contact-info">
                <div class="contact-item">
                  <strong>Developer:</strong> Campus Life Planner Team
                </div>
                <div class="contact-item">
                  <strong>Version:</strong> 1.0.0
                </div>
                <div class="contact-item">
                  <strong>Technology:</strong> Vanilla HTML, CSS, JavaScript
                </div>
                <div class="contact-item">
                  <strong>Accessibility:</strong> WCAG AA Compliant
                </div>
              </div>
              
              <div class="mt-4">
                <h3>Keyboard Navigation</h3>
                <div class="keyboard-shortcuts">
                  <div class="shortcut-item">
                    <kbd>Tab</kbd> Navigate between elements
                  </div>
                  <div class="shortcut-item">
                    <kbd>Enter</kbd> Activate buttons and links
                  </div>
                  <div class="shortcut-item">
                    <kbd>Escape</kbd> Close modals and menus
                  </div>
                  <div class="shortcut-item">
                    <kbd>Space</kbd> Toggle checkboxes
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="card mt-6">
          <div class="card__header">
            <h2 class="card__title">Getting Started</h2>
          </div>
          <div class="card__body">
            <div class="steps">
              <div class="step">
                <div class="step__number">1</div>
                <div class="step__content">
                  <h3>Add Your First Task</h3>
                  <p>Navigate to the Tasks page and click "Add Task" to create your first academic task.</p>
                </div>
              </div>
              <div class="step">
                <div class="step__number">2</div>
                <div class="step__content">
                  <h3>Set Your Weekly Goal</h3>
                  <p>Go to Settings to configure your weekly hour target and time unit preferences.</p>
                </div>
              </div>
              <div class="step">
                <div class="step__number">3</div>
                <div class="step__content">
                  <h3>Track Your Progress</h3>
                  <p>Use the Dashboard to monitor your progress and see statistics about your tasks.</p>
                </div>
              </div>
            </div>
            
            <div class="action-buttons mt-4">
              <button class="btn btn--primary" data-action="navigate" data-page="tasks">
                Start Managing Tasks
              </button>
              <button class="btn btn--secondary" data-action="navigate" data-page="dashboard">
                View Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.elements.mainContent.innerHTML = content;
    this.setupPageEventListeners();
  }

  /**
   * Render Dashboard page with statistics and progress tracking
   */
  renderDashboardPage() {
    const tasks = this.state.getTasks();
    const settings = this.state.getSettings();
    
    // Calculate upcoming tasks for current week
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const upcomingTasks = tasks.filter(task => {
      const dueDate = new Date(task.dueDate);
      return dueDate >= weekStart && dueDate <= weekEnd && task.status === 'Pending';
    });
    
    const content = `
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">Dashboard</h1>
          <p class="page-description">
            Overview of your academic progress and task statistics.
          </p>
        </div>
        
        <div id="dashboard-stats" class="dashboard-stats">
          ${this.renderComponent('dashboard-stats')}
        </div>
        
        <div class="grid grid--2-col mt-6">
          <div class="card">
            <div class="card__header">
              <h2 class="card__title">Weekly Progress</h2>
            </div>
            <div class="card__body">
              <div id="progress-chart" class="progress-section">
                ${this.renderComponent('progress-chart')}
              </div>
            </div>
          </div>
          
          <div class="card">
            <div class="card__header">
              <h2 class="card__title">This Week's Tasks</h2>
            </div>
            <div class="card__body">
              ${upcomingTasks.length > 0 ? `
                <div class="upcoming-tasks">
                  ${upcomingTasks.slice(0, 5).map(task => `
                    <div class="upcoming-task">
                      <div class="upcoming-task__title">${this.escapeHtml(task.title)}</div>
                      <div class="upcoming-task__meta">
                        <span class="upcoming-task__date">${this.formatDate(task.dueDate)}</span>
                        <span class="upcoming-task__tag">${this.escapeHtml(task.tag || 'General')}</span>
                      </div>
                    </div>
                  `).join('')}
                  ${upcomingTasks.length > 5 ? `
                    <div class="upcoming-task upcoming-task--more">
                      <a href="#tasks" class="upcoming-task__link">
                        View ${upcomingTasks.length - 5} more tasks
                      </a>
                    </div>
                  ` : ''}
                </div>
              ` : `
                <div class="empty-state empty-state--small">
                  <p>No tasks due this week</p>
                  <button class="btn btn--sm btn--primary" data-action="navigate" data-page="tasks">
                    Add Task
                  </button>
                </div>
              `}
            </div>
          </div>
        </div>
        
        <div class="card mt-6">
          <div class="card__header">
            <h2 class="card__title">Quick Actions</h2>
          </div>
          <div class="card__body">
            <div class="quick-actions">
              <button class="btn btn--primary" data-action="add-task">
                Add New Task
              </button>
              <button class="btn btn--secondary" data-action="navigate" data-page="tasks">
                View All Tasks
              </button>
              <button class="btn btn--secondary" data-action="navigate" data-page="settings">
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.elements.mainContent.innerHTML = content;
    this.setupPageEventListeners();
  }

  /**
   * Render Tasks page with table/card view and management
   */
  renderTasksPage() {
    const tasks = this.state.getTasks();
    const uiState = this.state.getUIState();
    
    const content = `
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">Tasks</h1>
          <p class="page-description">
            Manage your academic tasks and assignments.
          </p>
        </div>
        
        <div class="tasks-toolbar">
          <div class="tasks-toolbar__primary">
            <button class="btn btn--primary" data-action="add-task">
              Add Task
            </button>
            <div class="view-toggle">
              <button 
                class="btn btn--sm ${uiState.viewMode !== 'card' ? 'btn--active' : 'btn--secondary'}" 
                data-action="set-view-mode" 
                data-view="table"
                aria-label="Table view"
              >
                Table
              </button>
              <button 
                class="btn btn--sm ${uiState.viewMode === 'card' ? 'btn--active' : 'btn--secondary'}" 
                data-action="set-view-mode" 
                data-view="card"
                aria-label="Card view"
              >
                Cards
              </button>
            </div>
          </div>
          
          <div class="tasks-toolbar__secondary">
            <div class="search-controls">
              <input 
                type="search" 
                id="task-search" 
                placeholder="Search tasks..." 
                class="search-input"
                aria-label="Search tasks"
                value="${uiState.searchQuery || ''}"
              >
              <button class="btn btn--sm btn--secondary" data-action="toggle-search-mode">
                ${uiState.searchMode === 'regex' ? 'Regex' : 'Text'}
              </button>
            </div>
            
            <div class="filter-controls">
              <select id="task-filter" class="form-select" aria-label="Filter tasks">
                <option value="all" ${uiState.filterBy === 'all' ? 'selected' : ''}>All Tasks</option>
                <option value="pending" ${uiState.filterBy === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="completed" ${uiState.filterBy === 'completed' ? 'selected' : ''}>Completed</option>
                <option value="today" ${uiState.filterBy === 'today' ? 'selected' : ''}>Due Today</option>
                <option value="week" ${uiState.filterBy === 'week' ? 'selected' : ''}>This Week</option>
                <option value="overdue" ${uiState.filterBy === 'overdue' ? 'selected' : ''}>Overdue</option>
              </select>
              
              <select id="task-sort" class="form-select" aria-label="Sort tasks">
                <option value="date-newest" ${uiState.sortBy === 'date-newest' ? 'selected' : ''}>Due Date (Newest)</option>
                <option value="date-oldest" ${uiState.sortBy === 'date-oldest' ? 'selected' : ''}>Due Date (Oldest)</option>
                <option value="title-asc" ${uiState.sortBy === 'title-asc' ? 'selected' : ''}>Title (A-Z)</option>
                <option value="title-desc" ${uiState.sortBy === 'title-desc' ? 'selected' : ''}>Title (Z-A)</option>
                <option value="duration-asc" ${uiState.sortBy === 'duration-asc' ? 'selected' : ''}>Duration (Low-High)</option>
                <option value="duration-desc" ${uiState.sortBy === 'duration-desc' ? 'selected' : ''}>Duration (High-Low)</option>
              </select>
            </div>
          </div>
        </div>
        
        ${tasks.length > 0 ? `
          <div class="tasks-summary">
            <span class="tasks-count">${tasks.length} task${tasks.length !== 1 ? 's' : ''}</span>
            <span class="tasks-completed">${tasks.filter(t => t.status === 'Complete').length} completed</span>
          </div>
        ` : ''}
        
        <div id="task-list" class="task-list mt-4">
          ${this.renderComponent('task-list')}
        </div>
      </div>
    `;
    
    this.elements.mainContent.innerHTML = content;
    this.setupTasksPageEventListeners();
  }

  /**
   * Render Settings page with preferences and import/export
   */
  renderSettingsPage() {
    const settings = this.state.getSettings();
    const tasks = this.state.getTasks();
    
    const content = `
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">Settings</h1>
          <p class="page-description">
            Configure your preferences and manage your data.
          </p>
        </div>
        
        <div class="settings-grid">
          <div class="card">
            <div class="card__header">
              <h2 class="card__title">Time Preferences</h2>
            </div>
            <div class="card__body">
              <form class="settings-form" data-form="time-settings">
                <div class="form-group">
                  <label for="time-unit" class="form-label">Time Unit Display</label>
                  <select id="time-unit" name="timeUnit" class="form-select" data-setting="timeUnit">
                    <option value="minutes" ${settings.timeUnit === 'minutes' ? 'selected' : ''}>Minutes only</option>
                    <option value="hours" ${settings.timeUnit === 'hours' ? 'selected' : ''}>Hours only</option>
                    <option value="both" ${settings.timeUnit === 'both' ? 'selected' : ''}>Both (recommended)</option>
                  </select>
                  <div class="form-help">Choose how task durations are displayed</div>
                </div>
                
                <div class="form-group">
                  <label for="weekly-target" class="form-label">Weekly Hour Target</label>
                  <input 
                    type="number" 
                    id="weekly-target" 
                    name="weeklyHourTarget"
                    class="form-input" 
                    value="${settings.weeklyHourTarget}" 
                    min="1" 
                    max="168"
                    data-setting="weeklyHourTarget"
                  >
                  <div class="form-help">Set your weekly study/work hour goal</div>
                </div>
                
                <div class="form-group">
                  <label for="default-tag" class="form-label">Default Category</label>
                  <input 
                    type="text" 
                    id="default-tag" 
                    name="defaultTag"
                    class="form-input" 
                    value="${settings.defaultTag}" 
                    data-setting="defaultTag"
                  >
                  <div class="form-help">Default category for new tasks</div>
                </div>
                
                <div class="form-group">
                  <label class="form-label">
                    <input 
                      type="checkbox" 
                      name="searchCaseSensitive"
                      ${settings.searchCaseSensitive ? 'checked' : ''}
                      data-setting="searchCaseSensitive"
                    >
                    Case-sensitive search by default
                  </label>
                </div>
              </form>
            </div>
          </div>
          
          <div class="card">
            <div class="card__header">
              <h2 class="card__title">Data Management</h2>
            </div>
            <div class="card__body">
              <div class="data-stats">
                <div class="stat-item">
                  <span class="stat-label">Total Tasks:</span>
                  <span class="stat-value">${tasks.length}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Completed:</span>
                  <span class="stat-value">${tasks.filter(t => t.status === 'Complete').length}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Total Hours:</span>
                  <span class="stat-value">${(tasks.reduce((sum, t) => sum + (t.duration || 0), 0) / 60).toFixed(1)}h</span>
                </div>
              </div>
              
              <div class="button-group mt-4">
                <button class="btn btn--secondary" data-action="export-data">
                  📤 Export All Data
                </button>
                <button class="btn btn--secondary" data-action="export-settings">
                  ⚙️ Export Settings Only
                </button>
                <label class="btn btn--secondary" for="import-file">
                  📥 Import Data
                  <input 
                    type="file" 
                    id="import-file" 
                    accept=".json"
                    style="display: none;"
                    data-action="import-file"
                  >
                </label>
              </div>
              
              <div class="import-options mt-3">
                <details class="import-details">
                  <summary class="import-summary">Import Options</summary>
                  <div class="import-controls">
                    <div class="form-group">
                      <label class="form-label">
                        <input type="radio" name="import-mode" value="merge" checked>
                        Merge with existing data (recommended)
                      </label>
                      <div class="form-help">Combines imported data with current data, avoiding duplicates</div>
                    </div>
                    <div class="form-group">
                      <label class="form-label">
                        <input type="radio" name="import-mode" value="replace">
                        Replace all data
                      </label>
                      <div class="form-help">Replaces all current data with imported data</div>
                    </div>
                    <div class="form-group">
                      <label class="form-label">
                        <input type="radio" name="import-mode" value="append">
                        Add to existing data
                      </label>
                      <div class="form-help">Adds imported data without removing existing data</div>
                    </div>
                    <div class="form-group">
                      <label class="form-label">
                        <input type="checkbox" name="include-settings" checked>
                        Include settings in import
                      </label>
                    </div>
                    <div class="form-group">
                      <label class="form-label">
                        <input type="checkbox" name="include-ui" checked>
                        Include UI preferences in import
                      </label>
                    </div>
                  </div>
                </details>
              </div>
              
              <div class="danger-zone mt-6">
                <h3 class="danger-zone__title">Danger Zone</h3>
                <p class="danger-zone__description">
                  These actions cannot be undone. Please be careful.
                </p>
                <button class="btn btn--danger" data-action="clear-data">
                  🗑️ Clear All Data
                </button>
              </div>
            </div>
          </div>
          
          <div class="card">
            <div class="card__header">
              <h2 class="card__title">About This Application</h2>
            </div>
            <div class="card__body">
              <div class="app-info">
                <div class="info-item">
                  <span class="info-label">Version:</span>
                  <span class="info-value">1.0.0</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Technology:</span>
                  <span class="info-value">Vanilla HTML, CSS, JavaScript</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Accessibility:</span>
                  <span class="info-value">WCAG AA Compliant</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Storage:</span>
                  <span class="info-value">Local Browser Storage</span>
                </div>
              </div>
              
              <div class="mt-4">
                <h4>Keyboard Shortcuts</h4>
                <div class="keyboard-shortcuts">
                  <div class="shortcut-item">
                    <kbd>Tab</kbd> Navigate between elements
                  </div>
                  <div class="shortcut-item">
                    <kbd>Enter</kbd> Activate buttons and links
                  </div>
                  <div class="shortcut-item">
                    <kbd>Escape</kbd> Close modals and menus
                  </div>
                  <div class="shortcut-item">
                    <kbd>Space</kbd> Toggle checkboxes
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.elements.mainContent.innerHTML = content;
    this.setupSettingsPageEventListeners();
  }

  /**
   * Filter tasks based on filter criteria
   */
  filterTasks(tasks, filterBy) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    switch (filterBy) {
      case 'pending':
        return tasks.filter(task => task.status === 'Pending');
      case 'completed':
        return tasks.filter(task => task.status === 'Complete');
      case 'today':
        return tasks.filter(task => {
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate.getTime() === today.getTime();
        });
      case 'week':
        return tasks.filter(task => {
          const dueDate = new Date(task.dueDate);
          return dueDate >= weekStart && dueDate <= weekEnd;
        });
      case 'overdue':
        return tasks.filter(task => {
          const dueDate = new Date(task.dueDate);
          return dueDate < today && task.status === 'Pending';
        });
      default:
        return tasks;
    }
  }

  /**
   * Sort tasks based on sort criteria
   */
  sortTasks(tasks, sortBy) {
    const sortedTasks = [...tasks];
    
    switch (sortBy) {
      case 'date-newest':
        return sortedTasks.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
      case 'date-oldest':
        return sortedTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      case 'title-asc':
        return sortedTasks.sort((a, b) => a.title.localeCompare(b.title));
      case 'title-desc':
        return sortedTasks.sort((a, b) => b.title.localeCompare(a.title));
      case 'duration-asc':
        return sortedTasks.sort((a, b) => (a.duration || 0) - (b.duration || 0));
      case 'duration-desc':
        return sortedTasks.sort((a, b) => (b.duration || 0) - (a.duration || 0));
      default:
        return sortedTasks;
    }
  }

  /**
   * Search tasks based on query and mode
   */
  searchTasks(tasks, query, mode) {
    if (!query || query.trim() === '') {
      return tasks;
    }

    try {
      let regex;
      if (mode === 'regex') {
        regex = new RegExp(query, 'i');
      } else {
        // Escape special regex characters for text search
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        regex = new RegExp(escapedQuery, 'i');
      }

      return tasks.filter(task => {
        return regex.test(task.title) || 
               regex.test(task.tag || '') ||
               regex.test(task.status || '');
      });
    } catch (error) {
      console.warn('Invalid search regex:', error);
      // Fall back to simple text search
      const lowerQuery = query.toLowerCase();
      return tasks.filter(task => {
        return task.title.toLowerCase().includes(lowerQuery) ||
               (task.tag || '').toLowerCase().includes(lowerQuery) ||
               (task.status || '').toLowerCase().includes(lowerQuery);
      });
    }
  }

  /**
   * Highlight search text in content
   */
  highlightSearchText(text, query, mode) {
    if (!query || query.trim() === '') {
      return text;
    }

    try {
      let regex;
      if (mode === 'regex') {
        regex = new RegExp(`(${query})`, 'gi');
      } else {
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        regex = new RegExp(`(${escapedQuery})`, 'gi');
      }

      return text.replace(regex, '<mark>$1</mark>');
    } catch (error) {
      return text;
    }
  }

  /**
   * Render component by name
   */
  renderComponent(componentName, props = {}) {
    switch (componentName) {
      case 'dashboard-stats':
        return this.renderDashboardStats(props);
      case 'progress-chart':
        return this.renderProgressChart(props);
      case 'task-list':
        return this.renderTaskList(props);
      case 'task-modal':
        return this.renderTaskModal(props);
      case 'settings-form':
        return this.renderSettingsForm(props);
      default:
        return `<div class="component-placeholder">Component "${componentName}" not implemented yet</div>`;
    }
  }

  /**
   * Update a specific component
   */
  updateComponent(componentName, props = {}) {
    const element = document.getElementById(componentName);
    if (element) {
      element.innerHTML = this.renderComponent(componentName, props);
    }
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
   * Render task modal for add/edit operations
   */
  renderTaskModal(props = {}) {
    const { task = null, mode = 'add' } = props;
    const isEdit = mode === 'edit' && task;
    const title = isEdit ? 'Edit Task' : 'Add New Task';
    
    // Get current date for default due date
    const today = new Date();
    const defaultDate = today.toISOString().split('T')[0];
    
    return `
      <div class="modal" id="task-modal" role="dialog" aria-labelledby="task-modal-title" aria-modal="true">
        <div class="modal__backdrop" data-action="close-modal"></div>
        <div class="modal__container">
          <div class="modal__header">
            <h2 id="task-modal-title" class="modal__title">${title}</h2>
            <button class="modal__close" data-action="close-modal" aria-label="Close dialog">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          
          <div class="modal__body">
            <form id="task-form" class="task-form" novalidate>
              <input type="hidden" name="taskId" value="${task?.id || ''}">
              <input type="hidden" name="mode" value="${mode}">
              
              <div class="form-group">
                <label for="task-title" class="form-label">
                  Task Title <span class="required" aria-label="required">*</span>
                </label>
                <input 
                  type="text" 
                  id="task-title" 
                  name="title"
                  class="form-input" 
                  value="${task?.title || ''}"
                  required
                  aria-describedby="task-title-help task-title-error"
                  aria-invalid="false"
                  autocomplete="off"
                >
                <div id="task-title-help" class="form-help">
                  Enter a descriptive title for your task (no leading/trailing spaces)
                </div>
                <div id="task-title-error" class="form-error" role="alert"></div>
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
                  value="${task?.dueDate || defaultDate}"
                  required
                  aria-describedby="task-due-date-help task-due-date-error"
                  aria-invalid="false"
                >
                <div id="task-due-date-help" class="form-help">
                  Select when this task is due
                </div>
                <div id="task-due-date-error" class="form-error" role="alert"></div>
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
                  value="${task?.duration || ''}"
                  min="0"
                  step="0.25"
                  required
                  aria-describedby="task-duration-help task-duration-error"
                  aria-invalid="false"
                >
                <div id="task-duration-help" class="form-help">
                  Estimated time to complete this task in minutes (e.g., 30, 120.5)
                </div>
                <div id="task-duration-error" class="form-error" role="alert"></div>
              </div>
              
              <div class="form-group">
                <label for="task-tag" class="form-label">
                  Category/Tag <span class="required" aria-label="required">*</span>
                </label>
                <input 
                  type="text" 
                  id="task-tag" 
                  name="tag"
                  class="form-input" 
                  value="${task?.tag || this.state.getSettings().defaultTag}"
                  required
                  aria-describedby="task-tag-help task-tag-error"
                  aria-invalid="false"
                  list="tag-suggestions"
                >
                <datalist id="tag-suggestions">
                  ${this.getTagSuggestions().map(tag => `<option value="${tag}"></option>`).join('')}
                </datalist>
                <div id="task-tag-help" class="form-help">
                  Category for organizing your tasks (letters, spaces, and hyphens only)
                </div>
                <div id="task-tag-error" class="form-error" role="alert"></div>
              </div>
              
              ${isEdit ? `
                <div class="form-group">
                  <label for="task-status" class="form-label">Status</label>
                  <select id="task-status" name="status" class="form-select">
                    <option value="Pending" ${task.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Complete" ${task.status === 'Complete' ? 'selected' : ''}>Complete</option>
                  </select>
                </div>
              ` : ''}
            </form>
          </div>
          
          <div class="modal__footer">
            <button type="button" class="btn btn--secondary" data-action="close-modal">
              Cancel
            </button>
            <button type="submit" form="task-form" class="btn btn--primary" id="task-submit-btn">
              ${isEdit ? 'Update Task' : 'Add Task'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get tag suggestions from existing tasks
   */
  getTagSuggestions() {
    const tasks = this.state.getTasks();
    const tags = new Set();
    
    tasks.forEach(task => {
      if (task.tag) {
        tags.add(task.tag);
      }
    });
    
    // Add some common academic tags
    const commonTags = ['Assignment', 'Study', 'Project', 'Exam', 'Reading', 'Research', 'Lab', 'Homework'];
    commonTags.forEach(tag => tags.add(tag));
    
    return Array.from(tags).sort();
  }

  /**
   * Show task modal for adding or editing
   */
  showTaskModal(task = null, mode = 'add') {
    const modalHtml = this.renderTaskModal({ task, mode });
    
    // Create modal element
    const modalElement = document.createElement('div');
    modalElement.innerHTML = modalHtml;
    const modal = modalElement.firstElementChild;
    
    // Add to DOM
    document.body.appendChild(modal);
    
    // Setup modal event listeners
    this.setupTaskModalEventListeners(modal, task, mode);
    
    // Focus management
    this.focusManager.pushFocus(modal.querySelector('#task-title'));
    this.focusManager.trapFocus(modal);
    
    // Update UI state
    this.state.updateUIState({ modalOpen: 'task-modal' });
    
    // Add to modal stack
    this.modalStack.push(modal);
    
    // Animate in
    requestAnimationFrame(() => {
      modal.classList.add('modal--active');
    });
  }

  /**
   * Setup event listeners for task modal
   */
  setupTaskModalEventListeners(modal, task, mode) {
    const form = modal.querySelector('#task-form');
    const submitBtn = modal.querySelector('#task-submit-btn');
    
    // Form validation on input
    const inputs = form.querySelectorAll('input[required], select[required]');
    inputs.forEach(input => {
      input.addEventListener('input', () => this.validateTaskField(input));
      input.addEventListener('blur', () => this.validateTaskField(input));
    });
    
    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleTaskFormSubmit(form, task, mode);
    });
    
    // Close modal handlers
    modal.querySelectorAll('[data-action="close-modal"]').forEach(btn => {
      btn.addEventListener('click', () => this.hideModal());
    });
    
    // Escape key handler
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.hideModal();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
  }

  /**
   * Validate individual task form field
   */
  validateTaskField(input) {
    const { validateField, validateDate } = this.getValidators();
    const fieldName = this.getFieldValidationName(input.name);
    const value = input.value.trim();
    
    let result;
    if (input.name === 'dueDate') {
      result = validateDate(value);
    } else {
      result = validateField(fieldName, value);
    }
    
    const errorElement = document.getElementById(`${input.id}-error`);
    
    if (result.isValid) {
      input.classList.remove('form-input--error');
      input.setAttribute('aria-invalid', 'false');
      if (errorElement) {
        errorElement.textContent = '';
        errorElement.setAttribute('aria-hidden', 'true');
      }
    } else {
      input.classList.add('form-input--error');
      input.setAttribute('aria-invalid', 'true');
      if (errorElement) {
        errorElement.textContent = result.error;
        errorElement.setAttribute('aria-hidden', 'false');
      }
    }
    
    return result.isValid;
  }

  /**
   * Get field name for validation
   */
  getFieldValidationName(inputName) {
    const fieldMap = {
      'title': 'title',
      'dueDate': 'date',
      'duration': 'duration',
      'tag': 'tag'
    };
    return fieldMap[inputName] || inputName;
  }

  /**
   * Get validators module
   */
  getValidators() {
    // This would normally be imported, but for now we'll implement basic validation
    return {
      validateField: (fieldName, value) => {
        const patterns = {
          title: /^\S(?:.*\S)?$/,
          duration: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
          tag: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/
        };
        
        if (!value || value.trim() === '') {
          return { isValid: false, error: 'This field is required' };
        }
        
        const pattern = patterns[fieldName];
        if (pattern && !pattern.test(value)) {
          const messages = {
            title: 'Title cannot have leading or trailing spaces',
            duration: 'Duration must be a positive number',
            tag: 'Tag can only contain letters, spaces, and hyphens'
          };
          return { isValid: false, error: messages[fieldName] || 'Invalid format' };
        }
        
        return { isValid: true, error: null };
      },
      validateDate: (dateString) => {
        if (!dateString) {
          return { isValid: false, error: 'Date is required' };
        }
        
        const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
        if (!dateRegex.test(dateString)) {
          return { isValid: false, error: 'Date must be in YYYY-MM-DD format' };
        }
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return { isValid: false, error: 'Invalid date' };
        }
        
        return { isValid: true, error: null };
      }
    };
  }

  /**
   * Handle task form submission
   */
  handleTaskFormSubmit(form, existingTask, mode) {
    const formData = new FormData(form);
    const taskData = {
      title: formData.get('title').trim(),
      dueDate: formData.get('dueDate'),
      duration: parseFloat(formData.get('duration')),
      tag: formData.get('tag').trim(),
      status: formData.get('status') || 'Pending'
    };
    
    // Validate all fields
    const isValid = this.validateTaskForm(form, taskData);
    if (!isValid) {
      this.announceError('Please correct the errors in the form');
      return;
    }
    
    try {
      if (mode === 'edit' && existingTask) {
        // Update existing task
        const updatedTask = this.state.updateTask(existingTask.id, taskData);
        this.announceStatus(`Task "${updatedTask.title}" updated successfully`);
        this.showToast('Task updated successfully', 'success');
      } else {
        // Add new task
        const newTask = this.state.addTask(taskData);
        this.announceStatus(`Task "${newTask.title}" added successfully`);
        this.showToast('Task added successfully', 'success');
      }
      
      this.hideModal();
    } catch (error) {
      console.error('Error saving task:', error);
      this.announceError('Failed to save task. Please try again.');
      this.showToast('Failed to save task', 'error');
    }
  }

  /**
   * Validate entire task form
   */
  validateTaskForm(form, taskData) {
    const inputs = form.querySelectorAll('input[required], select[required]');
    let isValid = true;
    
    inputs.forEach(input => {
      const fieldValid = this.validateTaskField(input);
      if (!fieldValid) {
        isValid = false;
      }
    });
    
    return isValid;
  }

  /**
   * Show delete confirmation modal
   */
  showDeleteConfirmation(task) {
    const modalHtml = `
      <div class="modal" id="delete-modal" role="dialog" aria-labelledby="delete-modal-title" aria-modal="true">
        <div class="modal__backdrop" data-action="close-modal"></div>
        <div class="modal__container modal__container--sm">
          <div class="modal__header">
            <h2 id="delete-modal-title" class="modal__title">Delete Task</h2>
            <button class="modal__close" data-action="close-modal" aria-label="Close dialog">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          
          <div class="modal__body">
            <p>Are you sure you want to delete this task?</p>
            <div class="task-preview">
              <strong>${this.escapeHtml(task.title)}</strong>
              <div class="task-preview__meta">
                Due: ${this.formatDate(task.dueDate)} | ${task.duration} min | ${this.escapeHtml(task.tag || 'General')}
              </div>
            </div>
            <p class="warning-text">This action cannot be undone.</p>
          </div>
          
          <div class="modal__footer">
            <button type="button" class="btn btn--secondary" data-action="close-modal">
              Cancel
            </button>
            <button type="button" class="btn btn--danger" data-action="confirm-delete" data-task-id="${task.id}">
              Delete Task
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Create and show modal
    const modalElement = document.createElement('div');
    modalElement.innerHTML = modalHtml;
    const modal = modalElement.firstElementChild;
    
    document.body.appendChild(modal);
    
    // Setup event listeners
    modal.querySelectorAll('[data-action="close-modal"]').forEach(btn => {
      btn.addEventListener('click', () => this.hideModal());
    });
    
    modal.querySelector('[data-action="confirm-delete"]').addEventListener('click', () => {
      this.deleteTask(task.id);
      this.hideModal();
    });
    
    // Focus management
    this.focusManager.pushFocus(modal.querySelector('.btn--danger'));
    this.focusManager.trapFocus(modal);
    
    // Update UI state and show modal
    this.state.updateUIState({ modalOpen: 'delete-modal' });
    this.modalStack.push(modal);
    
    requestAnimationFrame(() => {
      modal.classList.add('modal--active');
    });
  }

  /**
   * Delete a task
   */
  deleteTask(taskId) {
    try {
      const deletedTask = this.state.deleteTask(taskId);
      this.announceStatus(`Task "${deletedTask.title}" deleted successfully`);
      this.showToast('Task deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting task:', error);
      this.announceError('Failed to delete task. Please try again.');
      this.showToast('Failed to delete task', 'error');
    }
  }

  /**
   * Hide current modal
   */
  hideModal() {
    const currentModal = this.modalStack.pop();
    if (currentModal) {
      currentModal.classList.remove('modal--active');
      
      setTimeout(() => {
        if (currentModal.parentNode) {
          currentModal.parentNode.removeChild(currentModal);
        }
      }, 300); // Match CSS transition duration
      
      this.focusManager.popFocus();
    }
    
    this.state.updateUIState({ modalOpen: null });
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    
    toast.innerHTML = `
      <div class="toast__content">
        <span class="toast__message">${this.escapeHtml(message)}</span>
        <button class="toast__close" aria-label="Close notification">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    `;
    
    // Add to DOM
    document.body.appendChild(toast);
    
    // Setup close handler
    toast.querySelector('.toast__close').addEventListener('click', () => {
      this.hideToast(toast);
    });
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.hideToast(toast);
    }, 5000);
    
    // Animate in
    requestAnimationFrame(() => {
      toast.classList.add('toast--active');
    });
  }

  /**
   * Hide toast notification
   */
  hideToast(toast) {
    toast.classList.remove('toast--active');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  /**
   * Render dashboard statistics component
   */
  renderDashboardStats(props) {
    const tasks = this.state.getTasks();
    const settings = this.state.getSettings();
    
    // Calculate basic statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'Complete').length;
    const pendingTasks = tasks.filter(task => task.status === 'Pending').length;
    
    // Calculate total hours planned (all tasks)
    const totalHoursPlanned = tasks.reduce((sum, task) => sum + (task.duration || 0), 0) / 60;
    
    // Calculate completed hours
    const completedHours = tasks
      .filter(task => task.status === 'Complete')
      .reduce((sum, task) => sum + (task.duration || 0), 0) / 60;
    
    // Get most common tag (top tag)
    const tagCounts = {};
    tasks.forEach(task => {
      const tag = task.tag || 'General';
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
    
    let topTag = 'None';
    let maxCount = 0;
    Object.entries(tagCounts).forEach(([tag, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topTag = tag;
      }
    });
    
    // Calculate upcoming tasks for current week
    const today = new Date();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    currentWeekStart.setHours(0, 0, 0, 0);
    
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6); // End of week (Saturday)
    currentWeekEnd.setHours(23, 59, 59, 999);
    
    const upcomingThisWeek = tasks.filter(task => {
      if (task.status !== 'Pending') return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= currentWeekStart && dueDate <= currentWeekEnd;
    }).length;
    
    // Calculate overdue tasks
    const overdueTasks = tasks.filter(task => {
      if (task.status !== 'Pending') return false;
      const dueDate = new Date(task.dueDate);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      return dueDate < todayStart;
    }).length;
    
    return `
      <div class="stats-grid">
        <div class="stat-card stat-card--primary">
          <div class="stat-card__value">${totalTasks}</div>
          <div class="stat-card__label">Total Tasks</div>
          <div class="stat-card__detail">${pendingTasks} pending</div>
        </div>
        
        <div class="stat-card stat-card--success">
          <div class="stat-card__value">${totalHoursPlanned.toFixed(1)}h</div>
          <div class="stat-card__label">Total Hours Planned</div>
          <div class="stat-card__detail">${completedHours.toFixed(1)}h completed</div>
        </div>
        
        <div class="stat-card stat-card--info">
          <div class="stat-card__value">${this.escapeHtml(topTag)}</div>
          <div class="stat-card__label">Top Category</div>
          <div class="stat-card__detail">${maxCount} task${maxCount !== 1 ? 's' : ''}</div>
        </div>
        
        <div class="stat-card ${upcomingThisWeek > 0 ? 'stat-card--warning' : 'stat-card--neutral'}">
          <div class="stat-card__value">${upcomingThisWeek}</div>
          <div class="stat-card__label">This Week</div>
          <div class="stat-card__detail">
            ${overdueTasks > 0 ? `${overdueTasks} overdue` : 'On track'}
          </div>
        </div>
      </div>
      
      ${totalTasks > 0 ? `
        <div class="stats-summary mt-4">
          <div class="stats-summary__item">
            <span class="stats-summary__label">Completion Rate:</span>
            <span class="stats-summary__value">${((completedTasks / totalTasks) * 100).toFixed(1)}%</span>
          </div>
          <div class="stats-summary__item">
            <span class="stats-summary__label">Average Task Duration:</span>
            <span class="stats-summary__value">${(totalHoursPlanned / totalTasks).toFixed(1)}h</span>
          </div>
          ${overdueTasks > 0 ? `
            <div class="stats-summary__item stats-summary__item--warning">
              <span class="stats-summary__label">⚠️ Overdue Tasks:</span>
              <span class="stats-summary__value">${overdueTasks}</span>
            </div>
          ` : ''}
        </div>
      ` : ''}
    `;
  }

  /**
   * Render progress chart component with ARIA live regions
   */
  renderProgressChart(props) {
    const settings = this.state.getSettings();
    const weeklyTarget = settings.weeklyHourTarget || 40;
    const tasks = this.state.getTasks();
    
    // Calculate current week progress based on completed tasks in current week
    const today = new Date();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    currentWeekStart.setHours(0, 0, 0, 0);
    
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6); // End of week (Saturday)
    currentWeekEnd.setHours(23, 59, 59, 999);
    
    // Calculate hours from completed tasks in current week
    const currentWeekCompletedHours = tasks
      .filter(task => {
        if (task.status !== 'Complete') return false;
        const completedDate = new Date(task.updatedAt || task.createdAt);
        return completedDate >= currentWeekStart && completedDate <= currentWeekEnd;
      })
      .reduce((sum, task) => sum + (task.duration || 0), 0) / 60;
    
    // Calculate planned hours for current week (all tasks due this week)
    const currentWeekPlannedHours = tasks
      .filter(task => {
        const dueDate = new Date(task.dueDate);
        return dueDate >= currentWeekStart && dueDate <= currentWeekEnd;
      })
      .reduce((sum, task) => sum + (task.duration || 0), 0) / 60;
    
    const progressPercentage = Math.min((currentWeekCompletedHours / weeklyTarget) * 100, 100);
    const isOverTarget = currentWeekCompletedHours > weeklyTarget;
    const isUnderTarget = currentWeekCompletedHours < weeklyTarget && currentWeekCompletedHours > 0;
    const remainingHours = Math.max(weeklyTarget - currentWeekCompletedHours, 0);
    
    // Determine progress status for ARIA announcements
    let progressStatus = '';
    let ariaLive = 'polite';
    
    if (isOverTarget) {
      progressStatus = `Alert: You have exceeded your weekly target by ${(currentWeekCompletedHours - weeklyTarget).toFixed(1)} hours.`;
      ariaLive = 'assertive';
    } else if (isUnderTarget) {
      progressStatus = `You have completed ${currentWeekCompletedHours.toFixed(1)} hours of your ${weeklyTarget} hour weekly target. ${remainingHours.toFixed(1)} hours remaining.`;
    } else if (currentWeekCompletedHours === 0) {
      progressStatus = `Weekly target: ${weeklyTarget} hours. No hours completed yet this week.`;
    }
    
    // Get day of week for progress context
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = daysOfWeek[today.getDay()];
    const daysIntoWeek = today.getDay() + 1;
    const expectedHoursByNow = (weeklyTarget / 7) * daysIntoWeek;
    
    return `
      <div class="progress-card">
        <div class="progress-card__header">
          <h3 class="progress-card__title">Weekly Progress</h3>
          <div class="progress-card__period">
            Week of ${this.formatDate(currentWeekStart.toISOString().split('T')[0])}
          </div>
        </div>
        
        <!-- ARIA live region for progress announcements -->
        <div 
          id="progress-announcements" 
          aria-live="${ariaLive}" 
          aria-atomic="true" 
          class="sr-only"
        >
          ${progressStatus}
        </div>
        
        <div class="progress-visualization">
          <div class="progress-bar" role="progressbar" 
               aria-valuenow="${currentWeekCompletedHours.toFixed(1)}" 
               aria-valuemin="0" 
               aria-valuemax="${weeklyTarget}" 
               aria-label="Weekly progress: ${currentWeekCompletedHours.toFixed(1)} of ${weeklyTarget} hours">
            <div class="progress-bar__track">
              <div class="progress-bar__fill ${isOverTarget ? 'progress-bar__fill--over' : ''}" 
                   style="width: ${Math.min(progressPercentage, 100)}%">
              </div>
              ${isOverTarget ? `
                <div class="progress-bar__overflow" 
                     style="width: ${Math.min(((currentWeekCompletedHours - weeklyTarget) / weeklyTarget) * 100, 100)}%">
                </div>
              ` : ''}
            </div>
            
            <!-- Expected progress indicator -->
            <div class="progress-bar__expected" 
                 style="left: ${Math.min((expectedHoursByNow / weeklyTarget) * 100, 100)}%"
                 title="Expected progress by ${currentDay}">
            </div>
          </div>
          
          <div class="progress-legend">
            <div class="progress-legend__item">
              <span class="progress-legend__color progress-legend__color--completed"></span>
              <span class="progress-legend__label">Completed</span>
            </div>
            <div class="progress-legend__item">
              <span class="progress-legend__color progress-legend__color--expected"></span>
              <span class="progress-legend__label">Expected by ${currentDay}</span>
            </div>
            ${isOverTarget ? `
              <div class="progress-legend__item">
                <span class="progress-legend__color progress-legend__color--over"></span>
                <span class="progress-legend__label">Over target</span>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div class="progress-stats">
          <div class="progress-stat">
            <div class="progress-stat__value ${isOverTarget ? 'progress-stat__value--warning' : ''}">${currentWeekCompletedHours.toFixed(1)}h</div>
            <div class="progress-stat__label">Completed</div>
          </div>
          
          <div class="progress-stat">
            <div class="progress-stat__value">${weeklyTarget}h</div>
            <div class="progress-stat__label">Target</div>
          </div>
          
          <div class="progress-stat">
            <div class="progress-stat__value">${progressPercentage.toFixed(0)}%</div>
            <div class="progress-stat__label">Progress</div>
          </div>
          
          <div class="progress-stat">
            <div class="progress-stat__value ${remainingHours === 0 ? 'progress-stat__value--success' : ''}">${remainingHours.toFixed(1)}h</div>
            <div class="progress-stat__label">Remaining</div>
          </div>
        </div>
        
        ${currentWeekPlannedHours > 0 ? `
          <div class="progress-insights">
            <div class="progress-insight">
              <strong>This Week's Plan:</strong> ${currentWeekPlannedHours.toFixed(1)}h scheduled
            </div>
            ${expectedHoursByNow > 0 ? `
              <div class="progress-insight ${currentWeekCompletedHours < expectedHoursByNow ? 'progress-insight--warning' : 'progress-insight--success'}">
                <strong>Pace:</strong> 
                ${currentWeekCompletedHours >= expectedHoursByNow ? 'On track' : `${(expectedHoursByNow - currentWeekCompletedHours).toFixed(1)}h behind`}
                (expected ${expectedHoursByNow.toFixed(1)}h by ${currentDay})
              </div>
            ` : ''}
          </div>
        ` : ''}
        
        ${isOverTarget ? `
          <div class="progress-alert progress-alert--warning" role="alert">
            <strong>⚠️ Target Exceeded:</strong> 
            You've completed ${(currentWeekCompletedHours - weeklyTarget).toFixed(1)} hours over your weekly target. 
            Consider adjusting your target or taking a well-deserved break!
          </div>
        ` : ''}
        
        ${currentWeekCompletedHours === 0 && daysIntoWeek > 2 ? `
          <div class="progress-alert progress-alert--info" role="alert">
            <strong>💡 Getting Started:</strong> 
            It's ${currentDay} and you haven't logged any completed hours yet this week. 
            Consider completing some tasks to track your progress!
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Render task list component
   */
  renderTaskList(props) {
    const tasks = this.state.getTasks();
    const uiState = this.state.getUIState();
    
    if (tasks.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state__icon">📝</div>
          <h3 class="empty-state__title">No tasks yet</h3>
          <p class="empty-state__description">
            Add your first task to get started with managing your academic workload.
          </p>
          <button class="btn btn--primary" data-action="add-task">
            Add Your First Task
          </button>
        </div>
      `;
    }
    
    // Apply filtering and sorting
    let filteredTasks = this.filterTasks(tasks, uiState.filterBy);
    filteredTasks = this.sortTasks(filteredTasks, uiState.sortBy);
    
    // Apply search if there's a query
    if (uiState.searchQuery) {
      filteredTasks = this.searchTasks(filteredTasks, uiState.searchQuery, uiState.searchMode);
    }
    
    if (filteredTasks.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state__icon">🔍</div>
          <h3 class="empty-state__title">No tasks found</h3>
          <p class="empty-state__description">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      `;
    }
    
    return `
      <div class="task-table-container">
        <table class="task-table" role="table" aria-label="Tasks list">
          <thead>
            <tr>
              <th scope="col">
                <input type="checkbox" id="select-all-tasks" aria-label="Select all tasks">
              </th>
              <th scope="col">Task</th>
              <th scope="col">Due Date</th>
              <th scope="col">Duration</th>
              <th scope="col">Category</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTasks.map(task => `
              <tr class="task-row ${task.status === 'Complete' ? 'task-row--completed' : ''}" data-task-id="${task.id}">
                <td class="task-cell task-cell--checkbox">
                  <input 
                    type="checkbox" 
                    class="task-checkbox" 
                    data-task-id="${task.id}"
                    aria-label="Select task: ${this.escapeHtml(task.title)}"
                    ${uiState.selectedTasks.includes(task.id) ? 'checked' : ''}
                  >
                </td>
                <td class="task-cell task-cell--title">
                  <div class="task-title" data-action="edit-task-inline" data-task-id="${task.id}" tabindex="0" role="button" aria-label="Edit task title">
                    ${this.highlightSearchText(this.escapeHtml(task.title), uiState.searchQuery, uiState.searchMode)}
                  </div>
                </td>
                <td class="task-cell">
                  <time datetime="${task.dueDate}">${this.formatDate(task.dueDate)}</time>
                </td>
                <td class="task-cell">
                  ${this.formatDuration(task.duration)}
                </td>
                <td class="task-cell">
                  <span class="task-tag">${this.highlightSearchText(this.escapeHtml(task.tag || 'General'), uiState.searchQuery, uiState.searchMode)}</span>
                </td>
                <td class="task-cell task-cell--status">
                  <button 
                    class="status-toggle ${task.status === 'Complete' ? 'status-toggle--complete' : 'status-toggle--pending'}"
                    data-action="toggle-task-status"
                    data-task-id="${task.id}"
                    aria-label="Mark task as ${task.status === 'Complete' ? 'pending' : 'complete'}"
                  >
                    ${task.status === 'Complete' ? '✓ Complete' : '○ Pending'}
                  </button>
                </td>
                <td class="task-cell task-cell--actions">
                  <div class="task-actions">
                    <button 
                      class="btn btn--sm btn--secondary" 
                      data-action="edit-task"
                      data-task-id="${task.id}"
                      aria-label="Edit task"
                    >
                      Edit
                    </button>
                    <button 
                      class="btn btn--sm btn--danger" 
                      data-action="delete-task"
                      data-task-id="${task.id}"
                      aria-label="Delete task"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      ${uiState.selectedTasks.length > 0 ? `
        <div class="bulk-actions">
          <div class="bulk-actions__info">
            ${uiState.selectedTasks.length} task${uiState.selectedTasks.length !== 1 ? 's' : ''} selected
          </div>
          <div class="bulk-actions__buttons">
            <button class="btn btn--sm btn--secondary" data-action="bulk-complete">
              Mark Complete
            </button>
            <button class="btn btn--sm btn--secondary" data-action="bulk-pending">
              Mark Pending
            </button>
            <button class="btn btn--sm btn--danger" data-action="bulk-delete">
              Delete Selected
            </button>
          </div>
        </div>
      ` : ''}
    `;
  }

  /**
   * Render settings form component
   */
  renderSettingsForm(props) {
    const settings = this.state.getSettings();
    
    return `
      <div class="settings-sections">
        <div class="settings-section">
          <h2 class="settings-section__title">Time Preferences</h2>
          <div class="form-group">
            <label for="time-unit" class="form-label">Time Unit</label>
            <select id="time-unit" class="form-select" data-setting="timeUnit">
              <option value="minutes" ${settings.timeUnit === 'minutes' ? 'selected' : ''}>Minutes</option>
              <option value="hours" ${settings.timeUnit === 'hours' ? 'selected' : ''}>Hours</option>
              <option value="both" ${settings.timeUnit === 'both' ? 'selected' : ''}>Both</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="weekly-target" class="form-label">Weekly Hour Target</label>
            <input 
              type="number" 
              id="weekly-target" 
              class="form-input" 
              value="${settings.weeklyHourTarget}" 
              min="1" 
              max="168"
              data-setting="weeklyHourTarget"
            >
          </div>
        </div>
        
        <div class="settings-section">
          <h2 class="settings-section__title">Data Management</h2>
          <div class="button-group">
            <button class="btn btn--secondary" data-action="export-data">
              Export Data
            </button>
            <button class="btn btn--secondary" data-action="import-data">
              Import Data
            </button>
            <button class="btn btn--danger" data-action="clear-data">
              Clear All Data
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Show modal
   */
  showModal(modalName, props = {}) {
    const modalContent = this.getModalContent(modalName, props);
    
    const modalHTML = `
      <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal">
          <div class="modal__header">
            <h2 id="modal-title" class="modal__title">${modalContent.title}</h2>
            <button class="modal__close" data-action="close-modal" aria-label="Close modal">
              &times;
            </button>
          </div>
          <div class="modal__body">
            ${modalContent.body}
          </div>
          ${modalContent.footer ? `
            <div class="modal__footer">
              ${modalContent.footer}
            </div>
          ` : ''}
        </div>
      </div>
    `;
    
    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Set up focus management
    const modal = document.querySelector('.modal-overlay');
    const modalDialog = modal.querySelector('.modal');
    
    // Trap focus within modal
    this.focusManager.trapFocus(modalDialog);
    
    // Focus first focusable element (usually first input or close button)
    const firstFocusable = modalDialog.querySelector('input, select, textarea, button');
    if (firstFocusable) {
      this.focusManager.pushFocus(firstFocusable);
    } else {
      this.focusManager.pushFocus(modal.querySelector('.modal__close'));
    }
    
    // Add to modal stack
    this.modalStack.push({ name: modalName, element: modal });
    
    // Set up event listeners
    this.setupModalEventListeners();
    
    // Announce modal opening to screen readers
    this.focusManager.announce(`${modalContent.title} dialog opened`, 'polite');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  /**
   * Hide modal
   */
  hideModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
      // Remove focus trap
      this.focusManager.removeFocusTrap(modal.querySelector('.modal'));
      
      // Restore focus
      this.focusManager.popFocus();
      
      // Remove modal from DOM
      modal.remove();
      
      // Remove from modal stack
      const modalInfo = this.modalStack.pop();
      
      // Restore body scroll
      if (this.modalStack.length === 0) {
        document.body.style.overflow = '';
      }
      
      // Announce modal closing to screen readers
      if (modalInfo) {
        this.focusManager.announce(`${modalInfo.name} dialog closed`, 'polite');
      }
    }
  }

  /**
   * Get modal content by name
   */
  getModalContent(modalName, props = {}) {
    switch (modalName) {
      case 'add-task':
        return {
          title: 'Add New Task',
          body: this.renderTaskForm(),
          footer: `
            <button class="btn btn--secondary" data-action="close-modal">Cancel</button>
            <button class="btn btn--primary" data-action="save-task">Add Task</button>
          `
        };
      
      case 'edit-task':
        return {
          title: 'Edit Task',
          body: this.renderTaskForm(props.task),
          footer: `
            <button class="btn btn--secondary" data-action="close-modal">Cancel</button>
            <button class="btn btn--primary" data-action="update-task">Update Task</button>
          `
        };
      
      case 'confirm-delete':
        return {
          title: 'Confirm Delete',
          body: `<p>Are you sure you want to delete this task? This action cannot be undone.</p>`,
          footer: `
            <button class="btn btn--secondary" data-action="close-modal">Cancel</button>
            <button class="btn btn--danger" data-action="confirm-delete">Delete</button>
          `
        };
      
      case 'confirm-clear-data':
        return {
          title: 'Clear All Data',
          body: `
            <div class="warning-content">
              <div class="warning-icon">⚠️</div>
              <p><strong>This will permanently delete all your tasks and settings.</strong></p>
              <p>This action cannot be undone. Are you sure you want to continue?</p>
            </div>
          `,
          footer: `
            <button class="btn btn--secondary" data-action="close-modal">Cancel</button>
            <button class="btn btn--danger" data-action="confirm-clear-data">Clear All Data</button>
          `
        };
      
      default:
        return {
          title: 'Modal',
          body: '<p>Modal content not implemented</p>'
        };
    }
  }

  /**
   * Render task form
   */
  renderTaskForm(task = null) {
    const isEdit = !!task;
    
    return `
      <form class="task-form" data-form="task">
        <div class="form-group">
          <label for="task-title" class="form-label">Title <span class="required">*</span></label>
          <input 
            type="text" 
            id="task-title" 
            name="title" 
            class="form-input" 
            value="${task ? this.escapeHtml(task.title) : ''}"
            required
            aria-describedby="title-help"
          >
          <div id="title-help" class="form-help">Enter a descriptive title for your task</div>
        </div>
        
        <div class="form-group">
          <label for="task-due-date" class="form-label">Due Date <span class="required">*</span></label>
          <input 
            type="date" 
            id="task-due-date" 
            name="dueDate" 
            class="form-input" 
            value="${task ? task.dueDate : ''}"
            required
          >
        </div>
        
        <div class="form-group">
          <label for="task-duration" class="form-label">Duration (minutes)</label>
          <input 
            type="number" 
            id="task-duration" 
            name="duration" 
            class="form-input" 
            value="${task ? task.duration || '' : ''}"
            min="0"
            step="1"
          >
        </div>
        
        <div class="form-group">
          <label for="task-tag" class="form-label">Category</label>
          <input 
            type="text" 
            id="task-tag" 
            name="tag" 
            class="form-input" 
            value="${task ? this.escapeHtml(task.tag || '') : ''}"
            placeholder="e.g., Programming, Math, Reading"
          >
        </div>
        
        ${isEdit ? `
          <div class="form-group">
            <label for="task-status" class="form-label">Status</label>
            <select id="task-status" name="status" class="form-select">
              <option value="Pending" ${task.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Complete" ${task.status === 'Complete' ? 'selected' : ''}>Complete</option>
            </select>
          </div>
        ` : ''}
      </form>
    `;
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info', duration = 3000) {
    const toastId = `toast-${Date.now()}`;
    const toastHTML = `
      <div id="${toastId}" class="toast toast--${type}" role="alert" aria-live="polite">
        <div class="toast__content">
          <span class="toast__message">${this.escapeHtml(message)}</span>
          <button class="toast__close" data-action="close-toast" data-toast-id="${toastId}" aria-label="Close notification">
            &times;
          </button>
        </div>
      </div>
    `;
    
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
    
    // Add toast to container
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    // Auto-remove after duration
    setTimeout(() => {
      this.removeToast(toastId);
    }, duration);
    
    // Set up close button
    const closeButton = document.querySelector(`[data-toast-id="${toastId}"]`);
    if (closeButton) {
      closeButton.addEventListener('click', () => this.removeToast(toastId));
    }
  }

  /**
   * Remove toast notification
   */
  removeToast(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
      toast.remove();
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
   * Set up page-specific event listeners
   */
  setupPageEventListeners() {
    // Navigation buttons
    document.querySelectorAll('[data-action="navigate"]').forEach(button => {
      button.addEventListener('click', (e) => {
        const page = e.target.dataset.page;
        if (page) {
          this.state.updateUIState({ currentPage: page });
        }
      });
    });
    
    // Add task button
    document.querySelectorAll('[data-action="add-task"]').forEach(button => {
      button.addEventListener('click', () => {
        this.state.updateUIState({ modalOpen: 'add-task' });
      });
    });
    
    // Edit task buttons
    document.querySelectorAll('[data-action="edit-task"]').forEach(button => {
      button.addEventListener('click', (e) => {
        const taskId = e.target.dataset.taskId;
        const task = this.state.getTasks().find(t => t.id === taskId);
        if (task) {
          this.state.updateUIState({ modalOpen: 'edit-task', modalProps: { task } });
        }
      });
    });
    
    // Delete task buttons
    document.querySelectorAll('[data-action="delete-task"]').forEach(button => {
      button.addEventListener('click', (e) => {
        const taskId = e.target.dataset.taskId;
        const task = this.state.getTasks().find(t => t.id === taskId);
        if (task) {
          this.showModal('delete-task', { task });
        }
      });
    });

    // Toggle task status
    document.querySelectorAll('[data-action="toggle-task-status"]').forEach(button => {
      button.addEventListener('click', (e) => {
        const taskId = e.target.dataset.taskId;
        const task = this.state.getTasks().find(t => t.id === taskId);
        if (task) {
          const newStatus = task.status === 'Complete' ? 'Pending' : 'Complete';
          this.state.updateTask(taskId, { status: newStatus });
          this.showToast(`Task marked as ${newStatus.toLowerCase()}`, 'success');
        }
      });
    });

    // Task selection checkboxes
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const taskId = e.target.dataset.taskId;
        const uiState = this.state.getUIState();
        let selectedTasks = [...(uiState.selectedTasks || [])];
        
        if (e.target.checked) {
          if (!selectedTasks.includes(taskId)) {
            selectedTasks.push(taskId);
          }
        } else {
          selectedTasks = selectedTasks.filter(id => id !== taskId);
        }
        
        this.state.updateUIState({ selectedTasks });
        this.updateSelectAllCheckbox();
      });
    });

    // Select all checkbox
    const selectAllCheckbox = document.getElementById('select-all-tasks');
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', (e) => {
        const tasks = this.state.getTasks();
        const selectedTasks = e.target.checked ? tasks.map(t => t.id) : [];
        
        this.state.updateUIState({ selectedTasks });
        
        // Update individual checkboxes
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
          checkbox.checked = e.target.checked;
        });
      });
    }

    // Bulk actions
    document.querySelectorAll('[data-action="bulk-complete"]').forEach(button => {
      button.addEventListener('click', () => {
        this.handleBulkStatusChange('Complete');
      });
    });

    document.querySelectorAll('[data-action="bulk-pending"]').forEach(button => {
      button.addEventListener('click', () => {
        this.handleBulkStatusChange('Pending');
      });
    });

    document.querySelectorAll('[data-action="bulk-delete"]').forEach(button => {
      button.addEventListener('click', () => {
        const uiState = this.state.getUIState();
        const selectedTasks = this.state.getTasks().filter(t => 
          (uiState.selectedTasks || []).includes(t.id)
        );
        this.showModal('bulk-delete', { selectedTasks });
      });
    });

    // Inline editing
    document.querySelectorAll('[data-action="edit-task-inline"]').forEach(element => {
      element.addEventListener('click', (e) => {
        this.startInlineEdit(e.target, e.target.dataset.taskId);
      });
      
      element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.startInlineEdit(e.target, e.target.dataset.taskId);
        }
      });
    });

    // Modal action handlers
    document.addEventListener('click', (e) => {
      if (e.target.dataset.action === 'close-modal') {
        this.hideModal();
      } else if (e.target.dataset.action === 'confirm-delete-task') {
        this.handleDeleteTask(e.target.dataset.taskId);
      } else if (e.target.dataset.action === 'confirm-bulk-delete') {
        this.handleBulkDelete();
      }
    });
  }

  /**
   * Set up Tasks page specific event listeners
   */
  setupTasksPageEventListeners() {
    // Call base page event listeners
    this.setupPageEventListeners();
    
    // Search input
    const searchInput = document.getElementById('task-search');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.state.updateUIState({ searchQuery: e.target.value });
        }, 300); // Debounce search
      });
    }
    
    // Filter dropdown
    const filterSelect = document.getElementById('task-filter');
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        this.state.updateUIState({ filterBy: e.target.value });
      });
    }
    
    // Sort dropdown
    const sortSelect = document.getElementById('task-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.state.updateUIState({ sortBy: e.target.value });
      });
    }
    
    // View mode toggle
    document.querySelectorAll('[data-action="set-view-mode"]').forEach(button => {
      button.addEventListener('click', (e) => {
        const viewMode = e.target.dataset.view;
        this.state.updateUIState({ viewMode });
      });
    });
    
    // Search mode toggle
    document.querySelectorAll('[data-action="toggle-search-mode"]').forEach(button => {
      button.addEventListener('click', () => {
        const currentMode = this.state.getUIState().searchMode;
        const newMode = currentMode === 'text' ? 'regex' : 'text';
        this.state.updateUIState({ searchMode: newMode });
        button.textContent = newMode === 'regex' ? 'Regex' : 'Text';
      });
    });
  }

  /**
   * Set up Settings page specific event listeners
   */
  setupSettingsPageEventListeners() {
    // Call base page event listeners
    this.setupPageEventListeners();
    
    // Settings form inputs
    document.querySelectorAll('[data-setting]').forEach(input => {
      const settingName = input.dataset.setting;
      
      const updateSetting = () => {
        let value = input.value;
        
        // Handle different input types
        if (input.type === 'checkbox') {
          value = input.checked;
        } else if (input.type === 'number') {
          value = parseInt(value, 10);
        }
        
        this.state.updateSettings({ [settingName]: value });
        this.showToast(`Setting "${settingName}" updated`, 'success');
      };
      
      if (input.type === 'checkbox') {
        input.addEventListener('change', updateSetting);
      } else {
        let timeout;
        input.addEventListener('input', () => {
          clearTimeout(timeout);
          timeout = setTimeout(updateSetting, 500); // Debounce
        });
      }
    });
    
    // Export data button
    document.querySelectorAll('[data-action="export-data"]').forEach(button => {
      button.addEventListener('click', () => {
        this.handleExportData();
      });
    });
    
    // Export settings button
    document.querySelectorAll('[data-action="export-settings"]').forEach(button => {
      button.addEventListener('click', () => {
        this.handleExportSettings();
      });
    });
    
    // Import file input
    document.querySelectorAll('[data-action="import-file"]').forEach(input => {
      input.addEventListener('change', (e) => {
        this.handleImportFile(e.target.files[0]);
      });
    });
    
    // Clear data button
    document.querySelectorAll('[data-action="clear-data"]').forEach(button => {
      button.addEventListener('click', () => {
        this.state.updateUIState({ 
          modalOpen: 'confirm-clear-data'
        });
      });
    });
  }

  /**
   * Set up modal event listeners
   */
  setupModalEventListeners() {
    const modal = document.querySelector('.modal-overlay');
    if (!modal) return;
    
    // Close modal on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.state.updateUIState({ modalOpen: null });
      }
    });
    
    // Close modal on close button click
    modal.querySelectorAll('[data-action="close-modal"]').forEach(button => {
      button.addEventListener('click', () => {
        this.state.updateUIState({ modalOpen: null });
      });
    });
    
    // Set up keyboard navigation for modal
    this.focusManager.setupKeyboardNavigation(modal, {
      arrowKeys: false, // Don't use arrow keys in modals
      enterActivation: true,
      spaceActivation: true
    });
    
    // Handle form submissions in modals
    const forms = modal.querySelectorAll('form');
    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleModalFormSubmit(form);
      });
      
      // Handle Enter key in form inputs
      form.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          this.handleModalFormSubmit(form);
        }
      });
    });
    
    // Handle modal action buttons
    modal.querySelectorAll('[data-action]').forEach(button => {
      if (button.dataset.action !== 'close-modal') {
        button.addEventListener('click', (e) => {
          this.handleModalAction(e.target.dataset.action, e.target);
        });
      }
    });
  }

  /**
   * Handle modal form submission
   */
  handleModalFormSubmit(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Validate form data
    const validation = this.validateFormData(data, form);
    if (!validation.isValid) {
      this.showFormErrors(form, validation.errors);
      return;
    }
    
    // Determine action based on form type
    const formType = form.dataset.form;
    switch (formType) {
      case 'task':
        this.handleTaskFormSubmit(data);
        break;
      default:
        console.warn('Unknown form type:', formType);
    }
  }

  /**
   * Handle modal actions
   */
  handleModalAction(action, button) {
    switch (action) {
      case 'save-task':
        const taskForm = document.querySelector('[data-form="task"]');
        if (taskForm) {
          this.handleModalFormSubmit(taskForm);
        }
        break;
      
      case 'update-task':
        const editForm = document.querySelector('[data-form="task"]');
        if (editForm) {
          this.handleModalFormSubmit(editForm);
        }
        break;
      
      case 'confirm-delete':
        const taskId = this.state.getUIState().modalProps?.taskId;
        if (taskId) {
          this.state.deleteTask(taskId);
          this.state.updateUIState({ modalOpen: null });
          this.showToast('Task deleted successfully', 'success');
        }
        break;
      
      case 'confirm-clear-data':
        this.state.reset();
        this.state.updateUIState({ modalOpen: null });
        this.showToast('All data cleared', 'success');
        this.renderPage(this.currentPage);
        break;
    }
  }

  /**
   * Handle task form submission
   */
  handleTaskFormSubmit(data) {
    try {
      // Convert duration to number
      if (data.duration) {
        data.duration = parseInt(data.duration, 10);
      }
      
      // Check if this is an edit or new task
      const modalProps = this.state.getUIState().modalProps;
      if (modalProps && modalProps.task) {
        // Update existing task
        this.state.updateTask(modalProps.task.id, data);
        this.showToast('Task updated successfully', 'success');
      } else {
        // Add new task
        this.state.addTask(data);
        this.showToast('Task added successfully', 'success');
      }
      
      // Close modal
      this.state.updateUIState({ modalOpen: null });
      
    } catch (error) {
      console.error('Error saving task:', error);
      this.showToast('Failed to save task', 'error');
    }
  }

  /**
   * Validate form data
   */
  validateFormData(data, form) {
    const errors = {};
    
    // Title validation
    if (!data.title || data.title.trim() === '') {
      errors.title = 'Title is required';
    }
    
    // Due date validation
    if (!data.dueDate) {
      errors.dueDate = 'Due date is required';
    }
    
    // Duration validation (if provided)
    if (data.duration && (isNaN(data.duration) || parseInt(data.duration) < 0)) {
      errors.duration = 'Duration must be a positive number';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Show form validation errors
   */
  showFormErrors(form, errors) {
    // Clear previous errors
    form.querySelectorAll('.form-error').forEach(error => error.remove());
    form.querySelectorAll('.form-input--error').forEach(input => {
      input.classList.remove('form-input--error');
    });
    
    // Show new errors
    Object.keys(errors).forEach(fieldName => {
      const field = form.querySelector(`[name="${fieldName}"]`);
      if (field) {
        field.classList.add('form-input--error');
        
        const errorElement = document.createElement('div');
        errorElement.className = 'form-error';
        errorElement.textContent = errors[fieldName];
        errorElement.setAttribute('role', 'alert');
        
        field.parentNode.appendChild(errorElement);
      }
    });
    
    // Focus first error field
    const firstErrorField = form.querySelector('.form-input--error');
    if (firstErrorField) {
      firstErrorField.focus();
    }
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
   * Utility methods
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDuration(minutes) {
    if (!minutes) return '—';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins}m`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${mins}m`;
    }
  }

  /**
   * Handle data export
   */
  handleExportData() {
    try {
      const exportData = this.state.storage?.exportData() || JSON.stringify({
        tasks: this.state.getTasks(),
        settings: this.state.getSettings(),
        exportDate: new Date().toISOString()
      }, null, 2);
      
      // Create download link
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `campus-life-planner-${new Date().toISOString().split('T')[0]}.json`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      this.showToast('Data exported successfully', 'success');
    } catch (error) {
      console.error('Export error:', error);
      this.showToast('Failed to export data', 'error');
    }
  }

  /**
   * Handle settings export
   */
  handleExportSettings() {
    try {
      const exportData = this.state.storage?.exportSettings() || JSON.stringify({
        settings: this.state.getSettings(),
        exportDate: new Date().toISOString(),
        type: 'settings'
      }, null, 2);
      
      // Create download link
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `campus-life-planner-settings-${new Date().toISOString().split('T')[0]}.json`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      this.showToast('Settings exported successfully', 'success');
    } catch (error) {
      console.error('Settings export error:', error);
      this.showToast('Failed to export settings', 'error');
    }
  }

  /**
   * Handle file import
   */
  handleImportFile(file) {
    if (!file) return;
    
    // Get import options from the UI
    const getImportOptions = () => {
      const importModeRadio = document.querySelector('input[name="import-mode"]:checked');
      const includeSettingsCheckbox = document.querySelector('input[name="include-settings"]');
      const includeUICheckbox = document.querySelector('input[name="include-ui"]');
      
      return {
        mergeMode: importModeRadio?.value || 'merge',
        includeSettings: includeSettingsCheckbox?.checked !== false,
        includeUI: includeUICheckbox?.checked !== false
      };
    };
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = e.target.result;
        const options = getImportOptions();
        
        const importResult = this.state.storage?.importData(jsonData, options) || this.handleBasicImport(jsonData);
        
        if (importResult.success) {
          this.showToast(importResult.message, 'success');
          // Refresh current page to show imported data
          this.renderPage(this.currentPage);
        } else {
          this.showToast('Import failed: ' + importResult.message, 'error');
        }
      } catch (error) {
        console.error('Import error:', error);
        this.showToast('Failed to import data: Invalid file format', 'error');
      }
    };
    
    reader.onerror = () => {
      this.showToast('Failed to read file', 'error');
    };
    
    reader.readAsText(file);
  }

  /**
   * Basic import handler (fallback)
   */
  handleBasicImport(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      const tasks = data.tasks || data.data?.tasks || [];
      const settings = data.settings || data.data?.settings || {};
      
      // Add imported tasks
      tasks.forEach(taskData => {
        this.state.addTask(taskData);
      });
      
      // Update settings
      if (Object.keys(settings).length > 0) {
        this.state.updateSettings(settings);
      }
      
      return {
        success: true,
        message: `Imported ${tasks.length} tasks`
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Cleanup method
   */
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

/**
 * Focus Management utility class for accessibility
 * Handles focus trapping, restoration, and keyboard navigation
 */
class FocusManager {
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

  /**
   * Show modal with specific content
   */
  showModal(modalName, props = {}) {
    const modalContent = this.renderModal(modalName, props);
    
    // Create modal container if it doesn't exist
    let modalContainer = document.getElementById('modal-container');
    if (!modalContainer) {
      modalContainer = document.createElement('div');
      modalContainer.id = 'modal-container';
      modalContainer.className = 'modal-overlay';
      document.body.appendChild(modalContainer);
    }
    
    modalContainer.innerHTML = modalContent;
    modalContainer.classList.add('modal-overlay--open');
    
    // Set up modal event listeners
    this.setupModalEventListeners(modalContainer);
    
    // Focus management
    const modal = modalContainer.querySelector('.modal');
    if (modal) {
      this.focusManager.pushFocus(modal);
      this.focusManager.trapFocus(modal);
      
      // Focus first focusable element
      const firstFocusable = modal.querySelector('input, select, textarea, button');
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
    
    // Add to modal stack
    this.modalStack.push(modalName);
  }

  /**
   * Hide current modal
   */
  hideModal() {
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) {
      modalContainer.classList.remove('modal-overlay--open');
      
      // Remove after animation
      setTimeout(() => {
        modalContainer.innerHTML = '';
      }, 300);
      
      // Restore focus
      this.focusManager.popFocus();
    }
    
    // Remove from modal stack
    this.modalStack.pop();
    
    // Update UI state
    this.state.updateUIState({ modalOpen: null });
  }

  /**
   * Render modal content based on modal name
   */
  renderModal(modalName, props = {}) {
    switch (modalName) {
      case 'add-task':
        return this.renderTaskModal('add', props);
      case 'edit-task':
        return this.renderTaskModal('edit', props);
      case 'delete-task':
        return this.renderDeleteTaskModal(props);
      case 'bulk-delete':
        return this.renderBulkDeleteModal(props);
      default:
        return this.renderGenericModal(modalName, props);
    }
  }

  /**
   * Render task add/edit modal
   */
  renderTaskModal(mode, props = {}) {
    const isEdit = mode === 'edit';
    const task = props.task || {};
    const settings = this.state.getSettings();
    
    return `
      <div class="modal" role="dialog" aria-labelledby="modal-title" aria-modal="true">
        <div class="modal__header">
          <h2 id="modal-title" class="modal__title">
            ${isEdit ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button 
            class="modal__close" 
            data-action="close-modal"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        <div class="modal__body">
          <form id="task-form" class="task-form" data-form="task" novalidate>
            <div class="form-group">
              <label for="task-title" class="form-label">
                Task Title <span class="required" aria-label="required">*</span>
              </label>
              <input 
                type="text" 
                id="task-title" 
                name="title"
                class="form-input" 
                value="${this.escapeHtml(task.title || '')}"
                required
                aria-describedby="task-title-help task-title-error"
                aria-invalid="false"
              >
              <div id="task-title-help" class="form-help">
                Enter a descriptive title for your task
              </div>
              <div id="task-title-error" class="form-error" role="alert"></div>
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
                value="${task.dueDate || ''}"
                required
                aria-describedby="task-due-date-help task-due-date-error"
                aria-invalid="false"
              >
              <div id="task-due-date-help" class="form-help">
                When is this task due?
              </div>
              <div id="task-due-date-error" class="form-error" role="alert"></div>
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
                value="${task.duration || ''}"
                min="0"
                step="0.25"
                required
                aria-describedby="task-duration-help task-duration-error"
                aria-invalid="false"
              >
              <div id="task-duration-help" class="form-help">
                How long will this task take? (e.g., 30, 60, 120.5)
              </div>
              <div id="task-duration-error" class="form-error" role="alert"></div>
            </div>
            
            <div class="form-group">
              <label for="task-tag" class="form-label">
                Category <span class="required" aria-label="required">*</span>
              </label>
              <input 
                type="text" 
                id="task-tag" 
                name="tag"
                class="form-input" 
                value="${this.escapeHtml(task.tag || settings.defaultTag || 'General')}"
                required
                aria-describedby="task-tag-help task-tag-error"
                aria-invalid="false"
              >
              <div id="task-tag-help" class="form-help">
                Category or subject (letters, spaces, and hyphens only)
              </div>
              <div id="task-tag-error" class="form-error" role="alert"></div>
            </div>
            
            ${isEdit ? `
              <div class="form-group">
                <label for="task-status" class="form-label">Status</label>
                <select id="task-status" name="status" class="form-select">
                  <option value="Pending" ${task.status === 'Pending' ? 'selected' : ''}>Pending</option>
                  <option value="Complete" ${task.status === 'Complete' ? 'selected' : ''}>Complete</option>
                </select>
              </div>
            ` : ''}
            
            <input type="hidden" name="id" value="${task.id || ''}">
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
            data-action="save-task"
          >
            ${isEdit ? 'Update Task' : 'Add Task'}
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render delete confirmation modal
   */
  renderDeleteTaskModal(props = {}) {
    const task = props.task || {};
    
    return `
      <div class="modal modal--small" role="dialog" aria-labelledby="modal-title" aria-modal="true">
        <div class="modal__header">
          <h2 id="modal-title" class="modal__title">Delete Task</h2>
          <button 
            class="modal__close" 
            data-action="close-modal"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        <div class="modal__body">
          <p>Are you sure you want to delete this task?</p>
          <div class="task-preview">
            <strong>${this.escapeHtml(task.title || 'Unknown Task')}</strong>
            <div class="task-preview__meta">
              Due: ${this.formatDate(task.dueDate)} • ${this.formatDuration(task.duration)}
            </div>
          </div>
          <p class="text-warning">This action cannot be undone.</p>
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
            type="button" 
            class="btn btn--danger"
            data-action="confirm-delete-task"
            data-task-id="${task.id}"
          >
            Delete Task
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render bulk delete confirmation modal
   */
  renderBulkDeleteModal(props = {}) {
    const selectedTasks = props.selectedTasks || [];
    
    return `
      <div class="modal modal--small" role="dialog" aria-labelledby="modal-title" aria-modal="true">
        <div class="modal__header">
          <h2 id="modal-title" class="modal__title">Delete Multiple Tasks</h2>
          <button 
            class="modal__close" 
            data-action="close-modal"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        <div class="modal__body">
          <p>Are you sure you want to delete ${selectedTasks.length} task${selectedTasks.length !== 1 ? 's' : ''}?</p>
          ${selectedTasks.length <= 5 ? `
            <div class="task-list-preview">
              ${selectedTasks.map(task => `
                <div class="task-preview">
                  <strong>${this.escapeHtml(task.title)}</strong>
                </div>
              `).join('')}
            </div>
          ` : `
            <p>Including: ${selectedTasks.slice(0, 3).map(t => t.title).join(', ')} and ${selectedTasks.length - 3} more...</p>
          `}
          <p class="text-warning">This action cannot be undone.</p>
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
            type="button" 
            class="btn btn--danger"
            data-action="confirm-bulk-delete"
          >
            Delete ${selectedTasks.length} Task${selectedTasks.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Setup modal event listeners
   */
  setupModalEventListeners(modalContainer) {
    // Close modal on overlay click
    modalContainer.addEventListener('click', (e) => {
      if (e.target === modalContainer) {
        this.hideModal();
      }
    });
    
    // Close modal on escape key
    modalContainer.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideModal();
      }
    });
    
    // Form validation for task form
    const taskForm = modalContainer.querySelector('#task-form');
    if (taskForm) {
      this.setupTaskFormValidation(taskForm);
    }
  }

  /**
   * Setup task form validation
   */
  setupTaskFormValidation(form) {
    const inputs = form.querySelectorAll('input[required], select[required]');
    
    inputs.forEach(input => {
      // Real-time validation on input
      input.addEventListener('input', () => {
        this.validateTaskField(input);
      });
      
      // Validation on blur
      input.addEventListener('blur', () => {
        this.validateTaskField(input);
      });
    });
    
    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleTaskFormSubmit(form);
    });
  }

  /**
   * Validate individual task form field
   */
  validateTaskField(input) {
    const fieldName = input.name === 'dueDate' ? 'date' : input.name;
    const value = input.value.trim();
    
    // Import validation function
    import('./validators.js').then(({ validateField }) => {
      const result = validateField(fieldName, value);
      
      const errorElement = document.getElementById(`${input.id}-error`);
      
      if (result.isValid) {
        input.classList.remove('form-input--error');
        input.setAttribute('aria-invalid', 'false');
        if (errorElement) {
          errorElement.textContent = '';
        }
      } else {
        input.classList.add('form-input--error');
        input.setAttribute('aria-invalid', 'true');
        if (errorElement) {
          errorElement.textContent = result.error;
        }
      }
    });
  }

  /**
   * Handle task form submission
   */
  handleTaskFormSubmit(form) {
    const formData = new FormData(form);
    const taskData = {
      title: formData.get('title').trim(),
      dueDate: formData.get('dueDate'),
      duration: parseFloat(formData.get('duration')),
      tag: formData.get('tag').trim(),
      status: formData.get('status') || 'Pending'
    };
    
    const taskId = formData.get('id');
    const isEdit = !!taskId;
    
    // Validate entire task
    import('./validators.js').then(({ validateTask }) => {
      const validation = validateTask({
        ...taskData,
        date: taskData.dueDate // Map dueDate to date for validation
      });
      
      if (validation.isValid) {
        try {
          if (isEdit) {
            this.state.updateTask(taskId, taskData);
            this.showToast('Task updated successfully', 'success');
          } else {
            this.state.addTask(taskData);
            this.showToast('Task added successfully', 'success');
          }
          
          this.hideModal();
        } catch (error) {
          console.error('Error saving task:', error);
          this.showToast('Error saving task. Please try again.', 'error');
        }
      } else {
        // Show validation errors
        Object.keys(validation.errors).forEach(fieldName => {
          const inputName = fieldName === 'date' ? 'dueDate' : fieldName;
          const input = form.querySelector(`[name="${inputName}"]`);
          const errorElement = document.getElementById(`${input.id}-error`);
          
          if (input && errorElement) {
            input.classList.add('form-input--error');
            input.setAttribute('aria-invalid', 'true');
            errorElement.textContent = validation.errors[fieldName];
          }
        });
        
        this.showToast('Please fix the validation errors', 'error');
      }
    });
  }  /*
*
   * Handle bulk status change
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
   * Handle single task deletion
   */
  handleDeleteTask(taskId) {
    try {
      const task = this.state.getTasks().find(t => t.id === taskId);
      this.state.deleteTask(taskId);
      this.showToast(`Task "${task?.title || 'Unknown'}" deleted`, 'success');
      this.hideModal();
    } catch (error) {
      console.error('Error deleting task:', error);
      this.showToast('Error deleting task. Please try again.', 'error');
    }
  }

  /**
   * Handle bulk task deletion
   */
  handleBulkDelete() {
    const uiState = this.state.getUIState();
    const selectedTaskIds = uiState.selectedTasks || [];
    
    try {
      selectedTaskIds.forEach(taskId => {
        this.state.deleteTask(taskId);
      });
      
      this.showToast(
        `${selectedTaskIds.length} task${selectedTaskIds.length !== 1 ? 's' : ''} deleted`,
        'success'
      );
      
      // Clear selection
      this.state.updateUIState({ selectedTasks: [] });
      this.hideModal();
    } catch (error) {
      console.error('Error deleting tasks:', error);
      this.showToast('Error deleting tasks. Please try again.', 'error');
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
   * Start inline editing for task title
   */
  startInlineEdit(element, taskId) {
    const task = this.state.getTasks().find(t => t.id === taskId);
    if (!task) return;

    const originalText = task.title;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalText;
    input.className = 'inline-edit-input';
    
    // Replace element with input
    element.style.display = 'none';
    element.parentNode.insertBefore(input, element.nextSibling);
    input.focus();
    input.select();

    const finishEdit = (save = false) => {
      const newValue = input.value.trim();
      
      if (save && newValue && newValue !== originalText) {
        // Validate the new title
        import('./validators.js').then(({ validateField }) => {
          const validation = validateField('title', newValue);
          
          if (validation.isValid) {
            try {
              this.state.updateTask(taskId, { title: newValue });
              element.textContent = newValue;
              this.showToast('Task title updated', 'success');
            } catch (error) {
              console.error('Error updating task:', error);
              this.showToast('Error updating task title', 'error');
            }
          } else {
            this.showToast(validation.error, 'error');
          }
        });
      }
      
      // Restore original element
      input.remove();
      element.style.display = '';
      element.focus();
    };

    // Handle input events
    input.addEventListener('blur', () => finishEdit(true));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        finishEdit(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        finishEdit(false);
      }
    });
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'toast-container';
      toastContainer.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <div class="toast__content">
        <span class="toast__message">${this.escapeHtml(message)}</span>
        <button class="toast__close" aria-label="Close notification">×</button>
      </div>
    `;

    // Add to container
    toastContainer.appendChild(toast);

    // Set up close button
    const closeButton = toast.querySelector('.toast__close');
    closeButton.addEventListener('click', () => {
      this.removeToast(toast);
    });

    // Auto-remove after delay
    setTimeout(() => {
      this.removeToast(toast);
    }, type === 'error' ? 5000 : 3000);

    // Animate in
    setTimeout(() => {
      toast.classList.add('toast--show');
    }, 10);

    // Update UI state
    this.state.updateUIState({ toastMessage: { message, type, timestamp: Date.now() } });
  }

  /**
   * Remove toast notification
   */
  removeToast(toast) {
    if (toast && toast.parentNode) {
      toast.classList.remove('toast--show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }
  }  
/**
   * Utility Methods
   */

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
   * Format date for display
   */
  formatDate(dateString) {
    if (!dateString) return 'No date';
    
    try {
      const date = new Date(dateString);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      
      // Reset time for comparison
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
      const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
      
      if (dateOnly.getTime() === todayOnly.getTime()) {
        return 'Today';
      } else if (dateOnly.getTime() === tomorrowOnly.getTime()) {
        return 'Tomorrow';
      } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
      }
    } catch (error) {
      return dateString;
    }
  }

  /**
   * Format duration for display
   */
  formatDuration(minutes) {
    if (!minutes || minutes === 0) return '0 min';
    
    const settings = this.state.getSettings();
    const timeUnit = settings.timeUnit || 'both';
    
    if (timeUnit === 'minutes') {
      return `${minutes} min`;
    } else if (timeUnit === 'hours') {
      const hours = (minutes / 60).toFixed(1);
      return `${hours}h`;
    } else { // both
      if (minutes < 60) {
        return `${minutes} min`;
      } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        if (remainingMinutes === 0) {
          return `${hours}h`;
        } else {
          return `${hours}h ${remainingMinutes}m`;
        }
      }
    }
  }

  /**
   * Announce message to screen readers
   */
  announceToScreenReader(message, priority = 'polite') {
    const elementId = priority === 'assertive' ? 'error-messages' : 'status-messages';
    const element = document.getElementById(elementId);
    
    if (element) {
      element.textContent = message;
      
      // Clear after a delay to allow for re-announcements
      setTimeout(() => {
        element.textContent = '';
      }, 1000);
    }
  }

  /**
   * Update navigation active state
   */
  updateNavigation(currentPage) {
    document.querySelectorAll('.nav__link').forEach(link => {
      const href = link.getAttribute('href');
      const page = href ? href.substring(1) : '';
      
      if (page === currentPage) {
        link.classList.add('nav__link--active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('nav__link--active');
        link.removeAttribute('aria-current');
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
    this.announceToScreenReader(announcement);
  }

  /**
   * Render error page
   */
  renderErrorPage(errorMessage) {
    const content = `
      <div class="container">
        <div class="card">
          <div class="card__header">
            <h1 class="card__title">Error</h1>
          </div>
          <div class="card__body">
            <p class="text-error">${this.escapeHtml(errorMessage)}</p>
            <button class="btn btn--primary" onclick="location.reload()">
              Reload Page
            </button>
          </div>
        </div>
      </div>
    `;
    
    this.elements.mainContent.innerHTML = content;
  }

  /**
   * Render not found page
   */
  renderNotFoundPage() {
    const content = `
      <div class="container">
        <div class="card">
          <div class="card__header">
            <h1 class="card__title">Page Not Found</h1>
          </div>
          <div class="card__body">
            <p>The page you're looking for doesn't exist.</p>
            <button class="btn btn--primary" data-action="navigate" data-page="about">
              Go to About Page
            </button>
          </div>
        </div>
      </div>
    `;
    
    this.elements.mainContent.innerHTML = content;
    this.setupPageEventListeners();
  }
}

/**
 * Dashboard page renderer
 */
class DashboardRenderer {
  constructor(state) {
    this.state = state;
  }

  render() {
    const tasks = this.state.getTasks();
    const stats = this.calculateStats(tasks);
    
    return `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-card__value">${stats.totalTasks}</div>
          <div class="stat-card__label">Total Tasks</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__value">${stats.completedTasks}</div>
          <div class="stat-card__label">Completed</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__value">${stats.totalHours.toFixed(1)}h</div>
          <div class="stat-card__label">Total Hours</div>
        </div>
        <div class="stat-card">
          <div class="stat-card__value">${stats.topTag}</div>
          <div class="stat-card__label">Top Category</div>
        </div>
      </div>
    `;
  }

  calculateStats(tasks) {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'Complete').length;
    const totalHours = tasks.reduce((sum, task) => sum + (task.duration || 0), 0) / 60;
    
    // Calculate top category
    const tagCounts = {};
    tasks.forEach(task => {
      const tag = task.tag || 'General';
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
    
    const topTag = Object.keys(tagCounts).reduce((a, b) => 
      tagCounts[a] > tagCounts[b] ? a : b, Object.keys(tagCounts)[0] || 'General');
    
    return {
      totalTasks,
      completedTasks,
      totalHours,
      topTag
    };
  }

  /**
   * Render progress chart component
   */
  renderProgressChart(props) {
    const tasks = this.state.getTasks();
    const settings = this.state.getSettings();
    const weeklyTarget = settings.weeklyHourTarget;
    
    // Calculate current week's progress
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const weekTasks = tasks.filter(task => {
      const dueDate = new Date(task.dueDate);
      return dueDate >= weekStart && dueDate <= weekEnd;
    });
    
    const weekHours = weekTasks.reduce((sum, task) => sum + (task.duration || 0), 0) / 60;
    const progressPercentage = Math.min((weekHours / weeklyTarget) * 100, 100);
    const isOverTarget = weekHours > weeklyTarget;
    
    return `
      <div class="progress-chart">
        <div class="progress-chart__header">
          <div class="progress-chart__title">Weekly Progress</div>
          <div class="progress-chart__values">
            <span class="progress-chart__current">${weekHours.toFixed(1)}h</span>
            <span class="progress-chart__separator">/</span>
            <span class="progress-chart__target">${weeklyTarget}h</span>
          </div>
        </div>
        
        <div class="progress-bar" role="progressbar" aria-valuenow="${weekHours}" aria-valuemin="0" aria-valuemax="${weeklyTarget}">
          <div class="progress-bar__fill ${isOverTarget ? 'progress-bar__fill--over' : ''}" style="width: ${progressPercentage}%"></div>
        </div>
        
        <div class="progress-chart__status">
          ${isOverTarget ? 
            `<span class="status-text status-text--warning" role="alert">Over target by ${(weekHours - weeklyTarget).toFixed(1)} hours</span>` :
            `<span class="status-text status-text--info">${(weeklyTarget - weekHours).toFixed(1)} hours remaining</span>`
          }
        </div>
      </div>
    `;
  }

  /**
   * Render task list component
   */
  renderTaskList(props) {
    const tasks = this.state.getTasks();
    const uiState = this.state.getUIState();
    
    if (tasks.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state__icon">📝</div>
          <h3 class="empty-state__title">No tasks yet</h3>
          <p class="empty-state__description">
            Get started by adding your first academic task or assignment.
          </p>
          <button class="btn btn--primary" data-action="add-task">
            Add Your First Task
          </button>
        </div>
      `;
    }
    
    // Filter and sort tasks
    let filteredTasks = this.filterTasks(tasks, uiState.filterBy);
    filteredTasks = this.searchTasks(filteredTasks, uiState.searchQuery, uiState.searchMode);
    filteredTasks = this.sortTasks(filteredTasks, uiState.sortBy);
    
    if (filteredTasks.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state__icon">🔍</div>
          <h3 class="empty-state__title">No tasks found</h3>
          <p class="empty-state__description">
            Try adjusting your search or filter criteria.
          </p>
          <button class="btn btn--secondary" data-action="clear-search">
            Clear Search
          </button>
        </div>
      `;
    }
    
    const viewMode = uiState.viewMode || 'table';
    
    const result = viewMode === 'card' 
      ? this.renderTaskCards(filteredTasks, uiState)
      : this.renderTaskTable(filteredTasks, uiState);
    
    // Update select all checkbox state after rendering
    setTimeout(() => this.updateSelectAllCheckbox(), 0);
    
    return result;
  }

  /**
   * Render tasks as cards (mobile-friendly)
   */
  renderTaskCards(tasks, uiState) {
    return `
      <div class="task-cards">
        ${tasks.map(task => this.renderTaskCard(task, uiState)).join('')}
      </div>
      
      ${(uiState.selectedTasks || []).length > 0 ? `
        <div class="bulk-actions">
          <div class="bulk-actions__info">
            ${uiState.selectedTasks.length} task${uiState.selectedTasks.length !== 1 ? 's' : ''} selected
          </div>
          <div class="bulk-actions__buttons">
            <button class="btn btn--sm btn--secondary" data-action="bulk-complete">
              Mark Complete
            </button>
            <button class="btn btn--sm btn--secondary" data-action="bulk-pending">
              Mark Pending
            </button>
            <button class="btn btn--sm btn--danger" data-action="bulk-delete">
              Delete Selected
            </button>
          </div>
        </div>
      ` : ''}
    `;
  }

  /**
   * Render individual task card
   */
  renderTaskCard(task, uiState) {
    const isOverdue = new Date(task.dueDate) < new Date() && task.status === 'Pending';
    const isDueToday = new Date(task.dueDate).toDateString() === new Date().toDateString();
    const isSelected = (uiState.selectedTasks || []).includes(task.id);
    
    return `
      <div class="task-card ${task.status === 'Complete' ? 'task-card--completed' : ''} ${isOverdue ? 'task-card--overdue' : ''} ${isSelected ? 'task-card--selected' : ''}" data-task-id="${task.id}">
        <div class="task-card__header">
          <div class="task-card__selection">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                class="task-checkbox"
                ${isSelected ? 'checked' : ''}
                data-task-id="${task.id}"
                aria-label="Select task: ${this.escapeHtml(task.title)}"
              >
              <span class="checkbox-custom"></span>
            </label>
          </div>
          <div class="task-card__status">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                class="task-status-toggle"
                ${task.status === 'Complete' ? 'checked' : ''}
                data-action="toggle-task-status"
                data-task-id="${task.id}"
                aria-label="Mark task as ${task.status === 'Complete' ? 'pending' : 'complete'}"
              >
              <span class="checkbox-custom"></span>
            </label>
          </div>
          <div class="task-card__actions">
            <button 
              class="btn btn--sm btn--secondary" 
              data-action="edit-task" 
              data-task-id="${task.id}"
              aria-label="Edit task: ${this.escapeHtml(task.title)}"
            >
              Edit
            </button>
            <button 
              class="btn btn--sm btn--danger" 
              data-action="delete-task" 
              data-task-id="${task.id}"
              aria-label="Delete task: ${this.escapeHtml(task.title)}"
            >
              Delete
            </button>
          </div>
        </div>
        
        <div class="task-card__body">
          <h3 class="task-card__title">
            ${this.highlightSearchText(this.escapeHtml(task.title), uiState.searchQuery, uiState.searchMode)}
          </h3>
          
          <div class="task-card__meta">
            <div class="task-card__meta-item">
              <span class="task-card__meta-label">Due:</span>
              <span class="task-card__meta-value ${isDueToday ? 'task-card__meta-value--highlight' : ''}">
                ${this.formatDate(task.dueDate)}
                ${isDueToday ? ' (Today)' : ''}
                ${isOverdue ? ' (Overdue)' : ''}
              </span>
            </div>
            
            <div class="task-card__meta-item">
              <span class="task-card__meta-label">Duration:</span>
              <span class="task-card__meta-value">${this.formatDuration(task.duration)}</span>
            </div>
            
            <div class="task-card__meta-item">
              <span class="task-card__meta-label">Category:</span>
              <span class="task-card__meta-value task-card__tag">
                ${this.highlightSearchText(this.escapeHtml(task.tag || 'General'), uiState.searchQuery, uiState.searchMode)}
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render tasks as table (desktop-friendly)
   */
  renderTaskTable(tasks, uiState) {
    const selectedTasks = uiState.selectedTasks || [];
    const allSelected = tasks.length > 0 && tasks.every(task => selectedTasks.includes(task.id));
    const someSelected = selectedTasks.length > 0 && !allSelected;
    
    return `
      <div class="task-table-container">
        <table class="task-table" role="table" aria-label="Tasks list">
          <thead>
            <tr>
              <th scope="col" class="task-table__header task-table__header--select">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    id="select-all-tasks"
                    ${allSelected ? 'checked' : ''}
                    ${someSelected ? 'data-indeterminate="true"' : ''}
                    aria-label="Select all tasks"
                  >
                  <span class="checkbox-custom"></span>
                </label>
              </th>
              <th scope="col" class="task-table__header task-table__header--status">
                <span class="sr-only">Status</span>
              </th>
              <th scope="col" class="task-table__header task-table__header--title">
                <button class="sort-button ${uiState.sortBy.startsWith('title') ? 'sort-button--active' : ''}" 
                        data-action="sort-tasks" data-sort="title-asc">
                  Title
                  <span class="sort-icon" aria-hidden="true">
                    ${uiState.sortBy === 'title-asc' ? '↑' : uiState.sortBy === 'title-desc' ? '↓' : '↕'}
                  </span>
                </button>
              </th>
              <th scope="col" class="task-table__header task-table__header--date">
                <button class="sort-button ${uiState.sortBy.startsWith('date') ? 'sort-button--active' : ''}" 
                        data-action="sort-tasks" data-sort="date-oldest">
                  Due Date
                  <span class="sort-icon" aria-hidden="true">
                    ${uiState.sortBy === 'date-oldest' ? '↑' : uiState.sortBy === 'date-newest' ? '↓' : '↕'}
                  </span>
                </button>
              </th>
              <th scope="col" class="task-table__header task-table__header--duration">
                <button class="sort-button ${uiState.sortBy.startsWith('duration') ? 'sort-button--active' : ''}" 
                        data-action="sort-tasks" data-sort="duration-asc">
                  Duration
                  <span class="sort-icon" aria-hidden="true">
                    ${uiState.sortBy === 'duration-asc' ? '↑' : uiState.sortBy === 'duration-desc' ? '↓' : '↕'}
                  </span>
                </button>
              </th>
              <th scope="col" class="task-table__header task-table__header--tag">Category</th>
              <th scope="col" class="task-table__header task-table__header--actions">
                <span class="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            ${tasks.map(task => this.renderTaskRow(task, uiState)).join('')}
          </tbody>
        </table>
      </div>
      
      ${selectedTasks.length > 0 ? `
        <div class="bulk-actions">
          <div class="bulk-actions__info">
            ${selectedTasks.length} task${selectedTasks.length !== 1 ? 's' : ''} selected
          </div>
          <div class="bulk-actions__buttons">
            <button class="btn btn--sm btn--secondary" data-action="bulk-complete">
              Mark Complete
            </button>
            <button class="btn btn--sm btn--secondary" data-action="bulk-pending">
              Mark Pending
            </button>
            <button class="btn btn--sm btn--danger" data-action="bulk-delete">
              Delete Selected
            </button>
          </div>
        </div>
      ` : ''}
    `;
  }

  /**
   * Render individual task table row
   */
  renderTaskRow(task, uiState) {
    const isOverdue = new Date(task.dueDate) < new Date() && task.status === 'Pending';
    const isDueToday = new Date(task.dueDate).toDateString() === new Date().toDateString();
    const isSelected = (uiState.selectedTasks || []).includes(task.id);
    
    return `
      <tr class="task-table__row ${task.status === 'Complete' ? 'task-table__row--completed' : ''} ${isOverdue ? 'task-table__row--overdue' : ''} ${isSelected ? 'task-table__row--selected' : ''}" 
          data-task-id="${task.id}">
        <td class="task-table__cell task-table__cell--select">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              class="task-checkbox"
              ${isSelected ? 'checked' : ''}
              data-task-id="${task.id}"
              aria-label="Select task: ${this.escapeHtml(task.title)}"
            >
            <span class="checkbox-custom"></span>
          </label>
        </td>
        
        <td class="task-table__cell task-table__cell--status">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              class="task-status-toggle"
              ${task.status === 'Complete' ? 'checked' : ''}
              data-action="toggle-task-status"
              data-task-id="${task.id}"
              aria-label="Mark task as ${task.status === 'Complete' ? 'pending' : 'complete'}"
            >
            <span class="checkbox-custom"></span>
          </label>
        </td>
        
        <td class="task-table__cell task-table__cell--title">
          <div class="task-title">
            ${this.highlightSearchText(this.escapeHtml(task.title), uiState.searchQuery, uiState.searchMode)}
          </div>
        </td>
        
        <td class="task-table__cell task-table__cell--date">
          <div class="task-date ${isDueToday ? 'task-date--today' : ''} ${isOverdue ? 'task-date--overdue' : ''}">
            ${this.formatDate(task.dueDate)}
            ${isDueToday ? '<span class="task-date__badge">Today</span>' : ''}
            ${isOverdue ? '<span class="task-date__badge task-date__badge--overdue">Overdue</span>' : ''}
          </div>
        </td>
        
        <td class="task-table__cell task-table__cell--duration">
          <div class="task-duration">
            ${this.formatDuration(task.duration)}
          </div>
        </td>
        
        <td class="task-table__cell task-table__cell--tag">
          <div class="task-tag">
            ${this.highlightSearchText(this.escapeHtml(task.tag || 'General'), uiState.searchQuery, uiState.searchMode)}
          </div>
        </td>
        
        <td class="task-table__cell task-table__cell--actions">
          <div class="task-actions">
            <button 
              class="btn btn--sm btn--secondary" 
              data-action="edit-task" 
              data-task-id="${task.id}"
              aria-label="Edit task: ${this.escapeHtml(task.title)}"
            >
              Edit
            </button>
            <button 
              class="btn btn--sm btn--danger" 
              data-action="delete-task" 
              data-task-id="${task.id}"
              aria-label="Delete task: ${this.escapeHtml(task.title)}"
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  /**
   * Update select all checkbox state
   */
  updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('select-all-tasks');
    if (!selectAllCheckbox) return;
    
    const tasks = this.state.getTasks();
    const uiState = this.state.getUIState();
    const selectedTasks = uiState.selectedTasks || [];
    
    if (selectedTasks.length === 0) {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
    } else if (selectedTasks.length === tasks.length) {
      selectAllCheckbox.checked = true;
      selectAllCheckbox.indeterminate = false;
    } else {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = true;
    }
  }

  /**
   * Setup event listeners for tasks page
   */
  setupTasksPageEventListeners() {
    this.setupPageEventListeners();
    
    // Search input
    const searchInput = document.getElementById('task-search');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.state.updateUIState({ searchQuery: e.target.value });
        }, 300); // Debounce search
      });
    }
    
    // Filter and sort controls
    const filterSelect = document.getElementById('task-filter');
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        this.state.updateUIState({ filterBy: e.target.value });
      });
    }
    
    const sortSelect = document.getElementById('task-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.state.updateUIState({ sortBy: e.target.value });
      });
    }
  }

  /**
   * Setup event listeners for settings page
   */
  setupSettingsPageEventListeners() {
    this.setupPageEventListeners();
    
    // Settings form inputs
    const settingsInputs = document.querySelectorAll('[data-setting]');
    settingsInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const settingName = e.target.dataset.setting;
        let value = e.target.value;
        
        // Handle different input types
        if (e.target.type === 'checkbox') {
          value = e.target.checked;
        } else if (e.target.type === 'number') {
          value = parseFloat(value) || 0;
        }
        
        // Update settings
        this.state.updateSettings({ [settingName]: value });
        this.showToast('Settings saved', 'success');
      });
    });
  }

  /**
   * Setup general page event listeners
   */
  setupPageEventListeners() {
    // Delegate event handling for dynamic content
    document.addEventListener('click', this.handlePageClick.bind(this));
    document.addEventListener('change', this.handlePageChange.bind(this));
  }

  /**
   * Handle click events on page elements
   */
  handlePageClick(e) {
    const action = e.target.dataset.action;
    const taskId = e.target.dataset.taskId;
    
    switch (action) {
      case 'add-task':
        e.preventDefault();
        this.showTaskModal();
        break;
        
      case 'edit-task':
        e.preventDefault();
        if (taskId) {
          const task = this.state.getTasks().find(t => t.id === taskId);
          if (task) {
            this.showTaskModal(task, 'edit');
          }
        }
        break;
        
      case 'delete-task':
        e.preventDefault();
        if (taskId) {
          const task = this.state.getTasks().find(t => t.id === taskId);
          if (task) {
            this.showDeleteConfirmation(task);
          }
        }
        break;
        
      case 'toggle-task-status':
        if (taskId) {
          const task = this.state.getTasks().find(t => t.id === taskId);
          if (task) {
            const newStatus = task.status === 'Complete' ? 'Pending' : 'Complete';
            this.state.updateTask(taskId, { status: newStatus });
            this.announceStatus(`Task marked as ${newStatus.toLowerCase()}`);
          }
        }
        break;
        
      case 'sort-tasks':
        e.preventDefault();
        const sortBy = e.target.dataset.sort;
        if (sortBy) {
          // Toggle sort direction if same field
          const currentSort = this.state.getUIState().sortBy;
          let newSort = sortBy;
          
          if (currentSort.startsWith(sortBy.split('-')[0])) {
            // Toggle direction
            newSort = currentSort.includes('asc') ? 
              currentSort.replace('asc', 'desc') : 
              currentSort.replace('desc', 'asc');
          }
          
          this.state.updateUIState({ sortBy: newSort });
        }
        break;
        
      case 'set-view-mode':
        e.preventDefault();
        const viewMode = e.target.dataset.view;
        if (viewMode) {
          this.state.updateUIState({ viewMode });
        }
        break;
        
      case 'toggle-search-mode':
        e.preventDefault();
        const currentMode = this.state.getUIState().searchMode;
        const newMode = currentMode === 'regex' ? 'text' : 'regex';
        this.state.updateUIState({ searchMode: newMode });
        e.target.textContent = newMode === 'regex' ? 'Regex' : 'Text';
        break;
        
      case 'clear-search':
        e.preventDefault();
        this.state.updateUIState({ searchQuery: '', filterBy: 'all' });
        const searchInput = document.getElementById('task-search');
        if (searchInput) {
          searchInput.value = '';
        }
        break;
        
      case 'navigate':
        e.preventDefault();
        const page = e.target.dataset.page;
        if (page) {
          this.state.updateUIState({ currentPage: page });
        }
        break;
        
      case 'export-data':
        e.preventDefault();
        this.exportData();
        break;
        
      case 'export-settings':
        e.preventDefault();
        this.exportSettings();
        break;
        
      case 'import-file':
        // Handle file input change
        if (e.target.files && e.target.files[0]) {
          this.importData(e.target.files[0]);
        }
        break;
        
      case 'clear-data':
        e.preventDefault();
        this.showClearDataConfirmation();
        break;
    }
  }

  /**
   * Handle change events on page elements
   */
  handlePageChange(e) {
    const action = e.target.dataset.action;
    
    if (action === 'toggle-task-status') {
      // Handle checkbox change for task status
      this.handlePageClick(e);
    }
  }

  /**
   * Format date for display
   */
  formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  }

  /**
   * Format duration for display
   */
  formatDuration(minutes) {
    if (!minutes || minutes === 0) return '0 min';
    
    const settings = this.state.getSettings();
    const timeUnit = settings.timeUnit;
    
    if (timeUnit === 'hours') {
      const hours = minutes / 60;
      return `${hours.toFixed(1)}h`;
    } else if (timeUnit === 'minutes') {
      return `${minutes} min`;
    } else {
      // Both
      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
      } else {
        return `${minutes} min`;
      }
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
      'about': 'About page',
      'dashboard': 'Dashboard page',
      'tasks': 'Tasks page',
      'settings': 'Settings page'
    };
    
    this.announceStatus(`Navigated to ${pageNames[pageName] || pageName}`);
  }

  /**
   * Render error page
   */
  renderErrorPage(errorMessage) {
    this.elements.mainContent.innerHTML = `
      <div class="container">
        <div class="error-page">
          <h1 class="error-page__title">Something went wrong</h1>
          <p class="error-page__message">${this.escapeHtml(errorMessage)}</p>
          <button class="btn btn--primary" onclick="location.reload()">
            Reload Page
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render not found page
   */
  renderNotFoundPage() {
    this.elements.mainContent.innerHTML = `
      <div class="container">
        <div class="error-page">
          <h1 class="error-page__title">Page Not Found</h1>
          <p class="error-page__message">The requested page could not be found.</p>
          <button class="btn btn--primary" data-action="navigate" data-page="about">
            Go to About Page
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Export data as JSON file
   */
  exportData() {
    try {
      const { storage } = this.state;
      const jsonData = storage.exportData();
      
      // Create and download file
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `campus-life-planner-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
      this.showToast('Data exported successfully', 'success');
      this.announceStatus('Data exported to file');
    } catch (error) {
      console.error('Export error:', error);
      this.showToast('Failed to export data', 'error');
      this.announceError('Failed to export data');
    }
  }

  /**
   * Export settings as JSON file
   */
  exportSettings() {
    try {
      const { storage } = this.state;
      const jsonData = storage.exportSettings();
      
      // Create and download file
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `campus-life-planner-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
      this.showToast('Settings exported successfully', 'success');
      this.announceStatus('Settings exported to file');
    } catch (error) {
      console.error('Settings export error:', error);
      this.showToast('Failed to export settings', 'error');
      this.announceError('Failed to export settings');
    }
  }

  /**
   * Import data from JSON file
   */
  importData(file) {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target.result;
        const { storage } = this.state;
        const result = storage.importData(jsonString);
        
        if (result.success) {
          // Reload state from storage
          this.state.loadFromStorage();
          
          this.showToast(result.message, 'success');
          this.announceStatus(`Imported ${result.importedTasks} tasks`);
          
          // Re-render current page to show imported data
          this.render();
        }
      } catch (error) {
        console.error('Import error:', error);
        this.showToast(error.message || 'Failed to import data', 'error');
        this.announceError('Failed to import data');
      }
    };
    
    reader.onerror = () => {
      this.showToast('Failed to read file', 'error');
      this.announceError('Failed to read file');
    };
    
    reader.readAsText(file);
  }

  /**
   * Show clear data confirmation
   */
  showClearDataConfirmation() {
    const modalHtml = `
      <div class="modal" id="clear-data-modal" role="dialog" aria-labelledby="clear-data-title" aria-modal="true">
        <div class="modal__backdrop" data-action="close-modal"></div>
        <div class="modal__container modal__container--sm">
          <div class="modal__header">
            <h2 id="clear-data-title" class="modal__title">Clear All Data</h2>
            <button class="modal__close" data-action="close-modal" aria-label="Close dialog">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          
          <div class="modal__body">
            <div class="warning-content">
              <div class="warning-icon">⚠️</div>
              <p><strong>This will permanently delete all your tasks and settings.</strong></p>
              <p>This action cannot be undone. A backup will be created automatically.</p>
              <p>Are you sure you want to continue?</p>
            </div>
          </div>
          
          <div class="modal__footer">
            <button type="button" class="btn btn--secondary" data-action="close-modal">
              Cancel
            </button>
            <button type="button" class="btn btn--danger" data-action="confirm-clear-data">
              Clear All Data
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Create and show modal
    const modalElement = document.createElement('div');
    modalElement.innerHTML = modalHtml;
    const modal = modalElement.firstElementChild;
    
    document.body.appendChild(modal);
    
    // Setup event listeners
    modal.querySelectorAll('[data-action="close-modal"]').forEach(btn => {
      btn.addEventListener('click', () => this.hideModal());
    });
    
    modal.querySelector('[data-action="confirm-clear-data"]').addEventListener('click', () => {
      this.clearAllData();
      this.hideModal();
    });
    
    // Focus management
    this.focusManager.pushFocus(modal.querySelector('.btn--danger'));
    this.focusManager.trapFocus(modal);
    
    // Update UI state and show modal
    this.state.updateUIState({ modalOpen: 'clear-data-modal' });
    this.modalStack.push(modal);
    
    requestAnimationFrame(() => {
      modal.classList.add('modal--active');
    });
  }

  /**
   * Clear all application data
   */
  clearAllData() {
    try {
      const { storage } = this.state;
      const result = storage.clearAll();
      
      if (result.success) {
        // Reset state
        this.state.reset();
        
        this.showToast('All data cleared successfully', 'success');
        this.announceStatus('All data has been cleared');
        
        // Navigate to about page
        this.state.updateUIState({ currentPage: 'about' });
      }
    } catch (error) {
      console.error('Clear data error:', error);
      this.showToast('Failed to clear data', 'error');
      this.announceError('Failed to clear data');
    }
  }

  /**
   * Cleanup when UIManager is destroyed
   */
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
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

/**
 * Focus Manager for accessibility
 */
class FocusManager {
  constructor() {
    this.focusStack = [];
  }

  pushFocus(element) {
    this.focusStack.push(document.activeElement);
    if (element && element.focus) {
      element.focus();
    }
  }

  popFocus() {
    const previousElement = this.focusStack.pop();
    if (previousElement && previousElement.focus) {
      previousElement.focus();
    }
  }

  trapFocus(container) {
    if (!container) return;
    
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const trapHandler = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    container.addEventListener('keydown', trapHandler);
    
    // Store handler for cleanup
    container._focusTrapHandler = trapHandler;
  }

  removeFocusTrap(container) {
    if (container && container._focusTrapHandler) {
      container.removeEventListener('keydown', container._focusTrapHandler);
      delete container._focusTrapHandler;
    }
  }

  announce(message, priority = 'polite') {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;
    
    document.body.appendChild(announcer);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }
}