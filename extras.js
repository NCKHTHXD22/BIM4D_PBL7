// Vat the dong dung bang Three.js: luoi thep san/mong, may khoan coc, xe bom + xe bon, cong nhan, o to tren duong
import * as THREE from "three";
const DAY = 864e5, D = s => new Date(s + "T00:00:00").getTime();
const inW = (t, a, b) => t >= D(a) && t < D(b) + DAY;
const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, flatShading: true, ...o });
const box = (w, h, d, m) => { const g = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); g.castShadow = true; return g; };

// ---- mo hinh don gian
function makeTruck(body, cab = 0xe8e8e8) {
  const g = new THREE.Group();
  const ch = box(8, 0.6, 2.4, std(0x333333)); ch.position.y = 0.9; g.add(ch);
  const c = box(2, 2, 2.4, std(cab)); c.position.set(3, 2, 0); g.add(c);
  const w = std(0x111111);
  for (const x of [-2.8, -1.4, 2.8]) for (const z of [-1.1, 1.1]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.4, 12), w); r.rotation.x = Math.PI / 2; r.position.set(x, 0.5, z); g.add(r); }
  if (body === "mixer") { const d = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.7, 4.5, 14), std(0xff8c1a)); d.rotation.z = Math.PI / 2 - 0.25; d.position.set(-1.2, 2.6, 0); d.castShadow = true; g.add(d); g.userData.drum = d; }
  else if (body === "dump") { const b = box(5, 1.6, 2.4, std(0xe0a020)); b.position.set(-1.3, 2, 0); g.add(b); }
  return g;
}
function makePump() {
  const g = makeTruck("pump", 0xf2f2f2);
  const turret = new THREE.Group(); turret.position.set(-1.5, 2.2, 0); g.add(turret);
  const m = std(0xf5c518); const segs = [];
  let parent = turret; for (let i = 0; i < 3; i++) { const p = new THREE.Group(); const b = box(9, 0.45, 0.45, m); b.position.x = 4.5; p.add(b); if (i) p.position.x = 9; parent.add(p); segs.push(p); parent = p; }
  const hose = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 4, 6), std(0x222222)); hose.position.set(9, -2, 0); segs[2].add(hose);
  g.userData = { turret, segs }; return g;
}
function makeRig() {
  const g = new THREE.Group(); const y = std(0xf2b01e), k = std(0x333333);
  const tr = box(5, 1, 3.2, k); tr.position.y = 0.5; g.add(tr);
  const cab = box(3, 2.2, 2.6, y); cab.position.set(-0.5, 2.1, 0); g.add(cab);
  const mast = box(0.6, 18, 0.6, y); mast.position.set(2, 10, 0); g.add(mast);
  const kelly = box(0.25, 14, 0.25, std(0x888888)); kelly.position.set(2.5, 8, 0); g.add(kelly);
  return g;
}
function makeWorker() {
  const g = new THREE.Group();
  const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.85, 6), std(0x2b3a55)); legs.position.y = 0.42; g.add(legs);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.7, 8), std(0xff7a00)); body.position.y = 1.2; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), std(0xe0b48a)); head.position.y = 1.68; g.add(head);
  const hat = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), std(0xffd400)); hat.position.y = 1.72; g.add(hat);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g;
}
const WHEEL = new THREE.CylinderGeometry(0.36, 0.36, 0.25, 14), WM = std(0x111111), HUB = std(0xbbbbbb, { metalness: 0.7 });
function wheels(g, xs, z, r = 0.36) { for (const x of xs) for (const s of [-1, 1]) { const w = new THREE.Mesh(WHEEL, WM); w.scale.set(r / 0.36, 1, r / 0.36); w.rotation.x = Math.PI / 2; w.position.set(x, r, s * z); w.castShadow = true; g.add(w); const h = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.45, r * 0.45, 0.27, 8), HUB); h.rotation.x = Math.PI / 2; h.position.copy(w.position); g.add(h); } }
function makeCar(c) {
  const g = new THREE.Group(); const b = box(4.4, 0.8, 1.9, std(c, { metalness: 0.4, roughness: 0.35 })); b.position.y = 0.8; g.add(b);
  const t = box(2.3, 0.7, 1.7, std(0x223344, { metalness: 0.2, roughness: 0.2 })); t.position.set(-0.2, 1.5, 0); g.add(t);
  for (const z of [-0.6, 0.6]) { const l = box(0.05, 0.18, 0.35, std(0xfff6cc, { emissive: 0xfff2b0, emissiveIntensity: 0.6 })); l.position.set(2.21, 0.95, z); g.add(l); }
  wheels(g, [-1.4, 1.4], 0.86); return g;
}
function makeBus() { const g = new THREE.Group(); const b = box(11, 2.6, 2.5, std(0x1e8449)); b.position.y = 1.9; g.add(b); const w = box(10.4, 0.8, 2.55, std(0x223344, { roughness: 0.2 })); w.position.y = 2.4; g.add(w); wheels(g, [-3.8, 3.6], 1.1, 0.5); return g; }
function makeBike(c) { const g = new THREE.Group(); const b = box(1.8, 0.5, 0.35, std(c)); b.position.y = 0.7; g.add(b); const r = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.7, 6), std(0x2b3a55)); r.position.set(-0.1, 1.25, 0); g.add(r); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), std(0xd62828)); hd.position.set(-0.1, 1.75, 0); g.add(hd); wheels(g, [-0.65, 0.65], 0.0, 0.3); return g; }
function makeTree(h) { const g = new THREE.Group(); const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, h * 0.45, 6), std(0x6b4a2b)); tr.position.y = h * 0.22; g.add(tr);
  const cr = new THREE.Mesh(new THREE.IcosahedronGeometry(h * 0.33, 0), std([0x3f8f3a, 0x4f9a3f, 0x2f7a35, 0x5a9e45, 0x3c8448][Math.floor(Math.random() * 5)])); cr.position.y = h * 0.62; cr.scale.y = 1.15; g.add(cr); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; }
const LAMP = std(0xfff3c4, { emissive: 0xffe08a, emissiveIntensity: 0 });
function makeLamp() { const g = new THREE.Group(); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 8, 6), std(0x777f88, { metalness: 0.5 })); p.position.y = 4; g.add(p);
  const a = box(1.6, 0.1, 0.12, std(0x777f88)); a.position.set(0.7, 7.9, 0); g.add(a); const l = box(0.6, 0.15, 0.3, LAMP); l.position.set(1.4, 7.8, 0); g.add(l); return g; }
// luoi thep: InstancedMesh cac thanh mong
function rebarGrid(b, y, step = 0.5) {
  const nx = Math.floor((b.max.x - b.min.x) / step), nz = Math.floor((b.max.z - b.min.z) / step);
  const m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.03, 0.03), std(0x9c3d1c, { metalness: 0.6, roughness: 0.45 }), (nx + nz) * 2);
  const o = new THREE.Object3D(); let k = 0;
  for (const lay of [0, 0.12]) {
    for (let i = 0; i <= nz - 1; i++) { o.position.set((b.min.x + b.max.x) / 2, y + lay, b.min.z + (i + 0.5) * step); o.scale.set(b.max.x - b.min.x, 1, 1); o.rotation.set(0, 0, 0); o.updateMatrix(); m.setMatrixAt(k++, o.matrix); }
    for (let i = 0; i <= nx - 1; i++) { o.position.set(b.min.x + (i + 0.5) * step, y + lay + 0.03, (b.min.z + b.max.z) / 2); o.scale.set(b.max.z - b.min.z, 1, 1); o.rotation.set(0, Math.PI / 2, 0); o.updateMatrix(); m.setMatrixAt(k++, o.matrix); }
  }
  m.count = k; return m;
}

export function buildExtras(scene, items, C) {
  const get = f => items.find(i => i.g.f === f);
  const bb = f => get(f)?.box;
  const fence = bb("01") || new THREE.Box3(new THREE.Vector3(C.x - 50, 0, C.z - 40), new THREE.Vector3(C.x + 50, 0, C.z + 40));
  const bld = bb("20") || new THREE.Box3().setFromCenterAndSize(C, new THREE.Vector3(43, 10, 32));
  const parts = [];
  // 1. luoi thep san tung tang (hien tu ngay CT dam san den het do BT)
  const floors = [["20", "2027-04-28", "2027-05-08"], ["21", "2027-05-20", "2027-05-28"], ["23", "2027-06-09", "2027-06-17"], ["25", "2027-06-29", "2027-07-07"], ["27", "2027-07-19", "2027-07-27"], ["29", "2027-08-07", "2027-08-16"]];
  for (const [f, a, b] of floors) { const x = bb(f); if (!x) continue; const g = rebarGrid(x, x.max.y - 0.12); scene.add(g); parts.push({ o: g, a, b }); }
  const ft = bb("12"); if (ft) { const g = rebarGrid(ft, ft.max.y - 0.25, 0.4); scene.add(g); parts.push({ o: g, a: "2027-04-03", b: "2027-04-09" }); }
  // 2. may khoan coc (6 may) di chuyen trong mat bang
  const rigs = []; for (let i = 0; i < 6; i++) { const r = makeRig(); scene.add(r); rigs.push(r); }
  // 3. xe bom + 2 xe bon o mep nam cong trinh, chi hien ngay do BT
  const pours = [["2027-04-08", "2027-04-13", 0], ["2027-04-23", "2027-04-24", 1], ["2027-05-06", "2027-05-08", 1], ["2027-05-15", "2027-05-17", 2], ["2027-05-26", "2027-05-28", 2], ["2027-06-04", "2027-06-05", 3], ["2027-06-15", "2027-06-17", 3], ["2027-06-24", "2027-06-25", 4], ["2027-07-05", "2027-07-07", 4], ["2027-07-14", "2027-07-15", 5], ["2027-07-24", "2027-07-27", 5], ["2027-08-03", "2027-08-04", 6], ["2027-08-13", "2027-08-16", 6]];
  const pump = makePump(); const mix1 = makeTruck("mixer"), mix2 = makeTruck("mixer");
  const py = 0, pz = bld.max.z + 9, px = (bld.min.x + bld.max.x) / 2;
  pump.position.set(px, py, pz); mix1.position.set(px - 11, py, pz + 1); mix2.position.set(px - 22, py, pz + 1);
  scene.add(pump, mix1, mix2);
  // 4. cong nhan
  const workers = []; for (let i = 0; i < 36; i++) { const w = makeWorker(); scene.add(w); workers.push({ o: w, s: Math.random() * 1000, r: 0.3 + Math.random() * 0.7 }); }
  // 5. o to chay vong quanh duong bao cong truong + xe tai cho dat
  const cars = []; const cols = [0xc0392b, 0xecf0f1, 0x2c3e50, 0x2980b9, 0x7f8c8d, 0xf1c40f, 0x16a085, 0x8e44ad];
  for (let i = 0; i < 8; i++) { const c = makeCar(cols[i]); scene.add(c); cars.push({ o: c, s: i / 8 }); }
  const dumps = [makeTruck("dump"), makeTruck("dump")]; dumps.forEach(d => scene.add(d));
  const R = { x0: fence.min.x - 7, x1: fence.max.x + 7, z0: fence.min.z - 7, z1: fence.max.z + 7 };
  // duong nhua chu L: canh z lon (phia nam) va canh x nho (phia tay)
  const LA = R.x1 + 25 - R.x0, LB = R.z1 - (R.z0 - 25), per = LA + LB;
  const along = (u, lane = 0) => { let d = ((u % 1) + 1) % 1 * per; const back = lane > 0;
    if (back) d = per - d; const o = back ? -1.8 : 1.8;
    if (d < LA) return [R.x1 + 25 - d, R.z1 + o, back ? 0 : Math.PI]; d -= LA; return [R.x0 + o, R.z1 - d, back ? -Math.PI / 2 : Math.PI / 2]; };
  // cay xanh + den duong doc tuyen duong chu L, nha lan can phia ngoai duong
  const decor = new THREE.Group(); scene.add(decor);
  for (let d = 0; d < per; d += 12) { const [x, z, a] = along(d / per, 0); const n = new THREE.Vector3(Math.sin(a + Math.PI / 2), 0, Math.cos(a + Math.PI / 2));
    for (const sd of [-1, 1]) { const tr = makeTree(5 + Math.random() * 3); tr.position.set(x + n.x * sd * 8.5, 0, z + n.z * sd * 8.5); decor.add(tr); }
    const out = (C.x - (x + n.x)) ** 2 + (C.z - (z + n.z)) ** 2 > (C.x - (x - n.x)) ** 2 + (C.z - (z - n.z)) ** 2 ? 1 : -1;
    if ((d / 12) % 2 === 0) { const lp = makeLamp(); lp.position.set(x + n.x * 6.5 * out, 0, z + n.z * 6.5 * out); lp.rotation.y = a + (out > 0 ? Math.PI / 2 : -Math.PI / 2); decor.add(lp); } }
  const bcol = [0xe8dcc8, 0xd6e4f0, 0xf2e6d0, 0xcfd8dc, 0xf0d9c5, 0xdfe6d8];
  for (let d = 10; d < per - 10; d += 22) { const [x, z, a] = along(d / per, 0); const n = new THREE.Vector3(Math.sin(a + Math.PI / 2), 0, Math.cos(a + Math.PI / 2));
    const out = (C.x - (x + n.x)) ** 2 + (C.z - (z + n.z)) ** 2 > (C.x - (x - n.x)) ** 2 + (C.z - (z - n.z)) ** 2 ? 1 : -1;
    const h = 6 + Math.floor(Math.random() * 3) * 3.3; const b = box(16, h, 12, std(bcol[(d / 22 | 0) % bcol.length])); b.position.set(x + n.x * 26 * out, h / 2, z + n.z * 26 * out); b.rotation.y = a; b.receiveShadow = true; decor.add(b);
    const roof = box(16.4, 0.4, 12.4, std(0x8d6e63)); roof.position.set(b.position.x, h + 0.2, b.position.z); roof.rotation.y = a; decor.add(roof); }
  const bus = makeBus(); scene.add(bus); const bikes = [0x1565c0, 0xc62828, 0x2e7d32, 0x212121, 0xf9a825, 0x6a1b9a].map(c => { const b = makeBike(c); scene.add(b); return b; });
  // tang dang thi cong (cao do de dat cong nhan)
  const lvl = t => { let y = 0; for (const f of ["20", "21", "23", "25", "27", "29"]) { const it = get(f); if (it && t >= it.on) y = it.box.max.y; } return y; };

  return function update(t, sec, env = { working: true, night: false, rain: false }) {
    LAMP.emissiveIntensity = env.night || env.rain ? 2.2 : 0;
    { const [x, z, a] = along(0.3 + sec * 0.012, 1); bus.position.set(x, 0, z); bus.rotation.y = a; }
    bikes.forEach((b, i) => { const [x, z, a] = along(i / 6 + sec * 0.045, i % 2); b.position.set(x, 0, z + (i % 3 - 1) * 0.6); b.rotation.y = a; });
    for (const p of parts) p.o.visible = inW(t, p.a, p.b);
    // may khoan coc
    const drill = inW(t, "2027-02-22", "2027-03-28"); const dd = new Date(t).getDay();
    rigs.forEach((r, i) => { r.visible = drill; if (!drill) return; const u = (t - D("2027-02-22")) / (35 * DAY);
      const gx = i % 3, gz = Math.floor(i / 3); r.position.set(bld.min.x + 5 + (gx + u) * (bld.max.x - bld.min.x - 10) / 3, 0, bld.min.z + 6 + gz * (bld.max.z - bld.min.z - 12) + Math.sin(sec + i) * 0.5); });
    // xe bom
    const pr = pours.find(p => inW(t, p[0], p[1]));
    pump.visible = mix1.visible = mix2.visible = !!pr;
    if (pr) { const f = pr[2]; const s = pump.userData.segs;
      pump.userData.turret.rotation.y = Math.PI / 2 + Math.sin(sec * 0.4) * 0.35;
      const lift = 0.25 + f * 0.09; s[0].rotation.z = lift + 0.35; s[1].rotation.z = -0.55 + f * 0.04; s[2].rotation.z = -0.75 + Math.sin(sec * 0.6) * 0.08;
      [mix1, mix2].forEach(m => { if (m.userData.drum) m.userData.drum.rotation.x = sec * 2; }); }
    // xe tai cho dat khi dao dat
    const dig = inW(t, "2027-03-29", "2027-04-01");
    dumps.forEach((d, i) => { d.visible = dig; if (dig) { const [x, z, a] = along(sec * 0.025 + i * 0.5, i); d.position.set(x, 0, z); d.rotation.y = a; } });
    // o to
    cars.forEach((c, i) => { const [x, z, a] = along(c.s + sec * 0.03, i % 2); c.o.position.set(x, 0, z); c.o.rotation.y = a; });
    // cong nhan: tren tang dang thi cong; mat bang chuan bi: tren nen
    const active = env.working && t >= D("2027-02-15") && t < D("2027-12-11"); const y = t < D("2027-04-19") ? 0 : lvl(t);
    workers.forEach((w, i) => { w.o.visible = active; if (!active) return;
      const ang = w.s + sec * w.r * 0.5; const gx = (i % 6 + 0.5) / 6, gz = (Math.floor(i / 6) + 0.5) / 6;
      w.o.position.set(bld.min.x + gx * (bld.max.x - bld.min.x) + Math.cos(ang) * 1.5, y + Math.abs(Math.sin(sec * 6 + i)) * 0.05, bld.min.z + gz * (bld.max.z - bld.min.z) + Math.sin(ang) * 1.5);
      w.o.rotation.y = -ang; });
  };
}
