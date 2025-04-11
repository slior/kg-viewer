# Feature Specification

Data should be read from some server. 
- Change the implementation in ./js/data so data is read from a server.
- Configuration for the base server url should be in ./js/config.js.
- An example for expected data schema:
```
{
    nodes : [
      {
        id: "node1", // Using 'id' as required by three-forcegraph
        name : "node1",
        type: "service",
        description: "This is the first service node.",
        insights: [ "insight1", "some other important insight" ]
      },
      {
        id: "node2",
        name : "node2",
        type: "identity",
        description: "An identity node.",
        insights: [ "insight21", "some other important insight about node2" ],
       some_other_prop : 74
      },
       {
        id: "node3",
        name : "node3",
        type: "resource",
        description: "A resource node connected to node1.",
        insights: ["insight3"]
      },
       {
        id: "node4",
        name : "node4",
        type: "service",
        description: "Another service node, connected to node2.",
        insights: ["insight4a", "insight4b"]
      }
    ],
    links : [
      { source : "node2", target : "node1", label : "belongs to", some_other_property : 5},
      { source : "node1", target : "node3", label : "consumes"},
      { source : "node2", target : "node4", label : "manages"}
    ]
  }
```
    - required properties for nodes: 'name', 'id', 'type', 'description'.
        - 'insights' is also per node, but can be empty.
    - required properties for links: 'source', 'target','label'
    - node ids are unique in the graph.
    - link source and target refer to node ids.
    - both nodes and links can have arbitrary additional properties.

- code in ./js/data.js should validate the above properties.

# Plan

## 1. Update config.js
1. Add a new section in the config object for API settings:
   - `apiBaseUrl`: Base URL for the API server
   - `apiEndpoint`: Endpoint path to fetch graph data
   - `fetchTimeout`: Timeout duration for API requests
   - `retryCount`: Number of retries in case of failed requests

## 2. Update data.js
1. Replace the static `graphData` with a function to fetch data from server:
   - Implement `fetchGraphData()` to make the API request using fetch API
   - Handle errors, retries, and timeout
   - Implement response validation to ensure required fields are present
   - Include fallback to static sample data in case of repeated failure

2. Update `getProcessedData()` to:
   - Become async to support fetching data
   - Validate the data structure and required fields for nodes and links
   - Process and validate the data similar to the existing implementation

## 3. Update main.js
1. Modify to handle asynchronous data loading:
   - Update `initializeApp()` to handle async data operations
   - Add loading indicators during data fetching
   - Implement proper error handling and user feedback
   - Update the reload functionality to fetch fresh data from server

## 4. Update graphVisualization.js
1. Modify `loadDataAndRender()` to handle async data:
   - Wait for data promise to resolve before rendering
   - Add error handling for failed data fetching

## Tests

### 1. Unit Tests for Data Fetching and Validation
1. Test successful data fetching:
   - Mock server response with valid data
   - Verify data is properly processed and validated

2. Test data validation:
   - Mock server responses with missing required fields
   - Verify appropriate error messages and fallback behavior

3. Test error handling:
   - Mock network failures, timeouts, and server errors
   - Verify retry logic works and fallback to sample data occurs

### 2. Integration Tests
1. Test the entire data flow:
   - From config to data fetching to visualization
   - Verify the graph renders correctly with server data

2. Test the reload functionality:
   - Verify fresh data is fetched when reloading
   - Ensure UI updates properly with new data

### 3. Edge Case Tests
1. Test empty data handling:
   - Server returns empty nodes or links arrays
   - Verify appropriate error messages and UI feedback

2. Test malformed data handling:
   - Server returns data with incorrect structure
   - Verify validation catches issues and provides clear error messages

3. Test large dataset performance:
   - Server returns a very large graph
   - Verify performance is acceptable and no memory issues occur

# Implementation Log

## 1. Updated Configuration
- Added API configuration section in `./js/config.js` with the following settings:
  - `apiBaseUrl`: Base URL for the server (default: 'http://localhost:3000')
  - `apiEndpoint`: Endpoint path to fetch graph data (default: '/api/graph-data')
  - `fetchTimeout`: Timeout for API requests (10 seconds)
  - `retryCount`: Number of retry attempts (3)
  - `useFallbackOnError`: Flag to use fallback sample data on error (true)

## 2. Implemented Data Fetching
- Updated `./js/data.js` to:
  - Rename the static data to `sampleGraphData` for use as fallback
  - Created `fetchGraphData()` function to retrieve data from the server with:
    - Proper error handling and retry mechanism
    - Timeout handling using AbortController
    - Data validation to ensure required properties exist
  - Made `getProcessedData()` asynchronous to support API fetching

## 3. Added Data Validation
- Implemented comprehensive validation in `validateGraphData()` function to check:
  - Required node properties: id, name, type, description, and insights array
  - Required link properties: source, target, and label
  - Unique node IDs
  - Link source/target references to valid node IDs

## 4. Updated UI Components
- Enhanced `./js/uiManager.js` with loading and error handling:
  - Added loading overlay with spinner and customizable message
  - Implemented error toast notifications with auto-hide functionality
  - Exported helper functions: `showLoadingIndicator()`, `hideLoadingIndicator()`, `showErrorMessage()`, `hideErrorMessage()`

## 5. Modified Application Flow for Async Data
- Updated `./js/main.js` to:
  - Make initialization and reload functions async
  - Show loading indicators during data operations
  - Implement proper error handling with user feedback
  - Pass data directly to visualization component to avoid fetching twice

## 6. Updated Visualization Component
- Modified `./js/graphVisualization.js` to:
  - Accept data directly in `loadDataAndRender()` function
  - Make the function async and improve error handling
  - Remove direct dependency on data.js

## 7. Refined Implementation
- Removed fallback sample data functionality:
  - Removed the `sampleGraphData` object from `./js/data.js`
  - Removed fallback logic in `fetchGraphData()` and `getProcessedData()` functions
  - Removed `useFallbackOnError` option from API configuration in `./js/config.js`
  - Modified error handling to propagate errors instead of using fallback data
- This change ensures the application will only use data fetched from the server and will properly handle errors if the data cannot be fetched or is invalid

## 8. Testing Implementation
- Created a browser-based testing framework with the following components:
  - **Shared Test Utilities** (`./tests/test-utils.js`):
    - Test result display and summary functions
    - Navigation menu creation
    - Fetch API mocking utilities
    - Test statistics tracking
  - **Shared Styles** (`./tests/test-styles.css`):
    - Consistent styling for test UI elements
    - Visual indicators for test pass/fail status
  - **Data Validation Tests** (`./tests/data-validation-tests.html`):
    - Tests for valid data structure
    - Tests for missing required node properties
    - Tests for missing required link properties
    - Tests for duplicate node IDs
    - Tests for invalid link references
    - Tests for empty nodes array
    - Tests for missing insights array
  - **Data Fetching Tests** (`./tests/data-fetching-tests.html`):
    - Tests for successful data fetching
    - Tests for network failure handling
    - Tests for retry logic
    - Tests for timeout handling
    - Tests for invalid JSON response handling
    - Tests for non-OK response handling
    - Tests for the `getProcessedData` function

- The testing approach:
  - Uses browser-based testing without Node.js dependencies
  - Mocks the fetch API to test various scenarios
  - Provides visual feedback on test results
  - Organizes tests by functionality (validation vs. fetching)
  - Implements a clean, maintainable structure with shared utilities
  - Ensures comprehensive coverage of edge cases and error conditions