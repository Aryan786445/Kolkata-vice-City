import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 100, 500);

const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

document.body.appendChild(renderer.domElement);

// LIGHT
const sunlight = new THREE.DirectionalLight(0xffffff, 2);
sunlight.position.set(100, 150, 100);
sunlight.castShadow = true;
scene.add(sunlight);

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// GROUND
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(600, 600),
    new THREE.MeshStandardMaterial({
        color: 0x4f654d
    })
);

ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ROADS
function createRoad(x, z, width, length) {

    const road = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.1, length),
        new THREE.MeshStandardMaterial({
            color: 0x242424
        })
    );

    road.position.set(x, 0.05, z);
    road.receiveShadow = true;

    scene.add(road);
}

createRoad(0, 0, 30, 600);
createRoad(0, 0, 600, 30);

// BUILDINGS
function createBuilding(x, z, width, depth, height) {

    const building = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshStandardMaterial({
            color: 0xb88763
        })
    );

    building.position.set(x, height / 2, z);
    building.castShadow = true;
    building.receiveShadow = true;

    scene.add(building);
}

// CITY
for (let x = -240; x <= 240; x += 45) {

    for (let z = -240; z <= 240; z += 45) {

        // Roads ke liye jagah
        if (Math.abs(x) < 25 || Math.abs(z) < 25) {
            continue;
        }

        const height = 12 + Math.random() * 35;

        createBuilding(
            x + Math.random() * 8 - 4,
            z + Math.random() * 8 - 4,
            28,
            28,
            height
        );
    }
}

// PLAYER
const player = new THREE.Mesh(
    new THREE.BoxGeometry(2, 4, 2),
    new THREE.MeshStandardMaterial({
        color: 0x1565c0
    })
);

player.position.set(0, 2, 40);
player.castShadow = true;

scene.add(player);

// CAMERA
camera.position.set(0, 8, 55);
camera.lookAt(player.position);

// KEYBOARD
const keys = {};

window.addEventListener("keydown", (event) => {
    keys[event.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
});

// GAME LOOP
const clock = new THREE.Clock();

function animate() {

    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    let speed = keys["shift"] ? 30 : 18;

    if (keys["w"]) {
        player.position.z -= speed * delta;
    }

    if (keys["s"]) {
        player.position.z += speed * delta;
    }

    if (keys["a"]) {
        player.position.x -= speed * delta;
    }

    if (keys["d"]) {
        player.position.x += speed * delta;
    }

    // CAMERA FOLLOW
    const cameraTarget = new THREE.Vector3(
        player.position.x,
        player.position.y + 7,
        player.position.z + 12
    );

    camera.position.lerp(cameraTarget, 0.08);

    camera.lookAt(
        player.position.x,
        player.position.y,
        player.position.z
    );

    renderer.render(scene, camera);
}

animate();

// WINDOW RESIZE
window.addEventListener("resize", () => {

    camera.aspect =
        window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
});
