/*
 * Audio page content, in the same spirit as data/projects.js.
 * cover is the square artwork of the card. tracks is the list shown inside the
 * details dialog: each row plays its src and moves to the next one when it ends.
 * Put finished covers and tracks in assets/music/ and update the paths here.
 */
window.AUDIO_GROUPS = [
    { id: "albums", title: "Albums", intro: "Tracks I composed and produced in FL Studio." },
    { id: "game", title: "Game audio", intro: "Music, effects and audio systems made for my games." },
    { id: "studio", title: "Studio", intro: "Mixing, plugins and DJing." }
];

window.AUDIO_ITEMS = [
    {
        id: "moving-on",
        group: "albums",
        title: "Moving on",
        meta: "Ambient · 2024",
        tags: ["ambient", "synth", "fl studio"],
        summary: "A short ambient track built from layers of synth pads and a slow arpeggio.",
        cover: "assets/music/spectrum.webp",
        preview: "assets/media/moving-on.mp3",
        tracks: [
            { title: "Moving on", src: "assets/media/moving-on.mp3" }
        ],
        kind: "audio"
    },
    {
        id: "synthwave",
        group: "albums",
        title: "Synthwave",
        meta: "Synthwave · 2024",
        tags: ["synthwave", "synth", "fl studio"],
        summary: "A synthwave piece with its own visuals: driving bass, neon leads and a short animated edit.",
        cover: "assets/music/fl-studio.webp",
        coverVideo: "assets/media/synthwave.mp4",
        preview: "assets/media/synthwave.mp4",
        tracks: [
            { title: "Synthwave", src: "assets/media/synthwave.mp4" }
        ],
        kind: "video"
    },
    {
        id: "rope-audio",
        group: "game",
        title: "Rope Monster",
        meta: "Music and SFX · Team of 3",
        tags: ["soundtrack", "sound effects", "casual"],
        summary: "Both music tracks and every sound effect, composed and recorded from scratch in FL Studio and Audacity.",
        cover: "assets/projects/rope-monster.webp",
        tracks: [],
        link: "games/index.html#rope-monster"
    },
    {
        id: "horror-audio",
        group: "game",
        title: "Horror Project",
        meta: "Audio system and SFX · Team of 3",
        tags: ["soundtrack", "sound design", "horror"],
        summary: "The audio system with mixer channels and volume options, the music and the sound design.",
        cover: "assets/projects/horror-project.webp",
        tracks: [],
        link: "games/index.html#horror-project"
    },
    {
        id: "ivers-audio",
        group: "game",
        title: "Iver's Tales",
        meta: "Sound lead · Team of 7",
        tags: ["soundtrack", "sound effects", "fantasy"],
        summary: "Lead of sound and UI: the sound effect manager, audio mixers and volume settings, and the first placeholder music.",
        cover: "assets/projects/ivers-tales.webp",
        tracks: [],
        link: "games/index.html#ivers-tales"
    },
    {
        id: "mixing",
        group: "studio",
        title: "Mixing and DJing",
        meta: "FL Studio · Rekordbox",
        tags: ["mixing", "djing", "plugins"],
        summary: "I shape sounds with reverb, delay, EQ and other plugins, and I check mixes on a spectrum analyser. DJing is a personal hobby that grew out of the same curiosity.",
        cover: "assets/music/plugins.webp",
        extra: "assets/music/rekordbox.webp",
        tracks: []
    }
];
