import { Task } from '../contexts/TaskContext';

export const getDemoTasks = (): Task[] => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  return [
    {
      id: 'demo-1',
      title: 'Complete JavaScript Assignment',
      dueDate: tomorrow.toISOString().split('T')[0],
      duration: 120,
      tag: 'Programming',
      status: 'Pending',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-2',
      title: 'Read Chapter 5 - Biology',
      dueDate: today.toISOString().split('T')[0],
      duration: 45,
      tag: 'Reading',
      status: 'Pending',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-3',
      title: 'Math Problem Set 3',
      dueDate: nextWeek.toISOString().split('T')[0],
      duration: 90,
      tag: 'Mathematics',
      status: 'Pending',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-4',
      title: 'History Essay Draft',
      dueDate: yesterday.toISOString().split('T')[0],
      duration: 180,
      tag: 'Writing',
      status: 'Pending',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-5',
      title: 'Study for Chemistry Midterm',
      dueDate: nextWeek.toISOString().split('T')[0],
      duration: 240,
      tag: 'Studying',
      status: 'Pending',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-6',
      title: 'Lab Report - Physics',
      dueDate: today.toISOString().split('T')[0],
      duration: 60,
      tag: 'Lab Work',
      status: 'Complete',
      createdAt: new Date().toISOString(),
    },
  ];
};
