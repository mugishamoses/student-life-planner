/**
 * Storage module for localStorage operations with error handling
 * Handles save/load, JSON import/export, and data validation
 */

/**
 * Storage utility functions
 */
export const storage = {
  /**
   * Save data to localStorage with error handling
   */
  save(key, data) {
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(key, serializedData);
      return true;
    } catch (error) {
      console.error(`Error saving to localStorage (${key}):`, error);
      
      // Try sessionStorage as fallback
      try {
        const serializedData = JSON.stringify(data);
        sessionStorage.setItem(key, serializedData);
        console.warn(`Fallback: Data saved to sessionStorage instead of localStorage`);
        return true;
      } catch (fallbackError) {
        console.error(`Error saving to sessionStorage (${key}):`, fallbackError);
        return false;
      }
    }
  },

  /**
   * Load data from localStorage with error handling
   */
  load(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      return JSON.parse(item);
    } catch (error) {
      console.error(`Error loading from localStorage (${key}):`, error);
      
      // Try sessionStorage as fallback
      try {
        const item = sessionStorage.getItem(key);
        if (item === null) {
          return defaultValue;
        }
        return JSON.parse(item);
      } catch (fallbackError) {
        console.error(`Error loading from sessionStorage (${key}):`, fallbackError);
        return defaultValue;
      }
    }
  },

  /**
   * Export all application data as JSON
   */
  exportData() {
    try {
      const appState = this.load('campusLifePlannerState', {});
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        application: 'Campus Life Planner',
        data: {
          tasks: appState.tasks || [],
          settings: appState.settings || {},
          ui: {
            // Export only persistent UI preferences
            sortBy: appState.ui?.sortBy || 'date-newest',
            filterBy: appState.ui?.filterBy || 'all',
            searchMode: appState.ui?.searchMode || 'text',
            viewMode: appState.ui?.viewMode || 'table'
          },
          metadata: {
            totalTasks: (appState.tasks || []).length,
            settingsCount: Object.keys(appState.settings || {}).length,
            exportedBy: 'Campus Life Planner',
            format: 'JSON',
            dataVersion: '1.0'
          }
        }
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('Failed to export data. Please try again.');
    }
  },

  /**
   * Import data from JSON string with validation
   */
  importData(jsonString, options = {}) {
    try {
      const importedData = JSON.parse(jsonString);
      
      // Validate the imported data structure
      const validationResult = this.validateImportData(importedData);
      if (!validationResult.isValid) {
        throw new Error(`Invalid data format: ${validationResult.errors.join(', ')}`);
      }
      
      // Extract data from different possible formats
      const actualData = importedData.data || importedData;
      const { 
        tasks = [], 
        settings = {}, 
        ui = {} 
      } = actualData;
      
      // Load current state
      const currentState = this.load('campusLifePlannerState', {
        tasks: [],
        settings: {},
        ui: {}
      });
      
      // Determine import strategy
      const {
        mergeMode = 'merge', // 'merge', 'replace', 'append'
        includeSettings = true,
        includeUI = true
      } = options;
      
      let mergedTasks;
      switch (mergeMode) {
        case 'replace':
          mergedTasks = tasks;
          break;
        case 'append':
          mergedTasks = [...(currentState.tasks || []), ...tasks];
          break;
        case 'merge':
        default:
          mergedTasks = this.mergeTasks(currentState.tasks || [], tasks);
          break;
      }
      
      // Merge imported data with current state
      const mergedState = {
        ...currentState,
        tasks: mergedTasks
      };
      
      // Include settings if requested
      if (includeSettings && Object.keys(settings).length > 0) {
        mergedState.settings = {
          ...currentState.settings,
          ...settings
        };
      }
      
      // Include UI preferences if requested
      if (includeUI && Object.keys(ui).length > 0) {
        mergedState.ui = {
          ...currentState.ui,
          ...ui,
          // Reset transient UI state
          modalOpen: null,
          toastMessage: null,
          selectedTasks: [],
          searchQuery: ''
        };
      }
      
      // Save merged state
      const saveSuccess = this.save('campusLifePlannerState', mergedState);
      if (!saveSuccess) {
        throw new Error('Failed to save imported data');
      }
      
      return {
        success: true,
        importedTasks: tasks.length,
        totalTasks: mergedState.tasks.length,
        importedSettings: includeSettings ? Object.keys(settings).length : 0,
        importedUI: includeUI ? Object.keys(ui).length : 0,
        mergeMode: mergeMode,
        message: this.generateImportMessage(tasks.length, settings, ui, mergeMode)
      };
      
    } catch (error) {
      console.error('Error importing data:', error);
      
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON format. Please check your file and try again.');
      }
      
      throw error;
    }
  },

  /**
   * Validate imported data structure
   */
  validateImportData(data) {
    const errors = [];
    
    // Check if data is an object
    if (!data || typeof data !== 'object') {
      errors.push('Data must be a valid object');
      return { isValid: false, errors };
    }
    
    // Handle both direct format and wrapped format
    const actualData = data.data || data;
    
    // Validate tasks array
    if (actualData.tasks) {
      if (!Array.isArray(actualData.tasks)) {
        errors.push('Tasks must be an array');
      } else {
        // Validate each task (limit error reporting to first 5 tasks)
        const maxTaskErrors = 5;
        let taskErrorCount = 0;
        
        actualData.tasks.forEach((task, index) => {
          if (taskErrorCount >= maxTaskErrors) return;
          
          const taskErrors = this.validateTask(task);
          if (taskErrors.length > 0) {
            errors.push(`Task ${index + 1}: ${taskErrors.join(', ')}`);
            taskErrorCount++;
          }
        });
        
        if (taskErrorCount >= maxTaskErrors && actualData.tasks.length > maxTaskErrors) {
          errors.push(`... and ${actualData.tasks.length - maxTaskErrors} more tasks with errors`);
        }
      }
    }
    
    // Validate settings object
    if (actualData.settings) {
      if (typeof actualData.settings !== 'object') {
        errors.push('Settings must be an object');
      } else {
        // Validate specific settings
        const settingsErrors = this.validateSettings(actualData.settings);
        if (settingsErrors.length > 0) {
          errors.push(`Settings: ${settingsErrors.join(', ')}`);
        }
      }
    }
    
    // Validate UI preferences
    if (actualData.ui && typeof actualData.ui !== 'object') {
      errors.push('UI preferences must be an object');
    }
    
    // Check for minimum required data
    if (!actualData.tasks && !actualData.settings) {
      errors.push('Import data must contain at least tasks or settings');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Validate individual task structure
   */
  validateTask(task) {
    const errors = [];
    
    if (!task || typeof task !== 'object') {
      errors.push('must be an object');
      return errors;
    }
    
    // Required fields
    if (!task.title || typeof task.title !== 'string' || task.title.trim() === '') {
      errors.push('title is required and must be a non-empty string');
    }
    
    if (!task.dueDate || typeof task.dueDate !== 'string') {
      errors.push('dueDate is required and must be a string');
    } else {
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
      if (!dateRegex.test(task.dueDate)) {
        errors.push('dueDate must be in YYYY-MM-DD format');
      }
    }
    
    if (task.duration !== undefined) {
      if (typeof task.duration !== 'number' || task.duration < 0) {
        errors.push('duration must be a non-negative number');
      }
    }
    
    if (task.tag && typeof task.tag !== 'string') {
      errors.push('tag must be a string');
    }
    
    if (task.status && !['Pending', 'Complete'].includes(task.status)) {
      errors.push('status must be either "Pending" or "Complete"');
    }
    
    return errors;
  },

  /**
   * Merge imported tasks with existing tasks, avoiding duplicates
   */
  mergeTasks(existingTasks, importedTasks) {
    const merged = [...existingTasks];
    const existingIds = new Set(existingTasks.map(task => task.id));
    
    importedTasks.forEach(importedTask => {
      // Generate new ID if task doesn't have one or if ID already exists
      if (!importedTask.id || existingIds.has(importedTask.id)) {
        importedTask.id = this.generateTaskId();
      }
      
      // Ensure required timestamps
      const now = new Date().toISOString();
      if (!importedTask.createdAt) {
        importedTask.createdAt = now;
      }
      if (!importedTask.updatedAt) {
        importedTask.updatedAt = now;
      }
      
      // Set default values for missing fields
      const taskWithDefaults = {
        status: 'Pending',
        tag: 'General',
        duration: 0,
        ...importedTask
      };
      
      merged.push(taskWithDefaults);
      existingIds.add(taskWithDefaults.id);
    });
    
    return merged;
  },

  /**
   * Generate unique task ID
   */
  generateTaskId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `task_${timestamp}_${random}`;
  },

  /**
   * Create backup of current data
   */
  createBackup() {
    try {
      const currentData = this.load('campusLifePlannerState', {});
      const backupKey = `campusLifePlannerBackup_${Date.now()}`;
      
      const backup = {
        originalKey: 'campusLifePlannerState',
        backupDate: new Date().toISOString(),
        data: currentData
      };
      
      const success = this.save(backupKey, backup);
      if (success) {
        // Keep only the 5 most recent backups
        this.cleanupOldBackups();
        return backupKey;
      }
      
      return null;
    } catch (error) {
      console.error('Error creating backup:', error);
      return null;
    }
  },

  /**
   * Restore data from backup
   */
  restoreFromBackup(backupKey) {
    try {
      const backup = this.load(backupKey);
      if (!backup || !backup.data) {
        throw new Error('Invalid backup data');
      }
      
      const success = this.save('campusLifePlannerState', backup.data);
      if (!success) {
        throw new Error('Failed to restore backup');
      }
      
      return {
        success: true,
        restoredDate: backup.backupDate,
        message: 'Data successfully restored from backup'
      };
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw new Error('Failed to restore from backup: ' + error.message);
    }
  },

  /**
   * List available backups
   */
  listBackups() {
    const backups = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('campusLifePlannerBackup_')) {
          const backup = this.load(key);
          if (backup && backup.backupDate) {
            backups.push({
              key,
              date: backup.backupDate,
              timestamp: new Date(backup.backupDate).getTime()
            });
          }
        }
      }
      
      // Sort by date (newest first)
      return backups.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  },

  /**
   * Clean up old backups (keep only 5 most recent)
   */
  cleanupOldBackups() {
    try {
      const backups = this.listBackups();
      
      // Remove backups beyond the 5 most recent
      if (backups.length > 5) {
        const backupsToRemove = backups.slice(5);
        backupsToRemove.forEach(backup => {
          localStorage.removeItem(backup.key);
        });
      }
    } catch (error) {
      console.error('Error cleaning up backups:', error);
    }
  },

  /**
   * Clear all application data
   */
  clearAll() {
    try {
      // Create backup before clearing
      const backupKey = this.createBackup();
      
      // Remove main data
      localStorage.removeItem('campusLifePlannerState');
      
      return {
        success: true,
        backupKey,
        message: backupKey ? 
          'All data cleared. Backup created for recovery.' : 
          'All data cleared. No backup could be created.'
      };
    } catch (error) {
      console.error('Error clearing data:', error);
      throw new Error('Failed to clear data: ' + error.message);
    }
  },

  /**
   * Get storage usage information
   */
  getStorageInfo() {
    try {
      const mainData = localStorage.getItem('campusLifePlannerState');
      const backups = this.listBackups();
      
      return {
        mainDataSize: mainData ? new Blob([mainData]).size : 0,
        backupCount: backups.length,
        totalBackupSize: backups.reduce((total, backup) => {
          const backupData = localStorage.getItem(backup.key);
          return total + (backupData ? new Blob([backupData]).size : 0);
        }, 0),
        availableSpace: this.getAvailableStorageSpace()
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return null;
    }
  },

  /**
   * Estimate available localStorage space
   */
  getAvailableStorageSpace() {
    try {
      const testKey = 'storageTest';
      const testData = 'x';
      let size = 0;
      
      // Test by adding data until quota is exceeded
      while (size < 10 * 1024 * 1024) { // Max 10MB test
        try {
          localStorage.setItem(testKey, testData.repeat(size));
          size += 1024; // Increment by 1KB
        } catch (e) {
          localStorage.removeItem(testKey);
          return size;
        }
      }
      
      localStorage.removeItem(testKey);
      return size;
    } catch (error) {
      return -1; // Unknown
    }
  },

  /**
   * Validate settings object
   */
  validateSettings(settings) {
    const errors = [];
    
    if (!settings || typeof settings !== 'object') {
      return ['Settings must be an object'];
    }
    
    // Define valid settings and their types
    const validSettings = {
      timeUnit: ['minutes', 'hours', 'both'],
      weeklyHourTarget: 'number',
      theme: ['light', 'dark'],
      defaultTag: 'string',
      sortPreference: ['date-newest', 'date-oldest', 'title-asc', 'title-desc', 'duration-asc', 'duration-desc'],
      searchCaseSensitive: 'boolean',
      autoSave: 'boolean',
      notifications: 'boolean',
      compactView: 'boolean',
      showCompletedTasks: 'boolean',
      dateFormat: ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY'],
      firstDayOfWeek: 'number'
    };
    
    Object.entries(settings).forEach(([key, value]) => {
      const validation = validSettings[key];
      
      if (!validation) {
        // Unknown setting - warn but don't error
        console.warn(`Unknown setting: ${key}`);
        return;
      }
      
      if (Array.isArray(validation)) {
        // Enum validation
        if (!validation.includes(value)) {
          errors.push(`${key} must be one of: ${validation.join(', ')}`);
        }
      } else if (validation === 'number') {
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push(`${key} must be a valid number`);
        } else if (key === 'weeklyHourTarget' && (value < 0 || value > 168)) {
          errors.push(`${key} must be between 0 and 168 hours`);
        } else if (key === 'firstDayOfWeek' && (value < 0 || value > 6)) {
          errors.push(`${key} must be between 0 and 6`);
        }
      } else if (validation === 'boolean') {
        if (typeof value !== 'boolean') {
          errors.push(`${key} must be a boolean`);
        }
      } else if (validation === 'string') {
        if (typeof value !== 'string') {
          errors.push(`${key} must be a string`);
        } else if (key === 'defaultTag' && value.length > 50) {
          errors.push(`${key} must be 50 characters or less`);
        }
      }
    });
    
    return errors;
  },

  /**
   * Generate import success message
   */
  generateImportMessage(taskCount, settings, ui, mergeMode) {
    const parts = [];
    
    if (taskCount > 0) {
      parts.push(`${taskCount} task${taskCount !== 1 ? 's' : ''}`);
    }
    
    if (settings && Object.keys(settings).length > 0) {
      parts.push(`${Object.keys(settings).length} setting${Object.keys(settings).length !== 1 ? 's' : ''}`);
    }
    
    if (ui && Object.keys(ui).length > 0) {
      parts.push('UI preferences');
    }
    
    if (parts.length === 0) {
      return 'Import completed (no data imported)';
    }
    
    const modeText = mergeMode === 'replace' ? 'replaced' : 
                    mergeMode === 'append' ? 'added' : 'imported';
    
    return `Successfully ${modeText} ${parts.join(', ')}`;
  },

  /**
   * Export settings only
   */
  exportSettings() {
    try {
      const appState = this.load('campusLifePlannerState', {});
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        application: 'Campus Life Planner',
        type: 'settings',
        data: {
          settings: appState.settings || {},
          metadata: {
            settingsCount: Object.keys(appState.settings || {}).length,
            exportedBy: 'Campus Life Planner Settings',
            format: 'JSON'
          }
        }
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting settings:', error);
      throw new Error('Failed to export settings. Please try again.');
    }
  },

  /**
   * Import settings only
   */
  importSettings(jsonString) {
    try {
      const importedData = JSON.parse(jsonString);
      
      // Extract settings from different possible formats
      let settings;
      if (importedData.data && importedData.data.settings) {
        settings = importedData.data.settings;
      } else if (importedData.settings) {
        settings = importedData.settings;
      } else {
        settings = importedData;
      }
      
      // Validate settings
      const settingsErrors = this.validateSettings(settings);
      if (settingsErrors.length > 0) {
        throw new Error(`Invalid settings: ${settingsErrors.join(', ')}`);
      }
      
      // Load current state and merge settings
      const currentState = this.load('campusLifePlannerState', {
        tasks: [],
        settings: {},
        ui: {}
      });
      
      const mergedState = {
        ...currentState,
        settings: {
          ...currentState.settings,
          ...settings
        }
      };
      
      // Save merged state
      const saveSuccess = this.save('campusLifePlannerState', mergedState);
      if (!saveSuccess) {
        throw new Error('Failed to save imported settings');
      }
      
      return {
        success: true,
        importedSettings: Object.keys(settings).length,
        message: `Successfully imported ${Object.keys(settings).length} setting${Object.keys(settings).length !== 1 ? 's' : ''}`
      };
      
    } catch (error) {
      console.error('Error importing settings:', error);
      
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON format. Please check your file and try again.');
      }
      
      throw error;
    }
  }
};