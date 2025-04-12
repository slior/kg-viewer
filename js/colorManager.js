// js/colorManager.js

/**
 * Predefined color palette for node types
 * Each color is a Material Design color with its name in comments
 * @type {string[]}
 */
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

/** @type {Map<string, string>} Map to store assigned colors for node types */
const typeColorMap = new Map();

/**
 * Gets a color for a node type, assigning a new color if the type hasn't been seen before
 * @param {string} nodeType - The type of node to get a color for
 * @returns {string} The hex color code for the node type
 */
export function getColorForType(nodeType) {
    if (typeColorMap.has(nodeType)) {
        return typeColorMap.get(nodeType);
    }
    
    const colorIndex = typeColorMap.size % colorPalette.length;
    const color = colorPalette[colorIndex];
    typeColorMap.set(nodeType, color);
    
    return color;
}

/**
 * Gets all current type-color mappings
 * @returns {Object.<string, string>} Object mapping node types to their assigned colors
 */
export function getTypeColorMappings() {
    return Object.fromEntries(typeColorMap);
}

/**
 * Resets all color assignments, clearing the type-color map
 */
export function resetColorAssignments() {
    typeColorMap.clear();
} 