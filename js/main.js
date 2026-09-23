import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js";

/* =========================================================
   KOLKATA VICE CITY — V4
   Mouse Lock + Correct WASD + Crosshair
========================================================= */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fc7e8);
scene.fog = new THREE.Fog(0x8fc7e8, 180, 700);

const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.appendChild(renderer.domElement);

/* =========================================================
   CENTER CROSSHAIR
========================================================= */

const crosshair = document.createElement("div");

crosshair.style.position = "fixed";
crosshair.style.left = "50%";
crosshair.style.top = "50%";
crosshair.style.width = "20px";
crosshair.style.height = "20px";
crosshair.style.transform = "translate(-50%, -50%)";
crosshair.style.pointerEvents = "none";
crosshair.style.zIndex = "9998";

crosshair.innerHTML = `
    <div style="
        position:absolute;
        left:9px;
        top:0;
        width:2px;
        height:20px;
        background:white;
        box-shadow:0 0 4px #000;
    "></div>

    <div style="
        position:absolute;
        left:0;
        top:9px;
        width:20px;
        height:2px;
        background:white;
        box-shadow:0 0 4px #000;
    "></div>
`;

document.body.appendChild(crosshair);

/* =========================================================
   LIGHTING
========================================================= */

const hemiLight = new THREE.HemisphereLight(
    0xbfe7ff,
    0x665544,
    2
);

scene.add(hemiLight);

const sun = new THREE.DirectionalLight(
    0xffffff,
    2.2
);

sun.position.set(180, 300, 120);
sun.castShadow = true;

sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;

sun.shadow.camera.left = -500;
sun.shadow.camera.right = 500;
sun.shadow.camera.top = 500;
sun.shadow.camera.bottom = -500;

scene.add(sun);

/* =========================================================
   GROUND
========================================================= */

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1400, 1400),
    new THREE.MeshStandardMaterial({
        color: 0x59634f,
        roughness: 1
    })
);

ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;

scene.add(ground);

/* =========================================================
   HELPERS
========================================================= */

function box(x, y, z, w, h, d, color, cast = true) {

    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({
            color,
            roughness: 0.8
        })
    );

    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;

    scene.add(mesh);

    return mesh;
}

function cylinder(x, y, z, radius, height, color) {

    const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(
            radius,
            radius,
            height,
            12
        ),
        new THREE.MeshStandardMaterial({
            color
        })
    );

    mesh.position.set(
        x,
        y + height / 2,
        z
    );

    mesh.castShadow = true;

    scene.add(mesh);

    return mesh;
}

/* =========================================================
   ROADS
========================================================= */

function road(x, z, width, length, rotation = 0) {

    const roadMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(width, length),
        new THREE.MeshStandardMaterial({
            color: 0x24272b,
            roughness: 0.95
        })
    );

    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.rotation.z = rotation;
    roadMesh.position.set(x, 0.03, z);

    scene.add(roadMesh);

    for (
        let i = -length / 2 + 10;
        i < length / 2;
        i += 18
    ) {

        const line = new THREE.Mesh(
            new THREE.PlaneGeometry(0.35, 8),
            new THREE.MeshBasicMaterial({
                color: 0xffffff
            })
        );

        line.rotation.x = -Math.PI / 2;

        if (rotation === 0) {
            line.position.set(
                x,
                0.05,
                z + i
            );
        } else {
            line.position.set(
                x + i,
                0.05,
                z
            );
        }

        scene.add(line);
    }
}

road(0, 0, 28, 900, 0);
road(0, 0, 28, 900, Math.PI / 2);

road(-180, 0, 20, 700, 0);
road(180, 0, 20, 700, 0);

road(0, -180, 20, 700, Math.PI / 2);
road(0, 180, 20, 700, Math.PI / 2);

/* =========================================================
   SIDEWALKS
========================================================= */

function sidewalk(x, z, w, d) {
    box(
        x,
        0.08,
        z,
        w,
        0.25,
        d,
        0x99958c,
        false
    );
}

sidewalk(18, 0, 5, 900);
sidewalk(-18, 0, 5, 900);
sidewalk(0, 18, 900, 5);
sidewalk(0, -18, 900, 5);

/* =========================================================
   BUILDINGS
========================================================= */

const buildingColors = [
    0xd0a77b,
    0xb9b1a3,
    0xc57b68,
    0x8e9e9b,
    0xd6c28d,
    0x9b7d68,
    0xb7b7b7
];

function building(x, z) {

    const w = 18 + Math.random() * 15;
    const d = 18 + Math.random() * 15;
    const h = 15 + Math.random() * 60;

    const color =
        buildingColors[
            Math.floor(
                Math.random() *
                buildingColors.length
            )
        ];

    box(
        x,
        0,
        z,
        w,
        h,
        d,
        color
    );

    if (Math.random() > 0.45) {

        box(
            x,
            h,
            z,
            w + 1,
            1.5,
            d + 1,
            0x444444
        );
    }

    for (
        let yy = 8;
        yy < h - 5;
        yy += 8
    ) {

        for (
            let xx = -w / 2 + 4;
            xx < w / 2;
            xx += 6
        ) {

            box(
                x + xx,
                yy,
                z - d / 2 - 0.08,
                2.5,
                3,
                0.15,
                0x24384c,
                false
            );
        }
    }
}

for (
    let x = -300;
    x <= 300;
    x += 45
) {

    for (
        let z = -300;
        z <= 300;
        z += 45
    ) {

        if (
            Math.abs(x) < 35 ||
            Math.abs(z) < 35
        ) continue;

        building(x, z);
    }
}

/* =========================================================
   HOOGHLY RIVER
========================================================= */

const river = new THREE.Mesh(
    new THREE.PlaneGeometry(260, 1400),
    new THREE.MeshStandardMaterial({
        color: 0x236c89,
        roughness: 0.35,
        metalness: 0.1
    })
);

river.rotation.x = -Math.PI / 2;
river.position.set(
    -470,
    0.02,
    0
);

scene.add(river);

box(
    -330,
    0,
    0,
    20,
    1,
    1400,
    0x7a735d
);

/* =========================================================
   TREES
========================================================= */

function tree(x, z) {

    cylinder(
        x,
        0,
        z,
        1.2,
        6,
        0x6b4428
    );

    const leaves = new THREE.Mesh(
        new THREE.SphereGeometry(
            5,
            10,
            10
        ),
        new THREE.MeshStandardMaterial({
            color: 0x28733b
        })
    );

    leaves.position.set(
        x,
        9,
        z
    );

    leaves.castShadow = true;

    scene.add(leaves);
}

for (let i = 0; i < 100; i++) {

    const x =
        THREE.MathUtils.randFloatSpread(650);

    const z =
        THREE.MathUtils.randFloatSpread(650);

    if (
        Math.abs(x) < 40 ||
        Math.abs(z) < 40
    ) continue;

    tree(x, z);
}

/* =========================================================
   VICTORIA MEMORIAL INSPIRED
========================================================= */

function victoriaMemorial() {

    const group = new THREE.Group();

    const base = new THREE.Mesh(
        new THREE.BoxGeometry(
            80,
            5,
            55
        ),
        new THREE.MeshStandardMaterial({
            color: 0xe8dfc8
        })
    );

    base.position.y = 2.5;
    group.add(base);

    const hall = new THREE.Mesh(
        new THREE.BoxGeometry(
            58,
            24,
            38
        ),
        new THREE.MeshStandardMaterial({
            color: 0xf0e5cc
        })
    );

    hall.position.y = 17;
    group.add(hall);

    for (
        let x = -20;
        x <= 20;
        x += 10
    ) {

        const column = new THREE.Mesh(
            new THREE.CylinderGeometry(
                2,
                2,
                22,
                16
            ),
            new THREE.MeshStandardMaterial({
                color: 0xf7eedb
            })
        );

        column.position.set(
            x,
            16,
            -21
        );

        group.add(column);
    }

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
        new THREE.MeshStandardMaterial({
            color: 0xe9dfc6
        })
    );

    dome.position.y = 33;

    group.add(dome);

    group.position.set(
        250,
        0,
        -220
    );

    scene.add(group);
}

victoriaMemorial();

/* =========================================================
   RAJ BHAVAN INSPIRED
========================================================= */

function rajBhavan() {

    const group = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(
            75,
            22,
            50
        ),
        new THREE.MeshStandardMaterial({
            color: 0xe2d3b4
        })
    );

    body.position.y = 11;
    group.add(body);

    for (
        let x = -28;
        x <= 28;
        x += 14
    ) {

        const col = new THREE.Mesh(
            new THREE.CylinderGeometry(
                2,
                2,
                20,
                12
            ),
            new THREE.MeshStandardMaterial({
                color: 0xf1e7d0
            })
        );

        col.position.set(
            x,
            10,
            -27
        );

        group.add(col);
    }

    group.position.set(
        240,
        0,
        120
    );

    scene.add(group);
}

rajBhavan();

/* =========================================================
   HOWRAH BRIDGE INSPIRED
========================================================= */

function howrahBridge() {

    const group = new THREE.Group();

    const deck = new THREE.Mesh(
        new THREE.BoxGeometry(
            30,
            4,
            260
        ),
        new THREE.MeshStandardMaterial({
            color: 0x50545a,
            metalness: 0.4
        })
    );

    deck.position.y = 16;
    group.add(deck);

    for (
        let z = -110;
        z <= 110;
        z += 55
    ) {

        const tower = new THREE.Mesh(
            new THREE.BoxGeometry(
                10,
                55,
                10
            ),
            new THREE.MeshStandardMaterial({
                color: 0x50545a,
                metalness: 0.4
            })
        );

        tower.position.set(
            0,
            27,
            z
        );

        group.add(tower);
    }

    group.position.set(
        -350,
        0,
        0
    );

    scene.add(group);
}

howrahBridge();

/* =========================================================
   MAIDAN
========================================================= */

const maidan = new THREE.Mesh(
    new THREE.CircleGeometry(
        100,
        48
    ),
    new THREE.MeshStandardMaterial({
        color: 0x547d3e
    })
);

maidan.rotation.x = -Math.PI / 2;

maidan.position.set(
    120,
    0.04,
    -80
);

scene.add(maidan);

for (let i = 0; i < 35; i++) {

    const angle =
        Math.random() * Math.PI * 2;

    const radius =
        45 + Math.random() * 45;

    tree(
        120 + Math.cos(angle) * radius,
        -80 + Math.sin(angle) * radius
    );
}

/* =========================================================
   YELLOW TAXIS
========================================================= */

function taxi(x, z, rotation = 0) {

    const group = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(
            4.5,
            1.5,
            8
        ),
        new THREE.MeshStandardMaterial({
            color: 0xffc400
        })
    );

    body.position.y = 1.5;
    group.add(body);

    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(
            3.5,
            1.2,
            4
        ),
        new THREE.MeshStandardMaterial({
            color: 0xffc400
        })
    );

    roof.position.y = 2.8;
    group.add(roof);

    const wheelGeo =
        new THREE.CylinderGeometry(
            0.8,
            0.8,
            0.5,
            16
        );

    const wheelMat =
        new THREE.MeshStandardMaterial({
            color: 0x171717
        });

    for (
        const wx of [-2.3, 2.3]
    ) {

        for (
            const wz of [-2.5, 2.5]
        ) {

            const wheel =
                new THREE.Mesh(
                    wheelGeo,
                    wheelMat
                );

            wheel.rotation.z =
                Math.PI / 2;

            wheel.position.set(
                wx,
                0.8,
                wz
            );

            group.add(wheel);
        }
    }

    group.position.set(
        x,
        0,
        z
    );

    group.rotation.y = rotation;

    scene.add(group);
}

taxi(50, 80, Math.PI / 2);
taxi(-70, -90, 0);
taxi(150, 40, Math.PI / 2);

/* =========================================================
   TRAM
========================================================= */

function tram(x, z) {

    const group = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(
            5,
            3,
            18
        ),
        new THREE.MeshStandardMaterial({
            color: 0xb62828
        })
    );

    body.position.y = 2;

    group.add(body);

    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(
            5.4,
            0.5,
            18.4
        ),
        new THREE.MeshStandardMaterial({
            color: 0xddd5bd
        })
    );

    roof.position.y = 3.8;

    group.add(roof);

    group.position.set(
        x,
        0,
        z
    );

    scene.add(group);
}

tram(-70, 140);

/* =========================================================
   PLAYER
========================================================= */

const player = new THREE.Group();

const playerBody = new THREE.Mesh(
    new THREE.CapsuleGeometry(
        1.2,
        2.8,
        6,
        10
    ),
    new THREE.MeshStandardMaterial({
        color: 0x2468c5
    })
);

playerBody.position.y = 3;
playerBody.castShadow = true;

player.add(playerBody);

const head = new THREE.Mesh(
    new THREE.SphereGeometry(
        1.25,
        16,
        16
    ),
    new THREE.MeshStandardMaterial({
        color: 0xc98d68
    })
);

head.position.y = 5.5;
head.castShadow = true;

player.add(head);

const legMat =
    new THREE.MeshStandardMaterial({
        color: 0x20252d
    });

const legGeo =
    new THREE.CylinderGeometry(
        0.42,
        0.5,
        2.5,
        10
    );

const leftLeg =
    new THREE.Mesh(
        legGeo,
        legMat
    );

leftLeg.position.set(
    -0.55,
    1.25,
    0
);

leftLeg.castShadow = true;

player.add(leftLeg);

const rightLeg =
    new THREE.Mesh(
        legGeo,
        legMat
    );

rightLeg.position.set(
    0.55,
    1.25,
    0
);

rightLeg.castShadow = true;

player.add(rightLeg);

player.position.set(
    0,
    0,
    70
);

scene.add(player);

/* =========================================================
   CAMERA
========================================================= */

let cameraYaw = 0;
let cameraPitch = 0.18;

const cameraDistance = 9;
const cameraHeight = 5;

let mouseLocked = false;

/* =========================================================
   CLICK TO PLAY
========================================================= */

const overlay =
    document.createElement("div");

overlay.innerHTML = `
    <div style="
        position:absolute;
        left:50%;
        top:50%;
        transform:translate(-50%,-50%);
        background:rgba(0,0,0,.75);
        padding:24px 34px;
        border-radius:12px;
        text-align:center;
        color:white;
        font-family:Arial,sans-serif;
        box-shadow:0 8px 30px rgba(0,0,0,.5);
    ">

        <div style="
            font-size:28px;
            font-weight:bold;
            margin-bottom:10px;
        ">
            KOLKATA VICE CITY
        </div>

        <div style="
            font-size:19px;
        ">
            CLICK TO PLAY
        </div>

        <div style="
            font-size:13px;
            opacity:.75;
            margin-top:10px;
        ">
            WASD Move • Mouse Look • SHIFT Run • ESC Unlock
        </div>

    </div>
`;

overlay.style.position = "fixed";
overlay.style.inset = "0";
overlay.style.zIndex = "9999";
overlay.style.cursor = "pointer";

document.body.appendChild(overlay);

/* =========================================================
   POINTER LOCK
========================================================= */

function lockMouse() {

    renderer.domElement.requestPointerLock();
}

overlay.addEventListener(
    "click",
    lockMouse
);

renderer.domElement.addEventListener(
    "click",
    () => {

        if (!mouseLocked) {
            lockMouse();
        }

    }
);

document.addEventListener(
    "pointerlockchange",
    () => {

        mouseLocked =
            document.pointerLockElement ===
            renderer.domElement;

        overlay.style.display =
            mouseLocked
                ? "none"
                : "block";

    }
);

/* =========================================================
   MOUSE LOOK
========================================================= */

document.addEventListener(
    "mousemove",
    (event) => {

        if (!mouseLocked) return;

        const sensitivity = 0.0025;

        cameraYaw -=
            event.movementX *
            sensitivity;

        cameraPitch -=
            event.movementY *
            sensitivity;

        cameraPitch =
            THREE.MathUtils.clamp(
                cameraPitch,
                -0.35,
                0.65
            );
    }
);

/* =========================================================
   KEYBOARD
========================================================= */

const keys = {};

window.addEventListener(
    "keydown",
    (event) => {

        keys[event.code] = true;

    }
);

window.addEventListener(
    "keyup",
    (event) => {

        keys[event.code] = false;

    }
);

/* =========================================================
   PLAYER MOVEMENT — FIXED WASD
========================================================= */

function updatePlayer(delta) {

    let forward = 0;
    let right = 0;

    // W = forward
    if (keys["KeyW"]) {
        forward -= 1;
    }

    // S = backward
    if (keys["KeyS"]) {
        forward += 1;
    }

    // A = left
    if (keys["KeyA"]) {
        right -= 1;
    }

    // D = right
    if (keys["KeyD"]) {
        right += 1;
    }

    const length =
        Math.hypot(
            forward,
            right
        );

    if (length <= 0) return;

    forward /= length;
    right /= length;

    const speed =
        (
            keys["ShiftLeft"] ||
            keys["ShiftRight"]
        )
            ? 18
            : 9;

    const direction =
        new THREE.Vector3(
            right,
            0,
            forward
        );

    direction.applyAxisAngle(
        new THREE.Vector3(
            0,
            1,
            0
        ),
        cameraYaw
    );

    player.position.addScaledVector(
        direction,
        speed * delta
    );

    const targetRotation =
        Math.atan2(
            direction.x,
            direction.z
        );

    player.rotation.y =
        THREE.MathUtils.lerp(
            player.rotation.y,
            targetRotation,
            0.18
        );
}

/* =========================================================
   CAMERA UPDATE
========================================================= */

function updateCamera() {

    const target =
        player.position.clone();

    target.y += cameraHeight;

    const horizontal =
        cameraDistance *
        Math.cos(cameraPitch);

    const offset =
        new THREE.Vector3(
            Math.sin(cameraYaw) *
                horizontal,

            cameraDistance *
                Math.sin(cameraPitch),

            Math.cos(cameraYaw) *
                horizontal
        );

    const desired =
        player.position
            .clone()
            .add(offset);

    desired.y += 3;

    camera.position.lerp(
        desired,
        0.15
    );

    camera.lookAt(target);
}

/* =========================================================
   RESIZE
========================================================= */

window.addEventListener(
    "resize",
    () => {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            window.innerWidth,
            window.innerHeight
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

    const delta =
        Math.min(
            clock.getDelta(),
            0.05
        );

    updatePlayer(delta);
    updateCamera();

    renderer.render(
        scene,
        camera
    );
}

updateCamera();
animate();
