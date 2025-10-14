import React from 'react';
import { Calendar, Clock, Edit2, Trash2 } from 'lucide-react';
import { Task } from '../contexts/TaskContext';
import { formatDuration } from '../utils/taskUtils';

interface TaskCardProps {
  task: Task;
  timeUnit: 'minutes' | 'hours' | 'both';
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const getTagColor = (tag: string): string => {
  // Generate consistent color based on tag name
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    { bg: 'bg-blue-600/10', text: 'text-blue-600', border: 'border-blue-600' },
    { bg: 'bg-purple-600/10', text: 'text-purple-600', border: 'border-purple-600' },
    { bg: 'bg-green-600/10', text: 'text-green-600', border: 'border-green-600' },
    { bg: 'bg-orange-600/10', text: 'text-orange-600', border: 'border-orange-600' },
    { bg: 'bg-pink-600/10', text: 'text-pink-600', border: 'border-pink-600' },
  ];
  
  return colors[Math.abs(hash) % colors.length].border;
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, timeUnit, onEdit, onDelete }) => {
  const borderColor = getTagColor(task.tag);
  const formattedDate = new Date(task.dueDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      className={`bg-white border border-slate-200 ${borderColor} border-l-4 rounded-lg p-4 hover:shadow-md transition-shadow duration-200`}
    >
      <h3 className="text-slate-900 mb-2">{task.title}</h3>

      <div className="inline-block px-2.5 py-1 bg-blue-600/10 text-blue-600 rounded text-[0.75rem] mb-3">
        {task.tag}
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-[0.875rem] text-slate-600">
          <Calendar className="w-4 h-4 text-slate-500" aria-hidden="true" />
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-center gap-2 text-[0.875rem] text-slate-600">
          <Clock className="w-4 h-4 text-slate-500" aria-hidden="true" />
          <span>{formatDuration(task.duration, timeUnit)}</span>
        </div>
      </div>

      <div className="mb-4">
        <span
          className={`inline-block px-2.5 py-1 rounded-full text-[0.75rem] ${
            task.status === 'Pending'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-green-100 text-green-800'
          }`}
        >
          {task.status}
        </span>
      </div>

      <div className="flex gap-2 pt-3 border-t border-slate-100">
        <button
          onClick={() => onEdit(task)}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-[0.875rem] text-blue-600 hover:border-blue-600 hover:bg-blue-600/5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 flex items-center justify-center gap-2"
          aria-label={`Edit task: ${task.title}`}
        >
          <Edit2 className="w-4 h-4" aria-hidden="true" />
          Edit
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-[0.875rem] text-red-600 hover:border-red-600 hover:bg-red-600/5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 flex items-center justify-center gap-2"
          aria-label={`Delete task: ${task.title}`}
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
          Delete
        </button>
      </div>
    </div>
  );
};
