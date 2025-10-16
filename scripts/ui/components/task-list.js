/**
 * Task List Component
 */

import { BaseComponent } from '../ui-base.js';
import { filterTasks, sortTasks, searchTasks } from '../task-utils.js';

export class TaskListComponent extends BaseComponent {
  render() {
    const tasks = this.state.getTasks();
    const uiState = this.state.getUIState();
    
    if (tasks.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state__icon">📝</div>
          <h3 class="empty-state__title">No tasks yet</h3>
          <p class="empty-state__description">
            Add your first task to get started with managing your academic workload.
          </p>
          <button class="btn btn--primary" data-action="add-task">
            Add Your First Task
          </button>
        </div>
      `;
    }
    
    // Apply filtering and sorting
    let filteredTasks = filterTasks(tasks, uiState.filterBy);
    filteredTasks = sortTasks(filteredTasks, uiState.sortBy);
    
    // Apply search if there's a query
    if (uiState.searchQuery) {
      filteredTasks = searchTasks(filteredTasks, uiState.searchQuery, uiState.searchMode);
    }
    
    if (filteredTasks.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state__icon">🔍</div>
          <h3 class="empty-state__title">No tasks found</h3>
          <p class="empty-state__description">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      `;
    }
    
    // Render based on view mode
    const viewMode = uiState.viewMode || 'table';
    
    let content;
    if (viewMode === 'card') {
      content = this.renderCardView(filteredTasks, uiState);
    } else {
      content = this.renderTableView(filteredTasks, uiState);
    }
    
    return `
      ${content}
      
      ${(uiState.selectedTasks || []).length > 0 ? `
        <div class="bulk-actions">
          <div class="bulk-actions__info">
            ${uiState.selectedTasks.length} task${uiState.selectedTasks.length !== 1 ? 's' : ''} selected
          </div>
          <div class="bulk-actions__buttons">
            <button class="btn btn--sm btn--secondary" data-action="bulk-complete">
              Mark Complete
            </button>
            <button class="btn btn--sm btn--secondary" data-action="bulk-pending">
              Mark Pending
            </button>
            <button class="btn btn--sm btn--danger" data-action="bulk-delete">
              Delete Selected
            </button>
          </div>
        </div>
      ` : ''}
    `;
  }

  renderTableView(filteredTasks, uiState) {
    return `
      <div class="task-table-container">
        <table class="task-table" role="table" aria-label="Tasks list">
          <thead>
            <tr>
              <th scope="col">
                <input type="checkbox" id="select-all-tasks" aria-label="Select all tasks">
              </th>
              <th scope="col">Task</th>
              <th scope="col">Due Date</th>
              <th scope="col">Duration</th>
              <th scope="col">Category</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTasks.map(task => this.renderTaskRow(task, uiState)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderCardView(filteredTasks, uiState) {
    return `
      <div class="task-cards-container">
        <div class="task-cards-header">
          <input type="checkbox" id="select-all-tasks" aria-label="Select all tasks">
          <span class="select-all-label">Select All</span>
        </div>
        <div class="task-cards-grid">
          ${filteredTasks.map(task => this.renderTaskCard(task, uiState)).join('')}
        </div>
      </div>
    `;
  }

  renderTaskCard(task, uiState) {
    const isOverdue = new Date(task.dueDate) < new Date() && task.status === 'Pending';
    const isDueToday = new Date(task.dueDate).toDateString() === new Date().toDateString();
    
    return `
      <div class="task-card ${task.status === 'Complete' ? 'task-card--completed' : ''} ${isOverdue ? 'task-card--overdue' : ''} ${isDueToday ? 'task-card--due-today' : ''}" data-task-id="${task.id}">
        <div class="task-card__header">
          <input 
            type="checkbox" 
            class="task-checkbox" 
            data-task-id="${task.id}"
            aria-label="Select task: ${this.escapeHtml(task.title)}"
            ${(uiState.selectedTasks || []).includes(task.id) ? 'checked' : ''}
          >
          <button 
            class="status-toggle ${task.status === 'Complete' ? 'status-toggle--complete' : 'status-toggle--pending'}"
            data-action="toggle-task-status"
            data-task-id="${task.id}"
            aria-label="Mark task as ${task.status === 'Complete' ? 'pending' : 'complete'}"
          >
            ${task.status === 'Complete' ? '✓' : '○'}
          </button>
        </div>
        
        <div class="task-card__body">
          <h3 class="task-card__title" data-action="edit-task-inline" data-task-id="${task.id}" tabindex="0" role="button" aria-label="Edit task title">
            ${this.highlightSearchText(this.escapeHtml(task.title), uiState.searchQuery, uiState.searchMode)}
          </h3>
          
          <div class="task-card__meta">
            <div class="task-card__due-date">
              <span class="task-card__label">Due:</span>
              <time datetime="${task.dueDate}">${this.formatDate(task.dueDate)}</time>
              ${isOverdue ? '<span class="task-card__overdue-badge">Overdue</span>' : ''}
              ${isDueToday ? '<span class="task-card__due-today-badge">Due Today</span>' : ''}
            </div>
            
            <div class="task-card__duration">
              <span class="task-card__label">Duration:</span>
              <span>${this.formatDuration(task.duration)}</span>
            </div>
            
            <div class="task-card__category">
              <span class="task-card__label">Category:</span>
              <span class="task-tag">${this.highlightSearchText(this.escapeHtml(task.tag || 'General'), uiState.searchQuery, uiState.searchMode)}</span>
            </div>
          </div>
        </div>
        
        <div class="task-card__actions">
          <button 
            class="btn btn--sm btn--secondary" 
            data-action="edit-task"
            data-task-id="${task.id}"
            aria-label="Edit task"
          >
            Edit
          </button>
          <button 
            class="btn btn--sm btn--danger" 
            data-action="delete-task"
            data-task-id="${task.id}"
            aria-label="Delete task"
          >
            Delete
          </button>
        </div>
      </div>
    `;
  }

  renderTaskRow(task, uiState) {
    return `
      <tr class="task-row ${task.status === 'Complete' ? 'task-row--completed' : ''}" data-task-id="${task.id}">
        <td class="task-cell task-cell--checkbox">
          <input 
            type="checkbox" 
            class="task-checkbox" 
            data-task-id="${task.id}"
            aria-label="Select task: ${this.escapeHtml(task.title)}"
            ${(uiState.selectedTasks || []).includes(task.id) ? 'checked' : ''}
          >
        </td>
        <td class="task-cell task-cell--title">
          <div class="task-title" data-action="edit-task-inline" data-task-id="${task.id}" tabindex="0" role="button" aria-label="Edit task title">
            ${this.highlightSearchText(this.escapeHtml(task.title), uiState.searchQuery, uiState.searchMode)}
          </div>
        </td>
        <td class="task-cell">
          <time datetime="${task.dueDate}">${this.formatDate(task.dueDate)}</time>
        </td>
        <td class="task-cell">
          ${this.formatDuration(task.duration)}
        </td>
        <td class="task-cell">
          <span class="task-tag">${this.highlightSearchText(this.escapeHtml(task.tag || 'General'), uiState.searchQuery, uiState.searchMode)}</span>
        </td>
        <td class="task-cell task-cell--status">
          <button 
            class="status-toggle ${task.status === 'Complete' ? 'status-toggle--complete' : 'status-toggle--pending'}"
            data-action="toggle-task-status"
            data-task-id="${task.id}"
            aria-label="Mark task as ${task.status === 'Complete' ? 'pending' : 'complete'}"
          >
            ${task.status === 'Complete' ? '✓ Complete' : '○ Pending'}
          </button>
        </td>
        <td class="task-cell task-cell--actions">
          <div class="task-actions">
            <button 
              class="btn btn--sm btn--secondary" 
              data-action="edit-task"
              data-task-id="${task.id}"
              aria-label="Edit task"
            >
              Edit
            </button>
            <button 
              class="btn btn--sm btn--danger" 
              data-action="delete-task"
              data-task-id="${task.id}"
              aria-label="Delete task"
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }
}