/* ============================================================
 *  레퍼런스 사진 업로더 (references.html 전용)
 *  - 백엔드 없음: 브라우저에서 GitHub Contents API로 직접 커밋·푸시.
 *  - 토큰은 소유자 브라우저 localStorage 에만 저장(코드/repo 에 안 들어감).
 *  - 업로드 버튼은 토큰이 있거나 URL 에 #admin 일 때만 보임 → 방문자는 못 봄.
 *  - 사진은 images/ 에 커밋, 메타는 uploads.json 에 누적 → 모두에게 보임.
 * ============================================================ */
(function () {
  if (document.body.dataset.page !== "refs") return;

  var OWNER = "Vnthf1";
  var REPO = "our-home-interior";
  var BRANCH = "main";
  var API = "https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/";
  var TKEY = "gh_pat";

  var getToken = function () { return (localStorage.getItem(TKEY) || "").trim(); };
  var setToken = function () {
    var cur = getToken();
    var t = prompt(
      "GitHub 토큰을 붙여넣으세요.\n\n" +
      "• github.com → Settings → Developer settings → Fine-grained tokens\n" +
      "• Repository: " + OWNER + "/" + REPO + " 만 선택\n" +
      "• Permissions → Contents: Read and write\n\n" +
      "이 토큰은 이 브라우저에만 저장됩니다.",
      cur
    );
    if (t !== null) { localStorage.setItem(TKEY, t.trim()); }
    return getToken();
  };

  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  };
  // 한글 포함 문자열 → UTF-8 base64
  var b64utf8 = function (str) { return btoa(unescape(encodeURIComponent(str))); };
  // File → base64 (data URL 에서 prefix 제거)
  var fileToB64 = function (file) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () { resolve(String(fr.result).split(",")[1]); };
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  };

  var ghPut = function (path, contentB64, message, sha) {
    var body = { message: message, content: contentB64, branch: BRANCH };
    if (sha) body.sha = sha;
    return fetch(API + encodeURIComponent(path).replace(/%2F/g, "/"), {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + getToken(),
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }).then(function (r) {
      if (!r.ok) return r.json().then(function (e) { throw new Error((e && e.message) || ("HTTP " + r.status)); });
      return r.json();
    });
  };

  var getUploadsJson = function () {
    return fetch(API + "uploads.json?ref=" + BRANCH, {
      headers: { Authorization: "Bearer " + getToken(), Accept: "application/vnd.github+json" },
      cache: "no-store",
    }).then(function (r) {
      if (r.status === 404) return { sha: null, list: [] };
      if (!r.ok) throw new Error("uploads.json 읽기 실패 (HTTP " + r.status + ")");
      return r.json().then(function (j) {
        var list = [];
        try { list = JSON.parse(decodeURIComponent(escape(atob(j.content.replace(/\n/g, ""))))); } catch (e) { list = []; }
        return { sha: j.sha, list: Array.isArray(list) ? list : [] };
      });
    });
  };

  var extOf = function (file) {
    var m = (file.name || "").match(/\.([a-zA-Z0-9]+)$/);
    if (m) return m[1].toLowerCase();
    if (/png/.test(file.type)) return "png";
    if (/jpe?g/.test(file.type)) return "jpg";
    if (/webp/.test(file.type)) return "webp";
    return "jpg";
  };

  /* ---------- UI ---------- */
  var phaseOptions = function () {
    var ps = (typeof PHASES !== "undefined") ? PHASES : [];
    return '<option value="">공정 태그 (선택)</option>' +
      ps.map(function (p) { return '<option value="' + esc(p.id) + '">' + esc(p.icon + " " + p.name) + "</option>"; }).join("");
  };

  function mountBar() {
    var grid = document.getElementById("ref-grid");
    if (!grid || document.getElementById("uploader-bar")) return;
    var bar = document.createElement("div");
    bar.id = "uploader-bar";
    bar.className = "uploader-bar";
    bar.innerHTML =
      '<input type="file" id="up-file" accept="image/*" hidden>' +
      '<button type="button" id="up-pick" class="up-btn">📷 사진 올리기</button>' +
      '<button type="button" id="up-token" class="up-btn ghost" title="GitHub 토큰 설정">🔑</button>' +
      '<div id="up-form" class="up-form" hidden>' +
        '<img id="up-prev" class="up-prev" alt="">' +
        '<div class="up-fields">' +
          '<input type="text" id="up-desc" class="up-input" placeholder="설명 (선택) — 예: 포레스톤 회색 장판 시공">' +
          '<select id="up-phase" class="up-input">' + phaseOptions() + "</select>" +
          '<div class="up-actions">' +
            '<button type="button" id="up-go" class="up-btn">올리기</button>' +
            '<button type="button" id="up-cancel" class="up-btn ghost">취소</button>' +
          "</div>" +
        "</div>" +
      "</div>" +
      '<div id="up-status" class="up-status"></div>';
    grid.parentNode.insertBefore(bar, grid);

    var fileEl = bar.querySelector("#up-file");
    var formEl = bar.querySelector("#up-form");
    var prevEl = bar.querySelector("#up-prev");
    var statusEl = bar.querySelector("#up-status");
    var picked = null;

    var status = function (msg, kind) {
      statusEl.textContent = msg || "";
      statusEl.className = "up-status" + (kind ? " " + kind : "");
    };

    bar.querySelector("#up-token").onclick = function () { setToken(); status("토큰 저장됨.", "ok"); };
    bar.querySelector("#up-pick").onclick = function () {
      if (!getToken()) { if (!setToken()) { status("토큰이 없어 올릴 수 없어요.", "err"); return; } }
      fileEl.click();
    };
    fileEl.onchange = function () {
      picked = fileEl.files && fileEl.files[0];
      if (!picked) return;
      prevEl.src = URL.createObjectURL(picked);
      formEl.hidden = false;
      status("");
    };
    bar.querySelector("#up-cancel").onclick = function () {
      picked = null; fileEl.value = ""; formEl.hidden = true; status("");
    };
    bar.querySelector("#up-go").onclick = function () {
      if (!picked) return;
      var desc = bar.querySelector("#up-desc").value.trim();
      var phase = bar.querySelector("#up-phase").value;
      var goBtn = bar.querySelector("#up-go");
      goBtn.disabled = true;
      status("올리는 중… (1/2 사진)", "");
      var ts = Date.now();
      var name = "ref_up_" + ts + "." + extOf(picked);
      var path = "images/" + name;
      fileToB64(picked)
        .then(function (b64) { return ghPut(path, b64, "ref: 사진 업로드 " + name, null); })
        .then(function () {
          status("올리는 중… (2/2 목록)", "");
          return getUploadsJson();
        })
        .then(function (u) {
          var entry = { file: name, title: "올린 사진", desc: desc, phases: phase ? [phase] : [], ts: ts };
          u.list.push(entry);
          var json = JSON.stringify(u.list, null, 2);
          return ghPut("uploads.json", b64utf8(json), "ref: uploads.json 갱신 (+" + name + ")", u.sha);
        })
        .then(function () {
          status("✅ 올렸어요! 1~2분 뒤 새로고침하면 모두에게 보입니다.", "ok");
          // 화면에 바로 미리보기 카드 추가 (낙관적)
          if (window.refCardHTML) {
            grid.insertAdjacentHTML("afterbegin",
              window.refCardHTML({ file: name, title: "올린 사진 (방금)", desc: desc, phases: phase ? [phase] : [] }));
            var firstImg = grid.querySelector(".ref-card img.zoom");
            if (firstImg) firstImg.src = URL.createObjectURL(picked); // 배포 전까지 로컬 미리보기
          }
          picked = null; fileEl.value = ""; formEl.hidden = true;
        })
        .catch(function (err) {
          var m = String(err && err.message || err);
          if (/401|bad credentials/i.test(m)) m = "토큰이 잘못됐거나 만료됨 — 🔑 로 다시 설정하세요.";
          status("❌ 실패: " + m, "err");
        })
        .then(function () { goBtn.disabled = false; });
    };
  }

  function maybeMount() {
    if (getToken() || location.hash === "#admin") mountBar();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", maybeMount);
  } else {
    maybeMount();
  }
  window.addEventListener("hashchange", maybeMount);
})();
