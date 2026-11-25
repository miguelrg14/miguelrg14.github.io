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
    return `<article class="game" id="${esc(p.id)}" data-project="${esc(p.id)}">
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

// Home: featured projects.
document.querySelectorAll("[data-featured]").forEach((list) => {
    list.innerHTML = window.PROJECTS.filter((p) => p.featured).map(card).join("");
});

// Games page.
document.querySelectorAll("[data-games]").forEach((box) => {
    box.innerHTML = window.PROJECTS.filter((p) => p.kind === "game").map(gameRow).join("");
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
        return `<section class="group" data-group="${esc(g.id)}" aria-labelledby="group-${g.id}">
            <div>
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

// Short muted previews: load and play only while a card is hovered or focused.
if (!reduceMotion) {
    document.querySelectorAll(".card, .game").forEach((el) => {
        const box = el.querySelector(".media");
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
    projectDialog.querySelector(".dialog-content").innerHTML = `
        <div class="dialog-media${p.contain ? " contain" : ""}">
            <img src="${esc(asset(p.image))}" alt="${esc(p.alt || p.title)}" width="1200" height="750">
        </div>
        <div class="dialog-body">
            <p class="meta">${meta(p)}</p>
            <h2>${esc(p.title)}</h2>
            ${p.role ? `<p class="role">${esc(p.role)}</p>` : ""}
            <p class="summary">${esc(p.summary)}</p>
            ${tags(p)}
            ${actions(p, "")}
        </div>`;
    projectDialog.querySelector(".dialog-counter").textContent = `${index + 1} / ${dialogOrder.length}`;
    projectDialog.querySelector(".dialog-nav").hidden = dialogOrder.length < 2;
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
    const target = dialogOpener?.querySelector("[data-open-project]") || dialogOpener;
    target?.focus();
});

document.addEventListener("click", (event) => {
    if (event.target.closest("a")) return;
    const opener = event.target.closest("[data-open-project], [data-project]");
    if (!opener || projectDialog.contains(opener)) return;
    const id = opener.dataset.openProject || opener.dataset.project;
    if (!projectsById.has(id)) return;
    const scope = opener.closest("[data-featured], [data-code], [data-games]") || document;
    dialogOrder = [...scope.querySelectorAll("[data-project]")]
        .filter((el) => el.getBoundingClientRect().height > 0)
        .map((el) => el.dataset.project);
    const index = dialogOrder.indexOf(id);
    dialogOpener = opener;
    renderProject(index < 0 ? 0 : index);
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
