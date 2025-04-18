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
        
        /** @type {Array} List of nodes that are neighbors of the focused node */
        this.neighborNodes = [];
        
        /** @type {Array} List of links connected to the focused node */
        this.connectedLinks = [];
        
        /** @type {Array} List of links where the focused node is the source */
        this.outgoingLinks = [];
        
        /** @type {Array} List of links where the focused node is the target */
        this.incomingLinks = [];
    }

    /**
     * Enters focus mode for a specific node
     * @param {Object} node - The node to focus on
     * @param {Object} graphData - The graph data containing nodes and links
     * @returns {boolean} True if focus mode was entered successfully
     */
    enterFocusMode(node, graphData) {
        if (!node || !graphData) return false;
        
        this.focusedNode = node;
        this.isFocusModeActive = true;
        
        // Find connected links and neighbor nodes
        this.findConnectedElements(graphData);
        
        return true;
    }

    /**
     * Exits focus mode
     */
    exitFocusMode() {
        this.focusedNode = null;
        this.isFocusModeActive = false;
        this.neighborNodes = [];
        this.connectedLinks = [];
        this.outgoingLinks = [];
        this.incomingLinks = [];
    }

    /**
     * Finds all elements connected to the focused node
     * @param {Object} graphData - The graph data containing nodes and links
     */
    findConnectedElements(graphData) {
        if (!this.focusedNode || !graphData || !graphData.links) return;
        
        // Reset arrays
        this.neighborNodes = [];
        this.connectedLinks = [];
        this.outgoingLinks = [];
        this.incomingLinks = [];
        
        // Find all links connected to the focused node
        graphData.links.forEach(link => {
            if (link.source === this.focusedNode || link.source.id === this.focusedNode.id) {
                this.outgoingLinks.push(link);
                this.connectedLinks.push(link);
                
                // Add target node to neighbors if not already added
                if (!this.neighborNodes.includes(link.target)) {
                    this.neighborNodes.push(link.target);
                }
            } else if (link.target === this.focusedNode || link.target.id === this.focusedNode.id) {
                this.incomingLinks.push(link);
                this.connectedLinks.push(link);
                
                // Add source node to neighbors if not already added
                if (!this.neighborNodes.includes(link.source)) {
                    this.neighborNodes.push(link.source);
                }
            }
        });
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
}

// Create a singleton instance
const nodeFocusManager = new NodeFocusManager();

export { nodeFocusManager }; 