// js/uiManager.js
import { config, getNodeColor } from './config.js';

// Get references to UI elements
const infoContent = document.getElementById(config.ui.infoPanelId);
const legendContent = document.getElementById(config.ui.legendPanelId);
const statsContent = document.getElementById(config.ui.statsPanelId);
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

    const nodeTypes = new Set(graphData.nodes.map(node => node.type || 'default'));
    legendContent.innerHTML = ''; // Clear existing legend

    nodeTypes.forEach(type => {
        const color = getNodeColor(type);
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `
            <span class="legend-color-box" style="background-color: ${color};"></span>
            <span>${type}</span>
        `;
        legendContent.appendChild(legendItem);
    });

    // Add default color if not already present and if default exists in config
     if (!nodeTypes.has('default') && config.visualization.nodeColors['default']) {
        const color = config.visualization.nodeColors['default'];
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `
            <span class="legend-color-box" style="background-color: ${color};"></span>
            <span>default</span>
        `;
        legendContent.appendChild(legendItem);
    }
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