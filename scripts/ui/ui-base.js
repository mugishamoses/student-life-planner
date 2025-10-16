/**
 * Base UI utilities and shared functionality
 */

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
export function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format date for display with relative formatting
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export function formatDate(dateString) {
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
 * Format duration for display based on settings
 * @param {number} minutes - Duration in minutes
 * @param {Object} settings - User settings
 * @returns {string} Formatted duration
 */
export function formatDuration(minutes, settings = {}) {
  if (!minutes || minutes === 0) return '0 min';
  
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
 * Highlight search text in content
 * @param {string} text - Text to highlight
 * @param {string} query - Search query
 * @param {string} mode - Search mode ('text' or 'regex')
 * @returns {string} Text with highlighted matches
 */
export function highlightSearchText(text, query, mode = 'text') {
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
 * Base class for UI components
 */
export class BaseComponent {
  constructor(state, options = {}) {
    this.state = state;
    this.options = options;
    this.element = null;
  }

  /**
   * Render the component
   * @returns {string} HTML string
   */
  render() {
    throw new Error('render() method must be implemented by subclass');
  }

  /**
   * Update the component in the DOM
   * @param {string} containerId - ID of container element
   */
  update(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = this.render();
      // Re-setup event listeners after updating DOM
      if (this.setupEventListeners) {
        this.setupEventListeners();
      }
    }
  }

  /**
   * Get escaped HTML helper
   */
  escapeHtml(text) {
    return escapeHtml(text);
  }

  /**
   * Get formatted date helper
   */
  formatDate(dateString) {
    return formatDate(dateString);
  }

  /**
   * Get formatted duration helper
   */
  formatDuration(minutes) {
    return formatDuration(minutes, this.state.getSettings());
  }

  /**
   * Get highlighted search text helper
   */
  highlightSearchText(text, query, mode) {
    return highlightSearchText(text, query, mode);
  }
}

/**
 * Base class for page renderers
 */
export class BasePage {
  constructor(state, eventManager = null) {
    this.state = state;
    this.eventManager = eventManager;
  }

  /**
   * Render the page
   * @returns {string} HTML string
   */
  render() {
    throw new Error('render() method must be implemented by subclass');
  }

  /**
   * Setup page-specific event listeners
   */
  setupEventListeners() {
    // Override in subclasses
  }

  /**
   * Cleanup page resources
   */
  cleanup() {
    // Override in subclasses
  }

  /**
   * Get escaped HTML helper
   */
  escapeHtml(text) {
    return escapeHtml(text);
  }

  /**
   * Get formatted date helper
   */
  formatDate(dateString) {
    return formatDate(dateString);
  }

  /**
   * Get formatted duration helper
   */
  formatDuration(minutes) {
    return formatDuration(minutes, this.state.getSettings());
  }
}