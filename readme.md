# Expandable Diagram Builder

A fast, fully client-side, vanilla JavaScript web application that functions as an interactive, infinite-canvas diagram builder and spatial wiki.

## Features
- **Two Modes:** Edit your workflow, then switch to Display Mode for a clean, drill-down map view.
- **Spatial Hubs (NEW):** Create "Hubs" to group nodes together. Clicking a Hub zooms the camera out to fit the entire Hub contents while dimming the rest of the canvas with a cinematic focus shadow.
- **Infinite Canvas & Smart Camera:** Click and drag to pan around. The camera automatically animates and zooms to center on your active nodes.
- **Fold / Unfold Logic:** Nodes with hidden children have a subtle stacked-card visual and custom accordion buttons allowing users to explore paths visually.
- **Spatial Links:** Link disparate rectangles together using the "Related" section in the side panel.
- **Zero Dependencies:** Written purely in HTML5, CSS3, and modern JS. No React, Vue, or Webpack required.
- **Export / Import:** Save your complete diagrams as simple `.json` files locally.

## How to Run
Because this app relies purely on standard `<script>` tags rather than ES6 modules, **you do not need a web server to run it.** 

Simply clone or download this repository, and double click `index.html` to open it in any modern web browser!

---

## 📖 Deep Dive: App Mechanics & UI/UX Specifications

If you are looking to understand how the application is architected or want to recreate the application, this section covers the complete logic and visual specifications.

### 1. Application State & Data Structure
The entire application is driven by a single, centralized JavaScript state object. It cleanly separates persistent data from volatile UI state.
*   **Persistent Data:**
    *   `nodes`: Array of objects `[ { id, type: 'rectangle'|'hub', x, y, width, height, text, level, details, related:[ids] } ]`
    *   `edges`: Array of objects `[ { source, sourcePort, target, targetPort } ]`
*   **Volatile State:** Current mode (Edit/Display), current Camera Pan (x, y) & Zoom factor, Set of currently expanded node IDs, dynamically calculated Set of visible node IDs, the currently selected node ID, and the `activeHub`.

### 2. Dual-Mode Architecture & The "Hub" Concept
The app enforces a strict boundary between creation and consumption.
*   **Edit Mode:** All nodes and Hubs are visible. Hubs have a green border and can be resized using a bottom-right handle. A spatial-math engine detects if nodes are inside a Hub; dragging a Hub automatically drags all contained nodes with it.
*   **Display Mode (The Drill-Down):** A clean, read-only view. 
    *   **Inactive Hubs:** Appear as solid green blocks with a "Zoom In" icon, hiding their internal nodes to prevent visual clutter.
    *   **Active Hubs:** When clicked, the camera calculates the aspect ratio needed and smoothly zooms out to fit the Hub. The Hub becomes transparent, its inner nodes are revealed, and a massive 30% black `box-shadow` dims everything outside the Hub to create a focus effect.

### 3. Visual Design & The "Stacked" Metaphor
Nodes are represented as rounded rectangles with subtle drop shadows.
*   **Selection:** When a user clicks a node, the background turns light blue (`#e0f2fe`), the border turns deep blue (`#0d6efd`), and the shadow expands.
*   **The "Fold / Unfold" Visual Cue:** If a node has outgoing connections (children), but is currently collapsed, it receives a complex CSS `box-shadow` that looks like two extra cards are stacked beneath it. 
*   **The Accordion Pill Button:** The expand/collapse button is a pill overlapping the bottom border. It uses map/accordion SVG icons paired with explicit text: **"Unfold"** and **"Fold"**. This directionless UI prevents user confusion about where nodes will spawn.

### 4. Canvas & Smart Camera Engine
The diagram lives on an infinite canvas with a dotted radial-gradient background.
*   **Panning & Zooming:** Handled purely via CSS `transform: translate(x, y) scale(z)`. This ensures that the core X/Y coordinates of nodes in the JSON export remain mathematically pure and unaffected by camera movement.
*   **Smart Centering:** When a node is selected, the app calculates the offset required to place it perfectly in the center of the viewport, taking the current zoom scale into account.

### 5. Connection Routing Engine (Bezier Curves)
Lines are drawn on an SVG overlay that sits *under* the nodes but *over* the background.
*   **12-Point Port System:** Nodes have 3 connection anchors on each of their 4 sides (at 25%, 50%, and 75%).
*   **Cubic Bezier Math:** Lines are not straight. The engine calculates Bezier control points that push the line *outward* from the specific side of the port it is attached to, before curving toward the target. 

### 6. The "Spatial Wiki" (Related Nodes Panel)
The app features a fixed-width right-hand side panel containing a rich-text editor (supporting bolding, paragraphs, and lists).
*   **Auto-Reveal Backtracing (The Magic Trick):** In Display Mode, clicking a related link in the side panel does not just center the camera. The app executes a mathematical "Backtrace"—it loops backwards through the `edges` array, explicitly expands all parent folders to reveal the target, selects it, and smoothly pans the camera directly to it in one fluid motion!