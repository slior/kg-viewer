// js/uiManager.js
import { config, getNodeColor } from './config.js';

// Get references to UI elements
const infoContent = document.getElementById(config.ui.infoPanelId);
const legendContent = document.getElementById(config.ui.legendPanelId);
const statsContent = document.getElementById(config.ui.statsPanelId);
const reloadButton = document.getElementById(config.ui.reloadButtonId);

// --- Initialization ---
export function initUIManager(graphData, reloadCallback) {
    console.log("Initializing UI Manager...");
    if (!infoContent || !legendContent || !statsContent || !reloadButton) {
        console.error("One or more UI elements not found!");
        return;
    }

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