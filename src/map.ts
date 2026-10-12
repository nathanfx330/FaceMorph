// src/map.ts
import { geoMercator, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { FeatureCollection, Geometry } from 'geojson';
import world from 'world-atlas/countries-50m.json';
import { clampGeo, type GeoPoint } from './geography';

const SVG_NS = 'http://www.w3.org/2000/svg';
const WIDTH = 720;
const HEIGHT = 450;
const projection = geoMercator()
  .center([20, 54])
  .scale(410)
  .translate([WIDTH / 2, HEIGHT / 2]);

function svgElement<K extends keyof SVGElementTagNameMap>(
  tag: K,
  className?: string,
): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG_NS, tag);
  if (className) element.setAttribute('class', className);
  return element;
}

export class EuropeMap {
  readonly element: SVGSVGElement;
  private readonly marker: SVGGElement;
  private dragging = false;
  private currentPoint: GeoPoint;

  constructor(
    host: HTMLElement,
    initialPoint: GeoPoint,
    private readonly onChange: (point: GeoPoint) => void,
  ) {
    this.currentPoint = clampGeo(initialPoint);
    this.element = svgElement('svg', 'europe-map');
    this.element.setAttribute('viewBox', '0 0 ' + WIDTH + ' ' + HEIGHT);
    this.element.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    this.element.setAttribute('role', 'img');
    this.element.setAttribute(
      'aria-label',
      'Map of Europe. Click to choose a coordinate or drag the circular marker. Latitude and longitude sliders below offer an alternative.',
    );
    this.element.setAttribute('tabindex', '0');

    const background = svgElement('rect', 'map-background');
    background.setAttribute('width', String(WIDTH));
    background.setAttribute('height', String(HEIGHT));
    this.element.append(background);

    const graticule = svgElement('g', 'map-graticule');
    const path = geoPath(projection);
    for (const lon of [-10, 0, 10, 20, 30, 40, 50]) {
      const d = path({ type: 'LineString', coordinates: [[lon, 34], [lon, 75]] });
      if (!d) continue;
      const line = svgElement('path');
      line.setAttribute('d', d);
      graticule.append(line);
    }
    for (const lat of [40, 50, 60, 70]) {
      const coordinates = [];
      for (let lon = -20; lon <= 62; lon += 2) coordinates.push([lon, lat]);
      const d = path({ type: 'LineString', coordinates });
      if (!d) continue;
      const line = svgElement('path');
      line.setAttribute('d', d);
      graticule.append(line);
    }
    this.element.append(graticule);

    // Real country boundaries from the published world-atlas TopoJSON package.
    const topology = world as unknown as Parameters<typeof feature>[0];
    const countries = feature(topology, topology.objects.countries) as FeatureCollection<Geometry>;
    const outlines = svgElement('g', 'map-countries');
    for (const country of countries.features) {
      const d = path(country);
      if (!d) continue;
      const shape = svgElement('path');
      shape.setAttribute('d', d);
      outlines.append(shape);
    }
    this.element.append(outlines);

    const crosshair = svgElement('g', 'map-crosshair');
    for (const x of [WIDTH / 2]) {
      const line = svgElement('path');
      line.setAttribute('d', 'M ' + x + ' 0 V ' + HEIGHT);
      crosshair.append(line);
    }
    this.element.append(crosshair);

    this.marker = svgElement('g', 'map-marker');
    const halo = svgElement('circle', 'marker-halo');
    halo.setAttribute('r', '19');
    const ring = svgElement('circle', 'marker-ring');
    ring.setAttribute('r', '9');
    const dot = svgElement('circle', 'marker-dot');
    dot.setAttribute('r', '3.2');
    this.marker.append(halo, ring, dot);
    this.element.append(this.marker);

    host.append(this.element);
    this.setPoint(this.currentPoint);

    this.element.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      this.dragging = true;
      this.element.setPointerCapture(event.pointerId);
      this.pointFromPointer(event);
    });
    this.element.addEventListener('pointermove', (event) => {
      if (this.dragging) this.pointFromPointer(event);
    });
    const endDrag = () => { this.dragging = false; };
    this.element.addEventListener('pointerup', endDrag);
    this.element.addEventListener('pointercancel', endDrag);
    this.element.addEventListener('lostpointercapture', endDrag);

    this.element.addEventListener('keydown', (event) => {
      let longitude = this.currentPoint.longitude;
      let latitude = this.currentPoint.latitude;
      if (event.key === 'ArrowLeft') longitude -= 1;
      else if (event.key === 'ArrowRight') longitude += 1;
      else if (event.key === 'ArrowUp') latitude += 1;
      else if (event.key === 'ArrowDown') latitude -= 1;
      else return;
      event.preventDefault();
      this.onChange(clampGeo({ longitude, latitude }));
    });
  }

  setPoint(point: GeoPoint): void {
    this.currentPoint = clampGeo(point);
    const screen = projection([this.currentPoint.longitude, this.currentPoint.latitude]);
    if (!screen) return;
    this.marker.setAttribute('transform', 'translate(' + screen[0] + ' ' + screen[1] + ')');
  }

  private pointFromPointer(event: PointerEvent): void {
    const rect = this.element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    // The responsive SVG retains the same aspect ratio as its viewBox.
    const x = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const y = ((event.clientY - rect.top) / rect.height) * HEIGHT;
    const coordinate = projection.invert?.([x, y]);
    if (!coordinate || !coordinate.every(Number.isFinite)) return;
    this.onChange(clampGeo({ longitude: coordinate[0], latitude: coordinate[1] }));
  }
}
