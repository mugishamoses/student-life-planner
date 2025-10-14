import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Task } from '../contexts/TaskContext';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  initialTask?: Task;
  mode: 'add' | 'edit';
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
  mode,
}) => {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [duration, setDuration] = useState('');
  const [tag, setTag] = useState('');
  const [status, setStatus] = useState<'Pending' | 'Complete'>('Pending');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && initialTask && mode === 'edit') {
      setTitle(initialTask.title);
      setDueDate(initialTask.dueDate);
      setDuration(initialTask.duration.toString());
      setTag(initialTask.tag);
      setStatus(initialTask.status);
    } else if (isOpen && mode === 'add') {
      setTitle('');
      setDueDate('');
      setDuration('');
      setTag('');
      setStatus('Pending');
    }
    setErrors({});
  }, [isOpen, initialTask, mode]);

  useEffect(() => {
    if (isOpen) {
      // Focus first input when modal opens
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);

      // Trap focus in modal
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!dueDate) {
      newErrors.dueDate = 'Due date is required';
    }
    if (!duration || parseInt(duration) < 1) {
      newErrors.duration = 'Duration must be at least 1 minute';
    }
    if (!tag.trim()) {
      newErrors.tag = 'Tag is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave({
        title: title.trim(),
        dueDate,
        duration: parseInt(duration),
        tag: tag.trim(),
        status,
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[2000] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-xl p-6 max-w-[500px] w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 id="modal-title">
            {mode === 'add' ? 'Add New Task' : 'Edit Task'}
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label htmlFor="task-title" className="block text-[0.875rem] text-slate-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              ref={firstInputRef}
              id="task-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className={`w-full h-11 border rounded-md px-3 transition-all duration-200 focus:outline-none focus:ring-3 focus:ring-blue-600/10 focus:border-blue-600 ${
                errors.title ? 'border-red-500 focus:ring-red-600/10' : 'border-slate-200'
              }`}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'title-error' : undefined}
            />
            {errors.title && (
              <div id="title-error" className="text-[0.875rem] text-red-600 mt-1.5 animate-in slide-in-from-top-1">
                {errors.title}
              </div>
            )}
          </div>

          {/* Due Date */}
          <div>
            <label htmlFor="task-due-date" className="block text-[0.875rem] text-slate-700 mb-1.5">
              Due Date <span className="text-red-500">*</span>
            </label>
            <input
              id="task-due-date"
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className={`w-full h-11 border rounded-md px-3 transition-all duration-200 focus:outline-none focus:ring-3 focus:ring-blue-600/10 focus:border-blue-600 ${
                errors.dueDate ? 'border-red-500 focus:ring-red-600/10' : 'border-slate-200'
              }`}
              aria-invalid={!!errors.dueDate}
              aria-describedby={errors.dueDate ? 'due-date-error' : undefined}
            />
            {errors.dueDate && (
              <div id="due-date-error" className="text-[0.875rem] text-red-600 mt-1.5 animate-in slide-in-from-top-1">
                {errors.dueDate}
              </div>
            )}
          </div>

          {/* Duration */}
          <div>
            <label htmlFor="task-duration" className="block text-[0.875rem] text-slate-700 mb-1.5">
              Duration <span className="text-red-500">*</span>
            </label>
            <input
              id="task-duration"
              type="number"
              min="1"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              placeholder="Minutes"
              className={`w-full h-11 border rounded-md px-3 transition-all duration-200 focus:outline-none focus:ring-3 focus:ring-blue-600/10 focus:border-blue-600 ${
                errors.duration ? 'border-red-500 focus:ring-red-600/10' : 'border-slate-200'
              }`}
              aria-invalid={!!errors.duration}
              aria-describedby={errors.duration ? 'duration-error' : undefined}
            />
            {errors.duration && (
              <div id="duration-error" className="text-[0.875rem] text-red-600 mt-1.5 animate-in slide-in-from-top-1">
                {errors.duration}
              </div>
            )}
          </div>

          {/* Tag */}
          <div>
            <label htmlFor="task-tag" className="block text-[0.875rem] text-slate-700 mb-1.5">
              Tag <span className="text-red-500">*</span>
            </label>
            <input
              id="task-tag"
              type="text"
              value={tag}
              onChange={e => setTag(e.target.value)}
              className={`w-full h-11 border rounded-md px-3 transition-all duration-200 focus:outline-none focus:ring-3 focus:ring-blue-600/10 focus:border-blue-600 ${
                errors.tag ? 'border-red-500 focus:ring-red-600/10' : 'border-slate-200'
              }`}
              aria-invalid={!!errors.tag}
              aria-describedby={errors.tag ? 'tag-error' : undefined}
            />
            {errors.tag && (
              <div id="tag-error" className="text-[0.875rem] text-red-600 mt-1.5 animate-in slide-in-from-top-1">
                {errors.tag}
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <label htmlFor="task-status" className="block text-[0.875rem] text-slate-700 mb-1.5">
              Status
            </label>
            <select
              id="task-status"
              value={status}
              onChange={e => setStatus(e.target.value as 'Pending' | 'Complete')}
              className="w-full h-11 border border-slate-200 rounded-md px-3 pr-8 bg-white appearance-none cursor-pointer transition-all duration-200 focus:outline-none focus:ring-3 focus:ring-blue-600/10 focus:border-blue-600"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
              }}
            >
              <option value="Pending">Pending</option>
              <option value="Complete">Complete</option>
            </select>
          </div>

          {/* Button Row */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 rounded-md text-slate-700 hover:border-blue-600 hover:text-blue-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-600/20 active:translate-y-0 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            >
              {mode === 'add' ? 'Add Task' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
