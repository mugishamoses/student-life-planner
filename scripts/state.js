/**
 * AppState - Centralized state management with observable pattern
 * Handles tasks, settings, and UI state with automatic persistence
 */

import { getDataManager } from './data-manager.js';

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
    this.dataManager = getDataManager();
    this.isInitialized = false;
    
    // Initialize asynchronously
    this.initializeAsync();
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
    // Create base task with required fields
    const task = {
      id: this.generateTaskId(),
      createdAt: now,
      updatedAt: now,
      status: 'Pending',
      // Handle potential undefined or null values
      title: taskData.title || '',
      dueDate: taskData.dueDate || '',
      duration: parseInt(taskData.duration) || 0,
      tag: taskData.tag || this.state.settings.defaultTag
    };

    // Validate task before adding
    if (!task.title || !task.dueDate) {
      throw new Error('Task title and due date are required');
    }

    this.state.tasks.push(task);
    
    // Ensure storage is updated
    this.saveToStorage();
    
    // Notify subscribers of change
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

  /**
   * Initialize state asynchronously with JSON file fallback
   */
  async initializeAsync() {
    try {
      // Clear any stale data first
      this.state.tasks = [];
      
      // First, try to load from localStorage
      await this.loadFromStorage();
      
      // If no tasks in localStorage, try to load from JSON file
      if (!this.state.tasks.length) {
        const initialData = await this.dataManager.initialize(this.state);
        
        if (initialData) {
          // Merge JSON file data with current state
          this.state = {
            tasks: Array.isArray(initialData.tasks) ? initialData.tasks : [],
            settings: {
              ...this.state.settings,
              ...initialData.settings
            },
            ui: {
              ...this.state.ui,
              ...initialData.ui,
              // Reset transient UI state
              modalOpen: null,
              toastMessage: null,
              selectedTasks: []
            }
          };
          
          // Validate tasks array
          this.state.tasks = this.state.tasks.filter(task => 
            task && task.title && task.dueDate && task.id
          );
          
          // Save validated state to localStorage
          await this.saveToStorage();
          
          console.log('AppState: Initialized with JSON file data');
        }
      }
      
      // Ensure tasks is always an array
      if (!Array.isArray(this.state.tasks)) {
        this.state.tasks = [];
      }
      
      this.isInitialized = true;
      this.notify({ type: 'STATE_INITIALIZED', state: this.state });
      
    } catch (error) {
      console.error('Error during async initialization:', error);
      // Ensure we have a valid state even after error
      this.state.tasks = this.state.tasks || [];
      this.isInitialized = true;
      this.notify({ type: 'STATE_INITIALIZED', state: this.state });
    }
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
      
      // Ensure data is valid before saving
      if (!Array.isArray(stateToSave.tasks)) {
        stateToSave.tasks = [];
      }
      
      const serializedState = JSON.stringify(stateToSave);
      localStorage.setItem('campusLifePlannerState', serializedState);
      
      // Verify the save was successful
      const savedData = localStorage.getItem('campusLifePlannerState');
      if (!savedData) {
        throw new Error('Data was not saved successfully');
      }
      
      // Also create JSON file backup (throttled)
      if (this.dataManager && this.dataManager.isReady()) {
        this.dataManager.saveToJsonFile(stateToSave);
      }

      return true;
    } catch (error) {
      console.error('Error saving state to storage:', error);
      // Implement fallback to sessionStorage
      try {
        const serializedState = JSON.stringify(stateToSave);
        sessionStorage.setItem('campusLifePlannerState', serializedState);
        console.warn('Fallback: Saved to sessionStorage instead of localStorage');
        return true;
      } catch (fallbackError) {
        console.error('Error saving to fallback storage:', fallbackError);
        return false;
      }
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

  /**
   * Check if state is fully initialized
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Manually trigger a backup download
   */
  async createManualBackup() {
    if (!this.dataManager) {
      throw new Error('DataManager not available');
    }

    const stateToBackup = {
      tasks: this.state.tasks,
      settings: this.state.settings,
      ui: {
        sortBy: this.state.ui.sortBy,
        filterBy: this.state.ui.filterBy,
        searchMode: this.state.ui.searchMode,
        viewMode: this.state.ui.viewMode
      }
    };

    return await this.dataManager.manualBackup(stateToBackup);
  }

  /**
   * Import data from uploaded file
   */
  async importFromFile(file) {
    if (!this.dataManager) {
      throw new Error('DataManager not available');
    }

    const result = await this.dataManager.importFromFile(file);
    
    if (result.success && result.data) {
      // Merge imported data with current state
      const importedData = result.data;
      
      // Import tasks (replace existing)
      if (importedData.tasks && Array.isArray(importedData.tasks)) {
        this.state.tasks = importedData.tasks;
      }
      
      // Import settings (merge with existing)
      if (importedData.settings && typeof importedData.settings === 'object') {
        this.state.settings = {
          ...this.state.settings,
          ...importedData.settings
        };
      }
      
      // Import UI preferences (merge with existing)
      if (importedData.ui && typeof importedData.ui === 'object') {
        this.state.ui = {
          ...this.state.ui,
          ...importedData.ui,
          // Reset transient UI state
          modalOpen: null,
          toastMessage: null,
          selectedTasks: []
        };
      }
      
      // Save to localStorage
      this.saveToStorage();
      
      // Notify observers
      this.notify({ type: 'DATA_IMPORTED', importedData });
    }
    
    return result;
  }

  /**
   * Enable/disable automatic backup downloads
   */
  setAutoBackup(enabled) {
    if (this.dataManager) {
      this.dataManager.setAutoDownload(enabled);
    }
  }

  /**
   * Get auto backup status
   */
  getAutoBackupStatus() {
    return localStorage.getItem('campusLifePlannerAutoBackup') === 'true';
  }
}