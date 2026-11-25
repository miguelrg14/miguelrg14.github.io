// Renders the projects from data/projects.js, plays card previews on hover,
// filters the Code page and opens the Art lightbox and the project details dialog.

const root = document.documentElement.dataset.root || "";
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const esc = (text) =>
    String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const asset = (path) => (/^https?:/.test(path) ? path : root + path);

function media(p) {
    const video = p.video
        ? `<video muted loop playsinline preload="none" aria-hidden="true" data-src="${esc(asset(p.video))}"></video>`
        : "";
    return `<div class="media${p.contain ? " contain" : ""}">
        <img src="${esc(asset(p.image))}" alt="${esc(p.alt || p.title)}" loading="lazy" width="1200" height="750">${video}
    </div>`;
}

function meta(p) {
    if (p.meta) return esc(p.meta);
    return [p.team, p.year].filter(Boolean).map(esc).join(", ");
}

function tags(p) {
    return `<ul class="tags" aria-label="Technologies">${p.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;
}

function actions(p, size, withDetails = false) {
    const items = p.links.map((link, i) => {
        const icon = link.kind === "play" ? `<svg class="icon" aria-hidden="true"><use href="#play"></use></svg>` : "";
        const style = i === 0 ? "button" : "button ghost";
        return `<li><a class="${style} ${size}" href="${esc(link.url)}">${icon}${esc(link.label)}<span class="visually-hidden"> (${esc(p.title)})</span></a></li>`;
    });
    if (withDetails) {
        items.push(`<li><button type="button" class="button ghost ${size}" data-open-project="${esc(p.id)}">Details<span class="visually-hidden"> of ${esc(p.title)}</span></button></li>`);
    }
    return `<ul class="actions">${items.join("")}</ul>`;
}

function card(p) {
    const search = p.tags.map((t) => t.toLowerCase());
    return `<li class="card" data-project="${esc(p.id)}" data-tags="${esc(JSON.stringify(search))}">
        ${media(p)}
        <h3>${esc(p.title)}</h3>
        <p class="meta">${meta(p)}</p>
        <p class="summary">${esc(p.summary)}</p>
        ${tags(p)}
        ${actions(p, "small", true)}
    </li>`;
}

function gameRow(p) {
    return `<article class="game" id="${esc(p.id)}" data-project="${esc(p.id)}" data-item>
        ${media(p)}
        <div class="game-body">
            <h2>${esc(p.title)}</h2>
            <p class="meta">${meta(p)}</p>
            <p class="role">${esc(p.role)}</p>
            <p class="summary">${esc(p.summary)}</p>
            ${tags(p)}
            ${actions(p, "small", true)}
        </div>
    </article>`;
}

function audioCard(a) {
    const video = a.coverVideo
        ? `<video muted loop playsinline preload="none" aria-hidden="true" data-src="${esc(asset(a.coverVideo))}"></video>`
        : "";
    const play = a.preview
        ? `<button type="button" class="audio-play" data-audio-preview="${esc(asset(a.preview))}" aria-label="Play preview of ${esc(a.title)}" aria-pressed="false"><svg class="icon" aria-hidden="true"><use href="#play"></use></svg></button>`
        : "";
    return `<li class="audio-card" data-item>
        <div class="audio-art audio-cover" data-open-audio="${esc(a.id)}">
            <img src="${esc(asset(a.cover))}" alt="" loading="lazy" width="600" height="600">${video}
            ${play}
        </div>
        <button type="button" class="audio-open" data-project="${esc(a.id)}" aria-label="Details of ${esc(a.title)}">
            <span class="audio-title">${esc(a.title)}</span>
            <span class="audio-meta">${esc(a.meta)}</span>
        </button>
    </li>`;
}

// Home: featured projects.
document.querySelectorAll("[data-featured]").forEach((list) => {
    list.innerHTML = window.PROJECTS.filter((p) => p.featured).map(card).join("");
});

// Games page: grouped by solo/team work, using the Code page's section layout.
document.querySelectorAll("[data-games]").forEach((box) => {
    const games = (window.PROJECTS || []).filter((p) => p.kind === "game");
    const groups = [
        { id: "solo", title: "Solo", intro: "Designed and built on my own.", test: (p) => /solo/i.test(p.team || "") },
        { id: "team", title: "With a team", intro: "Made with other students at ESNE and UDIT.", test: (p) => !/solo/i.test(p.team || "") }
    ];
    box.innerHTML = groups.map((g) => {
        const items = games.filter(g.test);
        if (!items.length) return "";
        return `<section class="group${items.length <= 2 ? " sparse" : ""}" data-group="${g.id}" aria-labelledby="games-${g.id}">
            <div class="group-head">
                <h2 id="games-${g.id}">${g.title}</h2>
                <p class="group-intro">${g.intro}</p>
            </div>
            <div class="games">${items.map(gameRow).join("")}</div>
        </section>`;
    }).join("");
});

// Audio page: small square covers, a preview button and the same group filters.
const audioBox = document.querySelector("[data-audio]");
if (audioBox) {
    const items = window.AUDIO_ITEMS || [];
    audioBox.innerHTML = (window.AUDIO_GROUPS || []).map((g) => {
        const inGroup = items.filter((a) => a.group === g.id);
        if (!inGroup.length) return "";
        const trackCount = inGroup.reduce((sum, a) => sum + (a.tracks?.length || 0), 0);
        const playAll = trackCount > 1
            ? `<button type="button" class="play-all" data-open-audio="playlist-${esc(g.id)}"><svg class="icon" aria-hidden="true"><use href="#play"></use></svg>Play all ${trackCount} tracks</button>`
            : "";
        return `<section class="group${inGroup.length <= 2 ? " sparse" : ""}" data-group="${esc(g.id)}" aria-labelledby="audio-${esc(g.id)}">
            <div class="group-head">
                <h2 id="audio-${esc(g.id)}">${esc(g.title)}</h2>
                <p class="group-intro">${esc(g.intro)}</p>
            </div>
            ${playAll}
            <ul class="audio-grid">${inGroup.map(audioCard).join("")}</ul>
        </section>`;
    }).join("");
}

// One preview at a time; the round button toggles play/pause without opening the details.
const previewPlayer = document.createElement("video");
previewPlayer.preload = "none";
previewPlayer.hidden = true;
document.body.appendChild(previewPlayer);
let previewButton = null;
const stopPreview = () => {
    previewPlayer.pause();
    previewButton?.setAttribute("aria-pressed", "false");
    previewButton = null;
};
document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-audio-preview]");
    if (!button) return;
    if (previewButton === button && !previewPlayer.paused) {
        stopPreview();
        return;
    }
    stopPreview();
    previewPlayer.src = button.dataset.audioPreview;
    previewButton = button;
    button.setAttribute("aria-pressed", "true");
    previewPlayer.play().catch(() => {
        previewButton = null;
        button.setAttribute("aria-pressed", "false");
    });
});

// Code page: category bar as the main filter, technology tags as a refinement.
const codeBox = document.querySelector("[data-code]");
if (codeBox) {
    const [gamesGroup, ...otherGroups] = window.PROJECT_GROUPS;
    const orderedGroups = [...otherGroups, gamesGroup];
    const projectsIn = (g) => window.PROJECTS.filter((p) => (g.id === "games" ? p.kind === "game" : p.group === g.id));

    codeBox.innerHTML = orderedGroups.map((g) => {
        const items = projectsIn(g);
        if (!items.length) return "";
        return `<section class="group${items.length <= 2 ? " sparse" : ""}" data-group="${esc(g.id)}" aria-labelledby="group-${g.id}">
            <div class="group-head">
                <h2 id="group-${g.id}">${esc(g.title)}</h2>
                <p class="group-intro">${esc(g.intro)}</p>
            </div>
            <ul class="cards">${items.map(card).join("")}</ul>
        </section>`;
    }).join("") + `<p class="empty" hidden>Nothing with that combination yet.</p>`;

    const tabs = document.querySelector("[data-group-tabs]");
    if (tabs) {
        const options = [{ id: "all", title: "All", count: window.PROJECTS.length },
            ...orderedGroups.map((g) => ({ id: g.id, title: g.title, count: projectsIn(g).length }))];
        tabs.innerHTML = options.map((g) => `<button type="button" data-group="${esc(g.id)}" aria-pressed="${g.id === "all"}">${esc(g.title)} <span class="count">${g.count}</span></button>`).join("");
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

    tabs?.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-group]");
        if (!button) return;
        activeGroup = button.dataset.group;
        tabs.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
        applyFilters();
    });

    const filterStatus = document.querySelector("[data-filter-status]");
    const tagFilters = document.querySelector(".tag-filters");
    const tagPanel = tagFilters?.querySelector(".filters");
    const keepTagPanelInView = () => {
        if (!tagPanel) return;
        tagPanel.style.transform = "";
        if (!tagFilters.open) return;
        const box = tagPanel.getBoundingClientRect();
        const shift = box.left < 8 ? 8 - box.left : box.right > innerWidth - 8 ? innerWidth - 8 - box.right : 0;
        if (shift) tagPanel.style.transform = `translateX(${shift}px)`;
    };
    tagFilters?.addEventListener("toggle", () => requestAnimationFrame(keepTagPanelInView));
    window.addEventListener("resize", keepTagPanelInView);

    document.querySelectorAll(".filters").forEach((filters) => {
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

// Games, Art and Audio: category tabs switch the grouped sections.
document.querySelectorAll("[data-group-filter]").forEach((box) => {
    const groups = [...box.querySelectorAll(".group[data-group]")];
    const tabs = document.querySelector("[data-section-tabs]");
    if (!groups.length || !tabs) return;
    const count = (group) => group.querySelectorAll("[data-item]").length;
    const options = [
        { id: "all", title: "All", count: groups.reduce((sum, group) => sum + count(group), 0) },
        ...groups.map((group) => ({
            id: group.dataset.group,
            title: group.querySelector("h2")?.textContent || group.dataset.group,
            count: count(group)
        }))
    ];
    tabs.innerHTML = options.map((option) => `<button type="button" data-group="${esc(option.id)}" aria-pressed="${option.id === "all"}">${esc(option.title)} <span class="count">${option.count}</span></button>`).join("");
    tabs.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-group]");
        if (!button) return;
        tabs.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
        const id = button.dataset.group;
        groups.forEach((group) => {
            group.hidden = id !== "all" && group.dataset.group !== id;
            group.classList.toggle("filtered", id !== "all");
        });
    });
});

// Short muted previews: load and play only while a card is hovered or focused.
if (!reduceMotion) {
    document.querySelectorAll(".card, .game, .audio-card").forEach((el) => {
        const box = el.querySelector(".media, .audio-cover");
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
}

// Project details: click a card (or its Details button) to see the full project.
const projectsById = new Map((window.PROJECTS || []).map((p) => [p.id, p]));
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
        links: a.link ? [{ kind: "play", label: "See it on Games", url: root + a.link }] : []
    });
});
(window.AUDIO_GROUPS || []).forEach((g) => {
    const tracks = (window.AUDIO_ITEMS || []).filter((a) => a.group === g.id).flatMap((a) => a.tracks || []);
    if (tracks.length < 2) return;
    projectsById.set(`playlist-${g.id}`, {
        id: `playlist-${g.id}`,
        isAudio: true,
        title: `${g.title} · all tracks`,
        meta: `${tracks.length} tracks`,
        tags: [],
        summary: "The tracks from this folder, one after another.",
        image: (window.AUDIO_ITEMS || []).find((a) => a.group === g.id)?.cover,
        tracks
    });
});
const projectDialog = document.createElement("dialog");
projectDialog.className = "project-dialog";
projectDialog.setAttribute("aria-label", "Project details");
projectDialog.innerHTML = `<form method="dialog" class="dialog-top"><button type="submit" class="dialog-close" aria-label="Close project details">&times;</button></form>
    <div class="dialog-content"></div>
    <div class="dialog-nav">
        <button type="button" class="dialog-arrow" data-dialog-step="-1" aria-label="Previous project"><svg class="dialog-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4 7 12l8 8"/></svg></button>
        <span class="dialog-counter" aria-live="polite"></span>
        <button type="button" class="dialog-arrow" data-dialog-step="1" aria-label="Next project"><svg class="dialog-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4 17 12l-8 8"/></svg></button>
    </div>`;
document.body.appendChild(projectDialog);
let dialogOpener = null;
let dialogOrder = [];
let dialogIndex = 0;

const renderProject = (index) => {
    const p = projectsById.get(dialogOrder[index]);
    if (!p) return;
    dialogIndex = index;
    projectDialog.querySelectorAll(".track-player").forEach((audio) => audio.pause());
    const hasTracks = p.tracks?.length > 0;
    const trackList = hasTracks
        ? `<div class="dialog-tracks" aria-label="Tracks">${p.tracks.map((t, i) => `
            <div class="track-row" data-track-row>
                <span class="track-num">${String(i + 1).padStart(2, "0")}</span>
                <span class="track-name">${esc(t.title)}</span>
                <button type="button" class="track-trigger" data-track="${i}" aria-label="Play ${esc(t.title)}"><svg class="icon" aria-hidden="true"><use href="#play"></use></svg></button>
                <audio class="track-player" controls preload="none" controlsList="nodownload" aria-label="${esc(t.title)}"></audio>
            </div>`).join("")}</div>`
        : p.preview
            ? (/\.mp4$/.test(p.preview)
                ? `<video class="dialog-preview" controls loop preload="none" src="${esc(asset(p.preview))}">Your browser can't play this video.</video>`
                : `<audio class="dialog-preview" controls preload="none" src="${esc(asset(p.preview))}">Your browser can't play this audio.</audio>`)
            : p.isAudio
                ? `<p class="track-note">The audio files for this folder are not added yet.</p>`
                : "";
    projectDialog.querySelector(".dialog-content").innerHTML = `
        <div class="dialog-media${p.contain ? " contain" : ""}">
            <img src="${esc(asset(p.image))}" alt="${esc(p.alt || p.title)}" width="1200" height="750">
            ${p.extra ? `<img class="dialog-extra" src="${esc(asset(p.extra))}" alt="" width="1200" height="750">` : ""}
        </div>
        <div class="dialog-body">
            <p class="meta">${meta(p)}</p>
            <h2>${esc(p.title)}</h2>
            ${p.role ? `<p class="role">${esc(p.role)}</p>` : ""}
            <p class="summary">${esc(p.summary)}</p>
            ${trackList}
            ${tags(p)}
            ${p.links?.length ? actions(p, "") : ""}
        </div>`;
    projectDialog.querySelector(".dialog-counter").textContent = `${index + 1} / ${dialogOrder.length}`;
    projectDialog.querySelector(".dialog-nav").hidden = dialogOrder.length < 2;
    if (hasTracks) {
        const rows = [...projectDialog.querySelectorAll("[data-track-row]")];
        const players = rows.map((row) => row.querySelector(".track-player"));
        let current = -1;
        const playTrack = (i) => {
            if (current >= 0) {
                rows[current].classList.remove("is-current");
                players[current].pause();
            }
            current = i;
            const player = players[i];
            if (!player.src) player.src = asset(p.tracks[i].src);
            rows[i].classList.add("is-current");
            player.play().catch(() => {});
        };
        rows.forEach((row, i) => row.querySelector(".track-trigger").addEventListener("click", () => {
            if (current === i && !players[i].paused) {
                players[i].pause();
                return;
            }
            playTrack(i);
        }));
        players.forEach((player, i) => player.addEventListener("ended", () => {
            if (i + 1 < rows.length) playTrack(i + 1);
            else {
                rows[i].classList.remove("is-current");
                current = -1;
            }
        }));
    }
    const card = [...document.querySelectorAll("[data-project]")].find((el) => el.dataset.project === p.id);
    if (card) dialogOpener = card;
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
    stopPreview();
    projectDialog.querySelectorAll(".track-player").forEach((audio) => audio.pause());
    const target = dialogOpener?.matches(".audio-art")
        ? dialogOpener.parentElement.querySelector(".audio-open")
        : dialogOpener?.querySelector("[data-open-project]") || dialogOpener;
    requestAnimationFrame(() => target?.focus());
});

document.addEventListener("click", (event) => {
    if (event.target.closest("a, [data-audio-preview]")) return;
    const opener = event.target.closest("[data-open-project], [data-project], [data-open-audio]");
    if (!opener || projectDialog.contains(opener)) return;
    const id = opener.dataset.openProject || opener.dataset.project || opener.dataset.openAudio;
    if (!projectsById.has(id)) return;
    const scope = opener.closest("[data-featured], [data-code], [data-games], [data-audio]") || document;
    dialogOrder = [...scope.querySelectorAll("[data-project]")]
        .filter((el) => el.getBoundingClientRect().height > 0)
        .map((el) => el.dataset.project);
    let index = dialogOrder.indexOf(id);
    if (index < 0) {
        dialogOrder = [id];
        index = 0;
    }
    dialogOpener = opener;
    renderProject(index);
    stopPreview();
    projectDialog.showModal();
});

// Art page lightbox.
const lightbox = document.querySelector(".lightbox");
if (lightbox) {
    const img = lightbox.querySelector("img");
    const caption = lightbox.querySelector("p");
    document.querySelectorAll(".gallery button").forEach((button) => {
        button.addEventListener("click", () => {
            const thumb = button.querySelector("img");
            img.src = thumb.src;
            img.alt = thumb.alt;
            img.classList.toggle("pixel-img", button.closest(".pixel") !== null);
            caption.textContent = button.closest("figure").querySelector("figcaption strong").textContent;
            lightbox.showModal();
        });
    });
    lightbox.addEventListener("click", (event) => {
        if (event.target === lightbox) lightbox.close();
    });
}

// Contact form: copy the message so it works without an email app installed.
const form = document.getElementById("contact-form");
if (form) {
    const formStatus = form.querySelector("[data-form-status]");
    const copyWithFallback = (text) => {
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
    };
    const report = (copied) => {
        formStatus.textContent = copied
            ? "Message copied and your email app is opening. If it doesn't open, paste it into an email to miguelrodriguezgallego1@gmail.com."
            : "Your email app is opening. If it doesn't open, your message is selected: press Ctrl+C and paste it into an email to miguelrodriguezgallego1@gmail.com.";
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
        const copyDone = navigator.clipboard?.writeText
            ? navigator.clipboard.writeText(text).then(() => true, () => copyWithFallback(text))
            : Promise.resolve(copyWithFallback(text));
        const emailLink = document.createElement("a");
        emailLink.href = `mailto:miguelrodriguezgallego1@gmail.com?subject=${subject}&body=${body}`;
        emailLink.hidden = true;
        document.body.appendChild(emailLink);
        emailLink.click();
        emailLink.remove();
        copyDone.then(report);
    });
}
