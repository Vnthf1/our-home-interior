/* ============================================================
 *  공유 메모판 — Supabase 실시간 (memo.html 전용)
 *  로그인 없음 · 데이터는 Supabase에 저장(=서버 대신).
 *  메뉴/페이지는 app.js 의 관리자 게이트(gh_admin)로 이미 가려져,
 *  GitHub 토큰을 등록한 사람만 여기까지 들어온다.
 *
 *  ⚙️ 최초 1회 설정:
 *    1) supabase.com 가입 → New project 생성
 *    2) SQL Editor 에서 memo-setup.sql 실행 (테이블 + 정책 + realtime)
 *    3) Project Settings → API 에서 URL·anon key 복사해 아래 두 값에 입력
 *  anon key 는 public repo 에 커밋돼도 안전(Supabase 설계 — 보안은 RLS 정책).
 * ============================================================ */
(function () {
  "use strict";

  // ── 설정 (여기 두 값만 채우면 동작) ──────────────────────────
  const SUPABASE_URL = "https://cvdbgzrzgwyovzyalduk.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_iAtJMPKm-fXCCz3vo4lxSA_zbx2wkYN";
  // ────────────────────────────────────────────────────────────

  const root = document.getElementById("memo-app");
  if (!root) return;

  // 관리자 확인 (app.js 와 동일 규칙 — app.js 의 isAdmin 은 private 라 재현)
  const isLocal = () => { try { const h = location.hostname; return h === "localhost" || h === "127.0.0.1" || h === "" || location.protocol === "file:"; } catch (e) { return false; } };
  const isAdmin = () => { try { return isLocal() || localStorage.getItem("gh_admin") === "1"; } catch (e) { return false; } };
  if (!isAdmin()) return; // guardAdminPage 가 이미 잠금 화면을 그려둠

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pastel = ["#fef3c7", "#e9f0f8", "#e7f2e4", "#fbe9e7", "#efe7f6", "#e4f4f4", "#fdeccf"];
  const fmt = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    if (isNaN(d.getTime())) return "";
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  // ── 설정 안내 (URL/KEY 미입력 시) ───────────────────────────
  function setupGuide() {
    const sql = [
      "create table if not exists public.memos (",
      "  id uuid primary key default gen_random_uuid(),",
      "  author text default '익명', body text default '', color text,",
      "  created_at timestamptz default now(), updated_at timestamptz default now()",
      ");",
      "alter table public.memos enable row level security;",
      "create policy \"memos anon all\" on public.memos",
      "  for all to anon using (true) with check (true);",
      "alter publication supabase_realtime add table public.memos;",
    ].join("\n");
    return `
      <div class="memo-setup">
        <h3>⚙️ 메모판 설정이 아직 안 됐어요</h3>
        <p>이 기능은 무료 백엔드 <b>Supabase</b>에 메모를 저장합니다(서버 대신). 최초 1회만 설정하면 됩니다.</p>
        <ol class="memo-steps">
          <li><a href="https://supabase.com" target="_blank" rel="noopener">supabase.com ↗</a> 가입 → <b>New project</b> 생성</li>
          <li><b>SQL Editor</b> 에 아래 코드를 붙여넣고 <b>Run</b> (repo의 <code>memo-setup.sql</code>과 동일)</li>
          <li><b>Project Settings → API</b> 에서 <b>Project URL</b>·<b>anon public key</b> 복사</li>
          <li><code>memo.js</code> 상단 <code>SUPABASE_URL</code>·<code>SUPABASE_ANON_KEY</code> 두 값에 붙여넣고 커밋</li>
        </ol>
        <pre class="memo-sql">${esc(sql)}</pre>
        <p class="memo-hint">anon key 는 public repo 에 올라가도 안전해요(보안은 위 RLS 정책이 담당). 메뉴 자체도 관리자에게만 보입니다.</p>
      </div>`;
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) { root.innerHTML = setupGuide(); return; }
  if (typeof supabase === "undefined" || !supabase.createClient) {
    root.innerHTML = `<div class="stub">Supabase 라이브러리 로딩 실패 — 네트워크를 확인해 주세요.</div>`;
    return;
  }

  const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // ── 상태 ───────────────────────────────────────────────────
  let memos = [];
  let editingId = null;      // 편집 중인 카드 id
  let pendingRender = false;  // 편집 중 들어온 realtime 갱신 보류
  let focusQuickAddId = null; // 렌더 후 이 카드의 빠른추가 입력에 포커스
  const AUTHOR_KEY = "memo-author";
  const getAuthor = () => { try { return localStorage.getItem(AUTHOR_KEY) || ""; } catch (e) { return ""; } };
  const setAuthor = (v) => { try { localStorage.setItem(AUTHOR_KEY, v); } catch (e) {} };

  root.innerHTML =
    `<div class="memo-bar">` +
      `<input id="memo-author" class="memo-author-in" type="text" maxlength="20" placeholder="내 이름 (표시용)" value="${esc(getAuthor())}">` +
      `<button id="memo-add" class="memo-addbtn" type="button">+ 새 메모</button>` +
      `<span id="memo-conn" class="memo-conn">연결 중…</span>` +
    `</div>` +
    `<div id="memo-board" class="memo-board"></div>`;

  const boardEl = document.getElementById("memo-board");
  const connEl = document.getElementById("memo-conn");
  const authorEl = document.getElementById("memo-author");
  authorEl.addEventListener("change", () => setAuthor(authorEl.value.trim()));

  // ── 로컬 배열 유틸 (id 기준 dedupe) ─────────────────────────
  const upsertLocal = (row) => {
    const i = memos.findIndex((m) => m.id === row.id);
    if (i < 0) memos.push(row); else memos[i] = row;
    memos.sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
  };
  const removeLocal = (id) => { memos = memos.filter((m) => m.id !== id); };

  const scheduleRender = () => { if (editingId != null) { pendingRender = true; return; } render(); };

  // 본문 렌더 — "- [ ] 할일" / "- [x] 완료" 줄은 클릭 가능한 체크박스로, 나머지는 텍스트로.
  const CHECK_RE = /^(\s*(?:[-*]\s+)?)\[([ xX])\](\s?)(.*)$/;
  function renderBody(m) {
    const raw = String(m.body || "");
    if (!raw.trim()) return `<span class="memo-empty">(빈 메모 — 눌러서 작성)</span>`;
    return raw.split("\n").map((ln, i) => {
      const mt = ln.match(CHECK_RE);
      if (mt) {
        const checked = mt[2].toLowerCase() === "x";
        return `<div class="memo-check${checked ? " done" : ""}">` +
          `<input type="checkbox" data-line="${i}"${checked ? " checked" : ""}>` +
          `<span>${esc(mt[4])}</span></div>`;
      }
      if (ln.trim() === "") return `<div class="memo-line-empty"></div>`;
      return `<div class="memo-line">${esc(ln)}</div>`;
    }).join("");
  }

  function cardHTML(m) {
    const bg = m.color || pastel[0];
    const editing = m.id === editingId;
    const foot = `<div class="memo-foot"><span class="memo-author-tag">${esc(m.author || "익명")}</span>` +
      `<span class="memo-time">${esc(fmt(m.updated_at || m.created_at))}</span></div>`;
    if (editing) {
      return `<div class="memo-card is-editing" data-id="${esc(m.id)}" style="background:${esc(bg)}">` +
        `<textarea class="memo-edit" rows="5" placeholder="메모를 입력하세요...">${esc(m.body)}</textarea>` +
        `<div class="memo-actions">` +
          `<button class="memo-check-add" type="button" title="체크항목 추가">☑ 체크</button>` +
          `<button class="memo-save" type="button">저장</button>` +
          `<button class="memo-cancel" type="button">취소</button>` +
          `<button class="memo-del" type="button" title="삭제">🗑</button>` +
        `</div>` + foot + `</div>`;
    }
    return `<div class="memo-card" data-id="${esc(m.id)}" style="background:${esc(bg)}">` +
      `<div class="memo-body">${renderBody(m)}</div>` +
      `<div class="memo-quickadd">` +
        `<input class="memo-qa-in" type="text" placeholder="＋ 체크항목 추가">` +
        `<button class="memo-qa-btn" type="button" title="체크항목 추가">＋</button>` +
      `</div>` + foot + `</div>`;
  }

  function render() {
    if (!memos.length) {
      boardEl.innerHTML = `<div class="stub">아직 메모가 없어요. <b>+ 새 메모</b>로 첫 메모를 남겨보세요.</div>`;
      return;
    }
    // 최신 메모가 위로
    boardEl.innerHTML = memos.slice().reverse().map(cardHTML).join("");
    if (editingId != null) {
      const ta = boardEl.querySelector(`.memo-card[data-id="${cssEsc(editingId)}"] .memo-edit`);
      if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
    }
    if (focusQuickAddId != null) {
      const qa = boardEl.querySelector(`.memo-card[data-id="${cssEsc(focusQuickAddId)}"] .memo-qa-in`);
      if (qa) qa.focus();
      focusQuickAddId = null;
    }
  }
  // querySelector 용 간단 이스케이프 (uuid 라 사실상 안전하지만 방어)
  function cssEsc(s) { return String(s).replace(/["\\]/g, "\\$&"); }

  // ── CRUD ───────────────────────────────────────────────────
  async function addMemo() {
    const author = authorEl.value.trim(); setAuthor(author);
    const color = pastel[memos.length % pastel.length];
    const { data, error } = await db.from("memos")
      .insert({ body: "", author: author || "익명", color })
      .select().single();
    if (error) { alert("추가 실패: " + error.message); return; }
    upsertLocal(data);
    editingId = data.id; pendingRender = false;
    render();
  }

  async function saveMemo(id, body) {
    const author = authorEl.value.trim();
    const patch = { body, updated_at: new Date().toISOString() };
    if (author) { patch.author = author; setAuthor(author); }
    // 낙관적 반영
    const cur = memos.find((m) => m.id === id);
    if (cur) upsertLocal(Object.assign({}, cur, patch));
    editingId = null; pendingRender = false;
    render();
    const { error } = await db.from("memos").update(patch).eq("id", id);
    if (error) alert("저장 실패: " + error.message);
  }

  async function deleteMemo(id) {
    if (!confirm("이 메모를 삭제할까요?")) return;
    removeLocal(id);
    if (editingId === id) { editingId = null; pendingRender = false; }
    render();
    const { error } = await db.from("memos").delete().eq("id", id);
    if (error) alert("삭제 실패: " + error.message);
  }

  const endEdit = () => { editingId = null; if (pendingRender) { pendingRender = false; } render(); };

  // 빠른 추가 — 카드에서 바로 체크항목 한 줄 붙이고 저장(편집모드 안 거침)
  function quickAddCheck(id, text) {
    const t = String(text || "").trim();
    if (!t) return; // 빈 값이면 무시
    const m = memos.find((x) => x.id === id); if (!m) return;
    const line = "- [ ] " + t;
    const prev = String(m.body || "").replace(/\n+$/, "");
    const body = prev ? prev + "\n" + line : line;
    focusQuickAddId = id;   // 저장 후 재렌더 시 입력창 포커스 유지 → 연속 입력
    saveMemo(id, body);
  }

  // ── 이벤트 위임 ────────────────────────────────────────────
  document.getElementById("memo-add").addEventListener("click", addMemo);
  boardEl.addEventListener("click", (e) => {
    const card = e.target.closest(".memo-card"); if (!card) return;
    const id = card.dataset.id;
    if (e.target.closest(".memo-check input")) return; // 체크박스 토글은 change 에서 처리
    if (e.target.closest(".memo-qa-btn")) {
      const inp = card.querySelector(".memo-qa-in");
      quickAddCheck(id, inp ? inp.value : "");
      return;
    }
    if (e.target.closest(".memo-del")) { deleteMemo(id); return; }
    if (e.target.closest(".memo-cancel")) { endEdit(); return; }
    if (e.target.closest(".memo-check-add")) {
      const ta = card.querySelector(".memo-edit"); if (ta) insertChecklistItem(ta);
      return;
    }
    if (e.target.closest(".memo-save")) {
      const ta = card.querySelector(".memo-edit");
      saveMemo(id, ta ? ta.value : "");
      return;
    }
    // 읽기 카드 본문 클릭 → 편집 시작 (다른 편집 중이면 그건 그냥 닫음)
    if (!card.classList.contains("is-editing") && e.target.closest(".memo-body")) {
      editingId = id; pendingRender = false; render();
    }
  });

  // 체크박스 토글 (읽기 모드) → 해당 줄의 마커를 뒤집고 저장
  boardEl.addEventListener("change", (e) => {
    const cb = e.target.closest(".memo-check input[type=checkbox]"); if (!cb) return;
    const card = e.target.closest(".memo-card"); if (!card) return;
    const id = card.dataset.id;
    const m = memos.find((x) => x.id === id); if (!m) return;
    const lines = String(m.body || "").split("\n");
    const i = Number(cb.dataset.line);
    if (lines[i] == null) return;
    lines[i] = lines[i].replace(/\[([ xX])\]/, (_, c) => (c.toLowerCase() === "x" ? "[ ]" : "[x]"));
    saveMemo(id, lines.join("\n"));
  });

  // 편집 textarea 커서 위치에 "- [ ] " 삽입 (줄 시작이 아니면 줄바꿈부터)
  function insertChecklistItem(ta) {
    const s = ta.selectionStart, eSel = ta.selectionEnd, v = ta.value;
    const atLineStart = s === 0 || v[s - 1] === "\n";
    const ins = (atLineStart ? "" : "\n") + "- [ ] ";
    ta.value = v.slice(0, s) + ins + v.slice(eSel);
    const pos = s + ins.length;
    ta.focus(); ta.setSelectionRange(pos, pos);
  }
  // Ctrl/Cmd+Enter 로 저장
  boardEl.addEventListener("keydown", (e) => {
    const qa = e.target.closest(".memo-qa-in");
    if (qa && e.key === "Enter") {
      e.preventDefault();
      const card = e.target.closest(".memo-card"); if (!card) return;
      quickAddCheck(card.dataset.id, qa.value);
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      const card = e.target.closest(".memo-card.is-editing"); if (!card) return;
      const ta = card.querySelector(".memo-edit");
      saveMemo(card.dataset.id, ta ? ta.value : "");
    } else if (e.key === "Escape") {
      if (editingId != null) endEdit();
    }
  });

  // ── 초기 로드 + 실시간 구독 ────────────────────────────────
  async function load() {
    const { data, error } = await db.from("memos").select("*").order("created_at", { ascending: true });
    if (error) { boardEl.innerHTML = `<div class="stub">불러오기 실패: ${esc(error.message)}</div>`; return; }
    memos = data || [];
    render();
  }

  db.channel("memos-rt")
    .on("postgres_changes", { event: "*", schema: "public", table: "memos" }, (payload) => {
      if (payload.eventType === "DELETE") { removeLocal(payload.old.id); }
      else { upsertLocal(payload.new); }
      scheduleRender();
    })
    .subscribe((status) => {
      if (status === "SUBSCRIBED") { connEl.textContent = "🟢 실시간 연결됨"; connEl.className = "memo-conn ok"; }
      else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") { connEl.textContent = "⚠️ 연결 끊김"; connEl.className = "memo-conn err"; }
      else { connEl.textContent = "연결 중…"; connEl.className = "memo-conn"; }
    });

  load();
})();
