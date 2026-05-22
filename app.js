/* ============================================================
 *  공통 렌더링 — 모든 페이지가 이 파일을 사용합니다.
 *  data.js 를 먼저 로드한 뒤 이 파일을 로드하세요.
 * ============================================================ */
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const phaseName = (id) => { const p = PHASES.find((x) => x.id === id); return p ? `${p.icon} ${p.name}` : id; };

  // 공정표 작업명 → 작업계획서 공정 id (더블클릭 이동용)
  const NAME2PHASE = {
    "보양": "protect",
    "철거": "demolition", "가스배관 철거": "demolition", "폐기물 처리": "demolition",
    "샷시": "window", "설비": "plumbing",
    "보일러": "hvac", "에어컨": "hvac", "전열교환기": "hvac",
    "전기 1": "electric", "전기 2 (타공)": "electric",
    "목공 (방음)": "carpentry",
    "타일 (도기)": "tile", "타일 줄눈": "tile",
    "필름": "film", "도장": "paint", "도배": "wallpaper", "장판": "floor",
    "가구 (신발장·부엌·붙박이장)": "furniture",
    "전기 (조명)": "lighting-final",
    "탄성코트": "elastic", "중문": "middle-door", "입주청소": "cleaning",
  };
  const goPhase = (pid) => { if (pid) location.href = "plans.html#" + pid; };

  /* ---------- 네비게이션 ---------- */
  const NAV = [
    { href: "index.html", label: "홈", key: "home" },
    { href: "concept.html", label: "컨셉", key: "concept" },
    { href: "schedule.html", label: "공정표", key: "schedule" },
    { href: "plans.html", label: "작업계획서", key: "plans" },
    { href: "work.html", label: "작업 안내", key: "work" },
    { href: "floorplan.html", label: "도면", key: "floorplan" },
    { href: "quotes.html", label: "견적/후보", key: "quotes" },
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
      `<div class="video-wrap"><iframe src="https://www.youtube.com/embed/${esc(PROJECT.youtube)}" title="집 둘러보기" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>` +
      `<p class="video-cap">우리 집과 같은 구조의 영상이에요 (방향만 다름).</p>`;
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

  /* ---------- 공정 계획표 (달력형 간트) ---------- */
  function renderCalendar() {
    const el = $("cal"); if (!el || typeof SCHEDULE === "undefined") return;
    const parse = (str) => { const [y, m, d] = str.split("-").map(Number); return new Date(y, m - 1, d); };
    const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const WK = ["일", "월", "화", "수", "목", "금", "토"];
    const holidays = new Set(SCHEDULE.holidays || []);
    const isWe = (d) => d.getDay() === 0 || d.getDay() === 6 || holidays.has(key(d));

    const s0 = parse(SCHEDULE.rangeStart), e0 = parse(SCHEDULE.rangeEnd);
    const dates = [];
    for (let d = new Date(s0); d <= e0; d.setDate(d.getDate() + 1)) dates.push(new Date(d));

    const months = [];
    dates.forEach((d) => { const m = d.getMonth() + 1; const last = months[months.length - 1];
      if (last && last.m === m) last.span++; else months.push({ m, span: 1 }); });

    const sets = SCHEDULE.tasks.map((t) => {
      const set = new Set();
      (t.spans || []).forEach(([a, b]) => { for (let d = parse(a); d <= parse(b); d.setDate(d.getDate() + 1)) set.add(key(d)); });
      return set;
    });

    let html = '<table class="cal"><colgroup><col class="c-label">' + dates.map((d) => (isWe(d) ? '<col class="we-col">' : "<col>")).join("") + "</colgroup><thead>";
    html += '<tr><th class="tlabel corner"></th>' + months.map((mo) => `<th class="month" colspan="${mo.span}">${mo.m}월</th>`).join("") + "</tr>";
    html += '<tr><th class="tlabel">작업</th>' + dates.map((d) => `<th class="day${isWe(d) ? " we" : ""}"><div class="dnum">${d.getDate()}</div><div class="dwk">${WK[d.getDay()]}</div></th>`).join("") + "</tr>";
    html += "</thead><tbody>";
    SCHEDULE.tasks.forEach((t, ti) => {
      const set = sets[ti];
      const isOn = (dd) => set.has(key(dd)) && !isWe(dd); // 주말·휴일 칸은 막대 제외
      const pid = NAME2PHASE[t.name];
      html += `<tr><th class="tlabel taskname"${pid ? ` data-pid="${pid}" title="더블클릭 → 작업계획서로 이동"` : ""}>${esc(t.name)}</th>`;
      dates.forEach((d, di) => {
        const on = isOn(d);
        const prevOn = di > 0 && isOn(dates[di - 1]);
        const nextOn = di < dates.length - 1 && isOn(dates[di + 1]);
        const cls = ["cell"]; if (isWe(d)) cls.push("we");
        if (on) { cls.push("on"); if (!prevOn) cls.push("s"); if (!nextOn) cls.push("e"); }
        html += `<td class="${cls.join(" ")}"${on ? ` style="background:${t.color || "#5b8def"}"` : ""}></td>`;
      });
      html += "</tr>";
    });
    html += "</tbody></table>";
    el.innerHTML = html;
    // 달력 작업명 더블클릭 → 해당 공정으로 이동
    el.querySelector("table.cal")?.addEventListener("dblclick", (e) => {
      const th = e.target.closest(".taskname[data-pid]");
      if (th) goPhase(th.dataset.pid);
    });

    const flow = $("flow");
    if (flow) {
      flow.innerHTML = PHASES.map((p, i) =>
        `<div class="step" data-pid="${p.id}" title="더블클릭 → 작업계획서로 이동"><span class="n">${i + 1}</span>${esc(p.name)}</div>` +
        (i < PHASES.length - 1 ? `<span class="arrow">→</span>` : "")
      ).join("");
      // 작업순서 칩 더블클릭 → 해당 공정으로 이동
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
  function refThumb(r) {
    const media = `<object data="images/${esc(r.file)}" type="${imgType(r.file)}"><div class="ph">📎 ${esc(r.file)}</div></object>`;
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
  //   opts.hideTeam : 담당 업체명 숨김 (작업자 공유 뷰)
  //   opts.noId     : 카드에 id 부여 안 함 (탭 라우팅과 충돌 방지)
  // 세부 항목 1개 — 문자열이면 그대로, 객체면 미정·메모·공정주의·업자확인을 인라인 표시.
  //   { text, undecided?:true, memo?:"직접구매 등",
  //     caution?:"주의점" | [...],   // ⚠️ 공정 시 주의 (시공 시 주의할 점)
  //     ask?:"질문" | [...] }        // 💬 업자 확인 (업자에게 물어볼 것 — 별개)
  function itemHTML(it) {
    if (typeof it === "string") return `<li>${esc(it)}</li>`;
    const cautions = it.caution ? (Array.isArray(it.caution) ? it.caution : [it.caution]) : [];
    const asks = it.ask ? (Array.isArray(it.ask) ? it.ask : [it.ask]) : [];
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
        <ul class="items">${g.items.map(itemHTML).join("")}</ul>
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
    const phaseAsks = (p.asks && p.asks.length)
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
          <object data="images/${esc(im.file)}" type="image/png">📎 ${esc(im.file)}<br><small>(images/ 폴더에 추가하면 표시됨)</small></object>
          <div class="cap">${esc(im.label)}</div>
        </div>`).join("")}</div>` : "";
    const refs = relatedRefs(p.id);
    const refBlock = refs.length ? `
      <div class="phase-refs"><div class="rt">🖼️ 관련 레퍼런스</div>
      <div class="ref-thumbs">${refs.map(refThumb).join("")}</div></div>` : "";
    const team = opts.hideTeam ? "" : `<div class="phase-team">👷 ${esc(p.team)}</div>`;
    return `<div class="phase"${opts.noId ? "" : ` id="${p.id}"`}>
      <div class="phase-head"><span class="num">${i + 1}</span><span class="icon">${esc(p.icon)}</span><h3>${esc(p.name)}</h3></div>
      ${team}
      ${p.summary ? `<div class="phase-summary">${esc(p.summary)}</div>` : ""}
      ${highlights}
      ${phaseAsks}
      <div class="cols">${groups}</div>${dec}${chk}${imgs}${refBlock}
    </div>`;
  }
  function renderPhases() {
    const el = $("phases"); if (!el) return;
    el.innerHTML = PHASES.map((p, i) => phaseCardHTML(p, i)).join("");
    // 해시(#tile 등)로 들어오면 해당 공정으로 스크롤
    if (location.hash) { const target = document.getElementById(location.hash.slice(1)); if (target) setTimeout(() => target.scrollIntoView({ behavior: "smooth" }), 60); }
  }

  /* ---------- 현장 → 변화 (As-Is / To-Be) ---------- */
  function baCardHTML(b) {
    const arr = (x) => Array.isArray(x) ? x.filter(Boolean) : (x ? [x] : []);
    const thumbs = (files, cls) => files.length
      ? `<div class="ba-thumbs">${files.map((f) => `<object class="ba-thumb" data="images/${esc(f)}" type="image/jpeg"><span class="ph">📎 ${esc(f)}</span></object>`).join("")}</div>`
      : `<div class="ba-empty">${cls === "tobe" ? "🤖 AI 시안 준비 중" : "📷 현장 사진 준비 중"}</div>`;
    return `
      <div class="ba-card">
        <div class="ba-head"><h4>${esc(b.area || "")}</h4>${b.note ? `<span class="ba-note">${esc(b.note)}</span>` : ""}</div>
        <div class="ba-pair">
          <div class="ba-col"><div class="ba-col-label asis">현장 · As-Is</div>${thumbs(arr(b.asis), "asis")}</div>
          <div class="ba-col"><div class="ba-col-label tobe">🤖 AI 시안 · To-Be</div>${thumbs(arr(b.tobe), "tobe")}</div>
        </div>
      </div>`;
  }
  function renderBeforeAfter() {
    const el = $("ba-grid"); if (!el) return;
    const list = (typeof BEFORE_AFTER !== "undefined" ? BEFORE_AFTER : []);
    el.innerHTML = list.map(baCardHTML).join("") || `<div class="stub">현장/AI 시안 사진을 <code>images/</code> 에 넣고 <code>data.js</code>의 <code>BEFORE_AFTER</code>에 추가하세요.</div>`;
  }

  /* ---------- 레퍼런스 갤러리 ---------- */
  function renderReferences() {
    const el = $("ref-grid"); if (!el) return;
    const refs = allRefs();
    el.innerHTML = refs.map((r) => `
      <div class="ref-card">
        <div class="media"><object data="images/${esc(r.file)}" type="${imgType(r.file)}">📎 ${esc(r.file)}<br><small>images/ 폴더에 넣으면 표시됨</small></object></div>
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
        ${c.phone ? `<div class="phone"><a href="tel:${esc(c.phone)}">${esc(c.phone)}</a></div>` : `<div class="note">연락처 미정</div>`}
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
    const items = (c.items && c.items.length)
      ? `<table class="qc-items">${c.items.map((it) => `<tr><td>${esc(it.label)}</td><td class="amt">${esc(it.amount || "")}</td></tr>`).join("")}</table>` : "";
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
      ${c.phone ? `<div class="qc-phone">📞 <a href="tel:${esc(c.phone)}">${esc(c.phone)}</a></div>` : ""}
      ${items}
      ${c.note ? `<div class="qc-note">${esc(c.note)}</div>` : ""}
      ${files}
    </div>`;
  }
  function renderQuotes() {
    const el = $("quotes"); if (!el || typeof QUOTES === "undefined") return;
    const order = PHASES.map((p) => p.id);
    const sorted = [...QUOTES].sort((a, b) => order.indexOf(a.phase) - order.indexOf(b.phase));
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
        <div class="qp-head"><span class="ic">${esc(p ? p.icon : "📦")}</span><h3>${esc(p ? p.name : q.phase)}</h3>${head}</div>
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
        if (hidden.has(it.layer)) return;
        const L = layerOf(it.layer); let el = document.createElement("div");
        if (it.type === "box") {
          el.className = "fp-marker fp-box";
          el.style.cssText = `left:${it.x}%;top:${it.y}%;width:${it.w || 0}%;height:${it.h || 0}%;border-color:${L.color};background:${hexA(L.color, .12)}`;
          if (it.label) { const lb = document.createElement("span"); lb.className = "lb"; lb.style.background = L.color; lb.textContent = it.label; el.appendChild(lb); }
        } else if (it.type === "text") {
          el.className = "fp-marker fp-text";
          el.style.cssText = `left:${it.x}%;top:${it.y}%;color:${L.color};border-color:${hexA(L.color, .5)}`;
          el.textContent = it.label || "메모";
        } else {
          el.className = "fp-marker fp-pin";
          el.style.cssText = `left:${it.x}%;top:${it.y}%;background:${L.color}`;
          el.textContent = L.icon; el.title = it.label || L.label;
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
      if (!editing) { showPopup(items()[i]); return; }
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
        editItems.push({ layer: curLayer, type: "box", x: round1(p.x), y: round1(p.y), w: 0, h: 0, label: "" });
        selected = editItems.length - 1;
        drag = { i: selected, mode: "draw", sx: p.x, sy: p.y, moved: true, pre };
        overlay.setPointerCapture(e.pointerId); drawMarkers();
      } else {
        recordUndo(clone(editItems));
        editItems.push({ layer: curLayer, type: curTool === "text" ? "text" : "pin", x: round1(p.x), y: round1(p.y), label: "" });
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
      if (wasDraw && it && (it.w < 1 || it.h < 1)) {
        editItems.splice(drag.i, 1); selected = -1;          // 너무 작은 박스 → 취소 (기록 안 함)
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
        selRow +
        `<div class="fp-row"><button class="fp-btn ghost sm" id="fp-undo"${undoStack.length ? "" : " disabled"}>↩ 되돌리기</button>` +
        `<button class="fp-btn sm" id="fp-export">📋 코드 복사</button>` +
        `<button class="fp-btn ghost sm" id="fp-reset">↺ 원본으로</button>` +
        `<span class="fp-hint">평면도 클릭해 추가 · 끌어 이동 · 선택 후 삭제 · <b>뒤로가기/↩/Delete</b> 로 취소</span></div>`;
      bar.querySelectorAll("[data-tool]").forEach((b) => b.addEventListener("click", () => { curTool = b.dataset.tool; renderEditbar(); }));
      const cl = $("fp-cur-layer"); if (cl) cl.addEventListener("change", () => { curLayer = cl.value; });
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
    const baList = (typeof BEFORE_AFTER !== "undefined" ? BEFORE_AFTER : []);
    const ba = baList.length
      ? `<h3 class="work-subh">공간별 · 현장 → 바뀔 모습</h3>
         <div class="banner">⚠️ To-Be(바뀔 모습)는 AI 시안이라 실제 시공과 다를 수 있어요. 전체 분위기·방향만 참고해 주세요.</div>
         <div class="ba-grid">${baList.map(baCardHTML).join("")}</div>` : "";
    const overviewPanel = `<section class="work-panel" data-tab="overview">
      <h2 class="work-h">🏠 우리집은 이렇게 바뀝니다</h2>
      ${OV.intro ? `<p class="work-intro">${esc(OV.intro)}</p>` : ""}
      ${changes}${ba}
    </section>`;

    const phasePanels = PHASES.map((p, i) =>
      `<section class="work-panel" data-tab="${esc(p.id)}">${phaseCardHTML(p, i, { hideTeam: true, noId: true })}</section>`).join("");

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

  /* ---------- 부팅 ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    mountNav();
    renderHome();
    renderConcept();
    renderCalendar();
    renderDecisions();
    renderOverview();
    renderPhases();
    renderBeforeAfter();
    renderReferences();
    renderQuotes();
    renderContacts();
    renderFloorplan();
    renderWork();
    // 견적용 요약 복사 버튼 (작업계획서·작업안내 공용)
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".hl-copy"); if (!btn) return;
      const text = btn.dataset.copy || "";
      const done = () => { const old = btn.textContent; btn.textContent = "복사됨 ✓"; setTimeout(() => { btn.textContent = old; }, 1200); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(done);
      else { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (_) {} ta.remove(); done(); }
    });
    const y = $("year"); if (y) y.textContent = new Date().getFullYear();
  });
})();
