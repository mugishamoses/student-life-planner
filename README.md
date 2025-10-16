# Campus Life Planner

A vanilla JavaScript task management application designed for students to organize their academic workload and stay productive.

## Features

- **Task Management**: Create, edit, delete, and track academic tasks with due dates and time estimates
- **Smart Organization**: Filter by status, sort by date/priority, and search with text or regex
- **Data Persistence**: Automatic localStorage backup with JSON import/export capabilities
- **Responsive Design**: Mobile-friendly interface with accessibility features
- **Multiple Views**: Table and card view modes for different preferences
- **Progress Tracking**: Weekly hour targets and completion statistics

## Quick Start

1. Open `index.html` in a modern web browser
2. Navigate through pages using the top navigation menu
3. Add tasks using the "Add Task" button on the Tasks page
4. Manage settings and export data from the Settings page

## Project Structure

- `index.html` - Main application entry point
- `scripts/` - JavaScript modules (state management, routing, UI components)
- `styles/` - CSS files for layout, components, and responsive design
- `data/` - Initial task data and JSON templates

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6 modules), HTML5, CSS3
- **Storage**: localStorage with JSON backup/restore
- **Architecture**: Modular design with state management and routing
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

## Browser Support

Requires a modern browser with ES6 module support. Includes fallback message for unsupported browsers.

## Data Management

Tasks and settings are automatically saved to localStorage. Use the Settings page to export data as JSON files or import from previous backups.