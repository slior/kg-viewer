// js/uiManager.js
import { config, getNodeColor } from './config.js';
import { filterManager } from './filterManager.js';
import { labelManager } from './labelManager.js';
import { getTypeColorMappings } from './colorManager.js';

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

// UI element references
/** @type {HTMLElement} The loading indicator element */
let loadingIndicator;
/** @type {HTMLElement} The error message element */
let errorMessage;


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
let loadingOverlay;
let errorToast;
/**
 * Initializes the UI Manager
 * Sets up UI elements and event listeners
 */
export function initUIManager(graphData, reloadCallback) {
    console.log(LOG_MESSAGES.INITIALIZING);

    // Get UI elements
    loadingIndicator = document.getElementById('loading-indicator');
    errorMessage = document.getElementById('error-message');
    legendContent = document.getElementById('legend-content');
    infoContent = document.getElementById('info-content');
    
    // Validate UI elements
    if (!loadingIndicator) console.error(ERRORS.CONTAINER_NOT_FOUND, 'loading-indicator');
    if (!errorMessage) console.error(ERRORS.CONTAINER_NOT_FOUND, 'error-message');
    if (!statsContent) console.error(ERRORS.CONTAINER_NOT_FOUND, 'stats-content');
    if (!legendContent) console.error(ERRORS.CONTAINER_NOT_FOUND, 'legend-content');
    if (!infoContent) console.error(ERRORS.CONTAINER_NOT_FOUND, 'info-content');
    if (!labelsContent) console.error(ERRORS.CONTAINER_NOT_FOUND, 'labels-content');
    // Create loading overlay if it doesn't exist
    createLoadingOverlay();

    // Create error toast if it doesn't exist
    createErrorToast();


    infoContent.innerHTML = 'Select a node or edge to see details.';
    updateStats(graphData);
    generateLegend(graphData);
    initLabelControls();
    reloadButton.addEventListener('click', () => {
        console.log("Reload button clicked.");
        if (reloadCallback) {
            reloadCallback();
        }
    });

    console.log(LOG_MESSAGES.INITIALIZED);
}

function createLoadingOverlay() {
    // Create only if it doesn't exist
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.style.display = 'none';
        loadingOverlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-message">Loading...</div>
        `;
        document.body.appendChild(loadingOverlay);
        
        // Add CSS for loading overlay if not already in the page
        const style = document.createElement('style');
        style.textContent = `
            .loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            .loading-spinner {
                border: 5px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                border-top: 5px solid #fff;
                width: 50px;
                height: 50px;
                animation: spin 1s linear infinite;
            }
            .loading-message {
                color: white;
                margin-top: 20px;
                font-size: 18px;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
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
function createErrorToast() {
    if (!errorToast) {
        errorToast = document.createElement('div');
        errorToast.className = 'error-toast';
        errorToast.style.display = 'none';
        document.body.appendChild(errorToast);
        
        // Add CSS for error toast if not already in the page
        const style = document.createElement('style');
        style.textContent = `
            .error-toast {
                position: fixed;
                top: 20px;
                right: 20px;
                background-color: #f44336;
                color: white;
                padding: 16px;
                border-radius: 4px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
                z-index: 1001;
                max-width: 350px;
                word-wrap: break-word;
                opacity: 0;
                transition: opacity 0.3s;
            }
            .error-toast.show {
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    }
}

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
    
    // Count nodes by type
    const nodeTypes = new Map();
    graphData.nodes.forEach(node => {
        const type = node.type || 'default';
        nodeTypes.set(type, (nodeTypes.get(type) || 0) + 1);
    });

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
    // Clear existing legend
    legendContent.innerHTML = '';

    // Add Select All button
    const selectAllContainer = document.createElement('div');
    selectAllContainer.className = 'legend-select-all';
    const selectAllButton = document.createElement('button');
    selectAllButton.textContent = 'Select All';
    selectAllButton.addEventListener('click', () => {
        const allVisible = Array.from(filterManager.filterState.values()).every(v => v);
        filterManager.setAllVisibility(!allVisible);
        selectAllButton.textContent = allVisible ? 'Select All' : 'Deselect All';
    });
    selectAllContainer.appendChild(selectAllButton);
    legendContent.appendChild(selectAllContainer);

    // Count nodes by type
    const nodeCounts = new Map();
    graphData.nodes.forEach(node => {
        const type = node.type || 'default';
        nodeCounts.set(type, (nodeCounts.get(type) || 0) + 1);
    });

    // Get all type-color mappings from the color manager
    const typeColorMappings = getTypeColorMappings();
    // Create legend items for each node type
    const nodeTypes = new Set(graphData.nodes.map(node => node.type || 'default'));
        nodeTypes.forEach(type => {
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
    });

    // Add default color if not already present and if default exists in config
    if (!nodeTypes.has('default') && config.visualization.nodeColors['default']) {
        const color = config.visualization.nodeColors['default'];
        const count = nodeCounts.get('default') || 0;
        const isVisible = filterManager.isTypeVisible('default');

        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        
        // Create checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = isVisible;
        checkbox.addEventListener('change', () => {
            filterManager.setTypeVisibility('default', checkbox.checked);
        });

        // Create color box
        const colorBox = document.createElement('span');
        colorBox.className = 'legend-color-box';
        colorBox.style.backgroundColor = color;

        // Create type label with count
        const label = document.createElement('span');
        label.className = 'legend-label';
        label.textContent = `default (${count})`;

        // Assemble the legend item
        legendItem.appendChild(checkbox);
        legendItem.appendChild(colorBox);
        legendItem.appendChild(label);
        legendContent.appendChild(legendItem);
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

/**
 * Updates the info panel with details of the selected item
 * @param {Object} item - The selected item (node or link)
 * @param {string} itemType - The type of item ('node' or 'link')
 */
export function updateInfoPanel(item, itemType) {
    if (!infoContent || !item) {
        infoContent.innerHTML = 'Select a node or edge to see details.';
        return;
    }

    let htmlContent = '';

    if (itemType === 'node') {
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
            if (Object.hasOwnProperty.call(item, key) && !['id', 'name', 'type', 'insights', 'x', 'y', 'z', 'vx', 'vy', 'vz', 'fx', 'fy', 'fz', 'index', '__threeObj'].includes(key)) {
                htmlContent += `<li><strong>${key}:</strong> ${JSON.stringify(item[key])}</li>`;
                hasOtherProps = true;
            }
        }
        if (!hasOtherProps) {
            htmlContent += `<li>None</li>`;
        }
        htmlContent += `</ul>`;

    } else if (itemType === 'link') {
        htmlContent += `<h3>Relationship Details</h3>`;
        htmlContent += `<p><strong>From:</strong> ${item.source.name || item.source.id}</p>`;
        htmlContent += `<p><strong>To:</strong> ${item.target.name || item.target.id}</p>`;
        htmlContent += `<p><strong>Label:</strong> ${item.label || 'N/A'}</p>`;

        // Display other properties
        htmlContent += `<p><strong>Other Properties:</strong></p><ul>`;
        let hasOtherProps = false;
        for (const key in item) {
             if (Object.hasOwnProperty.call(item, key) && !['source', 'target', 'label', 'index', '__lineObj', '__arrowObj', '__particlesObj'].includes(key)) {
                htmlContent += `<li><strong>${key}:</strong> ${JSON.stringify(item[key])}</li>`;
                hasOtherProps = true;
            }
        }
        if (!hasOtherProps) {
            htmlContent += `<li>None</li>`;
        }
        htmlContent += `</ul>`;
    } else {
        htmlContent = 'Select a node or edge to see details.';
    }

    infoContent.innerHTML = htmlContent;
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
    nodeLabelsLabel.textContent = 'Node Labels';
    
    const nodeLabelsTooltip = document.createElement('span');
    nodeLabelsTooltip.className = 'tooltip';
    nodeLabelsTooltip.textContent = '?';
    nodeLabelsTooltip.setAttribute('data-tooltip', 'Show or hide labels for all nodes');
    
    nodeLabelsControl.appendChild(nodeLabelsCheckbox);
    nodeLabelsControl.appendChild(nodeLabelsLabel);
    nodeLabelsControl.appendChild(nodeLabelsTooltip);
    
    // Add event listeners
    nodeLabelsCheckbox.addEventListener('change', (e) => {
        labelManager.setNodeLabelsVisible(e.target.checked);
    });
    
    // Add controls to the panel
    labelsContent.appendChild(nodeLabelsControl);
}