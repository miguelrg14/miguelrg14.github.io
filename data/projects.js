/*
 * Every game and repository on the site comes from this list.
 * To add a project, copy one entry, change its fields and put its cover in assets/projects/.
 *
 *   kind      "game" shows it on the Games page (and its repo on the Code page);
 *             "code" shows it only on the Code page
 *   group     Code page section: graphics, ai, engines, dotnet, web
 *   featured  legacy flag; Home now derives one card per zone from this data
 *   video     optional short muted clip that plays when the card is hovered or focused
 *   links     kind is one of: play, itch, video, download, source
 */
window.PROJECT_GROUPS = [
    { id: "games", title: "Games", intro: "Source code of the games on the Games page." },
    { id: "graphics", title: "Graphics and simulation", intro: "Rendering from scratch in C++ and OpenGL, shaders and VFX in Unity, and procedural meshes." },
    { id: "ai", title: "Game AI", intro: "Classic game AI techniques, each one playable." },
    { id: "engines", title: "Engine labs", intro: "Gameplay systems, multiplayer and ECS engines in Unity, Unreal Engine and C++." },
    { id: "dotnet", title: "C# and .NET", intro: "University coursework rebuilt as tested .NET solutions with downloadable releases." },
    { id: "web", title: "Web", intro: "HTML, CSS, JavaScript, PHP and MySQL." }
];

window.PROJECTS = [
    {
        id: "z-battle-yard",
        kind: "game",
        featured: true,
        title: "Z Battle Yard",
        year: "2022–2023",
        team: "Solo project",
        role: "I handled the design, code, level art and audio",
        summary: "Endless first-person zombie wave shooter inspired by Call of Duty: Zombies. Defend an abandoned train station, earn points, buy weapons and perks, roll the Mystery Box and open new parts of the map. Made during my internship at ESNE Asturias and shown at CometCon Gijón 2023.",
        tags: ["Unity", "C#", "FPS", "URP"],
        image: "assets/projects/z-battle-yard.webp",
        video: "assets/projects/z-battle-yard.mp4",
        alt: "First-person view of a rifle inside a bright blue train station",
        links: [
            { kind: "play", label: "Play in the browser", url: "https://miguelrg14.github.io/Z-Battle-Yard/" },
            { kind: "itch", label: "itch.io", url: "https://miguel-rg14.itch.io/z-battle-yard" },
            { kind: "source", label: "Source code", url: "https://github.com/miguelrg14/Z-Battle-Yard" }
        ]
    },
    {
        id: "ivers-tales",
        kind: "game",
        featured: true,
        title: "Iver's Tales",
        year: "2023–2024",
        team: "Team of 7 at UDIT",
        role: "I produced the game and led sound and UI",
        summary: "3D dungeon crawler where Iver, a small robot cat, uses a hammer, a dash and three elemental spells to solve puzzles and beat the bosses of a gothic kingdom. I ran production (17 sprints, about 1,600 logged hours, publisher outreach) and programmed the menus, UI flow and audio. Shown at PS Talents and Match In Games 2024.",
        tags: ["Unity", "C#", "Production", "UI", "Audio"],
        image: "assets/projects/ivers-tales.webp",
        alt: "Iver fights a boss on a glowing red tiled floor",
        links: [
            { kind: "itch", label: "Play on itch.io", url: "https://iguanago.itch.io/ivers-tales" },
            { kind: "video", label: "Trailer", url: "https://www.youtube.com/watch?v=PyGUNLEBmyA" },
            { kind: "source", label: "Source code", url: "https://github.com/miguelrg14/Ivers-Tales" }
        ]
    },
    {
        id: "horror-project",
        kind: "game",
        featured: false,
        title: "Horror Project",
        year: "2021–2022",
        team: "Team of 3 at ESNE",
        role: "I built the audio system and menus, composed the music and made part of the 3D art",
        summary: "First-person horror prototype. Explore a dark house with a lantern that needs batteries, inspect objects in 3D and find the keys that open the three locks on the final door. Shown at CometCon Gijón 2022.",
        tags: ["Unity", "C#", "Audio", "UI"],
        image: "assets/projects/horror-project.webp",
        alt: "Red-lit main menu of Horror Project",
        links: [
            { kind: "play", label: "Play in the browser", url: "https://miguelrg14.github.io/Horror-Project/" },
            { kind: "itch", label: "itch.io", url: "https://lucasgarcia002.itch.io/horror-project" },
            { kind: "source", label: "Source code", url: "https://github.com/miguelrg14/Horror-Project" }
        ]
    },
    {
        id: "rope-monster",
        kind: "game",
        featured: false,
        title: "Rope Monster",
        team: "Team of 3 at ESNE",
        role: "I designed the game and levels, built the UI and composed all music and sounds",
        summary: "Casual 2D mobile game: guide a little monster up a vertical level while it drags a friend hanging from a rope, dodging traps and enemies before the acid catches you. I designed the 9 levels and composed every track and sound effect from scratch.",
        tags: ["Unity", "C#", "Mobile", "Audio", "UI"],
        image: "assets/projects/rope-monster.webp",
        alt: "Rope Monster cover art: a blue monster above the game's title",
        contain: true,
        links: [
            { kind: "play", label: "Play in the browser", url: "https://miguelrg14.github.io/Rope-Monster/" },
            { kind: "download", label: "Android APK", url: "https://github.com/miguelrg14/Rope-Monster/releases" },
            { kind: "itch", label: "itch.io", url: "https://martinx902.itch.io/rope-monster" },
            { kind: "source", label: "Source code", url: "https://github.com/miguelrg14/Rope-Monster" }
        ]
    },
    {
        id: "last-grounds",
        kind: "game",
        featured: false,
        title: "Last Grounds",
        year: "2026",
        team: "Solo project",
        role: "I rebuilt my original GameMaker game in Unity 6",
        summary: "Top-down pixel-art zombie horde shooter. Hold the last barricade, switch between three weapons and survive five days until rescue arrives. My first game, rebuilt in Unity 6 with the original art, sounds and game feel, plus six modes, five zombie types, local leaderboards and touch and gamepad controls.",
        tags: ["Unity", "C#", "Pixel art", "Mobile", "WebGL"],
        image: "assets/projects/readme/last-grounds/preview.png",
        alt: "Title, gameplay and game over screens of Last Grounds",
        contain: true,
        links: [
            { kind: "play", label: "Play in the browser", url: "https://miguelrg14.github.io/Last-Grounds/" },
            { kind: "download", label: "Download", url: "https://github.com/miguelrg14/Last-Grounds/releases/latest" },
            { kind: "source", label: "Source code", url: "https://github.com/miguelrg14/Last-Grounds" }
        ]
    },
    {
        id: "sticky-fabric",
        kind: "code",
        group: "graphics",
        featured: false,
        title: "Sticky Fabric",
        year: "2024–2025",
        team: "Bachelor's thesis, UDIT",
        summary: "A procedural mesh that behaves like chewing gum: vertices stick to whatever touches them, stretch and snap back past their elastic limit, with no softbody springs, joints or shaders.",
        tags: ["Unity", "C#", "Procedural mesh", "Tests"],
        image: "assets/projects/sticky-fabric.webp",
        contain: true,
        video: "assets/projects/sticky-fabric.mp4",
        alt: "A capsule pushing through a stretchy fabric mesh in Unity",
        links: [
            { kind: "source", label: "Source code", url: "https://github.com/miguelrg14/U_TFG_Sticky-Fabric-Unity" }
        ]
    },
    {
        id: "3d-renderer",
        kind: "code",
        group: "graphics",
        featured: false,
        title: "3D Renderer",
        year: "2024–2025",
        team: "Graphics Programming, UDIT",
        summary: "Real-time renderer written from scratch in C++17 and OpenGL 3.3: FPS camera, scene graph, Assimp models, Blinn-Phong lighting, fog, skybox, heightmap terrain and a post-processing pass.",
        tags: ["C++", "OpenGL", "GLSL"],
        image: "assets/projects/3d-renderer.webp",
        video: "assets/projects/3d-renderer.mp4",
        alt: "Rendered scene with a sandy skybox and imported models",
        links: [
            { kind: "source", label: "Source code", url: "https://github.com/miguelrg14/VS_3D-Renderer" }
        ]
    },
    {
        id: "u-shaders-vfx",
        kind: "code",
        group: "graphics",
        featured: false,
        title: "Shaders and VFX",
        year: "2026",
        team: "Unity study library",
        summary: "A personal library of 52 shader and image-effect demos in the Built-in Render Pipeline, plus real-time VFX Graph scenes in URP. Each demo has notes, materials and its own scene, with a playable browser build and Windows release.",
        tags: ["Unity", "Shaders", "VFX", "HLSL"],
        image: "assets/projects/readme/u-shaders-vfx/menu.jpg",
        alt: "Main menu of the shaders and VFX demo library",
        links: [
            { kind: "play", label: "Play demos", url: "https://miguelrg14.github.io/U_Shaders-and-VFX/" },
            { kind: "download", label: "Download", url: "https://github.com/miguelrg14/U_Shaders-and-VFX/releases/latest" },
            { kind: "source", label: "Source code", url: "https://github.com/miguelrg14/U_Shaders-and-VFX" }
        ]
    },
    {
        id: "ai-cookbook",
        kind: "code",
        group: "ai",
        featured: true,
        title: "AI Cookbook",
        year: "2022–2025",
        team: "Unity, C#",
        summary: "Seven game AI techniques in one Unity project, all launched from one menu: behaviour trees, decision trees, state machines, procedural terrain, minimax with alpha-beta, genetic algorithms, and Q-learning and SARSA.",
        tags: ["Unity", "C#", "AI"],
        image: "assets/projects/ai-cookbook.webp",
        video: "assets/projects/ai-cookbook.mp4",
        alt: "Zombie infection demo: green agents chasing citizens on a field",
        links: [
            { kind: "play", label: "Play in the browser", url: "https://miguelrg14.github.io/U_AI_Cookbook/" },
            { kind: "itch", label: "itch.io", url: "https://miguel-rg14.itch.io/ai-cookbook" },
            { kind: "source", label: "Source code", url: "https://github.com/miguelrg14/U_AI_Cookbook" }
        ]
    },
    {
        id: "unity-lab",
        kind: "code",
        group: "engines",
        featured: false,
        title: "Unity Lab",
        year: "2022–2025",
        team: "Unity, C#, .NET 8 server",
        summary: "Physics racing against AI drivers and online over TCP against a dedicated .NET 8 server I wrote, plus an RTS with box selection, state-machine units, a vision system and an AI opponent.",
        tags: ["Unity", "C#", "Multiplayer", "AI"],
        image: "assets/projects/unity-lab.webp",
        alt: "Four low-poly cars racing on a white track",
        links: [
            { kind: "play", label: "Play in the browser", url: "https://miguelrg14.github.io/Unity-Lab/" },
            { kind: "download", label: "Download", url: "https://github.com/miguelrg14/Unity-Lab/releases/latest" },
            { kind: "source", label: "Source code", url: "https://github.com/miguelrg14/Unity-Lab" }
        ]
    },
    {
        id: "ue-lab",
        kind: "code",
        group: "engines",
        featured: false,
        title: "UE Lab",
        year: "2022–2025",
        team: "Unreal Engine 5.8",
        summary: "Five Unreal Engine projects: materials, a listen-server multiplayer FPS, pawn swapping with replication, farming NPCs driven by Behavior Trees and EQS, and a factory simulation in C++.",
        tags: ["Unreal", "C++", "Blueprints", "Multiplayer", "AI"],
        image: "assets/projects/ue-lab.webp",
        contain: true,
        alt: "First-person shooter HUD in Unreal Engine with ammo and health bars",
        links: [
            { kind: "source", label: "Source code", url: "https://github.com/miguelrg14/UE_Lab" }
        ]
    },
    {
        id: "ecs-engine",
        kind: "code",
        groups: ["engines", "graphics"],
        featured: false,
        title: "ECS Engine",
        year: "2026",
        team: "Solo project",
        summary: "A small game engine written from scratch in C++20 and OpenGL 3.3 around a data-oriented entity component system: sparse-set components, a priority task kernel, transforms with hierarchy, typed events, collisions and a playable demo. Includes live ImGui debug tools, 51 unit tests and CI builds.",
        tags: ["C++", "OpenGL", "ECS", "ImGui"],
        image: "assets/projects/readme/ecs-engine/debug-tools.png",
        alt: "Debug tools of the ECS Engine over the playable demo",
        links: [
            { kind: "download", label: "Download build", url: "https://github.com/miguelrg14/ECS_Engine/releases/latest" },
            { kind: "source", label: "Source code", url: "https://github.com/miguelrg14/ECS_Engine" }
        ]
    },
    {
        id: "genesis-engine",
        kind: "code",
        groups: ["engines", "graphics"],
        featured: false,
        title: "Genesis Engine",
        year: "2026",
        team: "Solo project",
        summary: "Modular game engine built to learn engine architecture from TheCherno's series: an ECS, layer stack, event dispatcher, GLFW and OpenGL context, ImGui debug panels, spdlog logging and Premake builds on Windows with C++20.",
        tags: ["C++", "OpenGL", "ECS", "ImGui"],
        image: "assets/projects/genesis-engine.svg",
        alt: "Genesis Engine cover with an isometric ECS node",
        links: [
            { kind: "source", label: "Source code", url: "https://github.com/miguelrg14/Genesis-Engine" }
        ]
    },
    {
        id: "csharp-fundamentals",
        kind: "code",
        group: "dotnet",
        featured: false,
        title: "C# Fundamentals",
        year: "2020–2021",
        team: ".NET, xUnit",
        summary: "Battle Tower, a turn-based RPG, three board games, a library of generic data structures written from scratch and 29 exercises, with about 150 unit tests.",
        tags: ["C#", ".NET", "Tests"],
        image: "assets/projects/csharp-fundamentals.webp",
        contain: true,
        alt: "Console window with the Battle Tower title in ASCII art",
        links: [
            { kind: "download", label: "Download", url: "https://github.com/miguelrg14/VS_CSharp-Fundamentals/releases/latest" },
            { kind: "source", label: "Source code", url: "https://github.com/miguelrg14/VS_CSharp-Fundamentals" }
        ]
    },
    {
        id: "winforms-games",
        kind: "code",
        group: "dotnet",
        featured: false,
        title: "C# WinForms Games",
        year: "2020–2022",
        team: ".NET, Windows Forms",
        summary: "Object-oriented programming through five desktop games, from a duel to two-player Blackjack with trump cards, with every rule kept in a unit-tested library.",
        tags: ["C#", ".NET", "OOP", "Tests"],
        image: "assets/projects/winforms-games.webp",
        contain: true,
        alt: "Blackjack game window with two players' health and cards",
        links: [
            { kind: "download", label: "Download", url: "https://github.com/miguelrg14/VS_CSharp-WinForms-Games/releases/latest" },
            { kind: "source", label: "Source code", url: "https://github.com/miguelrg14/VS_CSharp-WinForms-Games" }
        ]
    },
    {
        id: "csharp-networking",
        kind: "code",
        group: "dotnet",
        featured: false,
        title: "C# Networking",
        team: ".NET, SQLite",
        summary: "Multi-client TCP group chat with async server, unique nicknames, commands, and history, search and stats stored in SQLite, plus the threading and socket exercises that led to it.",
        tags: ["C#", ".NET", "Networking", "SQL"],
        image: "assets/projects/csharp-networking.webp",
        alt: "Terminal windows with a chat server and two clients",
        links: [
            { kind: "source", label: "Source code", url: "https://github.com/miguelrg14/VS_CSharp-Networking" }
        ]
    },
    {
        id: "web-fundamentals",
        kind: "code",
        group: "web",
        featured: false,
        title: "Web Fundamentals",
        team: "HTML, CSS, JS, PHP, MySQL",
        summary: "Three static sites and an online furniture shop in PHP and MySQL with accounts, a cart and orders. The first version of this site started there.",
        tags: ["Web", "JavaScript", "PHP", "SQL"],
        image: "assets/projects/web-fundamentals.webp",
        contain: true,
        alt: "Costa Verde tourism site with a photo of the Asturian coast",
        links: [
            { kind: "play", label: "Live demos", url: "https://miguelrg14.github.io/Web-Fundamentals_HTML-CSS-JS-PHP/" },
            { kind: "source", label: "Source code", url: "https://github.com/miguelrg14/Web-Fundamentals_HTML-CSS-JS-PHP" }
        ]
    }
];
