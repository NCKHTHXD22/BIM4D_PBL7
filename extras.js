// Vat the dong dung bang Three.js: phan ngam chi tiet (coc, dao dat, dap dau coc, BT lot, thep dai, lap dat),
// luoi thep san, may khoan, may dao, xe bom + xe bon, cong nhan, duong giao thong, cay xanh, den duong, nha dan
import * as THREE from "three";
const DAY = 864e5, H = 36e5, D = s => new Date(s + "T00:00:00").getTime();
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
  else if (body === "dump") { const b = box(5, 1.6, 2.4, std(0xe0a020)); b.position.set(-1.3, 2, 0); g.add(b); const s = box(4.6, 0.5, 2.1, std(0x7a5a3a, { roughness: 1 })); s.position.set(-1.3, 2.9, 0); g.add(s); g.userData.soil = s; }
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
function makeExcavator() {
  const g = new THREE.Group(), y = std(0xf2b705), k = std(0x2b2b2b);
  for (const s of [-1, 1]) { const t = box(4.4, 0.9, 0.85, k); t.position.set(0, 0.45, s * 1.25); g.add(t); }
  const tur = new THREE.Group(); tur.position.y = 1.0; g.add(tur);
  const body = box(3.4, 1.2, 2.6, y); body.position.set(-0.7, 0.6, 0); tur.add(body);
  const cw = box(0.8, 1.0, 2.6, k); cw.position.set(-2.6, 0.6, 0); tur.add(cw);
  const cab = box(1.3, 1.6, 1.1, std(0x2f4f6f, { roughness: 0.3 })); cab.position.set(0.5, 1.45, 0.75); tur.add(cab);
  const boom = new THREE.Group(); boom.position.set(0.9, 1.1, -0.35); tur.add(boom);
  const bm = box(5.4, 0.55, 0.5, y); bm.position.x = 2.7; boom.add(bm);
  const arm = new THREE.Group(); arm.position.x = 5.4; boom.add(arm);
  const am = box(3.4, 0.42, 0.42, y); am.position.x = 1.7; arm.add(am);
  const bk = new THREE.Group(); bk.position.x = 3.4; arm.add(bk);
  const bu = box(0.9, 0.9, 1.2, k); bu.position.set(0.3, -0.35, 0); bk.add(bu);
  g.userData = { tur, boom, arm, bk }; return g;
}
// tu the may dao theo pha chu ky p (0..1): xuc dat -> quay -> do len xe -> quay ve
function digPose(ex, p, yawDump = Math.PI) {
  const { tur, boom, arm, bk } = ex.userData; const sm = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
  let yaw = 0, b = 0.35, a = -1.2, c = 0.3;
  if (p < 0.35) { const u = p / 0.35; b = 0.35 - 0.75 * Math.sin(u * Math.PI); a = -1.2 - 0.6 * u; c = 0.3 + 1.2 * u; }
  else if (p < 0.55) { const u = sm((p - 0.35) / 0.2); yaw = yawDump * u; b = 0.35 + 0.25 * u; a = -1.8 + 0.4 * u; c = 1.5; }
  else if (p < 0.7) { yaw = yawDump; b = 0.6; a = -1.4; c = 1.5 - 2.2 * sm((p - 0.55) / 0.15); }
  else { const u = sm((p - 0.7) / 0.3); yaw = yawDump * (1 - u); b = 0.6 - 0.25 * u; a = -1.4 + 0.2 * u; c = -0.7 + u; }
  tur.rotation.y = yaw; boom.rotation.z = b; arm.rotation.z = a; bk.rotation.z = c;
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
// hop bao cua tung instance trong 1 nhom (lay vi tri dai, giang mong tu mo hinh Revit)
function instBoxes(holder, re) {
  const out = [], m = new THREE.Matrix4(); holder.updateMatrixWorld(true);
  holder.traverse(o => { if (!o.isMesh || !re.test(o.name)) return; if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); const n = o.isInstancedMesh ? o.count : 1;
    for (let k = 0; k < n; k++) { if (o.isInstancedMesh) { o.getMatrixAt(k, m); m.premultiply(o.matrixWorld); } else m.copy(o.matrixWorld); out.push(o.geometry.boundingBox.clone().applyMatrix4(m)); } });
  return out;
}
// ti le thoi gian lam viec (07-17h, bo Chu nhat) cua n ngay lam viec bat dau tu ngay a
function wf(t, a, n) { let d = D(a), done = 0, k = 0; while (k < n) { if (new Date(d).getDay() !== 0) { done += Math.max(0, Math.min(1, ((t - d) / H - 7) / 10)); k++; } d += DAY; } return done / n; }
const ramp = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
// ho dao: day (floor=true) hoac 4 mai doc
function pitMesh(bot, top, yb, yt, mat, floor) {
  const B = [[bot.x0, yb, bot.z0], [bot.x1, yb, bot.z0], [bot.x1, yb, bot.z1], [bot.x0, yb, bot.z1]], U = [[top.x0, yt, top.z0], [top.x1, yt, top.z0], [top.x1, yt, top.z1], [top.x0, yt, top.z1]];
  const v = []; const quad = (a, b, c, d) => v.push(...a, ...b, ...c, ...a, ...c, ...d);
  if (floor) quad(B[0], B[3], B[2], B[1]); else for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; quad(U[i], U[j], B[j], B[i]); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true; return m;
}
// luoi thep: InstancedMesh cac thanh
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
  const GL = -1.0, RY = -0.75, SW = -0.6;              // cao do mat dat tu nhien, mat duong, via he (m)
  const bld = bb("20") || new THREE.Box3().setFromCenterAndSize(C, new THREE.Vector3(43, 10, 32));
  const parts = [];
  // 1. luoi thep san tung tang (hien tu ngay CT dam san den het do BT)
  const floors = [["20", "2027-04-28", "2027-05-08"], ["21", "2027-05-20", "2027-05-28"], ["23", "2027-06-09", "2027-06-17"], ["25", "2027-06-29", "2027-07-07"], ["27", "2027-07-19", "2027-07-27"], ["29", "2027-08-07", "2027-08-16"]];
  for (const [f, a, b] of floors) { const x = bb(f); if (!x) continue; const g = rebarGrid(x, x.max.y - 0.12); scene.add(g); parts.push({ o: g, a, b }); }

  // ================= PHAN NGAM: coc -> dao dat -> dap dau coc -> BT lot -> thep dai -> VK -> BT -> lap dat
  const fts = get("12") ? instBoxes(get("12").holder, /DaiMong/i) : [];
  const beams = get("12") ? instBoxes(get("12").holder, /Concrete-Rect/i) : [];
  const FB = bb("11") ? bb("11").min.y : -3.9, PF = FB - 0.1;          // day dai; day ho dao (duoi lop BT lot 100)
  const ftR = fts.map(b => ({ x0: b.min.x, x1: b.max.x, z0: b.min.z, z1: b.max.z, cx: (b.min.x + b.max.x) / 2, cz: (b.min.z + b.max.z) / 2 })).sort((a, b) => a.cx - b.cx || a.cz - b.cz);
  const bmR = beams.map(b => ({ x0: b.min.x, x1: b.max.x, z0: b.min.z, z1: b.max.z, cx: (b.min.x + b.max.x) / 2 }));
  const all = [...ftR, ...bmR];
  const bot = all.length ? { x0: Math.min(...all.map(r => r.x0)) - 0.8, x1: Math.max(...all.map(r => r.x1)) + 0.8, z0: Math.min(...all.map(r => r.z0)) - 0.8, z1: Math.max(...all.map(r => r.z1)) + 0.8 }
    : { x0: bld.min.x, x1: bld.max.x, z0: bld.min.z, z1: bld.max.z };
  // mai doc 1:0,5 o 3 phia; phia nam (sat kho bai) dung tuong cu Larsen thang dung
  const sl = 0.5 * (GL - PF), top = { x0: bot.x0 - sl, x1: bot.x1 + sl, z0: bot.z0 - sl, z1: bot.z1 };
  // ---- bo tri lai cong trinh tam cua TMB Revit dang nam trong pham vi ho mong / mat bang nha
  const NF = s => s.normalize("NFC");
  const meshesOf = (f, key) => { const it = get(f), out = []; if (!it) return out; it.holder.updateMatrixWorld(true); it.holder.traverse(o => { if (o.isMesh && NF(o.name).includes(NF(key))) out.push(o); }); return out; };
  const elBox = list => { const b = new THREE.Box3(), m = new THREE.Matrix4(); for (const o of list) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); const n = o.isInstancedMesh ? o.count : 1;
    for (let k = 0; k < n; k++) { if (o.isInstancedMesh) { o.getMatrixAt(k, m); m.premultiply(o.matrixWorld); } else m.copy(o.matrixWorld); b.union(o.geometry.boundingBox.clone().applyMatrix4(m)); } } return b; };
  const moveBy = (list, dx, dz) => { const T = new THREE.Matrix4().makeTranslation(dx, 0, dz), m = new THREE.Matrix4(), w = new THREE.Matrix4(), wi = new THREE.Matrix4();
    for (const o of list) { if (o.isInstancedMesh) { w.copy(o.matrixWorld); wi.copy(w).invert(); for (let k = 0; k < o.count; k++) { o.getMatrixAt(k, m); m.premultiply(w).premultiply(T).premultiply(wi); o.setMatrixAt(k, m); } o.instanceMatrix.needsUpdate = true; o.computeBoundingSphere(); o.computeBoundingBox(); }
      else { m.copy(o.matrixWorld).premultiply(T).premultiply(wi.copy(o.parent.matrixWorld).invert()); m.decompose(o.position, o.quaternion, o.scale); o.updateMatrixWorld(true); } } };
  const fz = bb("01") ? [bb("01").min.z, bb("01").max.z] : [-23, 30];
  // nha xe cong nhan, bai cat, xuong thep: chuyen ra khu dat trong phia bac (sau hang rao); nha bao ve, bai thep, bai gach: lui sat hang rao nam
  for (const [f, key] of [["02", "Nơi_để_xe_công_nhân"], ["03", "Bãi_cát"], ["03", "Xưởng_gia_công_cốt_thép"]]) { const l = meshesOf(f, key); if (l.length) moveBy(l, 0, fz[0] - 1.5 - elBox(l).max.z); }
  for (const [f, key] of [["02", "Nhà_bảo_vệ"], ["03", "Bãi_chứa_thép_cây"], ["03", "Bãi_gạch_xây"]]) { const l = meshesOf(f, key); if (!l.length) continue; const b = elBox(l);
    const dz = Math.max(0, Math.min(top.z1 + 0.3 - b.min.z, fz[1] - 0.25 - b.max.z)); if (dz > 0) moveBy(l, 0, dz); }
  // duong day dien thi cong cat ngang mat bang nha: an doan nam trong ho mong
  for (const o of meshesOf("03", "Duong_dien_thi_cong")) { const b = elBox([o]); if (b.max.x > top.x0 && b.min.x < top.x1 && b.max.z > top.z0 && b.min.z < top.z1) o.visible = false; }
  // tuong cu Larsen phia nam
  const sheet = box(top.x1 - top.x0, GL - PF + 1.6, 0.18, std(0x3d4650, { metalness: 0.6, roughness: 0.5 })); sheet.position.set((top.x0 + top.x1) / 2, (GL + 0.6 + PF - 1) / 2, top.z1 + 0.09); scene.add(sheet);
  const waler = box(top.x1 - top.x0, 0.35, 0.3, std(0x8a8f96, { metalness: 0.6 })); waler.position.set(sheet.position.x, GL - 0.8, top.z1 - 0.2); scene.add(waler);
  const SOIL = std(0x8a6a45, { roughness: 1, side: THREE.DoubleSide }), SOILF = std(0x6f5536, { roughness: 1, side: THREE.DoubleSide });
  scene.add(pitMesh(bot, top, PF, GL, SOIL, false), pitMesh(bot, top, PF, GL, SOILF, true));
  // khoi dat chua dao (thu hep dan theo tien do dao) + khoi dat lap (dang len dan)
  const GRD = new THREE.MeshStandardMaterial({ color: 0xbfae86, roughness: 1 });
  const unbox = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), [SOIL, SOIL, GRD, SOIL, SOIL, SOIL]); unbox.receiveShadow = true; scene.add(unbox);
  const FILL = new THREE.MeshStandardMaterial({ color: 0x9a7b52, roughness: 1 });
  const fill = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), [SOIL, SOIL, FILL, SOIL, SOIL, SOIL]); fill.receiveShadow = true; scene.add(fill);
  // coc khoan nhoi D600: 4 coc/dai don, 6 coc/dai lon
  const piles = [];
  for (const r of ftR) { const w = r.x1 - r.x0, d = r.z1 - r.z0, e = 0.75;
    if (Math.max(w, d) > 3.6) { const L = w > d; for (const a of [-1, 0, 1]) for (const b of [-1, 1]) piles.push(L ? [r.cx + a * (w / 2 - e), r.cz + b * (d / 2 - e)] : [r.cx + b * (w / 2 - e), r.cz + a * (d / 2 - e)]); }
    else for (const a of [-1, 1]) for (const b of [-1, 1]) piles.push([r.cx + a * (w / 2 - e), r.cz + b * (d / 2 - e)]); }
  piles.sort((a, b) => a[0] - b[0] || a[1] - b[1]); const NP = piles.length, per = Math.max(1, Math.ceil(NP / 6));
  const PG = new THREE.CylinderGeometry(0.3, 0.3, 1, 12); PG.translate(0, 0.5, 0);
  const pileM = new THREE.InstancedMesh(PG, std(0xb8b4ac, { roughness: 0.9 }), Math.max(1, NP)); pileM.castShadow = true; scene.add(pileM);
  const capM = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.42, 0.42, 0.12, 12), std(0x4a4a4a, { metalness: 0.5 }), Math.max(1, NP)); scene.add(capM);
  // be tong lot (dai + giang) va cot thep dai (2 lop luoi + thep cho cot), tien hanh tu tay sang dong
  const lean = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), std(0x9c9a95, { roughness: 0.95 }), Math.max(1, all.length)); lean.receiveShadow = true; scene.add(lean);
  { const o = new THREE.Object3D(); [...all].sort((a, b) => a.cx - b.cx).forEach((r, k) => { o.position.set((r.x0 + r.x1) / 2, PF + 0.05, (r.z0 + r.z1) / 2); o.scale.set(r.x1 - r.x0 + 0.2, 0.1, r.z1 - r.z0 + 0.2); o.updateMatrix(); lean.setMatrixAt(k, o.matrix); }); }
  const bars = [], ftCount = [];
  { const o = new THREE.Object3D(); const add = (x, y, z, len, ry, rz = 0) => { o.position.set(x, y, z); o.rotation.set(0, ry, rz); o.scale.set(len, 1, 1); o.updateMatrix(); bars.push(o.matrix.clone()); };
    for (const r of ftR) { const w = r.x1 - r.x0 - 0.1, d = r.z1 - r.z0 - 0.1;
      for (const ly of [FB + 0.08, FB + 0.75]) { for (let z = r.z0 + 0.1; z < r.z1 - 0.05; z += 0.2) add(r.cx, ly, z, w, 0); for (let x = r.x0 + 0.1; x < r.x1 - 0.05; x += 0.2) add(x, ly + 0.03, r.cz, d, Math.PI / 2); }
      for (const a of [-0.22, 0, 0.22]) for (const b of [-0.22, 0, 0.22]) if (a || b) add(r.cx + a, FB + 1.5, r.cz + b, 2.9, 0, Math.PI / 2);
      ftCount.push(bars.length); } }
  const rebarF = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.028, 0.028), std(0x9c3d1c, { metalness: 0.6, roughness: 0.45 }), Math.max(1, bars.length)); bars.forEach((m, k) => rebarF.setMatrixAt(k, m)); rebarF.count = 0; scene.add(rebarF);
  // may dao (2 may dao + 1 may sua ho/lap dat) + 2 xe ben dang nhan dat
  const exs = [makeExcavator(), makeExcavator(), makeExcavator()]; exs.forEach(e => { e.traverse(o => { if (o.isMesh) o.castShadow = true; }); scene.add(e); });
  const loadT = [makeTruck("dump"), makeTruck("dump")]; loadT.forEach(t => scene.add(t));
  // may khoan coc (6 may), moi may phu trach 1 dai coc theo thu tu tu tay sang dong
  const rigs = []; for (let i = 0; i < 6; i++) { const r = makeRig(); scene.add(r); rigs.push(r); }

  // 3. xe bom + 2 xe bon tren via he phia nam, chi hien ngay do BT
  const pours = [["2027-04-08", "2027-04-13", 0], ["2027-04-23", "2027-04-24", 1], ["2027-05-06", "2027-05-08", 1], ["2027-05-15", "2027-05-17", 2], ["2027-05-26", "2027-05-28", 2], ["2027-06-04", "2027-06-05", 3], ["2027-06-15", "2027-06-17", 3], ["2027-06-24", "2027-06-25", 4], ["2027-07-05", "2027-07-07", 4], ["2027-07-14", "2027-07-15", 5], ["2027-07-24", "2027-07-27", 5], ["2027-08-03", "2027-08-04", 6], ["2027-08-13", "2027-08-16", 6]];
  const pump = makePump(); const mix1 = makeTruck("mixer"), mix2 = makeTruck("mixer");
  const pz = bld.max.z + 9, px = (bld.min.x + bld.max.x) / 2;
  pump.position.set(px, SW, pz); mix1.position.set(px - 11, SW, pz + 1); mix2.position.set(px - 22, SW, pz + 1);
  scene.add(pump, mix1, mix2);
  // 4. cong nhan
  const workers = []; for (let i = 0; i < 36; i++) { const w = makeWorker(); scene.add(w); workers.push({ o: w, s: Math.random() * 1000, r: 0.3 + Math.random() * 0.7 }); }

  // ================= DUONG GIAO THONG theo duong nhua Revit (phia nam z 33-48,5; phia tay x -39..-24), noi dai ra ngoai
  const XE = 190, ZE = -170;
  // lan 0: phan duong trong (gan cong truong); lan 1: phan duong ngoai, chieu nguoc lai
  const LANES = [[[XE, 37.3], [-26.8, 37.3], [-26.8, ZE]], [[-35.5, ZE], [-35.5, 39.5], [-27.5, 45.5], [XE, 45.5]]].map(pts => {
    const seg = []; let L = 0; for (let i = 1; i < pts.length; i++) { const [x0, z0] = pts[i - 1], [x1, z1] = pts[i]; const l = Math.hypot(x1 - x0, z1 - z0); seg.push({ x0, z0, dx: (x1 - x0) / l, dz: (z1 - z0) / l, l, s: L }); L += l; } return { seg, L }; });
  const along = (u, lane = 0) => { const P = LANES[lane % 2]; let d = ((u % 1) + 1) % 1 * P.L; const g = P.seg.find(q => d < q.s + q.l) || P.seg[P.seg.length - 1]; d -= g.s;
    return [g.x0 + g.dx * d, g.z0 + g.dz * d, Math.atan2(-g.dz, g.dx)]; };
  const place = (o, u, lane, off = 0) => { const [x, z, a] = along(u, lane); o.position.set(x + Math.sin(a) * off, RY, z + Math.cos(a) * off); o.rotation.y = a; };
  const decor = new THREE.Group(); scene.add(decor);
  const strip = (x0, x1, z0, z1, y, c) => { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.3, z1 - z0), std(c, { roughness: 0.95 })); m.position.set((x0 + x1) / 2, y - 0.15, (z0 + z1) / 2); m.receiveShadow = true; decor.add(m); };
  const ASP = 0x55585c, SWC = 0xb3ada4, MED = 0x5f8f3a;
  for (const [z0, z1, y, c] of [[30.5, 33, SW, SWC], [33, 41, RY - 0.01, ASP], [41, 42.5, SW, MED], [42.5, 48.5, RY - 0.01, ASP], [48.5, 52.5, SW, SWC]]) strip(51.5, XE + 10, z0, z1, y, c);
  for (const [x0, x1, y, c] of [[-23.5, -20.5, SW, SWC], [-30, -23.5, RY - 0.01, ASP], [-32.5, -30, SW, MED], [-39, -32.5, RY - 0.01, ASP], [-42.5, -39, SW, SWC]]) strip(x0, x1, ZE - 10, -21.5, y, c);
  const DASH = std(0xf2f2f2, { roughness: 0.6 });
  for (let x = 56; x < XE; x += 6) for (const z of [37, 45.5]) { const m = new THREE.Mesh(new THREE.BoxGeometry(3, 0.02, 0.15), DASH); m.position.set(x, RY + 0.005, z); decor.add(m); }
  for (let z = -26; z > ZE; z -= 6) for (const x of [-26.8, -35.7]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.02, 3), DASH); m.position.set(x, RY + 0.005, z); decor.add(m); }
  // cay xanh tren via he ngoai (va via he trong o doan noi dai), den duong 2 canh tren dai phan cach
  const tree = (x, z) => { const t = makeTree(5 + Math.random() * 3); t.position.set(x, SW, z); decor.add(t); };
  for (let x = -36; x < XE; x += 11) tree(x, 50.8);
  for (let z = 40; z > ZE; z -= 11) tree(-40.8, z);
  for (let x = 58; x < XE; x += 11) tree(x, 31.7);
  for (let z = -30; z > ZE; z -= 11) tree(-22, z);
  const lamp = (x, z, r) => { const l = makeLamp(); l.position.set(x, SW, z); l.rotation.y = r; decor.add(l); };
  for (let x = -20; x < XE; x += 26) { lamp(x, 41.75, Math.PI / 2); lamp(x, 41.75, -Math.PI / 2); }
  for (let z = 26; z > ZE; z -= 26) { lamp(-31.25, z, 0); lamp(-31.25, z, Math.PI); }
  // nha dan: lui sau via he >= 3,5 m, cach nhau 5-11 m, khong de len duong / cong truong
  const bcol = [0xe8dcc8, 0xd6e4f0, 0xf2e6d0, 0xcfd8dc, 0xf0d9c5, 0xdfe6d8, 0xe6d3b3, 0xd9e2c4]; let seed = 7; const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  const house = (cx, cz, w, d, h) => { const b = box(w, h, d, std(bcol[Math.floor(rnd() * bcol.length)])); b.position.set(cx, GL + h / 2, cz); b.receiveShadow = true; decor.add(b);
    const rf = box(w + 0.4, 0.4, d + 0.4, std([0x8d6e63, 0xa1503a, 0x6d7b8a][Math.floor(rnd() * 3)])); rf.position.set(cx, GL + h + 0.2, cz); decor.add(rf);
    for (let k = 1; k < h / 3.3 - 0.5; k++) { const wb = box(w * 0.7, 0.9, d + 0.06, std(0x34495e, { roughness: 0.25 })); wb.castShadow = false; wb.position.set(cx, GL + k * 3.3 - 1.2, cz); decor.add(wb); } };
  const H3 = () => 3.6 + Math.floor(rnd() * 4) * 3.3;
  for (let x = -34; x < XE - 8;) { const w = 10 + rnd() * 8, d = 10 + rnd() * 5; house(x + w / 2, 56 + d / 2, w, d, H3()); x += w + 5 + rnd() * 6; }      // phia nam (ngoai duong)
  for (let z = 38; z > ZE + 8;) { const w = 10 + rnd() * 8, d = 10 + rnd() * 5; house(-46 - d / 2, z - w / 2, d, w, H3()); z -= w + 5 + rnd() * 6; }  // phia tay (ngoai duong)
  house(-60, 66, 18, 16, 13.5);                                                                                                                     // nha goc nga tu
  for (let x = -14; x < 58;) { const w = 10 + rnd() * 8, d = 10 + rnd() * 4; house(x + w / 2, -42 - d / 2, w, d, H3()); x += w + 6 + rnd() * 6; }      // phia bac
  for (let z = 20; z > -50;) { const w = 10 + rnd() * 8, d = 10 + rnd() * 4; house(64 + d / 2, z - w / 2, d, w, H3()); z -= w + 6 + rnd() * 6; }       // phia dong
  // ================= SAN VUON sau khi thao do cong trinh tam (tu 09/12): co, loi di, cay xanh, bon hoa, bui cay
  const land = new THREE.Group(); land.visible = false; scene.add(land);
  const fb = bb("01") || new THREE.Box3(new THREE.Vector3(-20, 0, -23), new THREE.Vector3(51, 0, 30));
  const F = { x0: fb.min.x + 0.6, x1: fb.max.x - 0.6, z0: fb.min.z + 0.6, z1: fb.max.z - 0.6 };
  const pad = (x0, x1, z0, z1, y, c) => { if (x1 <= x0 || z1 <= z0) return; const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.12, z1 - z0), std(c, { roughness: 1 })); m.position.set((x0 + x1) / 2, y - 0.06, (z0 + z1) / 2); m.receiveShadow = true; land.add(m); };
  const B = { x0: bld.min.x - 2.5, x1: bld.max.x + 2.5, z0: bld.min.z - 2.5, z1: bld.max.z + 2.5 };
  const GRASS = 0x5e9b3e, PAVE = 0xd6cfc0, YARD = 0xc2bcae;
  pad(F.x0, F.x1, F.z0, F.z1, GL + 0.05, GRASS);                                   // co phu toan khu dat
  pad(B.x0, B.x1, B.z0, B.z1, GL + 0.08, PAVE);                                    // loi di bao quanh nha rong 2,5 m
  pad(F.x0, F.x1, B.z1, F.z1, GL + 0.09, YARD);                                    // san truoc phia nam (giap duong chinh)
  pad(B.x1 + 6, F.x1, F.z0 + 2, F.z0 + 14, GL + 0.09, 0x8f8d88);                   // bai do xe phia dong
  for (let z = F.z0 + 2.5; z < F.z0 + 14; z += 2.6) { const l = new THREE.Mesh(new THREE.BoxGeometry(5, 0.02, 0.1), DASH); l.position.set(F.x1 - 2.6, GL + 0.1, z); land.add(l); }
  const ltree = (x, z, h = 5 + Math.random() * 3) => { const t = makeTree(h); t.position.set(x, GL + 0.05, z); land.add(t); };
  const BUSH = [std(0x2f6f2a), std(0x3d7f33), std(0x4a8a3a)], FLW = [std(0xe94f64), std(0xf5d33a), std(0xf08bd0), std(0xffffff)];
  const bush = (x, z, r = 0.7) => { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), BUSH[Math.floor(Math.random() * 3)]); b.position.set(x, GL + 0.05 + r * 0.7, z); b.castShadow = true; land.add(b); };
  const bed = (x, z, r = 1.6) => { const s = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.35, 16), std(0x9c8f7a)); s.position.set(x, GL + 0.2, z); land.add(s);
    const sl = new THREE.Mesh(new THREE.CylinderGeometry(r - 0.12, r - 0.12, 0.05, 16), std(0x4e3b28)); sl.position.set(x, GL + 0.38, z); land.add(sl);
    for (let k = 0; k < 14; k++) { const a = k * 2.4, rr = (r - 0.35) * Math.sqrt((k + 0.5) / 14); const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), FLW[k % 4]); f.position.set(x + Math.cos(a) * rr, GL + 0.55, z + Math.sin(a) * rr); land.add(f); } };
  // hang cay sat hang rao (bac, dong, tay) va hang cay tren via he ngoai cong
  for (let x = F.x0 + 1.5; x < F.x1; x += 7) ltree(x, F.z0 + 1.6);
  for (let z = F.z0 + 17; z < B.z1 - 1; z += 7) ltree(F.x1 - 1.6, z);

  for (let x = fb.min.x + 4; x < fb.max.x; x += 10) ltree(x, 31.7);
  for (let z = fb.min.z + 4; z < fb.max.z; z += 10) ltree(-22, z);
  // vuon hoa phia dong (thay cho khu lan trai cu) + bui cay vien loi di
  for (let i = 0; i < 9; i++) ltree(B.x1 + 4 + (i % 3) * 5.5 + Math.random(), F.z0 + 18 + Math.floor(i / 3) * 7 + Math.random());
  bed(B.x1 + 11, B.z1 - 4); bed((B.x0 + B.x1) / 2 - 10, (B.z1 + F.z1) / 2, 1.8); bed((B.x0 + B.x1) / 2 + 10, (B.z1 + F.z1) / 2, 1.8);
  for (let x = B.x0 + 1; x < B.x1; x += 3.2) { bush(x, B.z0 - 0.8); } for (let z = B.z0 + 1; z < B.z1; z += 3.2) { bush(B.x1 + 0.8, z); bush(B.x0 - 0.8, z, 0.55); }
  // ghe da + cot co truoc san
  for (const [x, z] of [[B.x1 + 6, B.z1 - 8], [B.x1 + 12, B.z1 - 10], [B.x1 + 8, F.z0 + 22]]) { const s = box(1.8, 0.45, 0.5, std(0x8d8478)); s.position.set(x, GL + 0.3, z); land.add(s); }
  { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 11, 8), std(0xdddddd, { metalness: 0.6 })); p.position.set(F.x0 + 6, GL + 5.5, F.z1 - 2); land.add(p);
    const fl = box(2.4, 1.6, 0.04, std(0xd62828)); fl.position.set(F.x0 + 7.25, GL + 10.1, F.z1 - 2); land.add(fl); }
  // phuong tien
  const cars = []; const cols = [0xc0392b, 0xecf0f1, 0x2c3e50, 0x2980b9, 0x7f8c8d, 0xf1c40f, 0x16a085, 0x8e44ad];
  for (let i = 0; i < 10; i++) { const c = makeCar(cols[i % 8]); scene.add(c); cars.push({ o: c, s: i / 10 }); }
  const dumps = [makeTruck("dump"), makeTruck("dump")]; dumps.forEach(d => scene.add(d));
  const bus = makeBus(); scene.add(bus); const bikes = [0x1565c0, 0xc62828, 0x2e7d32, 0x212121, 0xf9a825, 0x6a1b9a].map(c => { const b = makeBike(c); scene.add(b); return b; });
  // ================= GIAN GIAO NGOAI + LUOI BAO CHE DUNG (thay nhom 31 Revit: cot/luoi bi xoay nam ngang khi xuat FBX)
  const sc = get("31"); let SR = null, SH = 23.5;
  if (sc) { const l = meshesOf("31", "cot_dung"); const b = l.length ? elBox(l) : sc.box; SR = { x0: b.min.x, x1: b.max.x, z0: b.min.z, z1: b.max.z }; SH = sc.box.max.y; sc.holder.children.forEach(c => { c.visible = false; }); }
  const scaf = new THREE.Group(); scaf.visible = false; scene.add(scaf); let tubeM = null, plankM = null, tubeY = [], plankY = [], nets = [];
  if (SR) {
    const X = new THREE.Vector3(1, 0, 0), q = new THREE.Vector3(), o = new THREE.Object3D(), tubes = [], planks = [];
    const tube = (ax, ay, az, bx, by, bz) => { q.set(bx - ax, by - ay, bz - az); const L = q.length(); o.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2); o.quaternion.setFromUnitVectors(X, q.normalize()); o.scale.set(L, 1, 1); o.updateMatrix(); tubes.push({ y: Math.max(ay, by), m: o.matrix.clone() }); };
    const W = 1.05, rects = [SR, { x0: SR.x0 + W, x1: SR.x1 - W, z0: SR.z0 + W, z1: SR.z1 - W }];
    const perim = (r, f) => { for (let x = r.x0; x <= r.x1 + 0.01; x += (r.x1 - r.x0) / Math.round((r.x1 - r.x0) / 1.8)) { f(x, r.z0); f(x, r.z1); } for (let z = r.z0; z <= r.z1 + 0.01; z += (r.z1 - r.z0) / Math.round((r.z1 - r.z0) / 1.8)) { f(r.x0, z); f(r.x1, z); } };
    for (let y = GL; y < SH - 0.1; y += 2) {
      const y1 = Math.min(SH, y + 2);
      for (const r of rects) { perim(r, (x, z) => tube(x, y, z, x, y1, z));                                   // cot dung D49 tung doan 2 m
        tube(r.x0, y1, r.z0, r.x1, y1, r.z0); tube(r.x0, y1, r.z1, r.x1, y1, r.z1); tube(r.x0, y1, r.z0, r.x0, y1, r.z1); tube(r.x1, y1, r.z0, r.x1, y1, r.z1); } // thanh giang ngang
      // giang cheo mat ngoai (cach 2 nhip)
      const r = SR, nx = Math.round((r.x1 - r.x0) / 1.8), nz = Math.round((r.z1 - r.z0) / 1.8), sx = (r.x1 - r.x0) / nx, sz = (r.z1 - r.z0) / nz;
      for (let k = 0; k < nx; k += 4) { tube(r.x0 + k * sx, y, r.z0, r.x0 + (k + 1) * sx, y1, r.z0); tube(r.x0 + k * sx, y, r.z1, r.x0 + (k + 1) * sx, y1, r.z1); }
      for (let k = 0; k < nz; k += 4) { tube(r.x0, y, r.z0 + k * sz, r.x0, y1, r.z0 + (k + 1) * sz); tube(r.x1, y, r.z0 + k * sz, r.x1, y1, r.z0 + (k + 1) * sz); }
    }
    // san thao tac (van go) tai moi tang, nam giua 2 hang cot
    for (const y of [4.2, 8.4, 12.0, 15.6, 19.2, 22.6].filter(v => v < SH)) { const r = SR;
      for (const [cx, cz, sx, sz] of [[(r.x0 + r.x1) / 2, r.z0 + W / 2, r.x1 - r.x0, W], [(r.x0 + r.x1) / 2, r.z1 - W / 2, r.x1 - r.x0, W], [r.x0 + W / 2, (r.z0 + r.z1) / 2, W, r.z1 - r.z0 - 2 * W], [r.x1 - W / 2, (r.z0 + r.z1) / 2, W, r.z1 - r.z0 - 2 * W]]) {
        o.position.set(cx, y, cz); o.quaternion.identity(); o.scale.set(sx, 0.05, sz); o.updateMatrix(); planks.push({ y, m: o.matrix.clone() }); } }
    tubes.sort((a, b) => a.y - b.y); planks.sort((a, b) => a.y - b.y); tubeY = tubes.map(t => t.y); plankY = planks.map(p => p.y);
    tubeM = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.05, 0.05), std(0x9aa3ad, { metalness: 0.6, roughness: 0.4 }), tubes.length); tubes.forEach((t, k) => tubeM.setMatrixAt(k, t.m)); tubeM.castShadow = true; scaf.add(tubeM);
    plankM = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), std(0xb08850, { roughness: 0.9 }), planks.length); planks.forEach((p, k) => plankM.setMatrixAt(k, p.m)); scaf.add(plankM);
    // luoi xanh bao che: 4 mat dung phia ngoai, van luoi
    const cv = document.createElement("canvas"); cv.width = cv.height = 64; const cx2 = cv.getContext("2d"); cx2.fillStyle = "#2f9a4c"; cx2.fillRect(0, 0, 64, 64); cx2.strokeStyle = "#1d6b33"; cx2.lineWidth = 3;
    for (let k = 0; k <= 64; k += 16) { cx2.beginPath(); cx2.moveTo(k, 0); cx2.lineTo(k, 64); cx2.stroke(); cx2.beginPath(); cx2.moveTo(0, k); cx2.lineTo(64, k); cx2.stroke(); }
    const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace;
    const NETM = new THREE.MeshStandardMaterial({ map: tex, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false, roughness: 0.9 });
    const off = 0.12;
    for (const [cx, cz, w, ry] of [[(SR.x0 + SR.x1) / 2, SR.z0 - off, SR.x1 - SR.x0, 0], [(SR.x0 + SR.x1) / 2, SR.z1 + off, SR.x1 - SR.x0, 0], [SR.x0 - off, (SR.z0 + SR.z1) / 2, SR.z1 - SR.z0, Math.PI / 2], [SR.x1 + off, (SR.z0 + SR.z1) / 2, SR.z1 - SR.z0, Math.PI / 2]]) {
      const g = new THREE.PlaneGeometry(1, 1); g.translate(0, 0.5, 0); const t2 = tex.clone(); t2.needsUpdate = true; t2.repeat.set(w / 2, (SH - GL) / 2);
      const m = new THREE.Mesh(g, NETM.clone()); m.material.map = t2; m.position.set(cx, GL, cz); m.rotation.y = ry; m.scale.set(w, SH - GL, 1); m.renderOrder = 2; scaf.add(m); nets.push(m); }
  }
  // diem dung hop le cua cong nhan tren tung san (do bang tia chieu xuong san BT, cach mep >= 1 m)
  const rc = new THREE.Raycaster(), DOWN = new THREE.Vector3(0, -1, 0), V = new THREE.Vector3();
  const LVL = [["14", "2027-04-19"], ["20", "2027-04-26"], ["21", "2027-05-12"], ["23", "2027-06-01"], ["25", "2027-06-21"], ["27", "2027-07-10"], ["29", "2027-07-30"]].map(([f, from]) => {
    const slabs = meshesOf(f, "Floor"), ty = bb(f) ? bb(f).max.y : 0, pts = [];
    const hy = (px, pz) => { rc.set(V.set(px, ty + 3, pz), DOWN); const h = rc.intersectObjects(slabs, false)[0]; return h && h.point.y > ty - 0.8 ? h.point.y : null; };
    if (slabs.length) for (let x = bld.min.x + 1; x < bld.max.x - 1; x += 2.2) for (let z = bld.min.z + 1; z < bld.max.z - 1; z += 2.2) { const y = hy(x, z); if (y === null) continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].every(([a, b]) => { const yy = hy(x + a, z + b); return yy !== null && Math.abs(yy - y) < 0.25; })) pts.push([x, y, z]); }
    return { from: D(from), pts }; }).filter(l => l.pts.length);
  const curLvl = t => { let k = 0; LVL.forEach((l, i) => { if (t >= l.from) k = i; }); return k; };
  const o3 = new THREE.Object3D(), Z0 = new THREE.Matrix4().makeScale(0, 0, 0);
  const T = { pile0: D("2027-02-22") + 7 * H, pile1: D("2027-03-27") + 17 * H, dig: D("2027-03-29"), hand: D("2027-03-31"), lean: D("2027-04-02"), reb: D("2027-04-03"), conc: D("2027-04-08"), fill0: D("2027-04-15") + 7 * H, fill1: D("2027-04-18") + 17 * H };
  const fmtY = y => (y >= 0 ? "+" : "") + y.toFixed(2).replace(".", ",");

  const update = function (t, sec, env = { working: true, night: false, rain: false }) {
    LAMP.emissiveIntensity = env.night || env.rain ? 2.2 : 0;
    let note = "";
    place(bus, 0.3 + sec * 0.01, 1, -1.2);
    bikes.forEach((b, i) => place(b, i / 6 + sec * 0.035, i % 2, (i % 3 - 1) * 1.2 + 2));
    for (const p of parts) p.o.visible = inW(t, p.a, p.b);
    // ---- coc khoan nhoi: 6 may, moi may 1 doan coc
    const uP = ramp(t, T.pile0, T.pile1), loc = Math.min(per, Math.floor(uP * per));
    const drill = t >= T.pile0 - 2 * DAY && t < T.pile1;
    rigs.forEach((r, i) => { r.visible = drill; if (!drill) return; const p = piles[Math.min(NP - 1, i * per + Math.min(per - 1, loc))] || [C.x, C.z];
      r.position.set(p[0] - 2.5, GL, p[1]); r.children[3].position.y = 8 + Math.sin(sec * 0.8 + i) * 2.5; });
    // ---- dao dat: may 29-30/03 (90%), thu cong + dap dau coc 31/03-01/04 (10%)
    const uM = wf(t, "2027-03-29", 2), uH = wf(t, "2027-03-31", 2), uDig = 0.9 * uM + 0.1 * uH;
    const front = top.x0 + (top.x1 - top.x0) * uDig;
    unbox.visible = uDig < 0.999; if (unbox.visible) { unbox.scale.set(top.x1 - front, GL - PF, top.z1 - top.z0); unbox.position.set((front + top.x1) / 2, (GL + PF) / 2 + 0.005, (top.z0 + top.z1) / 2); }
    const beforeConc = t < T.conc + 12 * H;
    for (let k = 0; k < NP; k++) { const [x, z] = piles[k]; const done = uP >= 1 || (k % per) < loc; const dug = t >= T.dig && x < front - 0.5;
      if (done && !dug && t >= T.pile0) { o3.position.set(x, GL + 0.03, z); o3.scale.set(1, 1, 1); o3.updateMatrix(); capM.setMatrixAt(k, o3.matrix); } else capM.setMatrixAt(k, Z0);
      if (dug && beforeConc) { const ty = uH > (k + 0.5) / NP ? FB + 0.1 : FB + 1.0; o3.position.set(x, PF - 0.6, z); o3.scale.set(1, ty - PF + 0.6, 1); o3.updateMatrix(); pileM.setMatrixAt(k, o3.matrix); } else pileM.setMatrixAt(k, Z0); }
    capM.instanceMatrix.needsUpdate = pileM.instanceMatrix.needsUpdate = true;
    // ---- BT lot 02/04; cot thep dai 03-07/04
    const uL = wf(t, "2027-04-02", 1); lean.count = t < T.fill1 ? Math.floor(uL * all.length + 1e-6) : 0;
    const uR = wf(t, "2027-04-03", 5), nf = Math.floor(uR * ftR.length + 1e-6); rebarF.count = t < T.fill0 && nf > 0 ? ftCount[nf - 1] : 0;
    // ---- lap dat 15-18/04
    const uF = ramp(t, T.fill0, T.fill1), fy = PF + (GL - PF) * uF; fill.visible = uF > 0;
    if (fill.visible) { fill.scale.set(top.x1 - top.x0, fy - PF, top.z1 - top.z0); fill.position.set((top.x0 + top.x1) / 2, (fy + PF) / 2 + 0.004, (top.z0 + top.z1) / 2); FILL.color.set(uF >= 1 ? 0xbfae86 : 0x9a7b52); }
    // ---- may dao + xe ben nhan dat
    const digM = t >= T.dig && uM < 1 && t < T.hand, handM = t >= T.hand && t < T.lean, fillM = uF > 0 && uF < 1;
    exs.forEach((e, i) => { const vis = i < 2 ? digM : (fillM || handM); e.visible = vis; if (!vis) return;
      const ph = env.working ? (sec * 0.11 + i * 0.37) % 1 : 0.05;
      if (i < 2) { e.position.set(Math.min(front + 4.5, top.x1 + 3), GL, top.z0 + (top.z1 - top.z0) * (i ? 0.72 : 0.28)); e.rotation.y = Math.PI; digPose(e, ph, Math.PI); }
      else if (fillM) { e.position.set(bot.x0 + 4 + (bot.x1 - bot.x0 - 8) * ((uF * 3) % 1), fy, bot.z1 - 4); e.rotation.y = Math.PI / 2; digPose(e, ph, Math.PI / 2); }
      else { e.position.set(bot.x0 + 4 + (bot.x1 - bot.x0 - 8) * uH, PF, bot.z0 + 3); e.rotation.y = -Math.PI / 2; digPose(e, ph, Math.PI / 2); } });
    land.visible = t >= D("2027-12-09");
    // gian giao: dung len 17/08-24/08, thao tu tren xuong 30/10-06/11
    if (tubeM) { const hS = GL + (SH - GL) * ramp(t, D("2027-08-17"), D("2027-08-24") + 17 * H) * (1 - ramp(t, D("2027-10-30"), D("2027-11-06")));
      scaf.visible = hS > GL + 0.3; if (scaf.visible) { let n = 0; while (n < tubeY.length && tubeY[n] <= hS + 0.01) n++; tubeM.count = n; n = 0; while (n < plankY.length && plankY[n] <= hS) n++; plankM.count = n;
        const nh = Math.max(0.01, Math.min(SH, hS) - GL); for (const m of nets) { m.scale.y = nh; m.material.map.repeat.y = nh / 2; } } }
    sheet.visible = t >= D("2027-03-26") && t < T.fill1; waler.visible = t >= T.dig && t < T.fill0;
    loadT.forEach((tr, i) => { tr.visible = digM; if (digM) { tr.position.set(Math.min(front + 13, top.x1 + 11), GL, top.z0 + (top.z1 - top.z0) * (i ? 0.72 : 0.28)); tr.userData.soil.visible = ((sec * 0.11 + i * 0.37) % 1) > 0.6; } });
    // ---- ghi chu chi tiet phan ngam
    if (t >= T.pile0 - DAY && t < T.pile1 + DAY) note = `🔩 Cọc khoan nhồi D600: đã thi công ${uP >= 1 ? NP : loc * 6}/${NP} cọc · 6 máy khoan (khoan tạo lỗ → hạ lồng thép → đổ BT → rút ống vách)`;
    else if (t >= T.dig && t < T.hand) note = `⛏ Đào đất hố móng bằng máy: ${Math.round(uDig * 100)}% khối lượng · 2 máy đào + xe ben chở đất · đáy hố ${fmtY(PF)} m, mái dốc 1:0,5`;
    else if (t >= T.hand && t < T.lean) note = `🔨 Đào sửa thủ công, đập đầu cọc: ${Math.floor(uH * NP)}/${NP} cọc (cắt về cao độ ${fmtY(FB + 0.1)} m)`;
    else if (t >= T.lean && t < T.reb) note = `🧱 Đổ bê tông lót móng dày 100: ${lean.count}/${all.length} đài, giằng`;
    else if (t >= T.reb && t < D("2027-04-08")) note = `🔧 Cốt thép đài, giằng móng: ${nf}/${ftR.length} đài (2 lớp lưới + thép chờ cột)` + (t >= D("2027-04-06") ? " · lắp ván khuôn" : "");
    else if (t >= T.conc && t < D("2027-04-14")) note = "🚚 Đổ bê tông đài, giằng móng bằng xe bơm cần + xe bồn; bảo dưỡng ẩm";
    else if (t >= D("2027-04-14") && t < T.fill0) note = "🪵 Tháo ván khuôn đài, giằng; thi công cổ cột";
    else if (t >= T.fill0 && t < T.fill1 + 14 * H) note = `🚜 Lấp đất, cát đệm hố móng, đầm chặt K=0,95: cao độ lấp ${fmtY(fy)} m (${Math.round(uF * 100)}%)`;
    // ---- xe bom
    const pr = pours.find(p => inW(t, p[0], p[1]));
    pump.visible = mix1.visible = mix2.visible = !!pr;
    if (pr) { const f = pr[2]; const s = pump.userData.segs;
      pump.userData.turret.rotation.y = Math.PI / 2 + Math.sin(sec * 0.4) * 0.35;
      const lift = 0.25 + f * 0.09; s[0].rotation.z = lift + 0.35; s[1].rotation.z = -0.55 + f * 0.04; s[2].rotation.z = -0.75 + Math.sin(sec * 0.6) * 0.08;
      [mix1, mix2].forEach(m => { if (m.userData.drum) m.userData.drum.rotation.x = sec * 2; }); }
    // ---- xe ben cho dat tren duong, o to
    const dig = inW(t, "2027-03-29", "2027-04-01");
    dumps.forEach((d, i) => { d.visible = dig; if (dig) place(d, sec * 0.02 + i * 0.5, i, 0); });
    cars.forEach((c, i) => place(c.o, c.s + sec * 0.025, i % 2, i % 2 ? 1.5 : -1.5));
    // ---- cong nhan
    const active = env.working && t >= D("2027-02-15") && t < D("2027-12-11");
    workers.forEach((w, i) => { w.o.visible = active; if (!active) return;
      const ang = w.s + sec * w.r * 0.5; let x, y, z;
      if (drill && t >= T.pile0) { const r = rigs[i % 6]; x = r.position.x + 2.5 + Math.cos(ang) * 3.5; z = r.position.z + Math.sin(ang) * 3.5; y = GL; }
      else if (t >= T.dig && t < T.fill0 && ftR.length) { const f = ftR[(i * 7) % ftR.length]; x = f.cx + Math.cos(ang) * 1.6; z = f.cz + Math.sin(ang) * 1.6;
        if (t < T.hand && x > front - 2) { w.o.visible = false; return; } y = PF + (t >= T.lean ? 0.1 : 0); }
      else if (t >= T.fill0 && t < D("2027-04-19")) { x = top.x0 + ((i % 9) + 0.5) / 9 * (top.x1 - top.x0) + Math.cos(ang); z = top.z0 + (Math.floor(i / 9) + 0.5) / 4 * (top.z1 - top.z0) + Math.sin(ang); y = t >= T.fill1 ? 0 : fy; }
      else if (t >= D("2027-04-19") && LVL.length) { let k = t >= D("2027-08-17") ? i % LVL.length : curLvl(t); if (t < D("2027-08-17") && k > 0 && (i % 3 === 0 || (k === LVL.length - 1 && i % 2))) k--; const L = LVL[k], p = L.pts[(i * 37) % L.pts.length];
        x = p[0] + Math.cos(ang) * 0.8; y = p[1]; z = p[2] + Math.sin(ang) * 0.8; }
      else { y = t < T.pile0 ? GL : 0; const gx = (i % 6 + 0.5) / 6, gz = (Math.floor(i / 6) + 0.5) / 6;
        x = bld.min.x + gx * (bld.max.x - bld.min.x) + Math.cos(ang) * 1.5; z = bld.min.z + gz * (bld.max.z - bld.min.z) + Math.sin(ang) * 1.5; }
      w.o.position.set(x, y + Math.abs(Math.sin(sec * 6 + i)) * 0.05, z); w.o.rotation.y = -ang; });
    return note;
  };
  update.pit = top; update.GL = GL; update.stats = { piles: NP, footings: ftR.length, beams: bmR.length, PF };
  return update;
}
