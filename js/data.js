// js/data.js

// Sample Knowledge Graph Data
export const graphData = {
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
    // Using 'links' as required by three-forcegraph
    // 'source' and 'target' should reference node 'id's
    links : [
      { source : "node2", target : "node1", label : "belongs to", some_other_property : 5},
      { source : "node1", target : "node3", label : "consumes"},
      { source : "node2", target : "node4", label : "manages"}
    ]
    // Note: Insights are currently embedded in nodes. If they were separate entities,
    // they would need their own structure and linking mechanism.
  };
  
  // Function to preprocess data if needed (e.g., ensure unique IDs)
  export function getProcessedData() {
      // For now, just return the raw data
      // Later, you might add validation or transformation here
      // Ensure nodes have unique IDs
      const nodeIds = new Set();
      graphData.nodes.forEach(node => {
          if (!node.id) {
              console.warn("Node found without id, using name:", node.name);
              node.id = node.name; // Fallback if 'id' is missing
          }
          if (nodeIds.has(node.id)) {
              console.error(`Duplicate node ID found: ${node.id}. Graph may not render correctly.`);
          }
          nodeIds.add(node.id);
      });
  
       // Ensure links reference valid node IDs
       const validNodeIds = new Set(graphData.nodes.map(n => n.id));
       graphData.links.forEach(link => {
           if (!validNodeIds.has(link.source)) {
               console.error(`Link source references non-existent node ID: ${link.source}`);
           }
           if (!validNodeIds.has(link.target)) {
               console.error(`Link target references non-existent node ID: ${link.target}`);
           }
       });
  
      return graphData;
  }