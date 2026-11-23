// A DjVu reader for Tapalog Reader, built on DjVu.js (djvu.js next to this file, GNU GPL v2: see GNU_GPL_v2 and LICENSE.md).
// Pages one at a time or in one continuous scroll, a strip of page previews and the table of contents on the left,
// search in the text of the pages (when the book has a text layer), zoom (1 = the width of the window), keys and a drag to scroll.

const WORDS = {
  en: { contents: "Contents", pages: "Page previews", fitPage: "Fit the whole page", prev: "Previous page", next: "Next page", page: "Page", of: "of", zoomIn: "Zoom in", zoomOut: "Zoom out", fit: "Fit to width", opening: "Opening the book…", label: "Page {n}", error: "Could not open this DjVu file", continuous: "Continuous scroll", single: "One page at a time", search: "Search in the text", searchHint: "Find in the text…", matchPrev: "Previous match", matchNext: "Next match", close: "Close", reading: "Reading the text… {n} of {total}", matches: "{n} of {total}", noMatches: "Nothing found", noText: "This book has no text to search (a scan)." },
  ru: { contents: "Оглавление", pages: "Миниатюры страниц", fitPage: "Страница целиком", prev: "Предыдущая страница", next: "Следующая страница", page: "Страница", of: "из", zoomIn: "Увеличить", zoomOut: "Уменьшить", fit: "По ширине окна", opening: "Открываю книгу…", label: "Страница {n}", error: "Не удалось открыть этот файл DjVu", continuous: "Непрерывная прокрутка", single: "По одной странице", search: "Поиск по тексту", searchHint: "Найти в тексте…", matchPrev: "Предыдущее совпадение", matchNext: "Следующее совпадение", close: "Закрыть", reading: "Читаю текст… {n} из {total}", matches: "{n} из {total}", noMatches: "Ничего не найдено", noText: "В этой книге нет текста для поиска (это скан)." },
  uk: { contents: "Зміст", pages: "Мініатюри сторінок", fitPage: "Сторінка цілком", prev: "Попередня сторінка", next: "Наступна сторінка", page: "Сторінка", of: "з", zoomIn: "Збільшити", zoomOut: "Зменшити", fit: "За шириною вікна", opening: "Відкриваю книгу…", label: "Сторінка {n}", error: "Не вдалося відкрити цей файл DjVu", continuous: "Безперервне прокручування", single: "По одній сторінці", search: "Пошук за текстом", searchHint: "Знайти в тексті…", matchPrev: "Попередній збіг", matchNext: "Наступний збіг", close: "Закрити", reading: "Читаю текст… {n} з {total}", matches: "{n} з {total}", noMatches: "Нічого не знайдено", noText: "У цій книзі немає тексту для пошуку (це скан)." },
};
// An isolated plugin is not told the program's language and its document has none, so the browser's own is used.
const LANG = [...(navigator.languages ?? []), navigator.language].map((l) => String(l ?? "").slice(0, 2).toLowerCase()).find((l) => l in WORDS) ?? "en";
const words = () => WORDS[LANG];
const fill = (text, values) => text.replace(/\{(\w+)\}/g, (_, key) => String(values[key]));

const STYLE = `
:host { display: block; height: 100%; }
.root { display: flex; flex-direction: column; height: 100%; background: var(--back); color: var(--text); font: 14px system-ui, sans-serif; }
.bar { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; justify-content: center; padding: 6px 8px; background: var(--bar); border-bottom: 1px solid var(--line); }
.find { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; justify-content: center; padding: 6px 8px; background: var(--bar); border-bottom: 1px solid var(--line); }
.find[hidden] { display: none; }
button { font: inherit; min-width: 34px; height: 32px; border: 1px solid var(--line); border-radius: 6px; background: var(--button); color: inherit; cursor: pointer; }
button:disabled { opacity: .4; cursor: default; }
button.on { background: var(--line); }
button:focus-visible, input:focus-visible { outline: 2px solid #3b82f6; outline-offset: 1px; }
input { width: 4.5em; height: 30px; text-align: center; font: inherit; border: 1px solid var(--line); border-radius: 6px; background: var(--button); color: inherit; }
input.query { width: min(22em, 60vw); text-align: left; padding: 0 8px; }
.count, .status { opacity: .7; }
.sep { width: 1px; height: 22px; background: var(--line); margin: 0 4px; }
.body { flex: 1; min-height: 0; display: flex; }
.side { flex: none; width: 156px; overflow: auto; background: var(--bar); border-right: 1px solid var(--line); box-sizing: border-box; }
.side[hidden], .thumbs[hidden], .toc[hidden] { display: none; }
.side.wide { width: min(280px, 70%); }
.thumbs { padding: 8px 10px; display: flex; flex-direction: column; gap: 8px; }
.cell { height: auto; min-width: 0; padding: 4px 4px 2px; display: flex; flex-direction: column; align-items: center; gap: 2px; background: none; border: 2px solid transparent; border-radius: 6px; }
.cell:hover { background: var(--button); }
.cell.current { border-color: #3b82f6; }
.cell canvas { width: 100%; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.3); display: block; }
.cell span { font-size: 12px; opacity: .8; }
.toc { padding: 6px 4px; }
.toc button { display: block; width: 100%; height: auto; min-height: 28px; padding: 4px 8px; text-align: left; border: 0; background: none; border-radius: 4px; line-height: 1.3; }
.toc button:hover { background: var(--button); }
.toc .current { background: var(--button); font-weight: 600; }
.stage { flex: 1; min-width: 0; overflow: auto; cursor: grab; touch-action: pan-x pan-y pinch-zoom; position: relative; }
.stage.dragging { cursor: grabbing; user-select: none; }
.pages { position: relative; padding: 12px; box-sizing: content-box; width: max-content; min-width: calc(100% - 24px); display: flex; flex-direction: column; align-items: center; gap: 12px; }
.pg { position: relative; flex: none; background: #fff; box-shadow: 0 1px 8px rgba(0,0,0,.35); }
.pg img { position: absolute; inset: 0; width: 100%; height: 100%; display: block; user-select: none; -webkit-user-drag: none; }
.hl { position: absolute; inset: 0; pointer-events: none; }
.hit { position: absolute; background: rgba(255, 213, 0, .4); outline: 1px solid rgba(220, 160, 0, .8); border-radius: 2px; mix-blend-mode: multiply; }
.hit.now { background: rgba(255, 120, 0, .5); outline-color: rgba(220, 80, 0, .95); }
.note { padding: 2rem; text-align: center; opacity: .75; }
@media (max-width: 720px) { .side { width: 108px; } }
`;

const THEMES = {
  light: "--back:#e7e7ea;--bar:#f6f6f8;--button:#ffffff;--line:#c9c9d0;--text:#1d1d22;",
  dark: "--back:#26262b;--bar:#1c1c20;--button:#2c2c32;--line:#44444c;--text:#e8e8ec;",
};

let loading;
/**
 * Loads djvu.js once (it puts DjVu on the global object) and returns the address of a copy of it for the decoder's worker.
 * A sandboxed frame has no origin of its own, so a worker cannot be started from the plugin's file: the file is fetched and
 * the worker is started from a `blob:` address made of it.
 */
function library() {
  loading ??= import("./djvu.js")
    .then(async () => {
      const response = await fetch(new URL("./djvu.js", import.meta.url));
      if (!response.ok) throw new TypeError(`The server answered ${response.status}`);
      return URL.createObjectURL(new Blob([await response.text()], { type: "text/javascript" }));
    })
    .catch((err) => {
      loading = undefined; // tried again the next time
      throw err;
    });
  return loading;
}

const MAX_COVER_BYTES = 300 * 1024 * 1024; // a cover needs the whole file, so a huge book gets none

/** The cover for the library: the first page, drawn by the same decoder. See "Plugins" in the README. */
export async function cover(context) {
  const workerUrl = await library();
  const buffer = await context.file(); // a failed file() is a TypeError: tried again later
  if (buffer.byteLength > MAX_COVER_BYTES) throw new Error("too large for a cover");
  const worker = new globalThis.DjVu.Worker(workerUrl);
  try {
    await worker.createDocument(buffer);
    const image = await worker.doc.getPage(1).getImageData().run();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    canvas.getContext("2d").putImageData(image, 0, 0);
    return canvas;
  } finally {
    worker.terminate();
  }
}

/** Lower case, "ё" as "е", runs of white space as one space: what is compared when searching. */
const fold = (text) => String(text ?? "").toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ");

export async function mount(host, context) {
  const w = words();
  const holder = document.createElement("div"); // a shadow root of its own, so the page's styles and these never meet
  holder.style.height = "100%";
  host.replaceChildren(holder);
  const shadow = holder.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = STYLE;
  const root = document.createElement("div");
  root.className = "root";
  root.style.cssText = THEMES[context.theme];
  shadow.append(style, root);
  const note = (text) => {
    const p = document.createElement("div");
    p.className = "note";
    p.textContent = text;
    root.replaceChildren(p);
  };
  note(w.opening);

  let worker;
  let destroyed = false;
  let timer;
  let pageObserver;
  let thumbObserver;
  const stopTheme = context.onTheme((theme) => (root.style.cssText = THEMES[theme]));
  const destroy = () => {
    destroyed = true;
    clearTimeout(timer);
    pageObserver?.disconnect();
    thumbObserver?.disconnect();
    stopTheme();
    worker?.terminate();
    holder.remove();
  };

  let pages = 0;
  let sizes = [];
  try {
    const workerUrl = await library();
    const buffer = await context.file();
    if (destroyed) return { destroy };
    worker = new globalThis.DjVu.Worker(workerUrl); // the worker runs the same file, from a blob: address
    await worker.createDocument(buffer);
    pages = await worker.doc.getPagesQuantity().run();
    if (!(pages > 0)) throw new Error("No pages in this file");
    sizes = await worker.doc.getPagesSizes().run();
  } catch (err) {
    destroy();
    context.onError(w.error, err instanceof Error ? err.message : String(err));
    return { destroy() {} };
  }
  if (destroyed) return { destroy };

  // ----- one job at a time for the decoder: what the reader looks at first, the rest (previews, text) in between -----
  const queue = { high: [], low: [] };
  let busy = false;
  const schedule = (level, job, alive = () => true) =>
    new Promise((resolve, reject) => {
      queue[level].push({ job, alive, resolve, reject });
      void pump();
    });
  async function pump() {
    if (busy) return;
    busy = true;
    while (!destroyed) {
      const next = queue.high.shift() ?? queue.low.shift();
      if (!next) break;
      if (!next.alive()) {
        next.resolve(undefined); // nobody wants it any more
        continue;
      }
      try {
        next.resolve(await next.job());
      } catch (err) {
        next.reject(err);
      }
    }
    busy = false;
  }

  // the table of contents, if the book has one: [{ title, page, depth }]
  let outline = [];
  try {
    const flat = [];
    const walk = (items, depth) => {
      for (const item of items ?? []) {
        flat.push({ title: String(item.description ?? "").trim() || "—", url: item.url, depth });
        walk(item.children, depth + 1);
      }
    };
    walk(await worker.doc.getContents().run(), 0);
    if (flat.length && flat.length <= 2000) {
      const numbers = [];
      for (const item of flat) numbers.push(await worker.doc.getPageNumberByUrl(item.url).run());
      outline = flat.flatMap((item, i) => (numbers[i] ? [{ title: item.title, page: numbers[i], depth: item.depth }] : []));
    }
  } catch {
    outline = []; // a damaged table of contents is just not shown
  }
  if (destroyed) return { destroy };

  // ----- state -----
  let page = Math.min(pages, Math.max(1, Math.round(Number(context.view?.page)) || 1));
  let zoom = Math.min(8, Math.max(0.25, Number(context.view?.zoom) || 1));
  // No storage in a sandboxed frame: the choices ride in the view that is reported (and so in a bookmark or a share link).
  let mode = context.view?.mode === "single" ? "single" : "continuous";
  let side = context.view?.side === "pages" || context.view?.side === "toc" ? context.view.side : ""; // "" is closed
  if (side === "toc" && !outline.length) side = "";
  if (matchMedia("(max-width: 720px)").matches) side = "";
  const ratioOf = (n) => Number(wrappers.get(n)?.dataset.ratio) || (sizes[n - 1] ? sizes[n - 1].height / sizes[n - 1].width : 1.4);

  // ----- controls -----
  const button = (text, title, onClick) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = text;
    b.title = title;
    b.setAttribute("aria-label", title);
    b.addEventListener("click", onClick);
    return b;
  };
  const sep = () => Object.assign(document.createElement("span"), { className: "sep" });
  const input = document.createElement("input");
  input.type = "text";
  input.inputMode = "numeric";
  input.setAttribute("aria-label", w.page);
  const count = document.createElement("span");
  count.className = "count";
  count.textContent = `${w.of} ${pages}`;
  const thumbsButton = button("▥", w.pages, () => setSide(side === "pages" ? "" : "pages"));
  const contentsButton = button("☰", w.contents, () => setSide(side === "toc" ? "" : "toc"));
  contentsButton.hidden = outline.length === 0;
  const prev = button("‹", w.prev, () => go(page - 1));
  const next = button("›", w.next, () => go(page + 1));
  const zoomOut = button("−", w.zoomOut, () => setZoom(zoom / 1.25));
  const zoomIn = button("+", w.zoomIn, () => setZoom(zoom * 1.25));
  const fit = button("↔", w.fit, () => setZoom(1));
  const fitPage = button("▭", w.fitPage, () => setZoom((stage.clientHeight - 24) / (fitWidth() * ratioOf(page))));
  const modeButton = button("", "", () => setMode(mode === "continuous" ? "single" : "continuous"));
  const searchButton = button("⌕", w.search, () => toggleSearch());
  const bar = document.createElement("div");
  bar.className = "bar";
  bar.append(thumbsButton, contentsButton, prev, input, count, next, sep(), zoomOut, zoomIn, fit, fitPage, sep(), modeButton, searchButton);

  const query = document.createElement("input");
  query.type = "search";
  query.className = "query";
  query.placeholder = w.searchHint;
  query.setAttribute("aria-label", w.search);
  const matchPrev = button("↑", w.matchPrev, () => stepMatch(-1));
  const matchNext = button("↓", w.matchNext, () => stepMatch(1));
  const status = document.createElement("span");
  status.className = "status";
  const find = document.createElement("div");
  find.className = "find";
  find.hidden = true;
  find.append(query, matchPrev, matchNext, status, button("×", w.close, () => toggleSearch(false)));

  const side$ = document.createElement("div");
  side$.className = "side";
  side$.hidden = true;
  const thumbsEl = document.createElement("div");
  thumbsEl.className = "thumbs";
  const tocEl = document.createElement("div");
  tocEl.className = "toc";
  side$.append(thumbsEl, tocEl);
  const stage = document.createElement("div");
  stage.className = "stage";
  stage.tabIndex = 0;
  const pagesEl = document.createElement("div");
  pagesEl.className = "pages";
  stage.append(pagesEl);
  const body = document.createElement("div");
  body.className = "body";
  body.append(side$, stage);
  root.replaceChildren(bar, find, body);

  const fitWidth = () => Math.max(120, stage.clientWidth - 24);

  // ----- the table of contents -----
  for (const item of outline) {
    const row = document.createElement("button");
    row.type = "button";
    row.textContent = item.title;
    row.title = `${item.title} — ${w.page} ${item.page}`;
    row.style.paddingLeft = `${8 + 14 * Math.min(item.depth, 6)}px`;
    row.dataset.page = String(item.page);
    row.addEventListener("click", () => go(item.page));
    tocEl.append(row);
  }

  // ----- page previews: one small box per page, drawn only when it comes into view -----
  const cells = [];
  const drawn = new Set();
  for (let n = 1; n <= pages; n++) {
    const canvas = document.createElement("canvas");
    canvas.width = 140;
    canvas.height = Math.round(140 * (sizes[n - 1] ? sizes[n - 1].height / sizes[n - 1].width : 1.4));
    const label = document.createElement("span");
    label.textContent = String(n);
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "cell";
    cell.title = `${w.page} ${n}`;
    cell.dataset.n = String(n);
    cell.append(canvas, label);
    cell.addEventListener("click", () => go(n));
    cells.push(cell);
    thumbsEl.append(cell);
  }
  async function drawThumb(n) {
    if (drawn.has(n) || destroyed) return;
    drawn.add(n);
    const cell = cells[n - 1];
    try {
      const info = await schedule("low", () => worker.doc.getPage(n).createPngObjectUrl().run(), () => cell.dataset.near === "1" && side === "pages");
      if (!info) return void drawn.delete(n); // gone out of view before its turn: drawn when it returns
      const blob = await (await fetch(info.url)).blob();
      worker.revokeObjectURL(info.url);
      const bitmap = await createImageBitmap(blob, { resizeWidth: 280, resizeQuality: "medium" });
      const canvas = cell.firstElementChild;
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      canvas.getContext("2d").drawImage(bitmap, 0, 0);
      bitmap.close();
    } catch {
      drawn.delete(n);
    }
  }
  thumbObserver = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        e.target.dataset.near = e.isIntersecting ? "1" : "";
        if (e.isIntersecting && side === "pages") void drawThumb(Number(e.target.dataset.n));
      }
    },
    { root: side$, rootMargin: "200px 0px" },
  );
  for (const cell of cells) thumbObserver.observe(cell);

  function setSide(next) {
    side = next;
    report();
    side$.hidden = side === "";
    side$.classList.toggle("wide", side === "toc");
    thumbsEl.hidden = side !== "pages";
    tocEl.hidden = side !== "toc";
    thumbsButton.classList.toggle("on", side === "pages");
    contentsButton.classList.toggle("on", side === "toc");
    if (side === "pages") for (const cell of cells) if (cell.dataset.near === "1") void drawThumb(Number(cell.dataset.n));
    layout();
    syncSide();
  }

  /** Marks the page being read in the strip and the contents, and brings it into view there. */
  function syncSide() {
    for (const cell of cells) cell.classList.toggle("current", Number(cell.dataset.n) === page);
    if (side === "pages") cells[page - 1]?.scrollIntoView({ block: "nearest" });
    let current = null; // the last entry of the contents at or before this page
    for (const row of tocEl.children) {
      row.classList.remove("current");
      if (Number(row.dataset.page) <= page) current = row;
    }
    current?.classList.add("current");
    if (side === "toc") current?.scrollIntoView({ block: "nearest" });
  }

  // ----- the pages: all of them in a column (continuous) or just the one being read -----
  const wrappers = new Map(); // page number -> its box
  const images = new Map(); // page number -> promise of { url, ... } from the decoder, for the pages that are showing
  const zonesOf = new Map(); // page number -> promise of the text zones, for highlighting

  function release(n) {
    const held = images.get(n);
    if (!held) return;
    images.delete(n);
    void held.then((info) => info && worker.revokeObjectURL(info.url));
  }

  async function fillPage(n) {
    const box = wrappers.get(n);
    if (!box || box.dataset.state) return;
    box.dataset.state = "loading";
    const wanted = () => wrappers.get(n) === box && box.dataset.near === "1";
    let info;
    try {
      for (let attempt = 0; attempt < 2 && !info && wanted(); attempt++) {
        if (!images.has(n)) images.set(n, schedule("high", () => worker.doc.getPage(n).createPngObjectUrl().run(), wanted));
        info = await images.get(n);
        if (!info) images.delete(n); // the request was dropped (it was not wanted then): ask again if it is wanted now
      }
    } catch (err) {
      images.delete(n);
      box.dataset.state = "";
      if (!destroyed) context.onError(w.error, err instanceof Error ? err.message : String(err));
      return;
    }
    if (!info || !wanted()) {
      release(n); // it was asked for and then scrolled away from
      if (wrappers.get(n) === box) box.dataset.state = "";
      return;
    }
    const img = new Image();
    img.alt = "";
    img.draggable = false;
    img.src = info.url;
    await img.decode().catch(() => {});
    if (!wanted()) return void (release(n), (box.dataset.state = ""));
    if (img.naturalWidth) {
      box.dataset.ratio = String(img.naturalHeight / img.naturalWidth);
      sizeBox(n);
    }
    box.querySelector("img")?.remove();
    box.prepend(img);
    box.dataset.state = "ready";
    void paintHits(n);
  }

  function unloadPage(n) {
    const box = wrappers.get(n);
    if (!box) return;
    box.querySelector("img")?.remove();
    if (box.dataset.state === "ready") box.dataset.state = "";
    release(n);
  }

  function sizeBox(n) {
    const box = wrappers.get(n);
    if (!box) return;
    const width = Math.round(fitWidth() * zoom);
    box.style.width = `${width}px`;
    box.style.height = `${Math.round(width * ratioOf(n))}px`;
  }
  function layout() {
    for (const n of wrappers.keys()) sizeBox(n);
  }

  function buildPages() {
    pageObserver?.disconnect();
    wrappers.clear();
    const list = mode === "continuous" ? Array.from({ length: pages }, (_, i) => i + 1) : [page];
    const boxes = list.map((n) => {
      const box = document.createElement("div");
      box.className = "pg";
      box.dataset.n = String(n);
      box.dataset.near = mode === "single" ? "1" : "";
      const hl = document.createElement("div");
      hl.className = "hl";
      box.append(hl);
      wrappers.set(n, box);
      sizeBox(n);
      return box;
    });
    pagesEl.replaceChildren(...boxes);
    if (mode === "single") {
      void fillPage(page);
      return;
    }
    pageObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const n = Number(e.target.dataset.n);
          e.target.dataset.near = e.isIntersecting ? "1" : "";
          if (e.isIntersecting) void fillPage(n);
          else unloadPage(n);
        }
      },
      { root: stage, rootMargin: "100% 0px" },
    );
    for (const box of boxes) pageObserver.observe(box);
  }

  /** Where in the scrolling column the top of page n is. */
  const topOf = (n) => {
    const box = wrappers.get(n);
    return box ? box.getBoundingClientRect().top - stage.getBoundingClientRect().top + stage.scrollTop : 0;
  };

  let quietUntil = 0; // a scroll the reader asked for is not the reader moving on
  function scrollToPage(n, extra = 0) {
    quietUntil = performance.now() + 400;
    stage.scrollTop = mode === "continuous" ? Math.max(0, topOf(n) - 12 + extra) : 0;
  }

  /** In the continuous column, the page a third of the way down the window is the one being read. */
  function pageInView() {
    const line = stage.scrollTop + stage.clientHeight * 0.3;
    let lo = 1;
    let hi = pages;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (topOf(mid) <= line) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }

  let scrollFrame = 0;
  stage.addEventListener("scroll", () => {
    if (mode !== "continuous" || performance.now() < quietUntil || scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      const now = pageInView();
      if (now !== page) {
        page = now;
        sync();
        report();
      }
    });
  });

  function sync() {
    input.value = String(page);
    prev.disabled = page <= 1;
    next.disabled = page >= pages;
    syncSide();
  }

  /** The place and the choices that go into a bookmark or a link; what has its usual value is left out. */
  const view = () => ({ page, zoom: Math.round(zoom * 100) / 100, ...(mode === "single" ? { mode } : {}), ...(side ? { side } : {}) });
  function report() {
    clearTimeout(timer);
    timer = setTimeout(() => context.onView(view()), 250);
  }

  function go(n, extra = 0) {
    const target = Math.min(pages, Math.max(1, Math.round(n)));
    if (!(target >= 1)) return void (input.value = String(page));
    const changed = target !== page;
    page = target;
    if (mode === "single") {
      if (changed || !wrappers.has(page)) {
        buildPages();
        for (const key of [...images.keys()]) if (Math.abs(key - page) > 1) release(key);
        if (page < pages) void prefetch(page + 1);
      }
      scrollToPage(page);
    } else {
      scrollToPage(page, extra);
    }
    sync();
    if (changed) report();
  }

  /** The next page is decoded before it is asked for (one at a time mode). */
  async function prefetch(n) {
    if (images.has(n) || destroyed) return;
    images.set(n, schedule("high", () => worker.doc.getPage(n).createPngObjectUrl().run(), () => mode === "single" && Math.abs(page - n) <= 1));
  }

  function setZoom(value) {
    const before = mode === "continuous" ? { n: page, shift: (stage.scrollTop - topOf(page)) / (wrappers.get(page)?.offsetHeight || 1) } : null;
    zoom = Math.min(8, Math.max(0.25, value));
    layout();
    if (before) {
      quietUntil = performance.now() + 400;
      stage.scrollTop = Math.max(0, topOf(before.n) + before.shift * (wrappers.get(before.n)?.offsetHeight || 0));
    }
    report();
  }

  function setMode(next) {
    mode = next;
    report();
    for (const n of [...images.keys()]) release(n);
    modeButton.textContent = mode === "continuous" ? "☷" : "▯";
    const title = mode === "continuous" ? w.single : w.continuous; // what the button does next
    modeButton.title = title;
    modeButton.setAttribute("aria-label", title);
    buildPages();
    sync();
    if (mode === "continuous") scrollToPage(page);
  }

  // ----- search in the text of the pages -----
  const texts = []; // folded text of each page, once read
  let reading = null; // the promise of reading them all
  let readCount = 0;
  let needle = ""; // the query as compared
  let matches = []; // [{ page, nth }] in book order
  let current = -1;

  function readAllText() {
    reading ??= (async () => {
      for (let n = 1; n <= pages && !destroyed; n++) {
        try {
          texts[n] = fold(await schedule("low", () => worker.doc.getPage(n).getText().run()));
        } catch {
          texts[n] = "";
        }
        readCount = n;
        if (needle && n % 5 === 0) status.textContent = fill(w.reading, { n, total: pages });
      }
    })();
    return reading;
  }

  function zonesFor(n) {
    if (!zonesOf.has(n)) zonesOf.set(n, schedule("high", () => worker.doc.getPage(n).getNormalizedTextZones().run()).catch(() => null));
    return zonesOf.get(n);
  }

  /**
   * Where the query is on page n, in page pixels from its top left corner. The text layer is in lines (or
   * pieces of lines), and the corner of a zone is its bottom left one, so a word is placed by its share of
   * the zone's text. Words split over two lines are found by their parts when the whole phrase is not on one.
   */
  async function hitRects(n) {
    const zones = await zonesFor(n);
    if (!zones) return [];
    const size = sizes[n - 1];
    if (!size) return [];
    const lower = (text) => String(text).toLowerCase().replace(/ё/g, "е");
    const within = (terms) =>
      zones.flatMap((z) => {
        const text = lower(z.text);
        return terms.flatMap((term) => {
          const found = [];
          for (let at = text.indexOf(term); at >= 0; at = text.indexOf(term, at + term.length)) {
            found.push({ x: z.x + (z.width * at) / text.length, y: size.height - z.y - z.height, w: (z.width * term.length) / text.length, h: z.height });
          }
          return found;
        });
      });
    const whole = within([needle]);
    if (whole.length || !needle.includes(" ")) return whole;
    return within(needle.split(" ").filter((t) => t.length >= 3));
  }

  /** Marks the found words on page n, if it is showing; the word of the current match stands out. */
  async function paintHits(n) {
    const box = wrappers.get(n);
    const hl = box?.querySelector(".hl");
    if (!hl) return;
    const here = needle ? matches.filter((m) => m.page === n) : [];
    if (!here.length) return void hl.replaceChildren();
    const rects = await hitRects(n);
    if (wrappers.get(n) !== box) return;
    const size = sizes[n - 1] ?? { width: 1, height: 1 };
    const nowNth = current >= 0 && matches[current]?.page === n ? matches[current].nth : -1;
    hl.replaceChildren(
      ...rects.map((r, i) => {
        const hit = document.createElement("div");
        hit.className = i === nowNth ? "hit now" : "hit";
        hit.style.cssText = `left:${(r.x / size.width) * 100}%;top:${(r.y / size.height) * 100}%;width:${(r.w / size.width) * 100}%;height:${(r.h / size.height) * 100}%`;
        return hit;
      }),
    );
  }

  const repaintAll = () => {
    for (const n of wrappers.keys()) if (wrappers.get(n)?.dataset.state === "ready" || wrappers.get(n)?.querySelector(".hit")) void paintHits(n);
  };

  async function runSearch() {
    const text = fold(query.value).trim();
    needle = text;
    matches = [];
    current = -1;
    if (!text) {
      status.textContent = "";
      return void repaintAll();
    }
    status.textContent = fill(w.reading, { n: readCount, total: pages });
    await readAllText();
    if (destroyed || needle !== text) return; // the query changed while the text was being read
    if (texts.every((t) => !t)) {
      status.textContent = w.noText;
      return;
    }
    for (let n = 1; n <= pages && matches.length < 5000; n++) {
      const t = texts[n] ?? "";
      let nth = 0;
      for (let at = t.indexOf(text); at >= 0; at = t.indexOf(text, at + text.length)) matches.push({ page: n, nth: nth++ });
    }
    if (!matches.length) {
      status.textContent = w.noMatches;
      return void repaintAll();
    }
    // begin with the first match at or after the page being read
    showMatch(Math.max(0, matches.findIndex((m) => m.page >= page)));
  }

  async function showMatch(i) {
    current = i;
    const m = matches[i];
    status.textContent = fill(w.matches, { n: i + 1, total: matches.length });
    go(m.page);
    repaintAll();
    // bring the word itself into view
    const rects = await hitRects(m.page);
    if (destroyed || current !== i) return;
    const rect = rects[Math.min(m.nth, rects.length - 1)];
    const box = wrappers.get(m.page);
    if (!rect || !box) return;
    const size = sizes[m.page - 1] ?? { width: 1, height: 1 };
    const y = (rect.y / size.height) * box.offsetHeight;
    if (mode === "continuous") scrollToPage(m.page, Math.max(0, y - stage.clientHeight / 3));
    else stage.scrollTop = Math.max(0, y - stage.clientHeight / 3);
  }

  function stepMatch(delta) {
    if (!matches.length) return void runSearch();
    showMatch((current + delta + matches.length) % matches.length);
  }

  function toggleSearch(open = find.hidden) {
    find.hidden = !open;
    searchButton.classList.toggle("on", open);
    if (open) {
      query.focus();
      query.select();
      void readAllText(); // reading the text begins at once, so the first search is quick
    } else {
      needle = "";
      matches = [];
      current = -1;
      status.textContent = "";
      repaintAll();
      stage.focus();
    }
  }
  let typing;
  query.addEventListener("input", () => {
    clearTimeout(typing);
    typing = setTimeout(() => void runSearch(), 350);
  });
  query.addEventListener("keydown", (event) => {
    event.stopPropagation();
    if (event.key === "Enter") {
      event.preventDefault();
      clearTimeout(typing);
      if (fold(query.value).trim() === needle && matches.length) stepMatch(event.shiftKey ? -1 : 1);
      else void runSearch();
    } else if (event.key === "Escape") toggleSearch(false);
  });

  // ----- keys, wheel, drag -----
  input.addEventListener("keydown", (event) => {
    event.stopPropagation();
    if (event.key === "Enter") go(Number(input.value));
  });
  input.addEventListener("change", () => go(Number(input.value)));
  stage.addEventListener("keydown", (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const atBottom = stage.scrollTop + stage.clientHeight >= stage.scrollHeight - 2;
    const atTop = stage.scrollTop <= 0;
    if (mode === "single" && (event.key === "ArrowRight" || event.key === "PageDown" || (event.key === " " && !event.shiftKey && atBottom))) go(page + 1);
    else if (mode === "single" && (event.key === "ArrowLeft" || event.key === "PageUp" || (event.key === " " && event.shiftKey && atTop))) go(page - 1);
    else if (event.key === "Home") go(1);
    else if (event.key === "End") go(pages);
    else if (event.key === "+" || event.key === "=") setZoom(zoom * 1.25);
    else if (event.key === "-") setZoom(zoom / 1.25);
    else return;
    event.preventDefault();
  });
  stage.addEventListener("wheel", (event) => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    setZoom(zoom * (event.deltaY < 0 ? 1.1 : 1 / 1.1));
  }, { passive: false });

  // drag the page to scroll it
  let drag = null;
  stage.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || event.pointerType === "touch") return;
    drag = { x: event.clientX, y: event.clientY, left: stage.scrollLeft, top: stage.scrollTop };
    stage.setPointerCapture(event.pointerId);
    stage.classList.add("dragging");
  });
  stage.addEventListener("pointermove", (event) => {
    if (!drag) return;
    stage.scrollLeft = drag.left - (event.clientX - drag.x);
    stage.scrollTop = drag.top - (event.clientY - drag.y);
  });
  const drop = () => {
    drag = null;
    stage.classList.remove("dragging");
  };
  stage.addEventListener("pointerup", drop);
  stage.addEventListener("pointercancel", drop);

  const resize = new ResizeObserver(() => {
    layout();
  });
  resize.observe(stage);

  setSide(side);
  setMode(mode);
  go(page);

  return {
    destroy: () => (resize.disconnect(), destroy()),
    getView: view,
    getLabel: () => fill(w.label, { n: page }),
  };
}
