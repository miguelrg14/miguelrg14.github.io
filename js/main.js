// Renders the projects from data/projects.js, plays card previews on hover,
// filters the Code page and opens the Art page lightbox.

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

function actions(p, size) {
    const items = p.links.map((link, i) => {
        const icon = link.kind === "play" ? `<svg class="icon" aria-hidden="true"><use href="#play"></use></svg>` : "";
        const style = i === 0 ? "button" : "button ghost";
        return `<li><a class="${style} ${size}" href="${esc(link.url)}">${icon}${esc(link.label)}<span class="visually-hidden"> (${esc(p.title)})</span></a></li>`;
    });
    return `<ul class="actions">${items.join("")}</ul>`;
}

function card(p) {
    const search = p.tags.map((t) => t.toLowerCase()).join(" ");
    return `<li class="card" data-tags="${esc(search)}">
        ${media(p)}
        <h3>${esc(p.title)}</h3>
        <p class="meta">${meta(p)}</p>
        <p>${esc(p.summary)}</p>
        ${tags(p)}
        ${actions(p, "small")}
    </li>`;
}

function gameRow(p) {
    return `<article class="game" id="${esc(p.id)}">
        ${media(p)}
        <div>
            <h2>${esc(p.title)}</h2>
            <p class="meta">${meta(p)}</p>
            <p class="role">${esc(p.role)}</p>
            <p>${esc(p.summary)}</p>
            ${tags(p)}
            ${actions(p, "")}
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

// Code page: one section per group, with tag filters.
document.querySelectorAll("[data-code]").forEach((box) => {
    const groups = window.PROJECT_GROUPS.map((g) => {
        const items = window.PROJECTS.filter((p) => (g.id === "games" ? p.kind === "game" : p.group === g.id));
        if (!items.length) return "";
        return `<section class="group" aria-labelledby="group-${g.id}">
            <div>
                <h2 id="group-${g.id}">${esc(g.title)}</h2>
                <p class="group-intro">${esc(g.intro)}</p>
            </div>
            <ul class="cards">${items.map(card).join("")}</ul>
        </section>`;
    });
    // Games go last on this page: their own page already shows them first.
    const [games, ...rest] = groups;
    box.innerHTML = rest.join("") + games + `<p class="empty" hidden>Nothing with that tag yet.</p>`;
});

document.querySelectorAll(".filters").forEach((filters) => {
    const buttons = filters.querySelectorAll("button");
    filters.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (!button) return;
        const tag = button.dataset.tag;
        buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));

        let shown = 0;
        document.querySelectorAll(".group").forEach((group) => {
            let inGroup = 0;
            group.querySelectorAll(".card").forEach((c) => {
                const match = tag === "all" || c.dataset.tags.split(" ").includes(tag);
                c.hidden = !match;
                if (match) inGroup++;
            });
            group.hidden = inGroup === 0;
            shown += inGroup;
        });
        document.querySelector(".empty").hidden = shown > 0;
    });
});

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

// Contact form: the site is static, so it opens the visitor's email app with the message written.
const form = document.getElementById("contact-form");
if (form) {
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const name = form.elements.name.value.trim();
        const message = form.elements.message.value.trim();
        const subject = encodeURIComponent(`Message from ${name}`);
        const body = encodeURIComponent(`${message}\n\n${name}`);
        window.location.href = `mailto:miguelrodriguezgallego1@gmail.com?subject=${subject}&body=${body}`;
    });
}
