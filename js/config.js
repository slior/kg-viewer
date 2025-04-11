// js/config.js
import { getColorForType } from './colorManager.js';

// Central configuration for the application
export const config = {
    graph: {
        nodeSize: 8, // Default size for nodes
        linkWidth: 1, // Default width for links
        linkOpacity: 0.6, // Default opacity for links
        particleWidth: 2, // Width for particle effects on links (optional)
        particleSpeed: 0.01, // Speed for particle effects (optional)
        arrowLength: 4, // Length of the arrowhead
        arrowColor: 'rgba(200, 200, 200, 0.8)', // Color of the arrowhead
    },
    forceGraph: {
        chargeStrength: -50, // Repulsion force between nodes
        linkDistance: 50, // Desired distance between linked nodes
        warmupTicks: 200, // Number of layout simulation ticks to run initially
        cooldownTicks: 0, // Ticks to run after interaction (0 means stop immediately)
        cooldownTime: 15000, // Time in ms for layout engine to run
    },
    visualization: {
        backgroundColor: 0x111111, // Scene background color (use hex for three.js)
        nodeShapes: 'sphere', // Default shape: 'sphere' or 'box' (implement switching later)
        // Define colors based on node 'type'
        nodeColors: {
            'default': '#9E9E9E' // Grey for undefined types
        },
        labelDistance: 150, // Max distance to show node/link labels
    },
    camera: {
        initialDistance: 300, // Initial distance from the center
        near: 0.1, // Camera near clipping plane
        far: 10000, // Camera far clipping plane
        controls: {
            enableDamping: true, // Smoother camera movement
            dampingFactor: 0.05,
            rotateSpeed: 0.5,
            zoomSpeed: 1.0,
            panSpeed: 0.5,
            // Custom keyboard controls (might need separate implementation)
            moveSpeed: 200, // Speed for WASD/arrow keys
            ascendDescendSpeed: 2.0 // Speed for PageUp/PageDown
        }
    },
    ui: {
        infoPanelId: 'info-content',
        legendPanelId: 'legend-content',
        statsPanelId: 'stats-content',
        reloadButtonId: 'reload-button',
        graphContainerId: 'graph-container'
    },
    // API configuration for fetching data from server
    api: {
        apiBaseUrl: 'http://localhost:8001', // Base URL for the server
        apiEndpoint: '/data/kg.json', // Endpoint to fetch graph data
        fetchTimeout: 10000, // 10 seconds timeout for API requests
        retryCount: 3 // Number of retries for failed requests
    },
    // Filter configuration
    filter: {
        persistState: true, // Whether to persist filter state
        storageKey: 'kg-viewer-filters', // localStorage key for filter state
        defaultVisible: true // Default visibility state for node types
    }
};

// Function to get color based on node type
export function getNodeColor(nodeType) {
    // Use the dynamic color manager for all types except undefined
    if (!nodeType) {
        return config.visualization.nodeColors['default'];
    }
    
    return getColorForType(nodeType);
}