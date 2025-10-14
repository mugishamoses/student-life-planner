import React from 'react';

export const AboutPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center max-w-[600px] mx-auto">
      <h1 className="text-center mb-6">About Campus Life Planner</h1>
      
      <p className="text-[1rem] leading-[1.6] mb-6 text-slate-800">
        Campus Life Planner is a simple, accessible web application designed to help students
        manage their tasks and events effectively. Track your assignments, monitor your time
        commitments, and stay organized throughout the semester.
      </p>

      <p className="text-[1rem] leading-[1.6] mb-6 text-slate-800">
        This application features task management with filtering and search capabilities,
        a dashboard to visualize your workload, and customizable settings to match your
        workflow preferences.
      </p>

      <div className="w-full border border-slate-200 rounded-lg p-6 bg-white">
        <div className="text-[0.875rem] text-slate-600 uppercase tracking-wide mb-3">
          Contact
        </div>
        
        <a
          href="mailto:student@university.edu"
          className="text-[1rem] text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded block mb-2"
        >
          student@university.edu
        </a>
        
        <a
          href="https://github.com/student/campus-life-planner"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[1rem] text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded block"
        >
          GitHub Repository
        </a>
      </div>
    </div>
  );
};
