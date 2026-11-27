// Renders the projects from data/projects.js and the README images from
// data/project-media.js, plays card previews on hover, filters the Code page
// and opens the Art lightbox and the project details dialog.

const root = document.documentElement.dataset.root || "";

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

const esc = (text) =>
    String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const asset = (path) => (/^https?:/.test(path) ? path : root + path);
const thumbOf = (path) => (window.THUMBS && window.THUMBS[path.replace(/^\.\.\//, "")]) || null;

const tagLabels = {
    "c#": "C#", "c++": "C++", ".net": ".NET", "ai": "AI", "ui": "UI",
    "fps": "FPS", "urp": "URP", "webgl": "WebGL", "3d": "3D"
};
const tagLabel = (tag) => tagLabels[tag] || tag.replace(/\b\w/g, (c) => c.toUpperCase());

function keepFilterPanelInView(menu) {
    const panel = menu?.querySelector(".filters");
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
}

// Opening one menu closes the other so both panels never overlap.
function linkFilterMenus() {
    const menus = [...document.querySelectorAll(".filter-bar .filter-menu")];
    menus.forEach((menu) => {
        menu.addEventListener("toggle", () => {
            if (!menu.open) return;
            menus.forEach((other) => { if (other !== menu) other.open = false; });
        });
    });
}

// The count span is not part of the visible menu label.
const buttonLabel = (button) => button.firstChild?.textContent.trim() || button.textContent.trim();

linkFilterMenus();

// A small icon gives each category its own identity without adding numbers.
const groupIcons = {
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
    if (p.image) items.push({ kind: "image", src: asset(cover), alt: p.alt || p.title });
    const video = p.video || p.coverVideo;
    if (video) items.push({ kind: "video", src: asset(video), alt: `Video preview of ${p.title}` });
    if (p.extra) items.push({ kind: "image", src: asset(p.extra), alt: `Another view of ${p.title}` });
    const readme = (window.PROJECT_MEDIA && window.PROJECT_MEDIA[p.id]) || [];
    for (const item of readme) {
        const src = asset(item.src);
        if (items.some((existing) => existing.src === src)) continue;
        items.push({ kind: "image", src, alt: item.alt || `Another view of ${p.title}` });
    }
    return items;
}

function media(p, dialog = false, index = 0, withActions = false) {
    const items = mediaItems(p, dialog);
    if (!items.length) return "";
    const slides = items.map((item, i) => {
        const hidden = i === index ? "" : " hidden";
        if (item.kind === "video") {
            const label = dialog ? `Enlarge video: ${esc(item.alt)}` : esc(item.alt);
            const open = dialog ? " data-media-open" : "";
            return `<video data-media-slide${hidden}${open} data-src="${esc(item.src)}" muted loop playsinline${dialog ? " controls" : ""} preload="none" aria-label="${label}"></video>`;
        }
        const zoomable = dialog && item.kind === "image";
        return `<img data-media-slide${hidden}${zoomable ? ` data-media-open role="button" tabindex="-1" aria-label="Enlarge image: ${esc(item.alt || p.title)}"` : ""} src="${esc(item.src)}" alt="${esc(item.alt)}" loading="lazy" decoding="async" width="1200" height="750">`;
    }).join("");
    const mediaZoom = dialog && items.some((item) => item.kind === "video")
        ? `<button type="button" class="media-zoom" data-media-zoom hidden aria-label="Enlarge video"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 4.5 4.5"/></svg></button>`
        : "";
    const controls = `${items.length < 2 ? "" : `
        <button type="button" class="media-arrow media-prev" data-media-step="-1" aria-label="Previous media of ${esc(p.title)}"><svg class="media-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4 7 12l8 8"/></svg></button>
        <button type="button" class="media-arrow media-next" data-media-step="1" aria-label="Next media of ${esc(p.title)}"><svg class="media-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4 17 12l-8 8"/></svg></button>
        <span class="media-count" aria-live="polite">${index + 1} / ${items.length}</span>`}`;
    return `<div class="media${dialog ? " dialog-media" : ""}${p.contain ? " contain" : ""}" data-media-carousel data-media-index="${index}" style="--cover: url('${esc(items[0].src)}')">
        <span class="media-backdrop" style="background-image: url('${esc(items[0].src)}')" aria-hidden="true"></span>
        ${slides}${controls}${mediaZoom}${!dialog && withActions ? `<button type="button" class="media-open" data-open-project="${esc(p.id)}" aria-label="Details of ${esc(p.title)}"></button>` : ""}
    </div>`;
}

function meta(p) {
    if (p.meta) return esc(p.meta);
    return [p.team, p.year].filter(Boolean).map(esc).join(", ");
}

function tags(p) {
    return `<ul class="tags" aria-label="Technologies">${p.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;
}

const linkIcons = { play: "play", itch: "itch", video: "youtube", source: "github", download: "download" };
const linkOrder = { play: 0, itch: 1, source: 2, video: 3, download: 4 };
const orderedLinks = (p) => [...(p.links || [])].sort((a, b) => (linkOrder[a.kind] ?? 9) - (linkOrder[b.kind] ?? 9));

// Cards show at most three technologies; the full list lives in the dialog.
function cardTags(p) {
    const tags = p.tags || [];
    if (!tags.length) return "";
    const chips = tags.slice(0, 3).map((t) => `<li>${esc(t)}</li>`);
    if (tags.length > 3) chips.push(`<li class="tag-more">+${tags.length - 3}</li>`);
    return `<ul class="tags card-tags" aria-label="Technologies">${chips.join("")}</ul>`;
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
        return `<li><a class="button ghost" href="${esc(link.url)}" title="${esc(link.label)}" aria-label="${esc(link.label)} (${esc(p.title)})">${icon}${esc(label)}</a></li>`;
    });
    return `<ul class="actions">${items.join("")}</ul>`;
}

function card(p) {
    const search = p.tags.map((t) => t.toLowerCase());
    return `<li class="card" data-project="${esc(p.id)}" data-zone="${esc(p.kind || "code")}" data-tags="${esc(JSON.stringify(search))}">
        ${media(p, false, 0, true)}
        <h3>${esc(p.title)}</h3>
        ${cardTags(p)}
        ${cardLinks(p)}
    </li>`;
}

function gameRow(p) {
    const search = p.tags.map((t) => t.toLowerCase());
    return `<article class="game" id="${esc(p.id)}" data-project="${esc(p.id)}" data-item data-tags="${esc(JSON.stringify(search))}">
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
    return `<li class="audio-card" data-item>
        <div class="audio-art audio-cover" data-open-audio="${esc(a.id)}" style="--cover: url('${esc(asset(cover))}')">
            <span class="audio-backdrop" aria-hidden="true"></span>
            <img src="${esc(asset(cover))}" alt="" loading="lazy" decoding="async" width="600" height="600">${video}
        </div>
        <button type="button" class="audio-open" data-project="${esc(a.id)}" aria-label="Details of ${esc(a.title)}">
            <span class="audio-title">${esc(a.title)}</span>
            <span class="audio-meta">${esc(a.meta)}</span>
        </button>
    </li>`;
}

// Home: one card per zone, illustrated with the first matching item in the data.
// The artwork opens that item's details; the bottom link opens the zone filtered.
function zoneCard(p, zone) {
    const icon = groupIcons[zone.icon] || "";
    return `<li class="zone-item">
        <p class="zone-label zone-${esc(zone.icon)}"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${icon}</svg><span>${esc(zone.label)}</span></p>
        <article class="card zone-card" data-project="${esc(p.id)}" data-zone="${esc(zone.icon)}">
            ${media(p, false, 0, true)}
            <h3>${esc(p.title)}</h3>
            ${cardTags(p)}
            <a class="button ghost small zone-link" href="${esc(zone.href)}">${esc(zone.cta)}<svg class="icon" aria-hidden="true"><use href="#arrow"></use></svg></a>
        </article>
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
    tags: ["Illustrator", "Character design"],
    image: "assets/art/cowboy-digital.webp",
    alt: "Digital illustration of a green-skinned cowboy firing a revolver at sunset",
    contain: true,
    links: [{ kind: "view", label: "See all art", url: root + "art/index.html" }]
};

document.querySelectorAll("[data-featured]").forEach((list) => {
    const projects = window.PROJECTS || [];
    const games = projects.find((p) => p.kind === "game");
    const engine = projects.find((p) => p.kind === "code" && /engine/i.test(p.title) && (p.groups || [p.group]).includes("engines"));
    const audio = (window.AUDIO_ITEMS || [])[0];
    const cards = [];
    if (games) {
        cards.push(zoneCard(games, {
            label: "Games",
            icon: "game",
            href: root + "games/index.html",
            cta: "View all games"
        }));
    }
    if (engine) {
        cards.push(zoneCard(engine, {
            label: "Code",
            icon: "code",
            context: "Engines, graphics and AI projects.",
            href: root + "code/index.html",
            cta: "View Code"
        }));
    }
    cards.push(zoneCard(homeArtProject, {
        label: "Art",
        icon: "art",
        context: "Digital art, pixel art and 3D models.",
        href: root + "art/index.html",
        cta: "View Art"
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
            href: root + "music/index.html",
            cta: "View Audio"
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
    }).join("") + `<p class="empty" hidden>Nothing with that combination yet.</p>`;
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
    <img class="soundbar-cover" alt="" width="48" height="48" hidden>
    <div class="soundbar-info">
        <strong class="soundbar-title"></strong>
        <span class="soundbar-meta"><span data-sound-meta></span><span class="soundbar-count" hidden></span></span>
    </div>
    <div class="soundbar-controls">
        <button type="button" class="soundbar-skip" data-sound-step="-1" aria-label="Previous track"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 5 8 12l10 7z"/></svg></button>
        <button type="button" class="soundbar-toggle" aria-label="Play">
            <svg class="icon soundbar-play" aria-hidden="true"><use href="#play"></use></svg>
            <svg class="icon soundbar-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>
        </button>
        <button type="button" class="soundbar-skip" data-sound-step="1" aria-label="Next track"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5l10 7L6 19z"/></svg></button>
    </div>
    <input class="soundbar-progress" type="range" min="0" max="100" value="0" step="0.1" aria-label="Seek">
    <span class="soundbar-time">0:00</span>
    <button type="button" class="soundbar-close" aria-label="Close player">&times;</button>
    <audio class="soundbar-player" preload="none"></audio>`;
document.body.appendChild(soundBar);

const soundPlayer = soundBar.querySelector(".soundbar-player");
const soundToggle = soundBar.querySelector(".soundbar-toggle");
const soundProgress = soundBar.querySelector(".soundbar-progress");
const soundTime = soundBar.querySelector(".soundbar-time");
let playlist = [];

// The player floats above the page or the details sheet. Reserve its real
// height so the last track can always be scrolled out from under it.
const syncSoundbarSpace = () => {
    if (soundBar.hidden) {
        document.documentElement.style.removeProperty("--soundbar-space");
        return;
    }
    const space = Math.ceil(soundBar.getBoundingClientRect().height + 24);
    document.documentElement.style.setProperty("--soundbar-space", `${space}px`);
};
window.addEventListener("resize", syncSoundbarSpace);
let playlistIndex = 0;
let soundKey = "";
let soundOnTrack = null;

const soundPlaying = (on) => {
    soundBar.classList.toggle("is-playing", on);
    soundToggle.setAttribute("aria-label", on ? "Pause" : "Play");
};

const hideSoundBar = () => {
    soundPlayer.pause();
    soundBar.hidden = true;
    soundKey = "";
    playlist = [];
    soundOnTrack = null;
    soundBar.classList.remove("has-queue");
    soundPlaying(false);
    syncSoundbarSpace();
};

const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return "0:00";
    const all = Math.floor(seconds);
    return `${Math.floor(all / 60)}:${String(all % 60).padStart(2, "0")}`;
};

const setTrackInfo = (track, index) => {
    soundBar.querySelector(".soundbar-title").textContent = track.title || "";
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
    soundBar.classList.toggle("has-queue", playlist.length > 1);
};

const playPlaylistIndex = (index) => {
    if (index < 0 || index >= playlist.length) {
        hideSoundBar();
        return;
    }
    playlistIndex = index;
    const track = playlist[index];
    const url = asset(track.src);
    soundPlayer.pause();
    soundKey = url;
    soundPlayer.src = url;
    setTrackInfo(track, index);
    soundProgress.value = "0";
    soundTime.textContent = "0:00";
    soundBar.hidden = false;
    syncSoundbarSpace();
    soundPlayer.play().then(() => soundPlaying(true)).catch(() => soundPlaying(false));
    soundOnTrack?.(index);
};

const playPlaylist = (tracks, index = 0, context = {}) => {
    if (!tracks?.length) return;
    playlist = tracks.map((track) => ({
        src: track.src,
        title: track.title,
        meta: track.meta || context.meta || "",
        cover: track.cover || context.cover || ""
    }));
    soundOnTrack = context.onTrack || null;
    playPlaylistIndex(Math.min(Math.max(index, 0), playlist.length - 1));
};

soundToggle.addEventListener("click", () => {
    if (soundPlayer.paused) soundPlayer.play().catch(() => soundPlaying(false));
    else soundPlayer.pause();
});
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
soundPlayer.addEventListener("play", () => soundPlaying(true));
soundPlayer.addEventListener("pause", () => soundPlaying(false));
soundPlayer.addEventListener("timeupdate", () => {
    const ratio = soundPlayer.duration ? soundPlayer.currentTime / soundPlayer.duration : 0;
    soundProgress.value = String(ratio * 100);
    soundTime.textContent = formatTime(soundPlayer.currentTime);
});
soundPlayer.addEventListener("ended", () => playPlaylistIndex(playlistIndex + 1));
soundProgress.addEventListener("input", () => {
    if (soundPlayer.duration) soundPlayer.currentTime = soundPlayer.duration * Number(soundProgress.value) / 100;
});

// Code page: category bar as the main filter, technology tags as a refinement.
const codeBox = document.querySelector("[data-code]");
if (codeBox) {
    const [gamesGroup, ...otherGroups] = window.PROJECT_GROUPS;
    const orderedGroups = [...otherGroups, gamesGroup];
    const projectGroups = (p) => p.groups || (p.group ? [p.group] : []);
    const projectsIn = (g) => window.PROJECTS.filter((p) => (g.id === "games" ? p.kind === "game" : projectGroups(p).includes(g.id)));

    codeBox.innerHTML = orderedGroups.map((g) => {
        const items = projectsIn(g);
        if (!items.length) return "";
        return `<section class="group" data-group="${esc(g.id)}" aria-labelledby="group-${g.id}">
            <div class="group-head">
                <h2 id="group-${g.id}">${esc(g.title)}</h2>
                <p class="group-intro">${esc(g.intro)}</p>
            </div>
            <ul class="cards">${items.map(card).join("")}</ul>
        </section>`;
    }).join("") + `<p class="empty" hidden>Nothing with that combination yet.</p>`;

    const tabs = document.querySelector("[data-group-tabs]");
    const categoryMenu = document.querySelector(".filter-bar .group-filters");
    if (tabs) {
        const options = [{ id: "all", title: "All", count: orderedGroups.reduce((sum, g) => sum + projectsIn(g).length, 0) },
            ...orderedGroups.map((g) => ({ id: g.id, title: g.title, count: projectsIn(g).length }))];
        const legend = esc(tabs.dataset.legend || "Show one category");
        tabs.innerHTML = `<legend class="visually-hidden">${legend}</legend>` +
            options.map((g) => `<button type="button" data-group="${esc(g.id)}" aria-pressed="${g.id === "all"}">${esc(g.title)} <span class="count">${g.count}</span></button>`).join("");
        keepFilterPanelInView(categoryMenu);
    }

    let activeGroup = "all";
    let activeTag = "all";

    const applyFilters = () => {
        let shown = 0;
        codeBox.querySelectorAll(".group").forEach((group) => {
            const groupMatch = activeGroup === "all" || group.dataset.group === activeGroup;
            group.classList.toggle("filtered", activeGroup !== "all");
            let inGroup = 0;
            group.querySelectorAll(".card").forEach((c) => {
                const tags = JSON.parse(c.dataset.tags);
                const match = groupMatch && (activeTag === "all" || tags.includes(activeTag));
                c.hidden = !match;
                if (match) inGroup++;
            });
            group.hidden = inGroup === 0;
            shown += inGroup;
        });
        codeBox.querySelector(".empty").hidden = shown > 0;
    };
    const categoryStatus = document.querySelector("[data-category-status]");
    tabs?.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-group]");
        if (!button) return;
        activeGroup = button.dataset.group;
        tabs.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
        if (categoryStatus) categoryStatus.textContent = buttonLabel(button);
        applyFilters();
    });

    const filterStatus = document.querySelector("[data-filter-status]");
    const tagFilters = document.querySelector(".filter-bar .tag-filters");
    keepFilterPanelInView(tagFilters);

    document.querySelectorAll(".filter-bar .filters").forEach((filters) => {
        filters.addEventListener("click", (event) => {
            const button = event.target.closest("button[data-tag]");
            if (!button) return;
            activeTag = button.dataset.tag;
            filters.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
            if (filterStatus) filterStatus.textContent = button.textContent;
            applyFilters();
        });
    });

    applyFilters();
}

// Games, Art and Audio: category tabs switch sections; technology refines within them.
document.querySelectorAll("[data-group-filter]").forEach((box) => {
    const groups = [...box.querySelectorAll(".group[data-group]")];
    const tabs = document.querySelector("[data-section-tabs]");
    if (!groups.length || !tabs) return;
    const items = [...box.querySelectorAll("[data-item]")];
    const count = (group) => group.querySelectorAll("[data-item]").length;
    const options = [
        { id: "all", title: "All", count: groups.reduce((sum, group) => sum + count(group), 0) },
        ...groups.map((group) => ({
            id: group.dataset.group,
            title: group.querySelector("h2")?.textContent || group.dataset.group,
            count: count(group)
        }))
    ];
    const legend = esc(tabs.dataset.legend || "Show one category");
    tabs.innerHTML = `<legend class="visually-hidden">${legend}</legend>` +
        options.map((option) => `<button type="button" data-group="${esc(option.id)}" aria-pressed="${option.id === "all"}">${esc(option.title)} <span class="count">${option.count}</span></button>`).join("");
    keepFilterPanelInView(document.querySelector(".filter-bar .group-filters"));

    const tagsOf = (item) => {
        try { return JSON.parse(item.dataset.tags || "[]"); } catch { return []; }
    };
    const tagFilters = document.querySelector(".filter-bar .tag-filters");
    const filters = tagFilters?.querySelector(".filters");
    const filterStatus = tagFilters?.querySelector("[data-filter-status]");
    if (filters) {
        const used = [...new Set(items.flatMap(tagsOf))]
            .sort((a, b) => tagLabel(a).localeCompare(tagLabel(b)));
        filters.innerHTML = `<legend class="visually-hidden">Show items with (within the selected category)</legend>` +
            ["all", ...used].map((tag) => `<button type="button" data-tag="${esc(tag)}" aria-pressed="${tag === "all"}">${esc(tag === "all" ? "All" : tagLabel(tag))}</button>`).join("");
        keepFilterPanelInView(tagFilters);
    }

    let activeGroup = "all";
    let activeTag = "all";

    const applyFilters = () => {
        let shown = 0;
        groups.forEach((group) => {
            const groupMatch = activeGroup === "all" || group.dataset.group === activeGroup;
            const groupItems = items.filter((item) => group.contains(item));
            let inGroup = 0;
            groupItems.forEach((item) => {
                const match = groupMatch && (activeTag === "all" || tagsOf(item).includes(activeTag));
                item.hidden = !match;
                if (match) inGroup++;
            });
            group.hidden = inGroup === 0;
            group.classList.toggle("filtered", activeGroup !== "all");
            shown += inGroup;
        });
        box.querySelector(".empty")?.toggleAttribute("hidden", shown > 0);
    };
    const categoryStatus = document.querySelector("[data-category-status]");
    tabs.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-group]");
        if (!button) return;
        activeGroup = button.dataset.group;
        tabs.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
        if (categoryStatus) categoryStatus.textContent = buttonLabel(button);
        applyFilters();
    });

    filters?.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-tag]");
        if (!button) return;
        activeTag = button.dataset.tag;
        filters.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
        if (filterStatus) filterStatus.textContent = button.textContent;
        applyFilters();
    });

    applyFilters();
});

decorateGroupHeads();

// Media carousels: image, video and any extra view can be browsed on each card.
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
    const zoom = box.querySelector("[data-media-zoom]");
    if (zoom) zoom.hidden = slides[next].tagName !== "VIDEO";
    box.dataset.mediaIndex = String(next);
    if (manual) box.dataset.mediaManual = "true";
    const active = slides[next];
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
    const current = Number(box.dataset.mediaIndex || 0);
    if (box.classList.contains("dialog-media")) {
        setMedia(box, current + step, true);
        return;
    }
    // Every slide, including the looping video/gif preview, stays in the carousel.
    const nextIndex = (current + step + slides.length) % slides.length;
    // Remember the chosen still so leaving the card stops the loop on an image.
    if (slides[nextIndex].tagName === "IMG") box.dataset.mediaRest = String(nextIndex);
    setMedia(box, nextIndex);
}

document.addEventListener("click", (event) => {
    const arrow = event.target.closest("[data-media-step]");
    if (!arrow) return;
    const box = arrow.closest("[data-media-carousel]");
    if (box) stepMedia(box, Number(arrow.dataset.mediaStep));
});

// A dedicated button keeps video zooming reliable under touch controls.
document.addEventListener("click", (event) => {
    const zoom = event.target.closest("[data-media-zoom]");
    if (!zoom) return;
    const box = zoom.closest("[data-media-carousel]");
    const slide = box?.querySelector("[data-media-slide]:not([hidden])");
    if (slide) openImage(slide, box, slide);
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
    </div>
    <div class="lightbox-bar">
        <p aria-live="polite"></p>
    </div>`;
document.body.appendChild(imageDialog);
let imageOpener = null;
let imageSlides = [];
let imageIndex = 0;

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
    const bar = imageDialog.querySelector(".lightbox-bar");
    const src = slide.currentSrc || slide.src || slide.dataset.src;

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

    bar.querySelector("p").textContent = `${imageIndex + 1} / ${imageSlides.length}`;
    bar.hidden = imageSlides.length < 2;
    imageDialog.querySelectorAll("[data-image-step]").forEach((button) => {
        button.hidden = imageSlides.length < 2;
    });
}

async function openImage(opener, box, slide) {
    imageSlides = [...box.querySelectorAll("[data-media-slide]")];
    if (!imageSlides.length) return;
    imageIndex = Math.max(imageSlides.indexOf(slide), 0);
    imageOpener = slide;
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
    if (el.closest(".media-arrow, .media-zoom, .dialog-step, .lightbox-close, .lightbox-arrow")) return null;

    const stage = el.closest(".image-lightbox .lightbox-stage");
    if (stage && imageDialog.open) {
        const video = imageDialog.querySelector(".lightbox-video");
        if (!video.hidden) {
            const rect = video.getBoundingClientRect();
            if (clientY > rect.bottom - 48) return null;
        }
        return { kind: "zoom", el: stage };
    }

    const box = el.closest("[data-media-carousel]");
    if (!box) return null;
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
    const step = dx < 0 ? 1 : -1;
    if (state.kind === "zoom") stepZoom(step);
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
    requestAnimationFrame(() => restoreFocusSafely(imageOpener));
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
        links: a.link ? [{ kind: "view", label: "See it on Games", url: root + a.link }] : []
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
// The close button floats on the image; the project pager sits beside the title.
const dialogClose = `<div class="dialog-image-controls">
        <form method="dialog" class="dialog-close-form"><button type="submit" class="dialog-close" autofocus aria-label="Close project details"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></form>
    </div>`;
const dialogPager = `<div class="dialog-pager" role="group" aria-label="Project navigation">
        <button type="button" class="dialog-step" data-dialog-step="-1" aria-label="Previous project"><svg class="dialog-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4 7 12l8 8"/></svg></button>
        <span class="dialog-counter" aria-live="polite"></span>
        <button type="button" class="dialog-step" data-dialog-step="1" aria-label="Next project"><svg class="dialog-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4 17 12l-8 8"/></svg></button>
    </div>`;
projectDialog.innerHTML = `<div class="dialog-scroll"><div class="dialog-content"></div></div>
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
    projectDialog.querySelector(".dialog-content").innerHTML = `
        ${hero ? `<div class="dialog-hero">${hero}${dialogClose}</div>` : dialogClose}
        <div class="dialog-heading">
            <div class="dialog-title">
                <p class="meta">${meta(p)}</p>
                <h2>${esc(p.title)}</h2>
                ${p.role ? `<p class="role">${esc(p.role)}</p>` : ""}
            </div>
            ${dialogPager}
        </div>
        <div class="dialog-body">
            <section class="dialog-block dialog-overview">
                <h3>Overview</h3>
                ${p.summary ? `<p class="summary">${esc(p.summary)}</p>` : ""}
            </section>
            <div class="dialog-side">
                ${p.tags?.length ? `<section class="dialog-block"><h3>Technologies</h3>${tags(p)}</section>` : ""}
                ${extras}
            </div>
        </div>
        ${playerBlock}
        ${p.links?.length ? `<nav class="dialog-links" aria-label="Links for ${esc(p.title)}">${actions(p)}</nav>` : ""}`;
    dialogScroll.scrollTop = 0;
    requestAnimationFrame(updateDialogScrollbar);
    const dialogMedia = projectDialog.querySelector("[data-media-carousel]");
    if (dialogMedia) setMedia(dialogMedia, slideIndex);
    projectDialog.querySelector(".dialog-counter").textContent = `${index + 1} / ${dialogOrder.length}`;
    projectDialog.querySelector(".dialog-pager").hidden = dialogOrder.length < 2;
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

const stepProject = (delta) => {
    if (dialogOrder.length < 2) return;
    renderProject((dialogIndex + delta + dialogOrder.length) % dialogOrder.length);
};

projectDialog.addEventListener("click", (event) => {
    if (event.target === projectDialog) projectDialog.close();
    const arrow = event.target.closest("[data-dialog-step]");
    if (arrow) stepProject(Number(arrow.dataset.dialogStep));
});
projectDialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
        event.preventDefault();
        stepProject(-1);
    }
    if (event.key === "ArrowRight") {
        event.preventDefault();
        stepProject(1);
    }
});
projectDialog.addEventListener("close", () => {
    soundOnTrack = null;
    if (soundBar.parentElement === projectDialog) document.body.appendChild(soundBar);
    projectDialog.querySelectorAll("[data-media-carousel] video").forEach((video) => video.pause());
    const target = dialogOpener?.matches(".audio-art")
        ? dialogOpener.parentElement.querySelector(".audio-open")
        : dialogOpener?.querySelector("[data-open-project]") || dialogOpener;
    requestAnimationFrame(() => restoreFocusSafely(target));
});

document.addEventListener("click", (event) => {
    if (event.target.closest("a, [data-media-step], img[data-media-open], .media-arrow")) return;
    const opener = event.target.closest("[data-open-project], [data-project], [data-open-audio]");
    if (!opener || projectDialog.contains(opener)) return;
    const id = opener.dataset.openProject || opener.dataset.project || opener.dataset.openAudio;
    if (!projectsById.has(id)) return;
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
    projectDialog.showModal();
    requestAnimationFrame(updateDialogScrollbar);
});

// Clipboard helper shared by the contact form and the share page.
// file:// pages often lack the async Clipboard API, so keep the legacy fallback.
function copyFallback(text) {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
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
