import React, { useState } from 'react';
import { TaskProvider } from './contexts/TaskContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AboutPage } from './pages/AboutPage';
import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import { SettingsPage } from './pages/SettingsPage';
import { Toaster } from './components/ui/sonner';

type Page = 'about' | 'dashboard' | 'tasks' | 'settings';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('about');

  const renderPage = () => {
    switch (currentPage) {
      case 'about':
        return <AboutPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'tasks':
        return <TasksPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <AboutPage />;
    }
  };

  return (
    <TaskProvider>
      <SettingsProvider>
        <div className="min-h-screen flex flex-col bg-slate-50">
          {/* Skip Link for Accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[9999] focus:px-6 focus:py-3 focus:bg-blue-600 focus:text-white focus:rounded-md focus:m-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
          >
            Skip to main content
          </a>

          <Header currentPage={currentPage} onNavigate={(page) => setCurrentPage(page as Page)} />

          <main
            id="main-content"
            role="main"
            className="flex-1 mt-16 px-4 py-6 md:px-6 md:py-8 max-w-[1200px] mx-auto w-full"
          >
            {renderPage()}
          </main>

          <Footer />
          <Toaster />
        </div>
      </SettingsProvider>
    </TaskProvider>
  );
}
