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
        <button class="fur3d-reset" type="button" title="시점 초기화">⟲</button>
        ${hasFloor ? `<button class="fur3d-edit" type="button" title="평면도 위치 맞추기">✏️ 편집</button>` : ""}
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

    walls.forEach(w => addBox(scene3, w, { isWall: true, labelSize, span }));
    pieces.forEach(p => addBox(scene3, p, { isWall: false, labelSize, span }));

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
    ctrls.minPolarAngle = 0.05;
    ctrls.maxPolarAngle = Math.PI / 2 - 0.02;
    ctrls.update();

    function resetView() {
      camera.position.copy(initialCamera(view0, target, dist));
      ctrls.target.copy(target);
      ctrls.update();
    }
    resetBtn.addEventListener("click", resetView);
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

    return card;
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
      const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), -Math.PI/2);
      const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), (f.rotation||0) * Math.PI / 180);
      m.quaternion.copy(qY).multiply(qX);
      // 위치 = 중심
      m.position.set((f.x||0)/1000, 0.002, (f.z||0)/1000);
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

  /* ---------- 박스 (벽 or 가구) ---------- */
  function addBox(scene3, b, opts) {
    const W = (b.w || 100) / 1000;
    const H = (b.h || 100) / 1000;
    const D = (b.d || 100) / 1000;
    const cx = (b.x || 0) / 1000;
    const cy = (b.y || 0) / 1000;
    const cz = (b.z || 0) / 1000;
    const isWall = !!opts.isWall;

    const defaultColor = isWall ? "#d8d3ca" : "#c9b08c";
    const color = new THREE.Color(b.color || defaultColor);
    const mat = new THREE.MeshStandardMaterial({
      color, roughness: isWall ? 0.96 : 0.78, metalness: 0.03,
      transparent: !isWall, opacity: isWall ? 1.0 : 0.94,
    });
    const geo = new THREE.BoxGeometry(W, H, D);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cx, cy, cz);
    scene3.add(mesh);

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: isWall ? 0xa49d8e : 0x2b2722 })
    );
    edges.position.copy(mesh.position);
    scene3.add(edges);

    const showW = b.showW === undefined ? !isWall : !!b.showW;
    const showH = b.showH === undefined ? !isWall : !!b.showH;
    const showD = !!b.showD;
    const off = clamp(Math.max(W, H, D) * 0.08, 0.06, 0.25);

    if (showW) {
      const p1 = new THREE.Vector3(cx - W / 2, cy + H / 2, cz + D / 2);
      const p2 = new THREE.Vector3(cx + W / 2, cy + H / 2, cz + D / 2);
      addDimension(scene3, p1, p2, new THREE.Vector3(0, off, off), `W ${b.w} mm`, opts.labelSize);
    }
    if (showH) {
      const p1 = new THREE.Vector3(cx + W / 2, cy - H / 2, cz + D / 2);
      const p2 = new THREE.Vector3(cx + W / 2, cy + H / 2, cz + D / 2);
      addDimension(scene3, p1, p2, new THREE.Vector3(off, 0, off), `H ${b.h} mm`, opts.labelSize);
    }
    if (showD) {
      const p1 = new THREE.Vector3(cx - W / 2, cy + H / 2, cz - D / 2);
      const p2 = new THREE.Vector3(cx - W / 2, cy + H / 2, cz + D / 2);
      addDimension(scene3, p1, p2, new THREE.Vector3(-off, off, 0), `D ${b.d} mm`, opts.labelSize);
    }
  }

  /* ---------- 디멘션 라인 (witness + 라벨) ---------- */
  function addDimension(scene3, p1, p2, off, label, labelSize) {
    const a2 = new THREE.Vector3().addVectors(p1, off);
    const b2 = new THREE.Vector3().addVectors(p2, off);
    const points = [p1, a2, b2, p2];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0x3a2f22, transparent: true, opacity: 0.9, depthTest: true,
    });
    scene3.add(new THREE.Line(geo, mat));
    const mid = new THREE.Vector3().addVectors(a2, b2).multiplyScalar(0.5);
    const sp = makeLabelSprite(label, labelSize);
    sp.position.copy(mid);
    scene3.add(sp);
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
