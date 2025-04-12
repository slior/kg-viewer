// js/main.js
import { initGraphVisualization, loadDataAndRender } from './graphVisualization.js';
import { initUIManager, updateStats, generateLegend, showLoadingIndicator, hideLoadingIndicator, showErrorMessage } from './uiManager.js';
import { getProcessedData } from './data.js';

// Constants for messages
const LOADING_MESSAGE = "Loading graph data...";
const RELOADING_MESSAGE = "Reloading graph data...";
const INIT_SUCCESS_MESSAGE = "Application initialized successfully.";
const RELOAD_SUCCESS_MESSAGE = "Graph reloaded successfully.";
const LOAD_ERROR_MESSAGE = "Failed to load graph data. Please try again later.";
const RELOAD_ERROR_MESSAGE = "Failed to reload graph data. Please try again later.";

/**
 * Initializes the application by loading data and setting up UI components
 * @throws {Error} If data loading or initialization fails
 */
async function initializeApp() {
    console.log("Initializing application...");
    
    try {
        showLoadingIndicator(LOADING_MESSAGE);
        const graphData = await getProcessedData();
        initUIManager(graphData, reloadGraph);
        initGraphVisualization();
        await loadDataAndRender(graphData);
        hideLoadingIndicator();
        console.log(INIT_SUCCESS_MESSAGE);
    } catch (error) {
        console.error("Failed to initialize application:", error);
        hideLoadingIndicator();
        showErrorMessage(LOAD_ERROR_MESSAGE);
    }
}

/**
 * Reloads the graph with fresh data from the server
 * Updates UI components and visualization with new data
 * @throws {Error} If data reloading fails
 */
async function reloadGraph() {
    console.log("Reloading graph...");
    
    try {
        showLoadingIndicator(RELOADING_MESSAGE);
        const graphData = await getProcessedData();
        updateStats(graphData);
        generateLegend(graphData);
        await loadDataAndRender(graphData);
        hideLoadingIndicator();
        console.log(RELOAD_SUCCESS_MESSAGE);
    } catch (error) {
        console.error("Failed to reload graph:", error);
        hideLoadingIndicator();
        showErrorMessage(RELOAD_ERROR_MESSAGE);
    }
}

// Wait for the DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', initializeApp);