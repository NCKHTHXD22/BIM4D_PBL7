import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Sky } from "three/addons/objects/Sky.js";
import { GROUPS, PLASTER, SCENES, SCENE_SEC } from "./schedule.js";

const REC = new URLSearchParams(location.search).has("record");
if (REC) document.body.classList.add("rec");
const DAY = 864e5, D = s => new Date(s + "T00:00:00").getTime();
const fmt = t => { const d = new Date(t); return String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0") + "." + d.getFullYear(); };
const T0 = D("2027-02-15"), T1 = D("2027-12-13");

// --- renderer, scene
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(REC ? 1 : Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.55;
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.5, 4000);
const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true;
const sky = new Sky(); sky.scale.setScalar(4000); scene.add(sky);
const su = sky.material.uniforms; su.turbidity.value = 6; su.rayleigh.value = 1.6; su.mieCoefficient.value = 0.004; su.mieDirectionalG.value = 0.8;
const sunDir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(50), THREE.MathUtils.degToRad(210));
su.sunPosition.value.copy(sunDir);
scene.add(new THREE.HemisphereLight(0xdfefff, 0x8a7a60, 1.1));
const sun = new THREE.DirectionalLight(0xfff2dd, 3.2); sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096); Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, near: 1, far: 400 }); sun.shadow.bias = -0.0004;
scene.add(sun, sun.target);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.MeshStandardMaterial({ color: 0xcdb892, roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.position.y = -1.0; ground.receiveShadow = true; scene.add(ground);
scene.fog = new THREE.Fog(0xb9d3ea, 250, 1400);

// --- vat lieu
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, metalness: 0, flatShading: true, ...o });
const MAT = {
  concrete: M(0xc9c6c0, { roughness: 0.95 }),
  rebar: M(0x9c3d1c, { roughness: 0.5, metalness: 0.6 }),
  formwork: M(0xc8913f, { roughness: 0.8 }),
  scaffold: M(0x3aa35c, { transparent: true, opacity: 0.55, roughness: 0.7, depthWrite: false, side: THREE.DoubleSide }),
  brick: M(0xb5522e, { roughness: 0.95 }),
  ceiling: M(0xf2f2ee), finish: M(0xd9d4c8, { roughness: 0.6 }) };
const BRICK = new THREE.Color(0xb5522e), PLAST = new THREE.Color(0xefe9df);

// --- tai mo hinh
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const items = []; let loaded = 0; const lp = document.getElementById("lp");
const box = new THREE.Box3();
await Promise.all(GROUPS.map(g => new Promise(res => loader.load("./models/" + g.f + ".glb", gl => {
  const m = gl.scene; m.rotation.x = -Math.PI / 2; m.scale.setScalar(0.3048);
  m.traverse(o => { if (o.isMesh) { o.castShadow = g.style !== "scaffold"; o.receiveShadow = true; if (g.style !== "orig") o.material = MAT[g.style]; else if (o.material) { for (const mm of [].concat(o.material)) { mm.side = THREE.DoubleSide; mm.flatShading = true; mm.vertexColors = false; mm.needsUpdate = true; } } } });
  m.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(m);
  const holder = new THREE.Group(); holder.position.y = b.min.y; m.position.y -= b.min.y; holder.add(m); scene.add(holder);
  if (["17", "20", "21", "23", "25", "27"].includes(g.f)) box.union(b);
  items.push({ g, holder, on: g.on ? D(g.on) : null, dur: (g.d || 1) * DAY, off: g.off ? D(g.off) : null });
  lp.textContent = ++loaded + "/" + GROUPS.length; res();
}, undefined, () => { lp.textContent = ++loaded + "/" + GROUPS.length + " (thiếu " + g.f + ")"; res(); }))));
document.getElementById("load").remove();
const C = box.getCenter(new THREE.Vector3()); C.y = 6;
sun.target.position.copy(C); sun.position.copy(C).addScaledVector(sunDir, 200);
camera.position.set(C.x + 110, 70, C.z + 110); controls.target.copy(C);

// --- trang thai theo ngay
const ease = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
function setDate(t) {
  for (const it of items) {
    let s = 1;
    if (it.on !== null) s = ease((t - it.on + DAY) / it.dur);
    if (it.off !== null && t >= it.off) s = 1 - ease((t - it.off) / DAY);
    it.holder.visible = s > 0.002; it.holder.scale.y = Math.max(s, 0.002);
  }
  MAT.brick.color.copy(BRICK).lerp(PLAST, ease((t - D(PLASTER.from)) / (D(PLASTER.to) - D(PLASTER.from))));
  document.getElementById("date").textContent = fmt(t);
}
function sceneAt(t) { let k = 0; SCENES.forEach((s, i) => { if (D(s.d0) <= t) k = i; }); return k; }
function setSub(i, t) { const s = SCENES[i]; document.getElementById("sub").innerHTML = s.t + "<small>" + (s.d0 === s.d1 ? fmt(D(s.d0)) : fmt(D(s.d0)) + " - " + fmt(D(s.d1))) + "</small>"; }
function camAt(c) { const [az, el, r] = c; const v = new THREE.Vector3().setFromSphericalCoords(r, THREE.MathUtils.degToRad(90 - el), THREE.MathUtils.degToRad(az)); camera.position.copy(C).add(v); camera.lookAt(C); controls.target.copy(C); }

// --- che do video: renderAt(giay) -> trang thai + camera
const TOTAL = SCENES.length * SCENE_SEC;
window.VIDEO = { total: TOTAL, renderAt(sec) {
  const i = Math.min(SCENES.length - 1, Math.floor(sec / SCENE_SEC)); const u = (sec - i * SCENE_SEC) / SCENE_SEC; const s = SCENES[i];
  const t = D(s.d0) + (D(s.d1) - D(s.d0)) * Math.min(1, u / 0.85);
  setDate(t); setSub(i, t);
  const c = s.c0.map((a, k) => a + (s.c1[k] - a) * ease(u)); camAt(c);
  renderer.render(scene, camera); return true; } };

// --- giao dien web
let cur = T0, playing = false;
const slider = document.getElementById("slider");
const toT = v => T0 + (T1 - T0) * v / 1000;
slider.oninput = () => { cur = toT(+slider.value); setDate(cur); setSub(sceneAt(cur), cur); };
document.getElementById("play").onclick = e => { playing = !playing; e.target.textContent = playing ? "⏸ Pause" : "▶ Play"; if (cur >= T1) cur = T0; };
const sc = document.getElementById("scenes");
SCENES.forEach((s, i) => { const b = document.createElement("button"); b.className = "sc"; b.textContent = (i + 1) + ". " + s.t; b.onclick = () => { cur = D(s.d1); slider.value = (cur - T0) / (T1 - T0) * 1000; setDate(cur); setSub(i, cur); camAt(s.c1); }; sc.appendChild(b); });
setDate(cur); setSub(0, cur);
addEventListener("resize", () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
let last = performance.now();
function loop(now) {
  if (!REC) { requestAnimationFrame(loop);
    if (playing) { cur = Math.min(T1, cur + (now - last) / 1000 * 2 * DAY); slider.value = (cur - T0) / (T1 - T0) * 1000; setDate(cur); setSub(sceneAt(cur), cur); if (cur >= T1) document.getElementById("play").click(); }
    controls.update(); renderer.render(scene, camera); }
  last = now;
}
requestAnimationFrame(loop);
window.READY = true;
