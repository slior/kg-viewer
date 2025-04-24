// js/uiManager.js
import { config, getNodeColor } from './config.js';
import { filterManager } from './filterManager.js';
import { labelManager } from './labelManager.js';
import { nodeFocusManager } from './nodeFocusManager.js'; // Import node focus manager

// Error message constants
const ERRORS = {
    CONTAINER_NOT_FOUND: 'Container element not found:',
    ELEMENT_NOT_FOUND: 'Element not found:',
    NO_DATA_PROVIDED: 'No graph data provided to update statistics',
    NO_LEGEND_DATA: 'No graph data provided to generate legend'
};

// Log message constants
const LOG_MESSAGES = {
    INITIALIZING: 'Initializing UI Manager...',
    INITIALIZED: 'UI Manager Initialized.',
    UPDATING_STATS: 'Updating statistics...',
    STATS_UPDATED: 'Statistics updated.',
    GENERATING_LEGEND: 'Generating legend...',
    LEGEND_GENERATED: 'Legend generated.'
};

const ITEM_TYPE_NODE = 'node';
const ITEM_TYPE_LINK = 'link';

// UI element references

/** @type {HTMLElement} The legend content element */
let legendContent;
/** @type {HTMLElement} The info content element */
let infoContent;

/** @type {HTMLElement} The statistics content element */
const statsContent = document.getElementById(config.ui.statsPanelId);
/** @type {HTMLElement} The labels content element */
const labelsContent = document.getElementById('labels-content');
/** @type {HTMLElement} The reload button element */
const reloadButton = document.getElementById(config.ui.reloadButtonId);

// --- Loading and Error UI Elements ---
/** @type {HTMLElement} The loading indicator element */
const loadingOverlay = document.getElementById('loading-indicator');
/** @type {HTMLElement} The error message element */
const errorToast = document.getElementById('error-message');

/**
 * Initializes the UI Manager
 * Sets up UI elements and event listeners
 */
export function initUIManager(graphData, reloadGraph, loadData) {
    console.log(LOG_MESSAGES.INITIALIZING);

    // Get UI elements
    legendContent = document.getElementById('legend-content');
    infoContent = document.getElementById('info-content');
    
    // Validate UI elements
    if (!loadingOverlay) console.error(ERRORS.CONTAINER_NOT_FOUND, 'loading-indicator');
    if (!errorToast) console.error(ERRORS.CONTAINER_NOT_FOUND, 'error-message');
    if (!statsContent) console.error(ERRORS.CONTAINER_NOT_FOUND, 'stats-content');
    if (!legendContent) console.error(ERRORS.CONTAINER_NOT_FOUND, 'legend-content');
    if (!infoContent) console.error(ERRORS.CONTAINER_NOT_FOUND, 'info-content');
    if (!labelsContent) console.error(ERRORS.CONTAINER_NOT_FOUND, 'labels-content');
  

    infoContent.innerHTML = 'Select a node or edge to see details.';
    updateStats(graphData);
    generateLegend(graphData);
    initLabelControls();
    reloadButton.addEventListener('click', () => {
        console.log("Reload button clicked.");
        if (reloadGraph) {
            reloadGraph();
        }
    });

    // Initialize data set selection
    const dataSetInput = document.getElementById('data-set-input');
    const loadDataButton = document.getElementById('load-data-button');

    // Set default data set
    dataSetInput.value = config.api.defaultDataSet;

    // Add event listeners for data set loading
    loadDataButton.addEventListener('click', async () => {
        if (loadData) {
            loadData();
        }
    });

    // Add input validation
    dataSetInput.addEventListener('input', () => {
        const value = dataSetInput.value;
        if (value.includes('..')) {
            showErrorMessage('Invalid path: Directory traversal not allowed');
            dataSetInput.value = value.replace(/\.\./g, '');
        }
    });

    // Add keyboard event listener for Escape key
    document.addEventListener('keydown', handleKeyDown);

    // Add click event listener for clicking outside the graph
    document.addEventListener('click', handleDocumentClick);

    console.log(LOG_MESSAGES.INITIALIZED);
}

/**
 * Handles keyboard events, checking for Escape key to exit focus/context mode.
 * @param {KeyboardEvent} event - The keyboard event
 */
function handleKeyDown(event) {
    // Check if Escape key is pressed and either focus or context mode is active
    if (event.key === 'Escape' && (nodeFocusManager.isFocusModeActive || nodeFocusManager.isContextModeActive)) {
        console.log("Escape pressed, exiting active mode");
        
        // Exit the current mode (handles resetting flags in the manager)
        nodeFocusManager.exitFocusMode(); 
        
        // Notify graph visualization to remove mode styling (refresh graph, update indicator)
        const exitModeEvent = new CustomEvent('exitFocusMode'); // Reuse existing event name
        document.dispatchEvent(exitModeEvent);
        
        // Update the info panel to remove any node details and the mode indicator text
        if (infoContent) {
            updateInfoPanel(null, 'node'); // Clear panel
        }
    }
}

/**
 * Handles document click events, exiting focus/context mode if click is outside the graph container.
 * @param {MouseEvent} event - The click event
 */
function handleDocumentClick(event) {
    // Check if click is outside the graph container and either mode is active
    const graphContainer = document.getElementById(config.ui.graphContainerId);
    if (graphContainer && 
        !graphContainer.contains(event.target) && 
        (nodeFocusManager.isFocusModeActive || nodeFocusManager.isContextModeActive)) {
        
        console.log("Clicked outside graph, exiting active mode");
        
        // Exit the current mode
        nodeFocusManager.exitFocusMode();
        
        // Notify graph visualization to remove mode styling
        const exitModeEvent = new CustomEvent('exitFocusMode');
        document.dispatchEvent(exitModeEvent);
        
        // Optionally clear the info panel as well
        if (infoContent) {
            updateInfoPanel(null, 'node');
        }
    }
}

export function showLoadingIndicator(message = "Loading...") {
    if (!loadingOverlay) {
        createLoadingOverlay();
    }
    
    const messageElement = loadingOverlay.querySelector('.loading-message');
    if (messageElement) {
        messageElement.textContent = message;
    }
    
    loadingOverlay.style.display = 'flex';
}

/**
 * Hides the loading indicator
 */
export function hideLoadingIndicator() {
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

// --- Error Message Functions ---

/**
 * Shows an error message toast notification
 * @param {string} message - The error message to display
 * @param {number} [duration=5000] - How long to show the message in milliseconds. If 0, message won't auto-hide
 */
export function showErrorMessage(message, duration = 5000) {
    if (!errorToast) {
        createErrorToast();
    }
    
    errorToast.textContent = message;
    errorToast.style.display = 'block';
    
    // Use setTimeout to ensure the display change takes effect before adding the show class
    setTimeout(() => {
        errorToast.classList.add('show');
    }, 10);
    
    // Auto-hide after duration
    if (duration > 0) {
        setTimeout(() => {
            hideErrorMessage();
        }, duration);
    }
}

/**
 * Hides the error message toast notification
 */
export function hideErrorMessage() {
    if (errorToast) {
        errorToast.classList.remove('show');
        
        // Wait for transition to complete before hiding
        setTimeout(() => {
            errorToast.style.display = 'none';
        }, 300);
    }
}



/**
 * Updates the statistics panel with graph data
 * @param {Object} graphData - The graph data to display statistics for
 */
export function updateStats(graphData) {
    console.log(LOG_MESSAGES.UPDATING_STATS);
    
    if (!statsContent) {
        console.error(ERRORS.ELEMENT_NOT_FOUND, 'statsContent');
        return;
    }

    if (!graphData || !graphData.nodes || !graphData.links) {
        console.warn(ERRORS.NO_DATA_PROVIDED);
        return;
    }

    // Calculate statistics
    const nodeCount = graphData.nodes.length;
    const linkCount = graphData.links.length;
    
    const nodeTypes = countNodesByType(graphData);

    // Count links by label
    const linkLabels = new Map();
    graphData.links.forEach(link => {
        const label = link.label || 'default';
        linkLabels.set(label, (linkLabels.get(label) || 0) + 1);
    });

    // Generate HTML content
    let htmlContent = `
        <h3>Graph Statistics</h3>
        <p><strong>Total Nodes:</strong> ${nodeCount}</p>
        <p><strong>Total Links:</strong> ${linkCount}</p>
        
        <h4>Nodes by Type</h4>
        <ul>
    `;

    // Add node type statistics
    nodeTypes.forEach((count, type) => {
        htmlContent += `<li><strong>${type}:</strong> ${count}</li>`;
    });

    htmlContent += `
        </ul>
        
        <h4>Links by Label</h4>
        <ul>
    `;

    // Add link label statistics
    linkLabels.forEach((count, label) => {
        htmlContent += `<li><strong>${label}:</strong> ${count}</li>`;
    });

    htmlContent += '</ul>';

    // Update the stats content
    statsContent.innerHTML = htmlContent;

    console.log(LOG_MESSAGES.STATS_UPDATED);
}

function countNodesByType(graphData) {
    const nodeCounts = new Map();
    graphData.nodes.forEach(node => {
        const type = node.type || 'default';
        nodeCounts.set(type, (nodeCounts.get(type) || 0) + 1);
    });
    return nodeCounts;
}


function createSelectAllButton() {
    const selectAllContainer = document.createElement('div');
    selectAllContainer.className = 'legend-select-all';
    const selectAllButton = document.createElement('button');
    selectAllButton.textContent = 'Deselect All';
    selectAllButton.addEventListener('click', () => {
        const allVisible = Array.from(filterManager.filterState.values()).every(v => v);
        filterManager.setAllVisibility(!allVisible);
        selectAllButton.textContent = allVisible ? 'Select All' : 'Deselect All';
    });
    selectAllContainer.appendChild(selectAllButton);
    legendContent.appendChild(selectAllContainer);
    return selectAllButton;
}

function createNodeLegendItem(type, nodeCounts)
{
    const color = getNodeColor(type);
    const count = nodeCounts.get(type) || 0;
    const isVisible = filterManager.isTypeVisible(type);

    const legendItem = document.createElement('div');
    legendItem.className = 'legend-item';
    
    // Create checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = isVisible;
    checkbox.addEventListener('change', () => {
        filterManager.setTypeVisibility(type, checkbox.checked);
    });

    // Create color box
    const colorBox = document.createElement('span');
    colorBox.className = 'legend-color-box';
    colorBox.style.backgroundColor = color;

    // Create type label with count
    const label = document.createElement('span');
    label.className = 'legend-label';
    label.textContent = `${type} (${count})`;

    // Assemble the legend item
    legendItem.appendChild(checkbox);
    legendItem.appendChild(colorBox);
    legendItem.appendChild(label);
    legendContent.appendChild(legendItem);
}


/**
 * Generates the legend for node types
 * @param {Object} graphData - The graph data to generate the legend from
 */
export function generateLegend(graphData) {
    console.log(LOG_MESSAGES.GENERATING_LEGEND);
    
    if (!legendContent) {
        console.error(ERRORS.ELEMENT_NOT_FOUND, 'legendContent');
        return;
    }

    if (!graphData || !graphData.nodes) {
        console.warn(ERRORS.NO_LEGEND_DATA);
        return;
    }
    filterManager.initFromGraphData(graphData);
    
    legendContent.innerHTML = ''; // Clear existing legend

    const selectAllButton = createSelectAllButton();

    // Count nodes by type
    const nodeCounts = countNodesByType(graphData);
    
    // Create legend items for each node type
    const nodeTypes = new Set(graphData.nodes.map(node => node.type || 'default'));
        nodeTypes.forEach(type => {
            createNodeLegendItem(type,nodeCounts);
    });

    // Add default color if not already present and if default exists in config
    if (!nodeTypes.has('default') && config.visualization.nodeColors['default']) {
        createNodeLegendItem('default',nodeCounts);
    }

    // Add listener for filter state changes to update checkboxes
    filterManager.addListener((filterState) => {
        const checkboxes = legendContent.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach((checkbox, index) => {
            const type = checkbox.parentElement.querySelector('.legend-label').textContent.split(' ')[0];
            checkbox.checked = filterState[type];
        });
        
        // Update Select All button text
        const allVisible = Object.values(filterState).every(v => v);
        selectAllButton.textContent = allVisible ? 'Select All' : 'Deselect All';
    });

    console.log(LOG_MESSAGES.LEGEND_GENERATED);
}

function nodeInfoItemContent(item)
{
    let htmlContent = '';
    htmlContent += `<h3>Node Details</h3>`;
    htmlContent += `<p><strong>Name:</strong> ${item.name || item.id}</p>`;
    htmlContent += `<p><strong>Type:</strong> ${item.type || 'N/A'}</p>`;

    // Display insights if available
    if (item.insights && item.insights.length > 0) {
        htmlContent += `<p><strong>Insights:</strong></p><ul>`;
        item.insights.forEach(insight => {
            htmlContent += `<li>${insight}</li>`;
        });
        htmlContent += `</ul>`;
    }

    // Display other properties (excluding internal ones)
    htmlContent += `<p><strong>Other Properties:</strong></p><ul>`;
    let hasOtherProps = false;
    for (const key in item) {
        if (Object.hasOwnProperty.call(item, key) && !['id', 'name', 'type', 'insights', 'x', 'y', 'z', 'vx', 'vy', 'vz', 'fx', 'fy', 'fz', 'index', '__threeObj', '__borderMesh'].includes(key)) {
            htmlContent += `<li><strong>${key}:</strong> ${JSON.stringify(item[key])}</li>`;
            hasOtherProps = true;
        }
    }
    if (!hasOtherProps) {
        htmlContent += `<li>None</li>`;
    }
    htmlContent += `</ul>`;
    return htmlContent;
}

function linkInfoItemContent(item)
{
    let htmlContent = '';
    htmlContent += `<h3>Relationship Details</h3>`;
    htmlContent += `<p><strong>From:</strong> ${item.source.name || item.source.id}</p>`;
    htmlContent += `<p><strong>To:</strong> ${item.target.name || item.target.id}</p>`;
    htmlContent += `<p><strong>Label:</strong> ${item.label || 'N/A'}</p>`;

    // Display other properties
    htmlContent += `<p><strong>Other Properties:</strong></p><ul>`;
    let hasOtherProps = false;
    for (const key in item) {
         if (Object.hasOwnProperty.call(item, key) && !['source', 'target', 'label', 'index', '__lineObj', '__arrowObj', '__particlesObj','__curve', '__borderMesh'].includes(key)) {
            htmlContent += `<li><strong>${key}:</strong> ${JSON.stringify(item[key])}</li>`;
            hasOtherProps = true;
        }
    }
    if (!hasOtherProps) {
        htmlContent += `<li>None</li>`;
    }
    htmlContent += `</ul>`;
    return htmlContent;
}

/**
 * Updates the info panel with details of the selected item and current mode.
 * @param {Object|null} item - The selected item (node or link) or null to clear.
 * @param {string} itemType - The type of item ('node' or 'link').
 */
export function updateInfoPanel(item, itemType) {
    const NO_SELECTION_MESSAGE = 'Select a node or edge to see details.';   
    if (!infoContent) {
        console.error("Info panel content element not found.");
        return;
    }

    let htmlContent = '';

    // Add mode indicator if active and a node is selected
    if (itemType === ITEM_TYPE_NODE && item) { // Only show indicator when a node is selected
        if (nodeFocusManager.isContextModeActive) {
            htmlContent += `<div class="focus-mode-indicator">${config.focus.CONTEXT_MODE_INDICATOR_TEXT} Active</div>`;
        } else if (nodeFocusManager.isFocusModeActive) {
            htmlContent += `<div class="focus-mode-indicator">${config.focus.FOCUS_MODE_INDICATOR_TEXT} Active</div>`;
        }
    }

    // Add item details if an item is provided
    if (item) {
        htmlContent += infoPanelItemContent(item, itemType);
    } else {
        // No item selected, clear the panel
        htmlContent = NO_SELECTION_MESSAGE;
         // Ensure mode indicator is also cleared if panel is cleared
        if (nodeFocusManager.isContextModeActive || nodeFocusManager.isFocusModeActive) {
           htmlContent += '<br><div class="focus-mode-indicator-info">Focus/Context mode active.</div>';
        }
    }

    infoContent.innerHTML = htmlContent;
}

function infoPanelItemContent(item, itemType)
{
    let htmlContent = '';
    switch (itemType) {
        case ITEM_TYPE_NODE:
            htmlContent += nodeInfoItemContent(item);
            break;
        case ITEM_TYPE_LINK:
            // Ensure link mode indicator is not shown (only relevant for node selection)
             if (nodeFocusManager.isContextModeActive || nodeFocusManager.isFocusModeActive) {
                htmlContent += '<div class="focus-mode-indicator-info">Focus/Context mode active. Select a node for details.</div>';
             }
            htmlContent += linkInfoItemContent(item);
            break;
        default:
             // If item exists but type is unknown, show generic message
             htmlContent += '<p>Selected item details unavailable.</p>'; 
             break;
    }
    return htmlContent;
}

/**
 * Initializes the label controls
 */
function initLabelControls() {
    if (!labelsContent) return;

    // Create node labels control
    const nodeLabelsControl = document.createElement('div');
    nodeLabelsControl.className = 'label-control';
    
    const nodeLabelsCheckbox = document.createElement('input');
    nodeLabelsCheckbox.type = 'checkbox';
    nodeLabelsCheckbox.id = 'node-labels-checkbox';
    nodeLabelsCheckbox.checked = labelManager.getLabelState().nodeLabelsVisible;
    
    const nodeLabelsLabel = document.createElement('label');
    nodeLabelsLabel.htmlFor = 'node-labels-checkbox';
    nodeLabelsLabel.textContent = 'Show Node Labels';
    nodeLabelsLabel.setAttribute('title', 'Show or hide labels for all nodes');
    
    nodeLabelsControl.appendChild(nodeLabelsCheckbox);
    nodeLabelsControl.appendChild(nodeLabelsLabel);
    
    // Add event listeners
    nodeLabelsCheckbox.addEventListener('change', (e) => {
        labelManager.setNodeLabelsVisible(e.target.checked);
    });
    
    // Add controls to the panel
    labelsContent.appendChild(nodeLabelsControl);
}