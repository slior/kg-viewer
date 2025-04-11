// js/graphVisualization.js
// Use the globally loaded Three.js instance to avoid duplicate loading
const THREE = window.THREE;
// Import OrbitControls as a module
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// ForceGraph3D is defined globally from the 3d-force-graph library loaded in index.html

import { config, getNodeColor } from './config.js';
import { updateInfoPanel } from './uiManager.js'; // Import UI update function

// Polyfill for process in browser
if (typeof window !== 'undefined' && !window.process) {
    window.process = { env: {} };
}

let scene, camera, renderer, controls, graph;
let graphData = {}; // Store the graph data locally

const graphContainer = document.getElementById(config.ui.graphContainerId);

// --- Initialization ---
export function initGraphVisualization() {
    if (!graphContainer) {
        console.error('Graph container element not found!');
        return;
    }
    console.log("Initializing Graph Visualization...");

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
        console.error("ForceGraph3D is not defined. The 3d-force-graph library might not be loaded correctly.");
        console.log("Available global variables:", Object.keys(window).filter(key => 
            key.includes('Graph') || key.includes('Force') || key.includes('3D')
        ));
        return;
    }

    try {
        // Convert hex color to string for 3d-force-graph
        const backgroundColorString = '#' + config.visualization.backgroundColor.toString(16).padStart(6, '0');
        
        // 5. Force-Directed Graph - Fixed method chaining
        graph = ForceGraph3D({ three: THREE }) // Pass the global THREE instance to avoid duplicate loading
          (graphContainer)
          .backgroundColor(backgroundColorString) // Use string color format
          .nodeLabel('name')
          .linkLabel('label')
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
    } catch (error) {
        console.error("Error initializing 3D force graph:", error);
        return;
    }

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Start animation loop
    animate();

    console.log("Graph Visualization Initialized.");
}

// --- Data Loading and Rendering ---
export async function loadDataAndRender(graphData) {
    console.log("Loading graph data into visualization...");
    
    if (!graph || !graph.graphData) {
        console.error("Graph object not initialized before loading data.");
        throw new Error("Graph visualization not initialized");
    }

    try {
        // If graphData is not provided, use default behavior
        if (!graphData) {
            console.warn("No graph data provided to loadDataAndRender, this might cause issues");
        }
        
        // Feed data to the force-graph
        graph.graphData(graphData);

        // Setup initial camera position after graph data is loaded
        // Use timeout to allow layout to start settling
        setTimeout(() => {
            graph.zoomToFit(400, config.camera.initialDistance * 0.8); // Adjust padding and distance
        }, config.forceGraph.warmupTicks > 0 ? 500 : 50); // Wait a bit if warmup ticks exist

        console.log("Graph data loaded and rendering started.");
    } catch (error) {
        console.error("Error loading graph data into visualization:", error);
        throw error; // Propagate error to caller for handling
    }
}

// --- Interaction Handlers ---
function handleNodeClick(node, event) {
    console.log("Node clicked:", node);
    // Center camera on node (optional)
    // graph.centerAt(node.x, node.y, node.z, 500); // Animate camera focus
    // graph.cameraPosition({ x: node.x, y: node.y, z: camera.position.z }, node, 1000); // Look at node

    // Display node info in the UI panel
    updateInfoPanel(node, 'node');
}

function handleLinkClick(link, event) {
    console.log("Link clicked:", link);
     // Display link info in the UI panel
     updateInfoPanel(link, 'link');
}

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    // Update controls if damping is enabled
    if (controls.enabled) {
        controls.update();
    }

    // Update the force graph simulation/rendering
    if (graph && graph.tickFrame) {
         graph.tickFrame(); // Updates layout and renders the scene
    } else {
        // Fallback render if graph isn't managing the loop
        renderer.render(scene, camera);
    }
}

// --- Resize Handling ---
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

// --- Keyboard Navigation (Placeholder) ---
// TODO: Implement WASD/Arrow/PageUp/Down controls
// This might involve overriding or supplementing OrbitControls.
// We might need to listen to keydown/keyup events and manually move the camera.

document.addEventListener('keydown', (event) => {
    if (!controls) return;

    const moveSpeed = (config.camera.controls.moveSpeed / 1000) * 16; // Adjust speed based on typical frame time
    const ascendSpeed = config.camera.controls.ascendDescendSpeed;

    let moveForward = 0, moveRight = 0, moveUp = 0;

    switch (event.key) {
        case 'w':
        case 'ArrowUp':
            moveForward = -moveSpeed; // Move forward (into the screen)
            break;
        case 's':
        case 'ArrowDown':
            moveForward = moveSpeed; // Move backward
            break;
        case 'a':
        case 'ArrowLeft':
            moveRight = -moveSpeed; // Strafe left
            break;
        case 'd':
        case 'ArrowRight':
            moveRight = moveSpeed; // Strafe right
            break;
        case 'PageUp':
            moveUp = ascendSpeed; // Move up
            break;
        case 'PageDown':
            moveUp = -ascendSpeed; // Move down
            break;
    }

    if (moveForward !== 0 || moveRight !== 0 || moveUp !== 0) {
        // Get camera direction
        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);

        // Get vector pointing right
        const right = new THREE.Vector3();
        right.crossVectors(camera.up, cameraDirection).normalize(); // Right = Up x Direction (adjust if needed)

        // Calculate movement vector based on camera orientation
        const forwardMove = cameraDirection.clone().multiplyScalar(moveForward);
        const rightMove = right.clone().multiplyScalar(moveRight);
        const upMove = camera.up.clone().multiplyScalar(moveUp); // Use camera's local up

        const totalMove = new THREE.Vector3().add(forwardMove).add(rightMove).add(upMove);

        // Apply movement to camera position and target (for OrbitControls)
        camera.position.add(totalMove);
        controls.target.add(totalMove); // Move the point the camera orbits around

        controls.update(); // Update controls after manual move
    }
});