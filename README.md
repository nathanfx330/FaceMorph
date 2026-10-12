# FaceMorph

**A geographic, interactive 3D facial geometry explorer.** Built as a static, client-side application with TypeScript, Three.js and Vite.

> **Research integrity:** The initial face is a *synthetic demonstration mesh*. The map and geographic sliders control illustrative geometry parameters only. They do **not** model measured European population averages, ancestry, national facial characteristics, or individual identity. Do not use this version for such inferences.

## First working milestone

- Rotatable, zoomable 3D face with a wireframe option.
- Real world country outlines, focused on Europe, rendered locally from the world-atlas package.
- Click the map, drag the marker, or change longitude/latitude controls to explore a geographic position.
- Two synthetic, continuously interpolated morph axes that demonstrate the technical rendering pipeline.
- Local-only rendering and computation; no accounts, database, app server, telemetry, or runtime API.
- Dedicated research data contract and tests for coordinate/morph calculations.

## Development

Requires Node.js 22 or newer.

```bash
git clone https://github.com/nathanfx330/FaceMorph.git
cd FaceMorph
npm install
npm run dev
```

Open the URL reported by Vite (normally http://127.0.0.1:5173).

```bash
npm run typecheck
npm test
npm run build
npm run preview
```

The production build is in `dist/` and consists of static assets. The deployment workflow can publish it on GitHub Pages once **Settings → Pages → Build and deployment → Source: GitHub Actions** is selected.

## Planned scientific-data integration

A published study's chart or figure is not itself a numerical morph target. FaceMorph needs documented, licensed vertex-wise average geometry (or a comparable registered statistical shape model) before any geographically labeled facial comparison is scientifically justified. Read [Data contract](docs/DATA_CONTRACT.md) and [Architecture](docs/ARCHITECTURE.md).

The illustration changes continuously as you move on the map, but this continuity is a **UI demonstration**, not evidence of a continuous statistical transition between populations.

## License

MIT for our application code. Third-party packages, geographic boundary data and any future research meshes have their own licenses and must be attributed separately.
