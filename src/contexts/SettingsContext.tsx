import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type TimeUnit = 'minutes' | 'hours' | 'both';

interface Settings {
  timeUnit: TimeUnit;
  weeklyHourTarget: number;
}

interface SettingsContextType {
  settings: Settings;
  updateTimeUnit: (unit: TimeUnit) => void;
  updateWeeklyTarget: (target: number) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const DEFAULT_SETTINGS: Settings = {
  timeUnit: 'minutes',
  weeklyHourTarget: 20,
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    const stored = localStorage.getItem('campus-planner-settings');
    return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('campus-planner-settings', JSON.stringify(settings));
  }, [settings]);

  const updateTimeUnit = (unit: TimeUnit) => {
    setSettings(prev => ({ ...prev, timeUnit: unit }));
  };

  const updateWeeklyTarget = (target: number) => {
    setSettings(prev => ({ ...prev, weeklyHourTarget: target }));
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateTimeUnit,
        updateWeeklyTarget,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};
