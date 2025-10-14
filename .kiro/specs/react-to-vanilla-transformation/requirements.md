# Requirements Document

## Introduction

This project involves transforming an existing React-based Campus Life Planner application into a vanilla HTML/CSS/JavaScript implementation to meet specific academic assignment requirements. The transformation must maintain 100% of the current functionality, visual design, and user experience while adhering to strict constraints that prohibit frameworks, libraries, and modern build tools. The goal is to achieve full marks (100%) on the assignment rubric while preserving the polished, professional appearance of the original application.

## Requirements

### Requirement 1: Technology Stack Compliance

**User Story:** As a student submitting this assignment, I want the application to use only vanilla HTML/CSS/JavaScript, so that I meet the assignment's strict technology requirements and avoid automatic point deductions.

#### Acceptance Criteria

1. WHEN the application is built THEN it SHALL use only semantic HTML5 for structure
2. WHEN styling is applied THEN it SHALL use only vanilla CSS with no frameworks or preprocessors
3. WHEN interactivity is implemented THEN it SHALL use only vanilla JavaScript with no external libraries
4. WHEN the project is examined THEN it SHALL contain no React, Vue, Angular, Bootstrap, Tailwind CSS, or any UI libraries
5. WHEN dependencies are checked THEN the project SHALL have no npm dependencies except for development tools if absolutely necessary

### Requirement 2: Semantic HTML Structure and Accessibility

**User Story:** As a user with accessibility needs, I want the application to be fully accessible and use proper semantic structure, so that I can navigate and use all features effectively with assistive technologies.

#### Acceptance Criteria

1. WHEN the HTML is structured THEN it SHALL use semantic landmarks including header, nav, main, section, and footer
2. WHEN headings are implemented THEN they SHALL follow proper hierarchy (h1, h2, h3, etc.)
3. WHEN forms are created THEN all inputs SHALL have properly associated labels
4. WHEN interactive elements are added THEN they SHALL be keyboard navigable
5. WHEN focus moves through the page THEN focus indicators SHALL be clearly visible
6. WHEN status updates occur THEN they SHALL be announced via ARIA live regions
7. WHEN the page loads THEN a skip-to-content link SHALL be available and functional
8. WHEN color is used to convey information THEN adequate contrast ratios SHALL be maintained (WCAG AA compliance)

### Requirement 3: Responsive CSS Layout and Design

**User Story:** As a user accessing the application on different devices, I want the interface to be responsive and visually consistent, so that I have an optimal experience regardless of screen size.

#### Acceptance Criteria

1. WHEN the layout is designed THEN it SHALL use a mobile-first approach
2. WHEN responsive breakpoints are implemented THEN there SHALL be at least 3 breakpoints (~360px, 768px, 1024px)
3. WHEN layout techniques are used THEN Flexbox SHALL be the primary method for responsive design
4. WHEN media queries are applied THEN the layout SHALL adapt smoothly across all breakpoints
5. WHEN animations are added THEN there SHALL be at least one tasteful CSS animation or transition
6. WHEN the design is viewed THEN it SHALL maintain the exact visual appearance of the original React application
7. WHEN spacing and typography are applied THEN they SHALL be consistent throughout the application

### Requirement 4: Data Model and Persistence

**User Story:** As a user of the Campus Life Planner, I want my tasks and settings to be saved automatically and persist between sessions, so that I don't lose my data when I close and reopen the application.

#### Acceptance Criteria

1. WHEN a task is created THEN it SHALL include id, title, dueDate, duration, tag, status, createdAt, and updatedAt fields
2. WHEN data changes occur THEN they SHALL be automatically saved to localStorage
3. WHEN the application loads THEN it SHALL restore data from localStorage
4. WHEN JSON import is performed THEN the data structure SHALL be validated before loading
5. WHEN JSON export is requested THEN it SHALL generate properly formatted JSON with all task data
6. WHEN data validation fails THEN appropriate error messages SHALL be displayed to the user

### Requirement 5: Form Validation with Regex

**User Story:** As a user entering task information, I want the forms to validate my input in real-time with clear feedback, so that I can correct errors immediately and ensure data quality.

#### Acceptance Criteria

1. WHEN title/description is entered THEN it SHALL be validated with regex to forbid leading/trailing spaces and collapse doubles: `/^\S(?:.*\S)?$/`
2. WHEN duration is entered THEN it SHALL be validated with regex for positive numbers: `/^(0|[1-9]\d*)(\.\d{1,2})?$/`
3. WHEN date is entered THEN it SHALL be validated with regex for YYYY-MM-DD format: `/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/`
4. WHEN tag is entered THEN it SHALL be validated with regex for letters, spaces, and hyphens: `/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/`
5. WHEN advanced validation is needed THEN at least one advanced regex pattern SHALL be implemented (lookahead, lookbehind, or back-reference)
6. WHEN validation errors occur THEN clear, inline error messages SHALL be displayed
7. WHEN validation passes THEN error messages SHALL be cleared immediately

### Requirement 6: Task Management and Display

**User Story:** As a user managing my academic tasks, I want to view, sort, search, edit, and delete tasks efficiently, so that I can stay organized and track my progress effectively.

#### Acceptance Criteria

1. WHEN tasks are displayed THEN they SHALL be rendered in a responsive table/card layout
2. WHEN sorting is requested THEN tasks SHALL be sortable by date, title (A-Z), and duration (ascending/descending)
3. WHEN search is performed THEN it SHALL use regex patterns with safe compilation and try/catch error handling
4. WHEN search matches are found THEN they SHALL be highlighted using `<mark>` tags without breaking accessibility
5. WHEN editing is initiated THEN inline editing SHALL be available for each task
6. WHEN deletion is requested THEN confirmation SHALL be required before removing tasks
7. WHEN tasks are modified THEN the updatedAt timestamp SHALL be updated automatically

### Requirement 7: Statistics Dashboard and Progress Tracking

**User Story:** As a user tracking my academic workload, I want to see statistics about my tasks and progress toward weekly goals, so that I can manage my time effectively and stay on track.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN it SHALL display total tasks, total hours planned, top tag, and upcoming tasks
2. WHEN weekly targets are set THEN progress SHALL be calculated and displayed with a visual progress bar
3. WHEN targets are exceeded THEN an alert message SHALL be announced via ARIA live regions (assertive)
4. WHEN progress is under target THEN status updates SHALL use polite ARIA live announcements
5. WHEN statistics are calculated THEN they SHALL update automatically when task data changes
6. WHEN the dashboard is viewed THEN it SHALL include a simple CSS-based chart for weekly progress

### Requirement 8: Settings and Unit Management

**User Story:** As a user customizing my planning experience, I want to configure time units and weekly targets, so that the application matches my personal planning preferences and academic schedule.

#### Acceptance Criteria

1. WHEN time units are configured THEN the system SHALL support minutes and hours with conversion capabilities
2. WHEN weekly targets are set THEN they SHALL be persisted in localStorage
3. WHEN settings are changed THEN they SHALL take effect immediately across the application
4. WHEN unit conversions are needed THEN basic minute-to-hour conversions SHALL be available
5. WHEN settings are exported THEN they SHALL be included in the JSON export functionality

### Requirement 9: Advanced Search and Regex Features

**User Story:** As a user searching through my tasks, I want powerful search capabilities including regex patterns, so that I can quickly find specific tasks using flexible search criteria.

#### Acceptance Criteria

1. WHEN regex search is used THEN it SHALL support case-insensitive toggle functionality
2. WHEN invalid regex is entered THEN it SHALL be handled gracefully with try/catch blocks
3. WHEN advanced patterns are used THEN at least one SHALL include lookahead, lookbehind, or back-reference functionality
4. WHEN search results are displayed THEN matches SHALL be highlighted without breaking screen reader accessibility
5. WHEN search patterns are applied THEN they SHALL work on title, tag, and other text fields

### Requirement 10: Code Organization and Modularity

**User Story:** As a developer maintaining this codebase, I want the JavaScript to be well-organized and modular, so that the code is maintainable, testable, and follows best practices.

#### Acceptance Criteria

1. WHEN JavaScript is structured THEN it SHALL use ES Modules or IIFE for modular organization
2. WHEN modules are created THEN they SHALL be separated into logical files (storage.js, state.js, ui.js, validators.js, search.js)
3. WHEN event handling is implemented THEN it SHALL be robust and prevent memory leaks
4. WHEN DOM manipulation occurs THEN it SHALL be efficient and avoid unnecessary reflows
5. WHEN errors occur THEN they SHALL be handled gracefully with appropriate user feedback
6. WHEN the code is reviewed THEN it SHALL follow consistent naming conventions and include appropriate comments

### Requirement 11: Testing and Quality Assurance

**User Story:** As a developer ensuring code quality, I want comprehensive testing capabilities, so that I can verify all functionality works correctly and meets the assignment requirements.

#### Acceptance Criteria

1. WHEN tests are created THEN a tests.html file SHALL include small assertions for validation functions
2. WHEN regex patterns are tested THEN edge cases SHALL be covered with example inputs
3. WHEN functionality is verified THEN manual testing procedures SHALL be documented
4. WHEN the application is tested THEN keyboard navigation SHALL work for all interactive elements
5. WHEN accessibility is tested THEN screen reader compatibility SHALL be verified

### Requirement 12: Documentation and Deployment

**User Story:** As a student submitting this assignment, I want comprehensive documentation and proper deployment, so that the instructor can easily evaluate all features and award full marks.

#### Acceptance Criteria

1. WHEN documentation is created THEN README.md SHALL include chosen theme, features list, regex catalog, keyboard map, and accessibility notes
2. WHEN the project is deployed THEN it SHALL be hosted on GitHub Pages with a working URL
3. WHEN a demo is created THEN a 2-3 minute video SHALL show keyboard navigation, regex edge cases, and import/export functionality
4. WHEN seed data is provided THEN seed.json SHALL contain at least 10 diverse records with edge cases
5. WHEN the repository is organized THEN it SHALL have clean structure with logical file organization and clear commit history