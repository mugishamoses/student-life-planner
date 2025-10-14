import React from 'react';
import { Calendar, Inbox, SearchX } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-tasks' | 'no-results' | 'no-tasks-week';
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type, onAction }) => {
  const configs = {
    'no-tasks': {
      icon: Inbox,
      heading: 'No tasks yet',
      description: 'Get started by adding your first task to stay organized',
      actionLabel: 'Add Your First Task',
    },
    'no-results': {
      icon: SearchX,
      heading: 'No tasks found',
      description: 'Try adjusting your search or filters to find what you\'re looking for',
      actionLabel: 'Clear Search',
    },
    'no-tasks-week': {
      icon: Calendar,
      heading: 'No tasks this week',
      description: 'You\'re all caught up! Enjoy your free time or plan ahead',
      actionLabel: null,
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center min-h-[400px]">
      <Icon className="w-20 h-20 text-slate-300 mb-6" aria-hidden="true" />
      
      <h3 className="text-[1.25rem] text-slate-700 mb-3">
        {config.heading}
      </h3>
      
      <p className="text-[1rem] text-slate-600 max-w-md leading-relaxed mb-6">
        {config.description}
      </p>
      
      {config.actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-600/20 active:translate-y-0 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
        >
          {config.actionLabel}
        </button>
      )}
    </div>
  );
};
