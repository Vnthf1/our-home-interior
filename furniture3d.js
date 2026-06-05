// 주방 가구 인터랙티브 3D — KITCHEN(data.js) 치수로 박스 모델 생성.
// 드래그=회전 · 휠=줌 · 우클릭드래그=이동 · 마우스 올리면 치수 툴팁.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const wrap = document.getElementById("kz3d-wrap");
const tip = document.getElementById("kz3d-tip");
const K = window.KITCHEN;
if (!wrap || !K) throw new Error("kz3d: 컨테이너 또는 KITCHEN 없음");

const S = 0.001; // mm → m

/* ---- KITCHEN 치수 계산 (평면도와 동일) ---- */
const T = K.tall, ISL = K.island;
let cx = 0; const segs = T.segs.map((s) => { const o = Object.assign({ x: cx }, s); cx += s.w; return o; });
const runW = cx, runD = T.depth, runH = T.height;
const pillarX = runW, pillarW = T.pillar.w, pillarR = runW + pillarW;
const barW = ISL.bar.w, barD = ISL.bar.d, H = ISL.bar.height, armW = ISL.arm.w, armD = ISL.arm.d;
const barR = pillarR, barX = barR - barW, armX = barR - armW;
const armTop = runD, armBot = armTop + armD, barTop = armBot, barBot = barTop + barD;
const IND = ISL.induction, indX = armX + (IND.gapAisle || 0), indY = armTop + (IND.gapWall || 0);
const skX = barX + (ISL.sink.gapLeft || 0), skY = barTop + (ISL.sink.gapAisle || 0);

const cX = (pillarR / 2) * S, cZ = (barBot / 2) * S; // 씬 중심(평면)

/* ---- 렌더러 / 씬 / 카메라 ---- */
let W = wrap.clientWidth || 900, Hgt = wrap.clientHeight || 520;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf1ece2);
const camera = new THREE.PerspectiveCamera(45, W / Hgt, 0.05, 100);
camera.position.set(cX + 3.6, 3.9, cZ + 5.4);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(W, Hgt);
wrap.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x9a8c72, 1.0));
const dl = new THREE.DirectionalLight(0xffffff, 1.15); dl.position.set(3, 6, 4); scene.add(dl);
const dl2 = new THREE.DirectionalLight(0xffffff, 0.4); dl2.position.set(-4, 3, -3); scene.add(dl2);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(cX, (runH * 0.32) * S, cZ);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.495; // 바닥 아래로 안 내려감
controls.minDistance = 1.3; controls.maxDistance = 20;
controls.update();

/* ---- 바닥 + 그리드 ---- */
const floor = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshStandardMaterial({ color: 0xeae2d2, roughness: 1 }));
floor.rotation.x = -Math.PI / 2; floor.position.set(cX, 0, cZ); scene.add(floor);
const grid = new THREE.GridHelper(9, 18, 0xccbfa6, 0xdcd2be); grid.position.set(cX, 0.002, cZ); scene.add(grid);

/* ---- 박스 추가 ---- */
const pickables = [];
function addBox(name, x, y, z, w, d, h, color, dimText) {
  const g = new THREE.BoxGeometry(w * S, h * S, d * S);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.04 });
  const mesh = new THREE.Mesh(g, mat);
  mesh.position.set((x + w / 2) * S, (z + h / 2) * S, (y + d / 2) * S);
  mesh.userData = { name, dim: dimText || `${Math.round(w)}×${Math.round(d)}×${Math.round(h)}` };
  scene.add(mesh); pickables.push(mesh);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color: 0x6b5a44, transparent: true, opacity: 0.45 }));
  mesh.add(edge); // 외곽선을 자식으로 → mesh.visible 토글 시 함께 숨김
  return mesh;
}

const COL = { cab: 0xece0c8, fridge: 0xf2ead8, pillar: 0xd6cdbd, island: 0xe8dcc4, ind: 0x2f2a26, sink: 0xcddde4 };

const wallMeshes = []; // 키큰장 런 + 기둥 (토글로 숨김)
const WALL = (m) => { wallMeshes.push(m); return m; };
// 도어 손잡이(전면 세로 막대)
function addHandle(xk, zc, near) {
  const h = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.18, 0.026), new THREE.MeshStandardMaterial({ color: 0x6b5f4c, roughness: 0.5, metalness: 0.35 }));
  h.position.set(xk * S, zc * S, (runD * S) + (near || 0.014));
  scene.add(h); return h;
}
segs.forEach((s) => {
  if (s.fridge) {
    const fH = s.fridgeH || runH, upH = runH - fH, n = s.count || 3;
    for (let i = 0; i < n; i++) {
      const dx = s.x + s.w * i / n, dw = s.w / n;
      WALL(addBox(`냉장고 ${i + 1}`, dx, 0, 0, dw, runD, fH, COL.fridge, `600×${runD}×${fH}`));
      WALL(addHandle(dx + dw - 55, fH * 0.5, 0.014));
    }
    if (upH > 0) { WALL(addBox("상부장", s.x, 0, fH, s.w, runD, upH, COL.cab, `${s.w}×${runD}×${upH}`)); WALL(addHandle(s.x + s.w * 0.5, fH + upH * 0.7, 0.014)); }
  } else if (s.appliance === "oven") {
    WALL(addBox(s.label, s.x, 0, 0, s.w, runD, runH, COL.cab));
    WALL(addBox("오븐", s.x + 30, runD - 540, 1000, s.w - 60, 550, 595, 0x2c2924, `${Math.round(s.w - 60)}×550×595`));
    WALL(addHandle(s.x + s.w - 55, runH * 0.72, 0.014)); WALL(addHandle(s.x + s.w - 55, runH * 0.18, 0.014));
  } else if (s.appliance === "robot") {
    WALL(addBox(s.label, s.x, 0, 0, s.w, runD, runH, COL.cab));
    WALL(addBox("로봇청소기 니치", s.x + 25, runD - 300, 0, s.w - 50, 306, 260, 0xd8cdb8, `${Math.round(s.w - 50)}×300×260`));
    WALL(addHandle(s.x + s.w - 55, runH * 0.6, 0.014));
  } else {
    WALL(addBox(s.note ? `${s.label} ${s.note}` : s.label, s.x, 0, 0, s.w, runD, runH, COL.cab));
    WALL(addHandle(s.x + s.w - 55, runH * 0.52, 0.014));
  }
});
WALL(addBox("기둥", pillarX, 0, 0, pillarW, runD, runH, COL.pillar));
addBox("인덕션 팔", armX, armTop, 0, armW, armD, H, COL.island);
addBox("아일랜드 본체", barX, barTop, 0, barW, barD, H, COL.island);
// 하부장(앞=통로/본체 윗변 면). 통로뷰는 x축이 거울 → 입면도(③)와 같게 보이도록 본체 중심 기준 미러링.
// 입면도 좌→우: 서랍장 | 싱크 하부장 | 식기세척기. 미러 후 plan-x: 서랍=코너(arm)쪽, 식세기=barX쪽.
const TOE3 = 80, cabH = H - TOE3, sm3 = ISL.seam || Math.round(barW * 0.73), dr3 = ISL.drawer || 1000, dw3 = ISL.dishwasher || 600;
const mir = (xFromLeft, w) => barR - xFromLeft - w; // 입면 왼쪽기준 → plan-x (거울)
function frontHandle(xk, zc) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.022, 0.026), new THREE.MeshStandardMaterial({ color: 0x6b5f4c, roughness: 0.5, metalness: 0.35 })); m.position.set(xk * S, zc * S, barTop * S - 0.016); scene.add(m); }
const drX = mir(0, dr3), scX = mir(dr3, sm3 - dr3), dwX = mir(sm3, dw3); // 서랍 / 싱크하부장 / 식세기
for (let i = 0; i < 3; i++) { const dz = TOE3 + cabH * i / 3; addBox(`서랍 ${i + 1}`, drX, barTop - 26, dz, dr3, 32, cabH / 3, COL.island, `${dr3}×${Math.round(cabH / 3)}`); frontHandle(drX + dr3 / 2, dz + cabH / 6); }
addBox("싱크 하부장", scX, barTop - 26, TOE3, sm3 - dr3, 32, cabH, COL.island, `${sm3 - dr3}×${cabH}`);
addBox("식기세척기", dwX, barTop - 26, TOE3, dw3, 32, cabH, 0xdfe6e9, `${dw3}×${cabH}`);
addBox("상판 분절", mir(sm3, 14) - 7, barTop, H, 14, barD, 12, 0x9a7a4a, `분절 ${sm3}`);
addBox("인덕션 하부장", armX - 26, armTop, TOE3, 32, armD, cabH, COL.island, `${armD}×${cabH}`);
addBox("인덕션", indX, indY, H, IND.w, IND.d, 50, COL.ind, `${IND.w}×${IND.d}`);
const skXm = barR - (ISL.sink.gapLeft || 0) - ISL.sink.w; // 싱크볼도 미러
addBox("싱크볼", skXm, skY, H - 180, ISL.sink.w, ISL.sink.d, 180, COL.sink, `${ISL.sink.w}×${ISL.sink.d}`);

/* ---- 인덕션 버너(원형) ---- */
[[0.3, 0.33], [0.7, 0.33], [0.3, 0.7], [0.7, 0.7]].forEach((c) => {
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.055, 0.075, 24), new THREE.MeshBasicMaterial({ color: 0xc9a96a, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.set((indX + IND.w * c[0]) * S, (H + 51) * S, (indY + IND.d * c[1]) * S);
  scene.add(ring);
});

/* ---- 호버 → 치수 툴팁 + 하이라이트 ---- */
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
let hovered = null;
function onMove(e) {
  const r = renderer.domElement.getBoundingClientRect();
  ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  ray.setFromCamera(ptr, camera);
  const hit = ray.intersectObjects(pickables.filter((o) => o.visible), false)[0];
  const obj = hit ? hit.object : null;
  if (obj !== hovered) {
    if (hovered) hovered.material.emissive.setHex(0x000000);
    hovered = obj;
    if (hovered) hovered.material.emissive.setHex(0x3a2c12);
  }
  if (hovered) {
    tip.hidden = false;
    tip.innerHTML = `<b>${hovered.userData.name}</b><br>${hovered.userData.dim} mm`;
    tip.style.left = (e.clientX - r.left) + "px";
    tip.style.top = (e.clientY - r.top) + "px";
  } else { tip.hidden = true; }
}
renderer.domElement.addEventListener("pointermove", onMove);
renderer.domElement.addEventListener("pointerleave", () => { if (hovered) { hovered.material.emissive.setHex(0x000000); hovered = null; } tip.hidden = true; });

/* ---- 키큰장 숨기기 토글 (통로쪽에서 아일랜드 볼 때 시야 확보) ---- */
const hideBtn = document.getElementById("kz3d-hidewall");
if (hideBtn) {
  let hidden = false;
  hideBtn.addEventListener("click", () => {
    hidden = !hidden;
    wallMeshes.forEach((m) => { m.visible = !hidden; });
    hideBtn.textContent = hidden ? "키큰장 보이기" : "키큰장 숨기기";
    hideBtn.classList.toggle("on", hidden);
  });
}

/* ---- 리사이즈 / 루프 ---- */
function resize() {
  W = wrap.clientWidth || W; Hgt = wrap.clientHeight || Hgt;
  camera.aspect = W / Hgt; camera.updateProjectionMatrix();
  renderer.setSize(W, Hgt);
}
window.addEventListener("resize", resize);
window.addEventListener("load", resize);

(function loop() { requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); })();
