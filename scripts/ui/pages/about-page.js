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