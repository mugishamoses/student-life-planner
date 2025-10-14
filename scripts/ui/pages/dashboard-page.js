/**
 * Dashboard Page Renderer
 */

import { BasePage } from '../ui-base.js';
import { DashboardStatsComponent } from '../components/dashboard-stats.js';
import { ProgressChartComponent } from '../components/progress-chart.js';

export class DashboardPage extends BasePage {
  constructor(state, eventManager) {
    super(state, eventManager);
    this.dashboardStats = new DashboardStatsComponent(state);
    this.progressChart = new ProgressChartComponent(state);
  }

  render() {
    const tasks = this.state.getTasks();
    
    // Calculate upcoming tasks for current week
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const upcomingTasks = tasks.filter(task => {
      const dueDate = new Date(task.dueDate);
      return dueDate >= weekStart && dueDate <= weekEnd && task.status === 'Pending';
    });
    
    return `
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">Dashboard</h1>
          <p class="page-description">
            Overview of your academic progress and task statistics.
          </p>
        </div>
        
        <div id="dashboard-stats" class="dashboard-stats">
          ${this.dashboardStats.render()}
        </div>
        
        <div class="grid grid--2-col mt-6">
          <div class="card">
            <div class="card__header">
              <h2 class="card__title">Weekly Progress</h2>
            </div>
            <div class="card__body">
              <div id="progress-chart" class="progress-section">
                ${this.progressChart.render()}
              </div>
            </div>
          </div>
          
          <div class="card">
            <div class="card__header">
              <h2 class="card__title">This Week's Tasks</h2>
            </div>
            <div class="card__body">
              ${upcomingTasks.length > 0 ? `
                <div class="upcoming-tasks">
                  ${upcomingTasks.slice(0, 5).map(task => `
                    <div class="upcoming-task">
                      <div class="upcoming-task__title">${this.escapeHtml(task.title)}</div>
                      <div class="upcoming-task__meta">
                        <span class="upcoming-task__date">${this.formatDate(task.dueDate)}</span>
                        <span class="upcoming-task__tag">${this.escapeHtml(task.tag || 'General')}</span>
                      </div>
                    </div>
                  `).join('')}
                  ${upcomingTasks.length > 5 ? `
                    <div class="upcoming-task upcoming-task--more">
                      <a href="#tasks" class="upcoming-task__link">
                        View ${upcomingTasks.length - 5} more tasks
                      </a>
                    </div>
                  ` : ''}
                </div>
              ` : `
                <div class="empty-state empty-state--small">
                  <p>No tasks due this week</p>
                  <button class="btn btn--sm btn--primary" data-action="navigate" data-page="tasks">
                    Add Task
                  </button>
                </div>
              `}
            </div>
          </div>
        </div>
        
        <div class="card mt-6">
          <div class="card__header">
            <h2 class="card__title">Quick Actions</h2>
          </div>
          <div class="card__body">
            <div class="quick-actions">
              <button class="btn btn--primary" data-action="add-task">
                Add New Task
              </button>
              <button class="btn btn--secondary" data-action="navigate" data-page="tasks">
                View All Tasks
              </button>
              <button class="btn btn--secondary" data-action="navigate" data-page="settings">
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // Navigation buttons
    document.querySelectorAll('[data-action="navigate"]').forEach(button => {
      button.addEventListener('click', (e) => {
        const page = e.target.dataset.page;
        if (page && this.eventManager) {
          this.eventManager.emit('navigate', { page });
        }
      });
    });

    // Add task button
    document.querySelectorAll('[data-action="add-task"]').forEach(button => {
      button.addEventListener('click', () => {
        if (this.eventManager) {
          this.eventManager.emit('add-task');
        }
      });
    });
  }

  updateComponents() {
    this.dashboardStats.update('dashboard-stats');
    this.progressChart.update('progress-chart');
  }
}