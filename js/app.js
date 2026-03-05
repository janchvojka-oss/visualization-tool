// --- Spatial Helper ---
function isInside(node, hub) {
    if (node.id === hub.id) return false;
    const nodeWidth = node.width || 160;
    const nodeHeight = node.height || 76;
    const cx = node.x + nodeWidth / 2;
    const cy = node.y + nodeHeight / 2;
    return cx >= hub.x && cx <= hub.x + hub.width && cy >= hub.y && cy <= hub.y + hub.height;
}

// --- General Flow ---
function toggleMode() {
    state.mode = state.mode === 'EDIT' ? 'DISPLAY' : 'EDIT';
    state.connecting = null;
    state.expandedNodes.clear(); 
    state.activeHub = null;
    state.zoom = 1; // reset view
    document.getElementById('mode-btn').innerText = state.mode === 'EDIT' ? 'Switch to Display Mode' : 'Switch to Edit Mode';
    document.getElementById('add-btn').style.display = state.mode === 'EDIT' ? 'inline-block' : 'none';
    document.getElementById('add-hub-btn').style.display = state.mode === 'EDIT' ? 'inline-block' : 'none';
    render();
    renderSidePanel();
    if(state.nodes.length > 0) centerOnNode(state.nodes[0].id);
}

function selectNode(nodeId) {
    state.selectedNode = nodeId;
    document.querySelectorAll('.node').forEach(el => el.classList.remove('selected'));
    if (nodeId) {
        const el = document.getElementById(`node-${nodeId}`);
        if (el) el.classList.add('selected');
    }
    renderSidePanel();
}

function addNode() {
    if (state.mode !== 'EDIT') return;
    const whiteboard = document.getElementById('whiteboard');
    const newNode = {
        id: Date.now(), 
        type: 'rectangle',
        x: (whiteboard.clientWidth / 2) - state.pan.x - 80,
        y: (whiteboard.clientHeight / 2) - state.pan.y - 50,
        width: 160,   // <--- Added specific default width
        height: 76,   // <--- Added specific default height
        text: 'New Bubble', 
        level: 1, 
        details: '<p>Start typing details here...</p>', 
        related:[]   // <--- This is where it cut off!
    };
    state.nodes.push(newNode);
    render(); 
    selectNode(newNode.id); 
    centerOnNode(newNode.id);
}

function addHub() {
    if (state.mode !== 'EDIT') return;
    const whiteboard = document.getElementById('whiteboard');
    const newHub = {
        id: Date.now(), type: 'hub', width: 300, height: 200,
        x: (whiteboard.clientWidth / 2) - state.pan.x - 150,
        y: (whiteboard.clientHeight / 2) - state.pan.y - 100,
        text: 'New Hub Area', level: 1, details: '<p>Hub description...</p>', related:[]
    };
    state.nodes.push(newHub);
    render(); selectNode(newHub.id); centerOnNode(newHub.id);
}

function handlePortClick(e, nodeId, portId) {
    e.stopPropagation(); 
    if (!state.connecting) {
        state.connecting = { node: nodeId, port: portId };
    } else {
        if (state.connecting.node !== nodeId) {
            state.edges.push({
                source: state.connecting.node, sourcePort: state.connecting.port,
                target: nodeId, targetPort: portId
            });
        }
        state.connecting = null;
    }
    render();
}

function renderSidePanel() {
    const panel = document.getElementById('side-panel');
    panel.innerHTML = '';
    if (!state.selectedNode) {
        panel.innerHTML = `<div class="panel-placeholder">Click a rectangle or hub on the whiteboard to view or edit its details.</div>`;
        return;
    }

    const node = state.nodes.find(n => n.id === state.selectedNode);
    if (!node) return;

    const title = document.createElement('h3');
    title.innerText = node.text;
    panel.appendChild(title);

    if (state.mode === 'EDIT') {
        const toolbar = document.createElement('div');
        toolbar.id = 'editor-toolbar';
        const boldBtn = document.createElement('button');
        boldBtn.className = 'editor-btn'; boldBtn.innerHTML = '<b>B</b>';
        boldBtn.onmousedown = (e) => { e.preventDefault(); document.execCommand('bold', false, null); };
        const listBtn = document.createElement('button');
        listBtn.className = 'editor-btn'; listBtn.innerHTML = '• List';
        listBtn.onmousedown = (e) => { e.preventDefault(); document.execCommand('insertUnorderedList', false, null); };
        toolbar.appendChild(boldBtn); toolbar.appendChild(listBtn);
        panel.appendChild(toolbar);

        const editor = document.createElement('div');
        editor.id = 'rich-text-editor'; editor.contentEditable = 'true';
        editor.innerHTML = node.details || '<p></p>';
        editor.oninput = () => { node.details = editor.innerHTML; };
        panel.appendChild(editor);
    } else {
        const display = document.createElement('div');
        display.id = 'details-display';
        display.innerHTML = node.details || '<i style="color:#aaa;">No details provided.</i>';
        panel.appendChild(display);
    }

    const relatedSection = document.createElement('div');
    relatedSection.className = 'related-section';
    const relatedTitle = document.createElement('div');
    relatedTitle.className = 'related-title'; relatedTitle.innerText = 'Related Nodes';
    relatedSection.appendChild(relatedTitle);

    const relatedList = document.createElement('div');
    relatedList.className = 'related-list';
    const relatedIds = node.related ||[];
    
    if (relatedIds.length === 0 && state.mode !== 'EDIT') {
        const emptyMsg = document.createElement('div');
        emptyMsg.style.fontSize = '13px'; emptyMsg.style.color = '#adb5bd';
        emptyMsg.style.fontStyle = 'italic'; emptyMsg.innerText = 'No related nodes attached.';
        relatedList.appendChild(emptyMsg);
    }

    relatedIds.forEach(relId => {
        const targetNode = state.nodes.find(n => n.id === relId);
        if (!targetNode) return; 
        const item = document.createElement('div'); item.className = 'related-item';
        const itemText = document.createElement('div'); itemText.className = 'related-item-text';
        itemText.innerText = '🔗 ' + targetNode.text;
        
        itemText.onclick = () => {
            if (state.mode === 'DISPLAY') revealNode(relId); 
            selectNode(relId); centerOnNode(relId);
        };
        item.appendChild(itemText);

        if (state.mode === 'EDIT') {
            const removeBtn = document.createElement('button');
            removeBtn.className = 'related-remove'; removeBtn.innerHTML = '×';
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                node.related = node.related.filter(id => id !== relId);
                renderSidePanel();
            };
            item.appendChild(removeBtn);
        }
        relatedList.appendChild(item);
    });
    relatedSection.appendChild(relatedList);

    if (state.mode === 'EDIT') {
        const availableNodes = state.nodes.filter(n => n.id !== node.id && !relatedIds.includes(n.id));
        if (availableNodes.length > 0) {
            const addContainer = document.createElement('div'); addContainer.className = 'related-add';
            const select = document.createElement('select'); select.className = 'related-select';
            const defaultOpt = document.createElement('option');
            defaultOpt.value = ''; defaultOpt.innerText = '-- Select link --';
            select.appendChild(defaultOpt);
            
            availableNodes.forEach(n => {
                const opt = document.createElement('option');
                opt.value = n.id; opt.innerText = n.text; select.appendChild(opt);
            });
            
            const addBtn = document.createElement('button');
            addBtn.className = 'editor-btn'; addBtn.innerText = 'Add';
            addBtn.onclick = () => {
                if (select.value) {
                    if (!node.related) node.related =[];
                    node.related.push(Number(select.value));
                    renderSidePanel();
                }
            };
            addContainer.appendChild(select); addContainer.appendChild(addBtn);
            relatedSection.appendChild(addContainer);
        }
    }
    panel.appendChild(relatedSection);
}

function render() {
    const container = document.getElementById('nodes-container');
    container.innerHTML = '';
    state.visibleSet.clear();

    // Show/Hide the Exit Hub floating button
    document.getElementById('exit-hub-btn').style.display = (state.mode === 'DISPLAY' && state.activeHub) ? 'block' : 'none';

    // Figure out which hub every node lives inside
    let hubs = state.nodes.filter(n => n.type === 'hub');
    let nodeToHub = {};
    state.nodes.forEach(n => {
        if (n.type !== 'hub') {
            let containingHubs = hubs.filter(h => isInside(n, h));
            if (containingHubs.length > 0) {
                // If nested, associate with the smallest containing hub
                containingHubs.sort((a,b) => (a.width*a.height) - (b.width*b.height));
                nodeToHub[n.id] = containingHubs[0].id;
            }
        }
    });

    // Determine Base Visibility based on Expansion hierarchy
    let baseVisible = new Set();
    if (state.mode === 'DISPLAY') {
        let queue = state.nodes.filter(n => n.level === 1);
        queue.forEach(n => baseVisible.add(n.id));
        let i = 0;
        while(i < queue.length) {
            let current = queue[i]; i++;
            if (state.expandedNodes.has(current.id)) {
                let childrenIds = state.edges.filter(e => e.source === current.id).map(e => e.target);
                childrenIds.forEach(cid => {
                    if (!baseVisible.has(cid)) {
                        baseVisible.add(cid);
                        let childNode = state.nodes.find(n => n.id === cid);
                        if (childNode) queue.push(childNode);
                    }
                });
            }
        }
    } else {
        state.nodes.forEach(n => baseVisible.add(n.id)); 
    }

    // Apply Hub Filter Rules
    baseVisible.forEach(id => {
        const hubId = nodeToHub[id];
        // If node is inside a hub, it is ONLY visible if that Hub is the Active Hub!
        if (!hubId || state.activeHub === hubId || state.mode === 'EDIT') {
            state.visibleSet.add(id);
        }
    });

    state.nodes.forEach(node => {
        if (!state.visibleSet.has(node.id)) return;

        const el = document.createElement('div');
        el.className = 'node';
        if (node.type === 'hub') el.classList.add('hub');
        
        if (state.mode === 'DISPLAY') el.classList.add('display-mode');
        if (state.selectedNode === node.id) el.classList.add('selected');
        
        el.style.left = node.x + 'px'; el.style.top = node.y + 'px';
        if (node.type === 'hub') {
            el.style.width = node.width + 'px';
            el.style.height = node.height + 'px';
        }
        el.id = `node-${node.id}`;

        // Tag inner nodes so they sit on top of the active hub shadow
        if (state.mode === 'DISPLAY' && state.activeHub && nodeToHub[node.id] === state.activeHub) {
            el.classList.add('inner-node');
        }

        el.onmousedown = (e) => {
            e.stopPropagation(); 
            
            if (state.selectedNode !== node.id) {
                selectNode(node.id);
                if (node.type !== 'hub') centerOnNode(node.id); 
            }
            
            if (state.mode === 'EDIT' && !['INPUT', 'BUTTON'].includes(e.target.tagName)) {
                state.draggingNode = node;
                // If dragging a hub, grab its children too
                if (node.type === 'hub') {
                    state.draggedChildren = state.nodes.filter(n => n.id !== node.id && isInside(n, node));
                    state.draggedChildrenOffsets = state.draggedChildren.map(child => ({
                        id: child.id, dx: child.x - node.x, dy: child.y - node.y
                    }));
                }
                const rect = el.getBoundingClientRect();
                // Taking zoom into account for offset grabbing
                state.dragOffset = { x: (e.clientX - rect.left)/state.zoom, y: (e.clientY - rect.top)/state.zoom };
                if (panAnimId) cancelAnimationFrame(panAnimId); 
            }
        };

        if (state.mode === 'EDIT') {
            const titleInput = document.createElement('input');
            titleInput.className = node.type === 'hub' ? 'title hub-title' : 'title'; 
            titleInput.value = node.text;
            titleInput.onmousedown = (e) => { selectNode(node.id); e.stopPropagation(); };
            titleInput.oninput = (e) => { 
                node.text = e.target.value;
                if (state.selectedNode === node.id) renderSidePanel(); 
            };
            el.appendChild(titleInput);

            const controlsWrapper = document.createElement('div');
            if (node.type === 'hub') controlsWrapper.className = 'hub-controls';

            const levelContainer = document.createElement('div');
            levelContainer.className = 'level-container'; levelContainer.innerText = 'Level: ';
            const levelInput = document.createElement('input');
            levelInput.type = 'number'; levelInput.min = 1; levelInput.value = node.level;
            levelInput.onmousedown = (e) => { selectNode(node.id); e.stopPropagation(); };
            levelInput.oninput = (e) => { node.level = parseInt(e.target.value) || 1; };
            levelContainer.appendChild(levelInput);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn'; deleteBtn.innerText = '🗑️';
            deleteBtn.onmousedown = (e) => e.stopPropagation();
            deleteBtn.onclick = () => {
                state.nodes = state.nodes.filter(n => n.id !== node.id);
                state.nodes.forEach(n => {
                    if (n.related) n.related = n.related.filter(relId => relId !== node.id);
                });
                state.edges = state.edges.filter(e => e.source !== node.id && e.target !== node.id);
                if(state.connecting && state.connecting.node === node.id) state.connecting = null;
                if(state.selectedNode === node.id) selectNode(null); 
                render();
            };

            controlsWrapper.appendChild(levelContainer);
            controlsWrapper.appendChild(deleteBtn);
            el.appendChild(controlsWrapper);

            // Resize handle for hubs
            if (node.type === 'hub') {
                const resizeHandle = document.createElement('div');
                resizeHandle.className = 'resize-handle';
                resizeHandle.onmousedown = (e) => {
                    e.stopPropagation();
                    state.resizingNode = node;
                    state.resizeStart = { w: node.width, h: node.height, x: e.clientX, y: e.clientY };
                };
                el.appendChild(resizeHandle);
            }

            PORTS.forEach(p => {
                const portEl = document.createElement('div'); portEl.className = 'port';
                if (state.connecting && state.connecting.node === node.id && state.connecting.port === p.id) portEl.classList.add('active');
                portEl.style.left = (p.x * 100) + '%'; portEl.style.top = (p.y * 100) + '%';
                portEl.onmousedown = (e) => handlePortClick(e, node.id, p.id);
                el.appendChild(portEl);
            });

        } else {
            // DISPLAY MODE
            const titleDiv = document.createElement('div');
            titleDiv.className = node.type === 'hub' ? 'display-title hub-title' : 'display-title'; 
            titleDiv.innerText = node.text;
            el.appendChild(titleDiv);

            if (node.type === 'hub') {
                if (state.activeHub !== node.id) {
                    el.classList.add('inactive');
                    const zoomIcon = document.createElement('div');
                    zoomIcon.innerHTML = iconZoom;
                    el.appendChild(zoomIcon);
                    el.onclick = (e) => {
                        e.stopPropagation();
                        state.activeHub = node.id;
                        centerOnNode(node.id, true); // True means zoom out to fit the hub perfectly
                        render();
                    };
                } else {
                    el.classList.add('active');
                }
            } 
            else {
                // Regular Rectangle Logic
                const hasChildren = state.edges.some(e => e.source === node.id);
                if (hasChildren) {
                    const isExpanded = state.expandedNodes.has(node.id);
                    if (!isExpanded) el.classList.add('stacked');

                    const expandBtn = document.createElement('button');
                    
                    if (isExpanded) {
                        expandBtn.className = 'expand-btn expanded'; 
                        expandBtn.innerHTML = `${iconFold} Fold`;
                    } else {
                        expandBtn.className = 'expand-btn collapsed'; 
                        expandBtn.innerHTML = `${iconUnfold} Unfold`;
                    }
                    
                    expandBtn.onmousedown = (e) => { e.stopPropagation(); };
                    expandBtn.onclick = (e) => {
                        e.stopPropagation(); 
                        if (state.selectedNode !== node.id) selectNode(node.id);
                        if (isExpanded) state.expandedNodes.delete(node.id);
                        else state.expandedNodes.add(node.id);
                        render();
                        centerOnNode(node.id); 
                    };
                    el.appendChild(expandBtn);

                    el.ondblclick = (e) => {
                        e.stopPropagation();
                        if (isExpanded) state.expandedNodes.delete(node.id);
                        else state.expandedNodes.add(node.id);
                        render();
                        centerOnNode(node.id);
                    };
                }
            }
        }
        container.appendChild(el);
    });

    requestAnimationFrame(updateLines);
}

// Global Mouse Listeners
document.getElementById('whiteboard').addEventListener('mousedown', (e) => {
    if (['whiteboard', 'pan-container', 'svg-canvas'].includes(e.target.id) || e.target.tagName === 'svg') {
        if (state.connecting) { state.connecting = null; render(); }
        if (state.selectedNode !== null) selectNode(null);
        
        state.isPanning = true;
        state.panStart = { x: e.clientX, y: e.clientY };
        state.panStartOffset = { x: state.pan.x, y: state.pan.y };
        if (panAnimId) cancelAnimationFrame(panAnimId);
    }
});

document.addEventListener('mousemove', (e) => {
    if (state.resizingNode) {
        const dx = (e.clientX - state.resizeStart.x) / state.zoom;
        const dy = (e.clientY - state.resizeStart.y) / state.zoom;
        state.resizingNode.width = Math.max(150, state.resizeStart.w + dx);
        state.resizingNode.height = Math.max(100, state.resizeStart.h + dy);
        render(); // Force DOM update live
        return;
    }

    if (state.isPanning) {
        const dx = e.clientX - state.panStart.x;
        const dy = e.clientY - state.panStart.y;
        state.pan.x = state.panStartOffset.x + dx;
        state.pan.y = state.panStartOffset.y + dy;
        applyPan();
        return;
    }

    const whiteboardRect = document.getElementById('whiteboard').getBoundingClientRect();
    state.mousePos = { 
        x: (e.clientX - whiteboardRect.left - state.pan.x) / state.zoom, 
        y: (e.clientY - whiteboardRect.top - state.pan.y) / state.zoom 
    };
    
    if (state.connecting) updateLines(); 

    if (state.draggingNode) {
        let newX = state.mousePos.x - state.dragOffset.x;
        let newY = state.mousePos.y - state.dragOffset.y;

        state.draggingNode.x = newX; state.draggingNode.y = newY;

        // Move children if a Hub is being dragged
        if (state.draggedChildren) {
            state.draggedChildrenOffsets.forEach(offset => {
                const child = state.nodes.find(n => n.id === offset.id);
                child.x = newX + offset.dx;
                child.y = newY + offset.dy;
                const el = document.getElementById(`node-${child.id}`);
                if (el) { el.style.left = child.x + 'px'; el.style.top = child.y + 'px'; }
            });
        }

        const el = document.getElementById(`node-${state.draggingNode.id}`);
        if (el) { el.style.left = newX + 'px'; el.style.top = newY + 'px'; }
        updateLines(); 
    }
});

document.addEventListener('mouseup', () => {
    if (state.draggingNode) {
        state.draggingNode = null;
        state.draggedChildren = null;
    }
    if (state.resizingNode) state.resizingNode = null;
    if (state.isPanning) state.isPanning = false;
});

// Initialize App & Center Camera on first load
render();
renderSidePanel();
applyPan();
if (state.nodes.length > 0) {
    setTimeout(() => centerOnNode(state.nodes[0].id), 50); 
}
