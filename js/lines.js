function getPortCoords(nodeId, portId) {
    const node = state.nodes.find(n => n.id === nodeId);
    if (!node) return null;
    
    // Apply width/height for ALL node types
    const width = node.width || 160;
    const height = node.height || 76;

    const portDef = PORTS.find(p => p.id === portId) || PORTS.find(p => p.id === 't50');
    return {
        x: node.x + (width * portDef.x),
        y: node.y + (height * portDef.y)
    };
}

function getControlPoint(x, y, portId, targetX, targetY) {
    const dist = Math.max(60, Math.abs(targetX - x) * 0.5, Math.abs(targetY - y) * 0.5);
    let cx = x; let cy = y;
    if (portId.startsWith('t')) cy -= dist;      
    else if (portId.startsWith('b')) cy += dist; 
    else if (portId.startsWith('l')) cx -= dist; 
    else if (portId.startsWith('r')) cx += dist; 
    return { x: cx, y: cy };
}

function updateLines() {
    const svg = document.getElementById('svg-canvas');
    const defs = svg.querySelector('defs');
    svg.innerHTML = ''; svg.appendChild(defs);

    state.edges.forEach((edge, index) => {
        if (!state.visibleSet.has(edge.source) || !state.visibleSet.has(edge.target)) return;
        if (state.mode === 'DISPLAY' && !state.expandedNodes.has(edge.source)) return;

        const p1 = getPortCoords(edge.source, edge.sourcePort);
        const p2 = getPortCoords(edge.target, edge.targetPort);

        if (p1 && p2) {
            const cp1 = getControlPoint(p1.x, p1.y, edge.sourcePort, p2.x, p2.y);
            const cp2 = getControlPoint(p2.x, p2.y, edge.targetPort, p1.x, p1.y);

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute('class', 'edge');
            path.setAttribute('d', `M ${p1.x} ${p1.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`);
            path.setAttribute('marker-end', 'url(#arrowhead)');
            
            if (state.mode === 'EDIT') {
                path.onmousedown = (e) => {
                    e.stopPropagation();
                    state.edges.splice(index, 1);
                    render();
                };
                path.innerHTML = `<title>Click to delete connection</title>`;
            }
            svg.appendChild(path);
        }
    });

    if (state.connecting) {
        const p1 = getPortCoords(state.connecting.node, state.connecting.port);
        if (p1) {
            const m = state.mousePos;
            const cp1 = getControlPoint(p1.x, p1.y, state.connecting.port, m.x, m.y);
            const cp2 = { x: m.x, y: m.y };

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute('class', 'connecting-edge');
            path.setAttribute('d', `M ${p1.x} ${p1.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${m.x} ${m.y}`);
            svg.appendChild(path);
        }
    }
}
