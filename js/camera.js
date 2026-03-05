function applyPan() {
    const panContainer = document.getElementById('pan-container');
    const whiteboard = document.getElementById('whiteboard');
    if (panContainer) {
        panContainer.style.transform = `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.zoom})`;
    }
    if (whiteboard) {
        whiteboard.style.backgroundPosition = `${state.pan.x}px ${state.pan.y}px`; 
        whiteboard.style.backgroundSize = `${20 * state.zoom}px ${20 * state.zoom}px`; 
    }
}

function centerOnNode(nodeId, zoomToFit = false) {
    const node = state.nodes.find(n => n.id === nodeId);
    if (!node) return;

    let elWidth = node.type === 'hub' ? node.width : 160;
    let elHeight = node.type === 'hub' ? node.height : 76;

    const whiteboard = document.getElementById('whiteboard');
    
    let targetZoom = state.zoom;
    if (zoomToFit) {
        // Calculate the scale needed to make the Hub fill the screen with padding
        const padding = 120;
        const scaleX = whiteboard.clientWidth / (elWidth + padding);
        const scaleY = whiteboard.clientHeight / (elHeight + padding);
        targetZoom = Math.min(scaleX, scaleY, 2); // Don't zoom in more than 2x
    } else if (!state.activeHub) {
        targetZoom = 1; // Reset zoom if focusing a normal node outside a hub
    }

    // Mathematical center taking zoom into account
    const targetPanX = (whiteboard.clientWidth / 2) - (node.x + elWidth / 2) * targetZoom;
    const targetPanY = (whiteboard.clientHeight / 2) - (node.y + elHeight / 2) * targetZoom;

    let startPanX = state.pan.x;
    let startPanY = state.pan.y;
    let startZoom = state.zoom;
    let startTime = performance.now();

    if (panAnimId) cancelAnimationFrame(panAnimId);

    function anim(currentTime) {
        let progress = (currentTime - startTime) / 300; 
        if (progress > 1) progress = 1;
        const ease = progress * (2 - progress);

        state.pan.x = startPanX + (targetPanX - startPanX) * ease;
        state.pan.y = startPanY + (targetPanY - startPanY) * ease;
        state.zoom = startZoom + (targetZoom - startZoom) * ease;
        applyPan();

        if (progress < 1) {
            panAnimId = requestAnimationFrame(anim);
        } else {
            panAnimId = null;
        }
    }
    panAnimId = requestAnimationFrame(anim);
}

function revealNode(nodeId) {
    if (state.mode === 'EDIT') return; 
    let currentId = nodeId;
    let visited = new Set();
    while(currentId) {
        if(visited.has(currentId)) break;
        visited.add(currentId);
        const edge = state.edges.find(e => e.target === currentId);
        if(edge) {
            state.expandedNodes.add(edge.source);
            currentId = edge.source;
        } else {
            break;
        }
    }
    render(); 
}

function exitHub() {
    const previousHubId = state.activeHub;
    state.activeHub = null;
    if (previousHubId) centerOnNode(previousHubId, false); // Returns zoom to 1
    render();
}