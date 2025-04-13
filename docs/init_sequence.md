# Application Initialization Sequence

This document outlines the initialization sequence of the Knowledge Graph Viewer application using a sequence diagram. The diagram shows the interaction between different components during the application startup.

## Initialization Flow

1. When the DOM is fully loaded, the `initializeApp()` function in main.js is triggered.
2. The application shows a loading indicator and fetches graph data from the server.
3. The UI manager is initialized with the graph data and sets up event listeners.
4. The graph visualization is initialized by setting up THREE.js components and ForceGraph3D.
5. Statistics and legend are updated with the graph data.
6. The graph data is loaded into the visualization and rendered.
7. The loading indicator is hidden, and the initialization is complete.

This sequence diagram provides a clear visualization of how the different components interact during the application initialization process. 

```mermaid
sequenceDiagram
    %% Define participants with different colors
    participant DOM as DOM
    participant Main as main.js
    participant Data as data.js
    participant UIManager as uiManager.js
    participant GraphViz as graphVisualization.js
    participant FilterManager as filterManager.js
    participant LabelManager as labelManager.js
    participant Config as config.js
    participant THREE as THREE.js
    participant ForceGraph3D as ForceGraph3D

    %% Color coding for different types of components
    %% Internal files: #3498db (blue)
    %% 3rd party libraries: #e74c3c (red)
    
    %% DOM Content Loaded event
    DOM->>Main: DOMContentLoaded event
    
    %% Main initialization
    Main->>UIManager: showLoadingIndicator(LOADING_MESSAGE)
    Main->>Data: getProcessedData()
    
    %% Data processing
    Data->>Data: fetchGraphData()
    Data->>Data: validateGraphData()
    Data-->>Main: return graphData
    
    %% UI initialization
    Main->>UIManager: initUIManager(graphData, reloadGraph)
    UIManager->>UIManager: updateStats(graphData)
    UIManager->>UIManager: generateLegend(graphData)
    UIManager->>UIManager: initLabelControls()
    
    %% Graph visualization initialization
    Main->>GraphViz: initGraphVisualization()
    GraphViz->>THREE: new THREE.Scene()
    GraphViz->>THREE: new THREE.PerspectiveCamera()
    GraphViz->>THREE: new THREE.WebGLRenderer()
    GraphViz->>THREE: new OrbitControls()
    GraphViz->>ForceGraph3D: new ForceGraph3D()
    
    %% Data rendering
    Main->>UIManager: updateStats(graphData)
    Main->>UIManager: generateLegend(graphData)
    Main->>GraphViz: loadDataAndRender(graphData)
    
    %% Graph data loading
    GraphViz->>ForceGraph3D: graph.graphData(graphData)
    GraphViz->>FilterManager: applyFilterState(filterManager.getFilterState())
    GraphViz->>LabelManager: updateNodeLabels(labelState.nodeLabelsVisible)
    
    %% Completion
    Main->>UIManager: hideLoadingIndicator()
    Main->>Main: console.log(INIT_SUCCESS_MESSAGE)
```

## Component Descriptions

### Internal Files
- **main.js**: The entry point of the application that orchestrates the initialization process.
- **data.js**: Handles data fetching, validation, and processing.
- **uiManager.js**: Manages UI elements, statistics, and legend generation.
- **graphVisualization.js**: Sets up and manages the 3D graph visualization.
- **filterManager.js**: Manages the visibility state of different node types.
- **labelManager.js**: Manages the visibility state of node and link labels.
- **config.js**: Provides configuration constants for the application.

### Third-Party Libraries
- **THREE.js**: A JavaScript 3D library used for rendering the graph.
- **ForceGraph3D**: A 3D force-directed graph visualization library built on top of THREE.js.
- **OrbitControls**: A THREE.js control for camera manipulation.

