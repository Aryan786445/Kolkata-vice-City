import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js";

/* =========================================================
   KOLKATA VICE CITY — V7
   Footpath Collision FIX
   Cars + Traffic + NPCs + Character + Landmarks
========================================================= */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87b8d8);
scene.fog = new THREE.Fog(0x87b8d8, 180, 1500);

const camera = new THREE.PerspectiveCamera(
    70,
    innerWidth / innerHeight,
    0.1,
    2200
);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.appendChild(renderer.domElement);

/* =========================================================
   UI
========================================================= */

const ui = document.createElement("div");
ui.style.cssText = `
position:fixed;
inset:0;
pointer-events:none;
color:white;
font-family:Arial,sans-serif;
z-index:20;
text-shadow:2px 2px 5px #000;
`;
document.body.appendChild(ui);

const title = document.createElement("div");
title.innerHTML = "KOLKATA VICE CITY";
title.style.cssText = `
position:absolute;
top:18px;
left:24px;
font-size:24px;
font-weight:bold;
letter-spacing:3px;
`;
ui.appendChild(title);

const moneyUI = document.createElement("div");
moneyUI.innerHTML = "₹ 0";
moneyUI.style.cssText = `
position:absolute;
top:18px;
right:25px;
font-size:22px;
font-weight:bold;
`;
ui.appendChild(moneyUI);

const wantedUI = document.createElement("div");
wantedUI.innerHTML = "☆ ☆ ☆ ☆ ☆";
wantedUI.style.cssText = `
position:absolute;
top:52px;
right:25px;
font-size:22px;
letter-spacing:2px;
`;
ui.appendChild(wantedUI);

const speedUI = document.createElement("div");
speedUI.style.cssText = `
position:absolute;
bottom:28px;
right:30px;
font-size:18px;
font-weight:bold;
`;
ui.appendChild(speedUI);

const controlsUI = document.createElement("div");
controlsUI.innerHTML = `
WASD — Move / Drive<br>
SHIFT — Run<br>
E — Enter / Exit Vehicle<br>
Mouse — Camera<br>
ESC — Release Mouse
`;
controlsUI.style.cssText = `
position:absolute;
bottom:25px;
left:25px;
font-size:13px;
line-height:1.55;
`;
ui.appendChild(controlsUI);

const crosshair = document.createElement("div");
crosshair.innerHTML = "+";
crosshair.style.cssText = `
position:absolute;
left:50%;
top:50%;
transform:translate(-50%,-50%);
font-size:28px;
font-weight:bold;
`;
ui.appendChild(crosshair);

const interactionUI = document.createElement("div");
interactionUI.style.cssText = `
position:absolute;
left:50%;
bottom:130px;
transform:translateX(-50%);
padding:9px 16px;
border-radius:7px;
background:rgba(0,0,0,.65);
font-size:14px;
display:none;
`;
ui.appendChild(interactionUI);

/* =========================================================
   LIGHTING
========================================================= */

const hemi = new THREE.HemisphereLight(
    0xbfdcff,
    0x405040,
    2.2
);
scene.add(hemi);

const sun = new THREE.DirectionalLight(
    0xffffff,
    3
);
sun.position.set(250, 400, 150);
sun.castShadow = true;

sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;

sun.shadow.camera.left = -500;
sun.shadow.camera.right = 500;
sun.shadow.camera.top = 500;
sun.shadow.camera.bottom = -500;

scene.add(sun);

/* =========================================================
   MATERIALS
========================================================= */

const MAT = {
    road: new THREE.MeshStandardMaterial({
        color: 0x24262b,
        roughness: 0.9
    }),

    sidewalk: new THREE.MeshStandardMaterial({
        color: 0x9c9c9c,
        roughness: 1
    }),

    grass: new THREE.MeshStandardMaterial({
        color: 0x4d783e,
        roughness: 1
    }),

    river: new THREE.MeshStandardMaterial({
        color: 0x267da0,
        roughness: 0.5,
        metalness: 0.05
    }),

    wall: new THREE.MeshStandardMaterial({
        color: 0xc9a77b,
        roughness: 0.9
    }),

    white: new THREE.MeshStandardMaterial({
        color: 0xf0eee6
    }),

    red: new THREE.MeshStandardMaterial({
        color: 0xa7352e
    }),

    blue: new THREE.MeshStandardMaterial({
        color: 0x315f9b
    }),

    yellow: new THREE.MeshStandardMaterial({
        color: 0xf0c32d
    }),

    dark: new THREE.MeshStandardMaterial({
        color: 0x17191c
    }),

    skin: new THREE.MeshStandardMaterial({
        color: 0xb97852
    }),

    hair: new THREE.MeshStandardMaterial({
        color: 0x111111
    })
};

/* =========================================================
   WORLD DATA
========================================================= */

const colliders = [];
const vehicles = [];
const npcs = [];

const player = {
    group: null,
    speed: 0.45,
    runSpeed: 0.85,
    radius: 1.15
};

let currentVehicle = null;
let money = 0;
let wanted = 0;

const keys = {};

window.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;

    if (e.key.toLowerCase() === "e") {
        toggleVehicle();
    }
});

window.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

/* =========================================================
   BASIC HELPERS
========================================================= */

function makeBox(
    x,
    y,
    z,
    sx,
    sy,
    sz,
    material,
    collision = false
) {
    const geo = new THREE.BoxGeometry(sx, sy, sz);
    const mesh = new THREE.Mesh(geo, material);

    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    scene.add(mesh);

    if (collision) {
        colliders.push({
            minX: x - sx / 2,
            maxX: x + sx / 2,
            minZ: z - sz / 2,
            maxZ: z + sz / 2
        });
    }

    return mesh;
}

function makeCylinder(
    x,
    y,
    z,
    radius,
    height,
    material,
    collision = false
) {
    const geo = new THREE.CylinderGeometry(
        radius,
        radius,
        height,
        16
    );

    const mesh = new THREE.Mesh(geo, material);

    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    scene.add(mesh);

    if (collision) {
        colliders.push({
            minX: x - radius,
            maxX: x + radius,
            minZ: z - radius,
            maxZ: z + radius
        });
    }

    return mesh;
}

/* =========================================================
   GROUND
========================================================= */

makeBox(
    0,
    -0.25,
    0,
    1900,
    0.5,
    1900,
    MAT.grass,
    false
);

/* =========================================================
   ROADS
========================================================= */

function createRoad(x, z, width, length, rotation = 0) {

    const road = makeBox(
        x,
        0.02,
        z,
        width,
        0.12,
        length,
        MAT.road,
        false
    );

    road.rotation.y = rotation;

    // IMPORTANT:
    // Roads and footpaths DO NOT create collision.

    return road;
}

function laneMarkings(x, z, width, length, rotation = 0) {

    const group = new THREE.Group();

    for (let i = -length / 2 + 8; i < length / 2; i += 14) {

        const line = new THREE.Mesh(
            new THREE.BoxGeometry(
                0.22,
                0.03,
                6
            ),
            new THREE.MeshStandardMaterial({
                color: 0xf5f5f5
            })
        );

        line.position.set(0, 0.09, i);
        group.add(line);
    }

    group.position.set(x, 0, z);
    group.rotation.y = rotation;

    scene.add(group);
}

createRoad(0, 0, 26, 1600);
createRoad(0, 0, 1600, 26, Math.PI / 2);

createRoad(260, 0, 20, 1000);
createRoad(-260, 0, 20, 1000);

createRoad(0, 260, 1000, 20, Math.PI / 2);
createRoad(0, -260, 1000, 20, Math.PI / 2);

laneMarkings(0, 0, 26, 1600);
laneMarkings(260, 0, 20, 1000);
laneMarkings(-260, 0, 20, 1000);

/* =========================================================
   FOOTPATHS
========================================================= */

function createFootpath(x, z, width, length, rotation = 0) {

    const path = makeBox(
        x,
        0.13,
        z,
        width,
        0.22,
        length,
        MAT.sidewalk,
        false
    );

    path.rotation.y = rotation;

    // NO COLLISION HERE
    // This fixes the V6 blocking problem.

    return path;
}

createFootpath(16, 0, 6, 1600);
createFootpath(-16, 0, 6, 1600);

createFootpath(0, 16, 6, 1600, Math.PI / 2);
createFootpath(0, -16, 6, 1600, Math.PI / 2);

createFootpath(276, 0, 5, 1000);
createFootpath(-276, 0, 5, 1000);

createFootpath(0, 276, 5, 1000, Math.PI / 2);
createFootpath(0, -276, 5, 1000, Math.PI / 2);

/* =========================================================
   BUILDINGS
========================================================= */

const buildingColors = [
    0xc87d57,
    0xd3aa6e,
    0xa76b58,
    0xb8b1a1,
    0x7d8b91,
    0xc8c0a5,
    0x967060
];

function addWindows(building, width, height, depth) {

    const windowMat = new THREE.MeshStandardMaterial({
        color: 0x6db2d1,
        emissive: 0x17242a
    });

    for (
        let y = 3;
        y < height - 1;
        y += 3.2
    ) {

        for (
            let x = -width / 2 + 2;
            x < width / 2 - 1;
            x += 3
        ) {

            const win = new THREE.Mesh(
                new THREE.BoxGeometry(
                    1.1,
                    1.4,
                    0.08
                ),
                windowMat
            );

            win.position.set(
                x,
                y,
                depth / 2 + 0.04
            );

            building.add(win);
        }
    }
}

function createBuilding(
    x,
    z,
    width,
    height,
    depth,
    color
) {

    const group = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(
            width,
            height,
            depth
        ),
        new THREE.MeshStandardMaterial({
            color,
            roughness: 0.85
        })
    );

    body.position.y = height / 2;
    body.castShadow = true;
    body.receiveShadow = true;

    group.add(body);

    addWindows(
        group,
        width,
        height,
        depth
    );

    group.position.set(x, 0, z);

    scene.add(group);

    colliders.push({
        minX: x - width / 2,
        maxX: x + width / 2,
        minZ: z - depth / 2,
        maxZ: z + depth / 2
    });

    return group;
}

/* =========================================================
   CITY BLOCKS
========================================================= */

for (let x = -520; x <= 520; x += 80) {

    for (let z = -520; z <= 520; z += 80) {

        if (
            Math.abs(x) < 45 ||
            Math.abs(z) < 45
        ) continue;

        if (
            Math.abs(x) < 120 &&
            Math.abs(z) < 120
        ) continue;

        const width = 42 + Math.random() * 18;
        const depth = 38 + Math.random() * 20;
        const height = 18 + Math.random() * 65;

        const color =
            buildingColors[
                Math.floor(
                    Math.random() *
                    buildingColors.length
                )
            ];

        createBuilding(
            x + (Math.random() - 0.5) * 12,
            z + (Math.random() - 0.5) * 12,
            width,
            height,
            depth,
            color
        );
    }
}

/* =========================================================
   HOOGHLY RIVER
========================================================= */

const river = makeBox(
    720,
    -0.1,
    0,
    280,
    0.15,
    1500,
    MAT.river,
    false
);

river.receiveShadow = false;

/* River bank */
makeBox(
    570,
    0,
    0,
    20,
    0.4,
    1500,
    MAT.wall,
    false
);

/* =========================================================
   TREES
========================================================= */

function createTree(x, z) {

    const trunk = makeCylinder(
        x,
        2.5,
        z,
        0.55,
        5,
        new THREE.MeshStandardMaterial({
            color: 0x69462c
        }),
        false
    );

    const leaves = new THREE.Mesh(
        new THREE.SphereGeometry(
            3.5,
            12,
            10
        ),
        new THREE.MeshStandardMaterial({
            color: 0x2f7139
        })
    );

    leaves.position.set(
        x,
        7,
        z
    );

    leaves.castShadow = true;

    scene.add(leaves);
}

for (let i = 0; i < 70; i++) {

    const x =
        (Math.random() - 0.5) * 1000;

    const z =
        (Math.random() - 0.5) * 1000;

    if (
        Math.abs(x) < 60 ||
        Math.abs(z) < 60
    ) continue;

    createTree(x, z);
}

/* =========================================================
   VICTORIA MEMORIAL INSPIRED
========================================================= */

function createVictoria() {

    const group = new THREE.Group();

    const base = new THREE.Mesh(
        new THREE.BoxGeometry(
            70,
            5,
            45
        ),
        MAT.white
    );

    base.position.y = 2.5;
    group.add(base);

    const main = new THREE.Mesh(
        new THREE.BoxGeometry(
            50,
            24,
            30
        ),
        MAT.white
    );

    main.position.y = 17;
    group.add(main);

    const dome = new THREE.Mesh(
        new THREE.SphereGeometry(
            16,
            24,
            16,
            0,
            Math.PI * 2,
            0,
            Math.PI / 2
        ),
        MAT.white
    );

    dome.position.y = 36;
    group.add(dome);

    const tower = new THREE.Mesh(
        new THREE.CylinderGeometry(
            3,
            4,
            10,
            16
        ),
        MAT.white
    );

    tower.position.y = 49;
    group.add(tower);

    group.position.set(
        -170,
        0,
        -170
    );

    group.traverse(obj => {
        if (obj.isMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
        }
    });

    scene.add(group);

    colliders.push({
        minX: -210,
        maxX: -130,
        minZ: -200,
        maxZ: -140
    });
}

createVictoria();

/* =========================================================
   HOWRAH BRIDGE INSPIRED
========================================================= */

function createBridge() {

    const bridge = new THREE.Group();

    const bridgeMat =
        new THREE.MeshStandardMaterial({
            color: 0x62676a,
            metalness: 0.5,
            roughness: 0.6
        });

    const deck = new THREE.Mesh(
        new THREE.BoxGeometry(
            220,
            4,
            18
        ),
        bridgeMat
    );

    deck.position.y = 28;
    bridge.add(deck);

    for (const x of [-80, 80]) {

        const tower = new THREE.Mesh(
            new THREE.BoxGeometry(
                8,
                70,
                12
            ),
            bridgeMat
        );

        tower.position.set(
            x,
            63,
            0
        );

        bridge.add(tower);
    }

    for (
        let x = -100;
        x <= 100;
        x += 20
    ) {

        const cable = new THREE.Mesh(
            new THREE.BoxGeometry(
                1.2,
                60,
                1.2
            ),
            bridgeMat
        );

        cable.position.set(
            x,
            48,
            0
        );

        bridge.add(cable);
    }

    bridge.position.set(
        520,
        0,
        0
    );

    scene.add(bridge);
}

createBridge();

/* =========================================================
   MAIDAN
========================================================= */

makeBox(
    -250,
    0.05,
    240,
    240,
    0.15,
    180,
    MAT.grass,
    false
);

/* =========================================================
   MACHH BHAAT SHOP
========================================================= */

function createShop() {

    const group = new THREE.Group();

    const building = new THREE.Mesh(
        new THREE.BoxGeometry(
            32,
            13,
            22
        ),
        new THREE.MeshStandardMaterial({
            color: 0xb45d38
        })
    );

    building.position.y = 6.5;
    group.add(building);

    const sign = document.createElement("canvas");
    sign.width = 512;
    sign.height = 128;

    const ctx = sign.getContext("2d");

    ctx.fillStyle = "#f2d26b";
    ctx.fillRect(
        0,
        0,
        512,
        128
    );

    ctx.fillStyle = "#8c231f";
    ctx.font = "bold 55px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
        "মাছ • ভাত",
        256,
        78
    );

    const texture =
        new THREE.CanvasTexture(sign);

    const signMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(
            18,
            4.5
        ),
        new THREE.MeshBasicMaterial({
            map: texture
        })
    );

    signMesh.position.set(
        0,
        10,
        11.1
    );

    group.add(signMesh);

    group.position.set(
        -80,
        0,
        150
    );

    group.traverse(obj => {
        if (obj.isMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
        }
    });

    scene.add(group);

    colliders.push({
        minX: -96,
        maxX: -64,
        minZ: 139,
        maxZ: 161
    });
}

createShop();

/* =========================================================
   KOLKATA PORT
========================================================= */

function createPort() {

    const portX = 430;
    const portZ = 230;

    makeBox(
        portX,
        0.3,
        portZ,
        170,
        0.5,
        130,
        new THREE.MeshStandardMaterial({
            color: 0x555555
        }),
        false
    );

    for (let i = 0; i < 8; i++) {

        const container = makeBox(
            portX - 65 + (i % 4) * 42,
            2,
            portZ - 35 + Math.floor(i / 4) * 40,
            35,
            4,
            18,
            new THREE.MeshStandardMaterial({
                color:
                    i % 2
                        ? 0x9a3933
                        : 0x315e73
            }),
            true
        );
    }

    // Crane towers
    for (const x of [380, 470]) {

        makeBox(
            x,
            28,
            portZ,
            5,
            56,
            5,
            MAT.dark,
            true
        );

        makeBox(
            x + 20,
            55,
            portZ,
            45,
            4,
            4,
            MAT.dark,
            true
        );
    }

    // Warehouse
    makeBox(
        portX,
        15,
        portZ + 75,
        110,
        30,
        35,
        new THREE.MeshStandardMaterial({
            color: 0x77716a
        }),
        true
    );
}

createPort();

/* =========================================================
   CHARACTER
========================================================= */

function createPlayer() {

    const group = new THREE.Group();

    // Legs
    const legMat =
        new THREE.MeshStandardMaterial({
            color: 0x202b38
        });

    const leftLeg = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.8,
            3.2,
            0.9
        ),
        legMat
    );

    leftLeg.position.set(
        -0.55,
        1.6,
        0
    );

    group.add(leftLeg);

    const rightLeg = leftLeg.clone();

    rightLeg.position.x = 0.55;

    group.add(rightLeg);

    // Shoes
    const shoeMat =
        new THREE.MeshStandardMaterial({
            color: 0x161616
        });

    const leftShoe = new THREE.Mesh(
        new THREE.BoxGeometry(
            1,
            0.6,
            1.6
        ),
        shoeMat
    );

    leftShoe.position.set(
        -0.55,
        0.25,
        -0.25
    );

    group.add(leftShoe);

    const rightShoe = leftShoe.clone();

    rightShoe.position.x = 0.55;

    group.add(rightShoe);

    // Torso
    const shirtMat =
        new THREE.MeshStandardMaterial({
            color: 0x24659b
        });

    const torso = new THREE.Mesh(
        new THREE.BoxGeometry(
            2.1,
            3,
            1.35
        ),
        shirtMat
    );

    torso.position.y = 4.3;

    group.add(torso);

    // Neck
    const neck = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.35,
            0.35,
            0.6,
            12
        ),
        MAT.skin
    );

    neck.position.y = 6.05;

    group.add(neck);

    // Head
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(
            1.25,
            24,
            18
        ),
        MAT.skin
    );

    head.position.y = 7.4;

    group.add(head);

    // Hair
    const hair = new THREE.Mesh(
        new THREE.SphereGeometry(
            1.28,
            24,
            12,
            0,
            Math.PI * 2,
            0,
            Math.PI / 2
        ),
        MAT.hair
    );

    hair.position.y = 7.85;

    group.add(hair);

    // Eyes
    const eyeMat =
        new THREE.MeshStandardMaterial({
            color: 0xffffff
        });

    const pupilMat =
        new THREE.MeshStandardMaterial({
            color: 0x111111
        });

    for (const x of [-0.42, 0.42]) {

        const eye = new THREE.Mesh(
            new THREE.SphereGeometry(
                0.17,
                10,
                8
            ),
            eyeMat
        );

        eye.position.set(
            x,
            7.45,
            -1.13
        );

        group.add(eye);

        const pupil = new THREE.Mesh(
            new THREE.SphereGeometry(
                0.08,
                8,
                6
            ),
            pupilMat
        );

        pupil.position.set(
            x,
            7.45,
            -1.25
        );

        group.add(pupil);
    }

    // Nose
    const nose = new THREE.Mesh(
        new THREE.ConeGeometry(
            0.13,
            0.45,
            8
        ),
        MAT.skin
    );

    nose.rotation.x =
        -Math.PI / 2;

    nose.position.set(
        0,
        7.15,
        -1.28
    );

    group.add(nose);

    // Arms
    const armMat =
        new THREE.MeshStandardMaterial({
            color: 0x24659b
        });

    for (const x of [-1.35, 1.35]) {

        const arm = new THREE.Mesh(
            new THREE.BoxGeometry(
                0.55,
                2.7,
                0.7
            ),
            armMat
        );

        arm.position.set(
            x,
            4.35,
            0
        );

        group.add(arm);
    }

    group.position.set(
        0,
        0,
        80
    );

    group.traverse(obj => {
        if (obj.isMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
        }
    });

    scene.add(group);

    return group;
}

player.group = createPlayer();

/* =========================================================
   COLLISION
========================================================= */

function blocked(x, z, radius = 1) {

    for (const box of colliders) {

        if (
            x + radius > box.minX &&
            x - radius < box.maxX &&
            z + radius > box.minZ &&
            z - radius < box.maxZ
        ) {
            return true;
        }
    }

    return false;
}

/* =========================================================
   CAR
========================================================= */

function createCar(
    x,
    z,
    color,
    rotation = 0,
    traffic = false
) {

    const car = new THREE.Group();

    const bodyMat =
        new THREE.MeshStandardMaterial({
            color,
            roughness: 0.65
        });

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(
            4.8,
            1.3,
            8
        ),
        bodyMat
    );

    body.position.y = 1.35;

    car.add(body);

    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(
            3.7,
            1.5,
            4
        ),
        bodyMat
    );

    roof.position.y = 2.45;

    car.add(roof);

    const glassMat =
        new THREE.MeshStandardMaterial({
            color: 0x172b35,
            metalness: 0.2,
            roughness: 0.2
        });

    const frontGlass = new THREE.Mesh(
        new THREE.BoxGeometry(
            3.4,
            0.9,
            0.15
        ),
        glassMat
    );

    frontGlass.position.set(
        0,
        2.5,
        -2.02
    );

    car.add(frontGlass);

    const rearGlass = frontGlass.clone();

    rearGlass.position.z = 2.02;

    car.add(rearGlass);

    const wheelMat =
        new THREE.MeshStandardMaterial({
            color: 0x101010
        });

    for (const wx of [-2.45, 2.45]) {

        for (const wz of [-2.45, 2.45]) {

            const wheel = new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.85,
                    0.85,
                    0.55,
                    16
                ),
                wheelMat
            );

            wheel.rotation.z =
                Math.PI / 2;

            wheel.position.set(
                wx,
                0.8,
                wz
            );

            car.add(wheel);
        }
    }

    car.position.set(
        x,
        0,
        z
    );

    car.rotation.y = rotation;

    car.traverse(obj => {
        if (obj.isMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
        }
    });

    scene.add(car);

    const data = {
        group: car,
        speed: 0,
        traffic,
        occupied: false,
        direction: rotation,
        maxSpeed: traffic ? 0.7 : 1.8
    };

    vehicles.push(data);

    return data;
}

/* =========================================================
   PARKED CARS
========================================================= */

const carColors = [
    0xd62e2e,
    0x2467b3,
    0xf0c52c,
    0xffffff,
    0x1b1b1b,
    0x2f8f58,
    0x9b45a7
];

for (let i = 0; i < 18; i++) {

    const side =
        i % 2 === 0
            ? 1
            : -1;

    createCar(
        side * 21,
        -330 + i * 38,
        carColors[
            i % carColors.length
        ],
        side === 1
            ? 0
            : Math.PI,
        false
    );
}

/* =========================================================
   TRAFFIC
========================================================= */

for (let i = 0; i < 16; i++) {

    const direction =
        i % 2 === 0
            ? 0
            : Math.PI;

    createCar(
        -600 + i * 75,
        i % 2 === 0
            ? -5
            : 5,
        carColors[
            i % carColors.length
        ],
        direction,
        true
    );
}

/* =========================================================
   VEHICLE FUNCTIONS
========================================================= */

function distance(a, b) {

    return a.distanceTo(b);
}

function nearestVehicle() {

    let nearest = null;
    let best = 9;

    const pos =
        player.group.position;

    for (const vehicle of vehicles) {

        if (vehicle.occupied)
            continue;

        const d =
            distance(
                pos,
                vehicle.group.position
            );

        if (d < best) {

            best = d;
            nearest = vehicle;
        }
    }

    return nearest;
}

function enterVehicle(vehicle) {

    if (!vehicle)
        return;

    currentVehicle = vehicle;
    vehicle.occupied = true;

    player.group.visible = false;

    vehicle.group.rotation.y =
        player.group.rotation.y;

    vehicle.speed = 0;

    interactionUI.style.display =
        "none";
}

function exitVehicle() {

    if (!currentVehicle)
        return;

    const car =
        currentVehicle.group;

    const side =
        new THREE.Vector3(
            5,
            0,
            0
        );

    side.applyQuaternion(
        car.quaternion
    );

    const exitPos =
        car.position.clone()
            .add(side);

    currentVehicle.occupied = false;

    player.group.visible = true;

    player.group.position.copy(
        exitPos
    );

    player.group.position.y = 0;

    currentVehicle.speed = 0;

    currentVehicle = null;
}

function toggleVehicle() {

    if (currentVehicle) {
        exitVehicle();
        return;
    }

    const vehicle =
        nearestVehicle();

    if (vehicle) {
        enterVehicle(vehicle);
    }
}

/* =========================================================
   NPCs
========================================================= */

function createNPC(x, z) {

    const npc = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(
            1.2,
            2.3,
            0.8
        ),
        new THREE.MeshStandardMaterial({
            color:
                0x
                +
                Math.floor(
                    Math.random() *
                    0xffffff
                )
                    .toString(16)
                    .padStart(6, "0")
        })
    );

    body.position.y = 1.5;
    npc.add(body);

    const head = new THREE.Mesh(
        new THREE.SphereGeometry(
            0.55,
            12,
            10
        ),
        MAT.skin
    );

    head.position.y = 3.1;

    npc.add(head);

    npc.position.set(
        x,
        0,
        z
    );

    scene.add(npc);

    npcs.push({
        group: npc,
        angle: Math.random() * Math.PI * 2,
        timer: 0
    });
}

for (let i = 0; i < 35; i++) {

    createNPC(
        (Math.random() - 0.5) * 800,
        (Math.random() - 0.5) * 800
    );
}

/* =========================================================
   MOUSE CAMERA
========================================================= */

let yaw = 0;
let pitch = -0.2;
let pointerLocked = false;

renderer.domElement.addEventListener(
    "click",
    () => {
        renderer.domElement.requestPointerLock();
    }
);

document.addEventListener(
    "pointerlockchange",
    () => {
        pointerLocked =
            document.pointerLockElement ===
            renderer.domElement;
    }
);

document.addEventListener(
    "mousemove",
    e => {

        if (!pointerLocked)
            return;

        yaw -= e.movementX * 0.0025;

        pitch -= e.movementY * 0.002;

        pitch = THREE.MathUtils.clamp(
            pitch,
            -1.1,
            0.7
        );
    }
);

/* =========================================================
   PLAYER MOVEMENT
========================================================= */

function updatePlayer() {

    if (currentVehicle)
        return;

    const forward =
        new THREE.Vector3(
            Math.sin(yaw),
            0,
            Math.cos(yaw)
        );

    const right =
        new THREE.Vector3(
            Math.cos(yaw),
            0,
            -Math.sin(yaw)
        );

    const movement =
        new THREE.Vector3();

    if (keys["w"])
        movement.add(forward);

    if (keys["s"])
        movement.sub(forward);

    if (keys["a"])
        movement.sub(right);

    if (keys["d"])
        movement.add(right);

    if (movement.lengthSq() > 0) {

        movement.normalize();

        const speed =
            keys["shift"]
                ? player.runSpeed
                : player.speed;

        const nextX =
            player.group.position.x +
            movement.x * speed;

        const nextZ =
            player.group.position.z +
            movement.z * speed;

        // Buildings block.
        // Footpaths DO NOT block.
        if (!blocked(
            nextX,
            player.group.position.z,
            player.radius
        )) {
            player.group.position.x =
                nextX;
        }

        if (!blocked(
            player.group.position.x,
            nextZ,
            player.radius
        )) {
            player.group.position.z =
                nextZ;
        }

        player.group.rotation.y =
            Math.atan2(
                movement.x,
                movement.z
            );
    }
}

/* =========================================================
   VEHICLE PHYSICS
========================================================= */

function updateVehicle() {

    if (!currentVehicle)
        return;

    const car =
        currentVehicle;

    const group =
        car.group;

    if (keys["w"]) {
        car.speed += 0.035;
    }

    if (keys["s"]) {
        car.speed -= 0.055;
    }

    if (!keys["w"] && !keys["s"]) {
        car.speed *= 0.96;
    }

    car.speed = THREE.MathUtils.clamp(
        car.speed,
        -0.8,
        car.maxSpeed
    );

    const steering =
        0.035 *
        Math.min(
            Math.abs(car.speed) + 0.2,
            1.5
        );

    if (keys["a"])
        group.rotation.y +=
            steering;

    if (keys["d"])
        group.rotation.y -=
            steering;

    const forward =
        new THREE.Vector3(
            -Math.sin(
                group.rotation.y
            ),
            0,
            -Math.cos(
                group.rotation.y
            )
        );

    const next =
        group.position.clone()
            .add(
                forward.multiplyScalar(
                    car.speed
                )
            );

    // Buildings stop cars.
    if (!blocked(
        next.x,
        next.z,
        2.5
    )) {

        group.position.copy(
            next
        );

    } else {

        car.speed *= -0.25;
    }

    speedUI.innerHTML =
        `SPEED ${Math.round(
            Math.abs(car.speed) * 65
        )} km/h`;
}

/* =========================================================
   TRAFFIC UPDATE
========================================================= */

function updateTraffic() {

    for (const car of vehicles) {

        if (
            !car.traffic ||
            car.occupied
        )
            continue;

        const forward =
            new THREE.Vector3(
                -Math.sin(
                    car.group.rotation.y
                ),
                0,
                -Math.cos(
                    car.group.rotation.y
                )
            );

        car.speed +=
            (0.35 - car.speed) *
            0.02;

        car.group.position.add(
            forward.multiplyScalar(
                car.speed
            )
        );

        if (
            car.group.position.x >
                650
        ) {
            car.group.position.x =
                -650;
        }

        if (
            car.group.position.x <
                -650
        ) {
            car.group.position.x =
                650;
        }

        if (
            car.group.position.z >
                650
        ) {
            car.group.position.z =
                -650;
        }

        if (
            car.group.position.z <
                -650
        ) {
            car.group.position.z =
                650;
        }
    }
}

/* =========================================================
   NPC UPDATE
========================================================= */

function updateNPCs() {

    for (const npc of npcs) {

        npc.timer -= 0.016;

        if (npc.timer <= 0) {

            npc.timer =
                2 +
                Math.random() * 5;

            npc.angle =
                Math.random() *
                Math.PI * 2;
        }

        const speed = 0.025;

        const nextX =
            npc.group.position.x +
            Math.sin(
                npc.angle
            ) * speed;

        const nextZ =
            npc.group.position.z +
            Math.cos(
                npc.angle
            ) * speed;

        if (!blocked(
            nextX,
            nextZ,
            0.6
        )) {

            npc.group.position.x =
                nextX;

            npc.group.position.z =
                nextZ;
        }
    }
}

/* =========================================================
   INTERACTION
========================================================= */

function updateInteraction() {

    if (currentVehicle) {

        interactionUI.style.display =
            "block";

        interactionUI.innerHTML =
            "E — EXIT VEHICLE";

        return;
    }

    const nearest =
        nearestVehicle();

    if (nearest) {

        interactionUI.style.display =
            "block";

        interactionUI.innerHTML =
            "E — ENTER VEHICLE";

    } else {

        interactionUI.style.display =
            "none";
    }
}

/* =========================================================
   CAMERA
========================================================= */

function updateCamera() {

    if (currentVehicle) {

        const car =
            currentVehicle.group;

        const offset =
            new THREE.Vector3(
                0,
                7,
                14
            );

        offset.applyQuaternion(
            car.quaternion
        );

        const target =
            car.position.clone()
                .add(offset);

        camera.position.lerp(
            target,
            0.12
        );

        camera.lookAt(
            car.position.x,
            car.position.y + 1.5,
            car.position.z
        );

        return;
    }

    const target =
        player.group.position.clone();

    const distance = 12;

    const offset =
        new THREE.Vector3(
            Math.sin(yaw) *
                distance,
            6 -
                pitch * 4,
            Math.cos(yaw) *
                distance
        );

    camera.position.lerp(
        target.clone().add(offset),
        0.12
    );

    camera.lookAt(
        target.x,
        target.y + 3,
        target.z
    );
}

/* =========================================================
   MINIMAP
========================================================= */

const minimap =
    document.createElement("canvas");

minimap.width = 170;
minimap.height = 170;

minimap.style.cssText = `
position:absolute;
right:25px;
bottom:90px;
width:170px;
height:170px;
border:3px solid rgba(255,255,255,.8);
border-radius:50%;
background:rgba(20,30,35,.72);
`;

ui.appendChild(minimap);

const mapCtx =
    minimap.getContext("2d");

function drawMinimap() {

    mapCtx.clearRect(
        0,
        0,
        170,
        170
    );

    mapCtx.fillStyle =
        "#18343e";

    mapCtx.fillRect(
        0,
        0,
        170,
        170
    );

    // Roads
    mapCtx.fillStyle =
        "#555";

    mapCtx.fillRect(
        0,
        75,
        170,
        20
    );

    mapCtx.fillRect(
        75,
        0,
        20,
        170
    );

    // River
    mapCtx.fillStyle =
        "#276f8c";

    mapCtx.fillRect(
        145,
        0,
        25,
        170
    );

    // Player
    mapCtx.fillStyle =
        "#ffffff";

    mapCtx.beginPath();

    mapCtx.arc(
        85,
        85,
        5,
        0,
        Math.PI * 2
    );

    mapCtx.fill();

    // Direction
    mapCtx.strokeStyle =
        "#ffffff";

    mapCtx.lineWidth = 2;

    mapCtx.beginPath();

    mapCtx.moveTo(
        85,
        85
    );

    mapCtx.lineTo(
        85 +
        Math.sin(yaw) * 16,
        85 +
        Math.cos(yaw) * 16
    );

    mapCtx.stroke();
}

/* =========================================================
   DAY/NIGHT LIGHT ANIMATION
========================================================= */

let worldTime = 0;

function updateLighting() {

    worldTime += 0.00015;

    const angle =
        worldTime % (Math.PI * 2);

    sun.position.x =
        Math.cos(angle) * 400;

    sun.position.y =
        Math.max(
            80,
            Math.sin(angle) * 400
        );

    const daylight =
        Math.max(
            0.25,
            Math.sin(angle) * 0.8 + 0.35
        );

    sun.intensity =
        daylight * 3;

    hemi.intensity =
        0.8 +
        daylight;
}

/* =========================================================
   RESIZE
========================================================= */

window.addEventListener(
    "resize",
    () => {

        camera.aspect =
            innerWidth /
            innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            innerWidth,
            innerHeight
        );
    }
);

/* =========================================================
   GAME LOOP
========================================================= */

const clock =
    new THREE.Clock();

function animate() {

    requestAnimationFrame(
        animate
    );

    clock.getDelta();

    updatePlayer();
    updateVehicle();
    updateTraffic();
    updateNPCs();
    updateInteraction();
    updateCamera();
    updateLighting();
    drawMinimap();

    wantedUI.innerHTML =
        "★".repeat(wanted) +
        "☆".repeat(5 - wanted);

    moneyUI.innerHTML =
        `₹ ${money}`;

    renderer.render(
        scene,
        camera
    );
}

updateCamera();
animate();
