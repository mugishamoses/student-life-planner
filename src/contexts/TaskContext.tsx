import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  duration: number; // in minutes
  tag: string;
  status: 'Pending' | 'Complete';
  createdAt: string;
}

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, task: Omit<Task, 'id' | 'createdAt'>) => void;
  deleteTask: (id: string) => void;
  clearAllTasks: () => void;
  importTasks: (tasks: Task[]) => void;
  exportTasks: () => string;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const stored = localStorage.getItem('campus-planner-tasks');
    if (stored) {
      return JSON.parse(stored);
    }
    // Load demo data on first visit
    const { getDemoTasks } = require('../utils/demoData');
    return getDemoTasks();
  });

  useEffect(() => {
    localStorage.setItem('campus-planner-tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = (id: string, taskData: Omit<Task, 'id' | 'createdAt'>) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, ...taskData } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const clearAllTasks = () => {
    setTasks([]);
  };

  const importTasks = (importedTasks: Task[]) => {
    setTasks(importedTasks);
  };

  const exportTasks = () => {
    return JSON.stringify(tasks, null, 2);
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        addTask,
        updateTask,
        deleteTask,
        clearAllTasks,
        importTasks,
        exportTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within TaskProvider');
  }
  return context;
};
