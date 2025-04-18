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

/**
 * Converts a hex color string (#RRGGBB) to a number (0xRRGGBB)
 * @param {string|number} color - The color in hex string format (#RRGGBB) or number format (0xRRGGBB)
 * @returns {number} The color as a number (0xRRGGBB)
 */
function hexColorToNumber(color) {
    // If already a number, return as is
    if (typeof color === 'number') {
        return color;
    }
    
    // If it's a string, convert it
    if (typeof color === 'string') {
        // Remove the # if present
        const hexString = color.startsWith('#') ? color.substring(1) : color;
        // Parse the hex string to a number
        return parseInt(hexString, 16);
    }
    
    // Default fallback
    return 0x000000;
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
          .linkThreeObject(link => createLinkObject(link))
          .linkPositionUpdate((linkObj, { start, end }) => updateLinkPosition(linkObj, start, end))
          .linkDirectionalArrowLength(config.graph.arrowLength)
          .linkDirectionalArrowRelPos(1)
          .linkDirectionalArrowColor(config.graph.arrowColor)
          .linkWidth(config.graph.linkWidth)
          .linkOpacity(config.graph.linkOpacity)
          .nodeVal(config.graph.nodeSize)
          .nodeAutoColorBy('type')
          .nodeColor(node => getNodeColor(node.type));
          
        // Configure d3 forces separately to avoid method chaining issues
        graph.d3Force('charge').strength(config.forceGraph.chargeStrength);
        graph.d3Force('link').distance(config.forceGraph.linkDistance);
        
        // Set up event handlers
        graph.onNodeClick(handleNodeClick);
        graph.onLinkClick(handleLinkClick);

        // Add filter state change listener
        filterManager.addListener(handleFilterStateChange);

        // Add label state change listener
        labelManager.addListener(handleLabelStateChange);
    } catch (error) {
        console.error(ERRORS.INIT_ERROR, error);
        return;
    }

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Add event listener for exiting focus mode
    document.addEventListener('exitFocusMode', () => {
            removeFocusMode();
    });

    // Start animation loop
    animate();

    console.log(LOG_MESSAGES.INITIALIZED);
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
        color: getNodeColor(node.type),
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
 * Creates a Three.js object for a link
 * @param {Object} link - The link data
 * @returns {THREE.Group} The link object
 */
function createLinkObject(link) {
    // Create a group to hold the link
    const group = new THREE.Group();
    
    // Create the link line using CylinderGeometry
    const linkGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
    const linkMaterial = new THREE.MeshBasicMaterial({ 
        color: config.graph.arrowColor,
        // transparent: true,
        transparent: false,
        side: THREE.DoubleSide,
        opacity: config.graph.linkOpacity
    });
    const linkMesh = new THREE.Mesh(linkGeometry, linkMaterial);
    linkMesh.rotation.x = Math.PI / 2; // Rotate to align with link direction
    group.add(linkMesh);
    
    return group;
}

/**
 * Updates the position and orientation of a link object
 * @param {THREE.Object3D} linkObj - The link object to update
 * @param {Object} start - The start position
 * @param {Object} end - The end position
 */
function updateLinkPosition(linkObj, start, end) {
    // Calculate the middle point between start and end
    const middlePos = {
        x: start.x + (end.x - start.x) / 2,
        y: start.y + (end.y - start.y) / 2,
        z: start.z + (end.z - start.z) / 2
    };
    
    // Position the link object at the middle point
    linkObj.position.set(middlePos.x, middlePos.y, middlePos.z);
    
    // Calculate the direction vector from start to end
    const direction = new THREE.Vector3(
        end.x - start.x,
        end.y - start.y,
        end.z - start.z
    );
    
    // Calculate the distance between nodes
    const distance = direction.length();
    
    // Scale the link to match the distance between nodes
    linkObj.scale.set(1, distance, 1);
    
    // Normalize the direction vector
    direction.normalize();
    
    // Create a quaternion that rotates from the default cylinder direction (0,1,0) to our desired direction
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(up, direction);
    
    // Apply the rotation
    linkObj.quaternion.copy(quaternion);
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
        // Enter focus mode
        nodeFocusManager.enterFocusMode(node, graphData);
        applyFocusMode();
    } else {
        // Regular click - exit focus mode if active
        if (nodeFocusManager.isFocusModeActive) {
            nodeFocusManager.exitFocusMode();
            removeFocusMode();
        }
    }
    
    // Display node info in the UI panel
    updateInfoPanel(node, 'node');
}

/**
 * Handles link click events
 * @param {Object} link - The clicked link
 * @param {Event} event - The click event
 */
function handleLinkClick(link, event) {
    console.log(LOG_MESSAGES.LINK_CLICKED, link);
    
    // Exit focus mode if active
    if (nodeFocusManager.isFocusModeActive) {
        nodeFocusManager.exitFocusMode();
        removeFocusMode();
    }
    
    // Display link info in the UI panel
    updateInfoPanel(link, 'link');
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

// Update link visibility based on connected nodes
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

function highlighFocusNode(node,nodeMesh)
{
    // Focused node - white color
    nodeMesh.material.color.setHex(hexColorToNumber(config.focus.FOCUSED_NODE_COLOR));
    nodeMesh.material.opacity = 1;
    
    // Add white border
    if (!node.__borderMesh) {
        const borderGeometry = new THREE.SphereGeometry(config.graph.nodeSize + 1, 16, 16);
        const borderMaterial = new THREE.MeshBasicMaterial({
            color: config.focus.NEIGHBOR_NODE_BORDER_COLOR,
            transparent: true,
            opacity: 0.8,
            side: THREE.BackSide
        });
        node.__borderMesh = new THREE.Mesh(borderGeometry, borderMaterial);
        node.__threeObj.add(node.__borderMesh);
    } else {
        node.__borderMesh.visible = true;
    }
}

function highlighNeighborNode(node,nodeMesh)
{
    nodeMesh.material.color.setHex(hexColorToNumber(getNodeColor(node.type)));
                
    nodeMesh.material.opacity = 0.8;
    
    // Add white border
    if (!node.__borderMesh) {
        const borderGeometry = new THREE.SphereGeometry(config.graph.nodeSize + 1, 16, 16);
        const borderMaterial = new THREE.MeshBasicMaterial({
            color: config.focus.NEIGHBOR_NODE_BORDER_COLOR,
            transparent: true,
            opacity: 0.8,
            side: THREE.BackSide
        });
        node.__borderMesh = new THREE.Mesh(borderGeometry, borderMaterial);
        node.__threeObj.add(node.__borderMesh);
    } else {
        node.__borderMesh.visible = true;
    }
}

function dimNode(node,nodeMesh)
{
    nodeMesh.material.color.setHex(hexColorToNumber(getNodeColor(node.type)));
    nodeMesh.material.opacity = config.focus.DIMMED_NODE_OPACITY;
    
    // Hide border if exists
    if (node.__borderMesh) {
        node.__borderMesh.visible = false;
    }
}

function highlightLink(linkMesh, isIncoming)
{
    console.log("Connection is incoming", isIncoming);
    console.log(" - Link Mesh", linkMesh);
    if (isIncoming) {
        console.log("setting incoming link color", config.focus.INCOMING_LINK_COLOR);
        linkMesh.material.color.setHex((config.focus.INCOMING_LINK_COLOR));
        linkMesh.material.needsUpdate = true;
    } else {
        console.log("setting outgoing link color", config.focus.OUTGOING_LINK_COLOR);
        linkMesh.material.color.setHex((config.focus.OUTGOING_LINK_COLOR));
        linkMesh.material.needsUpdate = true;
    }
    linkMesh.material.opacity = 1;
    linkMesh.material.needsUpdate = true;
}

function dimLink(linkMesh)
{
    linkMesh.material.color.setHex(hexColorToNumber(config.graph.arrowColor));
    linkMesh.material.opacity = config.focus.DIMMED_NODE_OPACITY;
    linkMesh.material.needsUpdate = true;
}

/**
 * Applies focus mode styling to the graph
 */
function applyFocusMode() {
    if (!graph || !graphData || !graphData.nodes) return;
    
    // Apply styling to nodes
    graphData.nodes.forEach(node => {
        if (node.__threeObj) {
            // Get the node mesh (first child of the group)
            const nodeMesh = node.__threeObj.children[0];
            
            if (nodeFocusManager.isFocusedNode(node)) {
                highlighFocusNode(node,nodeMesh);
            } else if (nodeFocusManager.isNeighborNode(node)) {
                highlighNeighborNode(node,nodeMesh);
                
            } else { // Other nodes - dimmed
                
                dimNode(node,nodeMesh);
            }
        }
    });
    
    // Apply styling to links
    if (graphData.links) {
        graphData.links.forEach(link => {
            if (link.__lineObj) {
                // Get the link mesh (first child of the group)
                const linkMesh = link.__lineObj.children[0];
                
                const connectionType = nodeFocusManager.getLinkConnectionType(link);
                
                if (connectionType.isConnected) {
                    highlightLink(linkMesh, connectionType.type === 'incoming');
                } else { // Other links - dimmed
                    dimLink(linkMesh);
                }
            }
        });
    }
    addFocusIndicator();
}

function resetNodeColor(node)
{
    const nodeMesh = node.__threeObj.children[0];
    nodeMesh.material.color.setHex(hexColorToNumber(getNodeColor(node.type)));
    nodeMesh.material.opacity = 1;
    
    // Hide border if exists
    if (node.__borderMesh) {
        node.__borderMesh.visible = false;
    }
}

function resetLinkColor(link)
{
    const linkMesh = link.__lineObj.children[0];
    console.log("Link Mesh", linkMesh);
    linkMesh.material.color.setHex(hexColorToNumber(config.graph.arrowColor));
    linkMesh.material.opacity = config.graph.linkOpacity;
}
/**
 * Removes focus mode styling from the graph
 */
function removeFocusMode() {
    console.log("removeFocusMode");
    if (!graph || !graphData || !graphData.nodes) return;
    
    // Reset node styling
    graphData.nodes.forEach(node => {
        if (node.__threeObj) {
            resetNodeColor(node);
        }
    });
    
    // Reset link styling
    if (graphData.links) {
        graphData.links.forEach(link => {
            if (link.__lineObj) {
                resetLinkColor(link);
            }
        });
    }
    
    // Remove focus indicator
    removeFocusIndicator();
}

/**
 * Adds a focus indicator to the viewport
 */
function addFocusIndicator() {
    // Check if indicator already exists
    if (document.getElementById('focus-indicator')) return;
    
    // Create focus indicator
    const indicator = document.createElement('div');
    indicator.id = 'focus-indicator';
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
    
    // Add to document
    document.body.appendChild(indicator);
}

/**
 * Removes the focus indicator from the viewport
 */
function removeFocusIndicator() {
    console.log("removeFocusIndicator");
    const indicator = document.getElementById('focus-indicator');
    if (indicator) {
        indicator.remove();
    }
}
