/**
 * Task-related utility functions for filtering, sorting, and searching
 */

/**
 * Filter tasks based on filter criteria
 * @param {Array} tasks - Array of tasks
 * @param {string} filterBy - Filter criteria
 * @returns {Array} Filtered tasks
 */
export function filterTasks(tasks, filterBy) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  switch (filterBy) {
    case 'pending':
      return tasks.filter(task => task.status === 'Pending');
    case 'completed':
      return tasks.filter(task => task.status === 'Complete');
    case 'today':
      return tasks.filter(task => {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === today.getTime();
      });
    case 'week':
      return tasks.filter(task => {
        const dueDate = new Date(task.dueDate);
        return dueDate >= weekStart && dueDate <= weekEnd;
      });
    case 'overdue':
      return tasks.filter(task => {
        const dueDate = new Date(task.dueDate);
        return dueDate < today && task.status === 'Pending';
      });
    default:
      return tasks;
  }
}

/**
 * Sort tasks based on sort criteria
 * @param {Array} tasks - Array of tasks
 * @param {string} sortBy - Sort criteria
 * @returns {Array} Sorted tasks
 */
export function sortTasks(tasks, sortBy) {
  const sortedTasks = [...tasks];
  
  switch (sortBy) {
    case 'date-newest':
      return sortedTasks.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
    case 'date-oldest':
      return sortedTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    case 'title-asc':
      return sortedTasks.sort((a, b) => a.title.localeCompare(b.title));
    case 'title-desc':
      return sortedTasks.sort((a, b) => b.title.localeCompare(a.title));
    case 'duration-asc':
      return sortedTasks.sort((a, b) => (a.duration || 0) - (b.duration || 0));
    case 'duration-desc':
      return sortedTasks.sort((a, b) => (b.duration || 0) - (a.duration || 0));
    default:
      return sortedTasks;
  }
}

/**
 * Search tasks based on query and mode
 * @param {Array} tasks - Array of tasks
 * @param {string} query - Search query
 * @param {string} mode - Search mode ('text' or 'regex')
 * @returns {Array} Filtered tasks
 */
export function searchTasks(tasks, query, mode = 'text') {
  if (!query || query.trim() === '') {
    return tasks;
  }

  try {
    let regex;
    if (mode === 'regex') {
      regex = new RegExp(query, 'i');
    } else {
      // Escape special regex characters for text search
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      regex = new RegExp(escapedQuery, 'i');
    }

    return tasks.filter(task => {
      return regex.test(task.title) || 
             regex.test(task.tag || '') ||
             regex.test(task.status || '');
    });
  } catch (error) {
    console.warn('Invalid search regex:', error);
    // Fall back to simple text search
    const lowerQuery = query.toLowerCase();
    return tasks.filter(task => {
      return task.title.toLowerCase().includes(lowerQuery) ||
             (task.tag || '').toLowerCase().includes(lowerQuery) ||
             (task.status || '').toLowerCase().includes(lowerQuery);
    });
  }
}

/**
 * Get tag suggestions from existing tasks
 * @param {Array} tasks - Array of tasks
 * @returns {Array} Array of unique tags
 */
export function getTagSuggestions(tasks) {
  const tags = new Set();
  
  tasks.forEach(task => {
    if (task.tag) {
      tags.add(task.tag);
    }
  });
  
  // Add some common academic tags
  const commonTags = ['Assignment', 'Study', 'Project', 'Exam', 'Reading', 'Research', 'Lab', 'Homework'];
  commonTags.forEach(tag => tags.add(tag));
  
  return Array.from(tags).sort();
}

/**
 * Calculate task statistics
 * @param {Array} tasks - Array of tasks
 * @returns {Object} Statistics object
 */
export function calculateTaskStats(tasks) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'Complete').length;
  const pendingTasks = tasks.filter(task => task.status === 'Pending').length;
  
  // Calculate total hours planned (all tasks)
  const totalHoursPlanned = tasks.reduce((sum, task) => sum + (task.duration || 0), 0) / 60;
  
  // Calculate completed hours
  const completedHours = tasks
    .filter(task => task.status === 'Complete')
    .reduce((sum, task) => sum + (task.duration || 0), 0) / 60;
  
  // Get most common tag (top tag)
  const tagCounts = {};
  tasks.forEach(task => {
    const tag = task.tag || 'General';
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
  });
  
  let topTag = 'None';
  let maxCount = 0;
  Object.entries(tagCounts).forEach(([tag, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topTag = tag;
    }
  });
  
  // Calculate upcoming tasks for current week
  const today = new Date();
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
  currentWeekStart.setHours(0, 0, 0, 0);
  
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6); // End of week (Saturday)
  currentWeekEnd.setHours(23, 59, 59, 999);
  
  const upcomingThisWeek = tasks.filter(task => {
    if (task.status !== 'Pending') return false;
    const dueDate = new Date(task.dueDate);
    return dueDate >= currentWeekStart && dueDate <= currentWeekEnd;
  }).length;
  
  // Calculate overdue tasks
  const overdueTasks = tasks.filter(task => {
    if (task.status !== 'Pending') return false;
    const dueDate = new Date(task.dueDate);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return dueDate < todayStart;
  }).length;

  return {
    totalTasks,
    completedTasks,
    pendingTasks,
    totalHoursPlanned,
    completedHours,
    topTag,
    maxCount,
    upcomingThisWeek,
    overdueTasks,
    completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    averageTaskDuration: totalTasks > 0 ? totalHoursPlanned / totalTasks : 0
  };
}

/**
 * Calculate weekly progress statistics
 * @param {Array} tasks - Array of tasks
 * @param {number} weeklyTarget - Weekly hour target
 * @returns {Object} Progress statistics
 */
export function calculateWeeklyProgress(tasks, weeklyTarget) {
  const today = new Date();
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
  currentWeekStart.setHours(0, 0, 0, 0);
  
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6); // End of week (Saturday)
  currentWeekEnd.setHours(23, 59, 59, 999);
  
  // Calculate hours from completed tasks in current week
  const currentWeekCompletedHours = tasks
    .filter(task => {
      if (task.status !== 'Complete') return false;
      const completedDate = new Date(task.updatedAt || task.createdAt);
      return completedDate >= currentWeekStart && completedDate <= currentWeekEnd;
    })
    .reduce((sum, task) => sum + (task.duration || 0), 0) / 60;
  
  // Calculate planned hours for current week (all tasks due this week)
  const currentWeekPlannedHours = tasks
    .filter(task => {
      const dueDate = new Date(task.dueDate);
      return dueDate >= currentWeekStart && dueDate <= currentWeekEnd;
    })
    .reduce((sum, task) => sum + (task.duration || 0), 0) / 60;
  
  const progressPercentage = Math.min((currentWeekCompletedHours / weeklyTarget) * 100, 100);
  const isOverTarget = currentWeekCompletedHours > weeklyTarget;
  const isUnderTarget = currentWeekCompletedHours < weeklyTarget && currentWeekCompletedHours > 0;
  const remainingHours = Math.max(weeklyTarget - currentWeekCompletedHours, 0);
  
  // Get day of week for progress context
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = daysOfWeek[today.getDay()];
  const daysIntoWeek = today.getDay() + 1;
  const expectedHoursByNow = (weeklyTarget / 7) * daysIntoWeek;

  return {
    currentWeekStart,
    currentWeekEnd,
    currentWeekCompletedHours,
    currentWeekPlannedHours,
    progressPercentage,
    isOverTarget,
    isUnderTarget,
    remainingHours,
    currentDay,
    daysIntoWeek,
    expectedHoursByNow,
    weeklyTarget
  };
}