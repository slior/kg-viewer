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
          .linkDirectionalParticles(link => isHighlightedLink(link) ? 2 : 0) //"intensity" of particles
          .linkDirectionalParticleWidth(2) //"width" of particles
          .linkWidth(config.graph.linkWidth)
          .linkCurvature(0.25)
          .linkOpacity(config.graph.linkOpacity)
          .nodeVal(config.graph.nodeSize)
          .nodeColor(node => determineNodeColor(node));
          
        // Configure d3 forces separately to avoid method chaining issues
        graph.d3Force('charge').strength(config.forceGraph.chargeStrength);
        graph.d3Force('link').distance(config.forceGraph.linkDistance);
        
        graph.onNodeClick(handleNodeClick);
        graph.onLinkClick(handleLinkClick);

        filterManager.addListener(handleFilterStateChange);
        labelManager.addListener(handleLabelStateChange);
        document.addEventListener('exitFocusMode', () => { removeFocusMode(); });

    } catch (error) {
        console.error(ERRORS.INIT_ERROR, error);
        return;
    }
    window.addEventListener('resize', onWindowResize, false);
    animate(); // Start animation loop

    console.log(LOG_MESSAGES.INITIALIZED);
}

/**
 * Checks if a link should be highlighted
 * @param {Object} link - The link to check
 * @returns {boolean} True if the link should be highlighted, false otherwise
 */
function isHighlightedLink(link)
{
    const connectionType = nodeFocusManager.getLinkConnectionType(link);
    return connectionType.isConnected;
}

/**
 * Determines the color of a node based on its type and focus state
 * @param {Object} node - The node to determine color for
 * @returns {string} The color to use for the node
 */
function determineNodeColor(node)
{
    if (!nodeFocusManager.isFocusModeActive)
    {
        return getNodeColor(node.type);
    }
    else if (nodeFocusManager.isFocusedNode(node))
    {
        return config.focus.FOCUSED_NODE_COLOR;
    }
    else if (nodeFocusManager.isNeighborNode(node))
    {
        return config.focus.NEIGHBOR_NODE_COLOR;
    }
    else
    {
        return config.focus.DIMMED_NODE_COLOR;
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
            removeFocusMode();
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
 * Handles node click events
 * @param {Object} node - The clicked node
 * @param {Event} event - The click event
 */
function handleNodeClick(node, event) {
    console.log(LOG_MESSAGES.NODE_CLICKED, node);
    
    // Check if Ctrl/Cmd key is pressed for focus mode
    const isCtrlPressed = event.ctrlKey || event.metaKey;
    
    if (isCtrlPressed) {
        nodeFocusManager.enterFocusMode(node, graphData);
        applyFocusMode();

    } 
    else exitFocusModeIfActive(); // Regular click - exit focus mode if active
    
    updateInfoPanel(node, 'node');
}

/**
 * Handles link click events
 * @param {Object} link - The clicked link
 * @param {Event} event - The click event
 */
function handleLinkClick(link, event) {
    console.log(LOG_MESSAGES.LINK_CLICKED, link);
    exitFocusModeIfActive();
    
    updateInfoPanel(link, 'link');
}

function exitFocusModeIfActive()
{
    if (nodeFocusManager.isFocusModeActive) {
        nodeFocusManager.exitFocusMode();
        removeFocusMode();
    }
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
 * Applies focus mode styling to the graph
 */
function applyFocusMode() {
    if (!graph || !graphData || !graphData.nodes) return;
    
    console.log("Applying focus mode");
   
    graph.refresh();
    addFocusIndicator();
}

/**
 * Removes focus mode styling from the graph
 */
function removeFocusMode() {
    
    if (!graph || !graphData || !graphData.nodes) return;

    console.log("Removing focus mode");
    graph.refresh();
    
    removeFocusIndicator();
}

const FOCUS_INDICATOR_ID = 'focus-indicator';

/**
 * Adds a focus indicator to the viewport
 */
function addFocusIndicator() {
    // Check if indicator already exists
    if (document.getElementById(FOCUS_INDICATOR_ID)) return;
    
    // Create focus indicator
    const indicator = document.createElement('div');
    indicator.id = FOCUS_INDICATOR_ID;
    indicator.style.position = 'absolute';
    indicator.style.top = '10px';
    indicator.style.right = '10px';
    indicator.style.width = '150px';
    indicator.style.height = '30px';
    indicator.style.backgroundColor = config.focus.FOCUS_INDICATOR_COLOR;
    indicator.style.border = `1px solid ${config.focus.FOCUS_INDICATOR_BORDER_COLOR}`;
    indicator.style.borderRadius = '5px';
    indicator.style.display = 'flex';
    indicator.style.alignItems = 'center';
    indicator.style.justifyContent = 'center';
    indicator.style.color = 'white';
    indicator.style.fontWeight = 'bold';
    indicator.style.zIndex = '1000';
    indicator.textContent = 'Node Focus';
    
    document.body.appendChild(indicator);
}

/**
 * Removes the focus indicator from the viewport
 */
function removeFocusIndicator() {
    console.log("removeFocusIndicator");
    const indicator = document.getElementById(FOCUS_INDICATOR_ID);
    if (indicator) {
        indicator.remove();
    }
}
