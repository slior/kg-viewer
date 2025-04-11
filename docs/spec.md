I would like to create an application to visualize and browse knowledge bases conveniently.



## Technical Constraints and Boundary Conditions

- It should run in a modern browser. You can assume modern browser.

- It should not require any backend logic. The only interaction with a backend should be a simple retrieval of the knowledge graph data.

  - at a later point we might introduce also querying for specific nodes in the knowledge graph.

- It should run completely in the browser, implemented in Javascript (or Typescript compiled to Javascript). You can assume a modern version of Javascript.

- It should use minimal dependencies. If possible only vanilla javascript, canvas-based visualization and plain CSS.

- Code should be organized and maintainable, with clear separation of concerns.

  - you should decompose the application to separate files, with relevant logical separation.

  - the entry point should be from index.html in the root.

- You can assume keyboard interaction and mouse interaction.

- Interface should be in the English language.



## Features:

- Given a knowledge graph encoded as JSON with: Nodes, Relationships and Insights, the application should draw a 3d visualization of the graph.

  - Nodes should be depicted as balls or boxes

  - relationships should be depicated as lines connecting the nodes.

- Each nodes has at least the following properties: name (unique in the graph), a type.

- Each relationship has at least the following properties: from (name of source node), to (name of target node), and label.

- Insights refer to nodes, by name, and contain a string description.

 - a node and a relationship can have further properties.

- The user should be able to navigate across the knowledge graph with arrows keys or WASD keys. Also, page up/down should allow the user to ascend or descend and get a wider perspective of the graph.

- Each *type* of node should have a distinct color. The pallette of colors should be configurable (a separate variable).

  - there should be a legend below the viewing window.

- when clicking on a node with a mouse, all the information of the node should be displayed below the viewport.

  - the name

  - the type

  - incoming edges (relationships)

  - outgoing edges (relationships)

  - relevant insights

  - any other properties.

- The visualization should be appealing and clear. 





## User Experience

- When given the data of knowledge graph (for now hard coded in a variable in the script), it should be displayed in a windows, as a 3D landscape of balls/boxes, with the names of the nodes on displayed on it. Relationships should be displayed as arrows with their labels on them.

- The user should be able to navigate in 3D using the keyboard.

- clicking on a node or edge should display all its properties in a section below the view port.

- there should be a legend of the node colors.

- underneath the view port there should also be some statistics about the overall graph - number of nodes, number of relationships.

- there should be a button to reload the graph (later it will be connected to a backend to retrieve the data.



Before you start implementing, ask me any clarifying questions you may have.

Only after you get answers to your questions and everything is clear, start with design and implementation.



Think carefully, design the application so the code is clear and organized.

implement the application step by step.

report on any issues you find.

---------------------------------


here are my answers, numbered according to your questions:
1. An example data format:
```json
{
  nodes : [
    {
      name : "node1",
      type: "service",
      insights: [ "insight1", "some other important insight" ]
    },
    {
      name : "node2",
      type: "identity",
      insights: [ "insight21", "some other important insight about node2" ],
     some_other_prop : 74
    }, ...

  ],
  relations : [
    { from : "node2", to : "node1", label : "belongs to", some_other_property : 5}
  ]
}
```

2. choose one shape for now. We might want to have it by node type or some other property, so leave this option open. For now, you can draw it uniformly.

3. Yes, lines connecting nodes should clearly show the direction.
4. labels should be displayed only for a certain distance from the camera. distance should be configurable.
5. no preference for navigation speed. It should be relatively convenient for a human to interact with.
6. the camera should start showing the whole graph, and allow the user to zoom in on a specific node. The user should also be able to zoom out at will.
7. nodes should be layout using a physics based layout, so connected nodes tend to be together.
8. yes, definitely. use `three.js` or any other relevant library. no need to re-create the rendering logic from scratch. the same goes for layout, keyboard control, etc.
9. yes, this structure looks reasonable.
10. yes, it can be a simple variable for now. try to centralize all configuration in one place, so it will be easier to retrieve later from some external source.

let me know if you have further questions.
if everything is clear, please proceed with implementation, step by step.
share your thoughts and progress.
