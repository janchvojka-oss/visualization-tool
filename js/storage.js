function exportDiagram() {
    const dataToSave = { nodes: state.nodes, edges: state.edges };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToSave, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "diagram_export.json");
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importDiagram(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (importedData.nodes && Array.isArray(importedData.nodes) && importedData.edges && Array.isArray(importedData.edges)) {
                state.nodes = importedData.nodes;
                state.edges = importedData.edges;
                
                state.expandedNodes.clear();
                state.connecting = null;
                state.draggingNode = null;
                state.selectedNode = null;
                state.activeHub = null;
                state.pan = { x: 0, y: 0 };
                state.zoom = 1;
                
                if(state.mode !== 'EDIT') toggleMode(); 
                
                render();
                renderSidePanel();
                applyPan();
                
                if (state.nodes.length > 0) setTimeout(() => centerOnNode(state.nodes[0].id), 50);
            } else { alert("Invalid file format."); }
        } catch (err) { alert("Error reading file."); }
    };
    reader.readAsText(file);
    event.target.value = '';
}