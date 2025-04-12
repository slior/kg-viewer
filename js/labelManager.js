import { config } from './config.js';

// Error message constants
const ERRORS = {
    LOAD_STATE: 'Error loading persisted label state:',
    SAVE_STATE: 'Error saving label state:'
};

/**
 * Manages the visibility state of node and link labels in the graph
 * Provides persistence and event notification capabilities
 */
class LabelManager {
    /** @type {{nodeLabelsVisible: boolean, linkLabelsVisible: boolean}} Current label visibility state */
    labelState;
    
    /** @type {Set<Function>} Set of listeners to notify on state changes */
    listeners;

    constructor() {
        this.labelState = {
            nodeLabelsVisible: config.labels.defaultNodeLabelsVisible,
            linkLabelsVisible: config.labels.defaultLinkLabelsVisible
        };
        this.listeners = new Set();
        this.loadPersistedState();
    }

    /**
     * Loads persisted state from localStorage
     * @private
     */
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
            console.error(ERRORS.LOAD_STATE, error);
        }
    }

    /**
     * Saves current state to localStorage
     * @private
     */
    savePersistedState() {
        if (!config.labels.persistState) return;

        try {
            localStorage.setItem(config.labels.storageKey, JSON.stringify(this.labelState));
        } catch (error) {
            console.error(ERRORS.SAVE_STATE, error);
        }
    }

    /**
     * Gets the current label visibility state
     * @returns {{nodeLabelsVisible: boolean, linkLabelsVisible: boolean}} Copy of the current state
     */
    getLabelState() {
        return { ...this.labelState };
    }

    /**
     * Sets the visibility state for node labels
     * @param {boolean} visible - The visibility state to set
     */
    setNodeLabelsVisible(visible) {
        this.labelState.nodeLabelsVisible = visible;
        this.savePersistedState();
        this.notifyListeners();
    }

    /**
     * Sets the visibility state for link labels
     * @param {boolean} visible - The visibility state to set
     */
    setLinkLabelsVisible(visible) {
        this.labelState.linkLabelsVisible = visible;
        this.savePersistedState();
        this.notifyListeners();
    }

    /**
     * Adds a listener for label state changes
     * @param {Function} listener - Callback function to notify of state changes
     */
    addListener(listener) {
        this.listeners.add(listener);
    }

    /**
     * Removes a listener
     * @param {Function} listener - The listener to remove
     */
    removeListener(listener) {
        this.listeners.delete(listener);
    }

    /**
     * Notifies all listeners of state changes
     * @private
     */
    notifyListeners() {
        this.listeners.forEach(listener => listener(this.labelState));
    }
}

// Export a singleton instance
export const labelManager = new LabelManager(); 