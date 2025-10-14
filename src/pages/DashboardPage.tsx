import React from 'react';
import { useTasks } from '../contexts/TaskContext';
import { useSettings } from '../contexts/SettingsContext';
import { StatCard } from '../components/StatCard';
import { getTaskStats, getWeeklyProgress } from '../utils/taskUtils';

export const DashboardPage: React.FC = () => {
  const { tasks } = useTasks();
  const { settings } = useSettings();

  const stats = getTaskStats(tasks);
  const weeklyProgress = getWeeklyProgress(tasks, settings.weeklyHourTarget);

  return (
    <div>
      <h1 className="mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <StatCard
          label="Total Tasks"
          value={stats.totalTasks}
        />
        <StatCard
          label="Total Hours Planned"
          value={stats.totalHours}
          subtext="hours"
        />
        <StatCard
          label="Top Tag"
          value={stats.topTag}
        />
        <StatCard
          label="Upcoming This Week"
          value={stats.upcomingThisWeek}
          subtext="tasks"
        />
      </div>

      {/* Weekly Target Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 w-full">
        <div className="flex justify-between items-center mb-3">
          <div className="text-[0.875rem] text-slate-600 uppercase tracking-wider">
            Weekly Hour Cap/Target
          </div>
          <div className="text-[1rem]">
            <span className={weeklyProgress.isOver ? 'text-red-600' : 'text-blue-600'}>
              {weeklyProgress.weeklyHours}
            </span>
            <span className="text-slate-600"> / {settings.weeklyHourTarget} hrs</span>
          </div>
        </div>

        <div
          className="relative h-2 bg-slate-200 rounded overflow-hidden"
          role="status"
          aria-live="polite"
          aria-label={`${weeklyProgress.percentage}% of weekly target completed`}
        >
          <div
            className={`h-full transition-all duration-500 ease-out ${
              weeklyProgress.isOver ? 'bg-red-600' : 'bg-blue-600'
            }`}
            style={{ width: `${weeklyProgress.percentage}%` }}
          />
        </div>

        {weeklyProgress.isOver && (
          <div className="text-[0.875rem] text-red-600 mt-2" role="alert" aria-live="assertive">
            You've exceeded your weekly target!
          </div>
        )}
      </div>
    </div>
  );
};
