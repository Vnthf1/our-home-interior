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
    { href: "schedule.html", label: "공정표", key: "schedule" },
    { href: "plans.html", label: "작업계획서", key: "plans" },
    { href: "references.html", label: "레퍼런스", key: "refs" },
    { href: "contacts.html", label: "연락처", key: "contacts" },
  ];
  function mountNav() {
    const el = $("nav");
    if (!el) return;
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
    const intro = $("intro"); if (intro) intro.textContent = PROJECT.intro || "";
    renderInfoGrid("info");
    renderRooms();
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
  function refThumb(r) {
    const media = `<object data="images/${esc(r.file)}" type="image/jpeg"><div class="ph">📎 ${esc(r.file)}</div></object>`;
    return `<div class="ref-thumb">${media}<div class="rc"><b>${esc(r.title)}</b>${esc(r.desc || "")}</div></div>`;
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
  function renderPhases() {
    const el = $("phases"); if (!el) return;
    el.innerHTML = PHASES.map((p, i) => {
      const groups = (p.groups || []).filter((g) => g.items && g.items.length).map((g) => `
        <div class="group">
          ${g.title ? `<div class="gtitle">${esc(g.title)}</div>` : ""}
          <ul class="items">${g.items.map((it) => `<li>${esc(it)}</li>`).join("")}</ul>
        </div>`).join("");
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
      return `<div class="phase" id="${p.id}">
        <div class="phase-head"><span class="num">${i + 1}</span><span class="icon">${esc(p.icon)}</span><h3>${esc(p.name)}</h3></div>
        <div class="phase-team">👷 ${esc(p.team)}</div>
        <div class="phase-summary">${esc(p.summary || "")}</div>
        <div class="cols">${groups}</div>${dec}${chk}${imgs}${refBlock}
      </div>`;
    }).join("");
    // 해시(#tile 등)로 들어오면 해당 공정으로 스크롤
    if (location.hash) { const target = document.getElementById(location.hash.slice(1)); if (target) setTimeout(() => target.scrollIntoView({ behavior: "smooth" }), 60); }
  }

  /* ---------- 레퍼런스 갤러리 ---------- */
  function renderReferences() {
    const el = $("ref-grid"); if (!el) return;
    const refs = allRefs();
    el.innerHTML = refs.map((r) => `
      <div class="ref-card">
        <div class="media"><object data="images/${esc(r.file)}" type="image/jpeg">📎 ${esc(r.file)}<br><small>images/ 폴더에 넣으면 표시됨</small></object></div>
        <div class="body">
          <h4>${esc(r.title)}</h4>
          <p>${esc(r.desc || "")}</p>
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

  /* ---------- 부팅 ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    mountNav();
    renderHome();
    renderCalendar();
    renderDecisions();
    renderOverview();
    renderPhases();
    renderReferences();
    renderContacts();
    const y = $("year"); if (y) y.textContent = new Date().getFullYear();
  });
})();
