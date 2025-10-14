/**
 * Component Registry - Manages UI components
 */

import { DashboardStatsComponent } from './components/dashboard-stats.js';
import { ProgressChartComponent } from './components/progress-chart.js';
import { TaskListComponent } from './components/task-list.js';

export class ComponentRegistry {
  constructor(state) {
    this.state = state;
    this.components = new Map();
    this.instances = new Map();
    
    // Register built-in components
    this.registerComponent('dashboard-stats', DashboardStatsComponent);
    this.registerComponent('progress-chart', ProgressChartComponent);
    this.registerComponent('task-list', TaskListComponent);
  }

  /**
   * Register a component class
   * @param {string} name - Component name
   * @param {Class} ComponentClass - Component class
   */
  registerComponent(name, ComponentClass) {
    this.components.set(name, ComponentClass);
  }

  /**
   * Get or create component instance
   * @param {string} name - Component name
   * @param {Object} options - Component options
   * @returns {Object} Component instance
   */
  getComponent(name, options = {}) {
    const instanceKey = `${name}-${JSON.stringify(options)}`;
    
    if (this.instances.has(instanceKey)) {
      return this.instances.get(instanceKey);
    }
    
    const ComponentClass = this.components.get(name);
    if (!ComponentClass) {
      throw new Error(`Component "${name}" not found`);
    }
    
    const instance = new ComponentClass(this.state, options);
    this.instances.set(instanceKey, instance);
    
    return instance;
  }

  /**
   * Render component by name
   * @param {string} name - Component name
   * @param {Object} options - Component options
   * @returns {string} Rendered HTML
   */
  renderComponent(name, options = {}) {
    const component = this.getComponent(name, options);
    return component.render();
  }

  /**
   * Update component in DOM
   * @param {string} name - Component name
   * @param {string} containerId - Container element ID
   * @param {Object} options - Component options
   */
  updateComponent(name, containerId, options = {}) {
    const component = this.getComponent(name, options);
    component.update(containerId);
  }

  /**
   * Clear component instances (for memory management)
   */
  clearInstances() {
    this.instances.clear();
  }

  /**
   * Get list of registered components
   * @returns {Array} Array of component names
   */
  getRegisteredComponents() {
    return Array.from(this.components.keys());
  }
}