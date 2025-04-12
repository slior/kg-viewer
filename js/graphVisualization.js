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

    // Check if SpriteText is defined
    if (typeof SpriteText === 'undefined') {
        console.error("SpriteText is not defined. The three-spritetext library might not be loaded correctly.");
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
          .nodeThreeObject(node => {
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
              if (initialLabelState.nodeLabelsVisible) {
                  const sprite = new SpriteText(node.name || node.id);
                  sprite.material.depthWrite = false; // Make sprite background transparent
                  sprite.color = 'white';
                  sprite.textHeight = 4;
                  sprite.position.set(0, config.graph.nodeSize + 2, 0); // Position above the node
                  group.add(sprite);
              }
              
              return group;
          })
          .linkThreeObjectExtend(true)
          .linkThreeObject(link => {
              // Create a group to hold the link
              const group = new THREE.Group();
              
              // Create the link line using CylinderGeometry
              const linkGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
              const linkMaterial = new THREE.MeshBasicMaterial({ 
                  color: config.graph.arrowColor,
                  transparent: true,
                  opacity: config.graph.linkOpacity
              });
              const linkMesh = new THREE.Mesh(linkGeometry, linkMaterial);
              linkMesh.rotation.x = Math.PI / 2; // Rotate to align with link direction
              group.add(linkMesh);
              
              return group;
          })
          .linkPositionUpdate((linkObj, { start, end }) => {
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
          })
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
export async function loadDataAndRender(data) {
    console.log("Loading graph data into visualization...");
    
    if (!graph || !graph.graphData) {
        console.error("Graph object not initialized before loading data.");
        throw new Error("Graph visualization not initialized");
    }

    try {
        // If data is not provided, use default behavior
        if (!data) {
            console.warn("No graph data provided to loadDataAndRender, this might cause issues");
            return;
        }
        
        // Store the graph data locally
        graphData = data;
        
        // Feed data to the force-graph
        graph.graphData(graphData);

        // Apply initial filter state
        applyFilterState(filterManager.getFilterState());
        
        // Apply initial label state
        const labelState = labelManager.getLabelState();
        updateNodeLabels(labelState.nodeLabelsVisible);
        updateLinkLabels(labelState.linkLabelsVisible);

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

// --- Filter State Management ---
function handleFilterStateChange(filterState) {
    applyFilterState(filterState);
}

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

    // Update link visibility based on connected nodes
    if (graphData.links) {
        graphData.links.forEach(link => {
            const sourceType = link.source.type || 'default';
            const targetType = link.target.type || 'default';
            const isVisible = (filterState[sourceType] ?? config.filter.defaultVisible) && 
                             (filterState[targetType] ?? config.filter.defaultVisible);
            
            if (link.__lineObj) link.__lineObj.visible = isVisible;
            if (link.__arrowObj) link.__arrowObj.visible = isVisible;
            if (link.__particlesObj) link.__particlesObj.visible = isVisible;
        });
    }

    // Update the graph
    graph.graphData(graphData);
}

// Handle label state changes
function handleLabelStateChange(labelState) {
    if (!graph) return;

    // Update node labels
    updateNodeLabels(labelState.nodeLabelsVisible);
    
    // Update link labels
    updateLinkLabels(labelState.linkLabelsVisible);
}

// Update node labels visibility
function updateNodeLabels(visible) {
    if (!graph || !graphData || !graphData.nodes) return;
    
    graphData.nodes.forEach(node => {
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
    });
    
    // Update the graph to apply changes
    graph.graphData(graphData);
}

// Update link labels visibility
function updateLinkLabels(visible) {
    if (!graph || !graphData || !graphData.links) return;
    
    // Remove all existing link labels from the scene
    if (graph.__linkLabels) {
        graph.__linkLabels.forEach(label => {
            if (label.parent) {
                label.parent.remove(label);
            }
        });
    }
    
    // Create a new array to store link labels
    graph.__linkLabels = [];
    
    if (visible) {
        // Create new labels for all links
        graphData.links.forEach(link => {
            if (link.label && link.source && link.target) {
                // Create the label sprite
                const sprite = new SpriteText(link.label);
                sprite.material.depthWrite = false;
                sprite.color = 'white';
                sprite.textHeight = 3;
                
                // Store the link reference on the sprite for later updates
                sprite.__link = link;
                
                // Add the sprite to the scene
                scene.add(sprite);
                
                // Store the sprite in the array
                graph.__linkLabels.push(sprite);
                
                // Position the label
                updateLinkLabelPosition(sprite, link);
            }
        });
    }
    
    // Update the graph to apply changes
    graph.graphData(graphData);
}

// Update the position of a link label
function updateLinkLabelPosition(sprite, link) {
    if (!link.source || !link.target) return;
    
    // Get the source and target node positions
    const sourcePos = new THREE.Vector3(link.source.x, link.source.y, link.source.z);
    const targetPos = new THREE.Vector3(link.target.x, link.target.y, link.target.z);
    
    // Calculate the middle point
    const middlePos = new THREE.Vector3().addVectors(sourcePos, targetPos).multiplyScalar(0.5);
    
    // Position the label slightly above the middle point
    sprite.position.set(middlePos.x, middlePos.y + 2, middlePos.z);
    
    // Make the label always face the camera
    sprite.quaternion.copy(camera.quaternion);
}

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    
    // Update controls
    controls.update();
    
    // Update link label positions
    if (graph.__linkLabels) {
        graph.__linkLabels.forEach(sprite => {
            if (sprite.__link) {
                updateLinkLabelPosition(sprite, sprite.__link);
            }
        });
    }
    
    // Render the scene
    renderer.render(scene, camera);
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