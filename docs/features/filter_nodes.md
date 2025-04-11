# Feature Specification

Implement a filtering capability over the knowledge graph viewer.
The user will have, in the legend widget, a checkbox next to each node type (and color).
- initially, all checkboxes are checked.
- the user will be able to check/uncheck any selection of types of nodes.
- when a specific type of nodes is checked, all nodes of the corresponding type are visible.
- when a specific type of nodes is *unchecked*, all nodes of the corresponding type are hidden.
- when a node is not shown, all incoming and outgoing edges are hidden as well.
- when a node is visible, all edges are shown again.

Additional Requirements:
- Filtering should be applied immediately when a checkbox is toggled (no "Apply" button needed).
- When a node type is filtered out, all connected edges should be completely hidden.
- Filter state should be persisted between page reloads using localStorage (configurable in config.js).
- A "Select All" / "Deselect All" button should be added to quickly toggle all node types.
- Each node type in the legend should show a count of currently visible nodes of that type.

# Plan

## 1. Configuration Updates
- Add filter persistence configuration to `config.js`:
  ```javascript
  filter: {
    persistState: true,  // Whether to persist filter state
    storageKey: 'kg-viewer-filters'  // localStorage key for filter state
  }
  ```

## 2. UI Updates
- Modify `generateLegend()` in `uiManager.js` to:
  - Add checkboxes next to each node type
  - Add node count next to each type
  - Add "Select All" / "Deselect All" button
  - Style the legend items appropriately

## 3. State Management
- Create a new module `filterManager.js` to handle:
  - Filter state storage and retrieval
  - Filter state persistence
  - Filter state updates
  - Node type visibility tracking

## 4. Graph Visualization Updates
- Modify `graphVisualization.js` to:
  - Add methods for showing/hiding nodes by type
  - Add methods for showing/hiding edges based on node visibility
  - Update node and edge visibility when filters change
  - Maintain performance with large graphs

## 5. Integration
- Connect UI events to filter state management
- Connect filter state to graph visualization
- Ensure smooth transitions when applying filters
- Handle edge cases (no nodes of a type, all nodes filtered, etc.)

## 6. Testing
- Unit tests for filter state management
- Integration tests for UI updates
- Performance tests for large graphs
- Edge case handling tests

# Tests

## Unit Tests

### Filter State Management
- **Initialize Filter State**: Tests that the filter state is correctly initialized with all node types visible by default.
- **Toggle Node Type Visibility**: Tests that toggling a node type's visibility correctly updates the filter state.
- **Set All Types Visibility**: Tests that setting all node types to hidden/visible works correctly.
- **Persist Filter State**: Tests that the filter state is correctly persisted to localStorage.
- **Load Persisted Filter State**: Tests that the filter state is correctly loaded from localStorage.

### Node Visibility
- **Node Visibility in Graph**: Tests that nodes are correctly shown/hidden based on the filter state.
- **Edge Visibility with Hidden Nodes**: Tests that edges connected to hidden nodes are also hidden.
- **Event Listeners**: Tests that event listeners are correctly triggered when the filter state changes.

### Performance
- **Performance with Large Graphs**: Tests that the filtering mechanism performs well with large graphs (1000+ nodes).

## Integration Tests

### UI Updates
- **Legend UI Updates**: Tests that the legend UI correctly reflects the current filter state.
- **Node Count Updates**: Tests that the node count in the legend is correctly updated when filters change.
- **Select All/Deselect All**: Tests that the Select All/Deselect All button correctly toggles all node types.

# Implementation Log

## 2024-03-21
1. Added filter configuration to `config.js`:
   - Added `filter` section with persistence settings
   - Added default visibility setting

2. Created `filterManager.js`:
   - Implemented filter state management
   - Added localStorage persistence
   - Added event listener system for state changes

3. Updated `uiManager.js`:
   - Modified legend generation to include checkboxes
   - Added node count display
   - Added Select All/Deselect All button
   - Added filter state change handling

4. Updated `graphVisualization.js`:
   - Added filter state change listener
   - Implemented node and edge visibility management
   - Added performance optimizations for large graphs

5. Updated CSS styles:
   - Added styles for checkboxes and select all button
   - Improved legend item layout
   - Added hover effects for better UX

## Testing Results
- All unit tests passing
- Edge cases handled:
  - Empty graphs
  - Graphs with no nodes of a type
  - All nodes filtered out
  - Invalid filter state in localStorage
