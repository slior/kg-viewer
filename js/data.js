// js/data.js
import { config } from './config.js';

// Error message constants
const ERRORS = {
    UNDEFINED_DATA: "Graph data is undefined or null",
    INVALID_STRUCTURE: "Graph data must contain 'nodes' and 'links' arrays",
    MISSING_NODE_ID: "Each node must have an 'id' property",
    MISSING_NODE_NAME: "Each node must have a 'name' property",
    MISSING_NODE_TYPE: "Each node must have a 'type' property",
    MISSING_NODE_DESC: "Each node must have a 'description' property",
    MISSING_INSIGHTS: "Each node must have an 'insights' array (can be empty)",
    DUPLICATE_NODE_ID: (id) => `Duplicate node ID found: ${id}`,
    MISSING_LINK_SOURCE: "Each link must have a 'source' property",
    MISSING_LINK_TARGET: "Each link must have a 'target' property",
    MISSING_LINK_LABEL: "Each link must have a 'label' property",
    INVALID_SOURCE: (id) => `Link source references non-existent node ID: ${id}`,
    INVALID_TARGET: (id) => `Link target references non-existent node ID: ${id}`,
    SERVER_ERROR: (status) => `Server responded with status: ${status}`
};

/**
 * Fetches graph data from the server with retry capability
 * @param {string} dataSetPath - The path to the data set
 * @param {number} retryCount - Number of retry attempts remaining
 * @returns {Promise<Object>} The graph data object containing nodes and links
 * @throws {Error} If the server request fails after all retries
 * @throws {Error} If the response is not valid JSON
 * @throws {Error} If the server returns a non-200 status code
 */
export async function fetchGraphData(dataSetPath = config.api.defaultDataSet, retryCount = config.api.retryCount) {
    console.log("Fetching graph data...", dataSetPath);
    // Validate data set path
    if (dataSetPath.includes('..')) {
        throw new Error('Invalid data set path: Directory traversal not allowed');
    }

    const url = `${config.api.apiBaseUrl}${config.api.apiEndpoint}/${dataSetPath}`;
    console.log("Fetching graph data from URL:", url);
    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.api.fetchTimeout);
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) {
            throw new Error(ERRORS.SERVER_ERROR(response.status));
        }
        
        const data = await response.json();
        
        // Validate the data structure before returning
        validateGraphData(data);
        
        return data;
    } catch (error) {
        // Clear the timeout if not already cleared
        clearTimeout(timeout);
        
        console.error(`Error fetching graph data: ${error.message}`);
        
        // Retry logic
        if (retryCount > 0) {
            console.log(`Retrying fetch... (${retryCount} attempts left)`);
            return fetchGraphData(dataSetPath, retryCount - 1);
        }
        
        // If all retries failed, throw the error
        throw error;
    }
}

/**
 * Validates the structure and content of the graph data
 * @param {Object} data - The graph data object to validate
 * @throws {Error} If any validation check fails
 */
function validateGraphData(data) {
    if (!data) {
        throw new Error(ERRORS.UNDEFINED_DATA);
    }
    
    if (!Array.isArray(data.nodes) || !Array.isArray(data.links)) {
        throw new Error(ERRORS.INVALID_STRUCTURE);
    }
    
    const nodeIds = new Set();
    for (const node of data.nodes) {
        if (!node.id) throw new Error(ERRORS.MISSING_NODE_ID);
        if (!node.name) throw new Error(ERRORS.MISSING_NODE_NAME);
        if (!node.type) throw new Error(ERRORS.MISSING_NODE_TYPE);
        if (!node.description) throw new Error(ERRORS.MISSING_NODE_DESC);
        if (!Array.isArray(node.insights)) throw new Error(ERRORS.MISSING_INSIGHTS);
        
        if (nodeIds.has(node.id)) {
            throw new Error(ERRORS.DUPLICATE_NODE_ID(node.id));
        }
        nodeIds.add(node.id);
    }
    
    for (const link of data.links) {
        if (!link.source) throw new Error(ERRORS.MISSING_LINK_SOURCE);
        if (!link.target) throw new Error(ERRORS.MISSING_LINK_TARGET);
        if (!link.label) throw new Error(ERRORS.MISSING_LINK_LABEL);
        
        if (!nodeIds.has(link.source)) {
            throw new Error(ERRORS.INVALID_SOURCE(link.source));
        }
        if (!nodeIds.has(link.target)) {
            throw new Error(ERRORS.INVALID_TARGET(link.target));
        }
    }
    
    return true;
}

/**
 * Fetches and processes the graph data for visualization
 * @returns {Promise<Object>} The processed graph data
 * @throws {Error} If data fetching or processing fails
 */
export async function getProcessedData(dataSetPath = config.api.defaultDataSet) {
    console.log("Fetching and processing graph data...", dataSetPath);
    
    try {
        const graphData = await fetchGraphData(dataSetPath);
        
        // Additional processing can be done here if needed
        
        console.log("Graph data processed successfully");
        return graphData;
    } catch (error) {
        console.error("Failed to process graph data:", error);
        throw error; // Propagate the error instead of using fallback data
    }
}