# Feature Specification

Implement the ability to focus on a node, and show only its context nodes and links.
- When the user clicks on a node, but the mouse click is done with the Alt key (Alt + left mouse click), this is the "Node Context Mode".
    - In MacOs, it's the Option + left mouse click
- Node Context mode behaves like a Node Focus Mode - it shows the node's details in the info panel (`info-panel`)
- In addition's the graph visualization changes:
    - The selected node and all incoming + outgoing edges are highlighted: incoming edges (links) like in Node Focus Mode (no change).
    - All neighboring nodes (connected by some edge) are highlighted, like in Node Focus Mode.
    - Nodes that are two links away from the focused node, but not 1 link away (i.e. neighbor of a neighbor) - are dimmed, like in Node Focus Mode.
    - All other nodes and links are not shown at all.
- The user can choose another node to show in focus. The visualization should change accordingly - show neighbor nodes and dim nodes two links away.
- The user can exit the "Node Context Mode" by pressing Escape.
- Node Context mode should be exited when:
    - The user interacts with other UI elements (like filters or labels)
    - The user clicks outside the graph viewport
    - The user loads a new data set or reloads the graph
- The UI should clearly indicate when Node Context mode is active: Similar to the indication used for Node Focus mode, only the text should be different - it should say "Node Context Mode" and not "Node Focus Mode"
- The graph layout should remain the same in Node Context mode (no changes to force simulation)


# Plan

**I. Configuration (`js/config.js`)**

1.  Add a new constant for the context mode indicator text within `FOCUS_CONSTANTS`.
    *   Example: `CONTEXT_MODE_INDICATOR_TEXT: 'Node Context Mode'`
2.  Add a constant for the dimmed color/opacity for two-hop neighbors if different styling is desired than the existing `DIMMED_NODE_COLOR`. For now, we can reuse `DIMMED_NODE_COLOR`.

**II. State Management (`js/nodeFocusManager.js`)**

1.  **Add State Variables:**
    *   Add `this.isContextModeActive = false;` to the `constructor`.
    *   Add `this.twoHopNeighborNodes = [];` to the `constructor`.
2.  **Modify `enterFocusMode`:**
    *   Add an optional `mode` parameter (defaulting to 'focus'). `enterFocusMode(node, graphData, mode = 'focus')`.
    *   Inside the function, check the `mode`:
        *   If `mode === 'focus'`, set `this.isFocusModeActive = true;` and `this.isContextModeActive = false;`.
        *   If `mode === 'context'`, set `this.isContextModeActive = true;` and `this.isFocusModeActive = false;`.
    *   Ensure `this.focusedNode = node;` is set regardless of mode.
    *   Call `findConnectedElements(graphData, mode)` passing the mode.
3.  **Modify `findConnectedElements`:**
    *   Add the `mode` parameter: `findConnectedElements(graphData, mode)`.
    *   Reset `this.twoHopNeighborNodes = [];` at the beginning.
    *   After finding `neighborNodes` and `connectedLinks` (existing logic):
        *   If `mode === 'context'`:
            *   Create a set of neighbor IDs (`neighborIds`) and the focused node ID (`focusedNodeId`) for efficient lookup.
            *   Initialize `twoHopSet = new Set()`.
            *   Iterate through `graphData.links`:
                *   Check if `link.source.id` is in `neighborIds` AND `link.target.id` is NOT `focusedNodeId` AND `link.target.id` is NOT in `neighborIds`. If true, add `link.target` to `twoHopSet`.
                *   Check if `link.target.id` is in `neighborIds` AND `link.source.id` is NOT `focusedNodeId` AND `link.source.id` is NOT in `neighborIds`. If true, add `link.source` to `twoHopSet`.
            *   Convert `twoHopSet` to an array: `this.twoHopNeighborNodes = Array.from(twoHopSet);`
4.  **Modify `exitFocusMode`:**
    *   Reset the new state variables:
        *   `this.isContextModeActive = false;`
        *   `this.twoHopNeighborNodes = [];`
    *   Keep the existing resets (`focusedNode`, `isFocusModeActive`, `neighborNodes`, `connectedLinks`, etc.).
5.  **Add Helper Methods:**
    *   `isContextMode()`: Returns `this.isContextModeActive`.
    *   `isTwoHopNeighborNode(node)`: Returns `this.twoHopNeighborNodes.some(n => n === node || n.id === node.id);`.
6.  **Review Existing Methods:** Confirm `isFocusedNode`, `isNeighborNode`, `getLinkConnectionType` do not need changes for basic context mode identification (they operate on `focusedNode` and `neighborNodes` which are set correctly).

**III. Graph Visualization (`js/graphVisualization.js`)**

1.  **Update `handleNodeClick`:**
    *   Get the `event` object.
    *   Check `event.altKey` (for Alt/Option key).
    *   If `event.altKey` is pressed:
        *   Call `nodeFocusManager.enterFocusMode(node, graphData, 'context');`
        *   Call `applyModeStyles();` (new/refactored function, see below).
    *   Else If `event.ctrlKey || event.metaKey` is pressed (existing logic):
        *   Call `nodeFocusManager.enterFocusMode(node, graphData, 'focus');`
        *   Call `applyModeStyles();`
    *   Else (regular click):
        *   Call `exitActiveMode();` (new/refactored function).
    *   Keep the `updateInfoPanel(node, 'node');` call at the end.
2.  **Refactor/Create Mode Application/Removal Functions:**
    *   Create `applyModeStyles()`:
        *   This function will contain the logic currently in `applyFocusMode`.
        *   It should call `graph.refresh()` to trigger updates based on visibility/color functions.
        *   It should call `updateModeIndicator()` (new function, see below).
    *   Create `exitActiveMode()`:
        *   Check if `nodeFocusManager.isFocusModeActive || nodeFocusManager.isContextModeActive`.
        *   If either is active, call `nodeFocusManager.exitFocusMode()`.
        *   Call `graph.refresh()`.
        *   Call `updateModeIndicator()` (to remove indicator).
    *   Rename `applyFocusMode` -> `applyModeStyles`.
    *   Rename `removeFocusMode` -> `removeModeStyles` (or consolidate into `exitActiveMode`).
    *   Rename `addFocusIndicator`/`removeFocusIndicator` -> `updateModeIndicator`.
3.  **Update Graph Properties:** Modify the functions passed to graph instance methods:
    *   `graph.nodeVisibility(node => ...)`:
        *   If `nodeFocusManager.isContextModeActive`: return `nodeFocusManager.isFocusedNode(node) || nodeFocusManager.isNeighborNode(node) || nodeFocusManager.isTwoHopNeighborNode(node);`
        *   Else If `nodeFocusManager.isFocusModeActive`: return `true`; (Focus mode dims, doesn't hide)
        *   Else: return `true`; (No mode active)
    *   `graph.linkVisibility(link => ...)`:
        *   If `nodeFocusManager.isContextModeActive`: return `nodeFocusManager.getLinkConnectionType(link).isConnected;`
        *   Else If `nodeFocusManager.isFocusModeActive`: return `true`; (Focus mode colors, doesn't hide)
        *   Else: return `true`; (No mode active)
    *   `graph.nodeColor(determineNodeColor)`: Modify the existing `determineNodeColor` function:
        *   If `nodeFocusManager.isContextModeActive`:
            *   If `nodeFocusManager.isFocusedNode(node)`: return `config.focus.FOCUSED_NODE_COLOR`.
            *   If `nodeFocusManager.isNeighborNode(node)`: return `config.focus.NEIGHBOR_NODE_COLOR`.
            *   If `nodeFocusManager.isTwoHopNeighborNode(node)`: return `config.focus.DIMMED_NODE_COLOR`.
            *   Else: return `config.focus.DIMMED_NODE_COLOR`; (Shouldn't be visible due to `nodeVisibility`, but provide a fallback)
        *   Else If `nodeFocusManager.isFocusModeActive`: (Existing logic)
            *   If `nodeFocusManager.isFocusedNode(node)`: return `config.focus.FOCUSED_NODE_COLOR`.
            *   If `nodeFocusManager.isNeighborNode(node)`: return `config.focus.NEIGHBOR_NODE_COLOR`.
            *   Else: return `config.focus.DIMMED_NODE_COLOR`.
        *   Else: return `getNodeColor(node.type)`; (Existing default logic)
    *   `graph.linkColor(link => ...)`: (Adapt existing logic if needed, focus mode already colors links)
        *   If `nodeFocusManager.isFocusModeActive || nodeFocusManager.isContextModeActive`:
            *   Check `nodeFocusManager.getLinkConnectionType(link)` and return `config.focus.INCOMING_LINK_COLOR` or `config.focus.OUTGOING_LINK_COLOR` based on whether the focused node is source or target.
            *   *Note:* The spec for Context mode says "incoming edges (links) like in Node Focus Mode". Need to confirm if outgoing should also be highlighted or just visible. Assuming both for now, like focus mode.
        *   Else: return default link color/material.
    *   `graph.linkDirectionalParticles(link => ...)`: (Adapt existing logic)
        *   Show particles only if the link is highlighted in either focus or context mode.
        *   `(nodeFocusManager.isFocusModeActive || nodeFocusManager.isContextModeActive) && nodeFocusManager.getLinkConnectionType(link).isConnected`
4.  **Update UI Indicator Logic:**
    *   Create `updateModeIndicator()`:
        *   Get the indicator element (`document.getElementById(FOCUS_INDICATOR_ID)`).
        *   If `nodeFocusManager.isContextModeActive`:
            *   Ensure indicator exists (create if not, similar to `addFocusIndicator`).
            *   Set text content to `config.focus.CONTEXT_MODE_INDICATOR_TEXT` (or the actual constant name).
            *   Make indicator visible.
        *   Else If `nodeFocusManager.isFocusModeActive`:
            *   Ensure indicator exists.
            *   Set text content to 'Node Focus'.
            *   Make indicator visible.
        *   Else (neither mode active):
            *   If indicator exists, remove it or hide it.
    *   Replace calls to `addFocusIndicator` and `removeFocusIndicator` with calls to `updateModeIndicator`.

**IV. UI Manager (`js/uiManager.js`)**

1.  **Update `handleKeyDown` (Escape Key):**
    *   Modify the condition: `if ((event.key === 'Escape') && (nodeFocusManager.isFocusModeActive || nodeFocusManager.isContextModeActive))`.
    *   The existing `nodeFocusManager.exitFocusMode();` call is sufficient as it now resets both modes.
    *   Keep the `dispatchEvent` call.
    *   Ensure `updateInfoPanel(null, 'node');` is called to clear panel details and mode indicator.
2.  **Update `handleDocumentClick` (Click Outside):**
    *   Modify the condition: `if (graphContainer && !graphContainer.contains(event.target) && (nodeFocusManager.isFocusModeActive || nodeFocusManager.isContextModeActive))`.
    *   The existing `nodeFocusManager.exitFocusMode();` call is sufficient.
    *   Keep the `dispatchEvent` call.
3.  **Update `updateInfoPanel`:**
    *   Modify the focus mode indicator section:
        *   If `nodeFocusManager.isContextModeActive && itemType === 'node'`:
            *   `htmlContent += '<div class="focus-mode-indicator">Node Context Mode Active</div>';` (Use the constant from `config.js` eventually)
        *   Else If `nodeFocusManager.isFocusModeActive && itemType === 'node'`:
            *   `htmlContent += '<div class="focus-mode-indicator">Node Focus Active</div>';` (Existing line)
    *   Ensure the rest of the function works as expected.

**V. Event Listeners and Initialization**

1.  Ensure the `exitFocusMode` custom event listener in `graphVisualization.js` correctly calls the refactored exit function (`exitActiveMode` or equivalent).
    *   `document.addEventListener('exitFocusMode', () => { exitActiveMode(); });`

---

**IMPLEMENTATION CHECKLIST:**

1.  [ ] **`js/config.js`**: Add `CONTEXT_MODE_INDICATOR_TEXT` constant to `FOCUS_CONSTANTS`.
2.  [ ] **`js/nodeFocusManager.js`**: Add `isContextModeActive` (boolean) and `twoHopNeighborNodes` (array) properties to the class instance. Initialize them in the `constructor`.
3.  [ ] **`js/nodeFocusManager.js`**: Modify `enterFocusMode` to accept an optional `mode` parameter ('focus' or 'context') and set `isFocusModeActive`/`isContextModeActive` accordingly. Pass `mode` to `findConnectedElements`.
4.  [ ] **`js/nodeFocusManager.js`**: Modify `findConnectedElements` to accept `mode`. If `mode === 'context'`, calculate and store `twoHopNeighborNodes` based on neighbors of neighbors (excluding focused node and direct neighbors). Reset `twoHopNeighborNodes` at the start.
5.  [ ] **`js/nodeFocusManager.js`**: Modify `exitFocusMode` to reset `isContextModeActive` and `twoHopNeighborNodes` in addition to existing resets.
6.  [ ] **`js/nodeFocusManager.js`**: Add helper methods `isContextMode()` and `isTwoHopNeighborNode(node)`.
7.  [ ] **`js/graphVisualization.js`**: Update `handleNodeClick` to check for `event.altKey` and call `nodeFocusManager.enterFocusMode(node, graphData, 'context')` and `applyModeStyles()` (new/refactored). Keep Ctrl/Cmd logic for 'focus' mode. Update regular click to call `exitActiveMode()` (new/refactored).
8.  [ ] **`js/graphVisualization.js`**: Refactor `applyFocusMode`, `removeFocusMode`, `addFocusIndicator`, `removeFocusIndicator` into `applyModeStyles()`, `exitActiveMode()`, and `updateModeIndicator()`.
9.  [ ] **`js/graphVisualization.js`**: Update the function passed to `graph.nodeVisibility()` to hide nodes not in focus, neighbors, or two-hop neighbors when `isContextModeActive`.
10. [ ] **`js/graphVisualization.js`**: Update the function passed to `graph.linkVisibility()` to hide links not connected to the focused node when `isContextModeActive`.
11. [ ] **`js/graphVisualization.js`**: Update the `determineNodeColor` function (passed to `graph.nodeColor()`) to handle context mode: color focused/neighbor nodes normally, color two-hop neighbors using `DIMMED_NODE_COLOR`.
12. [ ] **`js/graphVisualization.js`**: Ensure functions passed to `graph.linkColor()` and `graph.linkDirectionalParticles()` correctly apply highlighting based on *either* focus or context mode being active.
13. [ ] **`js/graphVisualization.js`**: Implement `updateModeIndicator()` to create/update/remove the indicator element (ID: `FOCUS_INDICATOR_ID`) and set its text content based on `isFocusModeActive` or `isContextModeActive`.
14. [ ] **`js/graphVisualization.js`**: Update the `exitFocusMode` event listener to call the refactored `exitActiveMode()`.
15. [ ] **`js/uiManager.js`**: Update `handleKeyDown` (Escape key) condition to check for `isFocusModeActive || isContextModeActive`. Ensure `exitFocusMode()` is called and info panel is updated.
16. [ ] **`js/uiManager.js`**: Update `handleDocumentClick` (Click outside) condition to check for `isFocusModeActive || isContextModeActive`. Ensure `exitFocusMode()` is called.
17. [ ] **`js/uiManager.js`**: Update `updateInfoPanel` to display "Node Context Mode Active" text when `isContextModeActive`, otherwise display "Node Focus Active" when `isFocusModeActive`.

---

## Testing

# Implementation Log

*   **Execution Phase:**
    *   Added `CONTEXT_MODE_INDICATOR_TEXT` constant to `js/config.js`.
    *   Modified `js/nodeFocusManager.js`:
        *   Added `isContextModeActive` and `twoHopNeighborNodes` state.
        *   Updated `enterFocusMode` to handle `'context'` mode, setting flags and calling `findConnectedElements` with the mode.
        *   Updated `findConnectedElements` to calculate `twoHopNeighborNodes` when in context mode.
        *   Updated `exitFocusMode` to reset new context mode state.
        *   Added `isContextMode()` and `isTwoHopNeighborNode()` helpers.
    *   Modified `js/graphVisualization.js`:
        *   Updated `handleNodeClick` to trigger context mode on Alt+Click.
        *   Refactored mode application/removal logic into `applyModeStyles`, `exitActiveMode`, `removeModeStyles`, `updateModeIndicator`.
        *   Added/Updated functions (`determineNodeVisibility`, `determineLinkVisibility`, `determineNodeColor`, `determineLinkColor`, `determineLinkParticles`) and passed them to graph instance for context-aware rendering.
        *   Updated `exitFocusMode` event listener to use `exitActiveMode`.
    *   Modified `js/uiManager.js`:
        *   Updated `handleKeyDown` (Escape) and `handleDocumentClick` (outside click) to exit *either* focus or context mode.
        *   Updated `updateInfoPanel` to display the correct indicator text based on the active mode.
*   **Review Phase:**
    *   Verified each item in the implementation checklist against the code changes.
    *   Confirmed adherence to basic cleanup guidelines (comments, literals, duplication, function structure).
    *   Result: Implementation matches the plan exactly.