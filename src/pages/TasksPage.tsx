import React, { useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { useTasks, Task } from '../contexts/TaskContext';
import { useSettings } from '../contexts/SettingsContext';
import { TaskModal } from '../components/TaskModal';
import { TaskCard } from '../components/TaskCard';
import { TaskTable } from '../components/TaskTable';
import { EmptyState } from '../components/EmptyState';
import { filterTasks, searchTasks, sortTasks } from '../utils/taskUtils';
import { useToast } from '../hooks/useToast';

type FilterType = 'all' | 'today' | 'week' | 'overdue';
type SortType = 'date-newest' | 'date-oldest' | 'title-asc' | 'title-desc' | 'duration-longest' | 'duration-shortest';

export const TasksPage: React.FC = () => {
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const { settings } = useSettings();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegex, setIsRegex] = useState(false);
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('date-newest');

  // Filter, search, and sort tasks
  const displayedTasks = useMemo(() => {
    let result = filterTasks(tasks, activeFilter);
    result = searchTasks(result, searchQuery, isRegex, isCaseSensitive);
    result = sortTasks(result, sortBy);
    return result;
  }, [tasks, activeFilter, searchQuery, isRegex, isCaseSensitive, sortBy]);

  const handleAddTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
      toast.success('Task updated successfully!');
    } else {
      addTask(taskData);
      toast.success('Task added successfully!');
    }
  };

  const handleDeleteTask = (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(id);
      toast.success('Task deleted successfully!');
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveFilter('all');
  };

  return (
    <div>
      <h1 className="mb-6">Tasks</h1>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search tasks (regex supported)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-11 border border-slate-200 rounded-lg pl-10 pr-4 focus:outline-none focus:ring-3 focus:ring-blue-600/10 focus:border-blue-600 transition-all duration-200"
            aria-label="Search tasks"
          />
        </div>

        <div className="flex gap-4 mt-2">
          <label className="flex items-center gap-2 cursor-pointer text-[0.875rem] text-slate-700">
            <input
              type="checkbox"
              checked={isCaseSensitive}
              onChange={e => setIsCaseSensitive(e.target.checked)}
              className="w-[18px] h-[18px] rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 cursor-pointer"
            />
            Case sensitive
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-[0.875rem] text-slate-700">
            <input
              type="checkbox"
              checked={isRegex}
              onChange={e => setIsRegex(e.target.checked)}
              className="w-[18px] h-[18px] rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 cursor-pointer"
            />
            Regex mode
          </label>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(['all', 'today', 'week', 'overdue'] as FilterType[]).map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-md text-[0.875rem] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
              activeFilter === filter
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-600'
            }`}
          >
            {filter === 'all' && 'All'}
            {filter === 'today' && 'Today'}
            {filter === 'week' && 'This Week'}
            {filter === 'overdue' && 'Overdue'}
          </button>
        ))}
      </div>

      {/* Top Bar: Sort + Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-[0.875rem] text-slate-700 whitespace-nowrap">
            Sort by:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortType)}
            className="h-10 border border-slate-200 rounded-md px-3 pr-8 bg-white text-[0.875rem] cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
            }}
          >
            <option value="date-newest">Date (Newest)</option>
            <option value="date-oldest">Date (Oldest)</option>
            <option value="title-asc">Title (A-Z)</option>
            <option value="title-desc">Title (Z-A)</option>
            <option value="duration-longest">Duration (Longest)</option>
            <option value="duration-shortest">Duration (Shortest)</option>
          </select>
        </div>

        <button
          onClick={handleAddTask}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-600/20 active:translate-y-0 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
          Add Task
        </button>
      </div>

      {/* Tasks Display */}
      {displayedTasks.length === 0 ? (
        <EmptyState
          type={searchQuery || activeFilter !== 'all' ? 'no-results' : 'no-tasks'}
          onAction={searchQuery || activeFilter !== 'all' ? handleClearSearch : handleAddTask}
        />
      ) : (
        <>
          {/* Mobile: Card Layout */}
          <div className="md:hidden space-y-4">
            {displayedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                timeUnit={settings.timeUnit}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>

          {/* Desktop: Table Layout */}
          <div className="hidden md:block">
            <TaskTable
              tasks={displayedTasks}
              timeUnit={settings.timeUnit}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
            />
          </div>
        </>
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        initialTask={editingTask || undefined}
        mode={editingTask ? 'edit' : 'add'}
      />
    </div>
  );
};
