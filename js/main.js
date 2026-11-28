// Renders the projects from data/projects.js and the README images from
// data/project-media.js, plays card previews on hover, filters the Code page
// and opens the Art lightbox and the project details dialog.

const root = document.documentElement.dataset.root || "";
// All generated URLs are absolute against the site root, so they keep working
// when the router swaps the visible page without reloading the document.
const siteBase = new URL(window.__siteBase || root || ".", location.href);

// Compact header: a menu button replaces the inline nav on very small screens.
const siteHeader = document.querySelector(".site-header");
const siteNav = document.querySelector(".site-nav");
if (siteHeader && siteNav) {
    siteNav.id = "site-menu";
    const navToggle = document.createElement("button");
    navToggle.type = "button";
    navToggle.className = "nav-toggle";
    navToggle.setAttribute("aria-label", "Open menu");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-controls", "site-menu");
    navToggle.innerHTML = "<span></span><span></span><span></span>";
    siteHeader.querySelector(".bar")?.append(navToggle);

    const setMenu = (open) => {
        siteHeader.classList.toggle("nav-open", open);
        navToggle.setAttribute("aria-expanded", String(open));
        navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    navToggle.addEventListener("click", () => {
        const open = !siteHeader.classList.contains("nav-open");
        setMenu(open);
        if (open) siteNav.querySelector("a")?.focus({ preventScroll: true });
    });
    siteNav.addEventListener("click", (event) => {
        if (event.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && siteHeader.classList.contains("nav-open")) {
            setMenu(false);
            navToggle.focus({ preventScroll: true });
        }
    });
    document.addEventListener("click", (event) => {
        if (siteHeader.classList.contains("nav-open") && !siteHeader.contains(event.target)) setMenu(false);
    });
    window.matchMedia("(min-width: 36.51rem)").addEventListener("change", (event) => {
        if (event.matches) setMenu(false);
    });
}

// A quiet back-to-top control, shown only after the reader has moved down.
const toTop = document.createElement("button");
toTop.type = "button";
toTop.className = "to-top";
toTop.setAttribute("aria-label", "Back to top");
toTop.innerHTML = `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 4 12h5v8h6v-8h5z"/></svg>`;
document.body.appendChild(toTop);
toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

// Discoverable shortcuts: a small header button, plus "?" when not typing.
// Built here so the same control appears on every routed page without editing
// eight separate HTML files.
const helpButton = document.createElement("button");
helpButton.type = "button";
helpButton.className = "header-help";
helpButton.textContent = "?";
helpButton.title = "Keyboard shortcuts (?)";
helpButton.setAttribute("aria-label", "Keyboard shortcuts");
helpButton.setAttribute("aria-haspopup", "dialog");
document.querySelector(".bar-actions")?.prepend(helpButton);
// On the narrowest screens Contact becomes icon-only, so keep its name.
const headerContact = document.querySelector(".bar-actions .button.small");
if (headerContact && !headerContact.hasAttribute("aria-label")) headerContact.setAttribute("aria-label", "Contact");

const helpDialog = document.createElement("dialog");
helpDialog.className = "help-dialog";
helpDialog.setAttribute("aria-labelledby", "help-title");
helpDialog.innerHTML = `
    <div class="help-content">
        <div class="help-head">
            <h2 id="help-title">Keyboard shortcuts</h2>
            <button type="button" class="help-close" aria-label="Close">×</button>
        </div>
        <dl class="help-list">
            <div><dt>← / →</dt><dd>Previous or next item in a project or image sheet</dd></div>
            <div><dt>Home / End</dt><dd>First or last filter option</dd></div>
            <div><dt>C</dt><dd>Copy the link to the open project</dd></div>
            <div><dt>Ctrl / ⌘ + Z</dt><dd>Undo the last filter change</dd></div>
            <div><dt>Esc</dt><dd>Close a sheet, the help or the small-screen menu</dd></div>
            <div><dt>?</dt><dd>Open this help</dd></div>
        </dl>
    </div>`;
document.body.appendChild(helpDialog);
helpButton.addEventListener("click", () => helpDialog.showModal());
helpDialog.querySelector(".help-close")?.addEventListener("click", () => helpDialog.close());
helpDialog.addEventListener("click", (event) => {
    if (event.target === helpDialog) helpDialog.close();
});
document.addEventListener("keydown", (event) => {
    if (event.key !== "?" || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target instanceof Element && event.target.closest("input, textarea, [contenteditable], dialog[open]")) return;
    event.preventDefault();
    helpDialog.showModal();
});

// Header shadow and a 2px scroll-progress line share one passive scroll pass.
const syncScrollUI = () => {
    siteHeader?.classList.toggle("is-scrolled", window.scrollY > 8);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    document.documentElement.style.setProperty("--scroll-progress", progress.toFixed(4));
    toTop.classList.toggle("is-visible", window.scrollY > Math.min(480, Math.max(80, max * 0.35)));
};
syncScrollUI();
window.addEventListener("scroll", syncScrollUI, { passive: true });
window.addEventListener("resize", syncScrollUI);

const esc = (text) =>
    String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// The whole grid fades in once on load: no per-card delay, no movement,
// and never again when a filter is clicked.
function enterCards(scope) {
    const containers = scope === document
        ? [...document.querySelectorAll("[data-featured], [data-code], [data-games], [data-audio], [data-group-filter]")]
        : [scope];
    containers.forEach((el) => {
        if (!el?.animate) return;
        el.dataset.fadeBound = "1";
        el.addEventListener("animationend", (event) => {
            if (event.target === el && event.animationName === "gridEnter") el.classList.remove("is-entering");
        });
        el.classList.add("is-entering");
    });
}

const asset = (path) => (/^https?:/.test(path) ? path : new URL(path, siteBase).href);
const thumbOf = (path) => (window.THUMBS && window.THUMBS[path.replace(/^\.\.\//, "")]) || null;

// A track can open its own page and detail sheet from the player.
const itemPage = (item) => {
    const folder = item.isAudio || item.kind === "audio" ? "music"
        : item.kind === "game" ? "games"
        : item.kind === "art" ? "art" : "code";
    const url = new URL(`${folder}/index.html`, siteBase);
    if (item.id) url.searchParams.set("open", item.id);
    return url.href;
};

const tagLabels = {
    "c#": "C#", "c++": "C++", "net": ".NET", "ai": "AI", "ui": "UI",
    "2d": "2D", "3d": "3D", "vfx": "VFX", "rpg": "RPG", "sql": "SQL",
    "djing": "DJing", "fl studio": "FL Studio", "webgl": "WebGL",
    "first-person": "First-person", "top-down": "Top-down",
    "wave shooter": "Wave shooter", "arcade shooter": "Arcade shooter",
    "dungeon crawler": "Dungeon crawler", "boss fights": "Boss fights",
    "pixel art": "Pixel art", "procedural mesh": "Procedural mesh",
    "board games": "Board games", "low poly": "Low poly", "opengl": "OpenGL"
};
const tagLabel = (tag) => tagLabels[tag] || tag.replace(/\b\w/g, (c) => c.toUpperCase());

// Tags describe the work, not the tools behind it. The first four Code headings
// match Toolbox sections; Games adds the tags of the games listed as a Code category.
const GAME_TAG_SECTIONS = [
    ["Genre", ["horror", "dungeon crawler", "wave shooter", "arcade shooter", "casual"]],
    ["View", ["first-person", "top-down", "2d", "3d"]],
    ["Features", ["zombies", "puzzle", "boss fights", "climbing", "pixel art"]],
    ["Platform", ["browser", "mobile"]]
];
const TAG_GROUP_SECTIONS = {
    code: [
        ["Visual", ["renderer", "shaders", "vfx", "procedural mesh"]],
        ["Systems", ["engine", "simulation", "ai", "multiplayer", "networking"]],
        ["Practice", ["tests", "web", "rpg", "board games", "chat", "sql"]],
        ["Tech", ["unity", "unreal", "c++", "c#", "net", "opengl"]],
        ["Games", GAME_TAG_SECTIONS.flatMap(([, tags]) => tags)]
    ],
    games: GAME_TAG_SECTIONS,
    art: [
        ["Subjects", ["character design", "environment", "zombies"]],
        ["Styles", ["illustration", "painting", "watercolour", "pixel art", "low poly"]],
        ["Views", ["isometric", "top-down", "3d"]],
        ["Themes", ["western", "fantasy"]]
    ],
    music: [
        ["Styles", ["ambient", "synthwave", "synth"]],
        ["Work", ["soundtrack", "sound effects", "sound design", "mixing", "djing"]],
        ["Themes", ["casual", "horror", "fantasy"]],
        ["Tools", ["fl studio", "plugins"]]
    ]
};
const allowedTags = (page) => (TAG_GROUP_SECTIONS[page] || []).flatMap(([, tags]) => tags);
// Each tag group gets its own quiet tint so the blocks are easy to scan.
const TAG_THEMES = ["sky", "mint", "amber", "lilac"];
function organizeTagFilters(panel, page) {
    if (!panel || panel.querySelector(".tag-group")) return;
    panel.classList.add("grouped-tags");
    const buttons = [...panel.querySelectorAll("button[data-tag]")]
        .filter((button) => button.dataset.tag && button.dataset.tag !== "all");
    if (!buttons.length) return;
    const sections = TAG_GROUP_SECTIONS[page] || [];
    const assigned = new Set(sections.flatMap(([, tags]) => tags));
    const present = new Set(buttons.map((button) => button.dataset.tag));
    const groups = sections
        .map(([title, tags]) => ({ title, tags: tags.filter((tag) => present.has(tag)) }))
        .filter((group) => group.tags.length);
    const leftovers = buttons.filter((button) => !assigned.has(button.dataset.tag)).map((button) => button.dataset.tag);
    if (leftovers.length) groups.push({ title: "Other", tags: leftovers });
    groups.forEach((group, index) => {
        const wrap = document.createElement("div");
        wrap.className = "tag-group";
        wrap.dataset.tagTheme = TAG_THEMES[index % TAG_THEMES.length];
        wrap.setAttribute("role", "group");
        const id = `tag-group-${page}-${group.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
        const heading = document.createElement("p");
        heading.className = "tag-group-title";
        heading.id = id;
        heading.textContent = group.title;
        wrap.setAttribute("aria-labelledby", id);
        wrap.appendChild(heading);
        group.node = wrap;
        group.tags.forEach((tag) => {
            const button = buttons.find((candidate) => candidate.dataset.tag === tag);
            if (button) wrap.appendChild(button);
        });
        panel.appendChild(wrap);
    });
}

// Both renderers get their tags from the items they show, so Code includes the games.
function buildTagFilters(panel, page, items, tagsOf) {
    if (!panel) return;
    const available = [...new Set(items.flatMap(tagsOf))];
    const allowed = allowedTags(page);
    const used = (allowed.length ? available.filter((tag) => allowed.includes(tag)) : available)
        .sort((a, b) => tagLabel(a).localeCompare(tagLabel(b)));
    panel.innerHTML = `<legend>Tags</legend>` + used.map((tag) =>
        `<button type="button" data-tag="${esc(tag)}" aria-pressed="false">${esc(tagLabel(tag))}</button>`).join("");
    panel.title = "Shows projects that match every selected tag";
    organizeTagFilters(panel, page);
}

function keepFilterPanelInView(menu) {
    const panel = menu?.querySelector(".filter-sheet") || menu?.querySelector(".filters");
    if (!panel) return;
    const shift = () => {
        panel.style.transform = "";
        if (!menu.open) return;
        const box = panel.getBoundingClientRect();
        const delta = box.left < 8 ? 8 - box.left : box.right > innerWidth - 8 ? innerWidth - 8 - box.right : 0;
        if (delta) panel.style.transform = `translateX(${delta}px)`;
    };
    menu.addEventListener("toggle", () => requestAnimationFrame(shift));
    window.addEventListener("resize", shift);
    // The wheel must always drive the panel while it can still scroll in that
    // direction, even over a chip, and never jump to the page behind it.
    panel.addEventListener("wheel", (event) => {
        const top = panel.scrollTop;
        const max = panel.scrollHeight - panel.clientHeight;
        const up = event.deltaY < 0 && top > 0;
        const down = event.deltaY > 0 && top < max;
        if (!up && !down) return;
        event.preventDefault();
        panel.scrollTop = Math.max(0, Math.min(max, top + event.deltaY));
    }, { passive: false });
}

// Opening one menu closes the other so both panels never overlap.
function linkFilterMenus() {
    const menus = [...document.querySelectorAll(".filter-bar .filter-menu")];
    menus.forEach((menu) => {
        menu.addEventListener("toggle", () => {
            if (!menu.open) return;
            menus.forEach((other) => { if (other !== menu) other.open = false; });
        });
        menu.addEventListener("keydown", (event) => {
            const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
            if (!keys.includes(event.key)) return;
            const buttons = [...menu.querySelectorAll(".filters button[data-group], .filters button[data-tag]")].filter((b) => b.getClientRects().length);
            const current = buttons.indexOf(document.activeElement);
            if (current < 0) return;
            event.preventDefault();
            let next = current;
            if (event.key === "Home") next = 0;
            else if (event.key === "End") next = buttons.length - 1;
            else if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (current + 1) % buttons.length;
            else next = (current - 1 + buttons.length) % buttons.length;
            buttons[next].focus();
        });
    });
}

// Disclosures behave like popovers: Escape and clicks outside dismiss them.
function wireFilterMenuDismiss() {
    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape" || document.querySelector("dialog[open]")) return;
        const menu = document.querySelector(".filter-menu[open]");
        if (!menu) return;
        menu.open = false;
        menu.querySelector("summary")?.focus();
    });
    document.addEventListener("click", (event) => {
        if (!(event.target instanceof Element) || event.target.closest(".filter-menu")) return;
        document.querySelectorAll(".filter-menu[open]").forEach((menu) => { menu.open = false; });
    });
}

// The count span is not part of the visible menu label.
const buttonLabel = (button) => button.firstChild?.textContent.trim() || button.textContent.trim();

// A status chip is neutral while it is not actually narrowing the shelf.
const IDLE_FILTER_LABELS = new Set(["All", "Grouped", "Toolbox"]);
function setFilterStatus(element, label) {
    if (!element) return;
    const text = label || "All";
    const idle = IDLE_FILTER_LABELS.has(text);
    element.textContent = text;
    element.title = text;
    element.dataset.idle = String(idle);
    // The open sheet shows the full value without widening the bar's summary.
    const panel = element.closest(".filter-menu")?.querySelector(".filter-sheet") || element.closest(".filter-menu")?.querySelector(".filters");
    if (panel) {
        panel.dataset.fullStatus = text;
        panel.dataset.fullStatusIdle = String(idle);
    }
}

// One summary replaces the two old labels; both sections stay readable inside.
function setCombinedFilterStatus(scope, category, tags) {
    const menu = scope.querySelector(".combined-filters");
    const summary = menu?.querySelector("[data-filter-summary]");
    if (!summary) return;
    const parts = [category, tags].filter((text) => text && text !== "All");
    const text = parts.length ? parts.join(" · ") : "All";
    summary.textContent = text;
    summary.title = text;
    summary.dataset.idle = String(text === "All");
    const panel = menu.querySelector(".filter-sheet");
    if (panel) {
        panel.dataset.fullStatus = text;
        panel.dataset.fullStatusIdle = String(text === "All");
    }
}

// Both menus are multi-choice now: a pick keeps the panel open for the next one.

const VIEW_IDS = new Set(["all", "grouped", "toolbox"]);
// One predictable rule per section: categories widen, tags narrow. No modes.
const GROUP_MATCH = "any";
const TAG_MATCH = "all";
const asList = (value) => Array.isArray(value) ? value : (value && value !== "all" ? [value] : []);
function matchesAll(values, selected, mode) {
    if (!selected.length) return true;
    return mode === "any" ? selected.some((value) => values.includes(value)) : selected.every((value) => values.includes(value));
}
function joinedLabel(labels, mode, plural) {
    if (!labels.length) return "All";
    if (labels.length === 1) return labels[0];
    const joined = labels.join(mode === "any" ? " / " : " + ");
    return joined.length <= 28 ? joined : `${labels.length} ${plural}`;
}
const filterStatusLabel = (tags, mode) => joinedLabel(tags.map(tagLabel), mode, "tags");

// Counts disappear on narrow screens, so keep them in the chips' accessible names.
function labelFilterCounts(scope) {
    scope.querySelectorAll(".filter-menu button[data-group]").forEach((button) => {
        const count = button.querySelector(".count")?.textContent;
        if (count) button.setAttribute("aria-label", `${buttonLabel(button)} (${count} items)`);
    });
}

function setFilterCount(button, count, selected = false) {
    let span = button.querySelector(".count");
    if (!span) {
        span = document.createElement("span");
        span.className = "count";
        button.appendChild(span);
    }
    span.textContent = String(count);
    button.setAttribute("aria-label", `${buttonLabel(button)} (${count} items)`);
    const id = button.dataset.tag || button.dataset.group;
    const deadEnd = count === 0 && !selected && !!id && !VIEW_IDS.has(id) && id !== "all";
    if (deadEnd) button.setAttribute("aria-disabled", "true");
    else button.removeAttribute("aria-disabled");
}

// Category chips show their own size (under the active tags); tag chips keep the "what if added" count.
function refreshFilterCounts(scope, items, state) {
    const { groups, groupsOf, tags } = state;
    const tagsOf = (item) => {
        try { return JSON.parse(item.dataset.tags || "[]"); } catch { return []; }
    };
    const withTags = (item, selected) => matchesAll(tagsOf(item), selected, TAG_MATCH);
    scope.querySelectorAll(".filter-menu button[data-group]").forEach((button) => {
        const id = button.dataset.group;
        // The view toggle is not a filter: it has no result count to refresh.
        if (VIEW_IDS.has(id)) return;
        // Categories widen the result, so a "what if" union would inflate the
        // other chips. Each chip must keep the real count of its own category.
        const count = items.filter((item) => groupsOf(item).includes(id) && withTags(item, tags)).length;
        setFilterCount(button, count, groups.includes(id));
    });
    scope.querySelectorAll(".filter-menu button[data-tag]").forEach((button) => {
        const tag = button.dataset.tag;
        const chosen = tags.includes(tag);
        const effective = chosen ? tags : [...tags, tag];
        const count = items.filter((item) => matchesAll(groupsOf(item), groups, GROUP_MATCH) && withTags(item, effective)).length;
        setFilterCount(button, count, chosen);
    });
}

// Announce the result quietly after a filter changes the shelf.
function announceFilters(scope, message) {
    let live = scope.querySelector("[data-filter-live]");
    if (!live) {
        live = document.createElement("p");
        live.className = "visually-hidden";
        live.dataset.filterLive = "";
        live.setAttribute("aria-live", "polite");
        scope.querySelector(".filter-bar")?.after(live);
        if (!live.parentNode) scope.appendChild(live);
    }
    if (live.textContent !== message) live.textContent = message;
}

// Always-visible counterpart of the live region: "3 of 19".
function ensureFilterResult(scope) {
    let result = scope.querySelector(".filter-bar .filter-result");
    if (!result) {
        result = document.createElement("span");
        result.className = "filter-result";
        result.setAttribute("aria-hidden", "true");
        const controls = scope.querySelector(".filter-bar .filter-controls");
        const clear = controls?.querySelector(".filter-clear");
        if (clear) controls.insertBefore(result, clear);
        else controls?.appendChild(result);
    }
    return result;
}

function ensureFilterClear(scope) {
    let button = scope.querySelector(".filter-bar .filter-clear");
    if (!button) {
        button = document.createElement("button");
        button.type = "button";
        button.className = "button small ghost filter-clear";
        button.innerHTML = `<span class="filter-clear-label">Clear</span>`;
        button.title = "Clear all filters";
        button.setAttribute("aria-label", "Clear all filters");
        button.hidden = true;
        scope.querySelector(".filter-bar .filter-controls")?.appendChild(button);
    }
    button.dataset.reset = "";
    return button;
}

function updateFilterFeedback(result, clear, shown, total, filtered, toolbox) {
    if (result) {
        result.textContent = `${shown} of ${total}`;
        result.title = `Showing ${shown} of ${total} projects`;
        result.hidden = toolbox;
    }
    if (clear) clear.hidden = toolbox || !filtered;
}

// --- Small conveniences shared by both filter menus ---------------------

// Tag choices follow you across the four filter pages.
const SHARED_FILTER_KEY = "site-filters:shared";
function readSharedTags() {
    try { return JSON.parse(localStorage.getItem(SHARED_FILTER_KEY) || "null"); } catch { return null; }
}
function writeSharedTags(tags, from) {
    try {
        if (tags.length) localStorage.setItem(SHARED_FILTER_KEY, JSON.stringify({ tags, from }));
        else localStorage.removeItem(SHARED_FILTER_KEY);
    } catch { /* private mode */ }
}
const sharedPageNames = { code: "Code", games: "Games", art: "Art", music: "Audio" };
function showFilterToast(message) {
    document.querySelector(".filter-toast")?.remove();
    const toast = document.createElement("p");
    toast.className = "filter-toast";
    toast.setAttribute("role", "status");
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function ensureFilterSearch(panel, onInput) {
    if (!panel || panel.querySelector(".filter-search")) return;
    const wrap = document.createElement("label");
    wrap.className = "filter-search-wrap";
    wrap.innerHTML = `<span class="visually-hidden">Find a tag or category</span><input class="filter-search" type="search" placeholder="Find a filter" autocomplete="off">`;
    panel.prepend(wrap);
    wrap.querySelector("input").addEventListener("input", (event) => onInput(event.target.value));
}
function applyFilterSearch(panel, query) {
    if (!panel) return;
    const q = query.trim().toLowerCase();
    const chips = [...panel.querySelectorAll("button[data-group], button[data-tag]")];
    chips.forEach((chip) => { chip.hidden = !!q && !chip.textContent.toLowerCase().includes(q); });
    panel.querySelectorAll(".category-view").forEach((row) => {
        row.hidden = !!q && !row.querySelector("button:not([hidden])");
    });
    panel.querySelectorAll(".tag-group").forEach((group) => {
        const shown = [...group.querySelectorAll("button[data-group], button[data-tag]")].some((chip) => !chip.hidden);
        group.hidden = !!q && !shown;
    });
    let note = panel.querySelector(".filter-search-empty");
    if (!note) {
        note = document.createElement("p");
        note.className = "filter-search-empty";
        note.textContent = "No filters match that search.";
        const search = panel.querySelector(":scope > .filter-search-wrap");
        panel.insertBefore(note, search?.nextSibling || panel.firstChild);
    }
    const visible = chips.filter((chip) => !chip.hidden).length;
    note.textContent = visible ? `${visible} ${visible === 1 ? "match" : "matches"}` : "No filters match that search.";
    note.hidden = !q;
}

// Close (bottom sheet) and ordering live in the panel head. The same control
// cycles chip order and, in Recent, the shelf order without touching views.
const ORDER_STATES = [
    { id: "alpha", label: "A–Z", next: "Sort filters by result count" },
    { id: "count", label: "By count", next: "Show the most recent projects first" },
    { id: "recent", label: "Recent", next: "Sort filters alphabetically" }
];
function ensurePanelTools(panel, onOrder, onReset) {
    const noop = { syncOrder() {}, syncReset() {} };
    if (!panel || panel.querySelector(".filter-close")) return noop;
    const close = document.createElement("button");
    close.type = "button";
    close.className = "filter-close";
    close.setAttribute("aria-label", "Close filters");
    close.addEventListener("click", () => {
        const menu = panel.closest(".filter-menu");
        if (!menu) return;
        menu.open = false;
        menu.querySelector("summary")?.focus();
    });
    panel.prepend(close);
    const menu = panel.closest(".filter-menu");
    menu?.addEventListener("click", (event) => {
        // A tap on the mobile backdrop lands on the <details> itself.
        if (event.target === menu) menu.open = false;
    });
    const order = document.createElement("button");
    order.type = "button";
    order.className = "filter-order";
    const syncOrder = (id) => {
        const state = ORDER_STATES.find((entry) => entry.id === id) || ORDER_STATES[0];
        order.dataset.order = state.id;
        order.textContent = state.label;
        order.title = state.next;
        order.setAttribute("aria-label", `Order: ${state.label}`);
    };
    syncOrder("alpha");
    order.addEventListener("click", () => {
        const index = ORDER_STATES.findIndex((entry) => entry.id === order.dataset.order);
        const next = ORDER_STATES[(index + 1) % ORDER_STATES.length];
        syncOrder(next.id);
        sortFilterChips(panel, next.id === "recent" ? "count" : next.id);
        sortShelf(panel.closest("main") || document, next.id);
        onOrder?.(next.id);
    });
    panel.prepend(order);
    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "filter-reset";
    reset.dataset.reset = "";
    reset.textContent = "Reset";
    reset.title = "Reset view, categories, tags and order";
    reset.disabled = true;
    reset.addEventListener("click", () => onReset?.());
    const syncReset = (active) => { reset.disabled = !active; };
    panel.insertBefore(reset, close);
    return { syncOrder, syncReset };
}
const endYear = (el) => {
    const years = (el.dataset.year || "").match(/(?:19|20)\d{2}/g) || [];
    return Number(years[years.length - 1]) || 0;
};
const sortIndex = (el) => Number(el.dataset.sortIndex) || 0;
// Recent reorders cards inside each existing group; the authored order is the
// fallback so switching back never leaves the shelf shuffled.
function sortShelf(scope, order) {
    scope.querySelectorAll("[data-code], [data-group-filter]").forEach((box) => {
        box.querySelectorAll(".group").forEach((group) => {
            const items = [...group.querySelectorAll("[data-item], .card")];
            [...new Set(items.map((item) => item.parentElement))].forEach((parent) => {
                if (!parent) return;
                const cards = items.filter((item) => item.parentElement === parent);
                cards.sort((a, b) => order === "recent"
                    ? endYear(b) - endYear(a) || sortIndex(a) - sortIndex(b)
                    : sortIndex(a) - sortIndex(b));
                cards.forEach((card) => parent.appendChild(card));
            });
        });
    });
}
function sortFilterChips(panel, order) {
    const chips = [...panel.querySelectorAll("button[data-group], button[data-tag]")]
        .filter((b) => b.dataset.tag !== "all" && !VIEW_IDS.has(b.dataset.group || ""));
    const text = (b) => buttonLabel(b).toLowerCase();
    const arrange = (nodes) => {
        nodes.sort((a, b) => order === "count"
            ? (Number(b.querySelector(".count")?.textContent) || 0) - (Number(a.querySelector(".count")?.textContent) || 0) || text(a).localeCompare(text(b))
            : text(a).localeCompare(text(b)));
        nodes.forEach((chip) => chip.parentNode?.appendChild(chip));
    };
    const groups = [...panel.querySelectorAll(".tag-group")];
    if (groups.length) {
        groups.forEach((group) => arrange([...group.querySelectorAll("button[data-group], button[data-tag]")]));
        arrange(chips.filter((button) => button.dataset.group));
        return;
    }
    arrange(chips);
}
function ensureCopyLink(scope) {
    const controls = scope.querySelector(".filter-bar .filter-controls");
    if (!controls || controls.querySelector(".filter-copy") || location.protocol === "file:") return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "button small ghost filter-copy";
    button.innerHTML = `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 14.5 14.5 9.5M8 12l-1.5 1.5a3 3 0 0 0 4.2 4.2L12 16m4-4 1.5-1.5a3 3 0 0 0-4.2-4.2L12 8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="filter-copy-label">Copy link</span>`;
    button.title = "Copy a link with these filters";
    button.setAttribute("aria-label", "Copy link with current filters");
    controls.appendChild(button);
    button.addEventListener("click", async () => {
        try { await navigator.clipboard.writeText(location.href); }
        catch {
            const field = document.createElement("textarea");
            field.value = location.href;
            document.body.appendChild(field);
            field.select();
            document.execCommand("copy");
            field.remove();
        }
        const label = button.querySelector(".filter-copy-label");
        const original = label.textContent;
        label.textContent = "Copied";
        button.setAttribute("aria-label", "Copied");
        setTimeout(() => {
            label.textContent = original;
            button.setAttribute("aria-label", "Copy link with current filters");
        }, 1400);
    });
}
function ensureFilterUndo(scope, onUndo) {
    const controls = scope.querySelector(".filter-bar .filter-controls");
    if (!controls || controls.querySelector(".filter-undo")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "button small ghost filter-undo";
    button.textContent = "↶";
    button.title = "Undo last filter (Ctrl+Z)";
    button.setAttribute("aria-label", "Undo last filter");
    button.hidden = true;
    controls.appendChild(button);
    button.addEventListener("click", onUndo);
    return button;
}
function updateEmptyActions(box, { shown, onUndo }) {
    const empty = box?.querySelector(".empty");
    if (!empty) return;
    let undo = empty.querySelector(".empty-undo");
    if (!undo) {
        undo = document.createElement("button");
        undo.type = "button";
        undo.className = "button ghost small empty-undo";
        undo.textContent = "Undo last";
        empty.append(" ", undo);
    }
    undo.hidden = shown !== 0;
    undo.onclick = onUndo;
}

// Filters survive a reload: URL on http(s), session storage on file://.
const FILTER_PARAMS = ["view", "groups", "gmode", "tags", "mode", "sort", "group"];
const ORDER_IDS = ["alpha", "count", "recent"];
function filterPageKey(scope) {
    if (scope.querySelector("[data-code]")) return "code";
    if (scope.querySelector("[data-games]")) return "games";
    if (scope.querySelector("[data-audio]")) return "music";
    if (scope.querySelector("[data-group-filter]")) return "art";
    return document.documentElement.dataset.page || "home";
}
function readFilterState(scope) {
    const key = filterPageKey(scope);
    let raw = null;
    if (location.protocol === "file:") {
        try { raw = JSON.parse(sessionStorage.getItem(`site-filters:${key}`) || "null"); } catch { raw = null; }
    } else if (key === document.documentElement.dataset.page) {
        const params = new URLSearchParams(location.search);
        if (FILTER_PARAMS.some((name) => params.has(name))) {
            const legacy = params.get("group") || "";
            raw = {
                view: params.get("view") || (VIEW_IDS.has(legacy) ? legacy : ""),
                groups: params.get("groups") ? params.get("groups").split(",").filter(Boolean) : (legacy && !VIEW_IDS.has(legacy) ? [legacy] : []),
                gmode: params.get("gmode") || "",
                tags: params.get("tags") ? params.get("tags").split(",").filter(Boolean) : [],
                mode: params.get("mode") || "",
                sort: params.get("sort") || ""
            };
        }
    }
    if (!raw) return null;
    const validGroups = [...scope.querySelectorAll(".filter-menu button[data-group]")].map((b) => b.dataset.group).filter((id) => !VIEW_IDS.has(id) && id !== "all");
    const validTags = [...scope.querySelectorAll(".filter-menu button[data-tag]")].map((b) => b.dataset.tag);
    // Older links stored one group in "group" and the tag mode in "mode".
    const legacyGroup = raw.group || "";
    return {
        view: VIEW_IDS.has(raw.view) ? raw.view : (VIEW_IDS.has(legacyGroup) ? legacyGroup : "all"),
        groups: [...new Set((raw.groups || (legacyGroup && !VIEW_IDS.has(legacyGroup) ? [legacyGroup] : [])).filter((id) => validGroups.includes(id)))],
        tags: [...new Set((raw.tags || []).filter((tag) => tag !== "all" && validTags.includes(tag)))],
        sort: ORDER_IDS.includes(raw.sort) ? raw.sort : "alpha"
    };
}
function writeFilterState(scope, state) {
    const key = filterPageKey(scope);
    if (location.protocol === "file:") {
        try { sessionStorage.setItem(`site-filters:${key}`, JSON.stringify(state)); } catch { /* private mode */ }
        return;
    }
    if (key !== document.documentElement.dataset.page) return;
    const url = new URL(location.href);
    FILTER_PARAMS.forEach((name) => url.searchParams.delete(name));
    if (state.view && state.view !== "all") url.searchParams.set("view", state.view);
    if (state.groups.length) url.searchParams.set("groups", state.groups.join(","));
    if (state.tags.length) url.searchParams.set("tags", state.tags.join(","));
    if (state.sort && state.sort !== "alpha") url.searchParams.set("sort", state.sort);
    history.replaceState(history.state, "", url.pathname + url.search + url.hash);
}

// The icon switch owns the view; Category narrows projects inside it.
function syncViewShortcuts(scope, view) {
    const toolboxView = view === "toolbox";
    scope.querySelectorAll(".filter-bar [data-view-shortcut]").forEach((button) => {
        button.setAttribute("aria-pressed", String((button.dataset.viewShortcut === "toolbox") === toolboxView));
    });
}

function wireViewShortcuts(scope, handlers) {
    scope.querySelectorAll(".filter-bar [data-view-shortcut]").forEach((button) => {
        button.addEventListener("click", () => handlers[button.dataset.viewShortcut]?.());
    });
}

function setViewShortcutTitles(scope, projects, toolbox) {
    const title = (kind, label, count) => {
        const button = scope.querySelector(`[data-view-shortcut="${kind}"]`);
        if (!button) return;
        const text = `${label} (${count} items)`;
        button.title = text;
        button.setAttribute("aria-label", text);
    };
    title("toolbox", "Toolbox", toolbox);
    title("projects", "Projects", projects);
}

linkFilterMenus();
wireFilterMenuDismiss();

// A small icon gives each category its own identity without adding numbers.
const groupIcons = {
    all: `<rect x="3.5" y="3.5" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/>`,
    game: `<path d="M7 8h10a4 4 0 0 1 4 4v1a3 3 0 0 1-5.2 2l-1-1H9.2l-1 1A3 3 0 0 1 3 13v-1a4 4 0 0 1 4-4Z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="M7 11.5v3M5.5 13h3M16 12h.01M18 13.5h.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
    art: `<path d="m4 20 4-1 10-10-3-3L5 16l-1 4Z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="m14 6 4 4" fill="none" stroke="currentColor" stroke-width="1.9"/>`,
    cube: `<path d="m12 2 9 5v10l-9 5-9-5V7l9-5Zm0 0v10m0 0 9-5m-9 5-9-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>`,
    ai: `<circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>`,
    web: `<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" fill="none" stroke="currentColor" stroke-width="1.8"/>`,
    music: `<path d="M9 18V5l10-2v13" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><circle cx="6" cy="18" r="3" fill="none" stroke="currentColor" stroke-width="1.9"/><circle cx="16" cy="16" r="3" fill="none" stroke="currentColor" stroke-width="1.9"/>`,
    code: `<path d="m9 6-6 6 6 6M15 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`
};

const groupIconFor = (id) => {
    if (/^(games|solo|team)$/.test(id)) return "game";
    if (id === "game" || /^(albums|studio)$/.test(id)) return "music";
    if (/^(digital|pixel|art)$/.test(id)) return "art";
    if (id === "3d" || /engine|graphic/i.test(id)) return "cube";
    if (/ai/i.test(id)) return "ai";
    if (id === "web") return "web";
    return "code";
};

// The flat shelf needs the same labelled head as the category sections.
const allHead = () => `<div class="group-head all-head">
    <span class="group-badge" aria-hidden="true"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${groupIcons.all}</svg></span>
    <h2>All</h2>
</div>`;

function decorateGroupHeads() {
    // Same hue as the page, just slightly different shades per subcategory.
    const tones = ["", "tone-mid", "tone-deep"];
    const groups = [...document.querySelectorAll(".group[data-group]")];
    groups.forEach((group, index) => {
        const head = group.querySelector(".group-head");
        const title = head?.querySelector("h2");
        if (!head || !title || head.querySelector(".group-badge")) return;
        const tone = tones[index % tones.length];
        if (tone) head.classList.add(tone);
        const badge = document.createElement("span");
        badge.className = "group-badge";
        badge.setAttribute("aria-hidden", "true");
        badge.innerHTML = `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${groupIcons[groupIconFor(group.dataset.group)]}</svg>`;
        head.prepend(badge);
    });
}

function mediaItems(p, dialog = false) {
    const items = [];
    const cover = dialog ? p.image : thumbOf(p.image || "") || p.image;
    if (p.image) items.push({ kind: "image", src: asset(cover), poster: asset(cover), alt: p.alt || p.title });
    const video = p.video || p.coverVideo;
    if (video) items.push({ kind: "video", src: asset(video), poster: asset(cover), alt: `Video preview of ${p.title}` });
    if (p.extra) items.push({ kind: "image", src: asset(p.extra), alt: `Another view of ${p.title}` });
    const readme = (window.PROJECT_MEDIA && window.PROJECT_MEDIA[p.id]) || [];
    for (const item of readme) {
        const src = asset(item.src);
        if (items.some((existing) => existing.src === src)) continue;
        items.push({ kind: "image", src, alt: item.alt || `Another view of ${p.title}` });
    }
    // Trailers lead inside the detail sheet; cards keep their fixed cover.
    if (dialog) return [...items.filter((item) => item.kind === "video"), ...items.filter((item) => item.kind !== "video")];
    return items;
}

function media(p, dialog = false, index = 0, withActions = false) {
    const items = mediaItems(p, dialog);
    if (!items.length) return "";
    if (!dialog) {
        const cover = items[0];
        const trailer = items.some((item) => item.kind === "video");
        const contained = p.contain && p.kind !== "art";
        return `<div class="media card-media${contained ? " contain" : ""}${trailer ? " has-trailer" : ""}" style="--cover: url('${esc(cover.src)}')">
            <span class="media-backdrop" style="background-image: url('${esc(cover.src)}')" aria-hidden="true"></span>
            <img class="card-cover" src="${esc(cover.src)}" alt="${esc(cover.alt)}" loading="lazy" decoding="async" width="640" height="360">
            ${trailer ? `<span class="trailer-badge" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 6l9 6-9 6z"/></svg>Trailer</span>` : ""}
            ${withActions ? `<button type="button" class="media-open" data-open-project="${esc(p.id)}" aria-label="Details of ${esc(p.title)}"></button>` : ""}
        </div>`;
    }
    const slides = items.map((item, i) => {
        const hidden = i === index ? "" : " hidden";
        if (item.kind === "video") {
            const poster = item.poster ? ` poster="${esc(item.poster)}"` : "";
            return `<video data-media-slide${hidden} data-media-open data-src="${esc(item.src)}"${poster} muted playsinline controls preload="none" aria-label="Enlarge video: ${esc(item.alt)}"${dialog ? "" : " loop"}></video>`;
        }
        return `<img data-media-slide${hidden} data-media-open role="button" tabindex="-1" aria-label="Enlarge image: ${esc(item.alt || p.title)}" src="${esc(item.src)}" alt="${esc(item.alt)}" loading="lazy" decoding="async">`;
    }).join("");
    const controls = `${items.length < 2 ? "" : `
        <button type="button" class="media-arrow media-prev" data-media-step="-1" aria-label="Previous media of ${esc(p.title)}"><svg class="media-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4 7 12l8 8"/></svg></button>
        <button type="button" class="media-arrow media-next" data-media-step="1" aria-label="Next media of ${esc(p.title)}"><svg class="media-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4 17 12l-8 8"/></svg></button>
        <span class="media-count" aria-live="polite">${index + 1} / ${items.length}</span>
        <span class="media-progress" aria-hidden="true"></span>
        <button type="button" class="media-autoplay" data-autoplay aria-label="Pause automatic slides" aria-pressed="true"><svg class="auto-icon-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg><svg class="auto-icon-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg></button>`}`;
    return `<div class="media dialog-media${p.contain ? " contain" : ""}" data-media-carousel data-media-index="${index}" style="--cover: url('${esc(items[0].src)}')">
        <span class="media-backdrop" style="background-image: url('${esc(items[0].src)}')" aria-hidden="true"></span>
        ${slides}${controls}
    </div>`;
}

function meta(p) {
    if (p.meta) return esc(p.meta);
    return [p.team, p.year].filter(Boolean).map(esc).join(", ");
}

function tags(p, active = new Set()) {
    return `<ul class="tags dialog-tags" aria-label="Tags">${p.tags.map((t) => `<li><button type="button" class="dialog-tag" data-dialog-tag="${esc(t)}" aria-pressed="${active.has(t)}" title="Filter by ${esc(tagLabel(t))}" aria-label="Filter by ${esc(tagLabel(t))}">${esc(tagLabel(t))}</button></li>`).join("")}</ul>`;
}

const linkIcons = { play: "play", itch: "itch", video: "youtube", source: "github", download: "download" };
const linkOrder = { play: 0, itch: 1, source: 2, video: 3, download: 4 };
const orderedLinks = (p) => [...(p.links || [])].sort((a, b) => (linkOrder[a.kind] ?? 9) - (linkOrder[b.kind] ?? 9));

// Cards show the two defining tags; the full list lives in the dialog.
function cardTags(p) {
    const tags = p.tags || [];
    if (!tags.length) return "";
    const chips = tags.slice(0, 2).map((t) => `<li>${esc(tagLabel(t))}</li>`);
    if (tags.length > 2) chips.push(`<li class="tag-more">+${tags.length - 2}</li>`);
    return `<ul class="tags card-tags" aria-label="Tags">${chips.join("")}</ul>`;
}

function cardLinks(p) {
    const details = `<li><button type="button" class="button ghost small card-details" data-open-project="${esc(p.id)}" aria-label="Details of ${esc(p.title)}">Details<svg class="icon" aria-hidden="true"><use href="#arrow"></use></svg></button></li>`;
    const links = (p.links || []).length
        ? orderedLinks(p).map((link) => `<li><a class="icon-link" href="${esc(link.url)}" title="${esc(link.label)}" aria-label="${esc(link.label + " (" + p.title + ")")}"><svg class="icon" aria-hidden="true"><use href="#${linkIcons[link.kind] || "arrow"}"></use></svg></a></li>`).join("")
        : "";
    return `<ul class="actions card-links" aria-label="More on ${esc(p.title)}">${details}${links}</ul>`;
}

const shortLinkLabels = { play: "Play", itch: "itch.io", source: "GitHub", video: "Trailer", download: "Download" };

function actions(p) {
    const items = orderedLinks(p).map((link) => {
        const icon = `<svg class="icon" aria-hidden="true"><use href="#${linkIcons[link.kind] || "arrow"}"></use></svg>`;
        const label = shortLinkLabels[link.kind] || link.label;
        return `<li><a class="button ghost" href="${esc(link.url)}" title="${esc(link.label)}" aria-label="${esc(link.label)} (${esc(p.title)})">${icon}<span class="dialog-link-label">${esc(label)}</span></a></li>`;
    });
    return `<ul class="actions">${items.join("")}</ul>`;
}

function card(p) {
    const search = p.tags.map((t) => t.toLowerCase());
    const projectGroups = p.groups || (p.group ? [p.group] : (p.kind === "game" ? ["games"] : []));
    return `<li class="card" data-project="${esc(p.id)}" data-zone="${esc(p.kind || "code")}" data-year="${esc(p.year || "")}" data-groups="${esc(JSON.stringify(projectGroups))}" data-tags="${esc(JSON.stringify(search))}">
        ${media(p, false, 0, true)}
        <h3>${esc(p.title)}</h3>
        ${cardTags(p)}
        ${cardLinks(p)}
    </li>`;
}

function gameRow(p) {
    const search = p.tags.map((t) => t.toLowerCase());
    return `<article class="game" id="${esc(p.id)}" data-project="${esc(p.id)}" data-item data-year="${esc(p.year || "")}" data-tags="${esc(JSON.stringify(search))}">
        ${media(p, false, 0, true)}
        <div class="game-body">
            <h2>${esc(p.title)}</h2>
            ${cardTags(p)}
            ${cardLinks(p)}
        </div>
    </article>`;
}

function audioCard(a) {
    const cover = thumbOf(a.cover) || a.cover;
    const video = a.coverVideo
        ? `<video muted loop playsinline preload="none" aria-hidden="true" data-src="${esc(asset(a.coverVideo))}"></video>`
        : "";
    const search = (a.tags || []).map((t) => t.toLowerCase());
    const year = String(a.meta || "").match(/(?:19|20)\d{2}/g)?.pop() || "";
    return `<li class="audio-card" data-item data-year="${esc(year)}" data-tags="${esc(JSON.stringify(search))}">
        <div class="audio-art audio-cover" data-open-audio="${esc(a.id)}" style="--cover: url('${esc(asset(cover))}')">
            <span class="audio-backdrop" aria-hidden="true"></span>
            <img src="${esc(asset(cover))}" alt="" loading="lazy" decoding="async" width="600" height="600">${video}
        </div>
        <button type="button" class="audio-open" data-project="${esc(a.id)}">
            <span class="visually-hidden">Details of </span><span class="audio-title">${esc(a.title)}</span>
            <span class="audio-meta">${esc(a.meta)}</span>
        </button>
    </li>`;
}

// Home: one card per zone, illustrated with the first matching item in the data.
// The artwork opens that item's details; the bottom link opens the zone filtered.
function zoneCard(p, zone) {
    const icon = groupIcons[zone.icon] || "";
    const count = Number(zone.count) || 0;
    const countLabel = `${count} ${count === 1 ? "project" : "projects"}`;
    return `<li class="zone-item" data-zone="${esc(zone.icon)}">
        <p class="zone-label zone-${esc(zone.icon)}"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${icon}</svg><span>${esc(zone.label)}</span></p>
        <article class="card zone-card" data-project="${esc(p.id)}" data-zone="${esc(zone.icon)}">
            ${media(p, false, 0, true)}
            <h3>${esc(p.title)}</h3>
            ${cardTags(p)}
        </article>
        <a class="button ghost small zone-link" href="${esc(zone.href)}">${esc(zone.cta)}${count ? `<span class="zone-count" aria-hidden="true">${count}</span>` : ""}<span class="visually-hidden"> ${esc(countLabel)}</span><svg class="icon" aria-hidden="true"><use href="#arrow"></use></svg></a>
    </li>`;
}

// The Art zone has no data file, so give it a project entry like the other zones.
// That lets its card join the same detail dialog and pager instead of using the lightbox.
const homeArtProject = {
    id: "home-art",
    kind: "art",
    title: "Illustration",
    meta: "Digital art",
    summary: "Character illustration drawn from scratch in Illustrator, exploring colour and shape.",
    tags: ["illustration", "character design"],
    image: "assets/art/cowboy-digital.webp",
    alt: "Digital illustration of a green-skinned cowboy firing a revolver at sunset",
    contain: true,
    links: [{ kind: "view", label: "See all art", url: new URL("art/index.html", siteBase).href }]
};

document.querySelectorAll("[data-featured]").forEach((list) => {
    const projects = window.PROJECTS || [];
    const games = projects.find((p) => p.kind === "game");
    const engine = projects.find((p) => p.kind === "code" && /engine/i.test(p.title) && (p.groups || [p.group]).includes("engines"));
    const audio = (window.AUDIO_ITEMS || [])[0];
    // Counts come from the cached shelves, so Home stays in step with each page.
    const countIn = (page, selector) => window.__routePages?.[page]?.querySelectorAll(selector).length || 0;
    const counts = {
        games: projects.filter((p) => p.kind === "game").length,
        code: projects.filter((p) => p.kind === "code").length,
        art: countIn("art", "[data-group-filter] [data-item]"),
        audio: (window.AUDIO_ITEMS || []).length
    };
    const cards = [];
    if (games) {
        cards.push(zoneCard(games, {
            label: "Games",
            icon: "game",
            href: new URL("games/index.html", siteBase).href,
            cta: "View all games",
            count: counts.games
        }));
    }
    if (engine) {
        cards.push(zoneCard(engine, {
            label: "Code",
            icon: "code",
            context: "Engines, graphics and AI projects.",
            href: new URL("code/index.html", siteBase).href,
            cta: "View Code",
            count: counts.code
        }));
    }
    cards.push(zoneCard(homeArtProject, {
        label: "Art",
        icon: "art",
        context: "Digital art, pixel art and 3D models.",
        href: new URL("art/index.html", siteBase).href,
        cta: "View Art",
        count: counts.art
    }));
    if (audio) {
        cards.push(zoneCard({
            id: audio.id,
            title: audio.title,
            meta: audio.meta,
            summary: audio.summary,
            tags: audio.tags || [],
            image: audio.cover,
            coverVideo: audio.coverVideo,
            preview: audio.preview,
            tracks: audio.tracks || [],
            extra: audio.extra
        }, {
            label: "Audio",
            icon: "music",
            context: "Music, game audio and studio work.",
            href: new URL("music/index.html", siteBase).href,
            cta: "View Audio",
            count: counts.audio
        }));
    }
    list.innerHTML = cards.join("");
});

// Games page: grouped by solo/team work, using the Code page's section layout.
document.querySelectorAll("[data-games]").forEach((box) => {
    const games = (window.PROJECTS || []).filter((p) => p.kind === "game");
    const groups = [
        { id: "solo", title: "Solo", intro: "Designed and built on my own.", test: (p) => /solo/i.test(p.team || "") },
        { id: "team", title: "Team", intro: "Made with other students at ESNE and UDIT.", test: (p) => !/solo/i.test(p.team || "") }
    ];
    box.innerHTML = groups.map((g) => {
        const items = games.filter(g.test);
        if (!items.length) return "";
        return `<section class="group" data-group="${g.id}" aria-labelledby="games-${g.id}">
            <div class="group-head">
                <h2 id="games-${g.id}">${g.title}</h2>
                <p class="group-intro">${g.intro}</p>
            </div>
            <div class="games">${items.map(gameRow).join("")}</div>
        </section>`;
    }).join("") + `<p class="empty" hidden>No results for that combination. <button type="button" class="button ghost small empty-reset">Show all</button></p>`;
});

// Audio page: small square covers, a preview button and the same group filters.
const audioBox = document.querySelector("[data-audio]");
if (audioBox) {
    const items = window.AUDIO_ITEMS || [];
    audioBox.innerHTML = (window.AUDIO_GROUPS || []).map((g) => {
        const inGroup = items.filter((a) => a.group === g.id);
        if (!inGroup.length) return "";
        return `<section class="group" data-group="${esc(g.id)}" aria-labelledby="audio-${esc(g.id)}">
            <div class="group-head">
                <h2 id="audio-${esc(g.id)}">${esc(g.title)}</h2>
                <p class="group-intro">${esc(g.intro)}</p>
            </div>
            <ul class="audio-grid">${inGroup.map(audioCard).join("")}</ul>
        </section>`;
    }).join("");
}

// One bottom bar owns the playlist. Tracks can come from any album, and the
// queue keeps working after the details sheet is closed.
const soundBar = document.createElement("div");
soundBar.className = "soundbar";
soundBar.setAttribute("role", "region");
soundBar.setAttribute("aria-label", "Audio player");
soundBar.hidden = true;
soundBar.innerHTML = `
    <div class="soundbar-track">
        <a class="soundbar-cover-link" href="#" aria-label="Open this item's page" hidden><img class="soundbar-cover" alt="" width="48" height="48" hidden></a>
        <div class="soundbar-info">
            <a class="soundbar-title" href="#"></a>
            <span class="soundbar-meta"><span class="soundbar-eq" aria-hidden="true"><i></i><i></i><i></i></span><span data-sound-meta></span><span class="soundbar-count" hidden></span><button type="button" class="soundbar-resume" hidden>Resume</button></span>
        </div>
    </div>
    <div class="soundbar-center">
        <div class="soundbar-controls">
            <button type="button" class="soundbar-skip" data-sound-step="-1" aria-label="Previous track"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 5 8 12l10 7z"/></svg></button>
            <button type="button" class="soundbar-toggle" aria-label="Play">
                <svg class="icon soundbar-play" aria-hidden="true"><use href="#play"></use></svg>
                <svg class="icon soundbar-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>
            </button>
            <button type="button" class="soundbar-skip" data-sound-step="1" aria-label="Next track"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5l10 7L6 19z"/></svg></button>
        </div>
        <div class="soundbar-progress-row">
            <div class="soundbar-seek">
                <input class="soundbar-progress" type="range" min="0" max="100" value="0" step="0.1" aria-label="Seek">
                <span class="soundbar-scrub" hidden></span>
            </div>
            <span class="soundbar-time">0:00</span>
        </div>
    </div>
    <div class="soundbar-extra">
        <span class="soundbar-volume-control">
            <button type="button" class="soundbar-mute" aria-label="Mute"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h3l5-4v14l-5-4H4z"/><path class="soundbar-wave" d="M16 9a4 4 0 0 1 0 6m2.5-8.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>
            <input class="soundbar-volume-range" type="range" min="0" max="100" value="100" step="1" aria-label="Volume">
        </span>
        <button type="button" class="soundbar-close" aria-label="Close player">&times;</button>
    </div>
    <audio class="soundbar-player" preload="none"></audio>`;
document.body.appendChild(soundBar);

const soundPlayer = soundBar.querySelector(".soundbar-player");
const soundToggle = soundBar.querySelector(".soundbar-toggle");
const soundProgress = soundBar.querySelector(".soundbar-progress");
const soundTime = soundBar.querySelector(".soundbar-time");
const soundScrub = soundBar.querySelector(".soundbar-scrub");
const soundVolumeRange = soundBar.querySelector(".soundbar-volume-range");
const soundMute = soundBar.querySelector(".soundbar-mute");
const soundCoverLink = soundBar.querySelector(".soundbar-cover-link");
const soundTitleLink = soundBar.querySelector(".soundbar-title");
let playlist = [];

// The player floats above the page or the details sheet. Reserve its real
// height so the last track can always be scrolled out from under it.
const syncSoundbarSpace = () => {
    if (soundBar.hidden) {
        document.documentElement.style.removeProperty("--soundbar-space");
        syncScrollUI();
        return;
    }
    const space = Math.ceil(soundBar.getBoundingClientRect().height + 24);
    document.documentElement.style.setProperty("--soundbar-space", `${space}px`);
    syncScrollUI();
};
window.addEventListener("resize", syncSoundbarSpace);
let playlistIndex = 0;
let soundKey = "";
let soundOnTrack = null;
let soundVolume = 1;
let previousVolume = 1;

// Keep the last track and position for the next page of this tab. Storage can
// be refused on file://, so every access is guarded.
const AUDIO_SESSION_KEY = "mrg14-audio-session";
const SOUNDBAR_MOTION_MS = 180;
const audioSession = {
    read() {
        try {
            const raw = sessionStorage.getItem(AUDIO_SESSION_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    },
    write(state) {
        try { sessionStorage.setItem(AUDIO_SESSION_KEY, JSON.stringify(state)); } catch { /* storage disabled */ }
    },
    clear() {
        try { sessionStorage.removeItem(AUDIO_SESSION_KEY); } catch { /* storage disabled */ }
    }
};
const resumeButton = soundBar.querySelector(".soundbar-resume");
let lastSessionSave = 0;

const saveAudioSession = () => {
    if (!playlist.length || soundBar.hidden) return;
    lastSessionSave = Date.now();
    audioSession.write({
        tracks: playlist,
        index: playlistIndex,
        time: soundPlayer.currentTime || 0,
        playing: !soundPlayer.paused,
        volume: soundVolume,
        savedAt: lastSessionSave
    });
};

const applyVolume = (value, persist = true) => {
    const next = Math.min(1, Math.max(0, Number(value)));
    if (!Number.isFinite(next)) return;
    soundVolume = next;
    soundPlayer.volume = next;
    soundVolumeRange.value = String(Math.round(next * 100));
    soundVolumeRange.setAttribute("aria-valuetext", `${Math.round(next * 100)}%`);
    soundMute.classList.toggle("is-muted", next === 0);
    soundMute.setAttribute("aria-label", next === 0 ? "Unmute" : "Mute");
    if (next > 0) previousVolume = next;
    if (persist) saveAudioSession();
};

const soundPlaying = (on) => {
    soundBar.classList.toggle("is-playing", on);
    soundToggle.setAttribute("aria-label", on ? "Pause" : "Play");
};

const hideSoundBar = () => {
    soundPlayer.pause();
    audioSession.clear();
    resumeButton.hidden = true;
    soundBar.classList.remove("needs-resume");
    soundBar.classList.remove("is-open");
    soundKey = "";
    playlist = [];
    soundOnTrack = null;
    soundBar.classList.remove("has-queue");
    soundPlaying(false);
    window.setTimeout(() => {
        if (!soundBar.classList.contains("is-open")) {
            soundBar.hidden = true;
            syncSoundbarSpace();
            syncScrollUI();
        }
    }, SOUNDBAR_MOTION_MS);
};

const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return "0:00";
    const all = Math.floor(seconds);
    return `${Math.floor(all / 60)}:${String(all % 60).padStart(2, "0")}`;
};

const setTrackInfo = (track, index) => {
    soundTitleLink.textContent = track.title || "";
    soundBar.querySelector("[data-sound-meta]").textContent = track.meta || "";
    const count = soundBar.querySelector(".soundbar-count");
    count.textContent = `${index + 1} / ${playlist.length}`;
    count.hidden = playlist.length < 2;
    const cover = soundBar.querySelector(".soundbar-cover");
    if (track.cover) {
        cover.src = asset(thumbOf(track.cover) || track.cover);
        cover.hidden = false;
    } else {
        cover.removeAttribute("src");
        cover.hidden = true;
    }
    const target = track.target || (track.itemId ? itemPage(track) : "");
    [soundCoverLink, soundTitleLink].forEach((link) => {
        if (target) link.href = target;
        else link.removeAttribute("href");
        link.setAttribute("aria-disabled", String(!target));
        link.title = target ? "Open on its page" : "";
    });
    soundCoverLink.hidden = !track.cover;
    soundBar.classList.toggle("has-queue", playlist.length > 1);
};

const playPlaylistIndex = (index, resumeTime = 0, startPaused = false) => {
    if (index < 0 || index >= playlist.length) {
        hideSoundBar();
        return;
    }
    playlistIndex = index;
    const track = playlist[index];
    const url = asset(track.src);
    soundPlayer.pause();
    soundPlayer.volume = soundVolume;
    soundKey = url;
    soundPlayer.src = url;
    if (startPaused) soundPlayer.load();
    setTrackInfo(track, index);
    soundProgress.value = "0";
    soundTime.textContent = "0:00";
    if (resumeTime > 0) {
        const seek = () => {
            try { soundPlayer.currentTime = Math.min(resumeTime, soundPlayer.duration || resumeTime); } catch { /* not seekable */ }
            soundTime.textContent = formatTime(soundPlayer.currentTime);
        };
        if (soundPlayer.readyState >= 1) seek();
        else soundPlayer.addEventListener("loadedmetadata", seek, { once: true });
    }
    resumeButton.hidden = true;
    soundBar.classList.remove("needs-resume");
    soundBar.hidden = false;
    void soundBar.offsetWidth;
    soundBar.classList.add("is-open");
    syncSoundbarSpace();
    syncScrollUI();
    if (startPaused) {
        soundPlayer.volume = soundVolume;
        soundPlaying(false);
        saveAudioSession();
    } else {
        soundPlayer.play()
            .then(() => {
                soundPlaying(true);
                saveAudioSession();
            })
            .catch(() => {
                soundPlayer.volume = soundVolume;
                soundPlaying(false);
                resumeButton.hidden = false;
                soundBar.classList.add("needs-resume");
            });
    }
    soundOnTrack?.(index);
};

const playPlaylist = (tracks, index = 0, context = {}, resumeTime = 0, startPaused = false) => {
    if (!tracks?.length) return;
    playlist = tracks.map((track) => ({
        src: track.src,
        title: track.title,
        meta: track.meta || context.meta || "",
        cover: track.cover || context.cover || "",
        target: track.target || context.target || "",
        itemId: track.itemId || context.itemId || "",
        kind: track.kind || context.kind || "",
        isAudio: track.isAudio || context.isAudio || false
    }));
    soundOnTrack = context.onTrack || null;
    playPlaylistIndex(Math.min(Math.max(index, 0), playlist.length - 1), resumeTime, startPaused);
};

soundToggle.addEventListener("click", () => {
    if (soundPlayer.paused) {
        soundPlayer.play().then(() => {
            resumeButton.hidden = true;
            soundBar.classList.remove("needs-resume");
            saveAudioSession();
        }).catch(() => soundPlaying(false));
    } else soundPlayer.pause();
});
resumeButton.addEventListener("click", () => soundToggle.click());
soundBar.querySelectorAll("[data-sound-step]").forEach((button) => {
    button.addEventListener("click", () => {
        // Previous restarts the current track, like Spotify does.
        if (button.dataset.soundStep === "-1" && playlistIndex === 0 && soundPlayer.currentTime > 3) {
            soundPlayer.currentTime = 0;
            return;
        }
        playPlaylistIndex(playlistIndex + Number(button.dataset.soundStep));
    });
});
soundBar.querySelector(".soundbar-close").addEventListener("click", hideSoundBar);
soundPlayer.addEventListener("play", () => { soundPlaying(true); saveAudioSession(); });
soundPlayer.addEventListener("pause", () => { soundPlaying(false); saveAudioSession(); });
soundPlayer.addEventListener("timeupdate", () => {
    const ratio = soundPlayer.duration ? soundPlayer.currentTime / soundPlayer.duration : 0;
    soundProgress.value = String(ratio * 100);
    soundTime.textContent = formatTime(soundPlayer.currentTime);
    if (Date.now() - lastSessionSave > 1000) saveAudioSession();
});
soundPlayer.addEventListener("ended", () => playPlaylistIndex(playlistIndex + 1));
soundProgress.addEventListener("input", () => {
    if (soundPlayer.duration) soundPlayer.currentTime = soundPlayer.duration * Number(soundProgress.value) / 100;
    showScrubAt(Number(soundProgress.value) / 100);
});

// Hover/focus preview: show the minute and second under the pointer.
const showScrubAt = (ratio) => {
    if (!Number.isFinite(soundPlayer.duration) || soundPlayer.duration <= 0) return;
    const clamped = Math.min(1, Math.max(0, ratio));
    soundScrub.textContent = formatTime(clamped * soundPlayer.duration);
    const half = soundScrub.offsetWidth / 2;
    soundScrub.style.left = `${Math.min(Math.max(clamped * soundProgress.clientWidth, half), soundProgress.clientWidth - half)}px`;
    soundScrub.hidden = false;
};
const hideScrub = () => { soundScrub.hidden = true; };
soundProgress.addEventListener("pointerenter", (event) => showScrubAt(
    (event.clientX - soundProgress.getBoundingClientRect().left) / soundProgress.clientWidth
));
soundProgress.addEventListener("pointermove", (event) => showScrubAt(
    (event.clientX - soundProgress.getBoundingClientRect().left) / soundProgress.clientWidth
));
soundProgress.addEventListener("pointerleave", hideScrub);
soundProgress.addEventListener("focus", () => showScrubAt(Number(soundProgress.value) / 100));
soundProgress.addEventListener("blur", hideScrub);

soundVolumeRange.addEventListener("input", () => applyVolume(Number(soundVolumeRange.value) / 100));
soundMute.addEventListener("click", () => applyVolume(soundVolume > 0 ? 0 : previousVolume || 1));
window.addEventListener("pagehide", saveAudioSession);

// A new page continues the track that was playing before the navigation.
const restoreAudioSession = () => {
    const saved = audioSession.read();
    if (!saved?.tracks?.length || !Number.isFinite(saved.time)) return;
    if (Date.now() - (saved.savedAt || 0) > 10 * 60 * 1000) {
        audioSession.clear();
        return;
    }
    const index = Math.min(Math.max(Number(saved.index) || 0, 0), saved.tracks.length - 1);
    const track = saved.tracks[index];
    const paused = saved.playing === false;
    applyVolume(Number.isFinite(saved.volume) ? saved.volume : 1, false);
    playPlaylist(saved.tracks, index, {
        meta: track.meta || "",
        cover: track.cover || ""
    }, saved.time, paused);
};
applyVolume(soundVolume, false);
restoreAudioSession();

// Code page: category bar as the main filter, tags as a refinement.
const codeBox = document.querySelector("[data-code]");
if (codeBox) {
    // The router keeps every page in the DOM: scope filter controls to this page.
    const scope = codeBox.closest("main") || document;
    const [gamesGroup, ...otherGroups] = window.PROJECT_GROUPS;
    const orderedGroups = [...otherGroups, gamesGroup];
    const projectGroups = (p) => p.groups || (p.group ? [p.group] : []);
    const projectsIn = (g) => window.PROJECTS.filter((p) => (g.id === "games" ? p.kind === "game" : projectGroups(p).includes(g.id)));

    codeBox.innerHTML = allHead() + orderedGroups.map((g) => {
        const items = projectsIn(g);
        if (!items.length) return "";
        return `<section class="group" data-group="${esc(g.id)}" aria-labelledby="group-${g.id}">
            <div class="group-head">
                <h2 id="group-${g.id}">${esc(g.title)}</h2>
                <p class="group-intro">${esc(g.intro)}</p>
            </div>
            <ul class="cards">${items.map(card).join("")}</ul>
        </section>`;
    }).join("") + `<p class="empty" hidden>No results for that combination. <button type="button" class="button ghost small empty-reset">Show all</button></p>`;

    const tabs = scope.querySelector("[data-group-tabs]");
    const categoryMenu = scope.querySelector(".filter-bar .group-filters");
    const sheet = scope.querySelector(".filter-bar .filter-sheet");
    const knowledge = scope.querySelector(".knowledge");
    const categoryStatus = scope.querySelector("[data-category-status]");
    setFilterStatus(categoryStatus, categoryStatus.textContent);
    const total = orderedGroups.reduce((sum, g) => sum + projectsIn(g).length, 0);
    const toolboxCount = knowledge ? knowledge.querySelectorAll("li").length : 0;
    setViewShortcutTitles(scope, total, toolboxCount);
    if (tabs) {
        const options = orderedGroups.map((g) => ({ id: g.id, title: g.title, count: projectsIn(g).length }));
        tabs.innerHTML = `<legend>Category</legend>` +
            `<div class="category-chips">` +
            options.map((g) => `<button type="button" data-group="${esc(g.id)}" aria-pressed="false">${esc(g.title)}<span class="count">${g.count}</span></button>`).join("") +
            `</div><div class="category-view"><span class="category-view-label" aria-hidden="true">View</span>` +
            `<button type="button" data-group="grouped" aria-pressed="false" title="Restores the section headings">Grouped</button></div>`;
        labelFilterCounts(scope);
        keepFilterPanelInView(scope.querySelector(".filter-bar .combined-filters"));
    }

    let view = "all";
    let groups = [];
    let tags = [];
    let sort = "alpha";
    let lastView = "all";
    const result = ensureFilterResult(scope);
    const clearButton = ensureFilterClear(scope);
    const page = filterPageKey(scope);
    const countItems = [...codeBox.querySelectorAll(".card")];
    countItems.forEach((item, i) => { item.dataset.sortIndex = i; });
    const groupsOf = (item) => {
        try { return JSON.parse(item.dataset.groups || "[]"); } catch { return []; }
    };
    const groupLabel = (id) => {
        const button = tabs?.querySelector(`button[data-group="${id}"]`);
        return button ? buttonLabel(button) : "All";
    };
    const categoryLabel = () => {
        let selected = joinedLabel(groups.map(groupLabel), GROUP_MATCH, "categories");
        if (view === "grouped" && selected !== "All") selected = `Grouped + ${selected}`;
        else if (view === "grouped") selected = "Grouped";
        else if (view === "toolbox" && selected !== "All") selected = `Toolbox + ${selected}`;
        else if (view === "toolbox") selected = "Toolbox";
        return selected;
    };

    const groupPanel = categoryMenu?.querySelector(".filters");
    const filterStatus = scope.querySelector("[data-filter-status]");
    const tagFilters = scope.querySelector(".filter-bar .tag-filters");
    const tagPanel = tagFilters?.querySelector(".filters");
    buildTagFilters(tagPanel, "code", countItems, (item) => {
        try { return JSON.parse(item.dataset.tags || "[]"); } catch { return []; }
    });
    setFilterStatus(filterStatus, filterStatus?.textContent);
    ensureFilterSearch(sheet, (query) => applyFilterSearch(sheet, query));
    const { syncOrder, syncReset } = ensurePanelTools(sheet, (id) => {
        sort = ORDER_IDS.includes(id) ? id : "alpha";
        applyFilters();
    }, () => clearFilters());
    ensureCopyLink(scope);

    const syncGroupChips = () => {
        tabs?.querySelectorAll("button[data-group]").forEach((b) => {
            const id = b.dataset.group;
            b.setAttribute("aria-pressed", String(id === "grouped" ? view === "grouped" : groups.includes(id)));
        });
    };
    const syncTagChips = () => {
        tagPanel?.querySelectorAll("button[data-tag]").forEach((b) => {
            b.setAttribute("aria-pressed", String(tags.includes(b.dataset.tag)));
        });
    };
    const syncStatuses = () => {
        setFilterStatus(categoryStatus, categoryLabel());
        setFilterStatus(filterStatus, filterStatusLabel(tags, TAG_MATCH));
        setCombinedFilterStatus(scope, categoryLabel(), filterStatusLabel(tags, TAG_MATCH));
    };

    const history = [];
    const undoButton = ensureFilterUndo(scope, () => undo());
    const snapshot = () => ({ view, lastView, groups: [...groups], tags: [...tags], sort });
    const pushHistory = () => {
        history.push(snapshot());
        if (history.length > 20) history.shift();
        if (undoButton) undoButton.hidden = false;
    };
    const restore = (state) => {
        view = state.view;
        lastView = state.lastView;
        groups = [...state.groups];
        tags = [...state.tags];
        sort = ORDER_IDS.includes(state.sort) ? state.sort : "alpha";
        syncOrder?.(sort);
        sortShelf(scope, sort);
        writeSharedTags(tags, page);
        syncGroupChips();
        syncTagChips();
        syncStatuses();
        if (undoButton) undoButton.hidden = !history.length;
        applyFilters();
        showFilterToast("Last filter undone");
    };
    const undo = () => {
        const previous = history.pop();
        if (previous) restore(previous);
    };
    document.addEventListener("keydown", (event) => {
        if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "z") return;
        if (event.target instanceof Element && event.target.closest("input, textarea, [contenteditable]")) return;
        if (document.querySelector("dialog[open]")) return;
        if (scope !== (document.querySelector("main:not([hidden])") || scope)) return;
        event.preventDefault();
        undo();
    });

    const setView = (id) => {
        view = id;
        if (id !== "toolbox") lastView = id;
        syncGroupChips();
        syncStatuses();
        applyFilters();
    };

    const applyFilters = () => {
        let shown = 0;
        const flat = view === "all";
        const toolbox = view === "toolbox";
        codeBox.hidden = toolbox;
        // Toolbox is a separate view: the shelf hides but the filters stay put.
        if (knowledge) knowledge.hidden = !(flat || view === "grouped" || toolbox);
        if (tagFilters) tagFilters.hidden = toolbox;
        codeBox.classList.toggle("flat", flat);
        codeBox.querySelectorAll(".group").forEach((group) => {
            let inGroup = 0;
            group.querySelectorAll(".card").forEach((c) => {
                const match = matchesAll(groupsOf(c), groups, GROUP_MATCH)
                    && matchesAll(JSON.parse(c.dataset.tags), tags, TAG_MATCH);
                c.hidden = !match;
                if (match) inGroup++;
            });
            group.hidden = inGroup === 0;
            group.classList.toggle("filtered", !flat && groups.length > 0);
            shown += inGroup;
        });
        codeBox.querySelector(".empty").hidden = shown > 0;
        codeBox.querySelector(".all-head").hidden = shown === 0;
        syncViewShortcuts(scope, view);
        refreshFilterCounts(scope, countItems, { view, groups, groupsOf, tags });
        updateEmptyActions(codeBox, { shown, onUndo: undo });
        if (undoButton) undoButton.hidden = !history.length;
        const filtered = groups.length > 0 || tags.length > 0 || view !== "all";
        syncReset?.(filtered);
        updateFilterFeedback(result, clearButton, shown, total, filtered, toolbox);
        if (toolbox) announceFilters(scope, `Toolbox · ${toolboxCount} ${toolboxCount === 1 ? "item" : "items"}`);
        else {
            const parts = [];
            const category = categoryLabel();
            const tagStatus = filterStatusLabel(tags, TAG_MATCH);
            if (category && category !== "All") parts.push(category);
            if (tagStatus !== "All") parts.push(tagStatus);
            announceFilters(scope, `${parts.join(" · ") || "All"} · ${shown} ${shown === 1 ? "project" : "projects"}`);
        }
        writeFilterState(scope, { view, groups, tags, sort });
    };

    groupPanel?.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-group]");
        if (!button) return;
        const id = button.dataset.group;
        if (button.getAttribute("aria-disabled") === "true" && !groups.includes(id)) return;
        pushHistory();
        if (id === "grouped") {
            setView(view === "grouped" ? "all" : "grouped");
            return;
        }
        if (groups.includes(id)) groups = groups.filter((g) => g !== id);
        else groups = [...groups, id];
        syncGroupChips();
        syncStatuses();
        applyFilters();
    });
    wireViewShortcuts(scope, {
        toolbox: () => { pushHistory(); setView("toolbox"); },
        projects: () => { pushHistory(); setView(lastView); }
    });

    tagPanel?.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-tag]");
        if (!button) return;
        const tag = button.dataset.tag;
        if (button.getAttribute("aria-disabled") === "true" && !tags.includes(tag)) return;
        pushHistory();
        if (tags.includes(tag)) tags = tags.filter((t) => t !== tag);
        else tags = [...tags, tag];
        writeSharedTags(tags, page);
        syncTagChips();
        syncStatuses();
        applyFilters();
    });

    const clearFilters = () => {
        pushHistory();
        view = "all";
        lastView = "all";
        groups = [];
        tags = [];
        sort = "alpha";
        syncOrder?.("alpha");
        sortShelf(scope, "alpha");
        writeSharedTags([], page);
        syncGroupChips();
        syncTagChips();
        syncStatuses();
        applyFilters();
        showFilterToast("Filters cleared");
    };
    clearButton?.addEventListener("click", clearFilters);
    codeBox.querySelector(".empty")?.addEventListener("click", (event) => {
        if (event.target.closest(".empty-reset")) clearFilters();
    });

    const saved = readFilterState(scope);
    if (saved) {
        view = saved.view;
        groups = saved.groups;
        tags = saved.tags;
        sort = saved.sort;
        if (view !== "toolbox") lastView = view;
    } else {
        const shared = readSharedTags();
        const allowed = new Set([...(tagPanel?.querySelectorAll("button[data-tag]") || [])].map((b) => b.dataset.tag));
        if (shared?.tags?.length && shared.from !== page) {
            tags = shared.tags.filter((tag) => allowed.has(tag));
            if (tags.length) showFilterToast(`${tags.map(tagLabel).join(", ")} kept from ${sharedPageNames[shared.from] || "another page"}`);
        }
    }
    syncGroupChips();
    syncTagChips();
    syncOrder?.(sort);
    sortShelf(scope, sort);
    syncStatuses();
    applyFilters();
}

// Card covers are 16:9 boxes, but the source images keep their own proportions.
// Show any non-16:9 cover whole over its blurred copy; Art keeps its focal crop.
function fitCardCover(img) {
    const box = img.closest(".media");
    if (!box || box.classList.contains("contain") || img.closest('[data-zone="art"]')) return;
    if (!img.complete || !img.naturalWidth) {
        img.addEventListener("load", () => fitCardCover(img), { once: true });
        return;
    }
    const ratio = img.naturalWidth / img.naturalHeight;
    if (Math.abs(ratio - 16 / 9) > 0.02) box.classList.add("contain");
}
document.querySelectorAll(".card-cover").forEach(fitCardCover);

// Games, Art and Audio: both menus combine categories and tags.
document.querySelectorAll("[data-group-filter]").forEach((box) => {
    const scope = box.closest("main") || document;
    const groups = [...box.querySelectorAll(".group[data-group]")];
    const tabs = scope.querySelector("[data-section-tabs]");
    const sheet = scope.querySelector(".filter-bar .filter-sheet");
    const knowledge = scope.querySelector(".knowledge");
    if (!groups.length || !tabs) return;
    const categoryStatus = scope.querySelector("[data-category-status]");
    setFilterStatus(categoryStatus, categoryStatus.textContent);
    const items = [...box.querySelectorAll("[data-item]")];
    items.forEach((item, i) => { item.dataset.sortIndex = i; });
    box.insertAdjacentHTML("afterbegin", allHead());
    const count = (group) => group.querySelectorAll("[data-item]").length;
    const total = groups.reduce((sum, group) => sum + count(group), 0);
    const toolboxCount = knowledge ? knowledge.querySelectorAll("li").length : 0;
    setViewShortcutTitles(scope, total, toolboxCount);
    const options = groups.map((group) => ({
        id: group.dataset.group,
        title: group.querySelector("h2")?.textContent || group.dataset.group,
        count: count(group)
    }));
    tabs.innerHTML = `<legend>Category</legend>` +
        `<div class="category-chips">` +
        options.map((option) => `<button type="button" data-group="${esc(option.id)}" aria-pressed="false">${esc(option.title)}<span class="count">${option.count}</span></button>`).join("") +
        `</div><div class="category-view"><span class="category-view-label" aria-hidden="true">View</span>` +
        `<button type="button" data-group="grouped" aria-pressed="false" title="Restores the section headings">Grouped</button></div>`;
    labelFilterCounts(scope);
    keepFilterPanelInView(scope.querySelector(".filter-bar .combined-filters"));

    const tagsOf = (item) => {
        try { return JSON.parse(item.dataset.tags || "[]"); } catch { return []; }
    };
    const tagFilters = scope.querySelector(".filter-bar .tag-filters");
    const filters = tagFilters?.querySelector(".filters");
    const filterStatus = scope.querySelector("[data-filter-status]");
    setFilterStatus(filterStatus, filterStatus?.textContent);
    buildTagFilters(filters, filterPageKey(scope), items, tagsOf);

    let view = "all";
    let activeGroups = [];
    let tags = [];
    let sort = "alpha";
    let lastView = "all";
    const result = ensureFilterResult(scope);
    const clearButton = ensureFilterClear(scope);
    const page = filterPageKey(scope);
    const groupsOf = (item) => [item.closest(".group")?.dataset.group].filter(Boolean);
    const groupLabel = (id) => {
        const button = tabs.querySelector(`button[data-group="${id}"]`);
        return button ? buttonLabel(button) : "All";
    };
    const categoryLabel = () => {
        let selected = joinedLabel(activeGroups.map(groupLabel), GROUP_MATCH, "categories");
        if (view === "grouped" && selected !== "All") selected = `Grouped + ${selected}`;
        else if (view === "grouped") selected = "Grouped";
        else if (view === "toolbox" && selected !== "All") selected = `Toolbox + ${selected}`;
        else if (view === "toolbox") selected = "Toolbox";
        return selected;
    };

    const groupPanel = scope.querySelector(".filter-bar .group-filters .filters");
    ensureFilterSearch(sheet, (query) => applyFilterSearch(sheet, query));
    const { syncOrder, syncReset } = ensurePanelTools(sheet, (id) => {
        sort = ORDER_IDS.includes(id) ? id : "alpha";
        applyFilters();
    }, () => clearFilters());
    ensureCopyLink(scope);

    const syncGroupChips = () => {
        tabs.querySelectorAll("button[data-group]").forEach((b) => {
            const id = b.dataset.group;
            b.setAttribute("aria-pressed", String(id === "grouped" ? view === "grouped" : activeGroups.includes(id)));
        });
    };
    const syncTagChips = () => {
        filters?.querySelectorAll("button[data-tag]").forEach((b) => {
            b.setAttribute("aria-pressed", String(tags.includes(b.dataset.tag)));
        });
    };
    const syncStatuses = () => {
        setFilterStatus(categoryStatus, categoryLabel());
        setFilterStatus(filterStatus, filterStatusLabel(tags, TAG_MATCH));
        setCombinedFilterStatus(scope, categoryLabel(), filterStatusLabel(tags, TAG_MATCH));
    };

    const history = [];
    const undoButton = ensureFilterUndo(scope, () => undo());
    const snapshot = () => ({ view, lastView, groups: [...activeGroups], tags: [...tags], sort });
    const pushHistory = () => {
        history.push(snapshot());
        if (history.length > 20) history.shift();
        if (undoButton) undoButton.hidden = false;
    };
    const restore = (state) => {
        view = state.view;
        lastView = state.lastView;
        activeGroups = [...state.groups];
        tags = [...state.tags];
        sort = ORDER_IDS.includes(state.sort) ? state.sort : "alpha";
        syncOrder?.(sort);
        sortShelf(scope, sort);
        writeSharedTags(tags, page);
        syncGroupChips();
        syncTagChips();
        syncStatuses();
        if (undoButton) undoButton.hidden = !history.length;
        applyFilters();
        showFilterToast("Last filter undone");
    };
    const undo = () => {
        const previous = history.pop();
        if (previous) restore(previous);
    };
    document.addEventListener("keydown", (event) => {
        if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "z") return;
        if (event.target instanceof Element && event.target.closest("input, textarea, [contenteditable]")) return;
        if (document.querySelector("dialog[open]")) return;
        if (scope !== (document.querySelector("main:not([hidden])") || scope)) return;
        event.preventDefault();
        undo();
    });

    const setView = (id) => {
        view = id;
        if (id !== "toolbox") lastView = id;
        syncGroupChips();
        syncStatuses();
        applyFilters();
    };

    const applyFilters = () => {
        let shown = 0;
        const flat = view === "all";
        const toolbox = view === "toolbox";
        box.hidden = toolbox;
        if (knowledge) knowledge.hidden = !(flat || view === "grouped" || toolbox);
        if (tagFilters) tagFilters.hidden = toolbox;
        box.classList.toggle("flat", flat);
        groups.forEach((group) => {
            const groupItems = items.filter((item) => group.contains(item));
            let inGroup = 0;
            groupItems.forEach((item) => {
                const match = matchesAll(groupsOf(item), activeGroups, GROUP_MATCH)
                    && matchesAll(tagsOf(item), tags, TAG_MATCH);
                item.hidden = !match;
                if (match) inGroup++;
            });
            group.hidden = inGroup === 0;
            group.classList.toggle("filtered", !flat && activeGroups.length > 0);
            shown += inGroup;
        });
        box.querySelector(".empty")?.toggleAttribute("hidden", shown > 0);
        box.querySelector(".all-head")?.toggleAttribute("hidden", shown === 0);
        syncViewShortcuts(scope, view);
        refreshFilterCounts(scope, items, { view, groups: activeGroups, groupsOf, tags });
        updateEmptyActions(box, { shown, onUndo: undo });
        if (undoButton) undoButton.hidden = !history.length;
        const filtered = activeGroups.length > 0 || tags.length > 0 || view !== "all";
        syncReset?.(filtered);
        updateFilterFeedback(result, clearButton, shown, total, filtered, toolbox);
        if (toolbox) announceFilters(scope, `Toolbox · ${toolboxCount} ${toolboxCount === 1 ? "item" : "items"}`);
        else {
            const parts = [];
            const category = categoryLabel();
            const tagStatus = filterStatusLabel(tags, TAG_MATCH);
            if (category && category !== "All") parts.push(category);
            if (tagStatus !== "All") parts.push(tagStatus);
            announceFilters(scope, `${parts.join(" · ") || "All"} · ${shown} ${shown === 1 ? "project" : "projects"}`);
        }
        writeFilterState(scope, { view, groups: activeGroups, tags, sort });
    };

    groupPanel?.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-group]");
        if (!button) return;
        const id = button.dataset.group;
        if (button.getAttribute("aria-disabled") === "true" && !activeGroups.includes(id)) return;
        pushHistory();
        if (id === "grouped") {
            setView(view === "grouped" ? "all" : "grouped");
            return;
        }
        if (activeGroups.includes(id)) activeGroups = activeGroups.filter((g) => g !== id);
        else activeGroups = [...activeGroups, id];
        syncGroupChips();
        syncStatuses();
        applyFilters();
    });
    wireViewShortcuts(scope, {
        toolbox: () => { pushHistory(); setView("toolbox"); },
        projects: () => { pushHistory(); setView(lastView); }
    });

    filters?.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-tag]");
        if (!button) return;
        const tag = button.dataset.tag;
        if (button.getAttribute("aria-disabled") === "true" && !tags.includes(tag)) return;
        pushHistory();
        if (tags.includes(tag)) tags = tags.filter((t) => t !== tag);
        else tags = [...tags, tag];
        writeSharedTags(tags, page);
        syncTagChips();
        syncStatuses();
        applyFilters();
    });

    const clearFilters = () => {
        pushHistory();
        view = "all";
        lastView = "all";
        activeGroups = [];
        tags = [];
        sort = "alpha";
        syncOrder?.("alpha");
        sortShelf(scope, "alpha");
        writeSharedTags([], page);
        syncGroupChips();
        syncTagChips();
        syncStatuses();
        applyFilters();
        showFilterToast("Filters cleared");
    };
    clearButton?.addEventListener("click", clearFilters);
    box.querySelector(".empty")?.addEventListener("click", (event) => {
        if (event.target.closest(".empty-reset")) clearFilters();
    });

    const saved = readFilterState(scope);
    if (saved) {
        view = saved.view;
        activeGroups = saved.groups;
        tags = saved.tags;
        sort = saved.sort;
        if (view !== "toolbox") lastView = view;
    } else {
        const shared = readSharedTags();
        const allowed = new Set([...(filters?.querySelectorAll("button[data-tag]") || [])].map((b) => b.dataset.tag));
        if (shared?.tags?.length && shared.from !== page) {
            tags = shared.tags.filter((tag) => allowed.has(tag));
            if (tags.length) showFilterToast(`${tags.map(tagLabel).join(", ")} kept from ${sharedPageNames[shared.from] || "another page"}`);
        }
    }
    syncGroupChips();
    syncTagChips();
    syncOrder?.(sort);
    sortShelf(scope, sort);
    syncStatuses();
    applyFilters();
});

decorateGroupHeads();

// Media carousels: image, video and any extra view can be browsed on each card.
/* The detail hero advances itself in a loop: trailers play to the end, stills
   rest for a few seconds, and only the pause control stops the tour. */
const AUTO_IMAGE_MS = 4500;
let auto = { box: null, frame: 0, elapsed: 0, last: 0, paused: false, done: false };
let autoReady = false;
let autoPausedByUser = false;

function autoBar(box, ratio) {
    const bar = box?.querySelector(".media-progress");
    if (bar) bar.style.setProperty("--progress", Math.min(1, Math.max(0, ratio)));
}

function autoButton(box, mode) {
    const button = box?.querySelector("[data-autoplay]");
    if (!button) return;
    const paused = mode !== "pause";
    button.classList.toggle("is-paused", paused);
    button.setAttribute("aria-label", mode === "replay"
        ? "Replay automatic slides"
        : paused ? "Resume automatic slides" : "Pause automatic slides");
    button.setAttribute("aria-pressed", String(!paused));
}

function stopAuto() {
    autoPausedByUser = false;
    if (auto.box) auto.box.classList.remove("auto-paused", "auto-done", "auto-video");
    if (auto.frame) cancelAnimationFrame(auto.frame);
    auto = { box: null, frame: 0, elapsed: 0, last: 0, paused: false, done: false };
}

function pauseAuto() {
    if (!auto.box || auto.paused) return;
    auto.paused = true;
    if (auto.frame) cancelAnimationFrame(auto.frame);
    auto.frame = 0;
    auto.box.classList.add("auto-paused");
    autoButton(auto.box, "play");
}

function resumeAuto() {
    if (!auto.box) return;
    if (!auto.paused && auto.frame) return;
    autoPausedByUser = false;
    if (auto.done) {
        startAuto(auto.box);
        return;
    }
    auto.paused = false;
    auto.last = performance.now();
    auto.box.classList.remove("auto-paused");
    autoButton(auto.box, "pause");
    auto.frame = requestAnimationFrame(autoTick);
}

function startAuto(box) {
    stopAuto();
    autoReady = false;
    auto = { box, frame: 0, elapsed: 0, last: performance.now(), paused: false, done: false };
    box.classList.remove("auto-paused", "auto-done", "auto-video");
    autoButton(box, "pause");
    autoBar(box, 0);
    auto.frame = requestAnimationFrame(autoTick);
    requestAnimationFrame(() => { autoReady = true; });
}

function advanceAuto() {
    const box = auto.box;
    if (!box) return false;
    const slides = [...box.querySelectorAll("[data-media-slide]")];
    if (!slides.length) return false;
    // The tour loops: after the last slide it starts again from the first.
    const next = (Number(box.dataset.mediaIndex || 0) + 1) % slides.length;
    if (next === Number(box.dataset.mediaIndex || 0) && slides[next].tagName === "VIDEO") {
        slides[next].currentTime = 0;
        slides[next].play().catch(() => {});
    }
    setMedia(box, next);
    auto.elapsed = 0;
    auto.last = performance.now();
    return true;
}

function autoTick(now) {
    if (!auto.box || !projectDialog.open || imageDialog.open) {
        pauseAuto();
        return;
    }
    const box = auto.box;
    auto.elapsed += now - auto.last;
    auto.last = now;
    const active = box.querySelector("[data-media-slide]:not([hidden])");
    if (!active) {
        stopAuto();
        return;
    }
    let advance = false;
    if (active.tagName === "VIDEO" && !active.error && !active.ended && active.readyState > 0) {
        // Keep the video badges hidden even when the reader pauses playback,
        // but let the tour continue on its timer instead of freezing forever.
        box.classList.add("auto-video");
        if (active.paused) {
            autoBar(box, Math.min(1, auto.elapsed / AUTO_IMAGE_MS));
            if (auto.elapsed >= AUTO_IMAGE_MS) advance = true;
        } else {
            autoBar(box, active.duration > 0 ? active.currentTime / active.duration : 0);
        }
    } else {
        box.classList.remove("auto-video");
        autoBar(box, Math.min(1, auto.elapsed / AUTO_IMAGE_MS));
        if (auto.elapsed >= AUTO_IMAGE_MS) advance = true;
    }
    if (advance && !advanceAuto()) return;
    auto.frame = requestAnimationFrame(autoTick);
}

function setMedia(box, index, manual = false) {
    const slides = [...box.querySelectorAll("[data-media-slide]")];
    if (!slides.length) return;
    const next = (index + slides.length) % slides.length;
    const current = slides.find((slide) => !slide.hidden);
    if (current && current !== slides[next] && current.tagName === "VIDEO") {
        current.pause();
        if (current.readyState > 0) current.currentTime = 0;
    }
    slides.forEach((slide, i) => {
        slide.hidden = i !== next;
        if (slide.hasAttribute("data-media-open")) slide.tabIndex = slide.hidden ? -1 : 0;
    });
    const active = slides[next];
    box.dataset.mediaIndex = String(next);
    if (manual && auto.box === box) {
        auto.elapsed = 0;
        auto.done = false;
        box.classList.remove("auto-done");
    }
    if (auto.box === box) {
        auto.elapsed = 0;
        auto.last = performance.now();
        autoBar(box, 0);
        // Arriving at a new slide restarts the tour, even if the video was
        // paused or the tour was stopped while the previous slide was zoomed.
        if (manual && projectDialog.open && !imageDialog.open && (auto.paused || !auto.frame)) {
            resumeAuto();
        }
    }
    if (manual) box.dataset.mediaManual = "true";
    const navSlides = slides;
    const count = box.querySelector(".media-count");
    if (count) {
        count.hidden = false;
        const pos = navSlides.indexOf(active);
        count.textContent = `${Math.max(pos, 0) + 1} / ${navSlides.length}`;
    }
    if (active.tagName === "IMG") {
        const src = active.currentSrc || active.src;
        if (src) {
            const url = `url("${src.replace(/"/g, '\\"')}")`;
            box.style.setProperty("--cover", url);
            const backdrop = box.querySelector(".media-backdrop");
            if (backdrop) backdrop.style.backgroundImage = url;
        }
    }
    if (active.tagName === "VIDEO") {
        if (!active.src) active.src = active.dataset.src;
        active.play().catch(() => {});
    }
}

function stepMedia(box, step) {
    const slides = [...box.querySelectorAll("[data-media-slide]")];
    if (!slides.length) return;
    setMedia(box, Number(box.dataset.mediaIndex || 0) + step, box.classList.contains("dialog-media"));
}

document.addEventListener("click", (event) => {
    const arrow = event.target.closest("[data-media-step]");
    if (!arrow) return;
    const box = arrow.closest("[data-media-carousel]");
    if (box) stepMedia(box, Number(arrow.dataset.mediaStep));
});

document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-autoplay]");
    if (!button) return;
    const box = button.closest(".dialog-media");
    if (!box || auto.box !== box) return;
    event.stopPropagation();
    if (auto.done) {
        setMedia(box, 0);
        startAuto(box);
    } else if (auto.paused) resumeAuto();
    else {
        autoPausedByUser = true;
        pauseAuto();
    }
});

// Full-size image viewer opened from a card or from the project dialog.
const imageDialog = document.createElement("dialog");
imageDialog.className = "image-lightbox";
imageDialog.setAttribute("aria-label", "Enlarged image");
imageDialog.innerHTML = `<span class="lightbox-backdrop" aria-hidden="true"></span>
    <div class="lightbox-stage">
        <button type="button" class="lightbox-close" data-image-close aria-label="Close enlarged image"><svg class="dialog-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
        <button type="button" class="dialog-arrow lightbox-arrow lightbox-prev" data-image-step="-1" aria-label="Previous image"><svg class="dialog-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4 7 12l8 8"/></svg></button>
        <img class="lightbox-image" alt="" role="button" tabindex="0" aria-label="Close enlarged image" data-image-close>
        <video class="lightbox-video" controls muted loop playsinline hidden aria-label="Enlarged video"></video>
        <button type="button" class="dialog-arrow lightbox-arrow lightbox-next" data-image-step="1" aria-label="Next image"><svg class="dialog-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4 17 12l-8 8"/></svg></button>
        <p class="lightbox-count" aria-live="polite"></p>
    </div>`;
document.body.appendChild(imageDialog);
let imageOpener = null;
let imageBox = null;
let imageSlides = [];
let imageIndex = 0;
let imageStepped = false;

function startZoomVideo(video) {
    video.play().catch(() => {
        video.addEventListener("loadeddata", () => video.play().catch(() => {}), { once: true });
    });
}

function renderImage() {
    const slide = imageSlides[imageIndex];
    if (!slide) return;
    const isVideo = slide.tagName === "VIDEO";
    const img = imageDialog.querySelector(".lightbox-image");
    const video = imageDialog.querySelector(".lightbox-video");
    const backdrop = imageDialog.querySelector(".lightbox-backdrop");
    const count = imageDialog.querySelector(".lightbox-count");
    const src = slide.currentSrc || slide.src || slide.dataset.src;
    const naturalW = slide.naturalWidth || slide.videoWidth;
    const naturalH = slide.naturalHeight || slide.videoHeight;
    const ratio = naturalW && naturalH ? naturalW / naturalH : 16 / 9;
    imageDialog.style.setProperty("--media-ratio", Math.min(3.2, Math.max(0.45, ratio)).toFixed(4));

    if (isVideo) {
        img.hidden = true;
        img.removeAttribute("src");
        video.hidden = false;
        if (video.getAttribute("src") !== src) {
            video.pause();
            video.src = src;
            video.load();
            startZoomVideo(video);
        } else if (video.paused) {
            startZoomVideo(video);
        }
        backdrop.style.backgroundImage = "none";
    } else {
        video.pause();
        video.hidden = true;
        video.removeAttribute("src");
        video.load();
        img.hidden = false;
        if (slide.naturalWidth && slide.naturalHeight) {
            img.setAttribute("width", slide.naturalWidth);
            img.setAttribute("height", slide.naturalHeight);
        } else {
            img.removeAttribute("width");
            img.removeAttribute("height");
        }
        img.src = src;
        img.alt = slide.alt || "";
        backdrop.style.backgroundImage = `url("${src.replace(/"/g, "%22")}")`;
    }

    count.textContent = `${imageIndex + 1} / ${imageSlides.length}`;
    // The enlarged video has its own controls; a slide counter would only
    // duplicate the badge already hidden on the video inside the sheet.
    count.hidden = imageSlides.length < 2 || isVideo;
    imageDialog.querySelectorAll("[data-image-step]").forEach((button) => {
        button.hidden = imageSlides.length < 2;
    });
}

async function openImage(opener, box, slide) {
    pauseAuto();
    imageSlides = [...box.querySelectorAll("[data-media-slide]")];
    if (!imageSlides.length) return;
    imageIndex = Math.max(imageSlides.indexOf(slide), 0);
    imageOpener = slide;
    imageBox = box;
    imageStepped = false;
    const zone = slide.closest("[data-zone]")?.dataset.zone || document.body.dataset.zone || "";
    imageDialog.style.setProperty("--card-accent", zone ? `var(--zone-${zone})` : "var(--zone-accent)");
    if (slide.tagName === "IMG") {
        await Promise.race([
            slide.decode().catch(() => {}),
            new Promise((resolve) => setTimeout(resolve, 250))
        ]);
    }
    renderImage();
    imageOpener.focus({ preventScroll: true });
    imageDialog.showModal();
}

document.addEventListener("click", async (event) => {
    const slide = event.target.closest("[data-media-open]");
    if (!slide || slide.hidden) return;
    // A tap aimed at the sheet's X must not fall through to the image zoom.
    const sheet = document.querySelector(".project-dialog");
    if (sheet?.open && slide.closest(".dialog-media")) {
        const close = sheet.querySelector(".dialog-close-form")?.getBoundingClientRect();
        if (close && event.clientX >= close.left - 8 && event.clientX <= close.right + 8 &&
            event.clientY >= close.top - 8 && event.clientY <= close.bottom + 8) return;
    }
    // Native video controls own the bottom strip; tapping there must not zoom.
    if (slide.tagName === "VIDEO" && slide.controls) {
        const rect = slide.getBoundingClientRect();
        if (event.clientY > rect.bottom - 48) return;
    }
    const box = slide.closest("[data-media-carousel]");
    if (!box) return;
    await openImage(slide, box, slide);
});

document.addEventListener("keydown", async (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const slide = event.target.closest?.("[data-media-open]");
    if (!slide || slide.hidden) return;
    // Space belongs to the native video controls.
    if (slide.tagName === "VIDEO" && event.key === " ") return;
    event.preventDefault();
    const box = slide.closest("[data-media-carousel]");
    if (!box) return;
    await openImage(slide, box, slide);
});

function stepZoom(step) {
    if (imageSlides.length < 2) return;
    imageIndex = (imageIndex + step + imageSlides.length) % imageSlides.length;
    imageStepped = true;
    renderImage();
}

imageDialog.addEventListener("click", (event) => {
    if (event.target === imageDialog) {
        imageDialog.close();
        return;
    }
    const step = event.target.closest("[data-image-step]");
    if (step) {
        stepZoom(Number(step.dataset.imageStep));
        return;
    }
    if (event.target.closest("[data-image-close]")) imageDialog.close();
});

imageDialog.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && event.target.closest?.("[data-image-close]")) {
        event.preventDefault();
        imageDialog.close();
        return;
    }
    if (event.key === "ArrowLeft") {
        event.preventDefault();
        stepZoom(-1);
    }
    if (event.key === "ArrowRight") {
        event.preventDefault();
        stepZoom(1);
    }
});

/* A horizontal touch swipe steps through the same slides as the arrows. Touch
   events are handled directly so mobile Safari and Chrome behave the same.
   Vertical scrolling stays with the browser; only a decided horizontal move
   is used, and the click that follows it is swallowed. */
let swipeState = null;
let clickSuppressedUntil = 0;
const SWIPE_MIN = 44;

function clearClickSuppression() {
    clickSuppressedUntil = 0;
}

/* A real tap produces a click after touchend, sometimes hundreds of ms later on
   iOS. Suppress that one click, but clear it as soon as a new touch begins. */
document.addEventListener("click", (event) => {
    if (Date.now() >= clickSuppressedUntil) return;
    clickSuppressedUntil = 0;
    event.preventDefault();
    event.stopPropagation();
}, true);

function swipeTarget(el, clientY) {
    if (!el || typeof el.closest !== "function") return null;
    if (el.closest(".media-arrow, .dialog-step, .lightbox-close, .lightbox-arrow")) return null;

    const stage = el.closest(".image-lightbox .lightbox-stage");
    if (stage && imageDialog.open) {
        const video = imageDialog.querySelector(".lightbox-video");
        if (!video.hidden) {
            const rect = video.getBoundingClientRect();
            if (clientY > rect.bottom - 48) return null;
        }
        return { kind: "zoom", el: stage };
    }

    const card = el.closest(".media-open");
    if (card) return { kind: "card", el: card };

    const box = el.closest("[data-media-carousel]");
    if (!box) {
        if (projectDialog.open && el.closest(".project-dialog")
            && !el.closest("a, button, input, textarea, select, video, audio, .dialog-scrollbar")) {
            return { kind: "project", el: projectDialog };
        }
        return null;
    }
    const video = el.closest("video[data-media-slide]");
    if (video && video.controls) {
        const rect = video.getBoundingClientRect();
        if (clientY > rect.bottom - 48) return null;
    }
    return { kind: "carousel", el: box };
}

function beginSwipe(el, id, x, y) {
    if (swipeState) return;
    clearClickSuppression();
    const target = swipeTarget(el, y);
    if (!target) return;
    swipeState = { ...target, id, x, y, active: false };
}

function moveSwipe(id, x, y, event) {
    if (!swipeState || swipeState.id !== id) return;
    const dx = x - swipeState.x;
    const dy = y - swipeState.y;
    if (!swipeState.active && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        swipeState.active = true;
    }
    if (swipeState.active && event.cancelable) event.preventDefault();
}

function endSwipe(id, x, y) {
    if (!swipeState || swipeState.id !== id) return;
    const state = swipeState;
    swipeState = null;
    if (!state.active) return;
    const dx = x - state.x;
    const dy = y - state.y;
    if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    clickSuppressedUntil = Date.now() + 500;
    if (state.kind === "card") return;
    const step = dx < 0 ? 1 : -1;
    if (state.kind === "project") stepProject(step);
    else if (state.kind === "zoom") stepZoom(step);
    else stepMedia(state.el, step);
}

document.addEventListener("touchstart", (event) => {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    beginSwipe(event.target, touch.identifier, touch.clientX, touch.clientY);
}, { passive: true });

document.addEventListener("touchmove", (event) => {
    if (!swipeState) return;
    const touch = [...event.touches].find((item) => item.identifier === swipeState.id);
    if (touch) moveSwipe(swipeState.id, touch.clientX, touch.clientY, event);
}, { passive: false });

document.addEventListener("touchend", (event) => {
    if (!swipeState) return;
    const touch = [...event.changedTouches].find((item) => item.identifier === swipeState.id);
    if (touch) endSwipe(swipeState.id, touch.clientX, touch.clientY);
});

document.addEventListener("touchcancel", (event) => {
    if (swipeState && [...event.changedTouches].some((item) => item.identifier === swipeState.id)) {
        swipeState = null;
    }
});

document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseAuto();
});

// A transient focus must not light up the card it belongs to, whether it comes
// from a closed viewer or from pressing arrow keys over an already focused control.
function quietFocus(target) {
    if (!target || target.classList.contains("focus-quiet")) return;
    target.classList.add("focus-quiet");
    target.addEventListener("blur", () => target.classList.remove("focus-quiet"), { once: true });
}

function restoreFocusSafely(target) {
    if (!target) return;
    quietFocus(target);
    target.focus({ preventScroll: true });
}

document.addEventListener("keydown", (event) => {
    if (event.key.startsWith("Arrow")) quietFocus(document.activeElement);
});

imageDialog.addEventListener("close", () => {
    const video = imageDialog.querySelector(".lightbox-video");
    video.pause();
    video.removeAttribute("src");
    video.load();
    // Whatever was last shown in the zoom becomes the image in the sheet behind it.
    const chosen = imageSlides[imageIndex];
    if (imageStepped && imageBox?.isConnected && chosen?.isConnected) {
        setMedia(imageBox, imageIndex);
        imageOpener = chosen;
    }
    imageBox = null;
    imageStepped = false;
    // Closing the viewer returns to the tour unless the reader paused it
    // explicitly with the button.
    if (!autoPausedByUser && auto.box && projectDialog.open && (auto.paused || !auto.frame)) {
        resumeAuto();
    }
    // The slide can be hidden by the auto tour while zoomed. Return focus to a
    // stable control inside the sheet so arrow keys still change projects.
    const returnTo = projectDialog.open
        ? projectDialog.querySelector(".dialog-close")
        : imageOpener;
    requestAnimationFrame(() => restoreFocusSafely(returnTo));
});

// Short muted previews: show the video slide while a card is hovered or focused.
document.querySelectorAll(".card, .game").forEach((el) => {
    const box = el.querySelector("[data-media-carousel]");
    if (!box) return;
    const slides = [...box.querySelectorAll("[data-media-slide]")];
    const videoIndex = slides.findIndex((slide) => slide.tagName === "VIDEO");
    if (videoIndex < 0) return;
    // Hover always brings the video back, even after using the image arrows.
    const preview = () => setMedia(box, videoIndex);
    const cover = () => setMedia(box, Number(box.dataset.mediaRest || 0));
    el.addEventListener("pointerenter", preview);
    el.addEventListener("pointerleave", cover);
    // Clicking a carousel arrow focuses it; that must not pull focus back to the video.
    el.addEventListener("focusin", (event) => {
        if (!event.target.closest(".media-arrow")) preview();
    });
    el.addEventListener("focusout", (e) => {
        if (!el.contains(e.relatedTarget)) cover();
    });
});
document.querySelectorAll(".audio-card").forEach((el) => {
    const box = el.querySelector(".audio-cover");
    const video = box && box.querySelector("video");
    if (!video) return;
    const start = () => {
        if (!video.src) video.src = video.dataset.src;
        video.play().then(() => box.classList.add("playing")).catch(() => {});
    };
    const stop = () => {
        box.classList.remove("playing");
        video.pause();
    };
    el.addEventListener("pointerenter", start);
    el.addEventListener("pointerleave", stop);
    el.addEventListener("focusin", start);
    el.addEventListener("focusout", (e) => {
        if (!el.contains(e.relatedTarget)) stop();
    });
});

// Project details: click a card (or its Details button) to see the full project.
const projectsById = new Map([...(window.PROJECTS || []), homeArtProject].map((p) => [p.id, p]));
(window.AUDIO_ITEMS || []).forEach((a) => {
    projectsById.set(a.id, {
        id: a.id,
        isAudio: true,
        title: a.title,
        meta: a.meta,
        summary: a.summary,
        tags: a.tags || [],
        image: a.cover,
        coverVideo: a.coverVideo,
        preview: a.preview,
        tracks: a.tracks || [],
        extra: a.extra,
        links: a.link ? [{ kind: "view", label: "See it on Games", url: new URL(a.link, siteBase).href }] : []
    });
});
// Art gallery pieces get the same detail sheet as the Home art card.
document.querySelectorAll(".gallery [data-cover]").forEach((button) => {
    const li = button.closest("li");
    const img = button.querySelector("img");
    if (!li || !img) return;
    const id = `art-${button.dataset.cover}`;
    const caption = li.querySelector("figcaption")?.cloneNode(true);
    caption?.querySelector("strong")?.remove();
    projectsById.set(id, {
        id,
        kind: "art",
        title: li.querySelector("figcaption strong")?.textContent.trim() || img.alt,
        meta: li.closest(".group")?.querySelector("h2")?.textContent.trim() || "Art",
        summary: caption?.textContent.trim() || "",
        tags: JSON.parse(li.dataset.tags || "[]"),
        image: (img.dataset.full || img.getAttribute("src")).replace(/^\.\.\//, ""),
        alt: img.alt,
        contain: true
    });
    li.dataset.project = id;
});

const projectDialog = document.createElement("dialog");
projectDialog.className = "project-dialog";
projectDialog.setAttribute("aria-label", "Project details");
// The close button stays on the sheet, not in the scrolling content, so it
// remains in the same spot however far the details are scrolled.
const dialogClose = `<form method="dialog" class="dialog-close-form"><button type="submit" class="dialog-close" autofocus aria-label="Close project details"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></form>`;
const dialogPager = `<div class="dialog-pager" role="group" aria-label="Project navigation">
        <button type="button" class="dialog-step" data-dialog-step="-1" aria-label="Previous project"><svg class="dialog-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4 7 12l8 8"/></svg></button>
        <span class="dialog-counter" aria-live="polite"></span>
        <button type="button" class="dialog-step" data-dialog-step="1" aria-label="Next project"><svg class="dialog-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4 17 12l-8 8"/></svg></button>
    </div>`;
const shareLabel = canNativeShare() ? "Share" : "Copy link";
const shareTitle = canNativeShare() ? "Share this project" : "Copy a link to this project (C)";
const dialogTools = `<div class="dialog-tools">
        <button type="button" class="button ghost small dialog-copy" data-dialog-copy title="${shareTitle}" aria-label="${shareTitle}"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><use href="#share"></use></svg><span class="dialog-copy-label">${shareLabel}</span></button>
        ${dialogPager}
        <span class="visually-hidden" data-copy-status aria-live="polite"></span>
    </div>`;
projectDialog.innerHTML = `${dialogClose}
    <div class="dialog-scroll"><div class="dialog-content"></div></div>
    <div class="dialog-scrollbar" aria-hidden="true"><span></span></div>`;
document.body.appendChild(projectDialog);
const dialogScroll = projectDialog.querySelector(".dialog-scroll");
const dialogScrollbar = projectDialog.querySelector(".dialog-scrollbar");
const dialogThumb = dialogScrollbar.firstElementChild;
const scrollRange = () => Math.max(0, dialogScroll.scrollHeight - dialogScroll.clientHeight);

// A thin bar drawn over the edge: no reserved gutter, so the pager never shifts.
function updateDialogScrollbar() {
    const range = scrollRange();
    dialogScrollbar.hidden = range < 2;
    if (range < 2) return;
    const travel = dialogScrollbar.clientHeight;
    const thumbHeight = Math.max(28, Math.round(travel * dialogScroll.clientHeight / dialogScroll.scrollHeight));
    dialogThumb.style.height = `${thumbHeight}px`;
    dialogThumb.style.top = `${Math.round((dialogScroll.scrollTop / range) * (travel - thumbHeight))}px`;
}

dialogScroll.addEventListener("scroll", updateDialogScrollbar, { passive: true });
dialogScroll.addEventListener("load", updateDialogScrollbar, true);
window.addEventListener("resize", updateDialogScrollbar);

let dragScroll = null;
dialogScrollbar.addEventListener("pointerdown", (event) => {
    const range = scrollRange();
    if (range < 2) return;
    event.preventDefault();
    dialogScrollbar.setPointerCapture(event.pointerId);
    const rect = dialogScrollbar.getBoundingClientRect();
    const travel = rect.height - dialogThumb.offsetHeight;
    if (!event.target.closest(".dialog-scrollbar span")) {
        const ratio = (event.clientY - rect.top - dialogThumb.offsetHeight / 2) / travel;
        dialogScroll.scrollTop = Math.min(1, Math.max(0, ratio)) * range;
    }
    dragScroll = { y: event.clientY, top: dialogScroll.scrollTop, range, travel };
});
dialogScrollbar.addEventListener("pointermove", (event) => {
    if (!dragScroll) return;
    dialogScroll.scrollTop = Math.min(dragScroll.range,
        Math.max(0, dragScroll.top + (event.clientY - dragScroll.y) / dragScroll.travel * dragScroll.range));
});
const endDrag = () => { dragScroll = null; };
dialogScrollbar.addEventListener("pointerup", endDrag);
dialogScrollbar.addEventListener("pointercancel", endDrag);
let dialogOpener = null;
let dialogOrder = [];
let dialogIndex = 0;

const renderProject = (index, mediaIndex = 0) => {
    stopAuto();
    const p = projectsById.get(dialogOrder[index]);
    if (!p) return;
    dialogIndex = index;
    projectDialog.dataset.zone = p.isAudio ? "audio" : p.id === "home-art" ? "art" : p.kind || "code";
    // Keep the sound bar above the modal dialog while the sheet is open.
    if (soundBar.parentElement !== projectDialog) projectDialog.appendChild(soundBar);
    projectDialog.querySelectorAll("[data-media-carousel] video").forEach((video) => video.pause());
    const hasTracks = p.tracks?.length > 0;
    const trackList = hasTracks
        ? `<div class="dialog-tracks" aria-label="Tracks">${p.tracks.map((t, i) => `
            <div class="track-row" data-track-row data-track="${i}">
                <span class="track-num">${String(i + 1).padStart(2, "0")}</span>
                <button type="button" class="track-trigger" data-track="${i}" aria-label="Play ${esc(t.title)}"><svg class="icon" aria-hidden="true"><use href="#play"></use></svg></button>
                <span class="track-name">${esc(t.title)}</span>
            </div>`).join("")}</div>`
        : "";
    const preview = !hasTracks && p.preview
        ? (/\.mp4$/.test(p.preview)
            ? `<video class="dialog-preview" controls loop preload="none" src="${esc(asset(p.preview))}">Your browser can't play this video.</video>`
            : `<audio class="dialog-preview" controls preload="none" src="${esc(asset(p.preview))}">Your browser can't play this audio.</audio>`)
        : "";
    const note = !hasTracks && !p.preview && p.isAudio
        ? `<p class="track-note">The audio files for this folder are not added yet.</p>`
        : "";
    // The player is the point of an audio sheet, so it spans the whole card.
    const playerBlock = hasTracks
        ? `<section class="dialog-block dialog-player-block"><h3>Tracks</h3>${trackList}</section>`
        : preview
            ? `<section class="dialog-block dialog-player-block"><h3>Preview</h3>${preview}</section>`
            : "";
    const extras = !hasTracks && !preview && note
        ? `<section class="dialog-block">${note}</section>`
        : "";
    const slideIndex = Math.min(Math.max(mediaIndex, 0), Math.max(mediaItems(p, true).length - 1, 0));
    const hero = media(p, true, slideIndex);
    const focusedBefore = document.activeElement;
    const keepDialogFocus = projectDialog.contains(focusedBefore);
    const focusStep = focusedBefore?.dataset?.dialogStep;
    const tagMain = window.__routePages?.[zonePageKey(p)] || document.querySelector("main:not([hidden])");
    const activeTags = new Set([...tagMain.querySelectorAll(".tag-filters button[data-tag][aria-pressed='true']")]
        .map((button) => button.dataset.tag).filter((tag) => tag !== "all"));
    const related = relatedProjects(p);
    const relatedBlock = related.length
        ? `<section class="dialog-block dialog-related"><h3>Related</h3><ul>${related.map((q) => `
            <li><button type="button" class="related-link" data-related-project="${esc(q.id)}" title="Open ${esc(q.title)}" aria-label="Open ${esc(q.title)}">${esc(q.title)}<svg class="icon" aria-hidden="true"><use href="#arrow"></use></svg></button></li>`).join("")}</ul></section>`
        : "";
    const content = projectDialog.querySelector(".dialog-content");
    content.innerHTML = `
        ${hero ? `<div class="dialog-hero">${hero}</div>` : ""}
        <div class="dialog-heading">
            <div class="dialog-title">
                <h2>${esc(p.title)}</h2>
                <p class="meta">${meta(p)}</p>
            </div>
            ${dialogTools}
        </div>
        <div class="dialog-body">
            <section class="dialog-block dialog-overview">
                <h3>Overview</h3>
                ${p.summary ? `<p class="summary">${esc(p.summary)}</p>` : ""}
                ${p.role ? `<p class="role" title="${esc(p.role)}"><span class="role-label">My contribution:</span> ${esc(p.role)}</p>` : ""}
            </section>
            <div class="dialog-side">
                ${p.tags?.length ? `<section class="dialog-block"><h3>Tags</h3>${tags(p, activeTags)}</section>` : ""}
                ${extras}
            </div>
        </div>
        ${playerBlock}
        ${p.links?.length ? `<nav class="dialog-links" aria-label="Links for ${esc(p.title)}">${actions(p)}</nav>` : ""}
        ${relatedBlock}`;
    dialogScroll.scrollTop = 0;
    requestAnimationFrame(() => {
        dialogScroll.scrollTop = 0;
        updateDialogScrollbar();
    });
    const dialogMedia = projectDialog.querySelector("[data-media-carousel]");
    if (dialogMedia) {
        setMedia(dialogMedia, slideIndex);
        startAuto(dialogMedia);
    }
    projectDialog.querySelector(".dialog-counter").textContent = `${index + 1} / ${dialogOrder.length}`;
    projectDialog.querySelector(".dialog-pager").hidden = dialogOrder.length < 2;
    [-1, 1].forEach((step) => {
        const neighbor = (index + step + dialogOrder.length) % dialogOrder.length;
        const title = projectsById.get(dialogOrder[neighbor])?.title || (step < 0 ? "Previous project" : "Next project");
        const button = projectDialog.querySelector(`[data-dialog-step="${step}"]`);
        const verb = step < 0 ? "Previous" : "Next";
        button.setAttribute("aria-label", `${verb} project: ${title}`);
        button.title = `${verb}: ${title} (←/→)`;
    });
    // Re-rendering removes the focused control; keep arrow navigation alive.
    if (keepDialogFocus && projectDialog.open) {
        const nextFocus = projectDialog.querySelector(
            focusStep ? `[data-dialog-step="${focusStep}"]` : ".dialog-close"
        );
        if (nextFocus) restoreFocusSafely(nextFocus);
    }
    if (hasTracks) {
        const rows = [...projectDialog.querySelectorAll("[data-track-row]")];
        const onTrack = (i) => rows.forEach((row, j) => row.classList.toggle("is-current", j === i));
        const openTrack = (i) => playPlaylist(p.tracks, i, {
            meta: p.title,
            cover: p.image || p.cover,
            target: itemPage(p),
            itemId: p.id,
            kind: p.kind || "",
            isAudio: !!p.isAudio,
            onTrack
        });
        rows.forEach((row, i) => row.addEventListener("click", () => {
            if (i === playlistIndex && soundKey === asset(p.tracks[i].src) && !soundPlayer.paused) {
                soundPlayer.pause();
                return;
            }
            openTrack(i);
        }));
    }
    const card = [...document.querySelectorAll("[data-project]")].find((el) => el.dataset.project === p.id);
    if (card && (!dialogOpener || !dialogOpener.isConnected)) dialogOpener = card;
};

// Stepping swaps the sheet in place: no slide, no staged exit.
const stepProject = (delta) => {
    if (dialogOrder.length < 2) return;
    renderProject((dialogIndex + delta + dialogOrder.length) % dialogOrder.length, 0);
};

projectDialog.addEventListener("click", (event) => {
    if (event.target === projectDialog) projectDialog.close();
    const arrow = event.target.closest("[data-dialog-step]");
    if (arrow) stepProject(Number(arrow.dataset.dialogStep));
});
const keepsAutoTour = "[data-autoplay], [data-media-step], [data-media-open]";
projectDialog.addEventListener("pointerdown", (event) => {
    if (!autoReady || !auto.box || !event.target.closest(".dialog-media")) return;
    if (event.target.closest(keepsAutoTour)) return;
    pauseAuto();
});
projectDialog.addEventListener("focusin", (event) => {
    if (!autoReady || !auto.box || !event.target.closest(".dialog-media")) return;
    if (event.target.closest(keepsAutoTour)) return;
    pauseAuto();
});
// Play/pause do not bubble, so listen in capture: restarting a video brings the
// tour back with it, like stepping to the next slide does.
projectDialog.addEventListener("play", (event) => {
    const video = event.target;
    if (!video.matches?.("[data-media-slide]")) return;
    const box = video.closest("[data-media-carousel]");
    if (!box || auto.box !== box || imageDialog.open) return;
    if (auto.paused || !auto.frame) resumeAuto();
}, true);
projectDialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
        event.preventDefault();
        stepProject(-1);
    }
    if (event.key === "ArrowRight") {
        event.preventDefault();
        stepProject(1);
    }
    if (event.key.toLowerCase() === "c" && !event.ctrlKey && !event.metaKey && !event.altKey) {
        if (event.target instanceof Element && event.target.closest("input, textarea, [contenteditable]")) return;
        event.preventDefault();
        projectDialog.querySelector("[data-dialog-copy]")?.click();
    }
});
projectDialog.addEventListener("close", () => {
    dialogScroll.scrollTop = 0;
    stopAuto();
    soundOnTrack = null;
    if (soundBar.parentElement === projectDialog) document.body.appendChild(soundBar);
    projectDialog.querySelectorAll("[data-media-carousel] video").forEach((video) => video.pause());
    const target = dialogOpener?.matches(".audio-art")
        ? dialogOpener.parentElement.querySelector(".audio-open")
        : dialogOpener?.querySelector("[data-open-project]") || dialogOpener;
    requestAnimationFrame(() => restoreFocusSafely(target));
});

// A link from the player can land on the exact item page and open its sheet.
const openItemById = (id) => {
    if (!id || !projectsById.has(id)) return false;
    const opener = [...document.querySelectorAll("[data-project], [data-open-audio]")]
        .find((el) => (el.dataset.project || el.dataset.openAudio) === id && !el.closest("main[hidden]"));
    if (!opener) return false;
    const scope = opener.closest("[data-featured], [data-code], [data-games], [data-audio], [data-group-filter]") || document;
    dialogOrder = [...new Set([...scope.querySelectorAll("[data-project]")]
        .filter((el) => !el.hidden)
        .map((el) => el.dataset.project))];
    let index = dialogOrder.indexOf(id);
    if (index < 0) {
        dialogOrder = [id];
        index = 0;
    }
    dialogOpener = opener;
    const mediaBox = opener.closest("[data-project], .audio-art")?.querySelector("[data-media-carousel]");
    renderProject(index, mediaBox ? Number(mediaBox.dataset.mediaIndex || 0) : 0);
    opener.scrollIntoView({ block: "center" });
    if (!projectDialog.open) {
        projectDialog.showModal();
        dialogScroll.scrollTop = 0;
    }
    requestAnimationFrame(() => {
        dialogScroll.scrollTop = 0;
        updateDialogScrollbar();
    });
    return true;
};

function canNativeShare() {
    return typeof navigator.share === "function" && !!window.matchMedia?.("(pointer: coarse)").matches;
}

function zonePageKey(p) {
    if (p?.isAudio) return "music";
    if (p?.kind === "game") return "games";
    if (p?.kind === "art") return "art";
    return "code";
}

function activePageKey() {
    const main = document.querySelector("main:not([hidden])");
    return Object.keys(window.__routePages || {}).find((key) => window.__routePages[key] === main) || "";
}

function filterButtonForTag(tag, pageKey) {
    const main = window.__routePages?.[pageKey];
    return [...(main?.querySelectorAll("button[data-tag]") || [])].find((button) => button.dataset.tag === tag);
}

// A tag in the sheet uses the very same control as the filter panel, so counts,
// chips, URLs and undo stay in step. From Home it first opens the zone page.
function applyDialogTag(tag, p) {
    const pageKey = zonePageKey(p);
    const apply = () => {
        const main = window.__routePages?.[pageKey];
        const projectsView = main?.querySelector('[data-view-shortcut="projects"]');
        if (projectsView && projectsView.getAttribute("aria-pressed") === "false") projectsView.click();
        const button = filterButtonForTag(tag, pageKey);
        if (!button) {
            showFilterToast(`${tagLabel(tag)} is not available here`);
            return;
        }
        const wasActive = button.getAttribute("aria-pressed") === "true";
        button.click();
        showFilterToast(`${wasActive ? "Removed" : "Filtered by"} ${tagLabel(tag)}${wasActive ? " filter" : ""}`);
    };
    projectDialog.close();
    if (activePageKey() === pageKey) {
        apply();
        return;
    }
    const link = [...document.querySelectorAll(".site-nav a[href]")]
        .find((a) => new URL(a.href, location.href).pathname.includes(`/${pageKey}/`));
    if (!link) return;
    window.addEventListener("routechange", apply, { once: true });
    link.click();
}

// Related items come from the shelf already open, so each one has a real card
// to return to when its sheet replaces the current one.
function relatedProjects(p) {
    const mine = p.tags || [];
    return [...new Set(dialogOrder)]
        .filter((id) => id !== p.id)
        .map((id) => projectsById.get(id))
        .filter((q) => q?.tags?.length)
        .map((q) => ({ q, score: q.tags.filter((tag) => mine.includes(tag)).length }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score || a.q.title.localeCompare(b.q.title))
        .slice(0, 3)
        .map((entry) => entry.q);
}

// A direct link keeps the current shelf and its filters, adding only ?open=.
function directProjectUrl(p) {
    const url = new URL(location.href);
    if (url.protocol === "file:" && url.hash.startsWith("#/")) {
        const [route, rawQuery = ""] = url.hash.slice(2).split("?");
        const query = new URLSearchParams(rawQuery);
        query.set("open", p.id);
        url.hash = `#/${route}?${query}`;
    } else {
        url.searchParams.set("open", p.id);
    }
    return url.href;
}

async function shareOrCopy(p) {
    const url = directProjectUrl(p);
    if (canNativeShare()) {
        try {
            await navigator.share({ title: p.title, text: p.summary || p.title, url });
            return "Shared.";
        } catch (error) {
            if (error?.name === "AbortError") return "";
        }
    }
    const copied = await copyText(url);
    return copied ? "Link copied." : "Copy failed — copy the URL from the address bar.";
}

const checkIcon = '<path d="m5 12.5 4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>';
const shareUse = '<use href="#share"></use>';
let dialogCopyTimer;
function reportCopyStatus(message) {
    const status = projectDialog.querySelector("[data-copy-status]");
    const button = projectDialog.querySelector("[data-dialog-copy]");
    if (!status || !button) return;
    const label = button.querySelector(".dialog-copy-label");
    const icon = button.querySelector("svg");
    clearTimeout(dialogCopyTimer);
    if (!message) {
        status.textContent = "";
        return;
    }
    const done = message === "Link copied." || message === "Shared.";
    status.textContent = message;
    label.textContent = done ? (message === "Shared." ? "Shared!" : "Copied!") : shareLabel;
    icon.innerHTML = done ? checkIcon : shareUse;
    dialogCopyTimer = setTimeout(() => {
        status.textContent = "";
        label.textContent = shareLabel;
        icon.innerHTML = shareUse;
    }, 2200);
}

projectDialog.addEventListener("click", (event) => {
    if (event.target === projectDialog) {
        const box = projectDialog.getBoundingClientRect();
        const inside = event.clientX >= box.left && event.clientX <= box.right
            && event.clientY >= box.top && event.clientY <= box.bottom;
        if (!inside) projectDialog.close();
        return;
    }
    const p = projectsById.get(dialogOrder[dialogIndex]);
    if (!p) return;
    const tag = event.target.closest("[data-dialog-tag]");
    if (tag) {
        applyDialogTag(tag.dataset.dialogTag, p);
        return;
    }
    const related = event.target.closest("[data-related-project]");
    if (related) {
        openItemById(related.dataset.relatedProject);
        return;
    }
    if (!event.target.closest("[data-dialog-copy]")) return;
    shareOrCopy(p).then(reportCopyStatus);
});

const openIdFromUrl = () => {
    const fromSearch = new URLSearchParams(location.search).get("open");
    if (fromSearch) return fromSearch;
    if (location.hash.startsWith("#/")) {
        const query = location.hash.slice(location.hash.indexOf("?") + 1);
        if (query !== location.hash) return new URLSearchParams(query).get("open");
    }
    return null;
};

const syncOpenParam = () => {
    const id = openIdFromUrl();
    if (id && !projectDialog.open) openItemById(id);
};
window.addEventListener("routechange", syncOpenParam);
syncOpenParam();

document.addEventListener("click", (event) => {
    if (event.target.closest("a, [data-media-step], img[data-media-open], .media-arrow")) return;
    const opener = event.target.closest("[data-open-project], [data-project], [data-open-audio]");
    if (!opener || projectDialog.contains(opener)) return;
    const id = opener.dataset.openProject || opener.dataset.project || opener.dataset.openAudio;
    openItemById(id);
});

// Clipboard helper shared by the contact form and the share page.
// file:// pages often lack the async Clipboard API, so keep the legacy fallback.
function copyFallback(text) {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    // A modal dialog blocks copies from the document body; use its own top layer.
    (projectDialog.open ? projectDialog : document.body).appendChild(field);
    field.focus();
    field.select();
    const copied = document.execCommand("copy");
    field.remove();
    return copied;
}

function copyText(text) {
    return navigator.clipboard?.writeText
        ? navigator.clipboard.writeText(text).then(() => true, () => copyFallback(text))
        : Promise.resolve(copyFallback(text));
}

// Contact form: copy the message so it works without an email app installed.
const form = document.getElementById("contact-form");
if (form) {
    const formStatus = form.querySelector("[data-form-status]");
    const report = (copied, links) => {
        formStatus.replaceChildren();
        formStatus.append(
            copied
                ? "Message copied. "
                : "Your message is selected: press Ctrl+C. "
        );
        formStatus.append("Opening Gmail to send it. If it didn't open, use ");
        Object.entries(links).forEach(([label, href], index, entries) => {
            const link = document.createElement("a");
            link.href = href;
            link.textContent = label;
            if (label !== "your email app") {
                link.target = "_blank";
                link.rel = "noopener noreferrer";
            }
            formStatus.append(link);
            if (index < entries.length - 1) {
                formStatus.append(index < entries.length - 2 ? ", " : " or ");
            }
        });
        formStatus.append(".");
        formStatus.classList.toggle("is-error", !copied);
        if (!copied) {
            form.elements.message.focus();
            form.elements.message.select();
        }
    };
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const name = form.elements.name.value.trim();
        const message = form.elements.message.value.trim();
        const text = `Message from ${name}\n\n${message}`;
        const subject = encodeURIComponent(`Message from ${name}`);
        const body = encodeURIComponent(text);
        const to = "miguelrodriguezgallego1@gmail.com";
        const links = {
            Gmail: `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`,
            Outlook: `https://outlook.live.com/owa/?path=/mail/action/compose&to=${to}&subject=${subject}&body=${body}`,
            "your email app": `mailto:${to}?subject=${subject}&body=${body}`
        };
        copyText(text).then((copied) => report(copied, links));
        window.open(links.Gmail, "_blank", "noopener,noreferrer");
    });
}

// Share page: open the native share sheet on touch devices, otherwise copy the link.
const shareCopy = document.querySelector("[data-copy-link]");
if (shareCopy) {
    const status = document.querySelector("[data-copy-status]");
    let resetTimer;
    const showStatus = (message) => {
        if (!status) return;
        status.textContent = message;
        clearTimeout(resetTimer);
        if (message) {
            resetTimer = setTimeout(() => {
                status.textContent = "";
            }, 2200);
        }
    };
    const copyLink = () => {
        copyText(shareCopy.dataset.copyLink).then((copied) => {
            showStatus(copied ? "Copied!" : "Copy failed — copy the URL from the address bar.");
        });
    };
    shareCopy.addEventListener("click", () => {
        if (!document.documentElement.classList.contains("has-native-share")) {
            copyLink();
            return;
        }
        navigator.share({
            title: shareCopy.dataset.shareTitle,
            text: shareCopy.dataset.shareText,
            url: shareCopy.dataset.copyLink
        }).catch((error) => {
            // Cancelling the sheet is not an error; a real failure falls back to copying.
            if (error?.name !== "AbortError") copyLink();
        });
    });
}

// One quiet entrance for every card already rendered on this page.
enterCards(document);

// Reveal the routed page now that its content is fully rendered.
window.__routeReveal?.();
