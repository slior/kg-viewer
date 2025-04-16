# Feature Specification

Implement the ability to select data file or data set.
- The UI should have an input text box, to be located between the `graph-container` and the `ui-panel`. The input should be of type string. 
- The UI should include a label designating this input as the "Data Set".
- The default data set should be configured in the configuration (`./js/config.js`).
- The relevat api configuration in the config file (`./js/config.js`) should be separate into the path to the data, and a default data set.
- The name inserted in the UI should be appended to the configured API route when fetching the data.
- There should be a "Load" button next to the input, upon clicking the button, the code should: 
    - append the input to the API route (from configuration)
    - fetch the data
    - redraw the graph with the new data set.
- This should be a similar functionality to the `reload-button`, only with the new data set.

# Plan

## 1. Configuration Changes
- Modify `config.js` to:
  - Add `defaultDataSet` property to the API configuration
  - Update the API endpoint structure to support data set paths
  - Ensure backward compatibility with existing code

## 2. UI Changes
- Add new container div between `graph-container` and `ui-panel` with:
  - Label "Data Set"
  - Text input field (pre-filled with default data set)
  - "Load" button
- Style the new container to match existing UI

## 3. Data Loading Logic
- Modify existing `fetchGraphData()` in `data.js` to:
  - Accept data set path parameter
  - Validate data set path (no '..' allowed)
  - Construct full URL using `apiBaseUrl + apiEndpoint + dataSetPath`
  - Handle fetch errors appropriately
  - Return processed data

## 4. UI Manager Updates
- Add event listeners for:
  - Load button click
  - Input validation on change
- Integrate with existing error handling system
- Update graph when new data is loaded

## 5. Integration with Existing Flow
- Modify initialization sequence to:
  - Load default data set on startup
  - Update graph visualization with new data
  - Maintain existing reload functionality

# Testing

1. **Configuration Tests**
   - Verify default data set is correctly loaded from config
   - Test API URL construction with different data set paths

2. **UI Tests**
   - Verify input field is pre-filled with default data set
   - Test input validation (reject paths with '..')
   - Verify Load button triggers data fetch
   - Test error message display for invalid inputs

3. **Data Loading Tests**
   - Test successful loading of different data sets
   - Test error handling for:
     - Invalid paths
     - Non-existent data sets
     - Network errors
     - Invalid data format

4. **Integration Tests**
   - Verify default data set loads on startup
   - Test interaction between reload button and data set loading
   - Verify graph updates correctly with new data
   - Test error handling integration

5. **Edge Cases**
   - Empty data set path
   - Very long data set paths
   - Special characters in data set paths
   - Concurrent loading attempts

# Implementation Log

## Changes Made

1. **Configuration Updates**
   - Modified `config.js` to separate API endpoint and default data set
   - Added `defaultDataSet` property to API configuration
   - Updated endpoint structure to support data set paths

2. **Data Loading Logic**
   - Enhanced `fetchGraphData()` to accept data set path parameter
   - Added path validation to prevent directory traversal
   - Updated URL construction to use the new endpoint structure

3. **UI Implementation**
   - Added new `data-set-container` between graph container and UI panel
   - Implemented input field with label and load button
   - Added styles for the new container and its elements
   - Pre-filled input with default data set from configuration

4. **UI Manager Updates**
   - Added event listeners for data set loading
   - Implemented input validation
   - Integrated with existing error handling system
   - Connected load button to data fetching and graph updating

5. **Error Handling**
   - Added validation for directory traversal attempts
   - Integrated with existing error message display system
   - Added loading indicators during data fetch

6. **Code Organization**
   - Moved data loading logic to `main.js` for better separation of concerns
   - Created dedicated `loadData()` function to handle data set loading
   - Updated `reloadGraph()` to use the new `loadData()` function
   - Simplified the reload functionality by reusing data loading logic
