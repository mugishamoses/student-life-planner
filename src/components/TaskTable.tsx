import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { Task } from '../contexts/TaskContext';
import { formatDuration } from '../utils/taskUtils';

interface TaskTableProps {
  tasks: Task[];
  timeUnit: 'minutes' | 'hours' | 'both';
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export const TaskTable: React.FC<TaskTableProps> = ({ tasks, timeUnit, onEdit, onDelete }) => {
  return (
    <div className="w-full overflow-x-auto bg-white border border-slate-200 rounded-lg">
      <table className="w-full border-separate border-spacing-0">
        <thead>
          <tr className="bg-slate-50">
            <th className="px-4 py-3 text-left text-[0.875rem] text-slate-700 border-b-2 border-slate-200 whitespace-nowrap" scope="col">
              Title
            </th>
            <th className="px-4 py-3 text-left text-[0.875rem] text-slate-700 border-b-2 border-slate-200 whitespace-nowrap" scope="col">
              Tag
            </th>
            <th className="px-4 py-3 text-left text-[0.875rem] text-slate-700 border-b-2 border-slate-200 whitespace-nowrap" scope="col">
              Due Date
            </th>
            <th className="px-4 py-3 text-left text-[0.875rem] text-slate-700 border-b-2 border-slate-200 whitespace-nowrap" scope="col">
              Duration
            </th>
            <th className="px-4 py-3 text-left text-[0.875rem] text-slate-700 border-b-2 border-slate-200 whitespace-nowrap" scope="col">
              Status
            </th>
            <th className="px-4 py-3 text-left text-[0.875rem] text-slate-700 border-b-2 border-slate-200 whitespace-nowrap" scope="col">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const formattedDate = new Date(task.dueDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <tr
                key={task.id}
                className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50 transition-colors duration-150"
              >
                <td className="px-4 py-3 text-[0.9375rem] text-slate-900 align-middle">
                  {task.title}
                </td>
                <td className="px-4 py-3 align-middle">
                  <span className="inline-block px-2.5 py-1 bg-blue-600/10 text-blue-600 rounded text-[0.75rem]">
                    {task.tag}
                  </span>
                </td>
                <td className="px-4 py-3 text-[0.875rem] text-slate-600 align-middle">
                  {formattedDate}
                </td>
                <td className="px-4 py-3 text-[0.875rem] text-slate-600 align-middle">
                  {formatDuration(task.duration, timeUnit)}
                </td>
                <td className="px-4 py-3 align-middle">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-[0.75rem] ${
                      task.status === 'Pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {task.status}
                  </span>
                </td>
                <td className="px-4 py-3 align-middle">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(task)}
                      className="w-8 h-8 inline-flex items-center justify-center border border-slate-200 rounded-md text-blue-600 hover:border-blue-600 hover:bg-blue-600/5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                      aria-label={`Edit task: ${task.title}`}
                    >
                      <Edit2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => onDelete(task.id)}
                      className="w-8 h-8 inline-flex items-center justify-center border border-slate-200 rounded-md text-red-600 hover:border-red-600 hover:bg-red-600/5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                      aria-label={`Delete task: ${task.title}`}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
