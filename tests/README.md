# Graph Data Tests

This directory contains browser-based tests for the graph data functionality. These tests are designed to run directly in a browser without requiring Node.js or any external test runners.

## Test Files

- `data-validation-tests.html`: Tests for data validation functionality
- `data-fetching-tests.html`: Tests for data fetching and error handling

## How to Run Tests

1. Open any of the test HTML files in a web browser
2. The tests will run automatically when the page loads
3. Results will be displayed on the page with a summary at the bottom

## Test Coverage

The tests cover the following aspects of the graph data functionality:

### Data Validation Tests
- Valid data structure
- Missing required node properties
- Missing required link properties
- Duplicate node IDs
- Invalid link references
- Empty nodes array
- Missing insights array

### Data Fetching Tests
- Successful data fetching
- Error handling for network failures
- Retry logic
- Timeout handling
- Invalid JSON response
- Non-OK response
- Data processing

## Implementation Details

These tests use a simple approach to mocking the `fetch` API by temporarily replacing the global `fetch` function with a custom implementation that returns predefined responses. This allows testing various scenarios without requiring a real server.

The tests are designed to be self-contained and don't rely on external testing libraries, making them easy to run in any browser environment. 