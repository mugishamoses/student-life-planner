/**
 * About Page Renderer
 */

import { BasePage } from '../ui-base.js';

export class AboutPage extends BasePage {
  render() {
    return `
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">About Campus Life Planner</h1>
          <p class="page-description">
            Your personal academic task management system designed to help you stay organized and achieve your goals.
          </p>
        </div>
        
        <div class="grid grid--2-col">
          <div class="card">
            <div class="card__header">
              <h2 class="card__title">Purpose</h2>
            </div>
            <div class="card__body">
              <p>
                Campus Life Planner is designed specifically for students who need to manage their academic workload effectively. 
                Whether you're tracking assignments, planning study sessions, or monitoring your weekly progress, this tool 
                provides the structure and insights you need to succeed.
              </p>
              <ul class="feature-list">
                <li>Track academic tasks and assignments</li>
                <li>Set and monitor weekly time goals</li>
                <li>Organize tasks by categories and due dates</li>
                <li>Search and filter tasks efficiently</li>
                <li>Export and import your data</li>
              </ul>
            </div>
          </div>
          
          <div class="card">
            <div class="card__header">
              <h2 class="card__title">Contact Information</h2>
            </div>
            <div class="card__body">
              <div class="contact-info">
                <div class="contact-item">
                  <strong>Developer:</strong> Campus Life Planner Team
                </div>
                <div class="contact-item">
                  <strong>Version:</strong> 1.0.0
                </div>
                <div class="contact-item">
                  <strong>Technology:</strong> Vanilla HTML, CSS, JavaScript
                </div>
                <div class="contact-item">
                  <strong>Accessibility:</strong> WCAG AA Compliant
                </div>
              </div>
              
              <div class="mt-4">
                <h3>Keyboard Navigation</h3>
                <div class="keyboard-shortcuts">
                  <div class="shortcut-item">
                    <kbd>Tab</kbd> Navigate between elements
                  </div>
                  <div class="shortcut-item">
                    <kbd>Enter</kbd> Activate buttons and links
                  </div>
                  <div class="shortcut-item">
                    <kbd>Escape</kbd> Close modals and menus
                  </div>
                  <div class="shortcut-item">
                    <kbd>Space</kbd> Toggle checkboxes
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="card mt-6">
          <div class="card__header">
            <h2 class="card__title">Getting Started</h2>
          </div>
          <div class="card__body">
            <div class="steps">
              <div class="step">
                <div class="step__number">1</div>
                <div class="step__content">
                  <h3>Add Your First Task</h3>
                  <p>Navigate to the Tasks page and click "Add Task" to create your first academic task.</p>
                </div>
              </div>
              <div class="step">
                <div class="step__number">2</div>
                <div class="step__content">
                  <h3>Set Your Weekly Goal</h3>
                  <p>Go to Settings to configure your weekly hour target and time unit preferences.</p>
                </div>
              </div>
              <div class="step">
                <div class="step__number">3</div>
                <div class="step__content">
                  <h3>Track Your Progress</h3>
                  <p>Use the Dashboard to monitor your progress and see statistics about your tasks.</p>
                </div>
              </div>
            </div>
            
            <div class="action-buttons mt-4">
              <button class="btn btn--primary" data-action="navigate" data-page="tasks">
                Start Managing Tasks
              </button>
              <button class="btn btn--secondary" data-action="navigate" data-page="dashboard">
                View Dashboard
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
  }
}