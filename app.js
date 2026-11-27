import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Sky } from "three/addons/objects/Sky.js";
import { GROUPS, PLASTER, SCENES, SCENE_SEC } from "./schedule.js";
import { buildExtras } from "./extras.js";

const $ = id => document.getElementById(id);
const REC = new URLSearchParams(location.search).has("record");
if (REC) document.body.classList.add("rec");
const DATA = await (await fetch("./data.json")).json();
const H = 36e5, DAY = 864e5;
const D = s => new Date(s.length === 8 ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T00:00:00` : s + "T00:00:00").getTime();
const day0 = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const fmt = t => { const d = new Date(t); return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear(); };
const THU = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
const T0 = D("2027-02-15") + 7 * H, T1 = D("2027-12-13") + 17 * H;
const LE = { "2027-04-16": "Giỗ Tổ Hùng Vương (10/3 âm lịch)", "2027-04-30": "Ngày Giải phóng miền Nam 30/4", "2027-05-01": "Quốc tế Lao động 1/5", "2027-09-01": "Nghỉ lễ Quốc khánh", "2027-09-02": "Quốc khánh 2/9" };
const HOL = new Map(DATA.holidays.map(h => [h.d, h.n]));
const iso = t => { const d = new Date(t); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const holiday = t => { const k = iso(t); if (new Date(t).getDay() === 0) return "Chủ nhật - nghỉ thi công"; if (LE[k]) return LE[k]; if (HOL.has(k)) return HOL.get(k); return null; };
const SUMMARY = new Set([1, 2, 4, 18, 19, 28, 37, 46, 55, 64, 73]);
const TASKS = DATA.tasks.filter(t => !SUMMARY.has(t.id) && t.s && t.f).map(t => ({ ...t, t0: D(t.s), t1: D(t.f) + DAY }));
const TASK2GRP = { 9: "08", 13: "11", 14: "12", 16: "13", 17: "14", 20: "15", 21: "16", 22: "17", 24: "18", 26: "20", 29: "21", 30: "22", 31: "21", 33: "22", 35: "21", 38: "23", 39: "24", 40: "23", 42: "24", 44: "23", 47: "25", 48: "26", 49: "25", 51: "26", 53: "25", 56: "27", 57: "28", 58: "27", 60: "28", 62: "27", 65: "29", 66: "30", 67: "29", 69: "30", 71: "29", 74: "32", 75: "32", 76: "32", 80: "33", 81: "34", 82: "31", 85: "34", 88: "35", 89: "35", 90: "31", 91: "36" };
const rainProb = [0.15, 0.12, 0.1, 0.15, 0.25, 0.3, 0.3, 0.35, 0.45, 0.55, 0.5, 0.3];
const hash = n => { n = Math.sin(n * 12.9898) * 43758.5453; return n - Math.floor(n); };
let wxMode = "auto";
const isRain = t => wxMode === "rain" ? true : wxMode === "sun" ? false : hash(Math.round(day0(t) / DAY)) < rainProb[new Date(t).getMonth()];

// ---------------- renderer / scene
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(REC ? 1 : Math.min(devicePixelRatio, 1.5)); renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.8;
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.2, 5000);
const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.zoomSpeed = 1.2; controls.minDistance = 3; controls.maxDistance = 900; controls.maxPolarAngle = Math.PI * 0.495;
const sky = new Sky(); sky.scale.setScalar(4500); scene.add(sky);
const su = sky.material.uniforms; su.mieCoefficient.value = 0.004; su.mieDirectionalG.value = 0.8;
const hemi = new THREE.HemisphereLight(0xdfefff, 0x8a7a60, 1.1); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2dd, 3.2); sun.castShadow = true;
sun.shadow.mapSize.set(REC ? 2048 : 4096, REC ? 2048 : 4096); Object.assign(sun.shadow.camera, { left: -110, right: 110, top: 110, bottom: -110, near: 1, far: 500 }); sun.shadow.bias = -0.0004;
scene.add(sun, sun.target);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshStandardMaterial({ color: 0xbfae86, roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.position.y = -1.0; ground.receiveShadow = true; scene.add(ground);
scene.fog = new THREE.Fog(0xb9d3ea, 260, 1600);
const RN = 9000, rainGeo = new THREE.BufferGeometry(), rp = new Float32Array(RN * 6);
for (let i = 0; i < RN; i++) { const x = (Math.random() - 0.5) * 220, y = Math.random() * 90, z = (Math.random() - 0.5) * 220; rp.set([x, y, z, x + 0.15, y - 1.6, z], i * 6); }
rainGeo.setAttribute("position", new THREE.BufferAttribute(rp, 3));
const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0xaac4dd, transparent: true, opacity: 0.55 })); rain.visible = false; scene.add(rain);

// ---------------- vat lieu + mo hinh
const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, metalness: 0, flatShading: true, ...o });
const MAT = { concrete: M(0xc9c6c0, { roughness: 0.95 }), rebar: M(0x9c3d1c, { roughness: 0.5, metalness: 0.6 }), formwork: M(0xc8913f, { roughness: 0.8 }),
  scaffold: M(0x3aa35c, { transparent: true, opacity: 0.55, roughness: 0.7, depthWrite: false, side: THREE.DoubleSide }), brick: M(0xb5522e, { roughness: 0.95 }), ceiling: M(0xf2f2ee), finish: M(0xd9d4c8, { roughness: 0.6 }) };
const BRICK = new THREE.Color(0xb5522e), PLAST = new THREE.Color(0xefe9df);
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const items = []; let loaded = 0; const box = new THREE.Box3();
await Promise.all(GROUPS.map(g => new Promise(res => loader.load("./models/" + g.f + ".glb", gl => {
  const m = gl.scene; m.rotation.x = -Math.PI / 2; m.scale.setScalar(0.3048);
  m.traverse(o => { if (o.isMesh) { o.castShadow = g.style !== "scaffold"; o.receiveShadow = true; if (g.style !== "orig") o.material = MAT[g.style];
    else if (o.material) for (const mm of [].concat(o.material)) { mm.side = THREE.DoubleSide; mm.flatShading = true; mm.vertexColors = false; mm.roughness = 0.8; if (mm.name === "GLASS") { mm.transparent = true; mm.opacity = 0.35; mm.depthWrite = false; mm.metalness = 0.3; mm.roughness = 0.1; } mm.needsUpdate = true; } } });
  m.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(m);
  const holder = new THREE.Group(); holder.position.y = b.min.y; m.position.y -= b.min.y; holder.add(m); scene.add(holder);
  if (["17", "20", "21", "23", "25", "27"].includes(g.f)) box.union(b);
  items.push({ g, holder, box: b.clone(), on: g.on ? D(g.on) : null, dur: (g.d || 1) * DAY, off: g.off ? D(g.off) : null, user: true });
  $("lp").textContent = ++loaded + "/" + GROUPS.length; res();
}, undefined, () => { $("lp").textContent = ++loaded + "/" + GROUPS.length; res(); }))));
$("load").remove();
const C = box.getCenter(new THREE.Vector3()); C.y = 6;
const extras = buildExtras(scene, items, C);
window.DBG = { camera, controls, C, items, scene, setT: t => setT(t), D, extras };
// khoet lo ho dao tren mat dat (ho mong hien ra khi dao, khoi dat che lai truoc do)
if (extras.pit) { const p = extras.pit, s = new THREE.Shape(); s.moveTo(-2000, -2000); s.lineTo(2000, -2000); s.lineTo(2000, 2000); s.lineTo(-2000, 2000); s.closePath();
  const h = new THREE.Path(); h.moveTo(p.x0, -p.z1); h.lineTo(p.x0, -p.z0); h.lineTo(p.x1, -p.z0); h.lineTo(p.x1, -p.z1); h.closePath(); s.holes.push(h);
  ground.geometry.dispose(); ground.geometry = new THREE.ShapeGeometry(s); ground.position.y = extras.GL; }
let exNote = "";
camera.position.set(C.x + 110, 70, C.z + 110); controls.target.copy(C);

// ---------------- trang thai theo thoi diem
const ease = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
let curT = T0, highlight = null, hlUntil = 0;
function applyTime(t, sec) {
  const d = day0(t), hr = (t - d) / H;
  for (const it of items) {
    let s = 1; if (it.on !== null) s = ease((d - it.on + DAY) / it.dur);
    if (it.off !== null && d >= it.off) s = 1 - ease((d - it.off) / DAY);
    it.holder.visible = it.user && s > 0.002; it.holder.scale.y = Math.max(s, 0.002);
  }
  MAT.brick.color.copy(BRICK).lerp(PLAST, ease((d - D(PLASTER.from)) / (D(PLASTER.to) - D(PLASTER.from))));
  const wet = isRain(t), el = Math.sin(Math.PI * (hr - 6) / 12) * 68, az = 90 + (hr - 6) / 12 * 180;
  const dir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - el), THREE.MathUtils.degToRad(az));
  su.sunPosition.value.copy(dir); su.turbidity.value = wet ? 18 : 6; su.rayleigh.value = wet ? 0.6 : 1.6;
  const dayL = Math.max(0, Math.min(1, (el + 4) / 18));
  sun.position.copy(C).addScaledVector(dir, 220); sun.target.position.copy(C);
  sun.intensity = 3.2 * dayL * (wet ? 0.18 : 1); hemi.intensity = 0.15 + 1.0 * dayL * (wet ? 0.6 : 1);
  hemi.color.set(wet ? 0x9aa6b2 : 0xdfefff); scene.fog.color.set(wet ? 0x8c97a3 : dayL < 0.2 ? 0x1a2433 : 0xb9d3ea); scene.fog.near = wet ? 90 : 260; scene.fog.far = wet ? 600 : 1600;
  renderer.toneMappingExposure = 0.35 + 0.45 * dayL + (wet ? 0.05 : 0);
  rain.visible = wet; if (wet) rain.position.set(camera.position.x, -((sec * 40) % 30), camera.position.z);
  const hol = holiday(t), working = !hol && ((hr >= 7 && hr < 11.5) || (hr >= 13 && hr < 17));
  exNote = extras(t, sec, { working, night: dayL < 0.25, rain: wet }) || "";
  if (highlight) { const k = Date.now() < hlUntil ? 0.5 + 0.5 * Math.sin(Date.now() / 150) : 0; highlight.traverse(o => { if (o.isMesh && o.material.emissive) o.material.emissive.setRGB(k * 0.6, k * 0.4, 0); }); if (!k) highlight = null; }
  curT = t;
}
function phaseOf(act, t) {
  if (t < D("2027-02-22")) return "Công tác chuẩn bị, dựng tổng mặt bằng";
  if (t < D("2027-04-19")) return "Phần ngầm (cọc, móng, giằng)";
  const fl = act.map(a => (a.name.match(/Tầng (\d)/) || [])[1]).filter(Boolean);
  if (t < D("2027-08-31")) return "Phần thân" + (fl.length ? " - Tầng " + [...new Set(fl)].join(", ") : "") + (t >= D("2027-07-30") ? " + Hoàn thiện" : "");
  return t >= D("2027-12-08") ? "Nghiệm thu, bàn giao" : "Công tác hoàn thiện";
}
function activity(hr, hol, wet, act) {
  if (hol) return ["#7f8c8d", "NGÀY NGHỈ: " + hol];
  if (hr < 7) return ["#34495e", "Ngoài giờ làm việc (ca sáng bắt đầu 07:00)"];
  if (hr < 7.5) return ["#2980b9", "07:00-07:30 Giao ca, phổ biến an toàn lao động, kiểm tra máy móc, thiết bị"];
  if (hr < 11.5) return [wet ? "#8e44ad" : "#27ae60", "Ca sáng 07:30-11:30: thi công " + act.length + " công việc" + (wet ? " - TRỜI MƯA: tạm dừng đổ bê tông, công tác ngoài trời; ưu tiên việc trong nhà, che phủ vật liệu" : "")];
  if (hr < 13) return ["#d35400", "11:30-13:00 Nghỉ trưa"];
  if (hr < 16.5) return [wet ? "#8e44ad" : "#27ae60", "Ca chiều 13:00-16:30: thi công " + act.length + " công việc" + (wet ? " - TRỜI MƯA: dừng việc ngoài trời" : "")];
  if (hr < 17) return ["#2980b9", "16:30-17:00 Vệ sinh mặt bằng, nghiệm thu khối lượng, ghi nhật ký thi công"];
  return ["#34495e", "Ngoài giờ làm việc - bảo vệ trực, bảo dưỡng bê tông (tưới ẩm)"];
}
let lastInfo = "";
function updateInfo(t, maxTasks = 12) {
  const d = day0(t), hr = (t - d) / H, hol = holiday(t), wet = isRain(t);
  const act = TASKS.filter(k => d >= k.t0 && d < k.t1).sort((a, b) => a.t0 - b.t0);
  $("iTime").textContent = String(Math.floor(hr)).padStart(2, "0") + ":" + String(Math.floor((hr % 1) * 60)).padStart(2, "0");
  const key = d + "|" + Math.floor(hr * 2) + "|" + wet + "|" + maxTasks + "|" + exNote; if (key === lastInfo) return; lastInfo = key;
  $("exNote").style.display = exNote ? "block" : "none"; $("exNote").textContent = exNote;
  $("iDate").textContent = THU[new Date(t).getDay()] + ", " + fmt(t);
  $("iWx").textContent = wet ? "🌧 Mưa" : (hr > 6 && hr < 18 ? "☀ Nắng" : "🌙 Trời quang");
  $("iPhase").textContent = phaseOf(act, d);
  $("iProg").textContent = Math.round(Math.max(0, Math.min(1, (t - T0) / (T1 - T0))) * 100) + "% thời gian (" + fmt(T0) + " → " + fmt(T1) + ")";
  const [c, s] = activity(hr, hol, wet, act); $("status").style.background = c; $("status").textContent = s;
  $("iTaskH").textContent = "CÔNG VIỆC TRONG NGÀY (" + act.length + ")";
  $("iTasks").innerHTML = (act.slice(0, maxTasks).map(k => { const p = Math.round(Math.min(1, (d - k.t0 + DAY) / (k.t1 - k.t0)) * 100);
    const col = /cốt thép/i.test(k.name) ? "#e74c3c" : /ván khuôn/i.test(k.name) ? "#e67e22" : /bê tông/i.test(k.name) ? "#3498db" : "#2ecc71";
    return `<div class="task" style="border-color:${col}" data-id="${k.id}"><b>ID ${k.id}</b> - ${k.name}<br><small>${fmt(k.t0)} → ${k.est ? "~" : ""}${fmt(k.t1 - DAY)}${k.n ? " · " + k.n + " công nhân" : ""}${k.dur ? " · " + k.dur + " ngày" : ""} · ${p}%</small>${k.note && maxTasks > 4 ? `<br><small>⚙ ${k.note}</small>` : ""}<div class="bar"><i style="width:${p}%"></i></div></div>`; }).join("") + (act.length > maxTasks ? `<small>… và ${act.length - maxTasks} công việc khác</small>` : "")) || "<small>Không có công việc theo tiến độ.</small>";
  document.querySelectorAll("#iTasks .task").forEach(e => e.onclick = () => focusTask(+e.dataset.id));
}
function sceneAt(t) { let k = 0; SCENES.forEach((s, i) => { if (D(s.d0) <= day0(t)) k = i; }); return k; }
function setSub(i) { const s = SCENES[i]; $("sub").innerHTML = s.t + "<small>" + (s.d0 === s.d1 ? fmt(D(s.d0)) : fmt(D(s.d0)) + " - " + fmt(D(s.d1))) + "</small>"; }

// ---------------- camera: tong quan / giam sat
let mode = "over"; const yp = { y: 0, p: 0 }; const keys = {}; let floor = 0; const FL = [0, 4.2, 8.4, 12, 15.6, 19.2, 22.6];
function camAt(c) { const [az, el, r] = c; const v = new THREE.Vector3().setFromSphericalCoords(r, THREE.MathUtils.degToRad(90 - el), THREE.MathUtils.degToRad(az)); camera.position.copy(C).add(v); camera.lookAt(C); controls.target.copy(C); }
function setMode(m) { mode = m; $("vOver").classList.toggle("on", m === "over"); $("vSup").classList.toggle("on", m === "sup"); $("help").style.display = m === "sup" ? "block" : "none"; controls.enabled = m === "over";
  if (m === "sup") { floor = 0; camera.position.set(C.x, 1.7, C.z + 26); yp.y = 0; yp.p = 0; } else camAt([215, 35, 120]); }
let drag = null;
renderer.domElement.addEventListener("pointerdown", e => { if (mode === "sup") drag = { x: e.clientX, y: e.clientY }; });
addEventListener("pointerup", () => drag = null);
addEventListener("pointermove", e => { if (!drag) return; yp.y -= (e.clientX - drag.x) * 0.004; yp.p = Math.max(-1.3, Math.min(1.3, yp.p - (e.clientY - drag.y) * 0.004)); drag = { x: e.clientX, y: e.clientY }; });
const fwd = () => new THREE.Vector3(-Math.sin(yp.y), 0, -Math.cos(yp.y));
renderer.domElement.addEventListener("wheel", e => { if (mode === "sup") camera.position.addScaledVector(fwd(), -Math.sign(e.deltaY) * 1.5); }, { passive: true });
addEventListener("keydown", e => { keys[e.code] = true; if (mode === "sup" && e.code === "KeyE") floor = Math.min(FL.length - 1, floor + 1); if (mode === "sup" && e.code === "KeyQ") floor = Math.max(0, floor - 1); });
addEventListener("keyup", e => keys[e.code] = false);
function supStep(dt) {
  const sp = (keys.ShiftLeft || keys.ShiftRight ? 12 : 4) * dt, f = fwd(), r = new THREE.Vector3(-f.z, 0, f.x);
  if (keys.KeyW || keys.ArrowUp) camera.position.addScaledVector(f, sp); if (keys.KeyS || keys.ArrowDown) camera.position.addScaledVector(f, -sp);
  if (keys.KeyD || keys.ArrowRight) camera.position.addScaledVector(r, sp); if (keys.KeyA || keys.ArrowLeft) camera.position.addScaledVector(r, -sp);
  camera.position.y += (FL[floor] + 1.7 - camera.position.y) * Math.min(1, dt * 5);
  camera.rotation.set(yp.p, yp.y, 0, "YXZ");
}
function focusBox(b) { if (mode !== "over") setMode("over"); const c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3()).length(); controls.target.copy(c); camera.position.copy(c).add(new THREE.Vector3(0.6, 0.5, 0.7).normalize().multiplyScalar(Math.max(25, s * 0.9))); }
function focusTask(id) { const k = TASKS.find(x => x.id === id); if (!k) return; setT(k.t0 + 9 * H); const f = TASK2GRP[id]; const it = f && items.find(i => i.g.f === f);
  if (it) { focusBox(it.box); highlight = it.holder; hlUntil = Date.now() + 3500; } }

// ---------------- dieu khien thoi gian
let playing = false; const slider = $("slider");
function setT(t) { curT = Math.max(T0 - 7 * H, Math.min(T1, t)); slider.value = (curT - T0) / (T1 - T0) * 10000; applyTime(curT, performance.now() / 1000); updateInfo(curT); setSub(sceneAt(curT)); $("clock").textContent = THU[new Date(curT).getDay()] + " " + fmt(curT) + " · " + $("iTime").textContent; }
slider.oninput = () => setT(day0(T0 + (T1 - T0) * slider.value / 10000) + 9 * H);
$("play").onclick = () => { playing = !playing; $("play").textContent = playing ? "⏸ Dừng" : "▶ Chạy"; $("play").classList.toggle("on", playing); if (curT >= T1) setT(T0); };
// toc do: nut cham/nhanh, phim [ ] va Space, bo qua dem & ngay nghi
const spdSel = $("speed"), speed = () => +spdSel.value, skipOn = () => $("skip").checked && speed() < 24;
function stepSpeed(k) { spdSel.selectedIndex = Math.max(0, Math.min(spdSel.options.length - 1, spdSel.selectedIndex + k)); showEta(); }
let WORKDAYS = 0; for (let d = day0(T0); d <= T1; d += DAY) if (!holiday(d + 9 * H)) WORKDAYS++;
function showEta() { const hrs = skipOn() ? WORKDAYS * 10 : (T1 - T0) / H, s = hrs / speed(); $("eta").textContent = "≈ " + (s >= 60 ? Math.round(s / 60) + " phút" : Math.round(s) + " giây") + " cho cả tiến độ"; }
function skipOff(t) { for (let i = 0; i < 20; i++) { const h = (t - day0(t)) / H;
  if (holiday(t) || h >= 17) { t = day0(t) + DAY + 7 * H; continue; } if (h < 7) t = day0(t) + 7 * H; break; } return t; }
$("slow").onclick = () => stepSpeed(-1); $("fast").onclick = () => stepSpeed(1); spdSel.onchange = $("skip").onchange = showEta; showEta();
addEventListener("keydown", e => { if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if (e.code === "BracketLeft") stepSpeed(-1); else if (e.code === "BracketRight") stepSpeed(1);
  else if (e.code === "Space") { e.preventDefault(); if (e.target.tagName !== "BUTTON") $("play").click(); } });
$("prevD").onclick = () => setT(curT - DAY); $("nextD").onclick = () => setT(curT + DAY);
$("vOver").onclick = () => setMode("over"); $("vSup").onclick = () => setMode("sup");
$("zin").onclick = () => { if (mode === "over") camera.position.lerp(controls.target, 0.25); else camera.position.addScaledVector(fwd(), 3); };
$("zout").onclick = () => { if (mode === "over") camera.position.sub(controls.target).multiplyScalar(1.3).add(controls.target); else camera.position.addScaledVector(fwd(), -3); };
$("wx").onchange = e => { wxMode = e.target.value; lastInfo = ""; setT(curT); };
$("bPanel").onclick = () => { const p = $("panel"); p.style.display = p.style.display === "block" ? "none" : "block"; $("bPanel").classList.toggle("on"); };
$("bInfo").onclick = () => { const p = $("info"); p.style.display = p.style.display === "none" ? "block" : "none"; $("bInfo").classList.toggle("on"); };
$("tabT").onclick = () => { $("pT").style.display = "block"; $("pG").style.display = "none"; $("tabT").classList.add("on"); $("tabG").classList.remove("on"); };
$("tabG").onclick = () => { $("pG").style.display = "block"; $("pT").style.display = "none"; $("tabG").classList.add("on"); $("tabT").classList.remove("on"); };
const PH = [["CÔNG TÁC CHUẨN BỊ", 3, 3], ["PHẦN NGẦM", 5, 17], ["PHẦN THÂN - TẦNG 1", 20, 27], ["PHẦN THÂN - TẦNG 2", 29, 36], ["PHẦN THÂN - TẦNG 3", 38, 45], ["PHẦN THÂN - TẦNG 4", 47, 54], ["PHẦN THÂN - TẦNG 5", 56, 63], ["PHẦN THÂN - TẦNG TUM", 65, 72], ["CÔNG TÁC HOÀN THIỆN", 74, 91]];
$("pT").innerHTML = PH.map(([n, a, b]) => `<div class="ph">${n}</div>` + TASKS.filter(k => k.id >= a && k.id <= b).map(k => `<div class="tk" data-id="${k.id}"><b>${k.id}</b> ${k.name}<br><small style="color:#9fb3cc">${fmt(k.t0)} → ${k.est ? "~" : ""}${fmt(k.t1 - DAY)}${k.n ? " · " + k.n + " CN" : ""}</small></div>`).join("")).join("");
document.querySelectorAll("#pT .tk").forEach(e => e.onclick = () => focusTask(+e.dataset.id));
$("pG").innerHTML = "<small>Tích để bật/tắt hiển thị; bấm tên để phóng tới hạng mục.</small>" + [...items].sort((a, b) => a.g.f.localeCompare(b.g.f)).map(it => `<div class="grp"><input type="checkbox" checked data-f="${it.g.f}"><span data-f="${it.g.f}">${it.g.name}</span><em>${it.g.on ? fmt(D(it.g.on)) : "luôn hiện"}${it.g.off ? " → " + fmt(D(it.g.off)) : ""}</em></div>`).join("");
document.querySelectorAll("#pG input").forEach(e => e.onchange = () => { items.find(i => i.g.f === e.dataset.f).user = e.checked; setT(curT); });
document.querySelectorAll("#pG span").forEach(e => e.onclick = () => { const it = items.find(i => i.g.f === e.dataset.f); if (it.on) setT(Math.max(curT, it.on + it.dur + 9 * H)); focusBox(it.box); highlight = it.holder; hlUntil = Date.now() + 3500; });

// ---------------- che do quay video
window.VIDEO = { total: SCENES.length * SCENE_SEC, renderAt(sec) {
  const i = Math.min(SCENES.length - 1, Math.floor(sec / SCENE_SEC)); const u = (sec - i * SCENE_SEC) / SCENE_SEC; const s = SCENES[i];
  const t = day0(D(s.d0) + (D(s.d1) - D(s.d0)) * Math.min(1, u / 0.85)) + (7.5 + 9 * u) * H;
  applyTime(t, sec); updateInfo(t, 4); setSub(i);
  camAt(s.c0.map((a, k) => a + (s.c1[k] - a) * ease(u))); renderer.render(scene, camera); return true; } };

addEventListener("resize", () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
setT(T0 + 2 * H); camAt([215, 35, 125]);
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (!REC) { requestAnimationFrame(loop);
    if (playing) { let nt = curT + dt * speed() * H; if (skipOn()) nt = skipOff(nt); if (nt >= T1) $("play").click(); setT(nt); } else applyTime(curT, now / 1000);
    if (mode === "sup") supStep(dt); else controls.update();
    renderer.render(scene, camera); }
}
requestAnimationFrame(loop);
window.READY = true;
