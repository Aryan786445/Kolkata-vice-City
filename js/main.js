import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js";

// ======================================================
// KOLKATA VICE CITY — WORLD V2
// ======================================================

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x8fc9e8);
scene.fog = new THREE.Fog(0x8fc9e8, 180, 700);

const camera = new THREE.PerspectiveCamera(
    68,
    window.innerWidth / window.innerHeight,
    0.1,
    1500
);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.appendChild(renderer.domElement);

// ======================================================
// LIGHTING
// ======================================================

const sun = new THREE.DirectionalLight(0xfff3d0, 2.2);
sun.position.set(150, 250, 120);
sun.castShadow = true;

sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;

sun.shadow.camera.left = -350;
sun.shadow.camera.right = 350;
sun.shadow.camera.top = 350;
sun.shadow.camera.bottom = -350;

scene.add(sun);

const ambient = new THREE.HemisphereLight(
    0xbfe9ff,
    0x4b463e,
    1.5
);

scene.add(ambient);

// ======================================================
// MATERIAL HELPERS
// ======================================================

function mat(color, roughness = 0.8) {
    return new THREE.MeshStandardMaterial({
        color,
        roughness
    });
}

// ======================================================
// GROUND
// ======================================================

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 1000),
    mat(0x65745a)
);

ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ======================================================
// HOOGHLY RIVER
// ======================================================

const river = new THREE.Mesh(
    new THREE.PlaneGeometry(250, 1000),
    new THREE.MeshStandardMaterial({
        color: 0x277fa5,
        roughness: 0.25,
        metalness: 0.05
    })
);

river.rotation.x = -Math.PI / 2;
river.position.set(145, 0.08, 0);

scene.add(river);

// River bank
const bank = new THREE.Mesh(
    new THREE.BoxGeometry(18, 0.8, 1000),
    mat(0x8b8068)
);

bank.position.set(12, 0.4, 0);
scene.add(bank);

// ======================================================
// ROADS
// ======================================================

const roadMaterial = mat(0x252525);
const sidewalkMaterial = mat(0xa69b87);

function createRoad(x, z, width, length, rotation = 0) {

    const road = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.12, length),
        roadMaterial
    );

    road.position.set(x, 0.07, z);
    road.rotation.y = rotation;

    road.receiveShadow = true;
    scene.add(road);

    return road;
}

function createSidewalk(x, z, width, length, rotation = 0) {

    const sidewalk = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.22, length),
        sidewalkMaterial
    );

    sidewalk.position.set(x, 0.15, z);
    sidewalk.rotation.y = rotation;

    scene.add(sidewalk);
}

// Main roads
createRoad(-40, 0, 32, 850);
createRoad(-105, 0, 22, 850);

createRoad(-40, -120, 700, 26);
createRoad(-40, 10, 700, 24);
createRoad(-40, 140, 700, 26);

// Roads closer to river
createRoad(40, 0, 20, 850);

// Sidewalks
createSidewalk(-58, 0, 4, 850);
createSidewalk(-22, 0, 4, 850);

createSidewalk(-40, -135, 700, 4);
createSidewalk(-40, -105, 700, 4);

createSidewalk(-40, -3, 700, 4);
createSidewalk(-40, 25, 700, 4);

createSidewalk(-40, 127, 700, 4);
createSidewalk(-40, 153, 700, 4);

// ======================================================
// ROAD LANE MARKINGS
// ======================================================

function createLaneMark(x, z, horizontal = false) {

    const mark = new THREE.Mesh(
        new THREE.BoxGeometry(
            horizontal ? 7 : 0.35,
            0.04,
            horizontal ? 0.35 : 7
        ),
        mat(0xe8dfb2)
    );

    mark.position.set(x, 0.15, z);

    scene.add(mark);
}

for (let z = -390; z < 390; z += 18) {
    createLaneMark(-40, z);
}

for (let x = -380; x < 320; x += 18) {
    createLaneMark(x, -120, true);
    createLaneMark(x, 10, true);
    createLaneMark(x, 140, true);
}

// ======================================================
// BUILDINGS
// ======================================================

const buildingColors = [
    0xc79b78,
    0xd2b18b,
    0xb87862,
    0x9d9c8c,
    0xd6c4a7,
    0xa77d66,
    0xc4a06e,
    0x8e9b91
];

function createBuilding(
    x,
    z,
    width,
    depth,
    height,
    color
) {

    const building = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        mat(color)
    );

    building.position.set(
        x,
        height / 2,
        z
    );

    building.castShadow = true;
    building.receiveShadow = true;

    scene.add(building);

    // Roof
    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(
            width + 1,
            0.8,
            depth + 1
        ),
        mat(0x51473e)
    );

    roof.position.set(
        x,
        height + 0.4,
        z
    );

    roof.castShadow = true;

    scene.add(roof);

    // Windows
    const windowMaterial = mat(0x273f4a);

    const floors = Math.max(1, Math.floor(height / 5));

    for (let floor = 0; floor < floors; floor++) {

        const y = 2.5 + floor * 5;

        if (y > height - 1) continue;

        for (let side = -1; side <= 1; side += 2) {

            for (let w = -1; w <= 1; w++) {

                const window = new THREE.Mesh(
                    new THREE.BoxGeometry(
                        1.3,
                        1.8,
                        0.12
                    ),
                    windowMaterial
                );

                window.position.set(
                    x + w * (width / 3),
                    y,
                    z + side * (depth / 2 + 0.08)
                );

                scene.add(window);
            }
        }
    }

    return building;
}

// Old Kolkata-style neighborhoods
const blocks = [
    [-190, -60],
    [-150, -60],
    [-190, 70],
    [-150, 70],

    [-190, 200],
    [-145, 200],

    [-5, -60],
    [45, -60],
    [-5, 70],
    [45, 70],

    [-5, 200],
    [50, 200],

    [95, -60],
    [95, 70],
    [95, 200],

    [-250, -200],
    [-200, -200],
    [-145, -200],

    [-250, 280],
    [-200, 280],
    [-145, 280]
];

blocks.forEach((position, index) => {

    const [x, z] = position;

    const width = 22 + Math.random() * 14;
    const depth = 22 + Math.random() * 14;
    const height = 10 + Math.random() * 35;

    createBuilding(
        x,
        z,
        width,
        depth,
        height,
        buildingColors[index % buildingColors.length]
    );
});

// ======================================================
// MODERN TOWERS
// ======================================================

function createTower(x, z) {

    const height = 70 + Math.random() * 50;

    const tower = new THREE.Mesh(
        new THREE.BoxGeometry(26, height, 26),
        mat(0x65737a, 0.45)
    );

    tower.position.set(
        x,
        height / 2,
        z
    );

    tower.castShadow = true;

    scene.add(tower);

    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(28, 2, 28),
        mat(0x30383b)
    );

    roof.position.set(
        x,
        height + 1,
        z
    );

    scene.add(roof);
}

createTower(-260, -40);
createTower(-260, 80);
createTower(-260, 200);

// ======================================================
// TREES
// ======================================================

function createTree(x, z, scale = 1) {

    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.8 * scale,
            1.1 * scale,
            6 * scale,
            8
        ),
        mat(0x65452e)
    );

    trunk.position.set(
        x,
        3 * scale,
        z
    );

    scene.add(trunk);

    const crown = new THREE.Mesh(
        new THREE.SphereGeometry(
            4.5 * scale,
            10,
            8
        ),
        mat(0x28733d)
    );

    crown.position.set(
        x,
        8 * scale,
        z
    );

    crown.castShadow = true;

    scene.add(crown);
}

// Maidan-style trees
for (let i = 0; i < 35; i++) {

    const x = -20 + Math.random() * 120;
    const z = 190 + Math.random() * 170;

    createTree(x, z, 0.8 + Math.random() * 0.5);
}

// Street trees
for (let z = -380; z < 380; z += 35) {

    createTree(-67, z, 0.55);
    createTree(-13, z, 0.55);
}

// ======================================================
// STREET LIGHTS
// ======================================================

function createStreetLight(x, z) {

    const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.15,
            0.2,
            7,
            8
        ),
        mat(0x353535)
    );

    pole.position.set(
        x,
        3.5,
        z
    );

    scene.add(pole);

    const lamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 8, 8),
        mat(0xffe7a0)
    );

    lamp.position.set(
        x,
        7.2,
        z
    );

    scene.add(lamp);
}

for (let z = -380; z < 380; z += 35) {
    createStreetLight(-72, z);
    createStreetLight(-8, z);
}

// ======================================================
// VICTORIA MEMORIAL-INSPIRED LANDMARK
// ======================================================

function createVictoriaMemorial(x, z) {

    const white = mat(0xe8e4d6);

    // Main building
    const base = new THREE.Mesh(
        new THREE.BoxGeometry(65, 10, 42),
        white
    );

    base.position.set(x, 5, z);
    base.castShadow = true;

    scene.add(base);

    // Central dome
    const dome = new THREE.Mesh(
        new THREE.SphereGeometry(
            18,
            32,
            16,
            0,
            Math.PI * 2,
            0,
            Math.PI / 2
        ),
        white
    );

    dome.position.set(
        x,
        20,
        z
    );

    dome.castShadow = true;

    scene.add(dome);

    // Dome tower
    const tower = new THREE.Mesh(
        new THREE.CylinderGeometry(
            11,
            11,
            12,
            24
        ),
        white
    );

    tower.position.set(
        x,
        15,
        z
    );

    scene.add(tower);

    // Small corner domes
    const corners = [
        [-25, -14],
        [25, -14],
        [-25, 14],
        [25, 14]
    ];

    corners.forEach(([cx, cz]) => {

        const small = new THREE.Mesh(
            new THREE.SphereGeometry(
                5,
                16,
                10,
                0,
                Math.PI * 2,
                0,
                Math.PI / 2
            ),
            white
        );

        small.position.set(
            x + cx,
            13,
            z + cz
        );

        scene.add(small);
    });

    // Central statue-style point
    const spire = new THREE.Mesh(
        new THREE.ConeGeometry(2.5, 9, 12),
        mat(0xd8caa5)
    );

    spire.position.set(
        x,
        39,
        z
    );

    scene.add(spire);
}

createVictoriaMemorial(-120, 290);

// ======================================================
// RAJ BHAVAN-INSPIRED GOVERNMENT BUILDING
// ======================================================

function createRajBhavan(x, z) {

    const cream = mat(0xd8c7a5);

    const main = new THREE.Mesh(
        new THREE.BoxGeometry(60, 18, 48),
        cream
    );

    main.position.set(
        x,
        9,
        z
    );

    main.castShadow = true;

    scene.add(main);

    // Front columns
    for (let i = -4; i <= 4; i++) {

        const column = new THREE.Mesh(
            new THREE.CylinderGeometry(
                1.3,
                1.5,
                15,
                12
            ),
            cream
        );

        column.position.set(
            x + i * 6,
            7.5,
            z - 25
        );

        scene.add(column);
    }

    // Roof
    const roof = new THREE.Mesh(
        new THREE.ConeGeometry(
            38,
            14,
            4
        ),
        cream
    );

    roof.rotation.y = Math.PI / 4;

    roof.position.set(
        x,
        25,
        z
    );

    scene.add(roof);

    // Entrance
    const entrance = new THREE.Mesh(
        new THREE.BoxGeometry(12, 10, 3),
        mat(0x6e5743)
    );

    entrance.position.set(
        x,
        5,
        z - 25
    );

    scene.add(entrance);
}

createRajBhavan(-230, 280);

// ======================================================
// HOWRAH BRIDGE-INSPIRED STRUCTURE
// ======================================================

function createBridge() {

    const bridgeZ = 0;

    const deck = new THREE.Mesh(
        new THREE.BoxGeometry(170, 4, 28),
        mat(0x5b5550)
    );

    deck.position.set(
        95,
        16,
        bridgeZ
    );

    deck.castShadow = true;

    scene.add(deck);

    // Towers
    const towerPositions = [35, 155];

    towerPositions.forEach((x) => {

        const tower = new THREE.Group();

        const left = new THREE.Mesh(
            new THREE.BoxGeometry(9, 55, 9),
            mat(0x5d5752)
        );

        left.position.set(-17, 27, 0);

        tower.add(left);

        const right = new THREE.Mesh(
            new THREE.BoxGeometry(9, 55, 9),
            mat(0x5d5752)
        );

        right.position.set(17, 27, 0);

        tower.add(right);

        const top = new THREE.Mesh(
            new THREE.BoxGeometry(43, 8, 9),
            mat(0x5d5752)
        );

        top.position.set(0, 52, 0);

        tower.add(top);

        tower.position.set(
            x,
            0,
            bridgeZ
        );

        scene.add(tower);
    });

    // Suspender beams
    for (let x = 45; x < 155; x += 12) {

        const beam = new THREE.Mesh(
            new THREE.BoxGeometry(
                1.5,
                35,
                1.5
            ),
            mat(0x68615b)
        );

        beam.position.set(
            x,
            27,
            bridgeZ
        );

        scene.add(beam);
    }

    // River crossing support
    const support = new THREE.Mesh(
        new THREE.BoxGeometry(170, 2, 2),
        mat(0x45413d)
    );

    support.position.set(
        95,
        43,
        0
    );

    scene.add(support);
}

createBridge();

// ======================================================
// YELLOW TAXIS
// ======================================================

function createTaxi(x, z, rotation = 0) {

    const taxi = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(5, 1.8, 9),
        mat(0xf0bd32)
    );

    body.position.y = 1.2;

    taxi.add(body);

    const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(4, 1.8, 4.5),
        mat(0xf0bd32)
    );

    cabin.position.y = 2.9;

    taxi.add(cabin);

    const windowMaterial = mat(0x263d48);

    const frontWindow = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 1.1, 0.12),
        windowMaterial
    );

    frontWindow.position.set(
        0,
        3,
        -2.3
    );

    taxi.add(frontWindow);

    // Wheels
    const wheelMaterial = mat(0x171717);

    [-3, 3].forEach((zWheel) => {

        const wheel = new THREE.Mesh(
            new THREE.CylinderGeometry(
                1,
                1,
                0.7,
                12
            ),
            wheelMaterial
        );

        wheel.rotation.z = Math.PI / 2;

        wheel.position.set(
            2.5,
            0.9,
            zWheel
        );

        taxi.add(wheel);

        const wheel2 = wheel.clone();

        wheel2.position.x = -2.5;

        taxi.add(wheel2);
    });

    taxi.position.set(x, 0, z);
    taxi.rotation.y = rotation;

    taxi.castShadow = true;

    scene.add(taxi);

    return taxi;
}

createTaxi(-40, -40, 0);
createTaxi(-40, 65, Math.PI);
createTaxi(-105, 100, 0);
createTaxi(40, -80, Math.PI);

// ======================================================
// SIMPLE TRAM
// ======================================================

function createTram(x, z) {

    const tram = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(4, 3.5, 16),
        mat(0x3f9c91)
    );

    body.position.y = 2;

    tram.add(body);

    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(4.5, 0.4, 16.5),
        mat(0xd6d1bf)
    );

    roof.position.y = 4;

    tram.add(roof);

    for (let i = -5; i <= 5; i += 2.5) {

        const window = new THREE.Mesh(
            new THREE.BoxGeometry(
                0.12,
                1.3,
                1.7
            ),
            mat(0x263d48)
        );

        window.position.set(
            2.05,
            2.5,
            i
        );

        tram.add(window);

        const window2 = window.clone();

        window2.position.x = -2.05;

        tram.add(window2);
    }

    tram.position.set(x, 0, z);

    scene.add(tram);
}

createTram(-40, 110);

// ======================================================
// PLAYER — HUMANOID STYLE
// ======================================================

const player = new THREE.Group();

// Body
const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 2.2, 0.9),
    mat(0x1769aa)
);

body.position.y = 2.8;
body.castShadow = true;

player.add(body);

// Head
const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.7, 16, 12),
    mat(0xc88b62)
);

head.position.y = 4.5;
head.castShadow = true;

player.add(head);

// Hair
const hair = new THREE.Mesh(
    new THREE.SphereGeometry(
        0.73,
        16,
        8,
        0,
        Math.PI * 2,
        0,
        Math.PI / 2
    ),
    mat(0x191919)
);

hair.position.y = 4.75;

player.add(hair);

// Arms
function createLimb(x) {

    const arm = new THREE.Mesh(
        new THREE.CapsuleGeometry(
            0.25,
            1.4,
            6,
            10
        ),
        mat(0xc88b62)
    );

    arm.position.set(
        x,
        2.8,
        0
    );

    arm.rotation.z =
        x > 0 ? -0.12 : 0.12;

    arm.castShadow = true;

    player.add(arm);
}

createLimb(1.0);
createLimb(-1.0);

// Legs
function createLeg(x) {

    const leg = new THREE.Mesh(
        new THREE.CapsuleGeometry(
            0.28,
            1.5,
            6,
            10
        ),
        mat(0x222b39)
    );

    leg.position.set(
        x,
        1,
        0
    );

    leg.castShadow = true;

    player.add(leg);
}

createLeg(0.45);
createLeg(-0.45);

player.position.set(
    -40,
    0,
    60
);

scene.add(player);

// ======================================================
// PLAYER CONTROLS
// ======================================================

const keys = {};

window.addEventListener("keydown", (event) => {
    keys[event.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
});

// ======================================================
// CAMERA
// ======================================================

camera.position.set(
    player.position.x,
    8,
    player.position.z + 14
);

camera.lookAt(
    player.position.x,
    2,
    player.position.z
);

// ======================================================
// GAME LOOP
// ======================================================

const clock = new THREE.Clock();

function animate() {

    requestAnimationFrame(animate);

    const delta = Math.min(
        clock.getDelta(),
        0.05
    );

    const running = keys["shift"];
    const speed = running ? 28 : 16;

    let moving = false;

    if (keys["w"]) {
        player.position.z -= speed * delta;
        moving = true;
    }

    if (keys["s"]) {
        player.position.z += speed * delta;
        moving = true;
    }

    if (keys["a"]) {
        player.position.x -= speed * delta;
        player.rotation.y = Math.PI / 2;
        moving = true;
    }

    if (keys["d"]) {
        player.position.x += speed * delta;
        player.rotation.y = -Math.PI / 2;
        moving = true;
    }

    // Small walking animation
    if (moving) {

        player.position.y =
            Math.abs(Math.sin(
                performance.now() * 0.012
            )) * 0.08;
    } else {

        player.position.y *= 0.8;
    }

    // Keep player in world
    player.position.x = THREE.MathUtils.clamp(
        player.position.x,
        -420,
        300
    );

    player.position.z = THREE.MathUtils.clamp(
        player.position.z,
        -450,
        450
    );

    // Camera follow
    const desiredCamera = new THREE.Vector3(
        player.position.x,
        player.position.y + 8,
        player.position.z + 14
    );

    camera.position.lerp(
        desiredCamera,
        0.08
    );

    camera.lookAt(
        player.position.x,
        player.position.y + 2.3,
        player.position.z
    );

    renderer.render(
        scene,
        camera
    );
}

animate();

// ======================================================
// RESIZE
// ======================================================

window.addEventListener("resize", () => {

    camera.aspect =
        window.innerWidth /
        window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
});
