/* ============================================================
 *  공통 렌더링 — 모든 페이지가 이 파일을 사용합니다.
 *  data.js 를 먼저 로드한 뒤 이 파일을 로드하세요.
 * ============================================================ */
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // 휴대폰 마스킹 — 사이트가 public 이라 ****-**** 로만 노출. 실제 번호는 data.js 에 있고 소유자만 접근.
  const maskPhone = (p) => {
    if (!p) return "";
    const m = String(p).trim().match(/^(\d{2,3})[- ]?(\d{3,4})[- ]?(\d{4})$/);
    return m ? `${m[1]}-****-****` : "****-****";
  };
  const phaseName = (id) => { const p = PHASES.find((x) => x.id === id); return p ? `${p.icon} ${p.name}` : id; };

  // 공정표 작업명 → 작업계획서 공정 id (더블클릭 이동용)
  const NAME2PHASE = {
    "이사": "move",
    "입주민 동의": "consent",
    "보양": "demolition",
    "철거": "demolition", "가스배관 철거": "demolition", "폐기물 처리": "demolition",
    "샷시": "window", "설비": "demolition",
    "보일러": "hvac", "에어컨": "hvac", "전열교환기": "hvac", "전열교환기 (실측)": "hvac", "전열교환기 (배관)": "hvac", "전열교환기 (타공)": "hvac", "전열교환기 (마무리)": "hvac",
    "전기": "electric", "전기 1": "electric", "전기 2 (타공)": "electric", "전기 (타공)": "electric",
    "목공 (방음)": "carpentry",
    "타일": "tile", "타일 (도기)": "tile", "도기": "tile", "욕실천장": "tile",
    "타일 줄눈": "tile", "줄눈": "tile",
    "세라믹 (실측)": "ceramic", "세라믹·안방세면대 설치": "ceramic", "세라믹": "ceramic",
    "필름": "film", "도배": "wallpaper", "장판": "floor",
    "가구 (신발장·부엌·붙박이장)": "furniture",
    "전기 (조명)": "electric",
    "하자 보수": "cleaning", "중문": "middle-door", "입주청소": "cleaning",
  };
  const goPhase = (pid) => { if (pid) location.href = "plans.html#" + pid; };

  /* ---------- 네비게이션 ---------- */
  const NAV = [
    { href: "index.html", label: "홈", key: "home" },
    { href: "schedule.html", label: "공정표", key: "schedule" },
    { href: "plans.html", label: "작업계획서", key: "plans" },
    { href: "work.html", label: "작업 안내", key: "work" },
    { href: "floorplan.html", label: "도면", key: "floorplan" },
    { href: "furniture.html", label: "가구도면", key: "furniture" },
    { href: "quotes.html", label: "견적/후보", key: "quotes" },
    { href: "materials.html", label: "자재", key: "materials" },
    { href: "references.html", label: "레퍼런스", key: "refs" },
    { href: "contacts.html", label: "연락처", key: "contacts" },
  ];
  function mountNav() {
    const el = $("nav");
    if (!el) return;
    // 전체 사이트(견적·연락처 포함)를 본 적 있는 브라우저 = 소유자. 작업자 공유 페이지에서 '전체 사이트' 링크 노출 판단용.
    try { localStorage.setItem("oh-owner", "1"); } catch (e) {}
    const active = document.body.dataset.page;
    el.innerHTML =
      `<div class="wrap"><a class="brand" href="index.html">🏠 ${esc(PROJECT.title)}</a>` +
      NAV.map((n) => `<a class="link${n.key === active ? " active" : ""}" href="${n.href}">${esc(n.label)}</a>`).join("") +
      `</div>`;
  }

  /* ---------- 공통 조각 ---------- */
  function renderInfoGrid(elId) {
    const el = $(elId); if (!el) return;
    el.innerHTML = Object.entries(PROJECT.info)
      .map(([k, v]) => `<div class="info-card"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div></div>`).join("");
  }
  function renderRooms() {
    const el = $("rooms"); if (!el || typeof ROOMS === "undefined") return;
    el.innerHTML = ROOMS.map((r) => `<span class="room">${esc(r)}</span>`).join("");
  }

  /* ---------- 홈 ---------- */
  function renderHome() {
    const t = $("title"); if (t) t.textContent = PROJECT.title;
    const s = $("subtitle"); if (s) s.textContent = PROJECT.subtitle;
    const intro = $("intro");
    if (intro) {
      if (PROJECT.intro) intro.textContent = PROJECT.intro;
      else intro.style.display = "none";
    }
    const map = $("maplink");
    if (map && PROJECT.mapUrl) map.innerHTML = `<a class="map-btn" href="${esc(PROJECT.mapUrl)}" target="_blank" rel="noopener">📍 네이버 지도에서 단지 위치 보기 ↗</a>`;
    const video = $("video");
    if (video && PROJECT.youtube) video.innerHTML =
      `<a class="video-wrap video-thumb" href="https://www.youtube.com/watch?v=${esc(PROJECT.youtube)}" target="_blank" rel="noopener" title="유튜브에서 영상 보기">` +
        `<img src="https://img.youtube.com/vi/${esc(PROJECT.youtube)}/hqdefault.jpg" alt="집 둘러보기 영상" loading="lazy">` +
        `<span class="video-play" aria-hidden="true">▶</span>` +
      `</a>` +
      `<p class="video-cap">우리 집과 같은 구조의 영상이에요. <a href="https://www.youtube.com/watch?v=${esc(PROJECT.youtube)}" target="_blank" rel="noopener">유튜브에서 보기 ↗</a></p>`;
    renderInfoGrid("info");
    renderRooms();
  }

  /* ---------- 인테리어 컨셉 ---------- */
  function renderConcept() {
    if (typeof CONCEPT === "undefined") return;
    const mood = $("concept-mood"); if (mood) mood.textContent = CONCEPT.mood || "";
    const kw = $("concept-keywords");
    if (kw) kw.innerHTML = (CONCEPT.keywords || []).map((k) => `<span class="kw">${esc(k)}</span>`).join("");
    const mat = $("concept-materials");
    if (mat) mat.innerHTML = (CONCEPT.materials || []).map((m) => `<tr><th>${esc(m.area)}</th><td>${esc(m.spec)}</td></tr>`).join("");
    const sec = $("concept-sections");
    if (sec) sec.innerHTML = (CONCEPT.sections || []).map((s) =>
      `<div class="cc-card"><div class="cc-h"><span class="ic">${esc(s.icon || "")}</span><h3>${esc(s.title)}</h3></div><p>${esc(s.body)}</p></div>`).join("");
    const mb = $("concept-moodboard");
    if (mb) mb.innerHTML = (CONCEPT.moodboard && CONCEPT.moodboard.length)
      ? CONCEPT.moodboard.map((m) => `<div class="mood-card"><div class="media"><object data="images/${esc(m.file)}" type="image/jpeg">📎 ${esc(m.file)}</object></div>${m.caption ? `<div class="cap">${esc(m.caption)}</div>` : ""}</div>`).join("")
      : `<div class="stub">큰 틀의 무드 레퍼런스 사진을 <code>images/</code> 에 넣고 <code>data.js</code>의 <code>CONCEPT.moodboard</code>에 추가하면 여기에 표시됩니다.</div>`;
  }

  /* ---------- 공정 계획표 (연속 캘린더 뷰) ---------- */
  function renderCalendar() {
    const el = $("cal"); if (!el || typeof SCHEDULE === "undefined") return;

    const PALETTE = ["#5b8def","#e0883e","#6a9c5c","#c97a8a","#7b6dab","#3aa5b8","#d9a13a","#8b5e3b","#46708f","#c14d4d","#71a07a","#9b6bb0","#d68c2e","#5b8a7e","#b56c50","#7691c4","#a47ad6","#3f8a6c","#c46161","#5d7da1"];
    const phaseColor = {};
    PHASES.forEach((p, i) => phaseColor[p.id] = PALETTE[i % PALETTE.length]);
    const colorFor = (taskName, override) => override || phaseColor[NAME2PHASE[taskName]] || "#888";

    const holidays = new Set(SCHEDULE.holidays || []);
    const parse = (str) => { const [y,m,d] = str.split("-").map(Number); return new Date(y,m-1,d); };
    const fmtKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const isWeekend = (d) => d.getDay() === 0;  // Sunday only
    const isHoliday = (d) => holidays.has(fmtKey(d));
    const isOff = (d) => isWeekend(d) || isHoliday(d);

    let minD = null, maxD = null;
    SCHEDULE.tasks.forEach(t => (t.spans||[]).forEach(([a,b]) => {
      const da = parse(a), db = parse(b);
      if (!minD || da < minD) minD = da;
      if (!maxD || db > maxD) maxD = db;
    }));
    if (!minD) { el.innerHTML = '<div class="stub">일정이 없습니다</div>'; return; }

    // 시작 주의 월요일, 끝 주의 금요일까지
    const mondayOf = (d) => { const r = new Date(d); r.setDate(r.getDate() - ((r.getDay()+6)%7)); return r; };
    const firstMon = mondayOf(minD);
    const lastMon = mondayOf(maxD);
    const lastFri = new Date(lastMon); lastFri.setDate(lastFri.getDate()+4);

    const weeks = [];
    let curMon = new Date(firstMon);
    while (curMon <= lastFri) {
      const week = [];
      for (let i = 0; i < 6; i++) { const d = new Date(curMon); d.setDate(d.getDate()+i); week.push(d); }
      weeks.push(week);
      curMon.setDate(curMon.getDate() + 7);
    }

    let html = '<div class="cm-dow">' + ["월","화","수","목","금","토"].map(d => `<div>${d}</div>`).join("") + '</div>';
    html += '<div class="cm-weeks">';

    weeks.forEach(week => {
      // 이벤트 세그먼트 수집
      const segs = [];
      SCHEDULE.tasks.forEach((t) => {
        (t.spans||[]).forEach(([a,b]) => {
          const sa = parse(a), sb = parse(b);
          let runStart = -1;
          for (let i = 0; i < 6; i++) {
            const d = week[i];
            const inSpan = d >= sa && d <= sb;
            const ok = inSpan && !isOff(d);
            if (ok) { if (runStart < 0) runStart = i; }
            else if (runStart >= 0) {
              segs.push({ start: runStart, end: i-1, name: t.name, color: colorFor(t.name, t.color), pid: NAME2PHASE[t.name] });
              runStart = -1;
            }
          }
          if (runStart >= 0) segs.push({ start: runStart, end: 5, name: t.name, color: colorFor(t.name, t.color), pid: NAME2PHASE[t.name] });
        });
      });

      // 레인 배정
      segs.sort((a,b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
      const lanes = [];
      segs.forEach(s => {
        let lane = 0;
        while (lane < lanes.length && lanes[lane].some(x => !(s.end < x.start || s.start > x.end))) lane++;
        if (lane === lanes.length) lanes.push([]);
        lanes[lane].push({start:s.start, end:s.end});
        s.lane = lane;
      });
      const laneCount = Math.max(lanes.length, 1);
      const minH = 32 + laneCount * 22 + 8;

      let cells = week.map(d => {
        const hol = isHoliday(d);
        const isFirst = d.getDate() === 1;
        const label = isFirst ? `${d.getMonth()+1}.${d.getDate()}` : `${d.getDate()}`;
        return `<div class="cm-day ${hol?"cm-hol":""}"><span class="cm-num ${isFirst?"cm-first":""}">${label}</span></div>`;
      }).join("");

      let evtHtml = segs.map(s => {
        const left = (s.start / 6) * 100;
        const width = ((s.end - s.start + 1) / 6) * 100;
        const top = 32 + s.lane * 22;
        return `<div class="cm-ev" ${s.pid?`data-pid="${s.pid}"`:""} style="left:calc(${left}% + 2px);width:calc(${width}% - 4px);top:${top}px;background:${s.color}" title="${esc(s.name)}">${esc(s.name)}</div>`;
      }).join("");

      html += `<div class="cm-week"><div class="cm-day-grid" style="--minh:${minH}px">${cells}</div><div class="cm-events">${evtHtml}</div></div>`;
    });

    html += '</div>';
    el.innerHTML = html;

    el.querySelectorAll(".cm-ev[data-pid]").forEach(ev => ev.addEventListener("dblclick", () => goPhase(ev.dataset.pid)));

    // 하단 작업순서 칩
    const flow = $("flow");
    if (flow) {
      flow.innerHTML = PHASES.map((p, i) =>
        `<div class="step" data-pid="${p.id}" title="더블클릭 → 작업계획서로 이동"><span class="n" style="background:${phaseColor[p.id]}">${i+1}</span>${esc(p.name)}</div>` +
        (i < PHASES.length - 1 ? `<span class="arrow">→</span>` : "")
      ).join("");
      flow.addEventListener("dblclick", (e) => {
        const step = e.target.closest(".step[data-pid]");
        if (step) goPhase(step.dataset.pid);
      });
    }
  }

  /* ---------- 결정 필요 / 확인 필요 ---------- */
  function renderDecisions() {
    const decEl = $("dec-list");
    if (decEl) {
      const decs = [];
      PHASES.forEach((p) => (p.decisions || []).forEach((q) => decs.push({ phase: p.name, q })));
      const c = $("dec-count"); if (c) c.textContent = `(${decs.length}건)`;
      decEl.innerHTML = decs.map((d) =>
        `<div class="dec-item"><span class="tag">${esc(d.phase)}</span><span class="q">${esc(d.q)}</span></div>`
      ).join("") || `<div class="stub">결정할 항목이 없습니다 🎉</div>`;
    }
    const chkEl = $("chk-list");
    if (chkEl) {
      const chks = [];
      PHASES.forEach((p) => (p.checks || []).forEach((q) => chks.push({ phase: p.name, q })));
      const c = $("chk-count"); if (c) c.textContent = `(${chks.length}건)`;
      chkEl.innerHTML = chks.map((d) =>
        `<div class="dec-item chk"><span class="tag">${esc(d.phase)}</span><span class="q">${esc(d.q)}</span></div>`
      ).join("") || `<div class="stub">확인할 항목이 없습니다 🎉</div>`;
    }
  }

  /* ---------- 작업계획서 (overview + phases) ---------- */
  const allRefs = () => (typeof REFERENCES !== "undefined" ? REFERENCES : []);
  function relatedRefs(phaseId) {
    return allRefs().filter((r) => (r.phases || []).includes(phaseId));
  }
  const imgType = (f) => { const e = (String(f).split(".").pop() || "").toLowerCase(); return "image/" + (e === "jpg" ? "jpeg" : (e || "jpeg")); };
  // 클릭하면 확대(라이트박스)되는 이미지
  const zoomImg = (file, alt) => `<img class="zoom" src="images/${esc(file)}" alt="${esc(alt || file)}" loading="lazy">`;
  function refThumb(r) {
    const media = zoomImg(r.file, r.title);
    return `<div class="ref-thumb">${media}<div class="rc"><b>${esc(r.title)}</b>${esc(r.desc || "")}${r.link ? `<br><a class="ref-link" href="${esc(r.link)}" target="_blank" rel="noopener">제품 링크 ↗</a>` : ""}</div></div>`;
  }
  function renderOverview() {
    const el = $("overview-grid"); if (!el) return;
    el.innerHTML = PHASES.map((p, i) => {
      const badges = [];
      if (p.decisions && p.decisions.length) badges.push(`<span class="b-dec">⚠️ 결정 ${p.decisions.length}</span>`);
      if (p.checks && p.checks.length) badges.push(`<span class="b-chk">✓ 확인 ${p.checks.length}</span>`);
      return `<a class="ov-card" href="plans.html#${p.id}">
        <div class="top"><span class="num">${i + 1}</span><span class="ic">${esc(p.icon)}</span><span class="nm">${esc(p.name)}</span></div>
        <div class="sm">${esc(p.summary || "")}</div>
        ${badges.length ? `<div class="badges">${badges.join("")}</div>` : ""}
      </a>`;
    }).join("");
  }
  // 공정 카드 1개 HTML — plans.html(작업계획서)와 work.html(작업 안내)이 공유.
  //   opts.hideTeam    : 담당 업체명 숨김 (작업자 공유 뷰)
  //   opts.noId        : 카드에 id 부여 안 함 (탭 라우팅과 충돌 방지)
  //   opts.hideCaution : ⚠️ 공정 시 주의 박스 숨김
  //   opts.hideAsk     : 💬 업자 확인 박스 숨김
  // 세부 항목 1개 — 문자열이면 그대로, 객체면 미정·메모·공정주의·업자확인을 인라인 표시.
  //   { text, undecided?:true, memo?:"직접구매 등",
  //     caution?:"주의점" | [...],   // ⚠️ 공정 시 주의 (시공 시 주의할 점)
  //     ask?:"질문" | [...] }        // 💬 업자 확인 (업자에게 물어볼 것 — 별개)
  function itemHTML(it, opts = {}) {
    if (typeof it === "string") return `<li>${esc(it)}</li>`;
    const cautions = !opts.hideCaution && it.caution ? (Array.isArray(it.caution) ? it.caution : [it.caution]) : [];
    const asks = !opts.hideAsk && it.ask ? (Array.isArray(it.ask) ? it.ask : [it.ask]) : [];
    return `<li class="item-x${it.undecided ? " undecided" : ""}">` +
      `<span class="it-text">${esc(it.text)}</span>` +
      (it.undecided ? ` <span class="it-flag undecided">미정</span>` : "") +
      (it.memo ? ` <span class="it-memo">📝 ${esc(it.memo)}</span>` : "") +
      cautions.map((q) => `<div class="it-caution">⚠️ 공정 시 주의: ${esc(q)}</div>`).join("") +
      asks.map((q) => `<div class="it-ask">💬 업자 확인: ${esc(q)}</div>`).join("") +
      `</li>`;
  }
  function phaseCardHTML(p, i, opts = {}) {
    const groups = (p.groups || []).filter((g) => g.items && g.items.length).map((g) => `
      <div class="group">
        ${g.title ? `<div class="gtitle">${esc(g.title)}</div>` : ""}
        <ul class="items">${g.items.map((it) => itemHTML(it, opts)).join("")}</ul>
      </div>`).join("");
    let highlights = "";
    if (p.highlights && p.highlights.length) {
      const copyText = `[${p.name}] 주요 변경·추가 요약\n` +
        p.highlights.map((h) => `- ${h.label}: ${h.value}${h.note ? ` (${h.note})` : ""}`).join("\n");
      highlights = `
      <div class="phase-highlights">
        <div class="ph-h">📌 한눈에 — 주요 변경·추가 (견적용 요약)<button class="hl-copy" type="button" data-copy="${esc(copyText)}">📋 복사</button></div>
        <ul class="hl-list">${p.highlights.map((h) =>
          `<li><b>${esc(h.label || "")}</b> — ${esc(h.value || "")}${h.note ? ` <span class="hl-n">(${esc(h.note)})</span>` : ""}</li>`).join("")}</ul>
      </div>`;
    }
    const phaseAsks = (!opts.hideAsk && p.asks && p.asks.length)
      ? `<div class="phase-asks">${p.asks.map((q) => `<div class="it-ask">💬 업자 확인: ${esc(q)}</div>`).join("")}</div>` : "";
    const dec = (p.decisions && p.decisions.length) ? `
      <div class="phase-dec"><div class="dt">⚠️ 결정 필요</div>
      <ul class="items">${p.decisions.map((q) => `<li>${esc(q)}</li>`).join("")}</ul></div>` : "";
    const chk = (p.checks && p.checks.length) ? `
      <div class="phase-chk"><div class="dt">✓ 확인 필요 (놓치기 쉬운 것)</div>
      <ul class="items">${p.checks.map((q) => `<li>${esc(q)}</li>`).join("")}</ul></div>` : "";
    const imgs = (p.images && p.images.length) ? `
      <div class="imgs">${p.images.map((im) => `
        <div class="img-ph">
          ${zoomImg(im.file, im.label)}
          <div class="cap">${esc(im.label)}</div>
        </div>`).join("")}</div>` : "";
    const refs = relatedRefs(p.id);
    const refBlock = refs.length ? `
      <div class="phase-refs"><div class="rt">🖼️ 관련 레퍼런스</div>
      <div class="ref-thumbs">${refs.map(refThumb).join("")}</div></div>` : "";
    const team = opts.hideTeam ? "" : `<div class="phase-team">👷 ${esc(p.team)}</div>`;
    const keyNotes = (typeof KEY_NOTES !== "undefined" && KEY_NOTES.length) ? `
      <div class="phase-keynotes">
        <div class="kn-h">🏠 우리집 주요 변경 — 모든 공정 공통</div>
        <ul>${KEY_NOTES.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>
      </div>` : "";
    return `<div class="phase"${opts.noId ? "" : ` id="${p.id}"`}>
      <div class="phase-head"><span class="num">${i + 1}</span><span class="icon">${esc(p.icon)}</span><h3>${esc(p.name)}</h3></div>
      ${team}
      ${p.summary ? `<div class="phase-summary">${esc(p.summary)}</div>` : ""}
      ${highlights}
      ${phaseAsks}
      ${imgs}${refBlock}
      <div class="cols">${groups}</div>${dec}${chk}
      ${keyNotes}
    </div>`;
  }
  function renderPhases() {
    const el = $("phases"); if (!el) return;
    el.innerHTML = PHASES.map((p, i) => phaseCardHTML(p, i)).join("");
    // 해시(#electric 등)로 들어오면 해당 공정으로 스크롤 — 이미지가 lazy 로드되며 위쪽 높이가 변해도 다시 정렬
    const scrollToHash = () => {
      const id = decodeURIComponent((location.hash || "").slice(1));
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      const align = () => target.scrollIntoView({ behavior: "auto", block: "start" });
      align();
      el.querySelectorAll("img").forEach((img) => {
        if (!img.complete) img.addEventListener("load", align, { once: true });
      });
      setTimeout(align, 250);
      setTimeout(align, 800);
    };
    setTimeout(scrollToHash, 30);
    window.addEventListener("hashchange", scrollToHash);
  }

  /* ---------- 현장 → 변화 (As-Is / To-Be) ---------- */
  function baCardHTML(b, opts) {
    const hideToBe = opts && opts.hideToBe;
    const arr = (x) => Array.isArray(x) ? x.filter(Boolean) : (x ? [x] : []);
    const thumbs = (files, cls) => files.length
      ? `<div class="ba-thumbs">${files.map((f) => `<img class="ba-thumb zoom" src="images/${esc(f)}" alt="${esc(b.area || "")}" loading="lazy">`).join("")}</div>`
      : `<div class="ba-empty">${cls === "tobe" ? "🤖 AI 시안 준비 중" : "📷 현장 사진 준비 중"}</div>`;
    return `
      <div class="ba-card">
        <div class="ba-head"><h4>${esc(b.area || "")}</h4>${b.note ? `<span class="ba-note">${esc(b.note)}</span>` : ""}</div>
        <div class="ba-pair">
          <div class="ba-col"><div class="ba-col-label asis">현장 · As-Is</div>${thumbs(arr(b.asis), "asis")}</div>
          ${hideToBe ? "" : `<div class="ba-col"><div class="ba-col-label tobe">🤖 AI 시안 · To-Be</div>${thumbs(arr(b.tobe), "tobe")}</div>`}
        </div>
      </div>`;
  }
  function renderBeforeAfter() {
    const el = $("ba-grid"); if (!el) return;
    const list = (typeof BEFORE_AFTER !== "undefined" ? BEFORE_AFTER : []);
    el.innerHTML = list.map((b) => baCardHTML(b, { hideToBe: true })).join("") || `<div class="stub">현장 사진을 <code>images/</code> 에 넣고 <code>data.js</code>의 <code>BEFORE_AFTER</code>에 추가하세요.</div>`;
  }

  /* ---------- 레퍼런스 갤러리 ---------- */
  function renderReferences() {
    const el = $("ref-grid"); if (!el) return;
    const refs = allRefs();
    el.innerHTML = refs.map((r) => `
      <div class="ref-card">
        <div class="media">${zoomImg(r.file, r.title)}</div>
        <div class="body">
          <h4>${esc(r.title)}</h4>
          <p>${esc(r.desc || "")}</p>
          ${r.link ? `<a class="ref-link" href="${esc(r.link)}" target="_blank" rel="noopener">제품 링크 ↗</a>` : ""}
          ${(r.phases && r.phases.length) ? `<div class="ref-tags">${r.phases.map((pid) => `<span class="t">${esc(phaseName(pid))}</span>`).join("")}</div>` : ""}
        </div>
      </div>`).join("") || `<div class="stub">아직 레퍼런스가 없어요. 사진을 images/ 에 넣고 data.js의 REFERENCES에 추가하세요.</div>`;
  }

  /* ---------- 연락처 ---------- */
  function renderContacts() {
    const el = $("contacts-grid");
    if (el) el.innerHTML = CONTACTS.map((c) => `
      <div class="contact-card">
        <div class="role">${esc(c.role)}</div>
        <div class="name">${esc(c.name)}${c.company ? ` · ${esc(c.company)}` : ""}</div>
        ${c.phone ? `<div class="phone">${esc(maskPhone(c.phone))}</div>` : `<div class="note">연락처 미정</div>`}
        ${c.note ? `<div class="note">${esc(c.note)}</div>` : ""}
      </div>`).join("");
    const cand = $("candidates");
    if (cand) cand.innerHTML = DESIGN_CANDIDATES.map((c) => `
      <div class="cand"><span><b>${esc(c.name)}</b>${c.note ? ` · <span style="color:var(--muted);font-size:13px">${esc(c.note)}</span>` : ""}</span>
      ${c.link ? `<a href="${esc(c.link)}" target="_blank" rel="noopener">링크 열기 ↗</a>` : ""}</div>`).join("");
  }

  /* ---------- 견적 / 후보 (공정별) ---------- */
  function quoteFile(f) {
    const path = typeof f === "string" ? f : f.file;
    const label = (typeof f === "object" && f.label) ? f.label : path.split("/").pop();
    const ext = (path.split(".").pop() || "").toLowerCase();
    const isImg = ["png", "jpg", "jpeg", "webp", "gif", "avif"].includes(ext);
    const preview = isImg
      ? `<object data="${esc(path)}" type="image/${ext === "jpg" ? "jpeg" : ext}"><div class="qf-ph">📎</div></object>`
      : `<div class="qf-doc"><span class="qf-ic">${ext === "pdf" ? "📄" : "📎"}</span><span class="qf-ext">${esc(ext.toUpperCase() || "FILE")}</span></div>`;
    return `<a class="qf${isImg ? " img" : ""}" href="${esc(path)}" target="_blank" rel="noopener" title="${esc(label)} 열기">
      <div class="qf-media">${preview}</div><span class="qf-name">${esc(label)} ↗</span></a>`;
  }
  function quoteCard(c) {
    const stat = c.status === "decided" ? `<span class="qc-badge decided">✅ 확정</span>`
      : c.status === "received" ? `<span class="qc-badge received">📄 견적 받음</span>`
      : `<span class="qc-badge cand">후보</span>`;
    const price = c.price
      ? `<div class="qc-price">${esc(c.price)}</div>`
      : `<div class="qc-price none">견적 대기</div>`;
    const itemsTable = (c.items && c.items.length)
      ? `<table class="qc-items">${c.items.map((it) => `<tr><td>${esc(it.label)}</td><td class="amt">${esc(it.amount || "")}</td></tr>`).join("")}</table>` : "";
    const items = itemsTable
      ? `<details class="qc-details"><summary>📋 견적 자세히 보기 <span class="qc-count">(${c.items.length}항목)</span></summary>${itemsTable}</details>`
      : "";
    const files = (c.files && c.files.length)
      ? `<div class="qc-files">${c.files.map(quoteFile).join("")}</div>` : "";
    return `<div class="qcard${c.status === "decided" ? " is-decided" : ""}">
      <div class="qc-top">
        <div class="qc-name">${esc(c.name)}${c.company ? ` · <span class="qc-co">${esc(c.company)}</span>` : ""}</div>
        ${stat}
      </div>
      ${price}
      ${c.scope ? `<div class="qc-scope">📐 ${esc(c.scope)}</div>` : ""}
      ${c.summary ? `<div class="qc-sum">${esc(c.summary)}</div>` : ""}
      ${c.phone ? `<div class="qc-phone">📞 ${esc(maskPhone(c.phone))}</div>` : ""}
      ${items}
      ${c.note ? `<div class="qc-note">${esc(c.note)}</div>` : ""}
      ${files}
    </div>`;
  }
  function renderQuotes() {
    const el = $("quotes"); if (!el || typeof QUOTES === "undefined") return;
    const order = PHASES.map((p) => p.id);
    const rank = (ph) => { const i = order.indexOf(ph); return i === -1 ? Infinity : i; };
    const sorted = [...QUOTES].sort((a, b) => rank(a.phase) - rank(b.phase));
    el.innerHTML = sorted.map((q) => {
      const p = PHASES.find((x) => x.id === q.phase);
      const cands = q.candidates || [];
      const decided = cands.find((c) => c.status === "decided");
      const head = decided
        ? `<span class="qp-stat decided">✅ 확정 · ${esc(decided.name)}</span>`
        : cands.length
          ? `<span class="qp-stat pending">⏳ 견적 진행 중 · 후보 ${cands.length}곳</span>`
          : `<span class="qp-stat none">🔍 후보 찾는 중</span>`;
      const cards = cands.length
        ? cands.map(quoteCard).join("")
        : `<div class="stub">아직 후보·견적이 없어요. 업체를 알아보면 여기에 정리할게요.</div>`;
      return `<div class="qphase" id="q-${esc(q.phase)}">
        <div class="qp-head"><span class="ic">${esc(p ? p.icon : (q.icon || "📦"))}</span><h3>${esc(p ? p.name : (q.name || q.phase))}</h3>${head}</div>
        <div class="qcards">${cards}</div>
      </div>`;
    }).join("") || `<div class="stub">아직 견적 항목이 없어요.</div>`;
  }

  /* ---------- 도면 마커 (인터랙티브 평면도) ---------- */
  function renderFloorplan() {
    const root = $("fp-app");
    if (!root || typeof FLOORPLAN === "undefined") return;
    const FP = FLOORPLAN;
    const layerOf = (id) => (FP.layers || []).find((l) => l.id === id) || { id, label: id, color: "#888", icon: "📍" };
    const clone = (a) => JSON.parse(JSON.stringify(a || []));
    const round1 = (n) => Math.round(n * 10) / 10;
    const hexA = (hex, a) => { const m = /^#?([0-9a-f]{6})$/i.exec(hex || ""); if (!m) return hex; const n = parseInt(m[1], 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
    // 조명 종류별 아이콘 (라벨 키워드로 판별)
    const lightIcon = (label) => {
      const s = label || "";
      if (/간접|라인/.test(s)) return "▬";
      if (/멀티|매입/.test(s)) return "◉";
      if (/cob/i.test(s)) return "✦";
      if (/확산/.test(s)) return "◯";
      return "💡";
    };
    // 조명 빠른배치 프리셋 — 버튼 누르면 레이어·도구·라벨이 자동 세팅됨
    const LIGHT_PRESETS = [
      { key: "간접", label: "간접조명", tool: "box", icon: "▬" },
      { key: "우물천장", label: "우물천장 간접등", tool: "box", icon: "▢" },
      { key: "멀티매입", label: "멀티매입등", tool: "box", icon: "▭" },
      { key: "COB", label: "COB조명", tool: "pin", icon: "✦" },
      { key: "확산", label: "확산조명", tool: "pin", icon: "◯" },
    ];
    let presetLabel = "";   // 다음에 추가할 마커에 자동으로 붙일 라벨 (프리셋 선택 시)

    // 자동저장(브라우저) — 편집 중에만 내 브라우저에 백업해 새로고침에도 안 날아가게 한다.
    // 단, 로드 시 자동으로 덮어쓰지 않는다. (기본은 data.js 확정본, 임시저장은 배너로 불러옴)
    const LS_KEY = "fp-draft:" + FP.image;
    const readDraft = () => { try { const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; } };
    const saveDraft = () => { if (editing) { try { localStorage.setItem(LS_KEY, JSON.stringify(editItems)); } catch (e) {} } };
    const clearDraft = () => { try { localStorage.removeItem(LS_KEY); } catch (e) {} };

    let editing = false, selected = -1, drag = null, popupEl = null;
    // 기본은 항상 data.js 의 확정본. 영구 저장 = [코드 복사] → data.js 반영 → 커밋.
    let editItems = clone(FP.items);
    const hidden = new Set();
    let curLayer = (FP.layers[0] || {}).id, curTool = "pin";

    // 실행취소(undo) — 변경 직전 상태 스냅샷을 쌓아두고 뒤로가기/Delete/↩ 로 되돌림
    const undoStack = [];
    let guardArmed = false;
    function armGuard() { if (!guardArmed) { try { history.pushState({ fpGuard: 1 }, ""); } catch (e) {} guardArmed = true; } }
    function recordUndo(pre) { undoStack.push(pre); if (undoStack.length > 80) undoStack.shift(); armGuard(); }
    function undo() {
      if (!undoStack.length) return false;
      editItems = undoStack.pop(); selected = -1; saveDraft();
      drawChips(); drawMarkers(); renderEditbar();
      return true;
    }

    root.innerHTML =
      '<div class="fp-toolbar"><div class="fp-chips" id="fp-chips"></div>' +
      '<button class="fp-btn" id="fp-edit">✏️ 편집</button></div>' +
      '<div class="fp-draftbar" id="fp-draftbar" hidden></div>' +
      '<div class="fp-editbar" id="fp-editbar" hidden></div>' +
      '<div class="fp-stage" id="fp-stage"><img class="fp-img" id="fp-img" alt="평면도" src="images/' + esc(FP.image) + '" />' +
      '<div class="fp-overlay" id="fp-overlay"></div></div>' +
      '<div id="fp-exportwrap" hidden></div>';

    const overlay = $("fp-overlay"), editBtn = $("fp-edit");
    // 보기·편집 모두 같은 데이터(editItems)를 표시.
    // editItems 는 내 브라우저 임시저장(draft)이 있으면 그걸, 없으면 data.js 확정본을 씀.
    const items = () => editItems;

    function drawChips() {
      $("fp-chips").innerHTML = (FP.layers || []).map((l) => {
        const n = items().filter((it) => it.layer === l.id).length;
        return `<span class="fp-chip${hidden.has(l.id) ? " off" : ""}" data-layer="${l.id}"><span class="dot" style="background:${l.color}"></span>${esc(l.icon + " " + l.label)}${n ? ` <b>${n}</b>` : ""}</span>`;
      }).join("");
    }

    function pct(e) {
      const r = overlay.getBoundingClientRect();
      return { x: Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)), y: Math.max(0, Math.min(100, (e.clientY - r.top) / r.height * 100)) };
    }

    function closePopup() { if (popupEl) { popupEl.remove(); popupEl = null; } }
    function showPopup(it) {
      closePopup(); const L = layerOf(it.layer);
      popupEl = document.createElement("div");
      popupEl.className = "fp-popup";
      popupEl.style.left = (it.type === "box" ? it.x + (it.w || 0) / 2 : it.x) + "%";
      popupEl.style.top = it.y + "%";
      popupEl.innerHTML = `<div class="pl">${esc(L.icon + " " + L.label)}</div>${esc(it.label || "(설명 없음)")}`;
      overlay.appendChild(popupEl);
    }

    function drawMarkers() {
      overlay.classList.toggle("editing", editing);
      overlay.innerHTML = ""; if (popupEl) overlay.appendChild(popupEl);
      items().forEach((it, i) => {
        if (it.type !== "legend" && hidden.has(it.layer)) return;
        const L = layerOf(it.layer); let el = document.createElement("div");
        const isCove = it.layer === "light" && /우물/.test(it.label || "");
        const isLine = it.layer === "light" && !isCove && /간접|라인/.test(it.label || "");
        const isBar = it.layer === "light" && /멀티|매입/.test(it.label || "");
        if (it.type === "legend") {
          el.className = "fp-legend";
          el.style.cssText = `left:${it.x}%;top:${it.y}%`;
          el.innerHTML =
            '<div class="row"><span class="sw line"></span>간접조명</div>' +
            '<div class="row"><span class="sw cove"></span>우물천장 간접등</div>' +
            '<div class="row"><span class="sw bar"></span>멀티매입등</div>' +
            '<div class="row"><span class="sw cob">✦</span>COB조명</div>' +
            '<div class="row"><span class="sw diff">◯</span>확산조명</div>' +
            '<div class="hr"></div>' +
            '<div class="row"><span class="sw outlet">2</span>콘센트 (숫자=구수)</div>' +
            '<div class="row"><span class="sw outlet new">2</span>신규 (노란 테두리·신 배지)</div>' +
            '<div class="row"><span class="sw switch">3</span>스위치</div>' +
            '<div class="row"><span class="sw thermo">🌡</span>온도조절기</div>';
          el.dataset.i = i;
          if (editing) el.classList.add("editing");
          if (editing && i === selected) el.classList.add("sel");
          el.addEventListener("pointerdown", (e) => onMarkerDown(e, i));
          overlay.appendChild(el);
          return;
        } else if (it.type === "box") {
          el.className = "fp-marker fp-box" + (isCove ? " cove" : "") + (isLine ? " line" : "") + (isBar ? " bar" : "");
          el.style.cssText = `left:${it.x}%;top:${it.y}%;width:${it.w || 0}%;height:${it.h || 0}%;border-color:${L.color};background:${hexA(L.color, isCove ? .07 : (isLine || isBar ? .5 : .12))}`;
          if (it.label) { const lb = document.createElement("span"); lb.className = "lb"; lb.style.background = L.color; lb.textContent = it.label; el.appendChild(lb); }
        } else if (it.type === "text") {
          el.className = "fp-marker fp-text";
          el.style.cssText = `left:${it.x}%;top:${it.y}%;color:${L.color};border-color:${hexA(L.color, .5)}`;
          el.textContent = it.label || "메모";
        } else {
          el.className = "fp-marker fp-pin";
          el.style.cssText = `left:${it.x}%;top:${it.y}%;background:${L.color}`;
          el.title = it.label || L.label;
          const gu = /(\d+)\s*구/.exec(it.label || "");   // 라벨의 "4구/2구" → 숫자 표시 + 크기 구분
          if (it.layer === "light") { el.textContent = lightIcon(it.label); el.classList.add("light"); }
          else if (gu) { el.textContent = gu[1]; el.classList.add("num", +gu[1] >= 4 ? "big" : "small"); }
          else { el.textContent = L.icon; }
          if (/신규/.test(it.label || "")) el.classList.add("new");
        }
        el.dataset.i = i;
        if (editing && i === selected) {
          el.classList.add("sel");
          if (it.type === "box") { const h = document.createElement("div"); h.className = "fp-handle"; el.appendChild(h); h.addEventListener("pointerdown", (e) => startResize(e, i)); }
        }
        el.addEventListener("pointerdown", (e) => onMarkerDown(e, i));
        overlay.appendChild(el);
      });
    }

    function onMarkerDown(e, i) {
      e.stopPropagation();
      if (!editing) { if (items()[i].type !== "legend") showPopup(items()[i]); return; }
      selected = i; renderEditbar(); drawMarkers();
      const it = editItems[i], s = pct(e);
      drag = { i, mode: "move", ox: it.x, oy: it.y, sx: s.x, sy: s.y, moved: false, pre: clone(editItems) };
      overlay.setPointerCapture(e.pointerId);
    }
    function startResize(e, i) {
      e.stopPropagation(); const it = editItems[i], s = pct(e);
      drag = { i, mode: "resize", ow: it.w || 0, oh: it.h || 0, sx: s.x, sy: s.y, moved: true, pre: clone(editItems) };
      overlay.setPointerCapture(e.pointerId);
    }

    overlay.addEventListener("pointerdown", (e) => {
      closePopup(); if (!editing) return;
      const p = pct(e);
      if (curTool === "box") {
        const pre = clone(editItems);
        editItems.push({ layer: curLayer, type: "box", x: round1(p.x), y: round1(p.y), w: 0, h: 0, label: presetLabel });
        selected = editItems.length - 1;
        drag = { i: selected, mode: "draw", sx: p.x, sy: p.y, moved: true, pre };
        overlay.setPointerCapture(e.pointerId); drawMarkers();
      } else {
        recordUndo(clone(editItems));
        editItems.push({ layer: curLayer, type: curTool === "text" ? "text" : "pin", x: round1(p.x), y: round1(p.y), label: presetLabel });
        selected = editItems.length - 1;
        saveDraft(); drawChips(); drawMarkers(); renderEditbar(true);
      }
    });
    overlay.addEventListener("pointermove", (e) => {
      if (!drag) return; const it = editItems[drag.i]; if (!it) return; const p = pct(e);
      if (drag.mode === "move") {
        const dx = p.x - drag.sx, dy = p.y - drag.sy;
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) drag.moved = true;
        it.x = round1(Math.max(0, Math.min(100, drag.ox + dx))); it.y = round1(Math.max(0, Math.min(100, drag.oy + dy)));
      } else if (drag.mode === "draw") {
        it.x = round1(Math.min(drag.sx, p.x)); it.y = round1(Math.min(drag.sy, p.y));
        it.w = round1(Math.abs(p.x - drag.sx)); it.h = round1(Math.abs(p.y - drag.sy));
      } else if (drag.mode === "resize") {
        it.w = round1(Math.max(1, drag.ow + (p.x - drag.sx))); it.h = round1(Math.max(1, drag.oh + (p.y - drag.sy)));
      }
      drawMarkers();
    });
    function endDrag() {
      if (!drag) return;
      const it = editItems[drag.i], mode = drag.mode, wasDraw = mode === "draw";
      if (wasDraw && it && it.w < 1 && it.h < 1) {
        editItems.splice(drag.i, 1); selected = -1;          // 거의 점(클릭) → 취소. 얇은 라인은 유지.
      } else if (wasDraw || mode === "resize" || (mode === "move" && drag.moved)) {
        recordUndo(drag.pre);                                 // 실제 변경분만 되돌리기 스택에
      }
      drag = null; saveDraft(); drawChips(); drawMarkers(); renderEditbar(wasDraw);
    }
    overlay.addEventListener("pointerup", endDrag);
    overlay.addEventListener("pointercancel", endDrag);

    function updateLabel(i) {
      const el = overlay.querySelector(`[data-i="${i}"]`); if (!el) return; const it = editItems[i];
      if (it.type === "box") { let lb = el.querySelector(".lb"); if (it.label) { if (!lb) { lb = document.createElement("span"); lb.className = "lb"; lb.style.background = layerOf(it.layer).color; el.appendChild(lb); } lb.textContent = it.label; } else if (lb) lb.remove(); }
      else if (it.type === "text") { el.firstChild ? (el.childNodes[0].nodeType === 3 ? el.childNodes[0].textContent = (it.label || "메모") : el.textContent = (it.label || "메모")) : el.textContent = (it.label || "메모"); }
      else { el.title = it.label || layerOf(it.layer).label; }
    }

    function renderEditbar(focusLabel) {
      const bar = $("fp-editbar");
      if (!editing) { bar.hidden = true; bar.innerHTML = ""; return; }
      bar.hidden = false;
      const tool = (id, lbl) => `<button class="${curTool === id ? "on" : ""}" data-tool="${id}">${lbl}</button>`;
      const opts = (sel) => (FP.layers || []).map((l) => `<option value="${l.id}"${l.id === sel ? " selected" : ""}>${esc(l.icon + " " + l.label)}</option>`).join("");
      let selRow = "";
      if (selected >= 0 && editItems[selected]) {
        const it = editItems[selected];
        selRow = `<div class="fp-row"><b style="font-size:13px">선택됨</b>` +
          `<select class="fp-input grow0" id="fp-sel-layer">${opts(it.layer)}</select>` +
          `<input class="fp-input" id="fp-sel-label" placeholder="라벨/메모 입력" value="${esc(it.label || "")}" />` +
          `<button class="fp-btn ghost sm" id="fp-del">🗑 삭제</button></div>`;
      }
      bar.innerHTML =
        `<div class="fp-row"><span class="fp-hint">도구</span><div class="fp-seg">${tool("pin", "📍 점")}${tool("box", "⬛ 영역")}${tool("text", "🅰 글자")}</div>` +
        `<span class="fp-hint">레이어</span><select class="fp-input grow0" id="fp-cur-layer">${opts(curLayer)}</select></div>` +
        `<div class="fp-row"><span class="fp-hint">💡 조명 빠른배치</span>` +
        LIGHT_PRESETS.map((p) => `<button class="fp-btn ghost sm preset${presetLabel === p.label ? " on" : ""}" data-preset="${esc(p.label)}" data-ptool="${p.tool}">${p.icon} ${esc(p.key)}</button>`).join("") +
        (presetLabel ? `<button class="fp-btn ghost sm" id="fp-preset-off">✕ 해제</button>` : "") +
        `</div>` +
        selRow +
        `<div class="fp-row"><button class="fp-btn ghost sm" id="fp-undo"${undoStack.length ? "" : " disabled"}>↩ 되돌리기</button>` +
        `<button class="fp-btn sm" id="fp-export">📋 코드 복사</button>` +
        `<button class="fp-btn ghost sm" id="fp-reset">↺ 원본으로</button>` +
        `<span class="fp-hint">평면도 클릭해 추가 · 끌어 이동 · 선택 후 삭제 · <b>뒤로가기/↩/Delete</b> 로 취소</span></div>`;
      bar.querySelectorAll("[data-tool]").forEach((b) => b.addEventListener("click", () => { curTool = b.dataset.tool; presetLabel = ""; renderEditbar(); }));
      bar.querySelectorAll("[data-preset]").forEach((b) => b.addEventListener("click", () => { presetLabel = b.dataset.preset; curLayer = "light"; curTool = b.dataset.ptool; selected = -1; renderEditbar(); }));
      const poff = $("fp-preset-off"); if (poff) poff.addEventListener("click", () => { presetLabel = ""; renderEditbar(); });
      const cl = $("fp-cur-layer"); if (cl) cl.addEventListener("change", () => { curLayer = cl.value; presetLabel = ""; });
      const sl = $("fp-sel-layer"); if (sl) sl.addEventListener("change", () => { recordUndo(clone(editItems)); editItems[selected].layer = sl.value; saveDraft(); drawChips(); drawMarkers(); });
      const lbl = $("fp-sel-label"); if (lbl) { lbl.addEventListener("input", () => { editItems[selected].label = lbl.value; saveDraft(); updateLabel(selected); }); if (focusLabel) lbl.focus(); }
      const del = $("fp-del"); if (del) del.addEventListener("click", () => { recordUndo(clone(editItems)); editItems.splice(selected, 1); selected = -1; saveDraft(); drawChips(); drawMarkers(); renderEditbar(); });
      const undoBtn = $("fp-undo"); if (undoBtn) undoBtn.addEventListener("click", undo);
      $("fp-export").addEventListener("click", exportCode);
      $("fp-reset").addEventListener("click", () => { if (confirm("편집한 내용을 버리고 원본(data.js)으로 되돌릴까요?")) { recordUndo(clone(editItems)); editItems = clone(FP.items); clearDraft(); selected = -1; drawChips(); drawMarkers(); renderEditbar(); $("fp-exportwrap").hidden = true; } });
    }

    function exportCode() {
      const body = editItems.map((it) => {
        const p = [`layer: "${it.layer}"`, `type: "${it.type}"`, `x: ${round1(it.x)}`, `y: ${round1(it.y)}`];
        if (it.type === "box") { p.push(`w: ${round1(it.w || 0)}`, `h: ${round1(it.h || 0)}`); }
        p.push(`label: ${JSON.stringify(it.label || "")}`);
        return "    { " + p.join(", ") + " },";
      }).join("\n");
      const code = "  items: [\n" + body + "\n  ],";
      const wrap = $("fp-exportwrap"); wrap.hidden = false;
      wrap.innerHTML = `<p class="fp-hint">아래 코드를 복사해 Claude에게 주거나 <code>data.js</code>의 <code>FLOORPLAN.items</code>에 붙여넣으면 모두에게 영구 반영돼요.</p><textarea class="fp-export" id="fp-export-ta" readonly></textarea>`;
      const ta = $("fp-export-ta"); ta.value = code; ta.focus(); ta.select();
      try { navigator.clipboard.writeText(code); } catch (e) {}
    }

    function setEdit(on) {
      editing = on; selected = -1; closePopup();
      undoStack.length = 0;                       // 모드 전환 시 되돌리기 기록 초기화 (편집 내용 자체는 유지)
      editBtn.textContent = on ? "👁 보기 모드" : "✏️ 편집";
      editBtn.classList.toggle("ghost", on);
      $("fp-exportwrap").hidden = true;
      renderEditbar(); drawChips(); drawMarkers();
    }
    editBtn.addEventListener("click", () => setEdit(!editing));
    $("fp-chips").addEventListener("click", (e) => {
      const c = e.target.closest(".fp-chip"); if (!c) return;
      const id = c.dataset.layer; hidden.has(id) ? hidden.delete(id) : hidden.add(id);
      drawChips(); drawMarkers();
    });

    // 뒤로가기(back) → 마지막 작업 취소. 취소할 게 없으면 정상적으로 페이지 이동.
    window.addEventListener("popstate", () => {
      if (!editing) { guardArmed = false; return; }
      guardArmed = false;
      if (undoStack.length) { undo(); if (undoStack.length) armGuard(); }
    });
    // 키보드: Delete/Backspace → 선택 삭제(없으면 취소), Esc → 선택 해제, Ctrl/⌘+Z → 취소
    window.addEventListener("keydown", (e) => {
      if (!editing) return;
      const t = e.target, typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT");
      if (e.key === "Escape") { selected = -1; renderEditbar(); drawMarkers(); return; }
      if (typing) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); return; }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        if (selected >= 0 && editItems[selected]) { recordUndo(clone(editItems)); editItems.splice(selected, 1); selected = -1; saveDraft(); drawChips(); drawMarkers(); renderEditbar(); }
        else undo();
      }
    });

    // 임시저장(draft) 안내 — data.js 확정본과 다를 때만 "불러올까요?" 배너 표시 (자동 적용 X)
    function checkDraft() {
      const bar = $("fp-draftbar"), d = readDraft();
      if (!d || JSON.stringify(d) === JSON.stringify(FP.items)) { bar.hidden = true; bar.innerHTML = ""; return; }
      bar.hidden = false;
      bar.innerHTML = `💾 이전에 편집하던 내용이 있어요 (이 브라우저에 임시저장됨). <button class="fp-btn sm" id="fp-draft-load">불러오기</button> <button class="fp-btn ghost sm" id="fp-draft-discard">버리기</button>`;
      $("fp-draft-load").addEventListener("click", () => { editItems = clone(d); bar.hidden = true; if (!editing) setEdit(true); else { drawChips(); drawMarkers(); renderEditbar(); } });
      $("fp-draft-discard").addEventListener("click", () => { clearDraft(); bar.hidden = true; });
    }

    drawChips();
    const img = $("fp-img");
    if (img.complete) drawMarkers(); else img.addEventListener("load", drawMarkers);
    window.addEventListener("resize", () => { if (popupEl) closePopup(); });
    checkDraft();
  }

  /* ---------- 작업 안내 (작업자 공유용 · 탭형, 각 공정마다 URL) ---------- */
  function renderWork() {
    const tabsEl = $("work-tabs"), contentEl = $("work-content");
    if (!tabsEl || !contentEl) return;
    // 소유자 브라우저에서만 '전체 사이트' 링크 노출 (작업자에겐 숨김)
    const homeLink = $("work-home");
    if (homeLink) { try { if (localStorage.getItem("oh-owner") === "1") homeLink.hidden = false; } catch (e) {} }
    const OV = (typeof OVERVIEW !== "undefined") ? OVERVIEW : {};
    const tabs = [{ key: "overview", icon: "🏠", name: "개요" }]
      .concat(PHASES.map((p) => ({ key: p.id, icon: p.icon, name: p.name })));

    tabsEl.innerHTML = tabs.map((t) =>
      `<button class="wtab" data-tab="${esc(t.key)}"><span class="wt-ic">${esc(t.icon)}</span>${esc(t.name)}</button>`).join("");

    // 개요 패널 — 전체 변경 요약 + 공간별 before→after
    const changes = (OV.changes && OV.changes.length)
      ? `<div class="ov-changes">${OV.changes.map((c) =>
          `<div class="ovc"><span class="ic">${esc(c.icon || "•")}</span><div><b>${esc(c.title)}</b>${c.desc ? `<p>${esc(c.desc)}</p>` : ""}</div></div>`).join("")}</div>` : "";
    const plans = (OV.plans && OV.plans.length)
      ? `<h3 class="work-subh">📐 계획도 모음</h3>
         <div class="plan-gallery">${OV.plans.map((p) => `<figure class="plan-item">${zoomImg(p.file, p.label)}<figcaption>${esc(p.label)}</figcaption></figure>`).join("")}</div>` : "";
    const baList = (typeof BEFORE_AFTER !== "undefined" ? BEFORE_AFTER : []);
    const ba = baList.length
      ? `<h3 class="work-subh">공간별 · 현장 → 바뀔 모습</h3>
         <div class="banner">⚠️ To-Be(바뀔 모습)는 AI 시안이라 실제 시공과 다를 수 있어요. 전체 분위기·방향만 참고해 주세요.</div>
         <div class="ba-grid">${baList.map(baCardHTML).join("")}</div>` : "";
    const overviewPanel = `<section class="work-panel" data-tab="overview">
      <h2 class="work-h">🏠 주요 사양 요약</h2>
      ${OV.intro ? `<p class="work-intro">${esc(OV.intro)}</p>` : ""}
      ${changes}${plans}${ba}
    </section>`;

    const phasePanels = PHASES.map((p, i) =>
      `<section class="work-panel" data-tab="${esc(p.id)}">${phaseCardHTML(p, i, { hideTeam: true, noId: true, hideCaution: true, hideAsk: true })}</section>`).join("");

    contentEl.innerHTML = overviewPanel + phasePanels;

    const keys = tabs.map((t) => t.key);
    function showTab(key) {
      const valid = keys.includes(key) ? key : "overview";
      contentEl.querySelectorAll(".work-panel").forEach((s) => { s.style.display = (s.dataset.tab === valid) ? "" : "none"; });
      tabsEl.querySelectorAll(".wtab").forEach((b) => b.classList.toggle("active", b.dataset.tab === valid));
      const at = tabsEl.querySelector(`.wtab[data-tab="${valid}"]`);
      if (at) at.scrollIntoView({ inline: "center", block: "nearest" });
    }
    const fromHash = () => decodeURIComponent((location.hash || "#overview").slice(1));
    showTab(fromHash());
    tabsEl.addEventListener("click", (e) => { const b = e.target.closest(".wtab"); if (b) location.hash = b.dataset.tab; });
    window.addEventListener("hashchange", () => { showTab(fromHash()); window.scrollTo({ top: 0 }); });
  }

  /* ---------- 실측 일정 (공정표 페이지 하단) ---------- */
  function renderSurvey() {
    const el = $("survey"); if (!el || typeof SURVEY === "undefined") return;
    const upc = (SURVEY.upcoming || []).map((u) => `
      <article class="sv-card sv-upcoming">
        <div class="sv-when">📅 <b>${esc(u.date)}</b> ${u.time ? ` · ${esc(u.time)}` : ""}</div>
        ${u.who && u.who.length ? `<div class="sv-who">방문: <b>${u.who.map(esc).join(", ")}</b></div>` : ""}
        ${u.checklist && u.checklist.length ? `<div class="sv-cklist">
          <div class="sv-cklist-h">✅ 체크리스트</div>
          <ul>${u.checklist.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
        </div>` : ""}
      </article>`).join("");
    const wanted = (SURVEY.wanted || []).map((w) => `
      <li><b>${esc(w.who)}</b>${w.note ? ` — ${esc(w.note)}` : ""}</li>`).join("");
    el.innerHTML =
      (upc ? `<div class="sv-list">${upc}</div>` : "") +
      (wanted ? `<div class="sv-wanted">
        <div class="sv-wanted-h">🗓️ 실측 예정 (조정 필요)</div>
        <ul>${wanted}</ul>
      </div>` : "");
  }

  /* ---------- 자재 (materials.html) ---------- */
  function renderMaterials() {
    const list = $("mat-list");
    if (!list || typeof MATERIALS === "undefined") return;
    const sumEl = $("mat-summary");
    const filtersEl = $("mat-filters");

    // 5상태: pending → looking → decided → ordered → bought
    const STATUS = {
      pending: { label: "미정",   cls: "st-pending" },
      looking: { label: "검토중", cls: "st-looking" },
      decided: { label: "확정",   cls: "st-decided" },
      ordered: { label: "발주",   cls: "st-ordered" },
      bought:  { label: "구매완료", cls: "st-bought" },
    };
    const fmt = (n) => Number(n || 0).toLocaleString("ko-KR");
    const decidedCand = (it) => (it.decided && (it.candidates||[]).find(c => c.name === it.decided)) || null;
    const totalPurchased = (p) => p ? (p.total || (p.unitPrice||0)*(p.qty||1) || 0) : 0;
    const minOfferAll = (it) => {
      let min = null, n = 0;
      (it.candidates||[]).forEach(c => (c.offers||[]).forEach(o => {
        if (o.price) { n++; if (min == null || o.price < min) min = o.price; }
      }));
      return { min, n };
    };

    // 요약 (구매·발주 합계 + 확정·검토·미정 카운트)
    let boughtSum = 0, orderedSum = 0, decidedN = 0, lookingN = 0, pendingN = 0;
    MATERIALS.forEach(g => (g.items||[]).forEach(it => {
      if (it.status === "bought") boughtSum += totalPurchased(it.purchased);
      if (it.status === "ordered") orderedSum += totalPurchased(it.purchased);
      if (it.status === "decided") decidedN++;
      if (it.status === "looking") lookingN++;
      if (it.status === "pending") pendingN++;
    }));
    if (sumEl) sumEl.innerHTML = `
      <div class="ms-card ms-bought">🛒 구매완료 <b>₩${fmt(boughtSum)}</b></div>
      <div class="ms-card ms-ordered">📦 발주 <b>₩${fmt(orderedSum)}</b></div>
      <div class="ms-card">✅ 확정 <b>${decidedN}</b>개</div>
      <div class="ms-card">🔍 검토중 <b>${lookingN}</b>개</div>
      <div class="ms-card">⊝ 미정 <b>${pendingN}</b>개</div>`;

    // 필터 칩
    let fGroup = "all", fStatus = "all";
    if (filtersEl) filtersEl.innerHTML = `
      <div class="mf-row">
        <span class="mf-key">대분류</span>
        <div class="mf-chips" data-key="group">
          <button class="mf-chip on" data-v="all">전체</button>
          ${MATERIALS.map(g => `<button class="mf-chip" data-v="${esc(g.group)}">${esc(g.group)}</button>`).join("")}
        </div>
      </div>
      <div class="mf-row">
        <span class="mf-key">상태</span>
        <div class="mf-chips" data-key="status">
          <button class="mf-chip on" data-v="all">전체</button>
          ${Object.entries(STATUS).map(([k,s]) => `<button class="mf-chip" data-v="${k}">${s.label}</button>`).join("")}
        </div>
      </div>`;

    function priceCell(it) {
      const wrap = (num, extra) => `<span class="m-price-num">${num}</span><span class="m-price-extra">${extra || ""}</span>`;
      // 구매·발주 → purchased 합계
      if (it.purchased) {
        const t = totalPurchased(it.purchased);
        return t ? wrap(`₩${fmt(t)}`, "") : wrap("-", "");
      }
      // 확정 → 결정된 후보의 최저 견적
      if (it.status === "decided") {
        const dc = decidedCand(it);
        const prices = dc ? (dc.offers||[]).map(o=>o.price).filter(Boolean) : [];
        return prices.length ? wrap(`₩${fmt(Math.min(...prices))}`, "") : wrap("-", "");
      }
      // 검토중 → 모든 후보의 모든 견적 중 최저 + 외 N
      const r = minOfferAll(it);
      if (r.min == null) return wrap("-", "");
      return wrap(`₩${fmt(r.min)}`, r.n > 1 ? `외 ${r.n-1}` : "");
    }
    function noteCell(it) {
      if (it.status === "bought" || it.status === "ordered") {
        return it.purchased && it.purchased.vendor ? esc(it.purchased.vendor) : "";
      }
      if (it.status === "decided") return esc(it.decided || "");
      // looking / pending — 단일 후보+단일 견적이면 그 판매처, 그 외엔 purpose
      const cs = it.candidates || [];
      if (cs.length === 1 && cs[0].offers && cs[0].offers.length === 1) {
        return esc(cs[0].offers[0].vendor || "") || esc(it.purpose || "");
      }
      return esc(it.purpose || "");
    }
    function photoCell(it) {
      const dc = decidedCand(it);
      let p = (dc && dc.photo) ? dc.photo : ((it.candidates||[])[0] && it.candidates[0].photo) || "";
      return p ? `<img src="images/${esc(p)}" alt="${esc(it.category)}" loading="lazy">` : `<div class="m-photo-ph">📦</div>`;
    }
    function canExpand(it) {
      const cs = it.candidates || [];
      if (it.purchased) return true;
      if (cs.length > 1) return true;
      if (cs.length === 1 && (cs[0].offers||[]).length > 1) return true;
      if (it.note) return true;
      return false;
    }
    function offerRow(o) {
      const price = o.price ? `₩${fmt(o.price)}` : "-";
      const noteLink = `${esc(o.note||"")}${o.url ? ` <a href="${esc(o.url)}" target="_blank" rel="noopener">↗</a>` : ""}`;
      return `<div class="m-orow">
        <div></div>
        <div class="m-cell m-orow-name">${esc(o.vendor || "-")}</div>
        <div></div>
        <div class="m-cell m-cell-price"><span class="m-price-num">${price}</span><span class="m-price-extra"></span></div>
        <div></div>
        <div class="m-cell m-cell-note">${noteLink}</div>
        <div></div>
      </div>`;
    }
    function expandHTML(it) {
      const cs = it.candidates || [];
      let candsHTML = "";
      if (cs.length === 1) {
        candsHTML = (cs[0].offers || []).map(offerRow).join("");
      } else if (cs.length > 1) {
        candsHTML = cs.map(c => {
          const isDecided = it.decided === c.name;
          const head = `<div class="m-chead${isDecided ? ' is-decided' : ''}">${isDecided ? '✓ ' : ''}${esc(c.name)}</div>`;
          const offers = (c.offers||[]).map(offerRow).join("");
          return head + offers;
        }).join("");
      }
      const p = it.purchased;
      const purchasedBlock = p ? `<div class="m-purchased">
        <div class="m-sec-h">${it.status === "bought" ? "🛒 구매완료" : "📦 발주"}</div>
        <ul>
          ${p.vendor ? `<li><b>판매처:</b> ${esc(p.vendor)}</li>` : ""}
          ${p.unitPrice ? `<li><b>단가:</b> ₩${fmt(p.unitPrice)}</li>` : ""}
          ${p.qty ? `<li><b>수량:</b> ${p.qty}개</li>` : ""}
          ${(p.total || (p.unitPrice && p.qty)) ? `<li><b>합계:</b> <b>₩${fmt(p.total || p.unitPrice * (p.qty||1))}</b></li>` : ""}
          ${p.date ? `<li><b>날짜:</b> ${esc(p.date)}</li>` : ""}
          ${p.note ? `<li><b>메모:</b> ${esc(p.note)}</li>` : ""}
        </ul>
        ${p.receipt ? `<div class="m-receipt"><a href="${esc(p.receipt)}" target="_blank" rel="noopener">📎 영수증 보기</a></div>` : ""}
      </div>` : "";
      const noteBlock = it.note ? `<div class="m-memo-block"><p>${esc(it.note)}</p></div>` : "";
      return `<div class="m-body">${candsHTML}${purchasedBlock}${noteBlock}</div>`;
    }
    function itemRow(it) {
      const s = STATUS[it.status] || STATUS.pending;
      const ph = photoCell(it);
      const expandable = canExpand(it);
      const qty = it.qty || 1;
      const inner = `
        <div class="m-photo">${ph}</div>
        <div class="m-cell-name"><span class="m-name">${esc(it.category)}</span></div>
        <div class="m-cell m-cell-status"><span class="m-status ${s.cls}">${s.label}</span></div>
        <div class="m-cell m-cell-price">${priceCell(it)}</div>
        <div class="m-cell m-cell-qty">${qty}개</div>
        <div class="m-cell m-cell-note">${noteCell(it)}</div>
        ${expandable ? `<div class="m-chev">▾</div>` : `<div></div>`}`;
      if (expandable) {
        return `<details class="m-item"><summary>${inner}</summary>${expandHTML(it)}</details>`;
      }
      return `<div class="m-item m-noex">${inner}</div>`;
    }
    function paint() {
      const html = MATERIALS.filter(g => fGroup === "all" || g.group === fGroup).map(g => {
        const items = (g.items || []).filter(it => fStatus === "all" || it.status === fStatus);
        if (!items.length) return "";
        return `<div class="m-group">
          <div class="m-group-h">${esc(g.group)} <span class="m-count">[${items.length}]</span></div>
          <div class="m-items">
            <div class="m-thead">
              <div></div><div>자재 종류</div><div>상태</div><div class="num">가격</div><div>수량</div><div>비고</div><div></div>
            </div>
            ${items.map(itemRow).join("")}
          </div></div>`;
      }).join("");
      list.innerHTML = html || `<div class="stub">조건에 맞는 자재가 없어요.</div>`;
    }
    if (filtersEl) filtersEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".mf-chip"); if (!btn) return;
      const key = btn.parentElement.dataset.key, val = btn.dataset.v;
      if (key === "group") fGroup = val;
      else if (key === "status") fStatus = val;
      btn.parentElement.querySelectorAll(".mf-chip").forEach(b => b.classList.toggle("on", b === btn));
      paint();
    });
    // 이미지 클릭 → 라이트박스 (자재 카드의 사진) — summary 토글 차단
    list.addEventListener("click", (e) => {
      const img = e.target.closest(".m-photo img");
      if (!img) return;
      e.preventDefault();
      e.stopPropagation();
      openLightbox(img.src, img.alt);
    }, true);
    paint();
  }

  /* ---------- 이미지 라이트박스 (자재 페이지에서 사용) ---------- */
  function openLightbox(src, alt) {
    let box = document.querySelector(".mat-lightbox");
    if (box) box.remove();
    box = document.createElement("div");
    box.className = "mat-lightbox";
    box.innerHTML = `<button class="mat-lightbox-close" type="button" aria-label="닫기">✕</button><img src="${esc(src)}" alt="${esc(alt || "")}">`;
    const close = () => { box.remove(); document.removeEventListener("keydown", onKey); };
    const onKey = (ev) => { if (ev.key === "Escape") close(); };
    box.addEventListener("click", (e) => {
      if (e.target.tagName !== "IMG") close();
    });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(box);
  }

  /* ---------- 가구도면 (주방: 키큰장 + ㄱ자 아일랜드) ---------- */
  function renderFurniture() {
    const root = $("furniture");
    if (!root || typeof KITCHEN === "undefined") return;
    const NS = "http://www.w3.org/2000/svg";
    const C = { muted: "#6b5a44", line: "#8a7a63", fill: "#efe6d8", fill2: "#e3d4ba", dim: "#b08d57", guide: "#c0392b", accent: "#5a3a22", sink: "#dfe7ea", sinkLine: "#7f9aa6" };
    const sv = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
    const box = (p, x, y, w, h, o = {}) => sv("rect", { x, y, width: w, height: h, fill: o.fill || C.fill, stroke: o.stroke || C.line, "stroke-width": o.sw || 7, rx: o.rx || 0 }, p);
    const ln = (p, x1, y1, x2, y2, o = {}) => { const e = sv("line", { x1, y1, x2, y2, stroke: o.stroke || C.dim, "stroke-width": o.sw || 4 }, p); if (o.dash) e.setAttribute("stroke-dasharray", o.dash); return e; };
    const txt = (p, x, y, s, o = {}) => {
      const t = sv("text", { x, y, "font-size": o.fs || 130, fill: o.fill || C.muted, "text-anchor": o.anchor || "middle", "dominant-baseline": "middle", "font-weight": o.fw || 500 }, p);
      if (o.rotate) t.setAttribute("transform", `rotate(${o.rotate} ${x} ${y})`);
      const lines = String(s).split("\n");
      if (lines.length === 1) { t.textContent = s; }
      else { const fs = o.fs || 130; lines.forEach((l, i) => { const ts = sv("tspan", { x, dy: i === 0 ? -(fs * 0.55 * (lines.length - 1)) : fs * 1.05 }, t); ts.textContent = l; }); }
      return t;
    };
    const dimH = (p, x1, x2, y, label, o = {}) => { const t = 70, col = C.dim; ln(p, x1, y, x2, y, { stroke: col }); ln(p, x1, y - t, x1, y + t, { stroke: col }); ln(p, x2, y - t, x2, y + t, { stroke: col }); txt(p, (x1 + x2) / 2, y + (o.below ? 150 : -90), label, { fs: o.fs || 120, fill: col, fw: 500 }); };
    const dimV = (p, y1, y2, x, label, o = {}) => { const t = 70, col = C.dim; ln(p, x, y1, x, y2, { stroke: col }); ln(p, x - t, y1, x + t, y1, { stroke: col }); ln(p, x - t, y2, x + t, y2, { stroke: col }); txt(p, x + (o.left ? -110 : 110), (y1 + y2) / 2, label, { fs: o.fs || 120, fill: col, rotate: -90, fw: 500 }); };
    const hatch = (p, x, y, w, h, id) => { const cp = sv("clipPath", { id }, p); sv("rect", { x, y, width: w, height: h }, cp); const g = sv("g", { "clip-path": `url(#${id})` }, p); for (let d = -h; d < w; d += 110) ln(g, x + d, y, x + d + h, y + h, { stroke: C.line, sw: 3 }); };
    // 아이소메트릭(입체) 투영 — X=폭(벽 길이), Y=깊이(방 안쪽), Z=높이
    const ISO = (X, Y, Z) => [(X - Y) * 0.866, (X + Y) * 0.5 - Z];
    const shade = (hex, f) => { const n = parseInt(hex.slice(1), 16); const r = Math.min(255, Math.round(((n >> 16) & 255) * f)), g = Math.min(255, Math.round(((n >> 8) & 255) * f)), b = Math.min(255, Math.round((n & 255) * f)); return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1); };
    const poly = (p, pts, fill, o = {}) => sv("polygon", { points: pts.map((q) => q[0].toFixed(1) + "," + q[1].toFixed(1)).join(" "), fill, stroke: o.stroke || "#8a7a63", "stroke-width": o.sw || 5, "stroke-linejoin": "round" }, p);
    const tIso = (p, X, Y, Z, s, o = {}) => txt(p, ISO(X, Y, Z)[0], ISO(X, Y, Z)[1], s, o);
    // 윗면 폴리곤만(상판 위 인덕션·싱크 등)
    const top3 = (p, x, y, z, w, d, fill, o = {}) => poly(p, [ISO(x, y, z), ISO(x + w, y, z), ISO(x + w, y + d, z), ISO(x, y + d, z)], fill, o);
    // 입체 박스: 우측면+정면+윗면 (음영 차등)
    const box3 = (p, x, y, z, w, d, h, base, o = {}) => {
      const X1 = x + w, Y1 = y + d, Z1 = z + h;
      const E = ISO(x, y, Z1), F = ISO(X1, y, Z1), G = ISO(X1, Y1, Z1), H = ISO(x, Y1, Z1);
      const Cc = ISO(X1, Y1, z), D = ISO(x, Y1, z), Bb = ISO(X1, y, z);
      poly(p, [Bb, Cc, G, F], shade(base, 0.74), o); // 우측면(+X)
      poly(p, [D, Cc, G, H], shade(base, 0.88), o);  // 정면(+Y, 도어)
      poly(p, [E, F, G, H], base, o);                // 윗면
      return { D, Cc, G, H, E, F };
    };

    /* ----- 치수(mm) 계산 ----- */
    const T = KITCHEN.tall, ISL = KITCHEN.island;
    const runD = T.depth, runH = T.height;
    let cx = 0; const segX = T.segs.map((s) => { const o = Object.assign({ x: cx }, s); cx += s.w; return o; });
    const runW = cx;
    const pillarX = runW, pillarW = T.pillar.w, pillarR = runW + pillarW;
    const barW = ISL.bar.w, barD = ISL.bar.d, H = ISL.bar.height, armW = ISL.arm.w, armD = ISL.arm.d;
    const barR = pillarR, barX = barR - barW, armX = barR - armW;
    // 아일랜드는 기둥/키큰장 앞면에 붙어 시작. 인덕션 팔 깊이(armD=900) = 기둥~싱크볼 거리(인덕션 포함).
    const armTop = runD, armBot = armTop + armD, barTop = armBot, barBot = barTop + barD;
    // 하부장 — 통로(입면)에서 본 좌→우 순서를 정본으로: 코너(인덕션 연결, 정면 서랍X) | 서랍장 | 싱크하부장(싱크 중앙) | 식기세척기.
    // 코너는 인덕션 팔(armW)이 본체 앞에 붙는 구간이라 정면 가용폭 = barW - armW.
    const cab = ISL.cab || { drawer: 600, sinkCab: 1000, dishwasher: 600 };
    const cabDrawer = cab.drawer, cabSink = cab.sinkCab, cabDish = cab.dishwasher, cornerW = armW;
    // 통로뷰 누적 x(왼→오)
    const A = { corner: 0, drawer: cornerW, sink: cornerW + cabDrawer, dish: cornerW + cabDrawer + cabSink };
    const sinkAisleLeft = A.sink + (cabSink - ISL.sink.w) / 2;   // 통로뷰 기준 싱크 좌끝
    // 통로뷰 x(왼끝) → 평면/3D 절대 x (거울): barR - aisleLeft - w
    const planX = (aL, w) => barR - aL - w;
    const sinkPlanX = planX(sinkAisleLeft, ISL.sink.w);          // 평면/3D 싱크 좌끝(절대)

    /* ===== ① 평면도 ===== */
    const c1 = document.createElement("div"); c1.className = "kz-card";
    c1.innerHTML = `<h3 class="kz-h">① 평면도 <span>위에서 본 도면</span></h3>`;
    const plan = sv("svg", { viewBox: "-1050 -1050 6500 5250", xmlns: NS }, c1);
    segX.forEach((s) => {
      box(plan, s.x, 0, s.w, runD, s.fridge ? { fill: "#f2ece1" } : {});
      txt(plan, s.x + s.w / 2, runD / 2, s.note ? s.label + "\n" + s.note : s.label, { fs: s.w < 600 ? 100 : 125 });
      if (s.fridge) for (let i = 1; i < 3; i++) ln(plan, s.x + s.w * i / 3, 30, s.x + s.w * i / 3, runD - 30, { stroke: C.line, sw: 4, dash: "40 30" });
    });
    box(plan, pillarX, 0, pillarW, runD, { fill: C.fill2 });
    hatch(plan, pillarX, 0, pillarW, runD, "kz-pc-plan");
    txt(plan, pillarX + pillarW / 2, runD / 2, T.pillar.label, { fs: 130, fill: C.accent });
    box(plan, barX, barTop, barW, barD);
    box(plan, armX, armTop, armW, armD);
    ln(plan, armX + 7, barTop, armX + armW - 7, barTop, { stroke: C.fill, sw: 9 });
    // 하부장 구획선 (평면 좌→우 = 통로뷰의 거울: 식세기|싱크|서랍|코너)
    [A.drawer, A.sink, A.dish].forEach((aL) => { const bx = barR - aL; ln(plan, bx, barTop, bx, barBot, { stroke: C.line, sw: 3, dash: "26 18" }); });
    // 싱크볼: 통로(본체 윗변=작업존)에서 gapAisle, 싱크하부장 중앙
    const skGap = ISL.sink.gapAisle || 0;
    const skX = sinkPlanX, skY = barTop + skGap;
    box(plan, skX, skY, ISL.sink.w, ISL.sink.d, { fill: C.sink, stroke: C.sinkLine, sw: 5, rx: 30 });
    txt(plan, skX + ISL.sink.w / 2, skY + ISL.sink.d / 2, "싱크볼", { fs: 100, fill: C.sinkLine });
    dimH(plan, skX, skX + ISL.sink.w, skY + ISL.sink.d + 130, String(ISL.sink.w), { fs: 88, below: true }); // 가로
    dimV(plan, skY, skY + ISL.sink.d, skX - 130, String(ISL.sink.d), { left: true, fs: 88 });       // 세로
    dimV(plan, barTop, skY, skX + ISL.sink.w + 130, "통로 " + skGap, { fs: 82 });                    // 통로(윗변)~싱크볼
    // 인덕션 600×520: 벽(뒤=팔 윗변)에서 gapWall, 통로(왼쪽=팔 좌변)에서 gapAisle
    const IND = ISL.induction, indX = armX + (IND.gapAisle || 0), indY = armTop + (IND.gapWall || 0);
    box(plan, indX, indY, IND.w, IND.d, { fill: "#2f2a24", stroke: "#1c1916", sw: 5, rx: 25 });
    [[0.3, 0.33], [0.7, 0.33], [0.3, 0.7], [0.7, 0.7]].forEach((c) => sv("circle", { cx: indX + IND.w * c[0], cy: indY + IND.d * c[1], r: 92, fill: "none", stroke: "#c9a96a", "stroke-width": 7 }, plan));
    txt(plan, indX + IND.w / 2, armBot - 100, "인덕션 " + IND.w + "×" + IND.d, { fs: 80, fill: C.accent });
    dimV(plan, armTop, indY, indX + IND.w + 130, "벽 " + IND.gapWall, { fs: 82 });                  // 벽(뒤)~인덕션
    dimH(plan, armX, indX, indY - 120, "통로 " + IND.gapAisle, { fs: 82 });                          // 통로(왼쪽)~인덕션
    ln(plan, armX, 0, armX, barTop, { stroke: C.guide, sw: 4, dash: "60 45" });
    ln(plan, barR, 0, barR, barBot, { stroke: C.guide, sw: 4, dash: "60 45" });
    segX.forEach((s) => dimH(plan, s.x, s.x + s.w, -270, String(s.w)));
    dimH(plan, pillarX, pillarR, -270, pillarW + "(기둥)", { fs: 100, verify: T.pillar.wVerify });
    dimH(plan, 0, runW, -640, "키큰장 " + runW, { verify: T.widthVerify });
    dimV(plan, 0, runD, -330, String(runD), { left: true, verify: T.depthVerify });
    dimV(plan, armTop, armBot, barR + 340, armD + " (기둥~싱크)");
    dimV(plan, barTop, barBot, barR + 340, String(barD));
    dimH(plan, barX, barR, barBot + 270, String(barW));
    dimH(plan, armX, barR, armTop - 150, String(armW), { fs: 100 });
    txt(plan, 700, -870, "키큰장 (벽면)", { fs: 150, fill: C.accent, fw: 700 });
    txt(plan, (barX + barR) / 2, barBot + 650, `아일랜드 (ㄱ자 · 상판 H${ISL.bar.height})`, { fs: 140, fill: C.accent, fw: 700 });
    root.appendChild(c1);

    /* ===== ② 키큰장 입면도 ===== */
    const c2 = document.createElement("div"); c2.className = "kz-card";
    c2.innerHTML = `<h3 class="kz-h">② 키큰장 입면도 <span>앞에서 본 도면</span></h3>`;
    const elev = sv("svg", { viewBox: "-1050 -1050 6500 4300", xmlns: NS }, c2);
    const FY = runH;
    // 도어 패널 + 손잡이
    const door = (x, y, w, h, o = {}) => {
      box(elev, x + 16, y + 16, w - 32, h - 32, { fill: o.fill || "#f3ecdd", stroke: "#9c8a70", sw: 4, rx: 10 });
      const hx = o.handle === "left" ? x + 48 : x + w - 48;
      ln(elev, hx, y + h * 0.4, hx, y + h * 0.6, { stroke: "#8a795f", sw: 11 });
    };
    segX.forEach((s) => {
      box(elev, s.x, 0, s.w, runH, { fill: s.fridge ? "#f2ece1" : C.fill }); // 캐비닛 몸체
      if (s.fridge) {
        const fH = s.fridgeH || runH, upH = runH - fH, n = s.count || 3;
        if (upH > 0) { // 상부장 (냉장고 위 남는 영역)
          const uc = Math.max(2, Math.round(s.w / 600));
          for (let i = 0; i < uc; i++) door(s.x + s.w * i / uc, 0, s.w / uc, upH, { fill: "#f6efe2", handle: i < uc / 2 ? "right" : "left" });
          ln(elev, s.x, upH, s.x + s.w, upH, { stroke: C.line, sw: 6 });
          txt(elev, s.x + s.w / 2, upH / 2, "상부장 " + upH, { fs: 86 });
        }
        for (let i = 0; i < n; i++) { // 냉장고 n대
          const dx = s.x + s.w * i / n, dw = s.w / n;
          box(elev, dx + 14, upH + 24, dw - 28, fH - 48, { fill: "#fbf8f2", stroke: "#9c8a70", sw: 5, rx: 8 });
          ln(elev, dx + dw - 42, upH + fH * 0.42, dx + dw - 42, upH + fH * 0.58, { stroke: "#9c8a70", sw: 10 });
        }
        txt(elev, s.x + s.w / 2, -120, "냉장고 " + n + "도어 (각 600 · H" + fH + ")", { fs: 106, fill: C.accent });
        dimV(elev, upH, FY, s.x + s.w - 30, String(fH), { fs: 80 });   // 냉장고 높이
        dimV(elev, 0, upH, s.x + 30, String(upH), { left: true, fs: 78 }); // 상부장 높이
      } else if (s.appliance === "oven") {
        const ovH = 595, ovFloor = 1000, ovY = runH - ovFloor - ovH; // 오븐 밑면을 바닥에서 ovFloor 띄움
        door(s.x, 0, s.w, ovY);                       // 오븐 위 수납
        door(s.x, ovY + ovH, s.w, FY - ovY - ovH);    // 오븐 아래 수납
        box(elev, s.x + 25, ovY, s.w - 50, ovH, { fill: "#33302a", stroke: "#222", sw: 5, rx: 20 });
        box(elev, s.x + 55, ovY + 70, s.w - 110, ovH - 200, { fill: "#5a544a", stroke: "#222", sw: 3, rx: 10 }); // 유리창
        ln(elev, s.x + 70, ovY + 40, s.x + s.w - 70, ovY + 40, { stroke: "#9a8", sw: 7 }); // 핸들
        txt(elev, s.x + s.w / 2, ovY + ovH - 80, "오븐", { fs: 86, fill: "#f3ead8" });
        txt(elev, s.x + s.w / 2, ovY / 2, "수납", { fs: 88 });
        dimV(elev, ovY + ovH, FY, s.x + s.w / 2, "바닥 " + ovFloor, { fs: 85 });
      } else if (s.appliance === "robot") {
        const rvH = 260;
        door(s.x, 0, s.w, FY - rvH);
        box(elev, s.x + 20, FY - rvH, s.w - 40, rvH, { fill: "#e6dcc7", stroke: "#9c8a70", sw: 5, rx: 6 });
        txt(elev, s.x + s.w / 2, FY - rvH / 2, "로봇\n청소기", { fs: 74 });
        txt(elev, s.x + s.w / 2, (FY - rvH) / 2, "수납", { fs: 88 });
      } else {
        door(s.x, 0, s.w, runH * 0.62, { handle: "right" });        // 상
        door(s.x, runH * 0.62, s.w, runH * 0.38, { handle: "right" }); // 하
        txt(elev, s.x + s.w / 2, runH * 0.31, s.label, { fs: 100 });
      }
    });
    box(elev, pillarX, 0, pillarW, runH, { fill: C.fill2 });
    hatch(elev, pillarX, 0, pillarW, runH, "kz-pc-elev");
    txt(elev, pillarX + pillarW / 2, runH / 2, T.pillar.label, { fs: 130, fill: C.accent });
    dimH(elev, 0, runW, -380, "키큰장 " + runW, { verify: T.widthVerify });
    dimH(elev, pillarX, pillarR, -380, String(pillarW), { fs: 100, verify: T.pillar.wVerify });
    segX.forEach((s) => dimH(elev, s.x, s.x + s.w, -160, String(s.w), { fs: 100 }));
    dimV(elev, 0, runH, -250, String(runH), { left: true, verify: T.heightVerify });
    root.appendChild(c2);

    /* ===== ③ 아일랜드 입면도 (통로/앞에서 본 정면) ===== */
    const c2b = document.createElement("div"); c2b.className = "kz-card";
    c2b.innerHTML = `<h3 class="kz-h">③ 아일랜드 입면도 <span>통로(앞)에서 본 정면 · 상판높이 ${H}</span></h3>`;
    const cap = (t) => { const d = document.createElement("div"); d.className = "kz-cap"; d.textContent = t; c2b.appendChild(d); };
    const TOE = 80, CT = 40;            // 걸레받이 높이, 상판 두께
    const cyTop = CT + 14, cyH = (H - TOE) - (CT + 14); // 하부 도어 영역
    const islandFace = (p, w) => {
      ln(p, -120, H, w + 120, H, { stroke: C.accent, sw: 8 });               // 바닥
      box(p, 0, CT, w, H - CT, { fill: C.fill });                            // 몸체
      box(p, -28, 0, w + 56, CT, { fill: "#d8cdb8", stroke: C.line, sw: 4 }); // 상판(오버행)
      ln(p, 0, H - TOE, w, H - TOE, { stroke: C.line, sw: 3, dash: "26 18" }); // 걸레받이
      dimH(p, 0, w, -230, String(w));                                        // 폭
      dimV(p, 0, H, -200, String(H), { left: true });                        // 높이
    };
    const knob = (p, x, y, horiz) => horiz ? ln(p, x - 70, y, x + 70, y, { stroke: "#8a795f", sw: 11 }) : ln(p, x, y - 70, x, y + 70, { stroke: "#8a795f", sw: 11 });
    const pnl = (p, x, y, w, h, o = {}) => box(p, x + 12, y + 9, w - 24, h - 18, { fill: o.fill || "#f3ecdd", stroke: "#9c8a70", sw: 4, rx: 8 });
    const drawers = (p, x, w, n) => { const hh = cyH / n; for (let i = 0; i < n; i++) { pnl(p, x, cyTop + i * hh, w, hh); knob(p, x + w / 2, cyTop + i * hh + hh / 2, true); } };
    const doors = (p, x, w, n) => { const dw2 = w / n; for (let i = 0; i < n; i++) { pnl(p, x + i * dw2, cyTop, dw2, cyH); knob(p, x + i * dw2 + (i < n / 2 ? dw2 - 55 : 55), cyTop + cyH / 2, false); } };
    const dr = cabDrawer, scW = cabSink, dw = cabDish; // 코너 | 서랍 | 싱크하부장 | 식세기 (통로뷰 왼→오)
    const sinkM = (cabSink - ISL.sink.w) / 2; // 싱크 양쪽 여백(중앙정렬)

    // (가) 본체(싱크대) 정면 — 통로에서 본 좌→우: 코너(인덕션 연결) | 서랍장 | 싱크 하부장(싱크 중앙) | 식기세척기
    cap("본체(싱크대) 쪽 정면 — W" + barW + " × H" + H + " · 통로에서 본 모습");
    const e1 = sv("svg", { viewBox: "-700 -800 " + (barW + 1400) + " " + (H + 1650), xmlns: NS }, c2b);
    islandFace(e1, barW);
    pnl(e1, A.corner, cyTop, cornerW, cyH, { fill: C.fill2 });  // 코너(왼쪽, 인덕션 연결)
    drawers(e1, A.drawer, dr, 3);                               // 서랍장
    doors(e1, A.sink, scW, 2);                                  // 싱크 하부장(2도어)
    pnl(e1, A.dish, cyTop, dw, cyH, { fill: "#e7ecee" });       // 식기세척기(오른쪽)
    ln(e1, A.dish + 34, cyTop + 78, A.dish + dw - 34, cyTop + 78, { stroke: "#9aa7ad", sw: 9 });
    txt(e1, A.dish + dw / 2, cyTop + cyH / 2 + 20, "식기\n세척기", { fs: 72, fill: "#5a6f78" });
    // 싱크(상판 매립, 히든) + 수전 — 싱크하부장 중앙
    sv("rect", { x: sinkAisleLeft, y: -6, width: ISL.sink.w, height: CT + 60, fill: "none", stroke: C.sinkLine, "stroke-width": 5, "stroke-dasharray": "40 26", rx: 14 }, e1);
    const fxc = sinkAisleLeft + ISL.sink.w / 2;
    ln(e1, fxc, -175, fxc, -10, { stroke: "#7f9aa6", sw: 9 });
    ln(e1, fxc, -175, fxc + 120, -175, { stroke: "#7f9aa6", sw: 9 });
    dimH(e1, A.sink, sinkAisleLeft, H + 250, "여백 " + Math.round(sinkM), { fs: 76, below: true });
    dimH(e1, sinkAisleLeft, sinkAisleLeft + ISL.sink.w, H + 250, String(ISL.sink.w), { fs: 80, below: true });
    txt(e1, A.corner + cornerW / 2, H + 500, "코너 " + cornerW + "\n(인덕션 연결)", { fs: 66, fill: C.accent });
    txt(e1, A.drawer + dr / 2, H + 500, "서랍장 " + dr, { fs: 72, fill: C.accent });
    txt(e1, A.sink + scW / 2, H + 660, "싱크 하부장 " + scW, { fs: 72, fill: C.accent });
    txt(e1, A.dish + dw / 2, H + 500, "식세기 " + dw, { fs: 72, fill: C.accent });

    // (나) 인덕션 팔 정면 — 하부 장(2도어) + 상판 매립 인덕션
    cap("인덕션 팔 쪽 정면 — W" + armD + " × H" + H + " · 인덕션 상판 매립(600은 깊이) · ㄱ코너는 본체와 이어짐");
    const e2 = sv("svg", { viewBox: "-700 -800 " + (armD + 1400) + " " + (H + 1650), xmlns: NS }, c2b);
    islandFace(e2, armD);
    doors(e2, 0, armD, 2);                            // 인덕션 하부장
    const iLeft = IND.gapWall, iW = IND.d;
    sv("rect", { x: iLeft, y: -4, width: iW, height: CT + 44, fill: "#2f2a26", stroke: "#1c1916", "stroke-width": 4, rx: 8 }, e2);
    txt(e2, iLeft + iW / 2, -CT - 24, "인덕션 " + IND.w + "×" + IND.d, { fs: 76, fill: C.accent });
    dimH(e2, 0, iLeft, H + 250, "벽쪽 " + iLeft, { fs: 80, below: true });
    dimH(e2, iLeft, iLeft + iW, H + 250, String(iW), { fs: 80, below: true });
    txt(e2, armD / 2, H + 500, "인덕션 하부장", { fs: 76, fill: C.accent });
    root.appendChild(c2b);

    /* ===== ④ 입체도 (아이소메트릭) ===== */
    const c3 = document.createElement("div"); c3.className = "kz-card";
    c3.innerHTML = `<h3 class="kz-h">④ 입체도 <span>아이소메트릭 · 입체적으로 보는 도면</span></h3>`;
    const iso = sv("svg", { viewBox: "-2750 -2900 6900 6800", xmlns: NS }, c3);
    const CAB = "#ecdfc6", PIL = "#d6cdbd", ISLc = "#ece0c7", IND_C = "#39322c", SK = "#cfe0e6";
    // 바닥
    poly(iso, [ISO(-60, -60, 0), ISO(pillarR + 60, -60, 0), ISO(pillarR + 60, barBot + 60, 0), ISO(-60, barBot + 60, 0)], "#f7f2e8", { stroke: "#e6dcc8", sw: 3 });
    // 1) 벽면 키큰장 (뒤)
    segX.forEach((s) => {
      if (s.fridge) {
        const fH = s.fridgeH || runH, upH = runH - fH, n = s.count || 3;
        box3(iso, s.x, 0, 0, s.w, runD, fH, "#f3ead8");      // 냉장고
        if (upH > 0) box3(iso, s.x, 0, fH, s.w, runD, upH, CAB); // 상부장
        for (let i = 1; i < n; i++) { const dx = s.x + s.w * i / n, a = ISO(dx, runD, 0), b = ISO(dx, runD, fH); ln(iso, a[0], a[1], b[0], b[1], { stroke: "#b3a589", sw: 4 }); }
      } else {
        box3(iso, s.x, 0, 0, s.w, runD, runH, CAB);
      }
    });
    // 2) 기둥
    box3(iso, pillarX, 0, 0, pillarW, runD, runH, PIL);
    // 3) 아일랜드 인덕션 팔 → 4) 본체(더 앞)
    box3(iso, armX, armTop, 0, armW, armD, H, ISLc);
    box3(iso, barX, barTop, 0, barW, barD, H, ISLc);
    // 5) 인덕션 (상판 위 얇은 슬래브 + 버너)
    box3(iso, indX, indY, H, IND.w, IND.d, 45, IND_C, { stroke: "#241f1b" });
    [[0.3, 0.33], [0.7, 0.33], [0.3, 0.7], [0.7, 0.7]].forEach((c) => { const P = ISO(indX + IND.w * c[0], indY + IND.d * c[1], H + 45); sv("circle", { cx: P[0], cy: P[1], r: 70, fill: "none", stroke: "#c9a96a", "stroke-width": 6 }, iso); });
    // 6) 싱크볼 (본체 상판 함몰)
    top3(iso, skX, skY, H, ISL.sink.w, ISL.sink.d, SK, { sw: 4, stroke: "#7f9aa6" });
    // 라벨
    tIso(iso, runW * 0.36, runD / 2, runH + 240, "키큰장", { fs: 150, fill: C.accent, fw: 700 });
    tIso(iso, pillarX + pillarW / 2, runD / 2, runH + 240, "기둥", { fs: 130, fill: C.accent, fw: 700 });
    tIso(iso, barX + barW * 0.32, barBot, H + 360, "아일랜드 H" + H, { fs: 140, fill: C.accent, fw: 700 });
    tIso(iso, indX + IND.w / 2, indY - 120, H + 360, "인덕션", { fs: 110, fill: C.accent });
    tIso(iso, skX + ISL.sink.w / 2, skY + ISL.sink.d + 140, H + 320, "싱크볼", { fs: 110, fill: "#4f6a76" });
    root.appendChild(c3);

    /* ===== 치수 메모 ===== */
    const memo = document.createElement("div"); memo.className = "kz-card kz-notes";
    memo.innerHTML =
      `<h3 class="kz-h">치수 메모 <span>정본은 data.js의 KITCHEN</span></h3>` +
      `<ul>` +
      `<li><b>키큰장</b> ${runW} (깊이 ${runD} · 높이 ${runH}) — 좌→우: ` + segX.map((s) => `${s.label} <code>${s.w}</code>`).join(" · ") + `</li>` +
      `<li><b>기둥</b> ${pillarW}×${runD}, 키큰장과 전면 일(一)자 정렬 → 빨간 점선이 기둥↔인덕션 정렬 가이드</li>` +
      `<li><b>아일랜드 ㄱ자</b> (기둥에 붙음, 통로 없음) — 인덕션 팔 ${armW}×${armD}(=기둥~싱크볼, 인덕션 포함) + 본체 ${barW}×${barD} (상판 H${ISL.bar.height})</li>` +
      `<li><b>인덕션</b> ${ISL.induction.w}×${ISL.induction.d} — 벽(뒤)에서 ${ISL.induction.gapWall} · 통로(왼쪽)에서 ${ISL.induction.gapAisle}</li>` +
      `<li><b>싱크볼</b> ${ISL.sink.w}×${ISL.sink.d} — 통로(본체 윗변)에서 ${ISL.sink.gapAisle} · 싱크하부장(${cabSink}) 중앙</li>` +
      `<li><b>하부장</b> (통로 왼→오) 코너 ${cornerW}(인덕션 연결) · 서랍 ${cabDrawer} · 싱크하부장 ${cabSink} · 식세기 ${cabDish}</li>` +
      `</ul>` +
      `<p class="kz-verify"><b>⚠ 실측 필요</b>: 장 깊이 <code>${runD}</code> · 키큰장 폭 <code>${runW}</code> · 장 높이 <code>${runH}</code> · 기둥 넓이 <code>${pillarW}</code></p>` +
      `<p class="kz-todo"><b>확정 필요:</b> ① ㄱ자 꺾임 방향(인덕션 팔 위치) · ② 오븐/로봇청소기 위치</p>`;
    root.appendChild(memo);
  }

  /* ---------- 부팅 ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    mountNav();
    renderHome();
    renderConcept();
    renderCalendar();
    renderSurvey();
    renderMaterials();
    renderDecisions();
    renderOverview();
    renderPhases();
    renderBeforeAfter();
    renderReferences();
    renderQuotes();
    renderContacts();
    renderFloorplan();
    renderFurniture();
    renderWork();
    // 견적용 요약 복사 버튼 (작업계획서·작업안내 공용)
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".hl-copy"); if (!btn) return;
      const text = btn.dataset.copy || "";
      const done = () => { const old = btn.textContent; btn.textContent = "복사됨 ✓"; setTimeout(() => { btn.textContent = old; }, 1200); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(done);
      else { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (_) {} ta.remove(); done(); }
    });
    // 이미지 클릭 → 확대(라이트박스)
    document.addEventListener("click", (e) => {
      const img = e.target.closest("img.zoom");
      if (!img || !img.getAttribute("src")) return;
      let lb = $("lightbox");
      if (!lb) {
        lb = document.createElement("div");
        lb.id = "lightbox"; lb.className = "lightbox";
        lb.innerHTML = `<img alt="">`;
        lb.addEventListener("click", () => lb.classList.remove("open"));
        document.body.appendChild(lb);
      }
      lb.querySelector("img").src = img.currentSrc || img.src;
      lb.classList.add("open");
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { const lb = $("lightbox"); if (lb) lb.classList.remove("open"); }
    });
    // 누락 이미지(아직 안 올린 파일)는 깨진 아이콘 대신 깔끔한 자리표시로
    document.addEventListener("error", (e) => {
      const t = e.target;
      if (t && t.tagName === "IMG" && t.classList.contains("zoom")) {
        const ph = document.createElement("div");
        ph.className = "img-missing";
        ph.textContent = "📎 " + (t.getAttribute("alt") || "사진 준비 중");
        t.replaceWith(ph);
      }
    }, true);
    const y = $("year"); if (y) y.textContent = new Date().getFullYear();
  });
})();
