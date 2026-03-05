const PORTS =[
    { id: 't25', x: 0.25, y: 0 }, { id: 't50', x: 0.50, y: 0 }, { id: 't75', x: 0.75, y: 0 }, 
    { id: 'b25', x: 0.25, y: 1 }, { id: 'b50', x: 0.50, y: 1 }, { id: 'b75', x: 0.75, y: 1 }, 
    { id: 'l25', x: 0, y: 0.25 }, { id: 'l50', x: 0, y: 0.50 }, { id: 'l75', x: 0, y: 0.75 }, 
    { id: 'r25', x: 1, y: 0.25 }, { id: 'r50', x: 1, y: 0.50 }, { id: 'r75', x: 1, y: 0.75 }  
];

const iconUnfold = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z"/><path d="M9 4v14"/><path d="M15 6v14"/></svg>`;
const iconFold = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="12" height="16" rx="2" ry="2"/><path d="M10 4v16"/></svg>`;
const iconZoom = `<svg class="hub-zoom-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`;

let state = {
    nodes:[
        { id: 10, type: 'hub', x: 150, y: 220, width: 400, height: 300, text: 'Main Processing Hub', level: 1, details: 'Everything inside here runs automatically.' },
        { id: 1, type: 'rectangle', x: 200, y: 100, text: 'L1 (Start)', level: 1, details: '<b>Overview:</b><br>Start here.', related: [4] },
        { id: 2, type: 'rectangle', x: 200, y: 280, text: 'L2 (Inside)', level: 2, details: 'I am inside the Hub.', related:[] },
        { id: 3, type: 'rectangle', x: 350, y: 400, text: 'L3 (Inside)', level: 3, details: 'Deepest level details.', related:[] },
        { id: 4, type: 'rectangle', x: 600, y: 100, text: 'L1 (External)', level: 1, details: 'External node.', related: [1] }
    ],
    edges:[
        { source: 1, sourcePort: 'b50', target: 10, targetPort: 't50' }, // Start connects to Hub
        { source: 10, sourcePort: 'l50', target: 2, targetPort: 't50' }, // Hub connects to inner L2
        { source: 2, sourcePort: 'b50', target: 3, targetPort: 'l50' },
        { source: 4, sourcePort: 'b50', target: 10, targetPort: 'r25' }
    ],
    mode: 'EDIT', 
    expandedNodes: new Set(),
    connecting: null,
    draggingNode: null,
    draggedChildren: null, // Tracks inner nodes moving alongside a Hub
    dragOffset: { x: 0, y: 0 },
    visibleSet: new Set(),
    mousePos: { x: 0, y: 0 },
    selectedNode: null,
    
    // Zoom & Camera
    pan: { x: 0, y: 0 },
    zoom: 1,
    isPanning: false,
    panStart: { x: 0, y: 0 },
    panStartOffset: { x: 0, y: 0 },
    activeHub: null // Tracks which Hub we are currently focused on
};

let panAnimId = null;