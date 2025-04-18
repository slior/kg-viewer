# Feature Specification

Implement the ability to focus on a specific node.
- When the user clicks on a node, but the mouse click is done with the Ctrl key (Ctrl + left mouse click), this is the "Node Focus Mode".
    - In MacOs, it's the Cmd + left mouse click
- Node Focus mode behaves like a regular mouse click - it shows the node's details in the info panel (`info-panel`)
- In addition's the graph visualization changes:
    - The selected node and all incoming + outgoing edges are highlighted: incoming edges (links) in green, outgoing edges (links) in red.
    - All neighboring nodes (connected by some edge) are highlighted as well with a white border.
    - All other nodes - not directly connected to the node in focus - are dimmed.
- The user can choose another node to show in focus. The visualization should change accordingly.
- The user can exit the "Node Focus Mode" by pressing Escape.
- Node Focus mode should be exited when:
    - The user interacts with other UI elements (like filters or labels)
    - The user clicks outside the graph viewport
    - The user loads a new data set or reloads the graph
- The UI should clearly indicate when Node Focus mode is active:
    - A light color rectangle on the viewport
    - A textual indication in the info panel
- The graph layout should remain the same in Node Focus mode (no changes to force simulation)

# Plan

## Implementation Steps

1. **Create Node Focus Manager**:
   - Create `js/nodeFocusManager.js` to manage focus state and functionality
   - Implement methods to enter/exit focus mode
   - Define visual styling for focused nodes, edges, and neighboring nodes

2. **Update Configuration**:
   - Add focus mode styling configuration to `js/config.js`
   - Define colors for highlighted elements (green for incoming edges, red for outgoing edges, white border for neighboring nodes)
   - Define opacity for dimmed nodes

3. **Update Graph Visualization**:
   - Modify `js/graphVisualization.js` to handle focus mode
   - Implement Ctrl/Cmd + click detection for entering focus mode
   - Add methods to apply and remove focus styling
   - Implement visual highlighting for focused elements

4. **Update UI Manager**:
   - Modify `js/uiManager.js` to handle keyboard events (Escape key)
   - Update info panel to show focus mode status
   - Add event listeners for UI interactions that should exit focus mode

5. **Update HTML**:
   - Add focus mode status indicator to `index.html`
   - Add visual indicator for focus mode

6. **Testing**:
   - Implement unit tests for Node Focus Manager
   - Test focus mode entry/exit
   - Test visual highlighting
   - Test UI interactions that exit focus mode

# Testing

## Unit Tests
- Test Node Focus Manager state management
- Test visual styling application and removal
- Test keyboard event handling

## Integration Tests
- Test interaction between Node Focus Manager and Graph Visualization
- Test interaction between Node Focus Manager and UI Manager

## User Acceptance Tests
- Test entering focus mode with Ctrl/Cmd + click
- Test exiting focus mode with Escape key
- Test exiting focus mode by interacting with other UI elements
- Test exiting focus mode by clicking outside the graph
- Test exiting focus mode by loading new data or reloading graph
- Test visual highlighting of focused nodes, edges, and neighboring nodes
- Test that the info panel shows node details and focus mode status
- Test that selecting another node changes the focus

# Implementation Log

## Initial Implementation
- Created `js/nodeFocusManager.js` to manage focus state and functionality
- Added focus mode styling configuration to `js/config.js`
- Updated `js/graphVisualization.js` to handle focus mode:
  - Added Ctrl/Cmd + click detection for entering focus mode
  - Implemented visual highlighting for focused nodes, edges, and neighboring nodes
  - Added focus indicator to the viewport
- Updated `js/uiManager.js` to handle keyboard events:
  - Added Escape key handling to exit focus mode
  - Added click outside graph handling to exit focus mode
  - Updated info panel to show focus mode status
- Added CSS for focus mode indicator in `css/style.css`

## Color Format Handling Enhancement
- Added `hexColorToNumber` utility function to `js/graphVisualization.js` to convert hex color strings to numbers for THREE.js compatibility.
- Updated all `setHex` calls in the visualization code to use the new utility function, ensuring consistent color handling regardless of input format.

