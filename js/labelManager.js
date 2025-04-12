import { config } from './config.js';

class LabelManager {
    constructor() {
        this.labelState = {
            nodeLabelsVisible: config.labels.defaultNodeLabelsVisible,
            linkLabelsVisible: config.labels.defaultLinkLabelsVisible
        };
        this.listeners = new Set();
        this.loadPersistedState();
    }

    // Load persisted state from localStorage
    loadPersistedState() {
        if (!config.labels.persistState) return;

        try {
            const persistedState = localStorage.getItem(config.labels.storageKey);
            if (persistedState) {
                const state = JSON.parse(persistedState);
                this.labelState = {
                    nodeLabelsVisible: state.nodeLabelsVisible ?? config.labels.defaultNodeLabelsVisible,
                    linkLabelsVisible: state.linkLabelsVisible ?? config.labels.defaultLinkLabelsVisible
                };
            }
        } catch (error) {
            console.error('Error loading persisted label state:', error);
        }
    }

    // Save current state to localStorage
    savePersistedState() {
        if (!config.labels.persistState) return;

        try {
            localStorage.setItem(config.labels.storageKey, JSON.stringify(this.labelState));
        } catch (error) {
            console.error('Error saving label state:', error);
        }
    }

    // Get current label visibility state
    getLabelState() {
        return { ...this.labelState };
    }

    // Set node labels visibility
    setNodeLabelsVisible(visible) {
        this.labelState.nodeLabelsVisible = visible;
        this.savePersistedState();
        this.notifyListeners();
    }

    // Set link labels visibility
    setLinkLabelsVisible(visible) {
        this.labelState.linkLabelsVisible = visible;
        this.savePersistedState();
        this.notifyListeners();
    }

    // Add a listener for state changes
    addListener(listener) {
        this.listeners.add(listener);
    }

    // Remove a listener
    removeListener(listener) {
        this.listeners.delete(listener);
    }

    // Notify all listeners of state change
    notifyListeners() {
        this.listeners.forEach(listener => listener(this.labelState));
    }
}

// Export a singleton instance
export const labelManager = new LabelManager(); 