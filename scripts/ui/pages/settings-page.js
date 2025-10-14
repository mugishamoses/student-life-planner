/**
 * Settings Page Renderer
 */

import { BasePage } from '../ui-base.js';

export class SettingsPage extends BasePage {
  render() {
    const settings = this.state.getSettings();
    const tasks = this.state.getTasks();
    
    return `
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">Settings</h1>
          <p class="page-description">
            Configure your preferences and manage your data.
          </p>
        </div>
        
        <div class="settings-grid">
          <div class="card">
            <div class="card__header">
              <h2 class="card__title">Time Preferences</h2>
            </div>
            <div class="card__body">
              <form class="settings-form" data-form="time-settings">
                <div class="form-group">
                  <label for="time-unit" class="form-label">Time Unit Display</label>
                  <select id="time-unit" name="timeUnit" class="form-select" data-setting="timeUnit">
                    <option value="minutes" ${settings.timeUnit === 'minutes' ? 'selected' : ''}>Minutes only</option>
                    <option value="hours" ${settings.timeUnit === 'hours' ? 'selected' : ''}>Hours only</option>
                    <option value="both" ${settings.timeUnit === 'both' ? 'selected' : ''}>Both (recommended)</option>
                  </select>
                  <div class="form-help">Choose how task durations are displayed</div>
                </div>
                
                <div class="form-group">
                  <label for="weekly-target" class="form-label">Weekly Hour Target</label>
                  <input 
                    type="number" 
                    id="weekly-target" 
                    name="weeklyHourTarget"
                    class="form-input" 
                    value="${settings.weeklyHourTarget}" 
                    min="1" 
                    max="168"
                    data-setting="weeklyHourTarget"
                  >
                  <div class="form-help">Set your weekly study/work hour goal</div>
                </div>
                
                <div class="form-group">
                  <label for="default-tag" class="form-label">Default Category</label>
                  <input 
                    type="text" 
                    id="default-tag" 
                    name="defaultTag"
                    class="form-input" 
                    value="${settings.defaultTag}" 
                    data-setting="defaultTag"
                  >
                  <div class="form-help">Default category for new tasks</div>
                </div>
                
                <div class="form-group">
                  <label class="form-label">
                    <input 
                      type="checkbox" 
                      name="searchCaseSensitive"
                      ${settings.searchCaseSensitive ? 'checked' : ''}
                      data-setting="searchCaseSensitive"
                    >
                    Case-sensitive search by default
                  </label>
                </div>
              </form>
            </div>
          </div>
          
          <div class="card">
            <div class="card__header">
              <h2 class="card__title">Data Management</h2>
            </div>
            <div class="card__body">
              <div class="data-stats">
                <div class="stat-item">
                  <span class="stat-label">Total Tasks:</span>
                  <span class="stat-value">${tasks.length}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Completed:</span>
                  <span class="stat-value">${tasks.filter(t => t.status === 'Complete').length}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Total Hours:</span>
                  <span class="stat-value">${(tasks.reduce((sum, t) => sum + (t.duration || 0), 0) / 60).toFixed(1)}h</span>
                </div>
              </div>
              
              <div class="button-group mt-4">
                <button class="btn btn--secondary" data-action="export-data">
                  📤 Export All Data
                </button>
                <button class="btn btn--secondary" data-action="export-settings">
                  ⚙️ Export Settings Only
                </button>
                <label class="btn btn--secondary" for="import-file">
                  📥 Import Data
                  <input 
                    type="file" 
                    id="import-file" 
                    accept=".json"
                    style="display: none;"
                    data-action="import-file"
                  >
                </label>
              </div>
              
              <div class="import-options mt-3">
                <details class="import-details">
                  <summary class="import-summary">Import Options</summary>
                  <div class="import-controls">
                    <div class="form-group">
                      <label class="form-label">
                        <input type="radio" name="import-mode" value="merge" checked>
                        Merge with existing data (recommended)
                      </label>
                      <div class="form-help">Combines imported data with current data, avoiding duplicates</div>
                    </div>
                    <div class="form-group">
                      <label class="form-label">
                        <input type="radio" name="import-mode" value="replace">
                        Replace all data
                      </label>
                      <div class="form-help">Replaces all current data with imported data</div>
                    </div>
                    <div class="form-group">
                      <label class="form-label">
                        <input type="radio" name="import-mode" value="append">
                        Add to existing data
                      </label>
                      <div class="form-help">Adds imported data without removing existing data</div>
                    </div>
                    <div class="form-group">
                      <label class="form-label">
                        <input type="checkbox" name="include-settings" checked>
                        Include settings in import
                      </label>
                    </div>
                    <div class="form-group">
                      <label class="form-label">
                        <input type="checkbox" name="include-ui" checked>
                        Include UI preferences in import
                      </label>
                    </div>
                  </div>
                </details>
              </div>
              
              <div class="danger-zone mt-6">
                <h3 class="danger-zone__title">Danger Zone</h3>
                <p class="danger-zone__description">
                  These actions cannot be undone. Please be careful.
                </p>
                <button class="btn btn--danger" data-action="clear-data">
                  🗑️ Clear All Data
                </button>
              </div>
            </div>
          </div>
          
          <div class="card">
            <div class="card__header">
              <h2 class="card__title">About This Application</h2>
            </div>
            <div class="card__body">
              <div class="app-info">
                <div class="info-item">
                  <span class="info-label">Version:</span>
                  <span class="info-value">1.0.0</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Technology:</span>
                  <span class="info-value">Vanilla HTML, CSS, JavaScript</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Accessibility:</span>
                  <span class="info-value">WCAG AA Compliant</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Storage:</span>
                  <span class="info-value">Local Browser Storage</span>
                </div>
              </div>
              
              <div class="mt-4">
                <h4>Keyboard Shortcuts</h4>
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
      </div>
    `;
  }

  setupEventListeners() {
    // Settings form inputs
    document.querySelectorAll('[data-setting]').forEach(input => {
      const settingName = input.dataset.setting;
      
      const updateSetting = () => {
        let value = input.value;
        
        // Handle different input types
        if (input.type === 'checkbox') {
          value = input.checked;
        } else if (input.type === 'number') {
          value = parseInt(value, 10);
        }
        
        if (this.eventManager) {
          this.eventManager.emit('update-setting', { setting: settingName, value });
        }
      };
      
      if (input.type === 'checkbox') {
        input.addEventListener('change', updateSetting);
      } else {
        let timeout;
        input.addEventListener('input', () => {
          clearTimeout(timeout);
          timeout = setTimeout(updateSetting, 500); // Debounce
        });
      }
    });
    
    // Export data button
    document.querySelectorAll('[data-action="export-data"]').forEach(button => {
      button.addEventListener('click', () => {
        if (this.eventManager) {
          this.eventManager.emit('export-data');
        }
      });
    });
    
    // Export settings button
    document.querySelectorAll('[data-action="export-settings"]').forEach(button => {
      button.addEventListener('click', () => {
        if (this.eventManager) {
          this.eventManager.emit('export-settings');
        }
      });
    });
    
    // Import file input
    document.querySelectorAll('[data-action="import-file"]').forEach(input => {
      input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && this.eventManager) {
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const data = JSON.parse(event.target.result);
              this.eventManager.emit('import-data', { data, file: file.name });
            } catch (error) {
              console.error('Import error:', error);
              this.eventManager.emit('show-error', { message: 'Invalid file format' });
            }
          };
          reader.readAsText(file);
        }
      });
    });
    
    // Clear data button
    document.querySelectorAll('[data-action="clear-data"]').forEach(button => {
      button.addEventListener('click', () => {
        if (this.eventManager) {
          this.eventManager.emit('clear-data');
        }
      });
    });
  }
}