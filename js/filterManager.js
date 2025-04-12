import { config } from './config.js';

// Error message constants
const ERRORS = {
    LOAD_STATE: 'Failed to load persisted filter state:',
    PERSIST_STATE: 'Failed to persist filter state:'
};

/**
 * Manages the visibility state of different node types in the graph
 * Provides persistence and event notification capabilities
 */
class FilterManager {
    /** @type {Map<string, boolean>} Map of node types to their visibility state */
    filterState;
    
    /** @type {Set<Function>} Set of listeners to notify on state changes */
    listeners;

    constructor() {
        this.filterState = new Map();
        this.listeners = new Set();
    }

    /**
     * Initializes filter state from graph data, optionally restoring persisted state
     * @param {Object} graphData - The graph data containing nodes
     * @param {Array} graphData.nodes - Array of node objects
     */
    initFromGraphData(graphData) {
        if (!graphData || !graphData.nodes) return;

        const nodeTypes = new Set(graphData.nodes.map(node => node.type || 'default'));
        
        if (config.filter.persistState) {
            const persistedState = this.loadPersistedState();
            if (persistedState) {
                nodeTypes.forEach(type => {
                    this.filterState.set(type, persistedState[type] ?? config.filter.defaultVisible);
                });
                return;
            }
        }

        nodeTypes.forEach(type => {
            this.filterState.set(type, config.filter.defaultVisible);
        });
    }

    /**
     * Gets the visibility state for a node type
     * @param {string} type - The node type to check
     * @returns {boolean} Whether the type is visible
     */
    isTypeVisible(type) {
        return this.filterState.get(type) ?? config.filter.defaultVisible;
    }

    /**
     * Sets the visibility state for a node type
     * @param {string} type - The node type to set
     * @param {boolean} visible - The visibility state to set
     */
    setTypeVisibility(type, visible) {
        this.filterState.set(type, visible);
        this.notifyListeners();
        if (config.filter.persistState) {
            this.persistState();
        }
    }

    /**
     * Toggles the visibility state for a node type
     * @param {string} type - The node type to toggle
     */
    toggleTypeVisibility(type) {
        const currentState = this.isTypeVisible(type);
        this.setTypeVisibility(type, !currentState);
    }

    /**
     * Sets all node types to the same visibility state
     * @param {boolean} visible - The visibility state to set for all types
     */
    setAllVisibility(visible) {
        this.filterState.forEach((_, type) => {
            this.filterState.set(type, visible);
        });
        this.notifyListeners();
        if (config.filter.persistState) {
            this.persistState();
        }
    }

    /**
     * Gets the current filter state as an object
     * @returns {Object.<string, boolean>} Object mapping node types to their visibility state
     */
    getFilterState() {
        const state = {};
        this.filterState.forEach((value, key) => {
            state[key] = value;
        });
        return state;
    }

    /**
     * Adds a listener for filter state changes
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
        this.listeners.forEach(listener => listener(this.getFilterState()));
    }

    /**
     * Loads persisted state from localStorage
     * @returns {Object.<string, boolean>|null} The persisted state or null if loading fails
     * @private
     */
    loadPersistedState() {
        try {
            const persisted = localStorage.getItem(config.filter.storageKey);
            return persisted ? JSON.parse(persisted) : null;
        } catch (error) {
            console.warn(ERRORS.LOAD_STATE, error);
            return null;
        }
    }

    /**
     * Persists current state to localStorage
     * @private
     */
    persistState() {
        try {
            localStorage.setItem(config.filter.storageKey, JSON.stringify(this.getFilterState()));
        } catch (error) {
            console.warn(ERRORS.PERSIST_STATE, error);
        }
    }
}

// Export a singleton instance
export const filterManager = new FilterManager(); 