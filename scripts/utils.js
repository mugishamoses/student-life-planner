/**
 * Utility functions for unit conversions and formatting
 * Handles minute-to-hour conversions and display formatting based on user preferences
 */

/**
 * Unit conversion utilities
 */
export const utils = {
  /**
   * Convert minutes to hours
   * @param {number} minutes - Duration in minutes
   * @returns {number} Duration in hours (rounded to 2 decimal places)
   */
  minutesToHours(minutes) {
    if (typeof minutes !== 'number' || minutes < 0) {
      return 0;
    }
    return Math.round((minutes / 60) * 100) / 100;
  },

  /**
   * Convert hours to minutes
   * @param {number} hours - Duration in hours
   * @returns {number} Duration in minutes
   */
  hoursToMinutes(hours) {
    if (typeof hours !== 'number' || hours < 0) {
      return 0;
    }
    return Math.round(hours * 60);
  },

  /**
   * Format duration based on user preference
   * @param {number} minutes - Duration in minutes
   * @param {string} timeUnit - User preference: 'minutes', 'hours', or 'both'
   * @param {boolean} showUnit - Whether to include unit labels
   * @returns {string} Formatted duration string
   */
  formatDuration(minutes, timeUnit = 'both', showUnit = true) {
    if (typeof minutes !== 'number' || minutes < 0) {
      return showUnit ? '0 min' : '0';
    }

    switch (timeUnit) {
      case 'minutes':
        return showUnit ? `${minutes} min` : minutes.toString();
      
      case 'hours':
        const hours = this.minutesToHours(minutes);
        return showUnit ? `${hours} hr` : hours.toString();
      
      case 'both':
      default:
        if (minutes < 60) {
          return showUnit ? `${minutes} min` : minutes.toString();
        } else {
          const hours = Math.floor(minutes / 60);
          const remainingMinutes = minutes % 60;
          
          if (remainingMinutes === 0) {
            return showUnit ? `${hours} hr` : hours.toString();
          } else {
            return showUnit ? 
              `${hours} hr ${remainingMinutes} min` : 
              `${hours}:${remainingMinutes.toString().padStart(2, '0')}`;
          }
        }
    }
  },

  /**
   * Format duration for input fields (always returns numeric value)
   * @param {number} minutes - Duration in minutes
   * @param {string} timeUnit - User preference: 'minutes', 'hours', or 'both'
   * @returns {number} Numeric value for input field
   */
  formatDurationForInput(minutes, timeUnit = 'both') {
    if (typeof minutes !== 'number' || minutes < 0) {
      return 0;
    }

    switch (timeUnit) {
      case 'minutes':
        return minutes;
      case 'hours':
        return this.minutesToHours(minutes);
      case 'both':
      default:
        // For 'both', default to minutes for input
        return minutes;
    }
  },

  /**
   * Parse duration input based on user preference
   * @param {string|number} input - User input value
   * @param {string} timeUnit - User preference: 'minutes', 'hours', or 'both'
   * @returns {number} Duration in minutes
   */
  parseDurationInput(input, timeUnit = 'both') {
    const numericValue = parseFloat(input);
    
    if (isNaN(numericValue) || numericValue < 0) {
      return 0;
    }

    switch (timeUnit) {
      case 'minutes':
        return Math.round(numericValue);
      case 'hours':
        return this.hoursToMinutes(numericValue);
      case 'both':
      default:
        // For 'both', assume input is in minutes unless specified otherwise
        return Math.round(numericValue);
    }
  },

  /**
   * Calculate total duration from an array of tasks
   * @param {Array} tasks - Array of task objects
   * @param {string} timeUnit - User preference for display
   * @param {boolean} showUnit - Whether to include unit labels
   * @returns {string} Formatted total duration
   */
  calculateTotalDuration(tasks, timeUnit = 'both', showUnit = true) {
    if (!Array.isArray(tasks)) {
      return showUnit ? '0 min' : '0';
    }

    const totalMinutes = tasks.reduce((total, task) => {
      return total + (task.duration || 0);
    }, 0);

    return this.formatDuration(totalMinutes, timeUnit, showUnit);
  },

  /**
   * Calculate weekly progress towards target
   * @param {Array} tasks - Array of task objects
   * @param {number} weeklyTargetHours - Target hours per week
   * @param {Date} weekStart - Start of the week (optional, defaults to current week)
   * @returns {Object} Progress information
   */
  calculateWeeklyProgress(tasks, weeklyTargetHours, weekStart = null) {
    if (!Array.isArray(tasks) || typeof weeklyTargetHours !== 'number') {
      return {
        completedHours: 0,
        targetHours: weeklyTargetHours || 0,
        percentage: 0,
        isOverTarget: false,
        remainingHours: weeklyTargetHours || 0
      };
    }

    // Calculate start and end of current week if not provided
    const now = new Date();
    const startOfWeek = weekStart || new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Filter tasks for current week and completed status
    const weeklyTasks = tasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return taskDate >= startOfWeek && 
             taskDate <= endOfWeek && 
             task.status === 'Complete';
    });

    // Calculate total completed minutes and convert to hours
    const totalMinutes = weeklyTasks.reduce((total, task) => {
      return total + (task.duration || 0);
    }, 0);

    const completedHours = this.minutesToHours(totalMinutes);
    const percentage = weeklyTargetHours > 0 ? 
      Math.round((completedHours / weeklyTargetHours) * 100) : 0;
    const isOverTarget = completedHours > weeklyTargetHours;
    const remainingHours = Math.max(0, weeklyTargetHours - completedHours);

    return {
      completedHours,
      targetHours: weeklyTargetHours,
      percentage: Math.min(percentage, 100), // Cap at 100% for display
      actualPercentage: percentage, // Actual percentage (can exceed 100%)
      isOverTarget,
      remainingHours,
      weeklyTasks: weeklyTasks.length,
      totalMinutes
    };
  },

  /**
   * Get unit label for display
   * @param {string} timeUnit - User preference: 'minutes', 'hours', or 'both'
   * @param {boolean} abbreviated - Whether to use abbreviated form
   * @returns {string} Unit label
   */
  getUnitLabel(timeUnit, abbreviated = true) {
    switch (timeUnit) {
      case 'minutes':
        return abbreviated ? 'min' : 'minutes';
      case 'hours':
        return abbreviated ? 'hr' : 'hours';
      case 'both':
      default:
        return abbreviated ? 'min/hr' : 'minutes/hours';
    }
  },

  /**
   * Validate duration input
   * @param {string|number} input - User input
   * @param {string} timeUnit - User preference
   * @returns {Object} Validation result
   */
  validateDurationInput(input, timeUnit = 'both') {
    const numericValue = parseFloat(input);
    
    if (isNaN(numericValue)) {
      return {
        isValid: false,
        error: 'Duration must be a valid number'
      };
    }

    if (numericValue < 0) {
      return {
        isValid: false,
        error: 'Duration cannot be negative'
      };
    }

    // Check for reasonable maximum values
    const maxMinutes = 24 * 60; // 24 hours
    const maxHours = 24;
    
    let actualMinutes;
    switch (timeUnit) {
      case 'minutes':
        actualMinutes = numericValue;
        if (actualMinutes > maxMinutes) {
          return {
            isValid: false,
            error: 'Duration cannot exceed 24 hours (1440 minutes)'
          };
        }
        break;
      case 'hours':
        actualMinutes = this.hoursToMinutes(numericValue);
        if (numericValue > maxHours) {
          return {
            isValid: false,
            error: 'Duration cannot exceed 24 hours'
          };
        }
        break;
      case 'both':
      default:
        actualMinutes = numericValue;
        if (actualMinutes > maxMinutes) {
          return {
            isValid: false,
            error: 'Duration cannot exceed 24 hours (1440 minutes)'
          };
        }
        break;
    }

    return {
      isValid: true,
      minutes: Math.round(actualMinutes)
    };
  },

  /**
   * Format time for display in various contexts
   * @param {number} minutes - Duration in minutes
   * @param {Object} options - Formatting options
   * @returns {string} Formatted time string
   */
  formatTime(minutes, options = {}) {
    const {
      timeUnit = 'both',
      showUnit = true,
      compact = false,
      precision = 2
    } = options;

    if (typeof minutes !== 'number' || minutes < 0) {
      return showUnit ? '0 min' : '0';
    }

    switch (timeUnit) {
      case 'minutes':
        return showUnit ? 
          `${minutes} ${compact ? 'min' : 'minute'}${minutes !== 1 ? 's' : ''}` : 
          minutes.toString();
      
      case 'hours':
        const hours = Math.round((minutes / 60) * Math.pow(10, precision)) / Math.pow(10, precision);
        return showUnit ? 
          `${hours} ${compact ? 'hr' : 'hour'}${hours !== 1 ? 's' : ''}` : 
          hours.toString();
      
      case 'both':
      default:
        if (minutes < 60) {
          return showUnit ? 
            `${minutes} ${compact ? 'min' : 'minute'}${minutes !== 1 ? 's' : ''}` : 
            minutes.toString();
        } else {
          const h = Math.floor(minutes / 60);
          const m = minutes % 60;
          
          if (m === 0) {
            return showUnit ? 
              `${h} ${compact ? 'hr' : 'hour'}${h !== 1 ? 's' : ''}` : 
              h.toString();
          } else {
            if (compact) {
              return showUnit ? `${h}h ${m}m` : `${h}:${m.toString().padStart(2, '0')}`;
            } else {
              const hourText = `${h} hour${h !== 1 ? 's' : ''}`;
              const minText = `${m} minute${m !== 1 ? 's' : ''}`;
              return showUnit ? `${hourText} ${minText}` : `${h}:${m.toString().padStart(2, '0')}`;
            }
          }
        }
    }
  }
};