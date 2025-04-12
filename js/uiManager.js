// js/uiManager.js
import { config, getNodeColor } from './config.js';
import { filterManager } from './filterManager.js';
import { getTypeColorMappings } from './colorManager.js';
import { labelManager } from './labelManager.js';

// Get references to UI elements
const infoContent = document.getElementById(config.ui.infoPanelId);
const legendContent = document.getElementById(config.ui.legendPanelId);
const statsContent = document.getElementById(config.ui.statsPanelId);
const labelsContent = document.getElementById('labels-content');
const reloadButton = document.getElementById(config.ui.reloadButtonId);

// --- Loading and Error UI Elements ---
let loadingOverlay;
let errorToast;

// --- Initialization ---
export function initUIManager(graphData, reloadCallback) {
    console.log("Initializing UI Manager...");
    if (!infoContent || !legendContent || !statsContent || !reloadButton) {
        console.error("One or more UI elements not found!");
        return;
    }

    // Create loading overlay if it doesn't exist
    createLoadingOverlay();
    
    // Create error toast if it doesn't exist
    createErrorToast();

    // Initial state
    infoContent.innerHTML = 'Select a node or edge to see details.';
    updateStats(graphData);
    generateLegend(graphData);
    initLabelControls();

    // Setup event listeners
    reloadButton.addEventListener('click', () => {
        console.log("Reload button clicked.");
        if (reloadCallback) {
            reloadCallback();
        }
    });

    console.log("UI Manager Initialized.");
}

// --- Loading Indicator Functions ---
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

// --- Update Functions ---

// Update the statistics panel
export function updateStats(graphData) {
    if (!statsContent || !graphData) return;
    const numNodes = graphData.nodes?.length || 0;
    const numLinks = graphData.links?.length || 0;
    statsContent.innerHTML = `
        <p>Nodes: ${numNodes}</p>
        <p>Relationships: ${numLinks}</p>
    `;
}

// Generate the legend based on node types and colors in config
export function generateLegend(graphData) {
    if (!legendContent || !graphData || !graphData.nodes) return;

    // Initialize filter manager with current graph data
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

    // Get node counts by type
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
}

// Update the info panel with details of the selected item (node or link)
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

        // Display other properties (excluding internal ones like id, vx, vy, vz, index)
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

        // TODO: Add Incoming/Outgoing Edges (requires graphData access or passing it in)

    } else if (itemType === 'link') {
        htmlContent += `<h3>Relationship Details</h3>`;
        htmlContent += `<p><strong>From:</strong> ${item.source.name || item.source.id}</p>`; // Links usually have resolved objects
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

// Initialize label controls
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
    
    // Create link labels control
    // const linkLabelsControl = document.createElement('div');
    // linkLabelsControl.className = 'label-control';
    
    // const linkLabelsCheckbox = document.createElement('input');
    // linkLabelsCheckbox.type = 'checkbox';
    // linkLabelsCheckbox.id = 'link-labels-checkbox';
    // linkLabelsCheckbox.checked = labelManager.getLabelState().linkLabelsVisible;
    
    // const linkLabelsLabel = document.createElement('label');
    // linkLabelsLabel.htmlFor = 'link-labels-checkbox';
    // linkLabelsLabel.textContent = 'Link Labels';
    
    // const linkLabelsTooltip = document.createElement('span');
    // linkLabelsTooltip.className = 'tooltip';
    // linkLabelsTooltip.textContent = '?';
    // linkLabelsTooltip.setAttribute('data-tooltip', 'Show or hide labels for all links');
    
    // linkLabelsControl.appendChild(linkLabelsCheckbox);
    // linkLabelsControl.appendChild(linkLabelsLabel);
    // linkLabelsControl.appendChild(linkLabelsTooltip);
    
    // Add event listeners
    nodeLabelsCheckbox.addEventListener('change', (e) => {
        labelManager.setNodeLabelsVisible(e.target.checked);
    });
    
    // linkLabelsCheckbox.addEventListener('change', (e) => {
    //     labelManager.setLinkLabelsVisible(e.target.checked);
    // });
    
    // Add controls to the panel
    labelsContent.appendChild(nodeLabelsControl);
    // labelsContent.appendChild(linkLabelsControl);
}