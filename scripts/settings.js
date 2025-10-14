/**
 * Settings management module
 * Handles time unit configuration, weekly targets, and user preferences
 */

import { utils } from './utils.js';

/**
 * Default settings configuration
 */
export const DEFAULT_SETTINGS = {
  timeUnit: 'both',              // 'minutes', 'hours', or 'both'
  weeklyHourTarget: 40,          // Target hours per week
  theme: 'light',                // 'light' or 'dark' (future feature)
  defaultTag: 'General',         // Default tag for new tasks
  sortPreference: 'date-newest', // Default sort order
  searchCaseSensitive: false,    // Default search case sensitivity
  autoSave: true,                // Auto-save changes
  notifications: true,           // Enable notifications (future feature)
  compactView: false,            // Compact task display
  showCompletedTasks: true,      // Show completed tasks in lists
  dateFormat: 'YYYY-MM-DD',      // Date format preference
  firstDayOfWeek: 0              // 0 = Sunday, 1 = Monday
};

/**
 * Settings validation rules
 */
export const SETTINGS_VALIDATION = {
  timeUnit: {
    type: 'string',
    allowedValues: ['minutes', 'hours', 'both'],
    default: 'both'
  },
  weeklyHourTarget: {
    type: 'number',
    min: 0,
    max: 168, // 24 hours * 7 days
    default: 40
  },
  theme: {
    type: 'string',
    allowedValues: ['light', 'dark'],
    default: 'light'
  },
  defaultTag: {
    type: 'string',
    maxLength: 50,
    default: 'General'
  },
  sortPreference: {
    type: 'string',
    allowedValues: ['date-newest', 'date-oldest', 'title-asc', 'title-desc', 'duration-asc', 'duration-desc'],
    default: 'date-newest'
  },
  searchCaseSensitive: {
    type: 'boolean',
    default: false
  },
  autoSave: {
    type: 'boolean',
    default: true
  },
  notifications: {
    type: 'boolean',
    default: true
  },
  compactView: {
    type: 'boolean',
    default: false
  },
  showCompletedTasks: {
    type: 'boolean',
    default: true
  },
  dateFormat: {
    type: 'string',
    allowedValues: ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY'],
    default: 'YYYY-MM-DD'
  },
  firstDayOfWeek: {
    type: 'number',
    min: 0,
    max: 6,
    default: 0
  }
};

/**
 * Settings manager class
 */
export class SettingsManager {
  constructor(appState) {
    this.appState = appState;
    this.observers = [];
    this.initializeSettings();
  }

  /**
   * Initialize settings with defaults if not present
   */
  initializeSettings() {
    const currentSettings = this.appState.getSettings();
    const mergedSettings = { ...DEFAULT_SETTINGS, ...currentSettings };
    
    // Validate and clean up settings
    const validatedSettings = this.validateSettings(mergedSettings);
    
    // Update app state if settings were modified
    if (JSON.stringify(currentSettings) !== JSON.stringify(validatedSettings)) {
      this.appState.updateSettings(validatedSettings);
    }
  }

  /**
   * Get current settings
   */
  getSettings() {
    return this.appState.getSettings();
  }

  /**
   * Update a single setting
   */
  updateSetting(key, value) {
    const validation = this.validateSetting(key, value);
    if (!validation.isValid) {
      throw new Error(`Invalid setting value for ${key}: ${validation.error}`);
    }

    const currentSettings = this.getSettings();
    const updatedSettings = {
      ...currentSettings,
      [key]: validation.value
    };

    this.appState.updateSettings(updatedSettings);
    this.notifyObservers({ type: 'SETTING_UPDATED', key, value: validation.value });
    
    return validation.value;
  }

  /**
   * Update multiple settings
   */
  updateSettings(updates) {
    const currentSettings = this.getSettings();
    const validatedUpdates = {};
    const errors = [];

    // Validate all updates first
    for (const [key, value] of Object.entries(updates)) {
      const validation = this.validateSetting(key, value);
      if (validation.isValid) {
        validatedUpdates[key] = validation.value;
      } else {
        errors.push(`${key}: ${validation.error}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Invalid settings: ${errors.join(', ')}`);
    }

    const updatedSettings = {
      ...currentSettings,
      ...validatedUpdates
    };

    this.appState.updateSettings(updatedSettings);
    this.notifyObservers({ type: 'SETTINGS_UPDATED', updates: validatedUpdates });
    
    return updatedSettings;
  }

  /**
   * Reset settings to defaults
   */
  resetToDefaults() {
    this.appState.updateSettings({ ...DEFAULT_SETTINGS });
    this.notifyObservers({ type: 'SETTINGS_RESET' });
    return DEFAULT_SETTINGS;
  }

  /**
   * Reset a specific setting to default
   */
  resetSetting(key) {
    if (!(key in DEFAULT_SETTINGS)) {
      throw new Error(`Unknown setting: ${key}`);
    }

    const defaultValue = DEFAULT_SETTINGS[key];
    return this.updateSetting(key, defaultValue);
  }

  /**
   * Validate a single setting
   */
  validateSetting(key, value) {
    const rule = SETTINGS_VALIDATION[key];
    if (!rule) {
      return {
        isValid: false,
        error: `Unknown setting: ${key}`
      };
    }

    // Type validation
    if (rule.type === 'string' && typeof value !== 'string') {
      return {
        isValid: false,
        error: `Must be a string`,
        value: rule.default
      };
    }

    if (rule.type === 'number' && typeof value !== 'number') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return {
          isValid: false,
          error: `Must be a number`,
          value: rule.default
        };
      }
      value = numValue;
    }

    if (rule.type === 'boolean' && typeof value !== 'boolean') {
      return {
        isValid: false,
        error: `Must be a boolean`,
        value: rule.default
      };
    }

    // Range validation for numbers
    if (rule.type === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return {
          isValid: false,
          error: `Must be at least ${rule.min}`,
          value: rule.default
        };
      }
      if (rule.max !== undefined && value > rule.max) {
        return {
          isValid: false,
          error: `Must be at most ${rule.max}`,
          value: rule.default
        };
      }
    }

    // Length validation for strings
    if (rule.type === 'string' && rule.maxLength && value.length > rule.maxLength) {
      return {
        isValid: false,
        error: `Must be at most ${rule.maxLength} characters`,
        value: rule.default
      };
    }

    // Allowed values validation
    if (rule.allowedValues && !rule.allowedValues.includes(value)) {
      return {
        isValid: false,
        error: `Must be one of: ${rule.allowedValues.join(', ')}`,
        value: rule.default
      };
    }

    return {
      isValid: true,
      value: value
    };
  }

  /**
   * Validate all settings
   */
  validateSettings(settings) {
    const validated = {};
    
    for (const [key, value] of Object.entries(settings)) {
      const validation = this.validateSetting(key, value);
      validated[key] = validation.isValid ? validation.value : 
                     (SETTINGS_VALIDATION[key]?.default ?? DEFAULT_SETTINGS[key]);
    }

    // Ensure all default settings are present
    for (const key of Object.keys(DEFAULT_SETTINGS)) {
      if (!(key in validated)) {
        validated[key] = DEFAULT_SETTINGS[key];
      }
    }

    return validated;
  }

  /**
   * Get setting with type conversion and formatting
   */
  getFormattedSetting(key, format = null) {
    const value = this.getSettings()[key];
    
    switch (key) {
      case 'weeklyHourTarget':
        if (format === 'minutes') {
          return utils.hoursToMinutes(value);
        }
        return value;
      
      case 'timeUnit':
        if (format === 'label') {
          return utils.getUnitLabel(value, false);
        }
        return value;
      
      default:
        return value;
    }
  }

  /**
   * Get time unit configuration for UI
   */
  getTimeUnitConfig() {
    const timeUnit = this.getSettings().timeUnit;
    
    return {
      unit: timeUnit,
      label: utils.getUnitLabel(timeUnit, false),
      shortLabel: utils.getUnitLabel(timeUnit, true),
      showMinutes: timeUnit === 'minutes' || timeUnit === 'both',
      showHours: timeUnit === 'hours' || timeUnit === 'both',
      defaultUnit: timeUnit === 'both' ? 'minutes' : timeUnit
    };
  }

  /**
   * Get weekly target configuration
   */
  getWeeklyTargetConfig() {
    const settings = this.getSettings();
    
    return {
      targetHours: settings.weeklyHourTarget,
      targetMinutes: utils.hoursToMinutes(settings.weeklyHourTarget),
      firstDayOfWeek: settings.firstDayOfWeek,
      formatted: utils.formatTime(utils.hoursToMinutes(settings.weeklyHourTarget), {
        timeUnit: settings.timeUnit,
        showUnit: true,
        compact: true
      })
    };
  }

  /**
   * Export settings for backup/sharing
   */
  exportSettings() {
    const settings = this.getSettings();
    
    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      settings: settings,
      metadata: {
        exportedBy: 'Campus Life Planner Settings Manager',
        settingsCount: Object.keys(settings).length
      }
    };
  }

  /**
   * Import settings from backup/sharing
   */
  importSettings(settingsData) {
    try {
      let settings;
      
      // Handle different import formats
      if (settingsData.settings) {
        settings = settingsData.settings;
      } else if (typeof settingsData === 'object') {
        settings = settingsData;
      } else {
        throw new Error('Invalid settings format');
      }

      // Validate imported settings
      const validatedSettings = this.validateSettings(settings);
      
      // Update settings
      this.appState.updateSettings(validatedSettings);
      this.notifyObservers({ type: 'SETTINGS_IMPORTED', settings: validatedSettings });
      
      return {
        success: true,
        importedCount: Object.keys(validatedSettings).length,
        message: 'Settings imported successfully'
      };
      
    } catch (error) {
      throw new Error(`Failed to import settings: ${error.message}`);
    }
  }

  /**
   * Subscribe to settings changes
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

  /**
   * Notify observers of changes
   */
  notifyObservers(change) {
    this.observers.forEach(callback => {
      try {
        callback(change, this.getSettings());
      } catch (error) {
        console.error('Error in settings observer:', error);
      }
    });
  }

  /**
   * Get available options for a setting
   */
  getSettingOptions(key) {
    const rule = SETTINGS_VALIDATION[key];
    if (!rule) {
      return null;
    }

    const options = {
      type: rule.type,
      default: rule.default
    };

    if (rule.allowedValues) {
      options.values = rule.allowedValues.map(value => ({
        value,
        label: this.getOptionLabel(key, value)
      }));
    }

    if (rule.min !== undefined) options.min = rule.min;
    if (rule.max !== undefined) options.max = rule.max;
    if (rule.maxLength !== undefined) options.maxLength = rule.maxLength;

    return options;
  }

  /**
   * Get human-readable label for setting option
   */
  getOptionLabel(key, value) {
    const labels = {
      timeUnit: {
        'minutes': 'Minutes only',
        'hours': 'Hours only',
        'both': 'Both minutes and hours'
      },
      theme: {
        'light': 'Light theme',
        'dark': 'Dark theme'
      },
      sortPreference: {
        'date-newest': 'Date (newest first)',
        'date-oldest': 'Date (oldest first)',
        'title-asc': 'Title (A-Z)',
        'title-desc': 'Title (Z-A)',
        'duration-asc': 'Duration (shortest first)',
        'duration-desc': 'Duration (longest first)'
      },
      dateFormat: {
        'YYYY-MM-DD': 'YYYY-MM-DD (2025-01-15)',
        'MM/DD/YYYY': 'MM/DD/YYYY (01/15/2025)',
        'DD/MM/YYYY': 'DD/MM/YYYY (15/01/2025)'
      }
    };

    return labels[key]?.[value] || value.toString();
  }

  /**
   * Check if settings have been modified from defaults
   */
  hasModifiedSettings() {
    const current = this.getSettings();
    const defaults = DEFAULT_SETTINGS;
    
    return Object.keys(defaults).some(key => 
      current[key] !== defaults[key]
    );
  }

  /**
   * Get list of modified settings
   */
  getModifiedSettings() {
    const current = this.getSettings();
    const defaults = DEFAULT_SETTINGS;
    const modified = {};
    
    Object.keys(defaults).forEach(key => {
      if (current[key] !== defaults[key]) {
        modified[key] = {
          current: current[key],
          default: defaults[key]
        };
      }
    });
    
    return modified;
  }
}