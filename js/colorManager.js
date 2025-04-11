// js/colorManager.js

// Predefined color palette for node types
const colorPalette = [
    '#FF5252', // Red
    '#FF4081', // Pink
    '#E040FB', // Purple
    '#7C4DFF', // Deep Purple
    '#536DFE', // Indigo
    '#448AFF', // Blue
    '#40C4FF', // Light Blue
    '#18FFFF', // Cyan
    '#64FFDA', // Teal
    '#69F0AE', // Green
    '#B2FFD8', // Light Green
    '#EEFF41', // Lime
    '#FFFF00', // Yellow
    '#FFD740', // Amber
    '#FFAB40', // Orange
    '#FF6E40', // Deep Orange
    '#FF8A65', // Red Accent
    '#FF80AB', // Pink Accent
    '#B388FF', // Purple Accent
    '#82B1FF', // Indigo Accent
    '#80D8FF', // Light Blue Accent
    '#84FFFF', // Cyan Accent
    '#A7FFEB', // Teal Accent
    '#B9F6CA', // Green Accent
    '#F4FF81', // Light Green Accent
    '#FFFF8D', // Lime Accent
    '#FFEA80', // Amber Accent
    '#FFD180', // Orange Accent
    '#FF9E80', // Deep Orange Accent
];

// Map to store assigned colors for node types
const typeColorMap = new Map();

// Function to get a color for a node type
export function getColorForType(nodeType) {
    // If we already have a color for this type, return it
    if (typeColorMap.has(nodeType)) {
        return typeColorMap.get(nodeType);
    }
    
    // Otherwise, assign a new color from the palette
    const colorIndex = typeColorMap.size % colorPalette.length;
    const color = colorPalette[colorIndex];
    
    // Store the color for this type
    typeColorMap.set(nodeType, color);
    
    return color;
}

// Function to get all type-color mappings
export function getTypeColorMappings() {
    return Object.fromEntries(typeColorMap);
}

// Function to reset the color assignments
export function resetColorAssignments() {
    typeColorMap.clear();
} 