# Knowledge Graph Viewer

A web-based visualization tool for exploring and interacting with knowledge graphs in 3D.

## Features

- 3D visualization of knowledge graphs using Three.js and 3d-force-graph
- Interactive node and link exploration
- Customizable visualization settings
- Supports various knowledge graph data formats

## Getting Started

### Prerequisites

This is a browser-based application that requires no installation. You'll need:

- A modern web browser (Chrome, Firefox, Safari, Edge)
- A local web server for development (e.g., Python's built-in HTTP server)

### Running Locally

To run the application locally:

1. Clone this repository
   ```bash
   git clone <repository-url>
   cd kg-viewer
   ```

2. Start a local web server:
   ```bash
   # Using Python 3
   python -m http.server 8001
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8001
   ```

## Documentation

The following documentation files provide detailed information about the application's architecture and behavior:

- [Application Initialization Sequence](docs/init_sequence.md) - showing the initialization flow of the application.
- [Legend Checkbox Click Flow](docs/legend_click_flow.md) - showing the flow when a user clicks on a checkbox in the legend.

## Project Structure

- `index.html` - Main entry point of the application
- `js/` - JavaScript files for the application
- `css/` - Stylesheets
- `docs/` - Documentation including change logs

## License

This project is licensed under the MIT License. 