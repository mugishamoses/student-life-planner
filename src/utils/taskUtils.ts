import { Task } from '../contexts/TaskContext';

export const getTaskStats = (tasks: Task[]) => {
  const totalTasks = tasks.length;
  const totalMinutes = tasks.reduce((sum, task) => sum + task.duration, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  // Get top tag
  const tagCounts: Record<string, number> = {};
  tasks.forEach(task => {
    tagCounts[task.tag] = (tagCounts[task.tag] || 0) + 1;
  });
  const topTag = Object.keys(tagCounts).length > 0
    ? Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0][0]
    : 'None';

  // Count upcoming this week
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const upcomingThisWeek = tasks.filter(task => {
    const dueDate = new Date(task.dueDate);
    return dueDate >= startOfWeek && dueDate < endOfWeek && task.status === 'Pending';
  }).length;

  return {
    totalTasks,
    totalHours,
    topTag,
    upcomingThisWeek,
  };
};

export const getWeeklyProgress = (tasks: Task[], weeklyTarget: number) => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const weeklyMinutes = tasks.filter(task => {
    const dueDate = new Date(task.dueDate);
    return dueDate >= startOfWeek && dueDate < endOfWeek;
  }).reduce((sum, task) => sum + task.duration, 0);

  const weeklyHours = weeklyMinutes / 60;
  const targetMinutes = weeklyTarget * 60;
  const percentage = Math.min((weeklyMinutes / targetMinutes) * 100, 100);
  const isOver = weeklyMinutes > targetMinutes;

  return {
    weeklyHours: weeklyHours.toFixed(1),
    percentage: percentage.toFixed(0),
    isOver,
  };
};

export const formatDuration = (minutes: number, timeUnit: 'minutes' | 'hours' | 'both'): string => {
  if (timeUnit === 'minutes') {
    return `${minutes} min`;
  } else if (timeUnit === 'hours') {
    const hours = (minutes / 60).toFixed(1);
    return `${hours} hrs`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours} hrs`;
    return `${hours} hrs ${mins} min`;
  }
};

export const filterTasks = (
  tasks: Task[],
  filter: 'all' | 'today' | 'week' | 'overdue'
): Task[] => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  switch (filter) {
    case 'today': {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      return tasks.filter(task => {
        const dueDate = new Date(task.dueDate);
        return dueDate >= now && dueDate < tomorrow;
      });
    }
    case 'week': {
      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);
      return tasks.filter(task => {
        const dueDate = new Date(task.dueDate);
        return dueDate >= now && dueDate < nextWeek;
      });
    }
    case 'overdue': {
      return tasks.filter(task => {
        const dueDate = new Date(task.dueDate);
        return dueDate < now && task.status === 'Pending';
      });
    }
    default:
      return tasks;
  }
};

export const searchTasks = (
  tasks: Task[],
  query: string,
  isRegex: boolean,
  isCaseSensitive: boolean
): Task[] => {
  if (!query) return tasks;

  try {
    if (isRegex) {
      const flags = isCaseSensitive ? '' : 'i';
      const regex = new RegExp(query, flags);
      return tasks.filter(task => regex.test(task.title));
    } else {
      const searchQuery = isCaseSensitive ? query : query.toLowerCase();
      return tasks.filter(task => {
        const title = isCaseSensitive ? task.title : task.title.toLowerCase();
        return title.includes(searchQuery);
      });
    }
  } catch (e) {
    // Invalid regex, fall back to plain text search
    const searchQuery = isCaseSensitive ? query : query.toLowerCase();
    return tasks.filter(task => {
      const title = isCaseSensitive ? task.title : task.title.toLowerCase();
      return title.includes(searchQuery);
    });
  }
};

export const sortTasks = (
  tasks: Task[],
  sortBy: 'date-newest' | 'date-oldest' | 'title-asc' | 'title-desc' | 'duration-longest' | 'duration-shortest'
): Task[] => {
  const sorted = [...tasks];

  switch (sortBy) {
    case 'date-newest':
      return sorted.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
    case 'date-oldest':
      return sorted.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    case 'title-asc':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'title-desc':
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    case 'duration-longest':
      return sorted.sort((a, b) => b.duration - a.duration);
    case 'duration-shortest':
      return sorted.sort((a, b) => a.duration - b.duration);
    default:
      return sorted;
  }
};
