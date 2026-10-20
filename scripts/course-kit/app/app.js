/* Principe AI offline course app. The course data is embedded by scripts/course-kit/build.ts; progress, quiz
   answers and notes are kept in this browser's localStorage, so the app works offline from a single file. */
(function () {
  "use strict";

  const DATA = JSON.parse(document.getElementById("course-data").textContent);
  const LESSONS = DATA.lessons;
  const BY_SLUG = new Map(LESSONS.map((l) => [l.slug, l]));
  const KEY = "principe-course:" + DATA.slug;
  const TOTAL_PROMPTS = LESSONS.reduce((n, l) => n + l.blocks.length, 0);
  const LANGS = { ts: "TypeScript", typescript: "TypeScript", js: "JavaScript", json: "JSON", python: "Python", py: "Python", yaml: "YAML", bash: "Shell" };

  const ICON = {
    mark: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" opacity=".7"/></svg>',
    home: svg('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>'),
    sparkles: svg('<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15v4M17 17h4M5 3v3M3.5 4.5h3"/>'),
    notes: svg('<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>'),
    award: svg('<circle cx="12" cy="9" r="6"/><path d="m8.5 14.2-1.5 7.3 5-2.8 5 2.8-1.5-7.3"/>'),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    menu: svg('<path d="M4 6h16M4 12h16M4 18h16"/>'),
    sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    moon: svg('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'),
    auto: svg('<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/>'),
    reset: svg('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'),
    copy: svg('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>'),
    check: svg('<path d="M20 6 9 17l-5-5"/>'),
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5z"/></svg>',
    left: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
    right: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    download: svg('<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>'),
    print: svg('<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>'),
    clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    layers: svg('<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>'),
    signal: svg('<path d="M4 20v-4M10 20v-8M16 20V8M22 20V4"/>'),
    wifi: svg('<path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M2 9a15 15 0 0 1 20 0"/><circle cx="12" cy="19.5" r="1" fill="currentColor"/>'),
  };
  function svg(paths) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + "</svg>";
  }

  /* ── State ─────────────────────────────────────────── */
  function loadState() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      /* storage unavailable (private window, blocked site data): keep progress in memory for this visit */
    }
    return {};
  }
  const state = Object.assign({ done: {}, checks: {}, notes: {}, quiz: {}, last: null, name: "", theme: "system", completedAt: null }, loadState());
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* see loadState */
    }
  }

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  const doneCount = () => LESSONS.filter((l) => state.done[l.slug]).length;
  const pct = () => Math.round((doneCount() / LESSONS.length) * 100);
  const lessonHref = (l) => "#/lesson/" + l.slug;
  function fmtDuration(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h ? h + "h " + String(m).padStart(2, "0") + "m" : m + " min";
  }
  function splitTitle(t) {
    const i = t.indexOf(":");
    return i < 0 ? esc(t) : esc(t.slice(0, i + 1)) + " <em>" + esc(t.slice(i + 1).trim()) + "</em>";
  }
  function nextUp() {
    const last = state.last && BY_SLUG.get(state.last);
    if (last && !state.done[last.slug]) return last;
    const start = last ? last.n - 1 : 0;
    return LESSONS.slice(start).concat(LESSONS.slice(0, start)).find((l) => !state.done[l.slug]) || null;
  }

  /* ── Shell ─────────────────────────────────────────── */
  const year = new Date(DATA.builtAt).getFullYear();
  const licence = DATA.licensee ? "Licensed to " + esc(DATA.licensee) + " for personal use." : "Licensed to the purchaser for personal use.";
  document.getElementById("root").innerHTML =
    '<a class="skip" href="#main" id="skip">Skip to content</a>' +
    '<div class="app" id="app">' +
    '<aside class="side" id="side" aria-label="Course navigation">' +
    '<a class="brand" href="#/"><span class="brand-mark">' + ICON.mark + "</span><span>Principe <b>AI</b></span></a>" +
    '<div class="side-course"><div class="t">' + esc(DATA.shortTitle) + '</div><div class="s" id="side-progress"></div><div class="bar" aria-hidden="true"><span id="side-bar"></span></div></div>' +
    '<form class="side-search" role="search" id="search-form"><label class="sr-only" for="q">Search lessons and prompts</label>' + ICON.search +
    '<input id="q" type="search" placeholder="Search lessons & prompts" autocomplete="off" enterkeyhint="search"><kbd aria-hidden="true">/</kbd></form>' +
    '<nav class="nav" aria-label="Course sections">' +
    '<a href="#/" data-nav="home">' + ICON.home + "Overview</a>" +
    '<a href="#/prompts" data-nav="prompts">' + ICON.sparkles + 'Prompt library<span class="count">' + TOTAL_PROMPTS + "</span></a>" +
    '<a href="#/notes" data-nav="notes">' + ICON.notes + "My notes</a>" +
    '<a href="#/certificate" data-nav="certificate">' + ICON.award + "Certificate</a>" +
    "</nav>" +
    DATA.modules
      .map(
        (m) =>
          '<div class="mod"><div class="mod-h">' + m.n + " · " + esc(m.title) + '<span data-mod="' + m.n + '"></span></div><ul class="lessons">' +
          m.lessons
            .map((slug) => {
              const l = BY_SLUG.get(slug);
              return '<li><a href="' + lessonHref(l) + '" data-lesson="' + l.slug + '"><span class="st" aria-hidden="true"></span><span class="nm">' + esc(l.title) + '</span><span class="du">' + l.durationMin + "m</span></a></li>";
            })
            .join("") +
          "</ul></div>",
      )
      .join("") +
    '<div class="side-foot"><div class="row"><button type="button" class="side-btn" id="theme-btn"></button><button type="button" class="side-btn" id="reset-btn">' + ICON.reset + "Reset</button></div>" +
    '<div class="license">' + licence + "<br>© " + year + " Principe Consults · " + '<a href="' + esc(DATA.siteUrl) + '" target="_blank" rel="noopener" style="color:inherit">' + esc(DATA.siteUrl.replace(/^https?:\/\//, "")) + "</a></div></div>" +
    "</aside>" +
    '<div class="scrim" id="scrim"></div>' +
    '<main class="main" id="main" tabindex="-1">' +
    '<header class="topbar"><button type="button" class="menu" id="menu-btn" aria-label="Open course menu" aria-expanded="false" aria-controls="side">' + ICON.menu + '</button><div class="tt">' + esc(DATA.shortTitle) + '</div><div class="pct" id="top-pct"></div></header>' +
    '<div class="view" id="view"></div>' +
    "</main></div>" +
    '<div class="toast" id="toast" role="status" aria-live="polite"></div>';

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const app = $("#app");
  const view = $("#view");

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* Theme */
  const dark = window.matchMedia("(prefers-color-scheme: dark)");
  function applyTheme() {
    const mode = state.theme === "system" ? (dark.matches ? "dark" : "light") : state.theme;
    document.documentElement.dataset.theme = mode;
    const label = { system: "Auto", light: "Light", dark: "Dark" }[state.theme];
    const icon = { system: ICON.auto, light: ICON.sun, dark: ICON.moon }[state.theme];
    $("#theme-btn").innerHTML = icon + "Theme: " + label;
    $("#theme-btn").setAttribute("aria-label", "Theme: " + label + ". Change theme");
  }
  if (dark.addEventListener) dark.addEventListener("change", applyTheme);
  $("#theme-btn").addEventListener("click", () => {
    state.theme = { system: "light", light: "dark", dark: "system" }[state.theme] || "system";
    save();
    applyTheme();
  });
  applyTheme();

  $("#reset-btn").addEventListener("click", () => {
    if (!window.confirm("Reset your progress, quiz answers, checklists and notes for this course on this device?")) return;
    Object.assign(state, { done: {}, checks: {}, notes: {}, quiz: {}, last: null, completedAt: null });
    save();
    location.hash = "#/";
    render();
    toast("Progress reset");
  });

  /* Mobile drawer */
  function setNav(open) {
    app.classList.toggle("nav-open", open);
    $("#menu-btn").setAttribute("aria-expanded", String(open));
  }
  $("#menu-btn").addEventListener("click", () => setNav(!app.classList.contains("nav-open")));
  $("#scrim").addEventListener("click", () => setNav(false));

  /* Search box */
  const q = $("#q");
  let searchTimer;
  function goSearch(value, push) {
    const target = value.trim() ? "#/search/" + encodeURIComponent(value.trim()) : "#/";
    if (push) location.hash = target;
    else {
      history.replaceState(null, "", target);
      render();
    }
  }
  q.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => goSearch(q.value, !location.hash.startsWith("#/search/")), 220);
  });
  $("#search-form").addEventListener("submit", (e) => {
    e.preventDefault();
    goSearch(q.value, !location.hash.startsWith("#/search/"));
    setNav(false);
  });

  document.addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
    if (e.key === "Escape") setNav(false);
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "/") {
      e.preventDefault();
      setNav(true);
      q.focus();
    }
    const lesson = currentLesson();
    if (lesson && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      const target = LESSONS[lesson.n - 1 + (e.key === "ArrowRight" ? 1 : -1)];
      if (target) location.hash = lessonHref(target);
    }
  });

  /* ── Router ────────────────────────────────────────── */
  function parseRoute() {
    const parts = location.hash.replace(/^#\/?/, "").split("/");
    return { name: parts[0] || "home", arg: decodeURIComponent(parts.slice(1).join("/")) };
  }
  function currentLesson() {
    const r = parseRoute();
    return r.name === "lesson" ? BY_SLUG.get(r.arg) : null;
  }
  function render() {
    const r = parseRoute();
    view.className = "view";
    if (r.name === "lesson" && BY_SLUG.has(r.arg)) renderLesson(BY_SLUG.get(r.arg));
    else if (r.name === "prompts") renderPrompts(r.arg);
    else if (r.name === "search") renderSearch(r.arg);
    else if (r.name === "notes") renderNotes();
    else if (r.name === "certificate") renderCertificate();
    else renderHome();
    if (r.name !== "search" && document.activeElement !== q) q.value = "";
    updateSide(r);
    setNav(false);
    window.scrollTo(0, 0);
    const h1 = $("h1", view);
    if (h1 && r.name !== "search") {
      h1.setAttribute("tabindex", "-1");
      h1.focus({ preventScroll: true });
    }
  }
  window.addEventListener("hashchange", render);

  function updateSide(r) {
    const done = doneCount();
    $("#side-progress").textContent = done + " of " + LESSONS.length + " lessons complete";
    $("#side-bar").style.width = pct() + "%";
    $("#top-pct").textContent = pct() + "%";
    $$(".nav a").forEach((a) => a.toggleAttribute("aria-current", a.dataset.nav === r.name || (r.name === "home" && a.dataset.nav === "home")));
    $$(".nav a[aria-current]").forEach((a) => a.setAttribute("aria-current", "page"));
    $$(".lessons a").forEach((a) => {
      const active = r.name === "lesson" && a.dataset.lesson === r.arg;
      a.toggleAttribute("aria-current", active);
      if (active) a.setAttribute("aria-current", "page");
      a.parentElement.classList.toggle("done", !!state.done[a.dataset.lesson]);
    });
    DATA.modules.forEach((m) => {
      const n = m.lessons.filter((s) => state.done[s]).length;
      $('[data-mod="' + m.n + '"]').textContent = n + "/" + m.lessons.length;
    });
    const active = $(".lessons a[aria-current]");
    if (active && window.innerWidth > 960) active.scrollIntoView({ block: "nearest" });
  }

  /* ── Home ──────────────────────────────────────────── */
  function renderHome() {
    document.title = DATA.title + " · Principe AI";
    const done = doneCount();
    const next = nextUp();
    const started = done > 0 || !!state.last;
    const cta = next || LESSONS[0];
    const ctaLabel = !started ? "Start the course" : next ? "Continue: Lesson " + next.n : "Review the course";
    view.innerHTML =
      '<section class="hero">' +
      '<div class="hero-emoji" aria-hidden="true">' + esc(DATA.emoji) + "</div>" +
      '<p class="kicker">Principe AI · ' + esc(DATA.level) + " course</p>" +
      '<h1 class="display">' + splitTitle(DATA.title) + "</h1>" +
      '<p class="lead">' + esc(DATA.subtitle) + "</p>" +
      '<div class="chips">' +
      '<span class="chip">' + ICON.signal + esc(DATA.level) + "</span>" +
      '<span class="chip">' + ICON.layers + DATA.modules.length + " modules · " + LESSONS.length + " lessons</span>" +
      '<span class="chip">' + ICON.clock + fmtDuration(DATA.totalMin) + "</span>" +
      '<span class="chip">' + ICON.wifi + "Works offline</span></div>" +
      '<div class="hero-cta"><a class="btn primary" href="' + lessonHref(cta) + '">' + ctaLabel + ICON.right + "</a>" +
      '<a class="btn secondary" href="#/prompts">' + ICON.sparkles + "Browse " + TOTAL_PROMPTS + " prompts</a></div>" +
      (started
        ? '<div class="hero-progress"><div>' + done + " of " + LESSONS.length + " lessons complete · " + pct() + '%</div><div class="bar"><span style="width:' + pct() + '%"></span></div></div>'
        : "") +
      "</section>" +
      (DATA.welcomeVideoUrl
        ? '<a class="video" href="' + esc(DATA.welcomeVideoUrl) + '" target="_blank" rel="noopener"><span class="play">' + ICON.play + "</span><span><strong>Watch the welcome video</strong><span>Opens in your browser · needs an internet connection</span></span></a>"
        : "") +
      '<section class="section"><h2>What you\'ll be able to do</h2><p class="sub">By the end of this course you\'ll be able to:</p><div class="grid2">' +
      DATA.outcomes.map((o) => '<div class="card outcome"><span class="tick">' + ICON.check + "</span><span>" + esc(o) + "</span></div>").join("") +
      "</div></section>" +
      '<section class="section"><h2>How this course works</h2><p class="sub">Short lessons, real practice, and a clear finish line.</p><div class="steps">' +
      step("Learn the idea", "Read each short lesson" + (LESSONS.some((l) => l.videoUrl) ? " and watch its video" : "") + ". Every one ends with the key takeaways.") +
      step("Try it with AI", "Copy the ready-made prompts into Claude, ChatGPT, Gemini or Copilot and adapt them to you.") +
      step("Check yourself", "Answer three quick questions at the end of each lesson and keep notes as you go.") +
      step("Get certified", "Mark every lesson complete to unlock your certificate of completion.") +
      "</div></section>" +
      '<section class="section"><h2>Course map</h2><p class="sub">' + DATA.modules.length + " modules, " + LESSONS.length + " lessons. Take them in order or jump to what you need.</p><div class=\"modmap\">" +
      DATA.modules
        .map((m) => {
          const ls = m.lessons.map((s) => BY_SLUG.get(s));
          const n = ls.filter((l) => state.done[l.slug]).length;
          return (
            '<div class="card modcard"><header><span class="modnum">' + m.n + '</span><div><h3>' + esc(m.title) + '</h3><div class="faint">' + ls.length + " lessons · " +
            fmtDuration(ls.reduce((s, l) => s + l.durationMin, 0)) + '</div></div><span class="mini">' + n + "/" + ls.length + " done</span></header><ul class=\"rows\">" +
            ls
              .map(
                (l) =>
                  '<li><a href="' + lessonHref(l) + '"><span class="n">' + l.n + '</span><span class="nm">' + esc(l.title) + "</span>" +
                  (state.done[l.slug] ? '<span class="pill">Done</span>' : '<span class="du">' + l.durationMin + " min</span>") + "</a></li>",
              )
              .join("") +
            "</ul></div>"
          );
        })
        .join("") +
      "</div></section>" +
      '<section class="section"><h2>About this course</h2><div class="about">' + DATA.descriptionHtml + "</div></section>" +
      '<section class="section"><div class="card help"><p><strong>Questions or stuck on something?</strong><br><span class="muted">Email <a href="mailto:' + esc(DATA.contactEmail) + '">' + esc(DATA.contactEmail) + "</a> and we'll help.</span></p>" +
      '<a class="btn secondary" href="' + esc(DATA.siteUrl) + '/book" target="_blank" rel="noopener">Book a free strategy call</a></div></section>';
  }
  function step(title, text) {
    return '<div class="card step"><h3>' + esc(title) + "</h3><p>" + esc(text) + "</p></div>";
  }

  /* ── Lesson ────────────────────────────────────────── */
  function renderLesson(l) {
    document.title = l.title + " · " + DATA.shortTitle;
    state.last = l.slug;
    save();
    const prev = LESSONS[l.n - 2];
    const next = LESSONS[l.n];
    const done = !!state.done[l.slug];
    view.innerHTML =
      '<article class="lesson">' +
      '<div class="crumbs"><a href="#/">' + esc(DATA.shortTitle) + '</a><span class="dot">/</span><span>Module ' + l.module + " · " + esc(l.moduleTitle) + "</span></div>" +
      '<p class="kicker">Lesson ' + l.n + " of " + LESSONS.length + "</p>" +
      '<h1 class="display">' + esc(l.title) + "</h1>" +
      '<p class="lead">' + esc(l.summary) + "</p>" +
      '<div class="lesson-meta"><span class="chip">' + ICON.clock + l.durationMin + " min read</span>" +
      (l.blocks.length ? '<span class="chip">' + ICON.sparkles + l.blocks.length + " ready-to-copy " + (l.blocks.length === 1 ? "block" : "blocks") + "</span>" : "") +
      (done ? '<span class="pill">Completed</span>' : "") + "</div>" +
      (l.videoUrl
        ? '<a class="video" href="' + esc(l.videoUrl) + '" target="_blank" rel="noopener"><span class="play">' + ICON.play + "</span><span><strong>Watch the lesson video</strong><span>Opens in your browser · needs an internet connection</span></span></a>"
        : "") +
      '<div class="prose" id="lesson-body">' + l.html + "</div>" +
      quizHtml(l) +
      '<div class="notes"><label for="note">Your notes <span id="note-status">Saved on this device</span></label>' +
      '<textarea id="note" placeholder="Ideas, prompts that worked for you, things to try next…">' + esc(state.notes[l.slug] || "") + "</textarea></div>" +
      '<nav class="pager" aria-label="Lesson navigation"><div>' +
      (prev ? '<a class="btn ghost prev" href="' + lessonHref(prev) + '">' + ICON.left + "Previous</a>" : "") +
      '</div><div class="right">' +
      '<button type="button" class="btn ' + (done ? "done" : "secondary") + '" data-toggle>' + (done ? ICON.check + "Completed" : "Mark complete") + "</button>" +
      (next
        ? '<button type="button" class="btn primary" data-next>' + (done ? "Next lesson" : "Complete & continue") + ICON.right + "</button>"
        : '<button type="button" class="btn primary" data-finish>' + (done ? "Get your certificate" : "Finish the course") + ICON.right + "</button>") +
      "</div></nav></article>";

    enhance($("#lesson-body"), l);
    const quiz = $(".quiz", view);
    if (quiz) {
      paintQuiz(quiz, l);
      quiz.addEventListener("click", (e) => {
        const opt = e.target.closest(".opt");
        if (opt && !opt.disabled) {
          const qi = +opt.closest(".q").dataset.q;
          state.quiz[l.slug] = Object.assign({}, state.quiz[l.slug], { [qi]: +opt.dataset.o });
          save();
          paintQuiz(quiz, l);
        } else if (e.target.closest("[data-retake]")) {
          delete state.quiz[l.slug];
          save();
          paintQuiz(quiz, l);
          $(".opt", quiz).focus();
        }
      });
    }

    const note = $("#note");
    let noteTimer;
    note.addEventListener("input", () => {
      $("#note-status").textContent = "Saving…";
      clearTimeout(noteTimer);
      noteTimer = setTimeout(() => {
        if (note.value.trim()) state.notes[l.slug] = note.value;
        else delete state.notes[l.slug];
        save();
        $("#note-status").textContent = "Saved on this device";
      }, 400);
    });

    $("[data-toggle]", view).addEventListener("click", () => {
      setDone(l, !state.done[l.slug]);
      renderLessonState(l);
    });
    const nextBtn = $("[data-next]", view);
    if (nextBtn)
      nextBtn.addEventListener("click", () => {
        if (!state.done[l.slug]) setDone(l, true);
        location.hash = lessonHref(next);
      });
    const finish = $("[data-finish]", view);
    if (finish)
      finish.addEventListener("click", () => {
        if (!state.done[l.slug]) setDone(l, true);
        location.hash = "#/certificate";
      });
  }
  function renderLessonState(l) {
    const y = window.scrollY;
    renderLesson(l);
    updateSide(parseRoute());
    window.scrollTo(0, y);
  }
  function setDone(l, value) {
    if (value) state.done[l.slug] = 1;
    else delete state.done[l.slug];
    if (doneCount() === LESSONS.length && !state.completedAt) state.completedAt = new Date().toISOString();
    save();
    if (value) toast("Lesson " + l.n + " complete · " + doneCount() + " of " + LESSONS.length + " done");
  }

  function blockHtml(text, lang) {
    return (
      '<div class="block"><div class="block-head">' + ICON.sparkles + "<span>" + (LANGS[lang] || "Ready to copy") + "</span>" +
      '<button type="button" class="copy" aria-label="Copy to clipboard">' + ICON.copy + "<span>Copy</span></button></div><pre><code>" + esc(text) + "</code></pre></div>"
    );
  }
  function enhance(root, l) {
    $$("pre", root).forEach((pre) => {
      const code = pre.querySelector("code");
      const lang = ((code && code.className.match(/language-(\w+)/)) || [])[1];
      const wrap = document.createElement("div");
      wrap.innerHTML = blockHtml("", lang);
      const block = wrap.firstChild;
      const placeholder = block.querySelector("pre");
      pre.replaceWith(block);
      placeholder.replaceWith(pre);
    });
    $$("table", root).forEach((t) => {
      const w = document.createElement("div");
      w.className = "table-wrap";
      t.replaceWith(w);
      w.appendChild(t);
    });
    $$('a[href^="http"]', root).forEach((a) => {
      a.target = "_blank";
      a.rel = "noopener";
    });
    $$(".sec-exercise", root).forEach((sec, si) => {
      $$(":scope > ol > li, :scope > ul > li", sec).forEach((li, i) => {
        const key = l.slug + ":" + si + ":" + i;
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.className = "cbx";
        cb.setAttribute("aria-label", "Mark step " + (i + 1) + " done");
        cb.checked = !!state.checks[key];
        li.classList.add("chk");
        li.classList.toggle("is-done", cb.checked);
        cb.addEventListener("change", () => {
          if (cb.checked) state.checks[key] = 1;
          else delete state.checks[key];
          li.classList.toggle("is-done", cb.checked);
          save();
        });
        li.prepend(cb);
      });
    });
  }
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".copy");
    if (!btn) return;
    copyText(btn.closest(".block").querySelector("pre").textContent, btn);
  });
  function copyText(text, btn) {
    const ok = () => {
      btn.classList.add("ok");
      btn.querySelector("span").textContent = "Copied";
      setTimeout(() => {
        btn.classList.remove("ok");
        btn.querySelector("span").textContent = "Copy";
      }, 1600);
    };
    const fallback = () => {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      let copied = false;
      try {
        copied = document.execCommand("copy");
      } catch {
        copied = false;
      }
      ta.remove();
      if (copied) ok();
      else toast("Couldn't copy automatically. Select the text and copy it.");
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(ok, fallback);
    else fallback();
  }

  function quizHtml(l) {
    if (!l.quiz.length) return "";
    return (
      '<section class="quiz" aria-labelledby="quiz-h"><div class="quiz-head"><p class="kicker">Knowledge check</p><h2 id="quiz-h">Check your understanding</h2>' +
      "<p>" + l.quiz.length + " quick questions. Pick an answer to see why it's right.</p></div><ol>" +
      l.quiz
        .map(
          (x, qi) =>
            '<li class="q" data-q="' + qi + '"><p class="q-text">' + esc(x.q) + '</p><div class="opts" role="group" aria-label="Answers to question ' + (qi + 1) + '">' +
            x.options.map((o, oi) => '<button type="button" class="opt" data-o="' + oi + '"><span class="k">' + "ABCD"[oi] + "</span><span>" + esc(o) + "</span></button>").join("") +
            '</div><p class="explain" hidden></p></li>',
        )
        .join("") +
      '</ol><div class="quiz-foot"><span class="score" aria-live="polite"></span><button type="button" class="btn ghost" data-retake hidden>' + ICON.reset + "Retake</button></div></section>"
    );
  }
  function paintQuiz(el, l) {
    const answers = state.quiz[l.slug] || {};
    let right = 0;
    let answered = 0;
    $$(".q", el).forEach((qEl) => {
      const qi = +qEl.dataset.q;
      const x = l.quiz[qi];
      const chosen = answers[qi];
      const has = chosen !== undefined;
      $$(".opt", qEl).forEach((b) => {
        const oi = +b.dataset.o;
        b.disabled = has;
        b.classList.toggle("right", has && oi === x.answer);
        b.classList.toggle("wrong", has && oi === chosen && chosen !== x.answer);
        b.classList.toggle("dim", has && oi !== x.answer && oi !== chosen);
        b.setAttribute("aria-pressed", String(has && oi === chosen));
      });
      const ex = $(".explain", qEl);
      ex.hidden = !has;
      if (has) {
        answered++;
        const correct = chosen === x.answer;
        if (correct) right++;
        ex.className = "explain" + (correct ? "" : " no");
        ex.innerHTML = "<b>" + (correct ? "Correct." : "Not quite.") + "</b> " + esc(x.explain);
      }
    });
    const total = l.quiz.length;
    const score = $(".score", el);
    score.className = "score" + (answered === total && right === total ? " perfect" : "");
    score.textContent = answered === total ? "You got " + right + " of " + total + (right === total ? ". Perfect!" : ". Review the explanations, then retake it.") : answered + " of " + total + " answered";
    $("[data-retake]", el).hidden = answered === 0;
  }

  /* ── Prompt library ────────────────────────────────── */
  function renderPrompts(initial) {
    document.title = "Prompt library · " + DATA.shortTitle;
    view.className = "view wide";
    view.innerHTML =
      '<div class="page-head"><p class="kicker">Your toolkit</p><h1 class="display">Prompt library</h1>' +
      '<p class="lead">Every prompt, template and example from the course in one place: ' + TOTAL_PROMPTS +
      " in total. Copy one into your AI assistant and fill in the details in brackets.</p></div>" +
      '<label class="sr-only" for="lib-filter">Filter the prompt library</label><input class="filter" id="lib-filter" type="search" placeholder="Filter by keyword, e.g. email, meal, policy…" value="' + esc(initial || "") + '">' +
      '<div id="lib"></div>';
    const input = $("#lib-filter");
    const paint = () => {
      const terms = input.value.toLowerCase().split(/\s+/).filter(Boolean);
      const match = (s) => terms.every((t) => s.toLowerCase().includes(t));
      let shown = 0;
      const html = LESSONS.map((l) => {
        const blocks = l.blocks.filter((b) => match(b.text + " " + l.title));
        shown += blocks.length;
        if (!blocks.length) return "";
        return (
          '<div class="group"><h2><a href="' + lessonHref(l) + '">Lesson ' + l.n + ": " + esc(l.title) + '</a></h2><div class="faint">Module ' + l.module + " · " + esc(l.moduleTitle) + "</div>" +
          blocks.map((b) => blockHtml(b.text, b.lang)).join("") + "</div>"
        );
      }).join("");
      $("#lib").innerHTML = shown ? html : '<div class="empty">No prompts match “' + esc(input.value) + "”. Try a different word.</div>";
    };
    input.addEventListener("input", paint);
    paint();
  }

  /* ── Search ────────────────────────────────────────── */
  function renderSearch(query) {
    document.title = "Search · " + DATA.shortTitle;
    if (document.activeElement !== q) q.value = query;
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const hits = LESSONS.map((l) => {
      const hay = (l.title + " " + l.summary + " " + l.text).toLowerCase();
      if (!terms.length || !terms.every((t) => hay.includes(t))) return null;
      const score = terms.reduce((s, t) => s + (l.title.toLowerCase().includes(t) ? 10 : 0) + hay.split(t).length - 1, 0);
      return { l, score };
    })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);
    const promptHits = LESSONS.reduce((n, l) => n + l.blocks.filter((b) => terms.length && terms.every((t) => b.text.toLowerCase().includes(t))).length, 0);
    view.innerHTML =
      '<div class="page-head"><p class="kicker">Search</p><h1 class="display">' + (terms.length ? "Results for “" + esc(query) + "”" : "Search the course") + "</h1>" +
      '<p class="lead">' + hits.length + (hits.length === 1 ? " lesson" : " lessons") + " found" +
      (promptHits ? ' · <a href="#/prompts/' + encodeURIComponent(query) + '">' + promptHits + (promptHits === 1 ? " matching prompt" : " matching prompts") + " in the library</a>" : "") + "</p></div>" +
      (hits.length
        ? hits.map((h) => '<a class="card result" href="' + lessonHref(h.l) + '"><div class="t">Lesson ' + h.l.n + ": " + highlight(esc(h.l.title), terms) + '</div><div class="s">' + snippet(h.l, terms) + "</div></a>").join("")
        : '<div class="empty">Nothing found. Try fewer or different words.</div>');
  }
  function highlight(html, terms) {
    if (!terms.length) return html;
    const re = new RegExp("(" + terms.map((t) => esc(t).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")", "gi");
    return html.replace(re, "<mark>$1</mark>");
  }
  function snippet(l, terms) {
    const text = l.text;
    const i = Math.max(0, text.toLowerCase().indexOf(terms[0]));
    const start = Math.max(0, i - 80);
    const piece = (start > 0 ? "…" : "") + text.slice(start, start + 220) + (start + 220 < text.length ? "…" : "");
    return highlight(esc(piece), terms);
  }

  /* ── Notes ─────────────────────────────────────────── */
  function renderNotes() {
    document.title = "My notes · " + DATA.shortTitle;
    const withNotes = LESSONS.filter((l) => state.notes[l.slug]);
    view.innerHTML =
      '<div class="page-head"><p class="kicker">Your workspace</p><h1 class="display">My notes</h1>' +
      '<p class="lead">Everything you\'ve written in the notes box at the end of each lesson. It\'s saved in this browser on this device.</p></div>' +
      (withNotes.length
        ? '<div class="actions"><button type="button" class="btn primary" id="export-notes">' + ICON.download + 'Download my notes</button><button type="button" class="btn secondary" id="copy-notes">' + ICON.copy + "Copy all</button></div>" +
          withNotes.map((l) => '<div class="card note-item"><a href="' + lessonHref(l) + '"><strong>Lesson ' + l.n + ": " + esc(l.title) + "</strong></a><p>" + esc(state.notes[l.slug]) + "</p></div>").join("")
        : '<div class="empty">No notes yet. Use the notes box at the end of any lesson and they\'ll collect here.</div>');
    const text = () =>
      "My notes: " + DATA.title + "\n\n" + withNotes.map((l) => "Lesson " + l.n + ": " + l.title + "\n" + "-".repeat(40) + "\n" + state.notes[l.slug].trim() + "\n").join("\n");
    const exp = $("#export-notes");
    if (exp) {
      exp.addEventListener("click", () => {
        const url = URL.createObjectURL(new Blob([text()], { type: "text/plain;charset=utf-8" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = "My notes - " + DATA.shortTitle + ".txt";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      });
      $("#copy-notes").addEventListener("click", (e) => {
        const btn = e.currentTarget;
        const done = () => toast("Notes copied");
        if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text()).then(done, () => toast("Couldn't copy. Use Download instead."));
        else toast("Couldn't copy. Use Download instead.");
        btn.blur();
      });
    }
  }

  /* ── Certificate ───────────────────────────────────── */
  function renderCertificate() {
    document.title = "Certificate · " + DATA.shortTitle;
    const done = doneCount();
    if (done < LESSONS.length) {
      const left = LESSONS.filter((l) => !state.done[l.slug]);
      view.innerHTML =
        '<div class="page-head"><p class="kicker">Certificate of completion</p><h1 class="display">Almost there</h1></div>' +
        '<div class="card locked"><div class="big">' + done + "/" + LESSONS.length + '</div><p class="muted">lessons complete. Mark every lesson complete to unlock your certificate.</p>' +
        '<div class="bar" style="max-width:420px;margin:16px auto 0;background:var(--border)"><span style="width:' + pct() + '%"></span></div>' +
        '<ul class="rows left-list">' +
        left.map((l) => '<li><a href="' + lessonHref(l) + '"><span class="n">' + l.n + '</span><span class="nm">' + esc(l.title) + '</span><span class="du">' + l.durationMin + " min</span></a></li>").join("") +
        "</ul></div>";
      return;
    }
    if (!state.completedAt) {
      state.completedAt = new Date().toISOString();
      save();
    }
    const name = state.name || DATA.licensee || "";
    const date = new Date(state.completedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    view.className = "view wide";
    view.innerHTML =
      '<div class="cert-wrap"><div class="page-head" style="margin:0"><p class="kicker">You did it</p><h1 class="display">Your certificate</h1>' +
      '<p class="lead">You\'ve completed every lesson of ' + esc(DATA.shortTitle) + ". Add your name, then print it or save it as a PDF.</p></div>" +
      '<form class="cert-form" id="cert-form"><label>Name on the certificate<input id="cert-name" value="' + esc(name) + '" placeholder="Your full name" autocomplete="name" maxlength="60"></label>' +
      '<button type="submit" class="btn primary">' + ICON.print + "Print or save as PDF</button></form>" +
      '<div class="cert" id="cert"><div class="brand"><span class="brand-mark">' + ICON.mark + "</span><span>Principe <b>AI</b></span></div>" +
      '<div class="c-k">Certificate of completion</div><div class="c-name" id="cert-out"></div><div class="c-line"></div>' +
      '<div class="c-txt">has successfully completed all ' + LESSONS.length + " lessons of</div>" +
      '<div class="c-course">' + esc(DATA.title) + "</div>" +
      '<div class="c-txt">' + esc(DATA.level) + " level · " + DATA.modules.length + " modules · " + fmtDuration(DATA.totalMin) + " of lessons</div>" +
      '<div class="c-foot"><div><b>' + esc(date) + "</b>Date completed</div><div><b>Principe Consults</b>Issued by Principe AI</div></div></div></div>";
    const input = $("#cert-name");
    const paint = () => {
      $("#cert-out").textContent = input.value.trim() || "Your name";
    };
    input.addEventListener("input", () => {
      state.name = input.value.trim();
      save();
      paint();
    });
    paint();
    $("#cert-form").addEventListener("submit", (e) => {
      e.preventDefault();
      if (!input.value.trim()) {
        input.focus();
        toast("Add your name first");
        return;
      }
      const page = document.createElement("style");
      page.textContent = "@page { size: letter landscape; margin: 0; }";
      document.head.appendChild(page);
      document.body.classList.add("print-cert");
      const cleanup = () => {
        page.remove();
        document.body.classList.remove("print-cert");
        window.removeEventListener("afterprint", cleanup);
      };
      window.addEventListener("afterprint", cleanup);
      window.print();
    });
  }

  render();
})();
