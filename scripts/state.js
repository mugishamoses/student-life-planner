/**
 * AppState - Centralized state management with observable pattern
 * Handles tasks, settings, and UI state with automatic persistence
 */

import { getDataManager } from "./data-manager.js";

export class AppState {
  constructor() {
    // Initialize storage first
    this.storage = null;
    this.dataManager = null;

    // Try to load state from localStorage first
    let savedState = null;
    try {
      const saved = localStorage.getItem("campusLifePlannerState");
      if (saved) {
        savedState = JSON.parse(saved);
      }
    } catch (error) {
      console.error("Failed to load from localStorage:", error);
    }

    this.state = {
      tasks: savedState?.tasks || [],
      settings: {
        timeUnit: "both",
        weeklyHourTarget: 40,
        theme: "light",
        defaultTag: "General",
        sortPreference: "date-newest",
        searchCaseSensitive: false,
        ...(savedState?.settings || {}),
      },
      ui: {
        currentPage: "about",
        modalOpen: null,
        searchQuery: "",
        searchMode: "text",
        sortBy: "date-newest",
        filterBy: "all",
        selectedTasks: [],
        toastMessage: null,
        viewMode: "table",
        ...(savedState?.ui || {}),
      },
    };

    this.observers = [];
    this.isInitialized = false;

    // Initialize asynchronously
    this.initializeAsync().catch((error) => {
      console.error("State initialization failed:", error);
      // Set initialized to true even on error to prevent app from hanging
      this.isInitialized = true;
    });
  }

  /**
   * Observable pattern implementation
   */
  subscribe(callback) {
    this.observers.push(callback);
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  unsubscribe(callback) {
    const index = this.observers.indexOf(callback);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  notify(changes) {
    this.observers.forEach((callback) => {
      try {
        callback(changes, this.state);
      } catch (error) {
        console.error("Error in state observer:", error);
      }
    });
  }

  /**
   * Task CRUD operations
   */
  getTasks() {
    return [...this.state.tasks];
  }

  addTask(taskData) {
    console.log("=== STATE: addTask called ===");
    console.log("Input data:", taskData);
    console.log("Current tasks count:", this.state.tasks.length);

    // Validate required fields
    if (!taskData.title?.trim() || !taskData.dueDate || !taskData.duration) {
      console.error("STATE: Missing required fields:", taskData);
      throw new Error("All required fields must be provided");
    }

    // Create task with validated data
    let task = {
      id: "task_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      title: taskData.title.trim(),
      dueDate: taskData.dueDate,
      duration: parseInt(taskData.duration),
      tag: taskData.tag?.trim() || "General",
      status: "Pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log("STATE: Created task object:", task);

    // Ensure tasks array exists
    if (!Array.isArray(this.state.tasks)) {
      console.log("STATE: Initializing tasks array");
      this.state.tasks = [];
    }

    // Add to state
    this.state.tasks.push(task);
    console.log(
      "STATE: Task added to array, new count:",
      this.state.tasks.length
    );

    // Save to localStorage directly
    try {
      console.log("STATE: Attempting to save to storage...");
      const success = this.saveToStorage();
      if (!success) {
        console.error("STATE: Save to storage failed");
        // Rollback if save failed
        this.state.tasks = this.state.tasks.filter((t) => t.id !== task.id);
        throw new Error("Failed to save task. Please try again.");
      }

      console.log("STATE: Task saved to storage successfully");

      // Notify UI to update
      console.log("STATE: Notifying observers...");
      console.log("STATE: Number of observers:", this.observers.length);
      this.notify({ type: "TASK_ADDED", task });
      console.log("STATE: Observers notified");

      console.log("=== STATE: addTask completed successfully ===");
      return task;
    } catch (error) {
      console.error("STATE: Failed to save task:", error);
      // Remove task from state if save fails
      this.state.tasks = this.state.tasks.filter((t) => t.id !== task.id);
      throw error;
    }
  }

  /**
   * Save current state to storage
   * @returns {boolean} Success status
   */
  saveToStorage() {
    try {
      // Create a clean copy of the state for storage
      const stateToSave = {
        tasks: this.state.tasks,
        settings: this.state.settings,
        ui: {
          sortBy: this.state.ui.sortBy,
          filterBy: this.state.ui.filterBy,
          searchMode: this.state.ui.searchMode,
          viewMode: this.state.ui.viewMode,
        },
      };

      // Save directly to localStorage
      const serializedState = JSON.stringify(stateToSave);
      localStorage.setItem("campusLifePlannerState", serializedState);

      // Verify the save
      const saved = localStorage.getItem("campusLifePlannerState");
      if (!saved) {
        throw new Error("Data was not saved to localStorage");
      }

      return true;
    } catch (error) {
      console.error("Error saving to storage:", error);
      return false;
    }
  }

  /**
   * Load state from storage
   */
  async loadFromStorage() {
    if (!this.storage) {
      console.error("Storage not initialized");
      return;
    }

    try {
      const savedState = this.storage.load("campusLifePlannerState");

      if (savedState) {
        // Merge saved state with current state
        this.state = {
          tasks: Array.isArray(savedState.tasks) ? savedState.tasks : [],
          settings: {
            ...this.state.settings,
            ...savedState.settings,
          },
          ui: {
            ...this.state.ui,
            ...savedState.ui,
          },
        };

        console.log("State loaded from storage:", this.state);
      }
    } catch (error) {
      console.error("Error loading from storage:", error);
    }
  }

  updateTask(id, updates) {
    const taskIndex = this.state.tasks.findIndex((task) => task.id === id);
    if (taskIndex === -1) {
      throw new Error(`Task with id ${id} not found`);
    }

    const updatedTask = {
      ...this.state.tasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.state.tasks[taskIndex] = updatedTask;
    this.saveToStorage();
    this.notify({ type: "TASK_UPDATED", task: updatedTask });

    return updatedTask;
  }

  deleteTask(id) {
    const taskIndex = this.state.tasks.findIndex((task) => task.id === id);

    if (taskIndex === -1) {
      throw new Error(`Task with id ${id} not found`);
    }

    const deletedTask = this.state.tasks[taskIndex];
    this.state.tasks.splice(taskIndex, 1);

    const saveSuccess = this.saveToStorage();
    if (!saveSuccess) {
      // Rollback
      this.state.tasks.splice(taskIndex, 0, deletedTask);
      throw new Error("Failed to save after deleting task");
    }

    this.notify({ type: "TASK_DELETED", task: deletedTask });
    return deletedTask;
  }

  /**
   * Settings management
   */
  getSettings() {
    return { ...this.state.settings };
  }

  updateSettings(updates) {
    const previousSettings = { ...this.state.settings };
    this.state.settings = {
      ...this.state.settings,
      ...updates,
    };

    this.saveToStorage();
    this.notify({
      type: "SETTINGS_UPDATED",
      settings: this.state.settings,
      previousSettings,
    });

    return this.state.settings;
  }

  /**
   * UI state management
   */
  getUIState() {
    return { ...this.state.ui };
  }

  updateUIState(updates) {
    const previousUIState = { ...this.state.ui };
    this.state.ui = {
      ...this.state.ui,
      ...updates,
    };

    // UI state changes don't need persistence for most properties
    // Only persist certain UI preferences
    const persistentUIProps = ["sortBy", "filterBy", "searchMode", "viewMode"];
    const shouldPersist = Object.keys(updates).some((key) =>
      persistentUIProps.includes(key)
    );

    if (shouldPersist) {
      this.saveToStorage();
    }

    this.notify({
      type: "UI_STATE_UPDATED",
      uiState: this.state.ui,
      previousUIState,
    });

    return this.state.ui;
  }

  /**
   * Utility methods
   */
  generateTaskId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `task_${timestamp}_${random}`;
  }

  /**
   * Initialize state asynchronously with JSON file fallback
   */
  async initializeAsync() {
    try {
      // Import data manager
      const { getDataManager } = await import("./data-manager.js");
      this.dataManager = getDataManager();

      // Import storage
      const { storage } = await import("./storage.js");
      this.storage = storage;

      // First, try to load from localStorage
      this.loadFromStorage();

      // If no tasks in localStorage, try to load from JSON file
      if (!this.state.tasks.length && this.dataManager) {
        const initialData = await this.dataManager.initialize(this.state);

        if (initialData) {
          // Merge JSON file data with current state
          this.state = {
            tasks: Array.isArray(initialData.tasks) ? initialData.tasks : [],
            settings: {
              ...this.state.settings,
              ...initialData.settings,
            },
            ui: {
              ...this.state.ui,
              ...initialData.ui,
              // Reset transient UI state
              modalOpen: null,
              toastMessage: null,
              selectedTasks: [],
            },
          };

          // Validate tasks array
          this.state.tasks = this.state.tasks.filter(
            (task) => task && task.title && task.dueDate && task.id
          );

          // Save validated state to localStorage
          this.saveToStorage();

          console.log("AppState: Initialized with JSON file data");
        }
      }

      // Ensure tasks is always an array
      if (!Array.isArray(this.state.tasks)) {
        this.state.tasks = [];
      }

      this.isInitialized = true;
      this.notify({ type: "STATE_INITIALIZED", state: this.state });
    } catch (error) {
      console.error("Error during async initialization:", error);
      // Ensure we have a valid state even after error
      this.state.tasks = this.state.tasks || [];
      this.isInitialized = true;
      this.notify({ type: "STATE_INITIALIZED", state: this.state });
    }
  }

  loadFromStorage() {
    try {
      const savedState = localStorage.getItem("campusLifePlannerState");
      if (savedState) {
        const parsedState = JSON.parse(savedState);

        // Merge saved state with defaults to handle new properties
        this.state = {
          tasks: parsedState.tasks || [],
          settings: {
            ...this.state.settings,
            ...parsedState.settings,
          },
          ui: {
            ...this.state.ui,
            ...parsedState.ui,
            // Reset transient UI state
            modalOpen: null,
            toastMessage: null,
            selectedTasks: [],
            // Preserve viewMode preference
            viewMode: parsedState.ui?.viewMode || "table",
          },
        };
      }
    } catch (error) {
      console.error("Error loading state from storage:", error);
      // Continue with default state if loading fails
    }
  }

  saveToStorage() {
    const stateToSave = {
      tasks: this.state.tasks,
      settings: this.state.settings,
      ui: {
        // Only save persistent UI state
        sortBy: this.state.ui.sortBy,
        filterBy: this.state.ui.filterBy,
        searchMode: this.state.ui.searchMode,
        viewMode: this.state.ui.viewMode,
      },
    };

    try {
      // Ensure data is valid before saving
      if (!Array.isArray(stateToSave.tasks)) {
        stateToSave.tasks = [];
      }

      console.log("Saving to localStorage:", stateToSave.tasks.length, "tasks");

      const serializedState = JSON.stringify(stateToSave);
      localStorage.setItem("campusLifePlannerState", serializedState);

      // Verify the save was successful
      const savedData = localStorage.getItem("campusLifePlannerState");
      if (!savedData) {
        throw new Error("Data was not saved successfully");
      }

      console.log("Successfully saved to localStorage");

      // Also create JSON file backup (throttled)
      if (this.dataManager && this.dataManager.isReady()) {
        this.dataManager.saveToJsonFile(stateToSave);
      }

      return true;
    } catch (error) {
      console.error("Error saving state to localStorage:", error);
      // Implement fallback to sessionStorage
      try {
        const serializedState = JSON.stringify(stateToSave);
        sessionStorage.setItem("campusLifePlannerState", serializedState);
        console.warn(
          "Fallback: Saved to sessionStorage instead of localStorage"
        );
        return true;
      } catch (fallbackError) {
        console.error("Error saving to fallback storage:", fallbackError);
        return false;
      }
    }
  }

  /**
   * Get complete state (for debugging/export)
   */
  getState() {
    return {
      tasks: [...this.state.tasks],
      settings: { ...this.state.settings },
      ui: { ...this.state.ui },
    };
  }

  /**
   * Reset state to defaults
   */
  reset() {
    this.state = {
      tasks: [],
      settings: {
        timeUnit: "both",
        weeklyHourTarget: 40,
        theme: "light",
        defaultTag: "General",
        sortPreference: "date-newest",
        searchCaseSensitive: false,
      },
      ui: {
        currentPage: "about",
        modalOpen: null,
        searchQuery: "",
        searchMode: "text",
        sortBy: "date-newest",
        filterBy: "all",
        selectedTasks: [],
        toastMessage: null,
        viewMode: "table",
      },
    };

    this.saveToStorage();
    this.notify({ type: "STATE_RESET" });
  }

  /**
   * Check if state is fully initialized
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Manually trigger a backup download
   */
  async createManualBackup() {
    if (!this.dataManager) {
      throw new Error("DataManager not available");
    }

    const stateToBackup = {
      tasks: this.state.tasks,
      settings: this.state.settings,
      ui: {
        sortBy: this.state.ui.sortBy,
        filterBy: this.state.ui.filterBy,
        searchMode: this.state.ui.searchMode,
        viewMode: this.state.ui.viewMode,
      },
    };

    return await this.dataManager.manualBackup(stateToBackup);
  }

  /**
   * Import data from uploaded file
   */
  async importFromFile(file) {
    if (!this.dataManager) {
      throw new Error("DataManager not available");
    }

    const result = await this.dataManager.importFromFile(file);

    if (result.success && result.data) {
      // Merge imported data with current state
      const importedData = result.data;

      // Import tasks (replace existing)
      if (importedData.tasks && Array.isArray(importedData.tasks)) {
        this.state.tasks = importedData.tasks;
      }

      // Import settings (merge with existing)
      if (importedData.settings && typeof importedData.settings === "object") {
        this.state.settings = {
          ...this.state.settings,
          ...importedData.settings,
        };
      }

      // Import UI preferences (merge with existing)
      if (importedData.ui && typeof importedData.ui === "object") {
        this.state.ui = {
          ...this.state.ui,
          ...importedData.ui,
          // Reset transient UI state
          modalOpen: null,
          toastMessage: null,
          selectedTasks: [],
        };
      }

      // Save to localStorage
      this.saveToStorage();

      // Notify observers
      this.notify({ type: "DATA_IMPORTED", importedData });
    }

    return result;
  }

  /**
   * Enable/disable automatic backup downloads
   */
  setAutoBackup(enabled) {
    if (this.dataManager) {
      this.dataManager.setAutoDownload(enabled);
    }
  }

  /**
   * Get auto backup status
   */
  getAutoBackupStatus() {
    return localStorage.getItem("campusLifePlannerAutoBackup") === "true";
  }
}
