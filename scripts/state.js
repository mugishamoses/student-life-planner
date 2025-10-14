/**
 * AppState - Centralized state management with observable pattern
 * Handles tasks, settings, and UI state with automatic persistence
 */

export class AppState {
  constructor() {
    this.state = {
      tasks: [],
      settings: {
        timeUnit: 'both',
        weeklyHourTarget: 40,
        theme: 'light',
        defaultTag: 'General',
        sortPreference: 'date-newest',
        searchCaseSensitive: false
      },
      ui: {
        currentPage: 'about',
        modalOpen: null,
        searchQuery: '',
        searchMode: 'text',
        sortBy: 'date-newest',
        filterBy: 'all',
        selectedTasks: [],
        toastMessage: null,
        viewMode: 'table'
      }
    };
    
    this.observers = [];
    this.loadFromStorage();
  }

  /**
   * Observable pattern implementation
   */
  subscribe(callback) {
    this.observers.push(callback);
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  unsubscribe(callback) {
    const index = this.observers.indexOf(callback);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  notify(changes) {
    this.observers.forEach(callback => {
      try {
        callback(changes, this.state);
      } catch (error) {
        console.error('Error in state observer:', error);
      }
    });
  }

  /**
   * Task CRUD operations
   */
  getTasks() {
    return [...this.state.tasks];
  }

  addTask(taskData) {
    const now = new Date().toISOString();
    const task = {
      id: this.generateTaskId(),
      title: taskData.title,
      dueDate: taskData.dueDate,
      duration: taskData.duration,
      tag: taskData.tag || this.state.settings.defaultTag,
      status: 'Pending',
      createdAt: now,
      updatedAt: now,
      ...taskData
    };

    this.state.tasks.push(task);
    this.saveToStorage();
    this.notify({ type: 'TASK_ADDED', task });
    
    return task;
  }

  updateTask(id, updates) {
    const taskIndex = this.state.tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) {
      throw new Error(`Task with id ${id} not found`);
    }

    const updatedTask = {
      ...this.state.tasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.state.tasks[taskIndex] = updatedTask;
    this.saveToStorage();
    this.notify({ type: 'TASK_UPDATED', task: updatedTask });
    
    return updatedTask;
  }

  deleteTask(id) {
    const taskIndex = this.state.tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) {
      throw new Error(`Task with id ${id} not found`);
    }

    const deletedTask = this.state.tasks[taskIndex];
    this.state.tasks.splice(taskIndex, 1);
    this.saveToStorage();
    this.notify({ type: 'TASK_DELETED', task: deletedTask });
    
    return deletedTask;
  }

  /**
   * Settings management
   */
  getSettings() {
    return { ...this.state.settings };
  }

  updateSettings(updates) {
    const previousSettings = { ...this.state.settings };
    this.state.settings = {
      ...this.state.settings,
      ...updates
    };
    
    this.saveToStorage();
    this.notify({ 
      type: 'SETTINGS_UPDATED', 
      settings: this.state.settings,
      previousSettings 
    });
    
    return this.state.settings;
  }

  /**
   * UI state management
   */
  getUIState() {
    return { ...this.state.ui };
  }

  updateUIState(updates) {
    const previousUIState = { ...this.state.ui };
    this.state.ui = {
      ...this.state.ui,
      ...updates
    };
    
    // UI state changes don't need persistence for most properties
    // Only persist certain UI preferences
    const persistentUIProps = ['sortBy', 'filterBy', 'searchMode', 'viewMode'];
    const shouldPersist = Object.keys(updates).some(key => 
      persistentUIProps.includes(key)
    );
    
    if (shouldPersist) {
      this.saveToStorage();
    }
    
    this.notify({ 
      type: 'UI_STATE_UPDATED', 
      uiState: this.state.ui,
      previousUIState 
    });
    
    return this.state.ui;
  }

  /**
   * Utility methods
   */
  generateTaskId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `task_${timestamp}_${random}`;
  }

  loadFromStorage() {
    try {
      const savedState = localStorage.getItem('campusLifePlannerState');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        
        // Merge saved state with defaults to handle new properties
        this.state = {
          tasks: parsedState.tasks || [],
          settings: {
            ...this.state.settings,
            ...parsedState.settings
          },
          ui: {
            ...this.state.ui,
            ...parsedState.ui,
            // Reset transient UI state
            modalOpen: null,
            toastMessage: null,
            selectedTasks: [],
            // Preserve viewMode preference
            viewMode: parsedState.ui?.viewMode || 'table'
          }
        };
      }
    } catch (error) {
      console.error('Error loading state from storage:', error);
      // Continue with default state if loading fails
    }
  }

  saveToStorage() {
    try {
      const stateToSave = {
        tasks: this.state.tasks,
        settings: this.state.settings,
        ui: {
          // Only save persistent UI state
          sortBy: this.state.ui.sortBy,
          filterBy: this.state.ui.filterBy,
          searchMode: this.state.ui.searchMode,
          viewMode: this.state.ui.viewMode
        }
      };
      
      localStorage.setItem('campusLifePlannerState', JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Error saving state to storage:', error);
      // Could implement fallback to sessionStorage here
    }
  }

  /**
   * Get complete state (for debugging/export)
   */
  getState() {
    return {
      tasks: [...this.state.tasks],
      settings: { ...this.state.settings },
      ui: { ...this.state.ui }
    };
  }

  /**
   * Reset state to defaults
   */
  reset() {
    this.state = {
      tasks: [],
      settings: {
        timeUnit: 'both',
        weeklyHourTarget: 40,
        theme: 'light',
        defaultTag: 'General',
        sortPreference: 'date-newest',
        searchCaseSensitive: false
      },
      ui: {
        currentPage: 'about',
        modalOpen: null,
        searchQuery: '',
        searchMode: 'text',
        sortBy: 'date-newest',
        filterBy: 'all',
        selectedTasks: [],
        toastMessage: null,
        viewMode: 'table'
      }
    };
    
    this.saveToStorage();
    this.notify({ type: 'STATE_RESET' });
  }
}