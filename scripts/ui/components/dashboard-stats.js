/**
 * Dashboard Statistics Component
 */

import { BaseComponent } from '../ui-base.js';
import { calculateTaskStats } from '../task-utils.js';

export class DashboardStatsComponent extends BaseComponent {
  render() {
    const tasks = this.state.getTasks();
    const stats = calculateTaskStats(tasks);
    
    return `
      <div class="stats-grid">
        <div class="stat-card stat-card--primary">
          <div class="stat-card__value">${stats.totalTasks}</div>
          <div class="stat-card__label">Total Tasks</div>
          <div class="stat-card__detail">${stats.pendingTasks} pending</div>
        </div>
        
        <div class="stat-card stat-card--success">
          <div class="stat-card__value">${stats.totalHoursPlanned.toFixed(1)}h</div>
          <div class="stat-card__label">Total Hours Planned</div>
          <div class="stat-card__detail">${stats.completedHours.toFixed(1)}h completed</div>
        </div>
        
        <div class="stat-card stat-card--info">
          <div class="stat-card__value">${this.escapeHtml(stats.topTag)}</div>
          <div class="stat-card__label">Top Category</div>
          <div class="stat-card__detail">${stats.maxCount} task${stats.maxCount !== 1 ? 's' : ''}</div>
        </div>
        
        <div class="stat-card ${stats.upcomingThisWeek > 0 ? 'stat-card--warning' : 'stat-card--neutral'}">
          <div class="stat-card__value">${stats.upcomingThisWeek}</div>
          <div class="stat-card__label">This Week</div>
          <div class="stat-card__detail">
            ${stats.overdueTasks > 0 ? `${stats.overdueTasks} overdue` : 'On track'}
          </div>
        </div>
      </div>
      
      ${stats.totalTasks > 0 ? `
        <div class="stats-summary mt-4">
          <div class="stats-summary__item">
            <span class="stats-summary__label">Completion Rate:</span>
            <span class="stats-summary__value">${stats.completionRate.toFixed(1)}%</span>
          </div>
          <div class="stats-summary__item">
            <span class="stats-summary__label">Average Task Duration:</span>
            <span class="stats-summary__value">${stats.averageTaskDuration.toFixed(1)}h</span>
          </div>
          ${stats.overdueTasks > 0 ? `
            <div class="stats-summary__item stats-summary__item--warning">
              <span class="stats-summary__label">⚠️ Overdue Tasks:</span>
              <span class="stats-summary__value">${stats.overdueTasks}</span>
            </div>
          ` : ''}
        </div>
      ` : ''}
    `;
  }
}