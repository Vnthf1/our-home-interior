/* ------------------------------------------------------------
 *  가구 3D 도면 (가구 업자 공유용) — Scene 기반
 *  - FURNITURE_3D.scenes : 각 모듈 → 카드 하나.
 *  - scene.walls + scene.pieces : 박스 (좌표·치수 mm, 박스 중심).
 *  - scene.floor : 평면도 이미지를 바닥에 깔기. { image, x, z, w, d }.
 *
 *  좌표계: x=가로(좌→우), y=높이(바닥→천장), z=깊이(뒷벽→방안).
 *
 *  편집 모드(평면도 정렬용):
 *    - ✏️ 편집 버튼으로 토글.
 *    - 켜진 동안 뷰포트 좌클릭 드래그 → 평면도 이미지 x/z 이동.
 *    - x/z/w/d 입력+−/+ 버튼 / 📋 코드 복사 패널 노출.
 *    - 편집 모드일 땐 OrbitControls 일시정지(시점 회전은 다시 꺼야 가능).
 *
 *  비모듈 Three.js r147 + OrbitControls (window.THREE.* 전역).
 * ------------------------------------------------------------ */
(function () {
  const fd = (typeof FURNITURE_3D !== "undefined") ? FURNITURE_3D : null;
  const scenes = (fd && fd.scenes) || [];
  const grid = document.getElementById("fur3d-grid");
  if (!grid) return;

  if (typeof THREE === "undefined") {
    grid.innerHTML = '<div class="fur3d-empty">Three.js 로딩 실패 — 네트워크가 차단됐을 수 있습니다. (CDN: unpkg.com/three@0.147.0)</div>';
    return;
  }
  if (!scenes.length) {
    grid.innerHTML = '<div class="fur3d-empty">data.js 의 <code>FURNITURE_3D.scenes</code> 에 모듈을 추가하면 표시됩니다.</div>';
    return;
  }

  scenes.forEach((sc, i) => grid.appendChild(buildSceneCard(sc, i)));

  /* ---------- 카드 + Scene ---------- */
  function buildSceneCard(sc, idx) {
    const card = document.createElement("article");
    card.className = "fur3d-card";
    const pieces = sc.pieces || [];
    const hasFloor = !!(sc.floor && sc.floor.image);
    const pieceList = pieces.map(p =>
      `<li><b>${escapeHtml(p.name || "")}</b> — ${p.w} × ${p.d} × ${p.h} mm${p.note ? ` <span class="fur3d-pnote">${escapeHtml(p.note)}</span>` : ""}</li>`
    ).join("");
    card.innerHTML = `
      <div class="fur3d-head">
        <span class="fur3d-room">${escapeHtml(sc.room || "")}</span>
        <h3 class="fur3d-name">${escapeHtml(sc.name || "")}</h3>
      </div>
      <div class="fur3d-view" data-idx="${idx}">
        <button class="fur3d-reset" type="button" title="시점 초기화 (등각뷰)">⟲</button>
        <button class="fur3d-topview" type="button" title="탑뷰(위에서 내려다보기)">📐 탑뷰</button>
        <button class="fur3d-add-piece" type="button" title="가구 추가">➕ 가구</button>
        <button class="fur3d-add-wall" type="button" title="벽 추가">➕ 벽</button>
        ${hasFloor ? `<button class="fur3d-edit" type="button" title="평면도 위치 맞추기">✏️ 평면도</button>` : ""}
      </div>
      <div class="fur3d-pcal">
        <div class="fur3d-cal-row">
          <b>🪑 가구·벽 편집</b>
          <span class="fur3d-cal-hint">클릭=선택 · 본체 드래그=이동 · 8개 코너 핸들=크기 · 위 회전 핸들 또는 코너 바깥 드래그=90° 회전 · 빈 곳 드래그=카메라 회전 / 우클릭·Shift+드래그=카메라 이동 / 스크롤=확대</span>
        </div>
        <div class="fur3d-pcal-header">
          <span class="fur3d-pcal-type"></span>
          <button class="fur3d-pcal-lock" type="button" hidden>🔓 잠금</button>
          <button class="fur3d-pcal-rot90" type="button" hidden>↻ 90°</button>
        </div>
        <div class="fur3d-pcal-sel">선택된 항목이 없습니다. 가구나 벽을 클릭하세요.</div>
        <div class="fur3d-pcal-fields" hidden>
          <label class="fur3d-pcal-name">이름 <input data-k="name" type="text"></label>
          <label>x <input data-k="x" type="number" step="50"><div class="fur3d-bt"><button data-k="x" data-d="-50">−50</button><button data-k="x" data-d="50">+50</button></div></label>
          <label>z <input data-k="z" type="number" step="50"><div class="fur3d-bt"><button data-k="z" data-d="-50">−50</button><button data-k="z" data-d="50">+50</button></div></label>
          <label>y(중심) <input data-k="y" type="number" step="50"><div class="fur3d-bt"><button data-k="y" data-d="-50">−50</button><button data-k="y" data-d="50">+50</button></div></label>
          <label>w <input data-k="w" type="number" step="50"><div class="fur3d-bt"><button data-k="w" data-d="-50">−50</button><button data-k="w" data-d="50">+50</button></div></label>
          <label>d <input data-k="d" type="number" step="50"><div class="fur3d-bt"><button data-k="d" data-d="-50">−50</button><button data-k="d" data-d="50">+50</button></div></label>
          <label>h <input data-k="h" type="number" step="50"><div class="fur3d-bt"><button data-k="h" data-d="-50">−50</button><button data-k="h" data-d="50">+50</button></div></label>
          <label>rot° <input data-k="rotation" type="number" step="1"><div class="fur3d-bt"><button data-k="rotation" data-d="-90">−90°</button><button data-k="rotation" data-d="90">+90°</button></div></label>
        </div>
        <div class="fur3d-pcal-actions">
          <button class="fur3d-pcal-delete" type="button" hidden>🗑 삭제</button>
          <button class="fur3d-pcal-copy" type="button">📋 walls·pieces 코드 복사</button>
        </div>
        <textarea class="fur3d-pcal-code" readonly rows="6"></textarea>
      </div>
      ${hasFloor ? `
      <div class="fur3d-cal" hidden>
        <div class="fur3d-cal-row">
          <b>📐 평면도 위치 맞추기</b>
          <span class="fur3d-cal-hint">모드 선택 후 뷰포트 드래그 · 입력/± 버튼으로 미세조정</span>
        </div>
        <div class="fur3d-cal-modes">
          <button type="button" data-mode="pan" class="fur3d-mode-on" title="드래그=평면도 이동">✥ 이동</button>
          <button type="button" data-mode="rotate" title="드래그=중심 기준 회전">⟳ 회전</button>
          <button type="button" data-mode="scale" title="드래그=중심에서 멀어질수록 확대(uniform)">⤢ 크기</button>
        </div>
        <div class="fur3d-cal-fields">
          <label>x <input data-k="x" type="number" step="50"><div class="fur3d-bt"><button data-k="x" data-d="-100">−100</button><button data-k="x" data-d="100">+100</button></div></label>
          <label>z <input data-k="z" type="number" step="50"><div class="fur3d-bt"><button data-k="z" data-d="-100">−100</button><button data-k="z" data-d="100">+100</button></div></label>
          <label>w <input data-k="w" type="number" step="100"><div class="fur3d-bt"><button data-k="w" data-d="-200">−200</button><button data-k="w" data-d="200">+200</button></div></label>
          <label>d <input data-k="d" type="number" step="100"><div class="fur3d-bt"><button data-k="d" data-d="-200">−200</button><button data-k="d" data-d="200">+200</button></div></label>
          <label>rot° <input data-k="rotation" type="number" step="1"><div class="fur3d-bt"><button data-k="rotation" data-d="-1">−1°</button><button data-k="rotation" data-d="1">+1°</button><button data-k="rotation" data-d="-90">−90°</button><button data-k="rotation" data-d="90">+90°</button></div></label>
        </div>
        <textarea class="fur3d-cal-code" readonly rows="6"></textarea>
        <button class="fur3d-cal-copy" type="button">📋 코드 복사</button>
      </div>` : ""}
      <details class="fur3d-piecelist" open><summary>구성 (${pieces.length}개)</summary><ul>${pieceList}</ul></details>
      ${sc.note ? `<p class="fur3d-note">${escapeHtml(sc.note)}</p>` : ""}
    `;
    const view = card.querySelector(".fur3d-view");
    const resetBtn = card.querySelector(".fur3d-reset");

    // ---- Three.js ----
    const scene3 = new THREE.Scene();
    scene3.background = null;
    scene3.add(new THREE.HemisphereLight(0xffffff, 0xddc8a9, 0.95));

    const walls = sc.walls || [];
    const allBoxes = [...walls, ...pieces];
    const bounds = computeBounds(allBoxes);
    const span = Math.max(bounds.w, bounds.h, bounds.d) / 1000;
    const labelSize = clamp(span * 0.13, 0.22, 0.6);

    const sun = new THREE.DirectionalLight(0xffffff, 0.55);
    sun.position.set(span * 1.5, span * 2.5, span * 1.8);
    scene3.add(sun);

    // 바닥
    const floorState = hasFloor ? { ...sc.floor } : null;
    let updateFloor = null;
    if (floorState) {
      const r = addFloorImage(scene3, floorState);
      updateFloor = r.update;
    } else {
      addDefaultFloor(scene3, bounds, span);
    }

    // pieces·walls 모두 runtime 추적(편집/추가/삭제용)
    const pieceItems = [];
    const wallItems = [];
    const addPieceBox = (p) => addBox(scene3, p, { isWall: false, labelSize, span });
    const addWallBox  = (w) => addBox(scene3, w, { isWall: true,  labelSize, span });
    const disposeGroup = (g) => g.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
    });
    function rebuildBox(item) {
      scene3.remove(item.group);
      disposeGroup(item.group);
      const refs = item.isWall ? addWallBox(item.data) : addPieceBox(item.data);
      Object.assign(item, refs);
    }
    walls.forEach(w => wallItems.push({ data: w, isWall: true, ...addWallBox(w) }));
    pieces.forEach(p => pieceItems.push({ data: p, isWall: false, ...addPieceBox(p) }));

    // 카메라
    const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 200);
    const target = new THREE.Vector3(bounds.cx / 1000, bounds.cy / 1000, bounds.cz / 1000);
    const dist = span * 1.9 + 1.5;
    const view0 = sc.view || "iso";
    camera.position.copy(initialCamera(view0, target, dist));
    camera.lookAt(target);

    // 렌더러
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    view.appendChild(renderer.domElement);

    // 컨트롤
    const ctrls = new THREE.OrbitControls(camera, renderer.domElement);
    ctrls.target.copy(target);
    ctrls.enablePan = true;
    ctrls.screenSpacePanning = true;
    ctrls.enableDamping = true;
    ctrls.dampingFactor = 0.08;
    ctrls.minDistance = span * 0.4;
    ctrls.maxDistance = span * 12 + 8;
    ctrls.minPolarAngle = 0;            // 탑뷰(정수직 내려보기) 허용
    ctrls.maxPolarAngle = Math.PI - 0.02; // 아래쪽도 거의 모든 각도 허용
    ctrls.update();

    // Shift 키를 누르면 좌클릭 드래그가 '회전'에서 '이동'으로 전환 (Blender·SketchUp 보조 컨벤션)
    const setLeftPan = (pan) => { ctrls.mouseButtons.LEFT = pan ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE; };
    window.addEventListener("keydown", (ke) => { if (ke.key === "Shift") setLeftPan(true); });
    window.addEventListener("keyup",   (ke) => { if (ke.key === "Shift") setLeftPan(false); });

    function resetView() {
      camera.position.copy(initialCamera(view0, target, dist));
      ctrls.target.copy(target);
      ctrls.update();
    }
    resetBtn.addEventListener("click", resetView);
    const topBtn = card.querySelector(".fur3d-topview");
    if (topBtn) topBtn.addEventListener("click", () => {
      camera.position.set(target.x + 0.001, target.y + dist, target.z);
      ctrls.target.copy(target);
      ctrls.update();
    });
    view.addEventListener("dblclick", (e) => {
      if (e.target.closest('.fur3d-edit,.fur3d-reset')) return;
      resetView();
    });

    function resize() {
      const r = view.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      renderer.setSize(r.width, r.height, false);
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
    }
    resize();
    new ResizeObserver(resize).observe(view);

    let visible = true;
    new IntersectionObserver(
      es => { for (const e of es) visible = e.isIntersecting; },
      { rootMargin: "150px" }
    ).observe(view);

    (function tick() {
      requestAnimationFrame(tick);
      if (!visible) return;
      ctrls.update();
      renderer.render(scene3, camera);
    })();

    // 평면도 정렬 패널 (floor 있을 때만)
    if (hasFloor && updateFloor) {
      setupCalibration(card, view, renderer, camera, ctrls, floorState, updateFloor);
    }

    // 가구·벽 편집 패널 (선택+8핸들+회전·이동·크기 직접조작, Photoshop-style)
    setupSceneEdit(card, view, renderer, camera, ctrls, scene3, pieceItems, wallItems, sc, addPieceBox, addWallBox, rebuildBox, disposeGroup, bounds);

    return card;
  }

  /* ---------- 가구·벽 편집 (Photoshop-style 직접조작: 핸들/이동/회전/크기) ---------- */
  function setupSceneEdit(card, view, renderer, camera, ctrls, scene3, pieceItems, wallItems, sc, addPieceBox, addWallBox, rebuildBox, disposeGroup, bounds) {
    const panel       = card.querySelector('.fur3d-pcal');
    const addPieceBtn = card.querySelector('.fur3d-add-piece');
    const addWallBtn  = card.querySelector('.fur3d-add-wall');
    if (!panel) return;
    const inputs    = panel.querySelectorAll('input[data-k]');
    const nudgeBtns = panel.querySelectorAll('button[data-k][data-d]');
    const deleteBtn = panel.querySelector('.fur3d-pcal-delete');
    const copyBtn   = panel.querySelector('.fur3d-pcal-copy');
    const codeArea  = panel.querySelector('.fur3d-pcal-code');
    const selInfo   = panel.querySelector('.fur3d-pcal-sel');
    const fields    = panel.querySelector('.fur3d-pcal-fields');
    const lockBtn   = panel.querySelector('.fur3d-pcal-lock');
    const typeLabel = panel.querySelector('.fur3d-pcal-type');
    const rot90Btn  = panel.querySelector('.fur3d-pcal-rot90');

    const HILITE = 0xb08458, NORMAL_PIECE = 0x2b2722, NORMAL_WALL = 0xa49d8e;
    let selected = null;
    let overlay = null; // selection box + 8 handles + rotation handle

    function defaultEdgeColor(item) { return item.isWall ? NORMAL_WALL : NORMAL_PIECE; }
    function applyHilite(item, on) {
      if (item && item.edges && item.edges.material) item.edges.material.color.set(on ? HILITE : defaultEdgeColor(item));
    }
    function clearOverlay() {
      if (!overlay) return;
      scene3.remove(overlay);
      overlay.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      overlay = null;
    }
    function buildOverlay(item) {
      clearOverlay();
      if (!item) return;
      const d = item.data;
      const W = (d.w || 100) / 1000, H = (d.h || 100) / 1000, D = (d.d || 100) / 1000;
      const rotRad = (d.rotation || 0) * Math.PI / 180;
      const g = new THREE.Group();
      g.position.set((d.x || 0) / 1000, (d.y || 0) / 1000, (d.z || 0) / 1000);
      g.rotation.y = rotRad;

      // 선택 박스 와이어프레임(12 모서리)
      const boxEdge = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(W, H, D)),
        new THREE.LineBasicMaterial({ color: HILITE })
      );
      g.add(boxEdge);

      // 8개 꼭짓점 핸들 (위 4 + 아래 4)
      const r = clamp(Math.max(W, H, D) * 0.03, 0.04, 0.10);
      const handles = [];
      [-H / 2, H / 2].forEach((yLvl) => {
        [
          ['nw', -W / 2, -D / 2], ['ne',  W / 2, -D / 2],
          ['se',  W / 2,  D / 2], ['sw', -W / 2,  D / 2],
        ].forEach(([dir, xL, zL]) => {
          const s = new THREE.Mesh(
            new THREE.SphereGeometry(r, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
          );
          s.position.set(xL, yLvl, zL);
          s.userData.handleType = dir; // 위/아래 동일 — XZ 코너 기준 크기 조절
          g.add(s);
          // 강조 링 (반투명)
          const ring = new THREE.Mesh(
            new THREE.SphereGeometry(r * 1.18, 16, 16),
            new THREE.MeshBasicMaterial({ color: HILITE, transparent: true, opacity: 0.32 })
          );
          ring.position.copy(s.position);
          g.add(ring);
          handles.push(s);
        });
      });

      // 회전 핸들 (북쪽 위, 본체 밖)
      const rotOff = Math.max(r * 4, 0.28);
      const rotPos = new THREE.Vector3(0, H / 2 + rotOff, -D / 2 - rotOff * 0.4);
      const rotMesh = new THREE.Mesh(
        new THREE.SphereGeometry(r * 1.6, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xb08458 })
      );
      rotMesh.position.copy(rotPos);
      rotMesh.userData.handleType = 'rotate';
      g.add(rotMesh);
      // 안 보이는 큰 hit 영역(클릭 빗나감 방지) — 시각 핸들의 약 3배
      const rotHit = new THREE.Mesh(
        new THREE.SphereGeometry(r * 4, 12, 12),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, depthTest: false })
      );
      rotHit.position.copy(rotPos);
      rotHit.userData.handleType = 'rotate';
      g.add(rotHit);
      g.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, H / 2, -D / 2),
          rotPos.clone(),
        ]),
        new THREE.LineBasicMaterial({ color: HILITE })
      ));
      handles.push(rotMesh, rotHit);

      g.userData.handles = handles;
      scene3.add(g);
      overlay = g;
    }
    function refreshOverlay() { if (selected) buildOverlay(selected); }

    function selectItem(item) {
      if (selected) applyHilite(selected, false);
      selected = item || null;
      if (selected) applyHilite(selected, true);
      buildOverlay(selected);
      updatePanelUI();
    }
    function updatePanelUI() {
      if (!selected) {
        selInfo.hidden = false;
        fields.hidden = true;
        deleteBtn.hidden = true;
        if (lockBtn) lockBtn.hidden = true;
        if (rot90Btn) rot90Btn.hidden = true;
        typeLabel.textContent = '';
      } else {
        selInfo.hidden = true;
        fields.hidden = false;
        deleteBtn.hidden = false;
        typeLabel.textContent = selected.isWall ? '🧱 벽' : '🪑 가구';
        if (lockBtn) {
          lockBtn.hidden = false;
          lockBtn.textContent = selected.data.locked ? '🔒 해제' : '🔓 잠금';
        }
        if (rot90Btn) rot90Btn.hidden = false;
      }
      refreshInputs();
    }
    function refreshInputs() {
      const d = selected ? selected.data : null;
      inputs.forEach(inp => {
        if (!d) { inp.value = ''; return; }
        const k = inp.dataset.k;
        if (k === 'name')          inp.value = d.name || '';
        else if (k === 'rotation') inp.value = Math.round((d.rotation || 0) * 10) / 10;
        else                       inp.value = Math.round(d[k] || 0);
      });
      codeArea.value = formatCode();
    }
    function boxLine(b) {
      const parts = [];
      if (b.name) parts.push(`name: "${String(b.name).replace(/"/g, '\\"')}"`);
      ['w', 'h', 'd', 'x', 'y', 'z'].forEach(k => { if (b[k] !== undefined) parts.push(`${k}: ${Math.round(b[k])}`); });
      if (b.rotation) parts.push(`rotation: ${Math.round(b.rotation * 10) / 10}`);
      if (b.color) parts.push(`color: "${b.color}"`);
      if (b.locked) parts.push('locked: true');
      return `  { ${parts.join(', ')} },`;
    }
    function formatCode() {
      const out = [];
      out.push('walls: [');
      (sc.walls || []).forEach(w => out.push(boxLine(w)));
      out.push('],');
      out.push('pieces: [');
      (sc.pieces || []).forEach(p => out.push(boxLine(p)));
      out.push('],');
      return out.join('\n');
    }
    refreshInputs();

    // 새 항목 스폰 위치 = 평면도 있으면 평면도 중앙(코너 + w/2, d/2), 없으면 기존 항목 bounds 중심
    function spawnXZ() {
      const f = sc.floor;
      if (f && f.w && f.d) {
        return { x: Math.round((f.x || 0) + f.w / 2), z: Math.round((f.z || 0) + f.d / 2) };
      }
      return { x: Math.round((bounds && bounds.cx) || 0), z: Math.max(0, Math.round((bounds && bounds.cz) || 0)) };
    }

    if (addPieceBtn) addPieceBtn.addEventListener('click', () => {
      const name = (prompt('가구 이름?', '새 가구') || '').trim();
      if (!name) return;
      const sp = spawnXZ();
      const newP = { name, w: 600, h: 800, d: 400, x: sp.x, y: 400, z: sp.z, rotation: 0, showW: true, showH: true };
      sc.pieces = sc.pieces || [];
      sc.pieces.push(newP);
      const item = { data: newP, isWall: false, ...addPieceBox(newP) };
      pieceItems.push(item);
      selectItem(item);
    });
    if (addWallBtn) addWallBtn.addEventListener('click', () => {
      const name = ((prompt('벽 이름?', '새 벽') || '').trim()) || '벽';
      const sp = spawnXZ();
      // 추가 직후엔 잠금 해제 — 위치·크기 조정 가능. 끝나면 패널의 🔓 잠금 버튼으로 잠그면 됨.
      const newW = { name, w: 3000, h: 2400, d: 100, x: sp.x, y: 1200, z: sp.z, rotation: 0 };
      sc.walls = sc.walls || [];
      sc.walls.push(newW);
      const item = { data: newW, isWall: true, ...addWallBox(newW) };
      wallItems.push(item);
      selectItem(item);
    });

    if (deleteBtn) deleteBtn.addEventListener('click', () => {
      if (!selected) return;
      const name = selected.data.name || (selected.isWall ? '벽' : '가구');
      if (!confirm(`'${name}' 삭제할까요?`)) return;
      const items = selected.isWall ? wallItems : pieceItems;
      const arr   = selected.isWall ? (sc.walls || []) : (sc.pieces || []);
      const idx = items.indexOf(selected);
      const di  = arr.indexOf(selected.data);
      if (idx >= 0) items.splice(idx, 1);
      if (di  >= 0) arr.splice(di, 1);
      scene3.remove(selected.group);
      disposeGroup(selected.group);
      selectItem(null);
    });

    if (lockBtn) lockBtn.addEventListener('click', () => {
      if (!selected) return;
      selected.data.locked = !selected.data.locked;
      updatePanelUI();
    });
    if (rot90Btn) rot90Btn.addEventListener('click', () => {
      if (!selected) return;
      selected.data.rotation = ((selected.data.rotation || 0) + 90) % 360;
      rebuildBox(selected); applyHilite(selected, true); refreshOverlay(); refreshInputs();
    });

    inputs.forEach(inp => {
      inp.addEventListener('input', () => {
        if (!selected) return;
        const k = inp.dataset.k;
        let v = (k === 'name') ? inp.value : parseFloat(inp.value);
        if (k !== 'name' && !Number.isFinite(v)) return;
        if (k !== 'name') v = Math.round(v); // 정수 mm/도 강제
        if (['w', 'h', 'd'].includes(k)) v = Math.max(50, v);
        if (k === 'z') v = Math.max(0, v); // 지도 밑(z<0) 차단
        selected.data[k] = v;
        rebuildBox(selected); applyHilite(selected, true); refreshOverlay();
        codeArea.value = formatCode();
      });
    });
    nudgeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!selected) return;
        const k = btn.dataset.k, d = parseFloat(btn.dataset.d);
        selected.data[k] = (selected.data[k] || 0) + d;
        rebuildBox(selected); applyHilite(selected, true); refreshOverlay(); refreshInputs();
      });
    });
    copyBtn.addEventListener('click', async () => {
      const txt = codeArea.value;
      try { await navigator.clipboard.writeText(txt); } catch { codeArea.select(); document.execCommand('copy'); }
      copyBtn.textContent = '✓ 복사됨';
      setTimeout(() => { copyBtn.textContent = '📋 walls·pieces 코드 복사'; }, 1500);
    });

    // ---- 캔버스 직접조작 ----
    const raycaster = new THREE.Raycaster();
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const canvas = renderer.domElement;
    let drag = null;

    const ndc = (e) => {
      const r = canvas.getBoundingClientRect();
      return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    };
    function raycastTargets(e) {
      raycaster.setFromCamera(ndc(e), camera);
      if (overlay) {
        const hits = raycaster.intersectObjects(overlay.userData.handles || [], false);
        if (hits.length) return { kind: 'handle', type: hits[0].object.userData.handleType };
      }
      // 아이템(가구·벽) 충돌 먼저 검사
      const targets = [];
      pieceItems.forEach(it => targets.push(it.mesh));
      wallItems.forEach(it => { if (!it.data.locked) targets.push(it.mesh); });
      const hits = raycaster.intersectObjects(targets, false);
      if (hits.length) {
        const m = hits[0].object;
        const found = pieceItems.find(it => it.mesh === m) || wallItems.find(it => it.mesh === m);
        return { kind: 'item', item: found };
      }
      // 선택된 항목이 있으면, 박스 바깥의 코너 근처는 '회전 hot zone'
      if (selected) {
        const fhit = raycastFloor(e);
        if (fhit) {
          const d = selected.data;
          const cx = d.x || 0, cz = d.z || 0;
          const rot = (d.rotation || 0) * Math.PI / 180;
          const dx = fhit.x - cx, dz = fhit.z - cz;
          const cos = Math.cos(-rot), sin = Math.sin(-rot);
          const lx = dx * cos - dz * sin;
          const lz = dx * sin + dz * cos;
          const W = d.w || 100, D = d.d || 100;
          const outsideX = Math.abs(lx) > W / 2;
          const outsideZ = Math.abs(lz) > D / 2;
          if (outsideX && outsideZ) {
            const overhangX = Math.abs(lx) - W / 2;
            const overhangZ = Math.abs(lz) - D / 2;
            if (overhangX < 500 && overhangZ < 500) {
              return { kind: 'rotate-corner' };
            }
          }
        }
      }
      return null;
    }
    function raycastFloor(e) {
      raycaster.setFromCamera(ndc(e), camera);
      const hit = new THREE.Vector3();
      return raycaster.ray.intersectPlane(floorPlane, hit) ? { x: hit.x * 1000, z: hit.z * 1000 } : null;
    }

    // 평면도(✏️) 편집 모드와 충돌 방지
    const inFloorEdit = () => view.classList.contains('fur3d-editing');

    const RI = (v) => Math.round(v); // 정수 mm 스냅

    canvas.addEventListener('pointerdown', (e) => {
      if (inFloorEdit()) return;
      if (e.button !== 0) return;
      const target = raycastTargets(e);
      const hit = raycastFloor(e);
      if (target && target.kind === 'handle' && selected) {
        if (!hit) return;
        const d = selected.data;
        if (target.type === 'rotate') {
          drag = { kind: 'rotate', startAngle: Math.atan2(hit.z - (d.z || 0), hit.x - (d.x || 0)), startRot: d.rotation || 0 };
        } else {
          drag = { kind: 'scale', type: target.type, startHit: hit, startW: d.w || 100, startD: d.d || 100, startX: d.x || 0, startZ: d.z || 0, startRot: d.rotation || 0 };
        }
        try { canvas.setPointerCapture(e.pointerId); } catch {}
        e.preventDefault(); e.stopPropagation();
        return;
      }
      if (target && target.kind === 'rotate-corner' && selected) {
        if (!hit) return;
        const d = selected.data;
        drag = { kind: 'rotate', startAngle: Math.atan2(hit.z - (d.z || 0), hit.x - (d.x || 0)), startRot: d.rotation || 0 };
        try { canvas.setPointerCapture(e.pointerId); } catch {}
        e.preventDefault(); e.stopPropagation();
        return;
      }
      if (target && target.kind === 'item') {
        selectItem(target.item);
        if (hit) {
          drag = { kind: 'pan', startHit: hit, startX: target.item.data.x || 0, startZ: target.item.data.z || 0 };
          try { canvas.setPointerCapture(e.pointerId); } catch {}
          e.preventDefault(); e.stopPropagation();
        }
        return;
      }
      // 빈 곳 클릭 = 선택 해제 (OrbitControls가 카메라 회전 처리하도록 전파 허용)
      selectItem(null);
    }, true);

    canvas.addEventListener('pointermove', (e) => {
      if (drag && selected) {
        const hit = raycastFloor(e);
        if (!hit) return;
        const d = selected.data;
        if (drag.kind === 'pan') {
          d.x = RI(drag.startX + (hit.x - drag.startHit.x));
          d.z = Math.max(0, RI(drag.startZ + (hit.z - drag.startHit.z))); // 지도 밑(z<0) 진입 차단
        } else if (drag.kind === 'rotate') {
          const a = Math.atan2(hit.z - (d.z || 0), hit.x - (d.x || 0));
          let r = drag.startRot + (a - drag.startAngle) * 180 / Math.PI;
          r = Math.round(r / 90) * 90; // 90° snap
          d.rotation = ((r % 360) + 360) % 360;
        } else if (drag.kind === 'scale') {
          const rot = (drag.startRot || 0) * Math.PI / 180;
          const dx = hit.x - drag.startHit.x;
          const dz = hit.z - drag.startHit.z;
          const cos = Math.cos(-rot), sin = Math.sin(-rot);
          const dlx = dx * cos - dz * sin;
          const dlz = dx * sin + dz * cos;
          const t = drag.type;
          let dw = 0, dd = 0;
          if (t.includes('e')) dw =  dlx;
          if (t.includes('w')) dw = -dlx;
          if (t.includes('s')) dd =  dlz;
          if (t.includes('n')) dd = -dlz;
          d.w = Math.max(50, RI(drag.startW + dw));
          d.d = Math.max(50, RI(drag.startD + dd));
          // 반대 코너 고정 — 중심 이동(정수 mm)
          let lcx = 0, lcz = 0;
          if (t.includes('e')) lcx =  (d.w - drag.startW) / 2;
          if (t.includes('w')) lcx = -(d.w - drag.startW) / 2;
          if (t.includes('s')) lcz =  (d.d - drag.startD) / 2;
          if (t.includes('n')) lcz = -(d.d - drag.startD) / 2;
          const c2 = Math.cos(rot), s2 = Math.sin(rot);
          d.x = RI(drag.startX + (lcx * c2 - lcz * s2));
          d.z = Math.max(0, RI(drag.startZ + (lcx * s2 + lcz * c2)));
        }
        rebuildBox(selected); applyHilite(selected, true); refreshOverlay(); refreshInputs();
        e.preventDefault(); e.stopPropagation();
        return;
      }
      // 호버 커서
      if (inFloorEdit()) { canvas.style.cursor = ''; return; }
      const t = raycastTargets(e);
      if (t && t.kind === 'handle') {
        if (t.type === 'rotate') canvas.style.cursor = 'grab';
        else if (['nw', 'se'].includes(t.type)) canvas.style.cursor = 'nwse-resize';
        else canvas.style.cursor = 'nesw-resize'; // ne, sw
      } else if (t && t.kind === 'rotate-corner') {
        canvas.style.cursor = 'grab';
      } else if (t && t.kind === 'item') {
        canvas.style.cursor = 'move';
      } else {
        canvas.style.cursor = 'grab'; // 빈 곳 = 카메라 회전 영역 (Shift+드래그=이동)
      }
    });
    function endDrag(e) {
      if (!drag) return;
      drag = null;
      try { canvas.releasePointerCapture(e.pointerId); } catch {}
    }
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
  }

  /* ---------- 편집 모드 + 드래그-이동 + 코드 복사 ---------- */
  function setupCalibration(card, view, renderer, camera, ctrls, floorState, updateFloor) {
    const editBtn = card.querySelector(".fur3d-edit");
    const panel = card.querySelector(".fur3d-cal");
    const inputs = panel.querySelectorAll('input[data-k]');
    const nudgeBtns = panel.querySelectorAll('button[data-k][data-d]');
    const copyBtn = panel.querySelector('.fur3d-cal-copy');
    const codeArea = panel.querySelector('.fur3d-cal-code');

    // 모드 버튼
    const modeBtns = panel.querySelectorAll('button[data-mode]');
    let mode = 'pan';
    function setMode(m) {
      mode = m;
      modeBtns.forEach(b => b.classList.toggle('fur3d-mode-on', b.dataset.mode === m));
      view.classList.remove('fur3d-mode-pan','fur3d-mode-rotate','fur3d-mode-scale');
      view.classList.add('fur3d-mode-' + m);
    }
    modeBtns.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));

    function formatCode(f) {
      return [
        "floor: {",
        `  image: "${f.image}",`,
        `  x: ${Math.round(f.x)}, z: ${Math.round(f.z)}, w: ${Math.round(f.w)}, d: ${Math.round(f.d)},`,
        `  rotation: ${Math.round((f.rotation || 0) * 10) / 10},`,
        `  opacity: ${f.opacity != null ? f.opacity : 0.9},`,
        "},",
      ].join("\n");
    }
    function refreshUI() {
      inputs.forEach(inp => {
        const v = floorState[inp.dataset.k];
        inp.value = inp.dataset.k === 'rotation' ? Math.round((v||0)*10)/10 : Math.round(v||0);
      });
      codeArea.value = formatCode(floorState);
    }
    refreshUI();

    let editMode = false;
    function setEdit(on) {
      editMode = on;
      panel.hidden = !on;
      ctrls.enabled = !on;
      view.classList.toggle('fur3d-editing', on);
      editBtn.textContent = on ? '✓ 편집 완료' : '✏️ 편집';
      editBtn.classList.toggle('fur3d-edit-on', on);
      if (on) setMode(mode); // 모드 클래스 적용
    }
    editBtn.addEventListener('click', () => setEdit(!editMode));

    inputs.forEach(inp => {
      inp.addEventListener('input', () => {
        const v = parseFloat(inp.value);
        if (!Number.isFinite(v)) return;
        floorState[inp.dataset.k] = v;
        updateFloor(floorState);
        codeArea.value = formatCode(floorState);
      });
    });
    nudgeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const k = btn.dataset.k;
        const d = parseFloat(btn.dataset.d);
        floorState[k] = (floorState[k] || 0) + d;
        updateFloor(floorState);
        refreshUI();
      });
    });
    copyBtn.addEventListener('click', async () => {
      const txt = codeArea.value;
      try {
        await navigator.clipboard.writeText(txt);
        copyBtn.textContent = '✓ 복사됨';
      } catch {
        codeArea.select(); document.execCommand('copy');
        copyBtn.textContent = '✓ 복사됨';
      }
      setTimeout(() => { copyBtn.textContent = '📋 코드 복사'; }, 1500);
    });

    // 드래그 (모드별)
    const raycaster = new THREE.Raycaster();
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    let isDragging = false;
    let startHit = null;
    let startState = null;
    const canvas = renderer.domElement;

    function ndcFromEvent(e) {
      const rect = canvas.getBoundingClientRect();
      return new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
    }
    function raycastFloor(e) {
      raycaster.setFromCamera(ndcFromEvent(e), camera);
      const hit = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(floorPlane, hit)) {
        return { x: hit.x * 1000, z: hit.z * 1000 };
      }
      return null;
    }

    canvas.addEventListener('pointerdown', (e) => {
      if (!editMode) return;
      if (e.button !== 0) return;
      const hit = raycastFloor(e);
      if (!hit) return;
      isDragging = true;
      startHit = hit;
      // 모드별로 시작 상태 저장
      if (mode === 'pan') {
        startState = { x: floorState.x, z: floorState.z };
      } else if (mode === 'rotate') {
        const a = Math.atan2(hit.z - floorState.z, hit.x - floorState.x);
        startState = { angle: a, rotation: floorState.rotation || 0 };
      } else if (mode === 'scale') {
        const dist = Math.hypot(hit.x - floorState.x, hit.z - floorState.z);
        startState = { dist: Math.max(dist, 10), w: floorState.w, d: floorState.d };
      }
      try { canvas.setPointerCapture(e.pointerId); } catch {}
      e.preventDefault(); e.stopPropagation();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!editMode || !isDragging) return;
      const hit = raycastFloor(e);
      if (!hit) return;
      if (mode === 'pan') {
        floorState.x = startState.x + (hit.x - startHit.x);
        floorState.z = startState.z + (hit.z - startHit.z);
      } else if (mode === 'rotate') {
        const a = Math.atan2(hit.z - floorState.z, hit.x - floorState.x);
        const dDeg = (a - startState.angle) * 180 / Math.PI;
        floorState.rotation = startState.rotation + dDeg;
      } else if (mode === 'scale') {
        const dist = Math.hypot(hit.x - floorState.x, hit.z - floorState.z);
        if (dist > 1) {
          const factor = dist / startState.dist;
          floorState.w = startState.w * factor;
          floorState.d = startState.d * factor;
        }
      }
      updateFloor(floorState);
      refreshUI();
      e.preventDefault(); e.stopPropagation();
    });
    function endDrag(e) {
      if (!isDragging) return;
      isDragging = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch {}
    }
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
  }

  /* ---------- 바닥: 평면도 이미지 텍스처 ----------
   * fl 좌표계: x, z 는 이미지 '중심' (mm).  rotation 은 Y축 회전(도).
   *   - 회전이 0일 때 이미지 +U(가로 픽셀+) → 월드 +X, 이미지 +V(세로 픽셀+, 위→아래) → 월드 +Z.
   */
  function addFloorImage(scene3, fl) {
    const initW = (fl.w || 4000) / 1000;
    const initD = (fl.d || 4000) / 1000;
    const phMat = new THREE.MeshBasicMaterial({ color: 0xefe6d2, side: THREE.DoubleSide });
    const geo = new THREE.PlaneGeometry(initW, initD);
    const mesh = new THREE.Mesh(geo, phMat);
    applyTransform(mesh, fl);
    scene3.add(mesh);

    const loader = new THREE.TextureLoader();
    const url = "images/" + fl.image;
    loader.load(url, (tex) => {
      if ("encoding" in tex) tex.encoding = THREE.sRGBEncoding;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 8;
      mesh.material.dispose();
      mesh.material = new THREE.MeshBasicMaterial({
        map: tex, side: THREE.DoubleSide,
        transparent: true, opacity: fl.opacity != null ? fl.opacity : 0.95,
      });
    }, undefined, (err) => {
      console.warn("Floor image load failed:", url, err);
    });

    function applyTransform(m, f) {
      const W = (f.w || 100) / 1000;
      const D = (f.d || 100) / 1000;
      if (m.geometry.parameters && (
        Math.abs(W - m.geometry.parameters.width) > 1e-6 ||
        Math.abs(D - m.geometry.parameters.height) > 1e-6
      )) {
        m.geometry.dispose();
        m.geometry = new THREE.PlaneGeometry(W, D);
      }
      // 회전: 먼저 X축 -90°로 눕히고, 그 다음 Y축으로 rotation°
      const rad = (f.rotation||0) * Math.PI / 180;
      const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), -Math.PI/2);
      const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), rad);
      m.quaternion.copy(qY).multiply(qX);
      // (f.x, f.z) 는 평면도의 '코너'(이미지 좌상단) 월드 좌표. 따라서 메시 중심 = 코너 + 회전된 (W/2, D/2).
      const cos = Math.cos(rad), sin = Math.sin(rad);
      const cx = (f.x||0)/1000 + (W/2)*cos - (D/2)*sin;
      const cz = (f.z||0)/1000 + (W/2)*sin + (D/2)*cos;
      m.position.set(cx, 0.002, cz);
    }

    function update(newFl) {
      applyTransform(mesh, newFl);
      if (mesh.material && mesh.material.map) {
        mesh.material.opacity = newFl.opacity != null ? newFl.opacity : mesh.material.opacity;
        mesh.material.needsUpdate = true;
      }
    }
    return { mesh, update };
  }

  function addDefaultFloor(scene3, bounds, span) {
    const floorSize = Math.max(span * 1.6, 4);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(floorSize, floorSize),
      new THREE.MeshStandardMaterial({ color: 0xeadcc1, roughness: 0.95 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(bounds.cx / 1000, -0.005, bounds.cz / 1000);
    scene3.add(floor);

    const gridDivs = Math.max(8, Math.ceil(floorSize * 2));
    const gridHelper = new THREE.GridHelper(floorSize, gridDivs, 0xb08458, 0xddcaa6);
    gridHelper.material.opacity = 0.4;
    gridHelper.material.transparent = true;
    gridHelper.position.set(bounds.cx / 1000, 0.001, bounds.cz / 1000);
    scene3.add(gridHelper);
  }

  /* ---------- 박스 (벽 or 가구) — Group으로 묶어 회전/이동/리빌드 가능 ---------- */
  function addBox(scene3, b, opts) {
    const W = (b.w || 100) / 1000;
    const H = (b.h || 100) / 1000;
    const D = (b.d || 100) / 1000;
    const isWall = !!opts.isWall;

    const group = new THREE.Group();
    group.position.set((b.x || 0) / 1000, (b.y || 0) / 1000, (b.z || 0) / 1000);
    group.rotation.y = (b.rotation || 0) * Math.PI / 180;

    const defaultColor = isWall ? "#d8d3ca" : "#c9b08c";
    const color = new THREE.Color(b.color || defaultColor);
    const mat = new THREE.MeshStandardMaterial({
      color, roughness: isWall ? 0.96 : 0.78, metalness: 0.03,
      transparent: !isWall, opacity: isWall ? 1.0 : 0.94,
    });
    const geo = new THREE.BoxGeometry(W, H, D);
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: isWall ? 0xa49d8e : 0x2b2722 })
    );
    group.add(edges);

    const showW = b.showW === undefined ? !isWall : !!b.showW;
    const showH = b.showH === undefined ? !isWall : !!b.showH;
    const showD = !!b.showD;
    const off = clamp(Math.max(W, H, D) * 0.08, 0.06, 0.25);

    if (showW) {
      addDimension(group,
        new THREE.Vector3(-W / 2, H / 2, D / 2),
        new THREE.Vector3( W / 2, H / 2, D / 2),
        new THREE.Vector3(0, off, off), `W ${b.w} mm`, opts.labelSize);
    }
    if (showH) {
      addDimension(group,
        new THREE.Vector3(W / 2, -H / 2, D / 2),
        new THREE.Vector3(W / 2,  H / 2, D / 2),
        new THREE.Vector3(off, 0, off), `H ${b.h} mm`, opts.labelSize);
    }
    if (showD) {
      addDimension(group,
        new THREE.Vector3(-W / 2, H / 2, -D / 2),
        new THREE.Vector3(-W / 2, H / 2,  D / 2),
        new THREE.Vector3(-off, off, 0), `D ${b.d} mm`, opts.labelSize);
    }

    scene3.add(group);
    return { group, mesh, edges };
  }

  /* ---------- 디멘션 라인 (양 끝점 + 부드러운 곡선) ---------- */
  function addDimension(parent, p1, p2, off, label, labelSize) {
    const a2 = new THREE.Vector3().addVectors(p1, off);
    const b2 = new THREE.Vector3().addVectors(p2, off);
    // CatmullRom 곡선으로 p1 → a2 → b2 → p2 부드럽게 통과
    const curve = new THREE.CatmullRomCurve3([p1, a2, b2, p2], false, "catmullrom", 0.5);
    const points = curve.getPoints(48);
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0x3a2f22, transparent: true, opacity: 0.92, depthTest: true,
    });
    parent.add(new THREE.Line(geo, mat));
    // 양 끝점 마커 (작은 점)
    const dotR = clamp((labelSize || 0.3) * 0.05, 0.012, 0.04);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x3a2f22 });
    const d1 = new THREE.Mesh(new THREE.SphereGeometry(dotR, 10, 10), dotMat); d1.position.copy(p1); parent.add(d1);
    const d2 = new THREE.Mesh(new THREE.SphereGeometry(dotR, 10, 10), dotMat); d2.position.copy(p2); parent.add(d2);
    // 라벨
    const mid = new THREE.Vector3().addVectors(a2, b2).multiplyScalar(0.5);
    const sp = makeLabelSprite(label, labelSize);
    sp.position.copy(mid);
    parent.add(sp);
  }

  /* ---------- 텍스트 라벨 스프라이트 ---------- */
  function makeLabelSprite(text, worldWidth) {
    const dpr = 2;
    const cw = 320, ch = 80;
    const canvas = document.createElement("canvas");
    canvas.width = cw * dpr; canvas.height = ch * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "rgba(255, 253, 250, 0.95)";
    roundRect(ctx, 1, 1, cw - 2, ch - 2, 14); ctx.fill();
    ctx.strokeStyle = "#b08458"; ctx.lineWidth = 2; ctx.stroke();

    ctx.fillStyle = "#2b2722";
    ctx.font = '700 38px Pretendard, -apple-system, sans-serif';
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(text, cw / 2, ch / 2 + 2);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.anisotropy = 4;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex, transparent: true, depthTest: false, depthWrite: false,
    }));
    sp.scale.set(worldWidth, worldWidth * (ch / cw), 1);
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

  function computeBounds(boxes) {
    if (!boxes.length) return { cx: 0, cy: 1000, cz: 0, w: 2000, h: 2000, d: 2000 };
    let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity, zmin = Infinity, zmax = -Infinity;
    for (const b of boxes) {
      const W = b.w || 100, H = b.h || 100, D = b.d || 100;
      const cx = b.x || 0, cy = b.y || 0, cz = b.z || 0;
      xmin = Math.min(xmin, cx - W / 2); xmax = Math.max(xmax, cx + W / 2);
      ymin = Math.min(ymin, cy - H / 2); ymax = Math.max(ymax, cy + H / 2);
      zmin = Math.min(zmin, cz - D / 2); zmax = Math.max(zmax, cz + D / 2);
    }
    return {
      cx: (xmin + xmax) / 2, cy: (ymin + ymax) / 2, cz: (zmin + zmax) / 2,
      w: xmax - xmin, h: ymax - ymin, d: zmax - zmin,
    };
  }
  function initialCamera(view, t, dist) {
    if (view === "front") return new THREE.Vector3(t.x, t.y, t.z + dist);
    if (view === "side") return new THREE.Vector3(t.x + dist, t.y, t.z);
    if (view === "top") return new THREE.Vector3(t.x + 0.001, t.y + dist, t.z);
    return new THREE.Vector3(t.x + dist * 0.85, t.y + dist * 0.7, t.z + dist * 1.0);
  }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
  }
})();
