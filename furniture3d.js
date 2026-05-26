/* ------------------------------------------------------------
 *  가구 3D 도면 (가구 업자 공유용)
 *  - data.js 의 FURNITURE_3D.items 를 읽어 카드별로 박스를 렌더.
 *  - 박스에 W/D/H(mm) 라벨이 항상 카메라를 향함(스프라이트).
 *  - 마우스 드래그=회전 · 스크롤=확대 · 더블클릭=초기화.
 *  - 카드별로 WebGLRenderer 1개 (가구 ~10개 이내 가정).
 *  - 화면 밖이면 IntersectionObserver 로 렌더 일시정지(성능).
 * ------------------------------------------------------------ */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const items = (window.FURNITURE_3D && window.FURNITURE_3D.items) || [];
const grid = document.getElementById("fur3d-grid");

if (!items.length) {
  grid.innerHTML = '<div class="fur3d-empty">data.js 의 <code>FURNITURE_3D.items</code> 에 가구를 추가하면 여기 표시됩니다.</div>';
} else {
  items.forEach((item, i) => grid.appendChild(buildCard(item, i)));
}

/* ---------- 카드 + Three.js scene 1개씩 ---------- */
function buildCard(it, idx) {
  const card = document.createElement("article");
  card.className = "fur3d-card";
  card.innerHTML = `
    <div class="fur3d-head">
      <span class="fur3d-room">${escapeHtml(it.room || "")}</span>
      <h3 class="fur3d-name">${escapeHtml(it.name || "")}</h3>
    </div>
    <div class="fur3d-view" data-idx="${idx}">
      <button class="fur3d-reset" type="button" title="시점 초기화">⟲</button>
    </div>
    <div class="fur3d-meta">
      <span class="fur3d-dim"><b>${it.w}</b> × <b>${it.d}</b> × <b>${it.h}</b> mm
        <span class="fur3d-dim-key">(W × D × H)</span></span>
      ${it.note ? `<p class="fur3d-note">${escapeHtml(it.note)}</p>` : ""}
    </div>
  `;
  const view = card.querySelector(".fur3d-view");
  const resetBtn = card.querySelector(".fur3d-reset");

  // Three.js scene
  const W = (it.w || 1000) / 1000;
  const D = (it.d || 1000) / 1000;
  const H = (it.h || 1000) / 1000;
  const span = Math.max(W, D, H);

  const scene = new THREE.Scene();
  scene.background = null;

  // 조명
  scene.add(new THREE.HemisphereLight(0xffffff, 0xddc8a9, 0.95));
  const sun = new THREE.DirectionalLight(0xffffff, 0.55);
  sun.position.set(span * 2, span * 3, span * 2);
  scene.add(sun);

  // 바닥 격자 (가구 크기에 비례)
  const gridSize = Math.max(4, Math.ceil(span * 3));
  const gridDivs = gridSize * 4; // 250mm 간격 느낌
  const gridHelper = new THREE.GridHelper(gridSize, gridDivs, 0xb08458, 0xe7d8bf);
  gridHelper.material.opacity = 0.55;
  gridHelper.material.transparent = true;
  gridHelper.position.y = 0;
  scene.add(gridHelper);

  // 박스 (mesh + edges)
  const color = new THREE.Color(it.color || "#c9b08c");
  const boxGeom = new THREE.BoxGeometry(W, H, D);
  const boxMat = new THREE.MeshStandardMaterial({
    color, roughness: 0.78, metalness: 0.04,
    transparent: true, opacity: 0.88,
  });
  const box = new THREE.Mesh(boxGeom, boxMat);
  box.position.y = H / 2;
  scene.add(box);

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(boxGeom),
    new THREE.LineBasicMaterial({ color: 0x2b2722 })
  );
  edges.position.y = H / 2;
  scene.add(edges);

  // 치수 라벨 (스프라이트)
  const off = Math.max(span * 0.15, 0.12);
  const labels = [
    { text: `W ${it.w}`,  pos: [0,            H + off,    D / 2 + off] },
    { text: `D ${it.d}`,  pos: [W / 2 + off,  H + off,    0           ] },
    { text: `H ${it.h}`,  pos: [-W / 2 - off, H / 2,      D / 2 + off ] },
  ];
  for (const L of labels) {
    const sp = makeLabelSprite(L.text, span);
    sp.position.set(...L.pos);
    scene.add(sp);
  }

  // 카메라 (아이소메트릭 느낌)
  const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 200);
  const dist = span * 3 + 0.6;
  const initialCam = new THREE.Vector3(dist * 0.85, dist * 0.75, dist * 1.0);
  camera.position.copy(initialCam);
  const target = new THREE.Vector3(0, H / 2, 0);
  camera.lookAt(target);

  // 렌더러 (alpha=true → 배경 CSS 그라데이션 비침)
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  view.appendChild(renderer.domElement);

  // 컨트롤
  const ctrls = new OrbitControls(camera, renderer.domElement);
  ctrls.target.copy(target);
  ctrls.enablePan = false;
  ctrls.enableDamping = true;
  ctrls.dampingFactor = 0.08;
  ctrls.minDistance = span * 0.8;
  ctrls.maxDistance = span * 10 + 5;
  ctrls.minPolarAngle = 0.1;
  ctrls.maxPolarAngle = Math.PI / 2 - 0.02;
  ctrls.update();

  // 초기화 버튼
  resetBtn.addEventListener("click", () => {
    camera.position.copy(initialCam);
    ctrls.target.copy(target);
    ctrls.update();
  });

  // 사이즈 동기화
  function resize() {
    const rect = view.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(view);

  // 보이는 동안만 렌더
  let visible = true;
  const io = new IntersectionObserver(
    (entries) => { for (const e of entries) visible = e.isIntersecting; },
    { rootMargin: "100px" }
  );
  io.observe(view);

  let raf = 0;
  function tick() {
    raf = requestAnimationFrame(tick);
    if (!visible) return;
    ctrls.update();
    renderer.render(scene, camera);
  }
  tick();

  return card;
}

/* ---------- 텍스트 라벨 스프라이트 ---------- */
function makeLabelSprite(text, span) {
  const dpr = 2;
  const cw = 320, ch = 80;
  const canvas = document.createElement("canvas");
  canvas.width = cw * dpr; canvas.height = ch * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  // 배경 (살짝 반투명 베이지)
  ctx.fillStyle = "rgba(255, 253, 250, 0.92)";
  roundRect(ctx, 1, 1, cw - 2, ch - 2, 14);
  ctx.fill();
  ctx.strokeStyle = "#b08458";
  ctx.lineWidth = 2;
  ctx.stroke();

  // 텍스트
  ctx.fillStyle = "#2b2722";
  ctx.font = '700 38px Pretendard, -apple-system, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text + " mm", cw / 2, ch / 2 + 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 4;

  const mat = new THREE.SpriteMaterial({
    map: tex, transparent: true, depthTest: false, depthWrite: false,
  });
  const sp = new THREE.Sprite(mat);
  // 월드 사이즈: 가구 span 에 비례
  const scale = Math.max(span * 0.55, 0.45);
  sp.scale.set(scale, scale * (ch / cw), 1);
  return sp;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}
