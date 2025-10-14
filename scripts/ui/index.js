/**
 * UI Module Main Export
 * Provides a clean interface to the modular UI system
 */

export { UIManager } from './ui-manager.js';
export { ComponentRegistry } from './component-registry.js';
export { FocusManager } from './focus-manager.js';

// Export base classes for extensibility
export { BaseComponent, BasePage } from './ui-base.js';

// Export utility functions
export { 
  escapeHtml, 
  formatDate, 
  formatDuration, 
  highlightSearchText 
} from './ui-base.js';

export {
  filterTasks,
  sortTasks,
  searchTasks,
  getTagSuggestions,
  calculateTaskStats,
  calculateWeeklyProgress
} from './task-utils.js';

// Export components for direct use
export { DashboardStatsComponent } from './components/dashboard-stats.js';
export { ProgressChartComponent } from './components/progress-chart.js';
export { TaskListComponent } from './components/task-list.js';

// Export page renderers for direct use
export { AboutPage } from './pages/about-page.js';
export { DashboardPage } from './pages/dashboard-page.js';
export { TasksPage } from './pages/tasks-page.js';
export { SettingsPage } from './pages/settings-page.js';