// js/main.js
import { initGraphVisualization, loadDataAndRender } from './graphVisualization.js';
import { initUIManager, updateStats, generateLegend } from './uiManager.js';
import { getProcessedData } from './data.js';

// --- Application Initialization ---
function initializeApp() {
    console.log("Initializing application...");

    // 1. Load data first
    const graphData = getProcessedData();

    // 2. Initialize UI components, passing data and reload callback
    initUIManager(graphData, reloadGraph); // Pass the reload function

    // 3. Initialize the 3D graph visualization
    initGraphVisualization();

    // 4. Load data into the visualization
    loadDataAndRender(); // This will feed data to three-forcegraph

    console.log("Application initialized successfully.");
}

// --- Reload Functionality ---
function reloadGraph() {
    console.log("Reloading graph...");
    // For now, just re-process data and update graph & UI
    // Later, this could fetch new data from a backend

    const graphData = getProcessedData();

    // Update UI stats and legend (in case data structure changed)
    updateStats(graphData);
    generateLegend(graphData);

    // Reload data in the visualization
    // Assuming loadDataAndRender handles replacing/updating data
    loadDataAndRender();

    console.log("Graph reloaded.");
}


// --- Entry Point ---
// Wait for the DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', initializeApp);