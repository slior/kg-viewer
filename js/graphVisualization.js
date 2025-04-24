// js/graphVisualization.js
// Use the globally loaded Three.js instance to avoid duplicate loading
const THREE = window.THREE;
// Import OrbitControls as a module
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// ForceGraph3D is defined globally from the 3d-force-graph library loaded in index.html
// SpriteText is defined globally from the three-spritetext library loaded in index.html

import { config, getNodeColor } from './config.js';
import { updateInfoPanel } from './uiManager.js'; // Import UI update function
import { filterManager } from './filterManager.js';
import { labelManager } from './labelManager.js';
import { nodeFocusManager } from './nodeFocusManager.js'; // Import node focus manager

// Error message constants
const ERRORS = {
    CONTAINER_NOT_FOUND: 'Graph container element not found!',
    FORCE_GRAPH_NOT_DEFINED: 'ForceGraph3D is not defined. The 3d-force-graph library might not be loaded correctly.',
    SPRITE_TEXT_NOT_DEFINED: 'SpriteText is not defined. The three-spritetext library might not be loaded correctly.',
    INIT_ERROR: 'Error initializing 3D force graph:',
    GRAPH_NOT_INITIALIZED: 'Graph object not initialized before loading data.',
    VISUALIZATION_NOT_INITIALIZED: 'Graph visualization not initialized',
    NO_DATA_PROVIDED: 'No graph data provided to loadDataAndRender, this might cause issues',
    LOAD_ERROR: 'Error loading graph data into visualization:'
};

// Log message constants
const LOG_MESSAGES = {
    INITIALIZING: 'Initializing Graph Visualization...',
    INITIALIZED: 'Graph Visualization Initialized.',
    LOADING_DATA: 'Loading graph data into visualization...',
    DATA_LOADED: 'Graph data loaded and rendering started.',
    NODE_CLICKED: 'Node clicked:',
    LINK_CLICKED: 'Link clicked:'
};

// Polyfill for process in browser
if (typeof window !== 'undefined' && !window.process) {
    window.process = { env: {} };
}

/** @type {THREE.Scene} The Three.js scene */
let scene;
/** @type {THREE.PerspectiveCamera} The Three.js camera */
let camera;
/** @type {THREE.WebGLRenderer} The Three.js renderer */
let renderer;
/** @type {OrbitControls} The orbit controls for camera manipulation */
let controls;
/** @type {Object} The ForceGraph3D instance */
let graph;
/** @type {Object} The graph data */
let graphData = {};

/** @type {HTMLElement} The container element for the graph */
const graphContainer = document.getElementById(config.ui.graphContainerId);

// Constants for mode types
const FOCUS_MODE = 'focus';
const CONTEXT_MODE = 'context';
const NO_MODE = 'none';

/**
 * Initializes the 3D graph visualization
 * Sets up Three.js scene, camera, renderer, and ForceGraph3D
 */
export function initGraphVisualization() {
    if (!graphContainer) {
        console.error(ERRORS.CONTAINER_NOT_FOUND);
        return;
    }
    console.log(LOG_MESSAGES.INITIALIZING);

    // 1. Scene
    scene = new THREE.Scene();
    // Convert hex color to string for Three.js
    scene.background = new THREE.Color(config.visualization.backgroundColor);

    // 2. Camera
    camera = new THREE.PerspectiveCamera(
        75, // Field of View
        graphContainer.offsetWidth / graphContainer.offsetHeight, // Aspect Ratio
        config.camera.near, // Near clipping plane
        config.camera.far // Far clipping plane
    );
    camera.position.z = config.camera.initialDistance; // Initial distance

    // 3. Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(graphContainer.offsetWidth, graphContainer.offsetHeight);
    graphContainer.appendChild(renderer.domElement);

    // 4. Controls (Mouse Orbit)
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = config.camera.controls.enableDamping;
    controls.dampingFactor = config.camera.controls.dampingFactor;
    controls.rotateSpeed = config.camera.controls.rotateSpeed;
    controls.zoomSpeed = config.camera.controls.zoomSpeed;
    controls.panSpeed = config.camera.controls.panSpeed;

    // Check if ForceGraph3D is defined
    if (typeof ForceGraph3D === 'undefined') {
        console.error(ERRORS.FORCE_GRAPH_NOT_DEFINED);
        console.log("Available global variables:", Object.keys(window).filter(key => 
            key.includes('Graph') || key.includes('Force') || key.includes('3D')
        ));
        return;
    }

    // Check if SpriteText is defined
    if (typeof SpriteText === 'undefined') {
        console.error(ERRORS.SPRITE_TEXT_NOT_DEFINED);
        return;
    }

    try {
        // Convert hex color to string for 3d-force-graph
        const backgroundColorString = '#' + config.visualization.backgroundColor.toString(16).padStart(6, '0');
        
        // Get initial label state
        const initialLabelState = labelManager.getLabelState();
        
        // 5. Force-Directed Graph - Fixed method chaining
        graph = ForceGraph3D({ three: THREE })
          (graphContainer)
          .backgroundColor(backgroundColorString)
          .nodeThreeObject(node => createNodeObject(node, initialLabelState.nodeLabelsVisible))
          .linkLabel(link => link.label)
          .linkThreeObjectExtend(true)
          .linkDirectionalArrowLength(config.graph.arrowLength)
          .linkDirectionalArrowRelPos(1.03)
          .linkDirectionalArrowColor(config.graph.arrowColor)
          .linkDirectionalParticles(link => determineLinkParticles(link))
          .linkDirectionalParticleWidth(2) //"width" of particles
          .linkWidth(config.graph.linkWidth)
          .linkCurvature(0.25)
          .linkOpacity(config.graph.linkOpacity)
          .nodeVal(config.graph.nodeSize)
          .nodeColor(node => determineNodeColor(node))
          .nodeVisibility(node => determineNodeVisibility(node))
          .linkVisibility(link => determineLinkVisibility(link))
          .linkColor(link => determineLinkColor(link));
          
        // Configure d3 forces separately to avoid method chaining issues
        graph.d3Force('charge').strength(config.forceGraph.chargeStrength);
        graph.d3Force('link').distance(config.forceGraph.linkDistance);
        
        graph.onNodeClick(handleNodeClick);
        graph.onLinkClick(handleLinkClick);

        filterManager.addListener(handleFilterStateChange);
        labelManager.addListener(handleLabelStateChange);
        document.addEventListener('exitFocusMode', () => { exitActiveMode(); });

    } catch (error) {
        console.error(ERRORS.INIT_ERROR, error);
        return;
    }
    window.addEventListener('resize', onWindowResize, false);
    animate(); // Start animation loop

    console.log(LOG_MESSAGES.INITIALIZED);
}

/**
 * Determines if a node should be visible based on the current mode.
 * @param {Object} node - The node to check.
 * @returns {boolean} True if the node should be visible.
 */
function determineNodeVisibility(node) {
    if (nodeFocusManager.isContextModeActive) {
        // In context mode, only show focused, neighbor, and two-hop nodes
        return nodeFocusManager.isFocusedNode(node) || 
               nodeFocusManager.isNeighborNode(node) || 
               nodeFocusManager.isTwoHopNeighborNode(node);
    } else {
        // In focus mode or no mode, all nodes are potentially visible (subject to filters)
        return true; 
    }
}

/**
 * Determines if a link should be visible based on the current mode.
 * @param {Object} link - The link to check.
 * @returns {boolean} True if the link should be visible.
 */
function determineLinkVisibility(link) {
    if (nodeFocusManager.isContextModeActive) {
        // In context mode, only show links connected to the focused node
        return nodeFocusManager.getLinkConnectionType(link).isConnected;
    } else {
        // In focus mode or no mode, all links are potentially visible (subject to filters)
        return true;
    }
}

/**
 * Determines the color of a link based on the current mode.
 * @param {Object} link - The link to determine color for.
 * @returns {number|string} The color to use for the link.
 */
function determineLinkColor(link) {
    if (nodeFocusManager.isFocusModeActive || nodeFocusManager.isContextModeActive) {
        if (nodeFocusManager.isFocusedNode(link.source)) { // Outgoing link
            return config.focus.OUTGOING_LINK_COLOR;
        } else if (nodeFocusManager.isFocusedNode(link.target)) { // Incoming link
            return config.focus.INCOMING_LINK_COLOR;
        } else {
            // Link connecting two neighbors (possible in context mode) - keep default
            // Fallback to default color if link is visible but not directly connected to focused node
            return config.graph.arrowColor; // Or another suitable default link color
        }
    } else {
        // Default link color when no mode is active
        return config.graph.arrowColor; // Default color from config
    }
}

/**
 * Determines the number of particles for a link based on the current mode.
 * @param {Object} link - The link to check.
 * @returns {number} The number of particles (e.g., 2 for highlighted, 0 otherwise).
 */
function determineLinkParticles(link) {
    const isConnected = nodeFocusManager.getLinkConnectionType(link).isConnected;
    // Show particles if either mode is active AND the link is connected to the focused node
    return (nodeFocusManager.isFocusModeActive || nodeFocusManager.isContextModeActive) && isConnected ? 2 : 0;
}

/**
 * Determines the color of a node based on its type and the current mode (focus or context).
 * @param {Object} node - The node to determine color for.
 * @returns {number|string} The color to use for the node.
 */
function determineNodeColor(node)
{
    if (nodeFocusManager.isContextModeActive) {
        if (nodeFocusManager.isFocusedNode(node)) {
            return config.focus.FOCUSED_NODE_COLOR;
        }
        else if (nodeFocusManager.isNeighborNode(node)) {
            return config.focus.NEIGHBOR_NODE_COLOR;
        }
        else if (nodeFocusManager.isTwoHopNeighborNode(node)) {
            // Dim two-hop neighbors in context mode
            return config.focus.DIMMED_NODE_COLOR; 
        }
        else {
             // Should not happen if visibility is correct, but return default/dimmed as fallback
             return config.focus.DIMMED_NODE_COLOR;
        }
    }
    else if (nodeFocusManager.isFocusModeActive)
    {
        // Existing focus mode logic
        if (nodeFocusManager.isFocusedNode(node)) {
            return config.focus.FOCUSED_NODE_COLOR;
        }
        else if (nodeFocusManager.isNeighborNode(node)) {
            return config.focus.NEIGHBOR_NODE_COLOR;
        }
        else {
            return config.focus.DIMMED_NODE_COLOR;
        }
    }
    else
    {
        // Default node color when no mode is active
        return getNodeColor(node.type);
    }
}

/**
 * Creates a Three.js object for a node
 * @param {Object} node - The node data
 * @param {boolean} labelsVisible - Whether labels should be visible
 * @returns {THREE.Group} The node object
 */
function createNodeObject(node, labelsVisible) {
    // Create a group to hold both the node and its label
    const group = new THREE.Group();
    
    // Create the node sphere
    const nodeGeometry = new THREE.SphereGeometry(config.graph.nodeSize);
    const nodeMaterial = new THREE.MeshBasicMaterial({ 
        color: determineNodeColor(node),
        transparent: true,
        opacity: 0.8
    });
    const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
    group.add(nodeMesh);
    
    // Create the label sprite if labels are visible
    if (labelsVisible) {
        const sprite = new SpriteText(node.name || node.id);
        sprite.material.depthWrite = false; // Make sprite background transparent
        sprite.color = 'white';
        sprite.textHeight = 4;
        sprite.position.set(0, config.graph.nodeSize + 2, 0); // Position above the node
        group.add(sprite);
    }
    
    return group;
}

/**
 * Loads and renders graph data in the visualization
 * @param {Object} data - The graph data to load
 * @throws {Error} If the graph is not initialized or data loading fails
 */
export async function loadDataAndRender(data) {
    console.log(LOG_MESSAGES.LOADING_DATA);
    
    if (!graph || !graph.graphData) {
        console.error(ERRORS.GRAPH_NOT_INITIALIZED);
        throw new Error(ERRORS.VISUALIZATION_NOT_INITIALIZED);
    }

    try {
        
        if (!data) { // If data is not provided, use default behavior
            console.warn(ERRORS.NO_DATA_PROVIDED);
            return;
        }
        
       
        graphData = data;  // Store the graph data locally
        
        // Exit focus mode when loading new data
        if (nodeFocusManager.isFocusModeActive) {
            nodeFocusManager.exitFocusMode();
            exitActiveMode();
        }
        
        graph.graphData(graphData); // Feed data to the force-graph

        applyFilterState(filterManager.getFilterState());
        
        const labelState = labelManager.getLabelState();
        updateNodeLabels(labelState.nodeLabelsVisible);

        // Setup initial camera position after graph data is loaded
        // Use timeout to allow layout to start settling
        setTimeout(() => {
            graph.zoomToFit(400, config.camera.initialDistance * 0.8); // Adjust padding and distance
        }, config.forceGraph.warmupTicks > 0 ? 500 : 50); // Wait a bit if warmup ticks exist

        console.log(LOG_MESSAGES.DATA_LOADED);
    } catch (error) {
        console.error(ERRORS.LOAD_ERROR, error);
        throw error; // Propagate error to caller for handling
    }
}

/**
 * Handles node click events, entering focus or context mode based on modifier keys.
 * @param {Object} node - The clicked node.
 * @param {Event} event - The click event.
 */
function handleNodeClick(node, event) {
    console.log(LOG_MESSAGES.NODE_CLICKED, node);
    
    const isAltPressed = event.altKey;       // Alt/Option key for Context Mode
    const isCtrlPressed = event.ctrlKey || event.metaKey; // Ctrl/Cmd key for Focus Mode
    
    if (isAltPressed) {
        console.log("Entering Context Mode");
        nodeFocusManager.enterFocusMode(node, graphData, CONTEXT_MODE);
        applyModeStyles();
    } 
    else if (isCtrlPressed) {
        console.log("Entering Focus Mode");
        nodeFocusManager.enterFocusMode(node, graphData, FOCUS_MODE);
        applyModeStyles();
    } 
    else {
         // Regular click - exit any active mode
        exitActiveMode(); 
    }
    
    // Always update info panel regardless of mode change
    updateInfoPanel(node, 'node');
}

/**
 * Handles link click events.
 * Exits any active mode and updates the info panel.
 * @param {Object} link - The clicked link.
 * @param {Event} event - The click event.
 */
function handleLinkClick(link, event) {
    console.log(LOG_MESSAGES.LINK_CLICKED, link);
    exitActiveMode(); // Exit focus/context mode on link click
    
    updateInfoPanel(link, 'link');
}

/**
 * Exits the currently active focus or context mode, if any.
 */
function exitActiveMode() {
    nodeFocusManager.exitFocusMode(); // Resets both flags
    removeModeStyles(); // Apply removal styling (refresh graph, remove indicator)
}

/**
 * Handles filter state changes
 * @param {Object} filterState - The new filter state
 */
function handleFilterStateChange(filterState) {
    applyFilterState(filterState);
}

/**
 * Applies the filter state to the graph
 * @param {Object} filterState - The filter state to apply
 */
function applyFilterState(filterState) {
    if (!graph || !graphData || !graphData.nodes) return;

    // Update node visibility
    graphData.nodes.forEach(node => {
        const type = node.type || 'default';
        const isVisible = filterState[type] ?? config.filter.defaultVisible;
        if (node.__threeObj) {
            node.__threeObj.visible = isVisible;
        }
    });

    
    if (graphData.links) {
        graphData.links.forEach(link => updateLinkVisibility(link, filterState));
    }

    graph.graphData(graphData);
}

/**
 * Updates the visibility of a link based on the filter state of its connected nodes
 * @param {Object} link - The link object to update
 * @param {Object} filterState - The current filter state mapping node types to visibility
 */
function updateLinkVisibility(link, filterState)
{ 
    const sourceType = link.source.type || 'default';
    const targetType = link.target.type || 'default';
    const isVisible = (filterState[sourceType] ?? config.filter.defaultVisible) && 
                        (filterState[targetType] ?? config.filter.defaultVisible);
    
    if (link.__lineObj) link.__lineObj.visible = isVisible;
    if (link.__arrowObj) link.__arrowObj.visible = isVisible;
    if (link.__particlesObj) link.__particlesObj.visible = isVisible;
}

/**
 * Handles label state changes
 * @param {Object} labelState - The new label state
 */
function handleLabelStateChange(labelState) {
    if (!graph) return;

    updateNodeLabels(labelState.nodeLabelsVisible);
    
}

/**
 * Updates the visibility of node labels
 * @param {boolean} visible - Whether labels should be visible
 */
function updateNodeLabels(visible) {
    if (!graph || !graphData || !graphData.nodes) return;
    
    graphData.nodes.forEach(node => {
        updateNodeLabelVisibility(node, visible);
    });
    
    graph.graphData(graphData); // Update the graph to apply changes
}

function updateNodeLabelVisibility(node, visible) {
    if (node.__threeObj) {
        // Find the label sprite (should be the second child of the group)
        const labelSprite = node.__threeObj.children[1];
        if (labelSprite && labelSprite instanceof SpriteText) {
            labelSprite.visible = visible;
        } else if (visible) {
            // If label doesn't exist but should be visible, create it
            const sprite = new SpriteText(node.name || node.id);
            sprite.material.depthWrite = false;
            sprite.color = 'white';
            sprite.textHeight = 4;
            sprite.position.set(0, config.graph.nodeSize + 2, 0);
            node.__threeObj.add(sprite);
        }
    }
}

/**
 * Animation loop function
 */
function animate() {
    requestAnimationFrame(animate);
    
    controls.update();
    
    renderer.render(scene, camera);
}

/**
 * Handles window resize events
 */
function onWindowResize() {
    if (!graphContainer || !camera || !renderer || !graph) return;

    // Update camera aspect ratio
    camera.aspect = graphContainer.offsetWidth / graphContainer.offsetHeight;
    camera.updateProjectionMatrix();

    // Update renderer size
    renderer.setSize(graphContainer.offsetWidth, graphContainer.offsetHeight);

    // Update graph size if it needs explicit resize handling
    if (graph && graph.width && graph.height) {
        graph.width(graphContainer.offsetWidth);
        graph.height(graphContainer.offsetHeight);
    }
}

/**
 * Applies the visual styles for the current active mode (Focus or Context).
 * Refreshes the graph and updates the mode indicator.
 */
function applyModeStyles() { 
    if (!graph || !graphData || !graphData.nodes) return;
    
    console.log("Applying mode styles (Focus or Context)");
   
    // Refresh graph to apply new visibility, color, particle settings
    graph.refresh(); 
    
    // Update the visual indicator (text and visibility)
    updateModeIndicator(); 
}

/**
 * Removes the visual styles associated with Focus or Context mode.
 * Refreshes the graph and updates (removes) the mode indicator.
 */
function removeModeStyles() { 
    if (!graph || !graphData || !graphData.nodes) return;

    console.log("Removing mode styles (Focus or Context)");
    
    // Refresh graph to revert to default visibility, color, etc.
    graph.refresh(); 
    
    // Update the visual indicator (remove it)
    updateModeIndicator(); 
}

const FOCUS_INDICATOR_ID = 'focus-indicator';


function createAndAppendModeIndicator() {
    let indicator = document.createElement('div');
    indicator.id = FOCUS_INDICATOR_ID;
    indicator.className = 'focus-indicator'; // Reuse existing class
    indicator.style.backgroundColor = config.focus.FOCUS_INDICATOR_COLOR;
    indicator.style.border = `1px solid ${config.focus.FOCUS_INDICATOR_BORDER_COLOR}`;
    indicator.style.justifyContent = 'center';
    document.body.appendChild(indicator);
    return indicator;
}

/**
 * Adds, updates, or removes the mode indicator element in the DOM based on the current state.
 */
function updateModeIndicator() {
    let indicator = document.getElementById(FOCUS_INDICATOR_ID);

    if (nodeFocusManager.isContextModeActive) {
        if (!indicator) {
            indicator = createAndAppendModeIndicator();
        }
        indicator.textContent = config.focus.CONTEXT_MODE_INDICATOR_TEXT;
        indicator.style.display = 'block'; // Make sure it's visible

    } else if (nodeFocusManager.isFocusModeActive) {
        if (!indicator) {
            indicator = createAndAppendModeIndicator();
        }
        indicator.textContent = config.focus.FOCUS_MODE_INDICATOR_TEXT;
        indicator.style.display = 'block'; // Make sure it's visible

    } else {
        // Neither mode is active, remove or hide the indicator
        if (indicator) {
            indicator.style.display = 'none'; // Hide instead of removing, potentially slightly faster
            // Alternatively, remove it: indicator.parentNode.removeChild(indicator);
        }
    }
}
