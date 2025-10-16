/**
 * DataManager - Handles JSON file backup and initialization
 * Works alongside localStorage to provide file-based data persistence
 */

export class DataManager {
  constructor() {
    this.jsonFilePath = './data/tasks.json';
    this.isInitialized = false;
    this.lastBackupTime = null;
    this.backupThrottleMs = 5000; // Throttle backups to every 5 seconds
  }

  /**
   * Initialize data manager and load initial data if needed
   * @param {Object} currentState - Current application state
   * @returns {Object|null} Initial data from JSON file or null
   */
  async initialize(currentState) {
    try {
      // If localStorage already has data, don't override it
      if (currentState && currentState.tasks && currentState.tasks.length > 0) {
        console.log('DataManager: Using existing localStorage data');
        this.isInitialized = true;
        return null;
      }

      // Try to load initial data from JSON file
      const initialData = await this.loadFromJsonFile();
      
      if (initialData && initialData.data) {
        console.log('DataManager: Loading initial data from JSON file');
        this.isInitialized = true;
        return initialData.data;
      }

      console.log('DataManager: No initial data found, using defaults');
      this.isInitialized = true;
      return null;

    } catch (error) {
      console.warn('DataManager: Failed to initialize from JSON file:', error);
      this.isInitialized = true;
      return null;
    }
  }

  /**
   * Load data from JSON file
   * @returns {Object|null} Parsed JSON data or null
   */
  async loadFromJsonFile() {
    try {
      const response = await fetch(this.jsonFilePath);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Validate data structure
      if (this.validateJsonData(data)) {
        return data;
      } else {
        throw new Error('Invalid JSON data structure');
      }

    } catch (error) {
      console.warn('DataManager: Could not load from JSON file:', error);
      return null;
    }
  }

  /**
   * Save current state to JSON file (throttled)
   * Note: This creates a downloadable backup since we can't write to server files from client
   * @param {Object} state - Current application state
   */
  async saveToJsonFile(state) {
    try {
      // Throttle backup operations
      const now = Date.now();
      if (this.lastBackupTime && (now - this.lastBackupTime) < this.backupThrottleMs) {
        return;
      }

      const backupData = this.createBackupData(state);
      
      // Create downloadable backup file
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { 
        type: 'application/json' 
      });
      
      // Store backup data in a way that can be accessed
      this.lastBackupData = backupData;
      this.lastBackupTime = now;
      
      console.log('DataManager: Backup data prepared');
      
      // Optionally trigger automatic download (can be disabled)
      if (this.shouldAutoDownload()) {
        this.downloadBackup(blob);
      }

    } catch (error) {
      console.error('DataManager: Failed to create backup:', error);
    }
  }

  /**
   * Create backup data structure
   * @param {Object} state - Current application state
   * @returns {Object} Formatted backup data
   */
  createBackupData(state) {
    return {
      version: "1.0",
      lastUpdated: new Date().toISOString(),
      application: "Campus Life Planner",
      data: {
        tasks: state.tasks || [],
        settings: state.settings || {},
        ui: {
          sortBy: state.ui?.sortBy || 'date-newest',
          filterBy: state.ui?.filterBy || 'all',
          searchMode: state.ui?.searchMode || 'text',
          viewMode: state.ui?.viewMode || 'table'
        },
        metadata: {
          totalTasks: (state.tasks || []).length,
          settingsCount: Object.keys(state.settings || {}).length,
          exportedBy: 'Campus Life Planner Auto-Backup',
          format: 'JSON',
          dataVersion: '1.0',
          backupTime: new Date().toISOString()
        }
      }
    };
  }

  /**
   * Download backup file
   * @param {Blob} blob - Backup data blob
   */
  downloadBackup(blob) {
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campus-life-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
      console.log('DataManager: Backup file downloaded');
    } catch (error) {
      console.error('DataManager: Failed to download backup:', error);
    }
  }

  /**
   * Validate JSON data structure
   * @param {Object} data - Data to validate
   * @returns {boolean} True if valid
   */
  validateJsonData(data) {
    try {
      // Check basic structure
      if (!data || typeof data !== 'object') {
        return false;
      }

      // Check required fields
      if (!data.data || typeof data.data !== 'object') {
        return false;
      }

      // Check tasks array
      if (data.data.tasks && !Array.isArray(data.data.tasks)) {
        return false;
      }

      // Validate each task
      if (data.data.tasks) {
        for (const task of data.data.tasks) {
          if (!this.validateTask(task)) {
            console.warn('DataManager: Invalid task found:', task);
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('DataManager: Validation error:', error);
      return false;
    }
  }

  /**
   * Validate individual task
   * @param {Object} task - Task to validate
   * @returns {boolean} True if valid
   */
  validateTask(task) {
    if (!task || typeof task !== 'object') {
      return false;
    }

    // Required fields
    const requiredFields = ['id', 'title', 'dueDate', 'status'];
    for (const field of requiredFields) {
      if (!task[field] || typeof task[field] !== 'string') {
        return false;
      }
    }

    // Validate duration
    if (task.duration !== undefined && (typeof task.duration !== 'number' || task.duration < 0)) {
      return false;
    }

    // Validate status
    if (!['Pending', 'Complete'].includes(task.status)) {
      return false;
    }

    // Validate date format (basic check)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(task.dueDate)) {
      return false;
    }

    return true;
  }

  /**
   * Check if auto-download should be triggered
   * @returns {boolean} True if should auto-download
   */
  shouldAutoDownload() {
    // Only auto-download if explicitly enabled (default: false)
    return localStorage.getItem('campusLifePlannerAutoBackup') === 'true';
  }

  /**
   * Enable/disable auto-download of backups
   * @param {boolean} enabled - Whether to enable auto-download
   */
  setAutoDownload(enabled) {
    localStorage.setItem('campusLifePlannerAutoBackup', enabled ? 'true' : 'false');
  }

  /**
   * Get the last backup data
   * @returns {Object|null} Last backup data or null
   */
  getLastBackup() {
    return this.lastBackupData || null;
  }

  /**
   * Manually trigger a backup download
   * @param {Object} state - Current application state
   */
  async manualBackup(state) {
    try {
      const backupData = this.createBackupData(state);
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { 
        type: 'application/json' 
      });
      
      this.downloadBackup(blob);
      
      return {
        success: true,
        message: 'Backup downloaded successfully'
      };
    } catch (error) {
      console.error('DataManager: Manual backup failed:', error);
      return {
        success: false,
        message: 'Backup failed: ' + error.message
      };
    }
  }

  /**
   * Import data from uploaded JSON file
   * @param {File} file - Uploaded JSON file
   * @returns {Object} Import result
   */
  async importFromFile(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!this.validateJsonData(data)) {
        throw new Error('Invalid file format');
      }

      return {
        success: true,
        data: data.data,
        message: 'File imported successfully'
      };
    } catch (error) {
      console.error('DataManager: Import failed:', error);
      return {
        success: false,
        message: 'Import failed: ' + error.message
      };
    }
  }

  /**
   * Get initialization status
   * @returns {boolean} True if initialized
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Reset data manager
   */
  reset() {
    this.isInitialized = false;
    this.lastBackupTime = null;
    this.lastBackupData = null;
  }
}

// Create singleton instance
let dataManagerInstance = null;

/**
 * Get or create DataManager instance
 * @returns {DataManager} DataManager instance
 */
export function getDataManager() {
  if (!dataManagerInstance) {
    dataManagerInstance = new DataManager();
  }
  return dataManagerInstance;
}

/**
 * Initialize data manager with current state
 * @param {Object} currentState - Current application state
 * @returns {Object|null} Initial data or null
 */
export async function initializeDataManager(currentState) {
  const dataManager = getDataManager();
  return await dataManager.initialize(currentState);
}