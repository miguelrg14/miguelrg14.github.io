// Keeps one document alive while swapping pages, so the audio element never
// stops. On file:// a generated script holds the other pages (fetch is blocked)
// and navigation uses a hash so the document is not reloaded.
(() => {
  const routerScript = document.currentScript;
  const version = new URL(routerScript?.src || location.href).searchParams.get("v");
  const withVersion = (path) => `${path}${version ? `?v=${version}` : ""}`;
  const mainSrc = routerScript?.src.replace("router.js", "main.js") || withVersion("js/main.js");

  const loadScript = (src) => new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = resolve;
    document.head.appendChild(script);
  });

  // The inline boot script hides <main> before first paint. Reveal it only
  // after main.js has rendered the cards, so no empty or wrong page is seen.
  function revealPage() {
    clearTimeout(window.__routeBootTimer);
    window.__routeBootTimer = null;
    document.documentElement.classList.remove("route-booting");
  }
  window.__routeReveal = revealPage;

  const loadMain = () => {
    const script = document.createElement("script");
    script.src = mainSrc;
    script.onload = revealPage;
    script.onerror = revealPage;
    document.body.appendChild(script);
  };

  const isFile = location.protocol === "file:";
  const initialRoot = document.documentElement.dataset.root || "";
  const siteRoot = new URL(
    initialRoot === "../" ? ".." : initialRoot === "/" ? "/" : ".",
    location.href
  );
  window.__siteBase = siteRoot.href;

  const pages = [
    { key: "home", url: "index.html", root: "", zone: "" },
    { key: "games", url: "games/index.html", root: "../", zone: "game" },
    { key: "code", url: "code/index.html", root: "../", zone: "code" },
    { key: "art", url: "art/index.html", root: "../", zone: "art" },
    { key: "music", url: "music/index.html", root: "../", zone: "audio" },
    { key: "contact", url: "contact/index.html", root: "../", zone: "" },
    { key: "share", url: "share/index.html", root: "../", zone: "" }
  ].map((page) => ({ ...page, path: new URL(page.url, siteRoot).pathname }));

  // Both /index.html and the directory URL are the same page.
  const pageFor = (pathname) => pages.find((page) =>
    page.path === pathname || page.path.replace(/index\.html$/, "") === pathname);

  const pageFromHash = () => {
    if (!location.hash) return null;
    const raw = location.hash.replace(/^#\/?/, "");
    const path = raw.split("?")[0].replace(/\/$/, "");
    // "#/" is Home: without this, a reload falls back to the opened file
    // (e.g. music/index.html) instead of the page the reader was seeing.
    if (!path) return pages.find((page) => page.key === "home");
    return pages.find((page) =>
      page.url === path || page.url.replace(/index\.html$/, "").replace(/\/$/, "") === path);
  };

  const pageFromLocation = () => (isFile ? pageFromHash() || pageFor(location.pathname) : pageFor(location.pathname));
  const routeHash = (page, url) => {
    const folder = page.url.replace(/index\.html$/, "").replace(/\/$/, "");
    return `#/${folder ? `${folder}/` : ""}${url.search || ""}${url.hash || ""}`;
  };

  const urlPage = pageFor(location.pathname);
  // The served file, not the URL, owns the main currently in the document.
  // This matters when file:// keeps one file alive and when a host rewrites
  // pretty URLs to a different HTML file.
  const servedPage = pages.find((page) => page.key === document.documentElement.dataset.page) || urlPage;
  const currentKey = servedPage?.key || "home";
  let activeKey = currentKey;
  const routePages = {};
  // Links clicked before the preload finishes wait here instead of reloading.
  let markReady;
  const ready = new Promise((resolve) => { markReady = resolve; });
  let ignoreHash = false;

  const attrs = ["src", "href", "poster"];
  const external = /^(https?:|mailto:|tel:|#|data:|javascript:|\/\/)/i;

  // Store each local URL relative to the site root, so it can be rebased
  // whenever a different page becomes visible.
  const normaliseMain = (main, fromRoot) => {
    main.querySelectorAll("[src],[href],[poster]").forEach((el) => {
      attrs.forEach((attr) => {
        const value = el.getAttribute(attr);
        if (!value || external.test(value)) return;
        let sitePath = null;
        if (fromRoot === "../") {
          if (value.startsWith("../")) sitePath = value.slice(3);
        } else if (!value.startsWith("../") && !value.startsWith("/")) {
          sitePath = value;
        }
        if (sitePath !== null) el.dataset[`site${attr[0].toUpperCase()}${attr.slice(1)}`] = sitePath;
      });
    });
  };

  const applyRoot = (main, root) => {
    main.querySelectorAll("[data-site-src],[data-site-href],[data-site-poster]").forEach((el) => {
      attrs.forEach((attr) => {
        const key = `site${attr[0].toUpperCase()}${attr.slice(1)}`;
        const sitePath = el.dataset[key];
        if (sitePath === undefined) return;
        el.setAttribute(attr, root === "/" ? `/${sitePath}` : `${root}${sitePath}`);
      });
    });
  };

  const fetchPage = async (page) => {
    const response = await fetch(new URL(page.url, siteRoot).href, { credentials: "same-origin" });
    if (!response.ok) throw new Error(`No se pudo cargar ${page.url}`);
    const doc = new DOMParser().parseFromString(await response.text(), "text/html");
    const main = doc.querySelector("main");
    if (!main) throw new Error(`Sin main en ${page.url}`);
    normaliseMain(main, page.root);
    const meta = [...doc.head.querySelectorAll("meta, link[rel='canonical']")]
      .filter((el) => el.matches("meta[property^='og:'], meta[name='description'], meta[name='theme-color'], link[rel='canonical']"))
      .map((el) => el.outerHTML);
    return { page, main, meta, title: doc.title };
  };

  // The served file keeps its own nav highlighted until the router applies the
  // route from the hash (file://) or pathname. Do that immediately, before the
  // preload, so a reload never flashes the opened file's page as current.
  const markNav = (page) => {
    if (!page) return;
    document.querySelectorAll(".site-header a:not(.brand), .site-footer a").forEach((link) => {
      const isCurrent = new URL(link.href, location.href).pathname === page.path;
      if (isCurrent) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  };

  const activate = (page) => {
    const main = routePages[page.key];
    if (!main) return false;
    activeKey = page.key;
    Object.values(routePages).forEach((el) => {
      el.hidden = el !== main;
      el.classList.remove("route-pending");
      el.removeAttribute("id");
      el.setAttribute("aria-hidden", String(el !== main));
    });
    main.hidden = false;
    main.id = "main";
    main.setAttribute("aria-hidden", "false");
    // In file:// the document URL never changes (only the hash does), so every
    // local URL must stay relative to the file that was opened, not to the page
    // being shown. Otherwise Home images 404 and the brand link goes up a folder.
    applyRoot(document.body, isFile ? initialRoot : page.root);

    document.documentElement.dataset.root = page.root;
    document.body.classList.toggle("home", page.key === "home");
    if (page.zone) document.body.dataset.zone = page.zone;
    else document.body.removeAttribute("data-zone");

    document.title = page.title || document.title;
    document.querySelectorAll("meta[property^='og:'], meta[name='description'], meta[name='theme-color'], link[rel='canonical']")
      .forEach((el) => el.remove());
    document.head.insertAdjacentHTML("beforeend", (page.meta || []).join(""));

    markNav(page);

    document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
    window.scrollTo(0, 0);
    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new CustomEvent("routechange", { detail: { page: page.key } }));
    return true;
  };

  const go = (page, url, push) => {
    if (!routePages[page.key]) return false;
    // Change the address first: routechange listeners read ?open= from it.
    if (push) {
      if (isFile) {
        const hash = routeHash(page, url);
        if (location.hash !== hash) {
          ignoreHash = true;
          location.hash = hash;
        }
      } else {
        history.pushState({ route: page.key }, "", url.pathname + url.search + url.hash);
      }
    }
    return activate(page);
  };

  const ensureData = async () => {
    const dataFiles = [
      { path: "data/project-media.js", ready: () => !!window.PROJECT_MEDIA },
      { path: "data/projects.js", ready: () => !!window.PROJECTS && !!window.PROJECT_GROUPS },
      { path: "data/audio.js", ready: () => !!window.AUDIO_GROUPS && !!window.AUDIO_ITEMS },
      { path: "data/thumbs.js", ready: () => !!window.THUMBS }
    ];
    await Promise.all(dataFiles.filter((file) => !file.ready())
      .map((file) => loadScript(new URL(withVersion(file.path), siteRoot).href)));
  };

  const bundlePages = () => pages.filter((page) => page.key !== currentKey).map((page) => {
    const saved = window.SITE_PAGES?.[page.key];
    if (!saved?.html) return { status: "rejected" };
    const doc = new DOMParser().parseFromString(`<main id="main">${saved.html}</main>`, "text/html");
    const main = doc.querySelector("main");
    normaliseMain(main, page.root);
    return { status: "fulfilled", value: { page, main, meta: saved.meta || [], title: saved.title || "" } };
  });

  const setup = async () => {
    // Fix the nav before any awaiting work: in file:// the hash may point to a
    // different page than the file the browser just loaded.
    const initial = pageFromLocation();
    markNav(initial || servedPage);
    const activeMain = document.querySelector("main");
    if (!activeMain || (!isFile && !servedPage)) {
      loadMain();
      markReady();
      return;
    }

    const container = document.createElement("div");
    container.id = "route-pages";
    activeMain.before(container);
    container.appendChild(activeMain);
    // Header and footer links live outside <main>; rebase them too.
    document.querySelectorAll(".site-header, .site-footer").forEach((el) => normaliseMain(el, initialRoot));
    normaliseMain(activeMain, initialRoot);
    activeMain.classList.add("route-page");
    activeMain.setAttribute("aria-hidden", "false");
    routePages[currentKey] = activeMain;

    applyRoot(document.body, initialRoot);
    // Hide the served page at once when the URL asks for another one, so the
    // reader never sees a flash of a page they did not request.
    if (initial && initial.key !== currentKey) activeMain.classList.add("route-pending");

    // Install navigation immediately: an early click waits for the preload
    // instead of forcing a full reload (and restarting the song).
    document.addEventListener("click", async (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest("a[href]");
      if (!link || link.target || link.hasAttribute("download")) return;
      const url = new URL(link.href, location.href);
      if (location.protocol === "file:" ? url.protocol !== "file:" : url.origin !== location.origin) return;
      if (!/\.html?$/.test(url.pathname)) return;
      const sameUrl = url.pathname === location.pathname && url.search === location.search && !url.hash;
      const page = pageFor(url.pathname);
      if (!page) return;
      event.preventDefault();
      await ready;
      // On http(s) a link to the current URL scrolls to top without reloading.
      // On file:// the visible page lives in the hash, so it still needs routing.
      if (sameUrl && !isFile) {
        activate(page);
        return;
      }
      if (!go(page, url, true)) location.assign(url.href);
    });

    const onHistoryChange = async () => {
      if (ignoreHash) {
        ignoreHash = false;
        return;
      }
      await ready;
      const page = pageFromLocation();
      if (!page || !activate(page)) location.reload();
    };
    if (isFile) window.addEventListener("hashchange", onHistoryChange);
    else window.addEventListener("popstate", onHistoryChange);

    await ensureData();
    // In file:// the bundle is written during parsing, so it is already here.
    if (isFile && !window.SITE_PAGES) await loadScript(new URL(withVersion("js/pages.js"), siteRoot).href);
    const results = isFile
      ? bundlePages()
      : await Promise.allSettled(pages.filter((page) => page.key !== currentKey).map(fetchPage));

    results.forEach((result) => {
      if (result.status !== "fulfilled") return;
      const { page, main, meta, title } = result.value;
      main.classList.add("route-page");
      main.hidden = true;
      main.setAttribute("aria-hidden", "true");
      container.appendChild(main);
      routePages[page.key] = main;
      Object.assign(page, { meta, title });
    });

    // Fetched pages arrive after the first rebase, so rebase them too.
    applyRoot(document.body, initialRoot);

    const home = pages.find((page) => page.key === "home");
    Object.assign(home, { title: home.title || document.title });
    if (initial && initial.key !== activeKey && !activate(initial)) {
      activeMain.classList.remove("route-pending");
    }
    loadMain();
    markReady();
  };

  setup();
})();
