// js/main.js
import { initGraphVisualization, loadDataAndRender } from './graphVisualization.js';
import { initUIManager, updateStats, generateLegend, showLoadingIndicator, hideLoadingIndicator, showErrorMessage } from './uiManager.js';
import { getProcessedData } from './data.js';

// --- Application Initialization ---
async function initializeApp() {
    console.log("Initializing application...");
    
    try {
        // Show loading indicator
        showLoadingIndicator("Loading graph data...");
        
        // 1. Load data first (now async)
        const graphData = await getProcessedData();
        
        // 2. Initialize UI components, passing data and reload callback
        initUIManager(graphData, reloadGraph); // Pass the reload function
        
        // 3. Initialize the 3D graph visualization
        initGraphVisualization();
        
        // 4. Load data into the visualization
        await loadDataAndRender(graphData); // Pass the data directly to avoid fetching twice
        
        // Hide loading indicator
        hideLoadingIndicator();
        
        console.log("Application initialized successfully.");
    } catch (error) {
        // Handle initialization errors
        console.error("Failed to initialize application:", error);
        hideLoadingIndicator();
        showErrorMessage("Failed to load graph data. Please try again later.");
    }
}

// --- Reload Functionality ---
async function reloadGraph() {
    console.log("Reloading graph...");
    
    try {
        // Show loading indicator during reload
        showLoadingIndicator("Reloading graph data...");
        
        // Fetch fresh data from server
        const graphData = await getProcessedData();
        
        // Update UI stats and legend (in case data structure changed)
        updateStats(graphData);
        generateLegend(graphData);
        
        // Reload data in the visualization
        await loadDataAndRender(graphData);
        
        // Hide loading indicator
        hideLoadingIndicator();
        
        console.log("Graph reloaded successfully.");
    } catch (error) {
        console.error("Failed to reload graph:", error);
        hideLoadingIndicator();
        showErrorMessage("Failed to reload graph data. Please try again later.");
    }
}

// --- Entry Point ---
// Wait for the DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', initializeApp);