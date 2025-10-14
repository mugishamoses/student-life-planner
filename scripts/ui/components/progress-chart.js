/**
 * Progress Chart Component
 */

import { BaseComponent } from '../ui-base.js';
import { calculateWeeklyProgress } from '../task-utils.js';

export class ProgressChartComponent extends BaseComponent {
  render() {
    const settings = this.state.getSettings();
    const weeklyTarget = settings.weeklyHourTarget || 40;
    const tasks = this.state.getTasks();
    
    const progress = calculateWeeklyProgress(tasks, weeklyTarget);
    
    // Determine progress status for ARIA announcements
    let progressStatus = '';
    let ariaLive = 'polite';
    
    if (progress.isOverTarget) {
      progressStatus = `Alert: You have exceeded your weekly target by ${(progress.currentWeekCompletedHours - weeklyTarget).toFixed(1)} hours.`;
      ariaLive = 'assertive';
    } else if (progress.isUnderTarget) {
      progressStatus = `You have completed ${progress.currentWeekCompletedHours.toFixed(1)} hours of your ${weeklyTarget} hour weekly target. ${progress.remainingHours.toFixed(1)} hours remaining.`;
    } else if (progress.currentWeekCompletedHours === 0) {
      progressStatus = `Weekly target: ${weeklyTarget} hours. No hours completed yet this week.`;
    }
    
    return `
      <div class="progress-card">
        <div class="progress-card__header">
          <h3 class="progress-card__title">Weekly Progress</h3>
          <div class="progress-card__period">
            Week of ${this.formatDate(progress.currentWeekStart.toISOString().split('T')[0])}
          </div>
        </div>
        
        <!-- ARIA live region for progress announcements -->
        <div 
          id="progress-announcements" 
          aria-live="${ariaLive}" 
          aria-atomic="true" 
          class="sr-only"
        >
          ${progressStatus}
        </div>
        
        <div class="progress-visualization">
          <div class="progress-bar" role="progressbar" 
               aria-valuenow="${progress.currentWeekCompletedHours.toFixed(1)}" 
               aria-valuemin="0" 
               aria-valuemax="${weeklyTarget}" 
               aria-label="Weekly progress: ${progress.currentWeekCompletedHours.toFixed(1)} of ${weeklyTarget} hours">
            <div class="progress-bar__track">
              <div class="progress-bar__fill ${progress.isOverTarget ? 'progress-bar__fill--over' : ''}" 
                   style="width: ${Math.min(progress.progressPercentage, 100)}%">
              </div>
              ${progress.isOverTarget ? `
                <div class="progress-bar__overflow" 
                     style="width: ${Math.min(((progress.currentWeekCompletedHours - weeklyTarget) / weeklyTarget) * 100, 100)}%">
                </div>
              ` : ''}
            </div>
            
            <!-- Expected progress indicator -->
            <div class="progress-bar__expected" 
                 style="left: ${Math.min((progress.expectedHoursByNow / weeklyTarget) * 100, 100)}%"
                 title="Expected progress by ${progress.currentDay}">
            </div>
          </div>
          
          <div class="progress-legend">
            <div class="progress-legend__item">
              <span class="progress-legend__color progress-legend__color--completed"></span>
              <span class="progress-legend__label">Completed</span>
            </div>
            <div class="progress-legend__item">
              <span class="progress-legend__color progress-legend__color--expected"></span>
              <span class="progress-legend__label">Expected by ${progress.currentDay}</span>
            </div>
            ${progress.isOverTarget ? `
              <div class="progress-legend__item">
                <span class="progress-legend__color progress-legend__color--over"></span>
                <span class="progress-legend__label">Over target</span>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div class="progress-stats">
          <div class="progress-stat">
            <div class="progress-stat__value ${progress.isOverTarget ? 'progress-stat__value--warning' : ''}">${progress.currentWeekCompletedHours.toFixed(1)}h</div>
            <div class="progress-stat__label">Completed</div>
          </div>
          
          <div class="progress-stat">
            <div class="progress-stat__value">${weeklyTarget}h</div>
            <div class="progress-stat__label">Target</div>
          </div>
          
          <div class="progress-stat">
            <div class="progress-stat__value">${progress.progressPercentage.toFixed(0)}%</div>
            <div class="progress-stat__label">Progress</div>
          </div>
          
          <div class="progress-stat">
            <div class="progress-stat__value ${progress.remainingHours === 0 ? 'progress-stat__value--success' : ''}">${progress.remainingHours.toFixed(1)}h</div>
            <div class="progress-stat__label">Remaining</div>
          </div>
        </div>
        
        ${progress.currentWeekPlannedHours > 0 ? `
          <div class="progress-insights">
            <div class="progress-insight">
              <strong>This Week's Plan:</strong> ${progress.currentWeekPlannedHours.toFixed(1)}h scheduled
            </div>
            ${progress.expectedHoursByNow > 0 ? `
              <div class="progress-insight ${progress.currentWeekCompletedHours < progress.expectedHoursByNow ? 'progress-insight--warning' : 'progress-insight--success'}">
                <strong>Pace:</strong> 
                ${progress.currentWeekCompletedHours >= progress.expectedHoursByNow ? 'On track' : `${(progress.expectedHoursByNow - progress.currentWeekCompletedHours).toFixed(1)}h behind`}
                (expected ${progress.expectedHoursByNow.toFixed(1)}h by ${progress.currentDay})
              </div>
            ` : ''}
          </div>
        ` : ''}
        
        ${progress.isOverTarget ? `
          <div class="progress-alert progress-alert--warning" role="alert">
            <strong>⚠️ Target Exceeded:</strong> 
            You've completed ${(progress.currentWeekCompletedHours - weeklyTarget).toFixed(1)} hours over your weekly target. 
            Consider adjusting your target or taking a well-deserved break!
          </div>
        ` : ''}
        
        ${progress.currentWeekCompletedHours === 0 && progress.daysIntoWeek > 2 ? `
          <div class="progress-alert progress-alert--info" role="alert">
            <strong>💡 Getting Started:</strong> 
            It's ${progress.currentDay} and you haven't logged any completed hours yet this week. 
            Consider completing some tasks to track your progress!
          </div>
        ` : ''}
      </div>
    `;
  }
}