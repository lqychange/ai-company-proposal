(function () {
  var body = document.body;
  var page = body.getAttribute("data-page") || "page";
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  // 移动端目录抽屉
  var menu = document.querySelector(".menu-btn");
  if (menu) {
    menu.addEventListener("click", function () {
      var open = body.classList.toggle("nav-open");
      menu.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", function (e) {
      if (body.classList.contains("nav-open") && !e.target.closest(".sidebar") && !e.target.closest(".menu-btn")) {
        body.classList.remove("nav-open");
        menu.setAttribute("aria-expanded", "false");
      }
    });
  }

  // 深浅色切换
  var themeBtn = document.querySelector(".theme-btn");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var cur = document.documentElement.dataset.theme;
      if (!cur) cur = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      var next = cur === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      store("theme", next);
    });
  }

  // 任务清单：可勾选，并记在本浏览器里
  var boxes = document.querySelectorAll("article li > input[type=checkbox]");
  boxes.forEach(function (box, i) {
    var li = box.parentElement;
    li.classList.add("task");
    // 把复选框后面的内容包起来，方便划线
    var span = document.createElement("span");
    span.className = "task-text";
    while (box.nextSibling) span.appendChild(box.nextSibling);
    li.appendChild(span);
    box.disabled = false;
    var key = "chk:" + page + ":" + i;
    if (store(key) === "1") { box.checked = true; li.classList.add("done"); }
    box.addEventListener("change", function () {
      li.classList.toggle("done", box.checked);
      store(key, box.checked ? "1" : "0");
    });
  });

  // 表格：给每个单元格记下列名，窄屏时可以堆叠显示
  document.querySelectorAll("article table").forEach(function (t) {
    var heads = Array.prototype.map.call(t.querySelectorAll("thead th"), function (th) { return th.textContent.trim(); });
    if (heads.length < 3) return;
    t.classList.add("stackable");
    t.querySelectorAll("tbody tr").forEach(function (tr) {
      Array.prototype.forEach.call(tr.children, function (td, i) { if (heads[i]) td.setAttribute("data-label", heads[i]); });
    });
  });

  // 打印按钮
  document.querySelectorAll("[data-print]").forEach(function (b) {
    b.addEventListener("click", function () { window.print(); });
  });

  // 本页目录高亮
  var links = Array.prototype.slice.call(document.querySelectorAll(".toc a"));
  if (links.length && "IntersectionObserver" in window) {
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (a) { a.classList.remove("active"); });
          var a = map[en.target.id];
          if (a) a.classList.add("active");
        }
      });
    }, { rootMargin: "-70px 0px -70% 0px" });
    document.querySelectorAll("article h2[id]").forEach(function (h) { obs.observe(h); });
  }

  // Mermaid 图
  if (window.mermaid) {
    window.mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "default", flowchart: { htmlLabels: true }, fontFamily: getComputedStyle(body).fontFamily });
    window.mermaid.run({ querySelector: "pre.mermaid" }).then(addZoom).catch(function (e) { console.warn("mermaid", e); addZoom(); });
  }

  // 图太大时可以放大查看（原始尺寸，可滚动）
  function addZoom() {
    document.querySelectorAll(".diagram").forEach(function (d) {
      var svg = d.querySelector("svg");
      if (!svg || d.querySelector(".zoom-btn")) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "zoom-btn";
      btn.textContent = "⤢ 放大查看";
      btn.addEventListener("click", function () { openZoom(svg); });
      d.appendChild(btn);
      svg.style.cursor = "zoom-in";
      svg.addEventListener("click", function () { openZoom(svg); });
    });
  }
  function openZoom(svg) {
    var ov = document.createElement("div");
    ov.className = "zoom-overlay";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-label", "放大的图");
    var close = document.createElement("button");
    close.type = "button";
    close.className = "zoom-close";
    close.textContent = "✕ 关闭";
    var inner = document.createElement("div");
    inner.className = "zoom-inner";
    var clone = svg.cloneNode(true);
    var natural = parseFloat((svg.style.maxWidth || "").replace("px", "")) || svg.getBoundingClientRect().width * 2;
    clone.style.maxWidth = "none";
    clone.style.width = Math.max(natural, 900) + "px";
    clone.style.height = "auto";
    clone.style.cursor = "default";
    inner.appendChild(clone);
    ov.appendChild(close);
    ov.appendChild(inner);
    document.body.appendChild(ov);
    document.body.style.overflow = "hidden";
    function done() { ov.remove(); document.body.style.overflow = ""; document.removeEventListener("keydown", onKey); }
    function onKey(e) { if (e.key === "Escape") done(); }
    close.addEventListener("click", done);
    document.addEventListener("keydown", onKey);
    close.focus();
  }
})();
