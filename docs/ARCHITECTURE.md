# Architecture

FaceMorph is a static Vite application. Source dependencies are bundled into deployable assets. Everything interactive runs locally in a browser.

## Layers

1. `src/geography.ts`: geographic coordinates, explicit bounds and axis normalization.
2. `src/map.ts`: real geographic polygons using world-atlas/TopoJSON and d3-geo projection.
3. `src/face.ts`: a demonstration face and four synthetic GPU morph targets, all with identical topology.
4. `src/main.ts`: controls, accessible interaction, synchronization and presentation.

No server, cookie, location permission or external network request is needed after a deployed static bundle has loaded.

## Extending the model

For measured faces, provide a separately licensed GLB with identical vertex order across targets, plus manifest metadata complying with `docs/DATA_CONTRACT.md`. Keep the render layer independent from the geographic selector. Do not attach population names to illustrative controls or silently substitute synthetic targets when actual data is missing.

A future geographic interpolation strategy must be justified by sampling coverage, statistical confidence and a declared interpolation method. Four broad regional means do not justify a country-by-country or coordinate-by-coordinate predictive model.

## UI and performance

Coordinates remain the authoritative selection state. Map taps, marker dragging and sliders all modify that same state. Geometry uses GPU morph targets so pointer movement does not recreate tens of thousands of vertices every frame. ResizeObserver keeps the WebGL canvas responsive.
