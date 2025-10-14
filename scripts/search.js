/**
 * Search module with safe regex compilation and advanced search capabilities
 * Implements requirements 6.3, 6.4, 9.1, 9.2
 */

/**
 * Safely compiles a regex pattern with error handling
 * @param {string} pattern - The regex pattern to compile
 * @param {string} flags - Optional regex flags (i, g, m, etc.)
 * @returns {RegExp|null} Compiled regex or null if invalid
 */
export function compileRegex(pattern, flags = '') {
  try {
    // Sanitize the pattern to prevent ReDoS attacks
    if (typeof pattern !== 'string' || pattern.length > 1000) {
      console.warn('Invalid or overly complex regex pattern');
      return null;
    }

    // Create and test the regex
    const regex = new RegExp(pattern, flags);
    
    // Test with empty string to catch some problematic patterns
    regex.test('');
    
    return regex;
  } catch (error) {
    console.warn('Failed to compile regex pattern:', pattern, error.message);
    return null;
  }
}

/**
 * Search modes available in the application
 */
export const SearchModes = {
  TEXT: 'text',
  REGEX: 'regex'
};

/**
 * Search configuration options
 */
export const SearchOptions = {
  CASE_SENSITIVE: 'caseSensitive',
  CASE_INSENSITIVE: 'caseInsensitive'
};

/**
 * Main search class that handles different search modes and options
 */
export class SearchEngine {
  constructor() {
    this.currentMode = SearchModes.TEXT;
    this.caseSensitive = false;
    this.lastCompiledRegex = null;
    this.lastPattern = '';
    this.lastFlags = '';
  }

  /**
   * Set search mode (text or regex)
   * @param {string} mode - Search mode from SearchModes
   */
  setMode(mode) {
    if (Object.values(SearchModes).includes(mode)) {
      this.currentMode = mode;
    } else {
      console.warn('Invalid search mode:', mode);
    }
  }

  /**
   * Set case sensitivity for searches
   * @param {boolean} caseSensitive - Whether search should be case sensitive
   */
  setCaseSensitive(caseSensitive) {
    this.caseSensitive = Boolean(caseSensitive);
  }

  /**
   * Get current search configuration
   * @returns {Object} Current search configuration
   */
  getConfig() {
    return {
      mode: this.currentMode,
      caseSensitive: this.caseSensitive
    };
  }

  /**
   * Prepare search pattern based on current mode and options
   * @param {string} query - Search query
   * @returns {RegExp|null} Compiled regex for searching
   */
  prepareSearchPattern(query) {
    if (!query || typeof query !== 'string') {
      return null;
    }

    const flags = this.caseSensitive ? 'g' : 'gi';

    if (this.currentMode === SearchModes.TEXT) {
      // For text mode, escape special regex characters
      const escapedQuery = this.escapeRegexChars(query);
      return this.compileAndCache(escapedQuery, flags);
    } else if (this.currentMode === SearchModes.REGEX) {
      // For regex mode, use the query as-is but with safe compilation
      return this.compileAndCache(query, flags);
    }

    return null;
  }

  /**
   * Escape special regex characters for text search
   * @param {string} text - Text to escape
   * @returns {string} Escaped text safe for regex
   */
  escapeRegexChars(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Compile regex with caching to avoid recompilation
   * @param {string} pattern - Regex pattern
   * @param {string} flags - Regex flags
   * @returns {RegExp|null} Compiled regex
   */
  compileAndCache(pattern, flags) {
    // Check if we can reuse the last compiled regex
    if (this.lastPattern === pattern && this.lastFlags === flags && this.lastCompiledRegex) {
      return this.lastCompiledRegex;
    }

    // Compile new regex
    const regex = compileRegex(pattern, flags);
    
    // Cache the result
    this.lastPattern = pattern;
    this.lastFlags = flags;
    this.lastCompiledRegex = regex;

    return regex;
  }

  /**
   * Search for matches in a text string
   * @param {string} text - Text to search in
   * @param {string} query - Search query
   * @returns {Array} Array of match objects with position and text
   */
  findMatches(text, query) {
    if (!text || !query) {
      return [];
    }

    const regex = this.prepareSearchPattern(query);
    if (!regex) {
      return [];
    }

    const matches = [];
    let match;

    // Reset regex lastIndex to ensure we start from the beginning
    regex.lastIndex = 0;

    try {
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          text: match[0],
          index: match.index,
          length: match[0].length
        });

        // Prevent infinite loop on zero-length matches
        if (match[0].length === 0) {
          regex.lastIndex++;
        }

        // Safety check to prevent runaway regex
        if (matches.length > 1000) {
          console.warn('Too many matches found, stopping search');
          break;
        }
      }
    } catch (error) {
      console.warn('Error during regex execution:', error);
      return [];
    }

    return matches;
  }

  /**
   * Check if a text contains the search query
   * @param {string} text - Text to search in
   * @param {string} query - Search query
   * @returns {boolean} True if text contains the query
   */
  hasMatch(text, query) {
    if (!text || !query) {
      return false;
    }

    const regex = this.prepareSearchPattern(query);
    if (!regex) {
      return false;
    }

    try {
      return regex.test(text);
    } catch (error) {
      console.warn('Error testing regex:', error);
      return false;
    }
  }

  /**
   * Highlight matches in text using accessible <mark> tags
   * Implements requirements 6.4, 9.4 for screen reader compatibility
   * @param {string} text - Text to highlight matches in
   * @param {string} query - Search query
   * @param {Object} options - Highlighting options
   * @returns {string} Text with accessible highlighted matches
   */
  highlightMatches(text, query, options = {}) {
    if (!text || !query) {
      return text;
    }

    const matches = this.findMatches(text, query);
    if (matches.length === 0) {
      return text;
    }

    // Sort matches by index in descending order to avoid offset issues
    matches.sort((a, b) => b.index - a.index);

    let highlightedText = text;
    const matchCount = matches.length;

    // Replace matches with accessible highlighted versions
    matches.forEach((match, index) => {
      const before = highlightedText.substring(0, match.index);
      const matchText = highlightedText.substring(match.index, match.index + match.length);
      const after = highlightedText.substring(match.index + match.length);
      
      // Create accessible mark element with ARIA attributes
      const markElement = this.createAccessibleMark(matchText, {
        matchNumber: matchCount - index, // Reverse index for correct numbering
        totalMatches: matchCount,
        searchTerm: query,
        ...options
      });
      
      highlightedText = before + markElement + after;
    });

    return highlightedText;
  }

  /**
   * Create an accessible <mark> element with proper ARIA attributes
   * @param {string} matchText - The matched text to highlight
   * @param {Object} options - Options for the mark element
   * @returns {string} HTML string for accessible mark element
   */
  createAccessibleMark(matchText, options = {}) {
    const {
      matchNumber = 1,
      totalMatches = 1,
      searchTerm = '',
      includeAriaLabel = true,
      className = 'search-highlight'
    } = options;

    const escapedText = this.escapeHtml(matchText);
    
    if (!includeAriaLabel) {
      return `<mark class="${className}">${escapedText}</mark>`;
    }

    // Create descriptive ARIA label for screen readers
    const ariaLabel = totalMatches > 1 
      ? `Search result ${matchNumber} of ${totalMatches} for "${searchTerm}": ${matchText}`
      : `Search result for "${searchTerm}": ${matchText}`;

    return `<mark class="${className}" aria-label="${this.escapeHtml(ariaLabel)}" role="mark">${escapedText}</mark>`;
  }

  /**
   * Highlight matches with screen reader announcements
   * @param {string} text - Text to highlight matches in
   * @param {string} query - Search query
   * @param {Function} announceCallback - Callback to announce results to screen readers
   * @returns {string} Text with highlighted matches
   */
  highlightMatchesWithAnnouncement(text, query, announceCallback) {
    const highlightedText = this.highlightMatches(text, query);
    const matches = this.findMatches(text, query);
    
    if (matches.length > 0 && typeof announceCallback === 'function') {
      const announcement = matches.length === 1
        ? `Found 1 match for "${query}"`
        : `Found ${matches.length} matches for "${query}"`;
      
      // Announce results politely to screen readers
      announceCallback(announcement, 'polite');
    }
    
    return highlightedText;
  }

  /**
   * Escape HTML characters to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} HTML-escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Remove highlighting from text while preserving accessibility
   * @param {string} text - Text with highlighting
   * @param {Function} announceCallback - Optional callback to announce clearing
   * @returns {string} Text without highlighting
   */
  removeHighlighting(text, announceCallback) {
    if (!text) return text;
    
    // Check if there were highlights to remove
    const hadHighlights = /<mark[^>]*>.*?<\/mark>/gi.test(text);
    
    // Remove <mark> tags but keep the content
    const cleanText = text.replace(/<mark[^>]*>(.*?)<\/mark>/gi, '$1');
    
    // Announce clearing to screen readers if highlights were removed
    if (hadHighlights && typeof announceCallback === 'function') {
      announceCallback('Search highlights cleared', 'polite');
    }
    
    return cleanText;
  }

  /**
   * Create accessible search result summary
   * @param {number} totalResults - Total number of search results
   * @param {string} query - Search query
   * @param {string} filterType - Current filter type
   * @returns {string} Accessible summary text
   */
  createSearchSummary(totalResults, query, filterType = 'all') {
    if (!query) {
      return filterType === 'all' 
        ? `Showing all tasks`
        : `Showing ${filterType} tasks`;
    }

    const filterText = filterType === 'all' ? '' : ` in ${filterType} tasks`;
    
    if (totalResults === 0) {
      return `No results found for "${query}"${filterText}`;
    } else if (totalResults === 1) {
      return `Found 1 result for "${query}"${filterText}`;
    } else {
      return `Found ${totalResults} results for "${query}"${filterText}`;
    }
  }

  /**
   * Get accessible search instructions
   * @returns {string} Instructions for screen reader users
   */
  getSearchInstructions() {
    return 'Use the search field to find tasks. Results will be announced as you type. ' +
           'Press Escape to clear search. Use Tab to navigate through results.';
  }

  /**
   * Validate a regex pattern without compiling it
   * @param {string} pattern - Regex pattern to validate
   * @returns {Object} Validation result with isValid and error properties
   */
  validateRegexPattern(pattern) {
    try {
      new RegExp(pattern);
      return { isValid: true, error: null };
    } catch (error) {
      return { 
        isValid: false, 
        error: error.message 
      };
    }
  }
}

// Create a default search engine instance
export const searchEngine = new SearchEngine();

/**
 * Task filtering and sorting functionality
 * Implements requirements 6.1, 6.2
 */

/**
 * Available sort options for tasks
 */
export const SortOptions = {
  DATE_NEWEST: 'date-newest',
  DATE_OLDEST: 'date-oldest',
  TITLE_A_Z: 'title-a-z',
  TITLE_Z_A: 'title-z-a',
  DURATION_ASC: 'duration-asc',
  DURATION_DESC: 'duration-desc',
  CREATED_NEWEST: 'created-newest',
  CREATED_OLDEST: 'created-oldest'
};

/**
 * Available filter options for tasks
 */
export const FilterOptions = {
  ALL: 'all',
  TODAY: 'today',
  WEEK: 'week',
  OVERDUE: 'overdue',
  PENDING: 'pending',
  COMPLETED: 'completed'
};

/**
 * Task filtering and sorting utility class
 */
export class TaskManager {
  constructor() {
    this.searchEngine = new SearchEngine();
  }

  /**
   * Filter tasks based on the specified filter type
   * @param {Array} tasks - Array of task objects
   * @param {string} filterType - Filter type from FilterOptions
   * @returns {Array} Filtered array of tasks
   */
  filterTasks(tasks, filterType = FilterOptions.ALL) {
    if (!Array.isArray(tasks)) {
      return [];
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today);
    weekFromNow.setDate(today.getDate() + 7);

    switch (filterType) {
      case FilterOptions.ALL:
        return [...tasks];

      case FilterOptions.TODAY:
        return tasks.filter(task => {
          const dueDate = new Date(task.dueDate);
          return dueDate.toDateString() === today.toDateString();
        });

      case FilterOptions.WEEK:
        return tasks.filter(task => {
          const dueDate = new Date(task.dueDate);
          return dueDate >= today && dueDate <= weekFromNow;
        });

      case FilterOptions.OVERDUE:
        return tasks.filter(task => {
          const dueDate = new Date(task.dueDate);
          return dueDate < today && task.status !== 'Complete';
        });

      case FilterOptions.PENDING:
        return tasks.filter(task => task.status === 'Pending');

      case FilterOptions.COMPLETED:
        return tasks.filter(task => task.status === 'Complete');

      default:
        console.warn('Unknown filter type:', filterType);
        return [...tasks];
    }
  }

  /**
   * Sort tasks based on the specified sort option
   * @param {Array} tasks - Array of task objects
   * @param {string} sortBy - Sort option from SortOptions
   * @returns {Array} Sorted array of tasks
   */
  sortTasks(tasks, sortBy = SortOptions.DATE_NEWEST) {
    if (!Array.isArray(tasks)) {
      return [];
    }

    const sortedTasks = [...tasks];

    switch (sortBy) {
      case SortOptions.DATE_NEWEST:
        return sortedTasks.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));

      case SortOptions.DATE_OLDEST:
        return sortedTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

      case SortOptions.TITLE_A_Z:
        return sortedTasks.sort((a, b) => a.title.localeCompare(b.title, undefined, { 
          sensitivity: 'base',
          numeric: true 
        }));

      case SortOptions.TITLE_Z_A:
        return sortedTasks.sort((a, b) => b.title.localeCompare(a.title, undefined, { 
          sensitivity: 'base',
          numeric: true 
        }));

      case SortOptions.DURATION_ASC:
        return sortedTasks.sort((a, b) => parseFloat(a.duration) - parseFloat(b.duration));

      case SortOptions.DURATION_DESC:
        return sortedTasks.sort((a, b) => parseFloat(b.duration) - parseFloat(a.duration));

      case SortOptions.CREATED_NEWEST:
        return sortedTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      case SortOptions.CREATED_OLDEST:
        return sortedTasks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      default:
        console.warn('Unknown sort option:', sortBy);
        return sortedTasks;
    }
  }

  /**
   * Search tasks using the search engine
   * @param {Array} tasks - Array of task objects
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Array} Array of tasks that match the search
   */
  searchTasks(tasks, query, options = {}) {
    if (!Array.isArray(tasks) || !query || query.trim() === '') {
      return tasks;
    }

    // Configure search engine
    if (options.mode) {
      this.searchEngine.setMode(options.mode);
    }
    if (typeof options.caseSensitive === 'boolean') {
      this.searchEngine.setCaseSensitive(options.caseSensitive);
    }

    // Define searchable fields
    const searchableFields = ['title', 'tag'];
    
    return tasks.filter(task => {
      return searchableFields.some(field => {
        const fieldValue = task[field];
        if (!fieldValue) return false;
        
        return this.searchEngine.hasMatch(String(fieldValue), query);
      });
    });
  }

  /**
   * Apply multiple operations: search, filter, and sort
   * @param {Array} tasks - Array of task objects
   * @param {Object} operations - Object containing search, filter, and sort options
   * @returns {Array} Processed array of tasks
   */
  processTasks(tasks, operations = {}) {
    let processedTasks = [...tasks];

    // Apply search first
    if (operations.search && operations.search.query) {
      processedTasks = this.searchTasks(processedTasks, operations.search.query, operations.search.options);
    }

    // Apply filter
    if (operations.filter) {
      processedTasks = this.filterTasks(processedTasks, operations.filter);
    }

    // Apply sort
    if (operations.sort) {
      processedTasks = this.sortTasks(processedTasks, operations.sort);
    }

    return processedTasks;
  }

  /**
   * Get tasks for real-time updates with search highlighting
   * @param {Array} tasks - Array of task objects
   * @param {Object} operations - Processing operations
   * @returns {Object} Processed tasks with metadata
   */
  getProcessedTasksWithHighlighting(tasks, operations = {}) {
    const processedTasks = this.processTasks(tasks, operations);
    
    // Add highlighting if there's a search query
    if (operations.search && operations.search.query) {
      const highlightedTasks = processedTasks.map(task => ({
        ...task,
        highlightedTitle: this.searchEngine.highlightMatches(task.title, operations.search.query),
        highlightedTag: this.searchEngine.highlightMatches(task.tag, operations.search.query)
      }));

      return {
        tasks: highlightedTasks,
        totalCount: tasks.length,
        filteredCount: processedTasks.length,
        hasSearch: true,
        searchQuery: operations.search.query
      };
    }

    return {
      tasks: processedTasks,
      totalCount: tasks.length,
      filteredCount: processedTasks.length,
      hasSearch: false,
      searchQuery: null
    };
  }

  /**
   * Get available filter options with counts
   * @param {Array} tasks - Array of task objects
   * @returns {Object} Filter options with task counts
   */
  getFilterCounts(tasks) {
    if (!Array.isArray(tasks)) {
      return {};
    }

    const counts = {};
    
    Object.values(FilterOptions).forEach(filter => {
      counts[filter] = this.filterTasks(tasks, filter).length;
    });

    return counts;
  }

  /**
   * Get search suggestions based on existing task data
   * @param {Array} tasks - Array of task objects
   * @param {string} query - Partial search query
   * @returns {Array} Array of search suggestions
   */
  getSearchSuggestions(tasks, query) {
    if (!Array.isArray(tasks) || !query || query.length < 2) {
      return [];
    }

    const suggestions = new Set();
    const lowerQuery = query.toLowerCase();

    tasks.forEach(task => {
      // Check title words
      if (task.title) {
        const titleWords = task.title.toLowerCase().split(/\s+/);
        titleWords.forEach(word => {
          if (word.includes(lowerQuery) && word !== lowerQuery) {
            suggestions.add(word);
          }
        });
      }

      // Check tags
      if (task.tag && task.tag.toLowerCase().includes(lowerQuery)) {
        suggestions.add(task.tag);
      }
    });

    return Array.from(suggestions).slice(0, 10); // Limit to 10 suggestions
  }
}

/**
 * Accessibility utilities for search and highlighting
 * Implements requirements 6.4, 9.4 for screen reader compatibility
 */
export class AccessibilityManager {
  constructor() {
    this.politeRegion = null;
    this.assertiveRegion = null;
    this.init();
  }

  /**
   * Initialize ARIA live regions for announcements
   */
  init() {
    this.politeRegion = this.getOrCreateLiveRegion('search-announcements-polite', 'polite');
    this.assertiveRegion = this.getOrCreateLiveRegion('search-announcements-assertive', 'assertive');
  }

  /**
   * Get or create an ARIA live region
   * @param {string} id - ID for the live region
   * @param {string} politeness - 'polite' or 'assertive'
   * @returns {HTMLElement} The live region element
   */
  getOrCreateLiveRegion(id, politeness) {
    let region = document.getElementById(id);
    
    if (!region) {
      region = document.createElement('div');
      region.id = id;
      region.setAttribute('aria-live', politeness);
      region.setAttribute('aria-atomic', 'true');
      region.className = 'sr-only';
      region.style.cssText = `
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      `;
      
      document.body.appendChild(region);
    }
    
    return region;
  }

  /**
   * Announce message to screen readers
   * @param {string} message - Message to announce
   * @param {string} politeness - 'polite' or 'assertive'
   */
  announce(message, politeness = 'polite') {
    if (!message) return;

    const region = politeness === 'assertive' ? this.assertiveRegion : this.politeRegion;
    
    if (region) {
      // Clear the region first to ensure the message is announced
      region.textContent = '';
      
      // Use setTimeout to ensure the clearing is processed before setting new content
      setTimeout(() => {
        region.textContent = message;
      }, 100);
    }
  }

  /**
   * Clear all announcements
   */
  clearAnnouncements() {
    if (this.politeRegion) {
      this.politeRegion.textContent = '';
    }
    if (this.assertiveRegion) {
      this.assertiveRegion.textContent = '';
    }
  }

  /**
   * Announce search results with appropriate politeness
   * @param {number} resultCount - Number of search results
   * @param {string} query - Search query
   * @param {boolean} isRealTime - Whether this is a real-time search update
   */
  announceSearchResults(resultCount, query, isRealTime = true) {
    if (!query) return;

    const politeness = isRealTime ? 'polite' : 'assertive';
    let message;

    if (resultCount === 0) {
      message = `No results found for "${query}"`;
    } else if (resultCount === 1) {
      message = `1 result found for "${query}"`;
    } else {
      message = `${resultCount} results found for "${query}"`;
    }

    this.announce(message, politeness);
  }

  /**
   * Announce filter changes
   * @param {string} filterType - New filter type
   * @param {number} taskCount - Number of tasks in filter
   */
  announceFilterChange(filterType, taskCount) {
    const message = `Filter changed to ${filterType}. ${taskCount} tasks shown.`;
    this.announce(message, 'polite');
  }

  /**
   * Announce sort changes
   * @param {string} sortType - New sort type
   */
  announceSortChange(sortType) {
    const message = `Tasks sorted by ${sortType.replace('-', ' ')}`;
    this.announce(message, 'polite');
  }
}

// Create default instances
export const accessibilityManager = new AccessibilityManager();
export const taskManager = new TaskManager();

// Export utility functions
export {
  compileRegex as default,
  SearchModes,
  SearchOptions,
  SortOptions,
  FilterOptions,
  AccessibilityManager
};