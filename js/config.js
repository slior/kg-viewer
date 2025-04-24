// js/config.js
import { getColorForType } from './colorManager.js';

// Graph visualization constants
const GRAPH_CONSTANTS = {
    NODE_SIZE: 8,
    LINK_WIDTH: 1,
    LINK_OPACITY: 0.6,
    PARTICLE_WIDTH: 2,
    PARTICLE_SPEED: 0.01,
    ARROW_LENGTH: 3.5,
    ARROW_COLOR: 'rgba(200, 200, 200, 0.8)',
    BACKGROUND_COLOR: 0x111111,
    LABEL_DISTANCE: 150
};

// Focus mode constants
const FOCUS_CONSTANTS = {
    FOCUSED_NODE_COLOR: 0xdddddd, 
    NEIGHBOR_NODE_COLOR: 0x009999,
    NEIGHBOR_NODE_BORDER_COLOR: 0xbbbbbb, 
    INCOMING_LINK_COLOR: 0x00ff00, // Green
    OUTGOING_LINK_COLOR: 0xff0000, // Red
    DIMMED_NODE_OPACITY: 0.2,
    DIMMED_NODE_COLOR: 0x333333,
    FOCUS_INDICATOR_COLOR: 'rgba(255, 255, 255, 0.2)',
    FOCUS_INDICATOR_BORDER_COLOR: 'rgba(255, 255, 255, 0.5)',
    CONTEXT_MODE_INDICATOR_TEXT: 'Node Context Mode'
};

// Force simulation constants
const FORCE_CONSTANTS = {
    CHARGE_STRENGTH: -50,
    LINK_DISTANCE: 50,
    WARMUP_TICKS: 200,
    COOLDOWN_TICKS: 0,
    COOLDOWN_TIME: 15000
};

// Camera constants
const CAMERA_CONSTANTS = {
    INITIAL_DISTANCE: 300,
    NEAR: 0.1,
    FAR: 10000,
    DAMPING_FACTOR: 0.05,
    ROTATE_SPEED: 0.5,
    ZOOM_SPEED: 1.0,
    PAN_SPEED: 0.5,
    MOVE_SPEED: 200,
    ASCEND_DESCEND_SPEED: 2.0
};

const API_CONSTANTS = {
    BASE_URL: 'http://localhost:8000',
    ENDPOINT: '/data',
    DEFAULT_DATA_SET: 'kg.json',
    TIMEOUT: 10000,
    RETRY_COUNT: 3
};

/**
 * Central configuration object for the application
 * @type {Object}
 */
export const config = {
    graph: {
        nodeSize: GRAPH_CONSTANTS.NODE_SIZE,
        linkWidth: GRAPH_CONSTANTS.LINK_WIDTH,
        linkOpacity: GRAPH_CONSTANTS.LINK_OPACITY,
        particleWidth: GRAPH_CONSTANTS.PARTICLE_WIDTH,
        particleSpeed: GRAPH_CONSTANTS.PARTICLE_SPEED,
        arrowLength: GRAPH_CONSTANTS.ARROW_LENGTH,
        arrowColor: GRAPH_CONSTANTS.ARROW_COLOR,
    },
    forceGraph: {
        chargeStrength: FORCE_CONSTANTS.CHARGE_STRENGTH,
        linkDistance: FORCE_CONSTANTS.LINK_DISTANCE,
        warmupTicks: FORCE_CONSTANTS.WARMUP_TICKS,
        cooldownTicks: FORCE_CONSTANTS.COOLDOWN_TICKS,
        cooldownTime: FORCE_CONSTANTS.COOLDOWN_TIME,
    },
    visualization: {
        backgroundColor: GRAPH_CONSTANTS.BACKGROUND_COLOR,
        nodeShapes: 'sphere',
        nodeColors: {
            'default': '#9E9E9E'
        },
        labelDistance: GRAPH_CONSTANTS.LABEL_DISTANCE,
    },
    camera: {
        initialDistance: CAMERA_CONSTANTS.INITIAL_DISTANCE,
        near: CAMERA_CONSTANTS.NEAR,
        far: CAMERA_CONSTANTS.FAR,
        controls: {
            enableDamping: true,
            dampingFactor: CAMERA_CONSTANTS.DAMPING_FACTOR,
            rotateSpeed: CAMERA_CONSTANTS.ROTATE_SPEED,
            zoomSpeed: CAMERA_CONSTANTS.ZOOM_SPEED,
            panSpeed: CAMERA_CONSTANTS.PAN_SPEED,
            moveSpeed: CAMERA_CONSTANTS.MOVE_SPEED,
            ascendDescendSpeed: CAMERA_CONSTANTS.ASCEND_DESCEND_SPEED
        }
    },
    ui: {
        infoPanelId: 'info-content',
        legendPanelId: 'legend-content',
        statsPanelId: 'stats-content',
        reloadButtonId: 'reload-button',
        graphContainerId: 'graph-container'
    },
    api: {
        apiBaseUrl: API_CONSTANTS.BASE_URL,
        apiEndpoint: API_CONSTANTS.ENDPOINT,
        defaultDataSet: API_CONSTANTS.DEFAULT_DATA_SET,
        fetchTimeout: API_CONSTANTS.TIMEOUT,
        retryCount: API_CONSTANTS.RETRY_COUNT
    },
    filter: {
        persistState: true,
        storageKey: 'kg-viewer-filters',
        defaultVisible: true
    },
    labels: {
        persistState: true, // Whether to persist label visibility state
        storageKey: 'kg-viewer-labels', // localStorage key for label visibility state
        defaultNodeLabelsVisible: true, // Default visibility for node labels
        defaultLinkLabelsVisible: true // Default visibility for link labels
    },
    focus: FOCUS_CONSTANTS
};

/**
 * Gets the color for a node based on its type
 * @param {string} nodeType - The type of the node
 * @returns {string} The color code for the node type
 */
export function getNodeColor(nodeType) {
    if (!nodeType || nodeType === 'default') {
        return config.visualization.nodeColors['default'];
    }
    let ret = getColorForType(nodeType);
    return ret;
}