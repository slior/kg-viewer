// js/data.js
import { config } from './config.js';

// Function to fetch graph data from the server
export async function fetchGraphData(retryCount = config.api.retryCount) {
    const url = `${config.api.apiBaseUrl}${config.api.apiEndpoint}`;
    
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
        
        // Clear the timeout
        clearTimeout(timeout);
        
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
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
            return fetchGraphData(retryCount - 1);
        }
        
        // If all retries failed, throw the error
        throw error;
    }
}

// Function to validate graph data structure
function validateGraphData(data) {
    // Check if data object exists
    if (!data) {
        throw new Error("Graph data is undefined or null");
    }
    
    // Check for nodes and links arrays
    if (!Array.isArray(data.nodes) || !Array.isArray(data.links)) {
        throw new Error("Graph data must contain 'nodes' and 'links' arrays");
    }
    
    // Validate each node has required properties
    const nodeIds = new Set();
    for (const node of data.nodes) {
        if (!node.id) {
            throw new Error("Each node must have an 'id' property");
        }
        if (!node.name) {
            throw new Error("Each node must have a 'name' property");
        }
        if (!node.type) {
            throw new Error("Each node must have a 'type' property");
        }
        if (!node.description) {
            throw new Error("Each node must have a 'description' property");
        }
        
        // Check for insights array (can be empty)
        if (!Array.isArray(node.insights)) {
            throw new Error("Each node must have an 'insights' array (can be empty)");
        }
        
        // Check for unique node ids
        if (nodeIds.has(node.id)) {
            throw new Error(`Duplicate node ID found: ${node.id}`);
        }
        nodeIds.add(node.id);
    }
    
    // Validate each link has required properties and references valid nodes
    for (const link of data.links) {
        if (!link.source) {
            throw new Error("Each link must have a 'source' property");
        }
        if (!link.target) {
            throw new Error("Each link must have a 'target' property");
        }
        if (!link.label) {
            throw new Error("Each link must have a 'label' property");
        }
        
        // Check if source and target nodes exist
        if (!nodeIds.has(link.source)) {
            throw new Error(`Link source references non-existent node ID: ${link.source}`);
        }
        if (!nodeIds.has(link.target)) {
            throw new Error(`Link target references non-existent node ID: ${link.target}`);
        }
    }
    
    // Data is valid if we reach this point
    return true;
}

// Function to process the data before using it in the visualization
export async function getProcessedData() {
    console.log("Fetching and processing graph data...");
    
    try {
        // Fetch data from server
        const graphData = await fetchGraphData();
        
        // Additional processing can be done here if needed
        
        console.log("Graph data processed successfully");
        return graphData;
    } catch (error) {
        console.error("Failed to process graph data:", error);
        throw error; // Propagate the error instead of using fallback data
    }
}