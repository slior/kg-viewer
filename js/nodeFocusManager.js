import { config } from './config.js';

/**
 * Manages the node focus state and functionality
 */
class NodeFocusManager {
    constructor() {
        /** @type {Object|null} The currently focused node */
        this.focusedNode = null;
        
        /** @type {boolean} Whether focus mode is active */
        this.isFocusModeActive = false;
        
        /** @type {boolean} Whether node context mode is active */
        this.isContextModeActive = false;
        
        /** @type {Array} List of nodes that are neighbors of the focused node */
        this.neighborNodes = [];
        
        /** @type {Array} List of nodes that are 2 links away from the focused node (neighbors of neighbors, excluding neighbors) */
        this.twoHopNeighborNodes = [];
        
        /** @type {Array} List of links connected to the focused node */
        this.connectedLinks = [];
        
        /** @type {Array} List of links where the focused node is the source */
        this.outgoingLinks = [];
        
        /** @type {Array} List of links where the focused node is the target */
        this.incomingLinks = [];
    }

    /**
     * Enters focus or context mode for a specific node.
     * @param {Object} node - The node to focus on.
     * @param {Object} graphData - The graph data containing nodes and links.
     * @param {string} [mode='focus'] - The mode to enter ('focus' or 'context').
     * @returns {boolean} True if the mode was entered successfully.
     */
    enterFocusMode(node, graphData, mode = 'focus') {
        if (!node || !graphData) return false;
        
        this.focusedNode = node;
        
        // Set active mode flag
        if (mode === 'context') {
            this.isContextModeActive = true;
            this.isFocusModeActive = false;
        } else { // Default to focus mode
            this.isFocusModeActive = true;
            this.isContextModeActive = false;
        }
        
        // Find connected elements based on the mode
        this.findConnectedElements(graphData, mode);
        
        return true;
    }

    /**
     * Exits the current focus or context mode.
     */
    exitFocusMode() {
        this.focusedNode = null;
        this.isFocusModeActive = false;
        this.isContextModeActive = false;
        this.neighborNodes = [];
        this.twoHopNeighborNodes = [];
        this.connectedLinks = [];
        this.outgoingLinks = [];
        this.incomingLinks = [];
    }

    /**
     * Finds elements connected to the focused node (neighbors, links) and potentially two-hop neighbors.
     * @param {Object} graphData - The graph data containing nodes and links.
     * @param {string} mode - The current mode ('focus' or 'context') to determine if two-hop neighbors are needed.
     */
    findConnectedElements(graphData, mode) {
        if (!this.focusedNode || !graphData || !graphData.links) return;

        // Reset arrays
        this.neighborNodes = [];
        this.twoHopNeighborNodes = [];
        this.connectedLinks = [];
        this.outgoingLinks = [];
        this.incomingLinks = [];

        const neighborSet = new Set();
        const focusedNodeId = this.focusedNode.id;

        // Find all links connected to the focused node and immediate neighbors
        graphData.links.forEach(link => {
            let sourceNode = link.source;
            let targetNode = link.target;

            // Handle cases where link source/target might be IDs instead of node objects
            if (typeof sourceNode === 'string' || typeof sourceNode === 'number') {
                sourceNode = graphData.nodes.find(n => n.id === sourceNode);
            }
            if (typeof targetNode === 'string' || typeof targetNode === 'number') {
                targetNode = graphData.nodes.find(n => n.id === targetNode);
            }

            if (!sourceNode || !targetNode) {
                console.warn("Link with missing source/target node:", link);
                return; // Skip link if nodes are invalid
            }

            if (sourceNode.id === focusedNodeId) {
                this.outgoingLinks.push(link);
                this.connectedLinks.push(link);
                if (!neighborSet.has(targetNode.id)) {
                    neighborSet.add(targetNode.id);
                    this.neighborNodes.push(targetNode);
                }
            } else if (targetNode.id === focusedNodeId) {
                this.incomingLinks.push(link);
                this.connectedLinks.push(link);
                if (!neighborSet.has(sourceNode.id)) {
                    neighborSet.add(sourceNode.id);
                    this.neighborNodes.push(sourceNode);
                }
            }
        });

        // If context mode, find two-hop neighbors
        if (mode === 'context') {
            const twoHopSet = new Set();
            graphData.links.forEach(link => {
                let sourceNode = link.source;
                let targetNode = link.target;
                
                // Ensure nodes are objects
                 if (typeof sourceNode === 'string' || typeof sourceNode === 'number') {
                    sourceNode = graphData.nodes.find(n => n.id === sourceNode);
                }
                if (typeof targetNode === 'string' || typeof targetNode === 'number') {
                    targetNode = graphData.nodes.find(n => n.id === targetNode);
                }

                if (!sourceNode || !targetNode) return; // Skip if nodes invalid

                const sourceId = sourceNode.id;
                const targetId = targetNode.id;
                
                // Check if source is a neighbor and target is not focused/neighbor
                if (neighborSet.has(sourceId) && targetId !== focusedNodeId && !neighborSet.has(targetId)) {
                    twoHopSet.add(targetNode);
                }
                // Check if target is a neighbor and source is not focused/neighbor
                else if (neighborSet.has(targetId) && sourceId !== focusedNodeId && !neighborSet.has(sourceId)) {
                    twoHopSet.add(sourceNode);
                }
            });
            this.twoHopNeighborNodes = Array.from(twoHopSet); // Convert Set to Array
        }
    }

    /**
     * Checks if a node is the focused node
     * @param {Object} node - The node to check
     * @returns {boolean} True if the node is the focused node
     */
    isFocusedNode(node) {
        return this.focusedNode && (node === this.focusedNode || node.id === this.focusedNode.id);
    }

    /**
     * Checks if a node is a neighbor of the focused node
     * @param {Object} node - The node to check
     * @returns {boolean} True if the node is a neighbor
     */
    isNeighborNode(node) {
        return this.neighborNodes.some(n => n === node || n.id === node.id);
    }

    /**
     * Checks if a link is connected to the focused node
     * @param {Object} link - The link to check
     * @returns {Object} Object with properties indicating if the link is connected and its type
     */
    getLinkConnectionType(link) {
        if (!this.focusedNode || !link) return { isConnected: false};
        
        // Check if the link is connected to the focused node
        const isOutgoing = (link.source.id === this.focusedNode.id);
        const isIncoming = (link.target.id === this.focusedNode.id);

        return { isConnected: isOutgoing || isIncoming};
    }

    /**
     * Checks if node context mode is active.
     * @returns {boolean} True if context mode is active.
     */
    isContextMode() {
        return this.isContextModeActive;
    }

    /**
     * Checks if a node is a two-hop neighbor of the focused node (neighbor of a neighbor, but not a direct neighbor).
     * @param {Object} node - The node to check.
     * @returns {boolean} True if the node is a two-hop neighbor.
     */
    isTwoHopNeighborNode(node) {
        // Ensure node and its ID exist before checking
        if (!node || typeof node.id === 'undefined') return false;
        return this.twoHopNeighborNodes.some(n => n && (n === node || n.id === node.id));
    }
}

// Create a singleton instance
const nodeFocusManager = new NodeFocusManager();

export { nodeFocusManager }; 