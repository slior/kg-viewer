import { config } from './config.js';

class FilterManager {
    constructor() {
        this.filterState = new Map();
        this.listeners = new Set();
    }

    // Initialize filter state from graph data
    initFromGraphData(graphData) {
        if (!graphData || !graphData.nodes) return;

        // Get unique node types
        const nodeTypes = new Set(graphData.nodes.map(node => node.type || 'default'));
        
        // Load persisted state if enabled
        if (config.filter.persistState) {
            const persistedState = this.loadPersistedState();
            if (persistedState) {
                // Only restore persisted types that exist in current graph
                nodeTypes.forEach(type => {
                    this.filterState.set(type, persistedState[type] ?? config.filter.defaultVisible);
                });
                return;
            }
        }

        // Initialize all types as visible
        nodeTypes.forEach(type => {
            this.filterState.set(type, config.filter.defaultVisible);
        });
    }

    // Get visibility state for a node type
    isTypeVisible(type) {
        return this.filterState.get(type) ?? config.filter.defaultVisible;
    }

    // Set visibility state for a node type
    setTypeVisibility(type, visible) {
        this.filterState.set(type, visible);
        this.notifyListeners();
        if (config.filter.persistState) {
            this.persistState();
        }
    }

    // Toggle visibility for a node type
    toggleTypeVisibility(type) {
        const currentState = this.isTypeVisible(type);
        this.setTypeVisibility(type, !currentState);
    }

    // Set all types to the same visibility state
    setAllVisibility(visible) {
        this.filterState.forEach((_, type) => {
            this.filterState.set(type, visible);
        });
        this.notifyListeners();
        if (config.filter.persistState) {
            this.persistState();
        }
    }

    // Get current filter state as an object
    getFilterState() {
        const state = {};
        this.filterState.forEach((value, key) => {
            state[key] = value;
        });
        return state;
    }

    // Add a listener for filter state changes
    addListener(listener) {
        this.listeners.add(listener);
    }

    // Remove a listener
    removeListener(listener) {
        this.listeners.delete(listener);
    }

    // Notify all listeners of state changes
    notifyListeners() {
        this.listeners.forEach(listener => listener(this.getFilterState()));
    }

    // Load persisted state from localStorage
    loadPersistedState() {
        try {
            const persisted = localStorage.getItem(config.filter.storageKey);
            return persisted ? JSON.parse(persisted) : null;
        } catch (error) {
            console.warn('Failed to load persisted filter state:', error);
            return null;
        }
    }

    // Persist current state to localStorage
    persistState() {
        try {
            localStorage.setItem(config.filter.storageKey, JSON.stringify(this.getFilterState()));
        } catch (error) {
            console.warn('Failed to persist filter state:', error);
        }
    }
}

// Export a singleton instance
export const filterManager = new FilterManager(); 