import * as THREE from "three";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 80, 450);

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

// LIGHTING
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(100, 150, 80);
sun.castShadow = true;
scene.add(sun);

const ambient = new THREE.HemisphereLight(
    0xffffff,
    0x444444,
    1.5
);
scene.add(ambient);

// GROUND
const groundGeometry = new THREE.PlaneGeometry(600, 600);
const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x555555
});

const ground = new THREE.Mesh(
    groundGeometry,
    groundMaterial
);

ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ROAD
function createRoad(x, z, width, length) {

    const geometry = new THREE.BoxGeometry(
        width,
        0.05,
        length
    );

    const material = new THREE.MeshStandardMaterial({
        color: 0x222222
    });

    const road = new THREE.Mesh(
        geometry,
        material
    );

    road.position.set(x, 0.03, z);
    road.receiveShadow = true;

    scene.add(road);
}

createRoad(0, 0, 28, 600);
createRoad(0, 0, 600, 28);

// BUILDINGS
function createBuilding(x, z, width, depth, height) {

    const geometry = new THREE.BoxGeometry(
        width,
        height,
        depth
    );

    const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(
            Math.random(),
            0.25,
            0.45
        )
    });

    const building = new THREE.Mesh(
        geometry,
        material
    );

    building.position.set(
        x,
        height / 2,
        z
    );

    building.castShadow = true;
    building.receiveShadow = true;

    scene.add(building);
}

// CITY BLOCKS
for (let x = -250; x <= 250; x += 45) {

    for (let z = -250; z <= 250; z += 45) {

        if (
            Math.abs(x) < 25 ||
            Math.abs(z) < 25
        ) {
            continue;
        }

        const height =
            12 + Math.random() * 45;

        createBuilding(
            x + (Math.random() * 12 - 6),
            z + (Math.random() * 12 - 6),
            25,
            25,
            height
        );
    }
}

// PLAYER
const playerGeometry = new THREE.BoxGeometry(
    2,
    4,
    2
);

const playerMaterial =
    new THREE.MeshStandardMaterial({
        color: 0x1565c0
    });

const player = new THREE.Mesh(
    playerGeometry,
    playerMaterial
);

player.position.set(0, 2, 40);
player.castShadow = true;

scene.add(player);

// CAMERA
camera.position.set(
    0,
    8,
    55
);

camera.lookAt(player.position);

// CONTROLS
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

    let speed = 18;

    if (keys["shift"]) {
        speed = 30;
    }

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
    const targetCameraPosition = new THREE.Vector3(
        player.position.x,
        player.position.y + 7,
        player.position.z + 12
    );

    camera.position.lerp(
        targetCameraPosition,
        0.08
    );

    camera.lookAt(
        player.position.x,
        player.position.y,
        player.position.z
    );

    renderer.render(scene, camera);
}

animate();

// RESIZE
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
