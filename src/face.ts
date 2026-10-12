// src/face.ts
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Axes } from './geography';
import { illustrativeWeights } from './geography';

type Sculpt = Readonly<{
  noseWidth: number;
  jawWidth: number;
  faceLength: number;
  cheekVolume: number;
}>;

const NEUTRAL: Sculpt = { noseWidth: 0, jawWidth: 0, faceLength: 0, cheekVolume: 0 };
const TARGETS: Sculpt[] = [
  { noseWidth: 0.8, jawWidth: -0.65, faceLength: 0, cheekVolume: 0 },
  { noseWidth: -0.7, jawWidth: 0.7, faceLength: 0, cheekVolume: 0 },
  { noseWidth: 0, jawWidth: 0, faceLength: 0.85, cheekVolume: -0.55 },
  { noseWidth: 0, jawWidth: 0, faceLength: -0.8, cheekVolume: 0.75 },
];

function gaussian(value: number, center: number, width: number): number {
  const t = (value - center) / width;
  return Math.exp(-t * t);
}

function smoothstep(min: number, max: number, value: number): number {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return t * t * (3 - 2 * t);
}

function sculptSurface(source: Float32Array, params: Sculpt): Float32Array {
  const out = new Float32Array(source.length);
  for (let i = 0; i < source.length; i += 3) {
    const x = source[i];
    const y = source[i + 1];
    const z = source[i + 2];

    const jaw = smoothstep(0.12, 0.97, -y);
    const temple = gaussian(y, 0.38, 0.42);
    const front = smoothstep(0.06, 0.55, z);
    const leftRightCheek = gaussian(Math.abs(x), 0.54, 0.25);
    const cheek = leftRightCheek * gaussian(y, -0.02, 0.38);

    let xx = x * (0.96 + 0.055 * temple - 0.22 * jaw + 0.16 * params.jawWidth * jaw);
    const yy = y * (1.17 + 0.10 * params.faceLength);

    let zz = z * (0.87 - 0.027 * params.faceLength);
    const noseSize = Math.max(0.11, 0.155 + 0.045 * params.noseWidth);
    const bridge = gaussian(x, 0, noseSize) * gaussian(y, 0.02, 0.37);
    const tip = gaussian(x, 0, noseSize * 1.13) * gaussian(y, -0.22, 0.14);
    const nostrils = gaussian(Math.abs(x), 0.13 + 0.04 * params.noseWidth, 0.09)
      * gaussian(y, -0.24, 0.10);
    const eyeSockets = gaussian(Math.abs(x), 0.34, 0.16) * gaussian(y, 0.25, 0.15);
    const eyebrow = gaussian(Math.abs(x), 0.35, 0.20) * gaussian(y, 0.42, 0.08);
    const lips = gaussian(x, 0, 0.36) * gaussian(y, -0.44, 0.055);
    const chin = gaussian(x, 0, 0.32) * gaussian(y, -0.70, 0.21);

    zz += front * (
      0.23 * bridge +
      0.15 * tip +
      0.042 * nostrils -
      0.09 * eyeSockets +
      0.045 * eyebrow +
      0.035 * lips +
      0.060 * chin +
      (0.08 + 0.035 * params.cheekVolume) * cheek
    );

    xx *= 1 + 0.045 * params.cheekVolume * cheek;

    out[i] = xx;
    out[i + 1] = yy;
    out[i + 2] = zz;
  }
  return out;
}

function createMorphGeometry(): THREE.BufferGeometry {
  // All four targets are derived from the SAME template and vertex order.
  const geometry = new THREE.SphereGeometry(1, 112, 88);
  const template = Float32Array.from(geometry.getAttribute('position').array);
  const neutralPositions = sculptSurface(template, NEUTRAL);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(neutralPositions, 3));
  geometry.computeVertexNormals();
  const neutralNormals = Float32Array.from(geometry.getAttribute('normal').array);

  const relativePositions: THREE.BufferAttribute[] = [];
  const relativeNormals: THREE.BufferAttribute[] = [];

  for (const target of TARGETS) {
    const positions = sculptSurface(template, target);
    const offsets = new Float32Array(positions.length);
    for (let i = 0; i < positions.length; i++) offsets[i] = positions[i] - neutralPositions[i];
    relativePositions.push(new THREE.Float32BufferAttribute(offsets, 3));

    const targetGeometry = geometry.clone();
    targetGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    targetGeometry.computeVertexNormals();
    const normals = targetGeometry.getAttribute('normal').array;
    const normalOffsets = new Float32Array(normals.length);
    for (let i = 0; i < normals.length; i++) normalOffsets[i] = normals[i] - neutralNormals[i];
    relativeNormals.push(new THREE.Float32BufferAttribute(normalOffsets, 3));
    targetGeometry.dispose();
  }

  geometry.morphTargetsRelative = true;
  geometry.morphAttributes.position = relativePositions;
  geometry.morphAttributes.normal = relativeNormals;
  geometry.computeBoundingSphere();
  return geometry;
}

export class FaceViewer {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly controls: OrbitControls;
  private readonly model: THREE.Mesh;
  private readonly faceMaterial: THREE.MeshStandardMaterial;
  private readonly observer: ResizeObserver;
  private raf = 0;

  constructor(private readonly host: HTMLElement) {
    this.scene.background = new THREE.Color('#192124');
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.domElement.setAttribute('aria-label', 'Three dimensional illustrative head. Drag to rotate, scroll to zoom.');
    this.renderer.domElement.setAttribute('role', 'img');
    this.host.append(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    this.camera.position.set(0, 0.08, 4.55);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.minDistance = 2.6;
    this.controls.maxDistance = 7.5;
    this.controls.target.set(0, 0.03, 0);
    this.controls.update();

    this.faceMaterial = new THREE.MeshStandardMaterial({
      color: '#cfbba0',
      roughness: 0.83,
      metalness: 0.04,
      side: THREE.FrontSide,
    });
    this.model = new THREE.Mesh(createMorphGeometry(), this.faceMaterial);
    this.model.rotation.y = -0.17;
    this.scene.add(this.model);

    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.42, 0.53, 52),
      this.faceMaterial,
    );
    neck.position.set(0, -1.30, -0.04);
    this.scene.add(neck);

    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 24), this.faceMaterial);
      ear.position.set(side * 0.83, -0.07, -0.055);
      ear.scale.set(0.14, 0.255, 0.135);
      this.scene.add(ear);
    }

    const key = new THREE.DirectionalLight('#fff0de', 3.0);
    key.position.set(-3, 4, 5);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight('#adc4d0', 1.4);
    fill.position.set(3, 1, 2);
    this.scene.add(fill);
    const back = new THREE.DirectionalLight('#efcb9f', 2.0);
    back.position.set(1, -2, -4);
    this.scene.add(back);
    this.scene.add(new THREE.AmbientLight('#fff5e6', 0.65));

    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(this.host);
    this.resize();
    this.animate();
  }

  setAxes(axes: Axes): void {
    const weights = illustrativeWeights(axes);
    const influences = this.model.morphTargetInfluences;
    if (!influences) return;
    weights.forEach((weight, i) => { influences[i] = weight; });
  }

  setWireframe(enabled: boolean): void {
    this.faceMaterial.wireframe = enabled;
  }

  resetCamera(): void {
    this.camera.position.set(0, 0.08, 4.55);
    this.controls.target.set(0, 0.03, 0);
    this.controls.update();
  }

  private resize(): void {
    const width = Math.max(1, this.host.clientWidth);
    const height = Math.max(1, this.host.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  private animate = (): void => {
    this.raf = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  dispose(): void {
    cancelAnimationFrame(this.raf);
    this.observer.disconnect();
    this.controls.dispose();
    this.model.geometry.dispose();
    this.faceMaterial.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
