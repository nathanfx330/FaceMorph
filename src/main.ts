// src/main.ts
import './styles.css';
import { FaceViewer } from './face';
import { EuropeMap } from './map';
import {
  clampGeo, EUROPE_BOUNDS, formatCoordinate, INITIAL_POINT,
  pointToAxes, type GeoPoint,
} from './geography';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('FaceMorph root element not found');

app.innerHTML = `
  <header class="site-header">
    <div class="brand">
      <div class="brand-mark" aria-hidden="true">F<span>∕</span>M</div>
      <div>
        <div class="brand-title">FaceMorph</div>
        <div class="brand-subtitle">Geographic facial geometry explorer</div>
      </div>
    </div>
    <a class="source-link" href="https://github.com/nathanfx330/FaceMorph" target="_blank" rel="noopener noreferrer">View source ↗</a>
  </header>

  <main>
    <div class="intro">
      <div>
        <p class="eyebrow">EXPERIMENTAL INTERACTIVE ATLAS · VERSION 0.1</p>
        <h1>Explore shape in three dimensions.</h1>
        <p class="lede">Move across Europe and watch a continuous facial mesh deformation. Rotate the sculpture to inspect it from any angle.</p>
      </div>
      <div class="disclosure" role="note">
        <span class="disclosure-title">Illustrative geometry</span>
        <p>These morph targets are synthetic. They are not derived from European facial measurements and do not describe regional populations.</p>
      </div>
    </div>

    <div class="workspace">
      <section class="viewer-panel" aria-labelledby="face-heading">
        <div class="panel-header">
          <div>
            <p class="panel-index">01 / GEOMETRY</p>
            <h2 id="face-heading">3D facial model</h2>
          </div>
          <span class="technical-label">4 morph targets</span>
        </div>
        <div id="face-viewport" class="face-viewport"></div>
        <div class="viewer-toolbar">
          <span class="helper-text">Drag to rotate · Scroll to zoom</span>
          <div class="toolbar-actions">
            <button id="wireframe-toggle" type="button" aria-pressed="false">Wireframe</button>
            <button id="camera-reset" type="button">Reset view</button>
          </div>
        </div>
      </section>

      <section class="map-panel" aria-labelledby="map-heading">
        <div class="panel-header">
          <div>
            <p class="panel-index">02 / GEOGRAPHY</p>
            <h2 id="map-heading">Choose a position</h2>
          </div>
          <span class="technical-label">Europe</span>
        </div>
        <div class="map-frame">
          <div class="map-label">GEOGRAPHIC NAVIGATOR</div>
          <div id="map-viewport"></div>
        </div>
        <div class="location-readout" aria-live="polite">
          <span class="readout-title">Selected coordinates</span>
          <strong id="location-text">13.0° E / 52.0° N</strong>
        </div>
        <div class="control-group">
          <label for="longitude">
            <span>West / East <span class="control-sublabel">(longitude)</span></span>
            <output id="longitude-value" for="longitude">13.0° E</output>
          </label>
          <input id="longitude" type="range" min="-13" max="55" step="0.1" value="13" />
          <div class="range-ends"><span>13° W</span><span>55° E</span></div>
        </div>
        <div class="control-group">
          <label for="latitude">
            <span>South / North <span class="control-sublabel">(latitude)</span></span>
            <output id="latitude-value" for="latitude">52.0° N</output>
          </label>
          <input id="latitude" type="range" min="35" max="72" step="0.1" value="52" />
          <div class="range-ends"><span>35° N</span><span>72° N</span></div>
        </div>
        <button id="location-reset" class="reset-location" type="button">Reset position to 13° E, 52° N</button>
      </section>
    </div>

    <section class="method-note" aria-labelledby="method-heading">
      <div class="method-icon" aria-hidden="true">i</div>
      <div>
        <h2 id="method-heading">What this prototype demonstrates</h2>
        <p>The map is based on real geographic outlines, and the face uses four continuous GPU morph targets with shared mesh topology. Their association is <strong>only a demonstration of the interaction</strong>. Any measured regional variation will require licensed 3D research data, population sampling details, and an appropriate statistical model. The application makes no ancestry or identity predictions.</p>
      </div>
    </section>
  </main>
  <footer>FaceMorph is open source · Built to work as a static, browser-only application</footer>
`;

function required<T extends HTMLElement>(selector: string): T {
  const element = app!.querySelector<T>(selector);
  if (!element) throw new Error('Required element missing: ' + selector);
  return element;
}

const longitudeSlider = required<HTMLInputElement>('#longitude');
const latitudeSlider = required<HTMLInputElement>('#latitude');
const longitudeOutput = required<HTMLOutputElement>('#longitude-value');
const latitudeOutput = required<HTMLOutputElement>('#latitude-value');
const locationText = required<HTMLElement>('#location-text');
const wireframeButton = required<HTMLButtonElement>('#wireframe-toggle');

let selected: GeoPoint = INITIAL_POINT;

let viewer: FaceViewer | undefined;
try {
  viewer = new FaceViewer(required<HTMLElement>('#face-viewport'));
} catch (error) {
  required<HTMLElement>('#face-viewport').textContent =
    'WebGL is unavailable in this browser. Geographic controls remain usable.';
  console.error('3D rendering unavailable:', error);
}

const map = new EuropeMap(
  required<HTMLElement>('#map-viewport'),
  selected,
  (point) => updateSelection(point),
);

function updateSelection(point: GeoPoint): void {
  selected = clampGeo(point);
  longitudeSlider.value = selected.longitude.toFixed(1);
  latitudeSlider.value = selected.latitude.toFixed(1);

  longitudeOutput.value = formatCoordinate(selected.longitude, 'longitude');
  latitudeOutput.value = formatCoordinate(selected.latitude, 'latitude');
  locationText.textContent =
    formatCoordinate(selected.longitude, 'longitude') +
    ' / ' + formatCoordinate(selected.latitude, 'latitude');

  map.setPoint(selected);
  if (viewer) viewer.setAxes(pointToAxes(selected));
}

longitudeSlider.min = String(EUROPE_BOUNDS.minLongitude);
longitudeSlider.max = String(EUROPE_BOUNDS.maxLongitude);
latitudeSlider.min = String(EUROPE_BOUNDS.minLatitude);
latitudeSlider.max = String(EUROPE_BOUNDS.maxLatitude);

longitudeSlider.addEventListener('input', () => {
  updateSelection({ longitude: Number(longitudeSlider.value), latitude: selected.latitude });
});
latitudeSlider.addEventListener('input', () => {
  updateSelection({ longitude: selected.longitude, latitude: Number(latitudeSlider.value) });
});

wireframeButton.addEventListener('click', () => {
  if (!viewer) return;
  const enabled = wireframeButton.getAttribute('aria-pressed') !== 'true';
  wireframeButton.setAttribute('aria-pressed', String(enabled));
  viewer.setWireframe(enabled);
});
required<HTMLButtonElement>('#camera-reset').addEventListener('click', () => {
  viewer?.resetCamera();
});
required<HTMLButtonElement>('#location-reset').addEventListener('click', () => {
  updateSelection(INITIAL_POINT);
});

if (!viewer) {
  wireframeButton.disabled = true;
  required<HTMLButtonElement>('#camera-reset').disabled = true;
}
updateSelection(INITIAL_POINT);
