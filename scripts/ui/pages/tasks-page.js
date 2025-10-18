/**
 * Tasks Page Renderer
 */

import { BasePage } from '../ui-base.js';
import { TaskListComponent } from '../components/task-list.js';

export class TasksPage extends BasePage {
  constructor(state, eventManager) {
    super(state, eventManager);
    this.taskList = new TaskListComponent(state);
  }

  render() {
    const tasks = this.state.getTasks();
    const uiState = this.state.getUIState();
    
    return `
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">Tasks</h1>
          <p class="page-description">
            Manage your academic tasks and assignments.
          </p>
        </div>
        
        <div class="tasks-toolbar">
          <div class="tasks-toolbar__primary">
            <button class="btn btn--primary" data-action="add-task">
              Add Task
            </button>
            <div class="view-toggle">
              <button 
                class="btn btn--sm ${uiState.viewMode !== 'card' ? 'btn--active' : 'btn--secondary'}" 
                data-action="set-view-mode" 
                data-view="table"
                aria-label="Table view"
              >
                Table
              </button>
              <button 
                class="btn btn--sm ${uiState.viewMode === 'card' ? 'btn--active' : 'btn--secondary'}" 
                data-action="set-view-mode" 
                data-view="card"
                aria-label="Card view"
              >
                Cards
              </button>
            </div>
          </div>
          
          <div class="tasks-toolbar__secondary">
            <div class="search-controls">
              <input 
                type="search" 
                id="task-search" 
                placeholder="Search tasks..." 
                class="search-input"
                aria-label="Search tasks"
                value="${uiState.searchQuery || ''}"
              >
              <button class="btn btn--sm btn--secondary" data-action="toggle-search-mode">
                ${uiState.searchMode === 'regex' ? 'Regex' : 'Text'}
              </button>
            </div>
            
            <div class="filter-controls">
              <select id="task-filter" class="form-select" aria-label="Filter tasks">
                <option value="all" ${uiState.filterBy === 'all' ? 'selected' : ''}>All Tasks</option>
                <option value="pending" ${uiState.filterBy === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="completed" ${uiState.filterBy === 'completed' ? 'selected' : ''}>Completed</option>
                <option value="today" ${uiState.filterBy === 'today' ? 'selected' : ''}>Due Today</option>
                <option value="week" ${uiState.filterBy === 'week' ? 'selected' : ''}>This Week</option>
                <option value="overdue" ${uiState.filterBy === 'overdue' ? 'selected' : ''}>Overdue</option>
              </select>
              
              <select id="task-sort" class="form-select" aria-label="Sort tasks">
                <option value="date-newest" ${uiState.sortBy === 'date-newest' ? 'selected' : ''}>Due Date (Newest)</option>
                <option value="date-oldest" ${uiState.sortBy === 'date-oldest' ? 'selected' : ''}>Due Date (Oldest)</option>
                <option value="title-asc" ${uiState.sortBy === 'title-asc' ? 'selected' : ''}>Title (A-Z)</option>
                <option value="title-desc" ${uiState.sortBy === 'title-desc' ? 'selected' : ''}>Title (Z-A)</option>
                <option value="duration-asc" ${uiState.sortBy === 'duration-asc' ? 'selected' : ''}>Duration (Low-High)</option>
                <option value="duration-desc" ${uiState.sortBy === 'duration-desc' ? 'selected' : ''}>Duration (High-Low)</option>
              </select>
            </div>
          </div>
        </div>
        
        ${tasks.length > 0 ? `
          <div class="tasks-summary">
            <span class="tasks-count">${tasks.length} task${tasks.length !== 1 ? 's' : ''}</span>
            <span class="tasks-completed">${tasks.filter(t => t.status === 'Complete').length} completed</span>
          </div>
        ` : ''}
        
        <div id="task-list" class="task-list mt-4">
          ${this.taskList.render()}
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    console.log('TasksPage: Setting up event listeners');
    
    // Search input (needs manual handling for debouncing)
    const searchInput = document.getElementById('task-search');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          if (this.eventManager) {
            this.eventManager.emit('search-tasks', { query: e.target.value });
          }
        }, 300); // Debounce search
      });
    }
    
    // Filter dropdown (needs manual handling for change events)
    const filterSelect = document.getElementById('task-filter');
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        if (this.eventManager) {
          this.eventManager.emit('filter-tasks', { filter: e.target.value });
        }
      });
    }
    
    // Sort dropdown (needs manual handling for change events)
    const sortSelect = document.getElementById('task-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        if (this.eventManager) {
          this.eventManager.emit('sort-tasks', { sort: e.target.value });
        }
      });
    }

    // Task selection checkboxes (needs manual handling for state management)
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const taskId = e.target.dataset.taskId;
        const uiState = this.state.getUIState();
        let selectedTasks = [...(uiState.selectedTasks || [])];
        
        if (e.target.checked) {
          if (!selectedTasks.includes(taskId)) {
            selectedTasks.push(taskId);
          }
        } else {
          selectedTasks = selectedTasks.filter(id => id !== taskId);
        }
        
        this.state.updateUIState({ selectedTasks });
      });
    });

    // Select all checkbox (needs manual handling for state management)
    const selectAllCheckbox = document.getElementById('select-all-tasks');
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', (e) => {
        const tasks = this.state.getTasks();
        const selectedTasks = e.target.checked ? tasks.map(t => t.id) : [];
        
        this.state.updateUIState({ selectedTasks });
        
        // Update individual checkboxes
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
          checkbox.checked = e.target.checked;
        });
      });
    }

    // Bulk actions (needs manual handling for complex logic)
    document.querySelectorAll('[data-action="bulk-complete"]').forEach(button => {
      button.addEventListener('click', () => {
        this.handleBulkStatusChange('Complete');
      });
    });

    document.querySelectorAll('[data-action="bulk-pending"]').forEach(button => {
      button.addEventListener('click', () => {
        this.handleBulkStatusChange('Pending');
      });
    });

    document.querySelectorAll('[data-action="bulk-delete"]').forEach(button => {
      button.addEventListener('click', () => {
        const uiState = this.state.getUIState();
        const selectedTasks = this.state.getTasks().filter(t => 
          (uiState.selectedTasks || []).includes(t.id)
        );
        if (this.eventManager) {
          this.eventManager.emit('bulk-delete', { selectedTasks });
        }
      });
    });
    
    console.log('TasksPage: Event listeners set up, relying on EventManager delegation for task actions');
  }

  handleBulkStatusChange(newStatus) {
    const uiState = this.state.getUIState();
    const selectedTaskIds = uiState.selectedTasks || [];
    
    if (selectedTaskIds.length === 0) {
      return;
    }

    selectedTaskIds.forEach(taskId => {
      this.state.updateTask(taskId, { status: newStatus });
    });
    
    // Clear selection
    this.state.updateUIState({ selectedTasks: [] });
  }

  updateComponents() {
    try {
      // Only update the task list, not the entire page
      const taskListContainer = document.getElementById('task-list');
      if (taskListContainer && this.taskList) {
        const newContent = this.taskList.render();
        if (newContent !== taskListContainer.innerHTML) {
          taskListContainer.innerHTML = newContent;
        }
        
        // Update task summary
        const tasks = this.state.getTasks();
        const summaryContainer = document.querySelector('.tasks-summary');
        if (summaryContainer) {
          if (tasks.length > 0) {
            const newSummary = `
              <span class="tasks-count">${tasks.length} task${tasks.length !== 1 ? 's' : ''}</span>
              <span class="tasks-completed">${tasks.filter(t => t.status === 'Complete').length} completed</span>
            `;
            if (summaryContainer.innerHTML !== newSummary) {
              summaryContainer.innerHTML = newSummary;
            }
          } else {
            summaryContainer.innerHTML = '';
          }
        }
        
        // Re-setup only task-specific event listeners, not all page listeners
        this.setupTaskEventListeners();
      }
    } catch (error) {
      console.error('Error updating task components:', error);
      // Fallback: just log the error and continue
    }
  }

  setupTaskEventListeners() {
    console.log('TasksPage: setupTaskEventListeners called - relying on EventManager delegation');
    
    // Only set up task selection checkboxes since they need state management
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const taskId = e.target.dataset.taskId;
        const uiState = this.state.getUIState();
        let selectedTasks = [...(uiState.selectedTasks || [])];
        
        if (e.target.checked) {
          if (!selectedTasks.includes(taskId)) {
            selectedTasks.push(taskId);
          }
        } else {
          selectedTasks = selectedTasks.filter(id => id !== taskId);
        }
        
        this.state.updateUIState({ selectedTasks });
      });
    });
    
    // Task actions (edit, delete, toggle-status) are handled automatically by EventManager delegation
  }
}