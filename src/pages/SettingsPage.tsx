import React, { useRef } from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useTasks } from '../contexts/TaskContext';
import { useToast } from '../hooks/useToast';

export const SettingsPage: React.FC = () => {
  const { settings, updateTimeUnit, updateWeeklyTarget } = useSettings();
  const { exportTasks, importTasks, clearAllTasks } = useTasks();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = exportTasks();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `campus-planner-tasks-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Tasks exported successfully!');
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data)) {
          importTasks(data);
          toast.success('Tasks imported successfully!');
        } else {
          toast.error('Invalid file format. Please select a valid JSON file.');
        }
      } catch (error) {
        toast.error('Error reading file. Please select a valid JSON file.');
      }
    };
    reader.readAsText(file);
    
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete all tasks? This action cannot be undone.')) {
      clearAllTasks();
      toast.success('All tasks have been deleted.');
    }
  };

  return (
    <div className="max-w-[600px] mx-auto">
      <h1 className="mb-8">Settings</h1>

      {/* Time Unit Section */}
      <section className="mb-10">
        <h2 className="mb-2">Time Units</h2>
        <p className="text-[0.875rem] text-slate-600 mb-4">
          Set your preferred time display format
        </p>

        <div className="space-y-3">
          {(['minutes', 'hours', 'both'] as const).map(unit => (
            <label
              key={unit}
              className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                settings.timeUnit === unit
                  ? 'border-blue-600 bg-blue-600/5'
                  : 'border-slate-200 bg-white hover:border-blue-600 hover:bg-blue-600/[0.03]'
              }`}
            >
              <input
                type="radio"
                name="time-unit"
                value={unit}
                checked={settings.timeUnit === unit}
                onChange={() => updateTimeUnit(unit)}
                className="w-5 h-5 text-blue-600 border-slate-300 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 cursor-pointer"
              />
              <span className="ml-3 text-[1rem] text-slate-900">
                {unit === 'minutes' && 'Minutes'}
                {unit === 'hours' && 'Hours'}
                {unit === 'both' && 'Both (Minutes and Hours)'}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Weekly Target Section */}
      <section className="mb-10">
        <h2 className="mb-4">Target Settings</h2>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label htmlFor="weekly-target" className="text-[1rem] text-slate-700 whitespace-nowrap">
            Weekly hour target:
          </label>
          <input
            id="weekly-target"
            type="number"
            min="1"
            value={settings.weeklyHourTarget}
            onChange={e => updateWeeklyTarget(parseInt(e.target.value) || 1)}
            className="w-full sm:w-24 h-11 border border-slate-200 rounded-md px-3 text-center focus:outline-none focus:ring-3 focus:ring-blue-600/10 focus:border-blue-600 transition-all duration-200"
          />
          <span className="text-[1rem] text-slate-600">hours per week</span>
        </div>
      </section>

      {/* Data Management Section */}
      <section>
        <h2 className="mb-4">Data Management</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-5 py-3 border border-slate-200 rounded-lg text-[0.9375rem] text-blue-600 hover:border-blue-600 hover:bg-blue-600/5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
          >
            <Download className="w-5 h-5" aria-hidden="true" />
            Export JSON
          </button>

          <button
            onClick={handleImport}
            className="flex items-center justify-center gap-2 px-5 py-3 border border-slate-200 rounded-lg text-[0.9375rem] text-blue-600 hover:border-blue-600 hover:bg-blue-600/5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
          >
            <Upload className="w-5 h-5" aria-hidden="true" />
            Import JSON
          </button>

          <button
            onClick={handleClearAll}
            className="sm:col-span-2 flex items-center justify-center gap-2 px-5 py-3 bg-red-50 border border-red-200 rounded-lg text-[0.9375rem] text-red-600 hover:bg-red-100 hover:border-red-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <Trash2 className="w-5 h-5" aria-hidden="true" />
            Clear All Data
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Import JSON file"
        />
      </section>
    </div>
  );
};
