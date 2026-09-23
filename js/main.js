import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js";

/* =========================================================
   KOLKATA VICE CITY — V7.2
   Small character + fast movement + cars + NPC + city
   ========================================================= */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fc9ed);
scene.fog = new THREE.Fog(0x8fc9ed, 120, 520);

const camera = new THREE.PerspectiveCamera(
  70,
  innerWidth / innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.innerHTML = "";
document.body.appendChild(renderer.domElement);

/* ================= LIGHT ================= */

const hemi = new THREE.HemisphereLight(0xcfeeff, 0x554433, 1.5);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(120, 180, 80);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -250;
sun.shadow.camera.right = 250;
sun.shadow.camera.top = 250;
sun.shadow.camera.bottom = -250;
scene.add(sun);

/* ================= HUD ================= */

const hud = document.createElement("div");
hud.style.cssText = `
position:fixed;
left:18px;
top:18px;
z-index:10;
color:white;
font-family:Arial,sans-serif;
text-shadow:2px 2px 4px #000;
pointer-events:none;
`;
hud.innerHTML = `
<div style="font-size:25px;font-weight:bold">KOLKATA VICE CITY</div>
<div id="money">₹ 25,000</div>
<div id="wanted">WANTED ★☆☆☆☆</div>
<div id="speed">0 km/h</div>
`;
document.body.appendChild(hud);

const cross = document.createElement("div");
cross.innerHTML = "+";
cross.style.cssText = `
position:fixed;
left:50%;
top:50%;
transform:translate(-50%,-50%);
color:white;
font:bold 28px Arial;
text-shadow:0 0 5px black;
z-index:20;
pointer-events:none;
`;
document.body.appendChild(cross);

const help = document.createElement("div");
help.style.cssText = `
position:fixed;
bottom:18px;
left:18px;
padding:10px 14px;
background:rgba(0,0,0,.55);
border-radius:10px;
color:white;
font:14px Arial;
z-index:10;
pointer-events:none;
`;
help.innerHTML =
"WASD Move • SHIFT Sprint • E Enter/Exit Car • Mouse Look";
document.body.appendChild(help);

/* ================= VARIABLES ================= */

const colliders = [];
const cars = [];
const npcs = [];

let player;
let currentCar = null;
let money = 25000;
let wanted = 0;

const keys = {};
let yaw = 0;
let pitch = -0.12;

let clock = new THREE.Clock();
let worldTime = 0;

/* ================= MATERIAL HELPERS ================= */

function mat(color, rough = 0.8) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: rough,
    metalness: 0.05
  });
}

function box(
  x, y, z,
  sx, sy, sz,
  color,
  collision = false
) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(sx, sy, sz),
    mat(color)
  );

  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;

  scene.add(m);

  if (collision) {
    colliders.push({
      x,
      z,
      w: sx / 2,
      d: sz / 2
    });
  }

  return m;
}

/* ================= GROUND ================= */

box(0, -0.5, 0, 700, 1, 700, 0x668b52);

const river = box(0, -0.25, 190, 700, 0.3, 120, 0x277eb5);

const riverBank1 = box(0, 0, 125, 700, 0.25, 10, 0x9b8062);
const riverBank2 = box(0, 0, 255, 700, 0.25, 10, 0x9b8062);

/* ================= ROADS ================= */

function road(x, z, w, d) {
  box(x, 0.02, z, w, 0.08, d, 0x292929);

  if (w > d) {
    for (let px = x - w / 2 + 8; px < x + w / 2; px += 16) {
      box(px, 0.08, z, 7, 0.03, 0.25, 0xe8d85b);
    }
  } else {
    for (let pz = z - d / 2 + 8; pz < z + d / 2; pz += 16) {
      box(x, 0.08, pz, 0.25, 0.03, 7, 0xe8d85b);
    }
  }
}

road(0, 0, 24, 700);
road(0, -120, 24, 700);
road(0, 120, 24, 700);

road(-120, 0, 700, 24);
road(120, 0, 700, 24);
road(-240, 0, 700, 24);

/* ================= SIDEWALKS ================= */

function sidewalk(x, z, sx, sz) {
  box(x, 0.12, z, sx, 0.18, sz, 0x777777, false);
}

for (const z of [-132, -108, -12, 12, 108, 132]) {
  sidewalk(-18, z, 12, 5);
  sidewalk(18, z, 12, 5);
}

for (const x of [-132, -108, -12, 12, 108, 132]) {
  sidewalk(x, -18, 5, 12);
  sidewalk(x, 18, 5, 12);
}

/* ================= BUILDINGS ================= */

const buildingColors = [
  0xb7a28b,
  0xc9b18e,
  0x9b7d65,
  0xd3c2a4,
  0x8c9996,
  0xa8866c,
  0xb7b7a1
];

function building(x, z, w, h, d, color) {
  box(x, h / 2, z, w, h, d, color, true);

  for (let yy = 3; yy < h - 1; yy += 3.5) {
    for (let xx = -w / 2 + 2; xx < w / 2 - 1; xx += 3.2) {
      const win = box(
        x + xx,
        yy,
        z - d / 2 - 0.04,
        1.2,
        1.1,
        0.08,
        0x243d50,
        false
      );
      win.material.emissive = new THREE.Color(0x101820);
    }
  }
}

/* city blocks */

for (let x = -300; x <= 300; x += 42) {
  for (let z = -300; z <= 100; z += 42) {
    if (
      Math.abs(x) < 35 ||
      Math.abs(z) < 35 ||
      Math.abs(z + 120) < 25
    ) continue;

    const w = 25 + Math.random() * 10;
    const d = 25 + Math.random() * 10;
    const h = 10 + Math.random() * 35;

    building(
      x + (Math.random() - .5) * 8,
      z + (Math.random() - .5) * 8,
      w,
      h,
      d,
      buildingColors[
        Math.floor(Math.random() * buildingColors.length)
      ]
    );
  }
}

/* ================= TREES ================= */

function tree(x, z) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(.45, .6, 3, 8),
    mat(0x65422b)
  );
  trunk.position.set(x, 1.5, z);
  trunk.castShadow = true;
  scene.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(2.3, 10, 8),
    mat(0x286b38)
  );
  crown.position.set(x, 4.2, z);
  crown.castShadow = true;
  scene.add(crown);
}

for (let i = 0; i < 100; i++) {
  let x = (Math.random() - .5) * 560;
  let z = (Math.random() - .5) * 500;

  if (Math.abs(x) < 30 || Math.abs(z) < 30) continue;
  if (z > 120) continue;

  tree(x, z);
}

/* ================= VICTORIA MEMORIAL ================= */

function victoria() {
  const g = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(32, 2, 25),
    mat(0xe4d7bd)
  );
  base.position.y = 1;
  g.add(base);

  const main = new THREE.Mesh(
    new THREE.BoxGeometry(24, 14, 18),
    mat(0xded0b5)
  );
  main.position.y = 9;
  g.add(main);

  for (let x = -9; x <= 9; x += 6) {
    const c = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.1, 13, 12),
      mat(0xf0e4c9)
    );
    c.position.set(x, 8, 10);
    g.add(c);
  }

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(7, 20, 12),
    mat(0xd8c8a7)
  );
  dome.scale.y = .7;
  dome.position.y = 17;
  g.add(dome);

  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(1.4, 1.7, 7, 12),
    mat(0xd5c39f)
  );
  tower.position.y = 23;
  g.add(tower);

  g.position.set(-75, 0, 65);
  scene.add(g);
}

victoria();

/* ================= HOWRAH BRIDGE ================= */

function howrahBridge() {
  const g = new THREE.Group();

  for (const x of [-50, 50]) {
    box(x, 15, 190, 8, 30, 8, 0x9b8067, false);
  }

  box(0, 4, 190, 120, 2, 12, 0x555555, false);

  for (let x = -50; x <= 50; x += 10) {
    const cable = new THREE.Mesh(
      new THREE.CylinderGeometry(.18, .18, 30, 6),
      mat(0x555555)
    );
    cable.position.set(x, 15, 190);
    cable.rotation.z = Math.PI / 2;
    g.add(cable);
  }

  scene.add(g);
}

howrahBridge();

/* ================= MAIDAN ================= */

box(90, .03, 75, 100, .08, 80, 0x4e8d43);

for (let i = 0; i < 20; i++) {
  tree(
    50 + Math.random() * 80,
    40 + Math.random() * 70
  );
}

/* ================= MACHH BHAAT SHOP ================= */

function sign(text, x, y, z) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f2d16b";
  ctx.fillRect(0, 0, 512, 128);

  ctx.fillStyle = "#111";
  ctx.font = "bold 48px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 64);

  const texture = new THREE.CanvasTexture(canvas);

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 2),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true
    })
  );

  mesh.position.set(x, y, z);
  scene.add(mesh);
}

box(-95, 3, -70, 15, 6, 10, 0xc67a38, true);
sign("মাছ ভাত", -95, 6.8, -75.1);

/* ================= PORT ================= */

box(190, 2, -80, 100, 4, 80, 0x555555, true);

for (let i = 0; i < 18; i++) {
  const colors = [0xb73b32, 0x326fa8, 0xd19b32, 0x3d8d65];

  box(
    155 + (i % 6) * 14,
    2 + Math.floor(i / 6) * 3,
    -105 + Math.floor(i / 6) * 13,
    12,
    4,
    9,
    colors[i % colors.length],
    true
  );
}

/* cranes */

for (let x = 180; x < 260; x += 25) {
  box(x, 15, -40, 2, 30, 2, 0x777777, true);
  box(x + 7, 28, -40, 16, 2, 2, 0x777777, false);
}

/* ================= PLAYER ================= */

function createPlayer() {
  const g = new THREE.Group();

  /*
    Original model was too huge.
    Everything is now built directly at human scale.
  */

  const skin = mat(0x9b633f);
  const shirt = mat(0x176b57);
  const pants = mat(0x252b3b);
  const hair = mat(0x15100e);

  /* legs */
  const leg1 = box(0, 0, 0, 0.42, 1.05, 0.45, pants);
  const leg2 = box(0, 0, 0, 0.42, 1.05, 0.45, pants);

  leg1.position.set(-.27, .55, 0);
  leg2.position.set(.27, .55, 0);

  g.add(leg1, leg2);

  /* shoes */
  const shoe1 = box(0, 0, 0, .48, .25, .75, 0x171717);
  const shoe2 = box(0, 0, 0, .48, .25, .75, 0x171717);

  shoe1.position.set(-.27, .15, -.1);
  shoe2.position.set(.27, .15, -.1);

  g.add(shoe1, shoe2);

  /* body */
  const body = box(0, 0, 0, 1.05, 1.05, .58, shirt);
  body.position.y = 1.45;
  g.add(body);

  /* arms */
  const arm1 = box(0, 0, 0, .3, .95, .3, shirt);
  const arm2 = box(0, 0, 0, .3, .95, .3, shirt);

  arm1.position.set(-.72, 1.48, 0);
  arm2.position.set(.72, 1.48, 0);

  g.add(arm1, arm2);

  /* neck */
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(.18, .18, .25, 10),
    skin
  );
  neck.position.y = 2.05;
  g.add(neck);

  /* head */
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(.43, 16, 12),
    skin
  );
  head.scale.set(1, 1.08, .92);
  head.position.set(0, 2.48, 0);
  g.add(head);

  /* hair */
  const hairMesh = new THREE.Mesh(
    new THREE.SphereGeometry(.46, 16, 10),
    hair
  );
  hairMesh.scale.set(1.02, .62, .98);
  hairMesh.position.set(0, 2.78, 0);
  g.add(hairMesh);

  /* eyes */
  const eyeMat = mat(0x111111);

  const eye1 = new THREE.Mesh(
    new THREE.SphereGeometry(.055, 8, 8),
    eyeMat
  );
  const eye2 = eye1.clone();

  eye1.position.set(-.16, 2.52, -.39);
  eye2.position.set(.16, 2.52, -.39);

  g.add(eye1, eye2);

  /* eyebrows */
  const browMat = mat(0x211711);

  const brow1 = box(0, 0, 0, .17, .05, .04, 0x211711);
  const brow2 = box(0, 0, 0, .17, .05, .04, 0x211711);

  brow1.position.set(-.16, 2.64, -.4);
  brow2.position.set(.16, 2.64, -.4);

  g.add(brow1, brow2);

  /* nose */
  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(.09, .25, 8),
    skin
  );
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 2.42, -.42);
  g.add(nose);

  /* mouth */
  const mouth = box(0, 0, 0, .18, .035, .035, 0x421c1c);
  mouth.position.set(0, 2.29, -.4);
  g.add(mouth);

  /* collar */
  const collar = box(0, 0, 0, .42, .08, .62, 0xeeeeee);
  collar.position.set(0, 1.96, -.02);
  g.add(collar);

  g.position.set(40, 0, -120);

  /* IMPORTANT: no giant scale */
  g.scale.setScalar(1);

  scene.add(g);

  return g;
}

player = createPlayer();

/* ================= VEHICLES ================= */

function createCar(x, z, color, traffic = false) {
  const g = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, .8, 5.2),
    mat(color)
  );
  body.position.y = .8;
  body.castShadow = true;
  g.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, .9, 2.7),
    mat(0x252a2d)
  );
  cabin.position.y = 1.55;
  cabin.position.z = .15;
  cabin.castShadow = true;
  g.add(cabin);

  const wheelMat = mat(0x111111);

  for (const wx of [-1.25, 1.25]) {
    for (const wz of [-1.75, 1.75]) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(.43, .43, .28, 12),
        wheelMat
      );

      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, .45, wz);
      g.add(wheel);
    }
  }

  g.position.set(x, 0, z);
  g.userData.speed = traffic ? 0.08 + Math.random() * .05 : 0;
  g.userData.traffic = traffic;
  g.userData.direction = Math.random() > .5 ? 1 : -1;

  scene.add(g);
  cars.push(g);

  return g;
}

/* parked cars */

const carColors = [
  0xd4aa22,
  0xb52828,
  0x2869b5,
  0xeeeeee,
  0x222222,
  0x2e8c59
];

for (let i = 0; i < 15; i++) {
  createCar(
    -12,
    -280 + i * 40,
    carColors[i % carColors.length]
  );

  createCar(
    12,
    -260 + i * 40,
    carColors[(i + 2) % carColors.length]
  );
}

/* yellow taxis */

for (let i = 0; i < 8; i++) {
  createCar(
    -100 + i * 28,
    -12,
    0xd8a91e
  );
}

/* traffic */

for (let i = 0; i < 12; i++) {
  createCar(
    -10,
    -300 + i * 45,
    carColors[i % carColors.length],
    true
  );

  createCar(
    -300 + i * 45,
    10,
    carColors[(i + 3) % carColors.length],
    true
  );
}

/* ================= NPCs ================= */

function createNPC(x, z) {
  const g = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(.7, 1.1, .45),
    mat(
      [
        0x4d74a8,
        0xa84d4d,
        0x4d9a6a,
        0x8061a8,
        0xc38d45
      ][Math.floor(Math.random() * 5)]
    )
  );

  body.position.y = 1.35;
  g.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(.3, 12, 10),
    mat(0x99603f)
  );

  head.position.y = 2.15;
  g.add(head);

  g.position.set(x, 0, z);

  g.userData.dir = Math.random() * Math.PI * 2;
  g.userData.speed = .015 + Math.random() * .02;

  scene.add(g);
  npcs.push(g);
}

for (let i = 0; i < 35; i++) {
  createNPC(
    (Math.random() - .5) * 350,
    (Math.random() - .5) * 250
  );
}

/* ================= COLLISION ================= */

function blocked(x, z, radius = .65) {
  for (const c of colliders) {
    if (
      x > c.x - c.w - radius &&
      x < c.x + c.w + radius &&
      z > c.z - c.d - radius &&
      z < c.z + c.d + radius
    ) {
      return true;
    }
  }

  return false;
}

/* ================= PLAYER MOVEMENT ================= */

function movePlayer() {
  if (currentCar) return;

  let forward = 0;
  let side = 0;

  if (keys["KeyW"]) forward += 1;
  if (keys["KeyS"]) forward -= 1;
  if (keys["KeyA"]) side -= 1;
  if (keys["KeyD"]) side += 1;

  if (!forward && !side) return;

  const len = Math.hypot(forward, side);

  forward /= len;
  side /= len;

  /* MUCH FASTER */

  const sprint = keys["ShiftLeft"] || keys["ShiftRight"];
  const speed = sprint ? 0.32 : 0.19;

  const dx =
    -Math.sin(yaw) * forward +
    Math.cos(yaw) * side;

  const dz =
    -Math.cos(yaw) * forward -
    Math.sin(yaw) * side;

  const nx = player.position.x + dx * speed;
  const nz = player.position.z + dz * speed;

  if (!blocked(nx, nz, .55)) {
    player.position.x = nx;
    player.position.z = nz;
  }

  player.rotation.y = Math.atan2(dx, dz);
}

/* ================= CAR SYSTEM ================= */

function nearestCar() {
  let best = null;
  let dist = 999;

  for (const car of cars) {
    const d = car.position.distanceTo(player.position);

    if (d < dist) {
      dist = d;
      best = car;
    }
  }

  return dist < 5 ? best : null;
}

function toggleCar() {
  if (currentCar) {
    player.visible = true;

    player.position.copy(currentCar.position);
    player.position.x += 3;

    currentCar = null;
    return;
  }

  const car = nearestCar();

  if (!car) return;

  currentCar = car;
  player.visible = false;
}

function driveCar() {
  if (!currentCar) return;

  let throttle = 0;

  if (keys["KeyW"]) throttle += .045;
  if (keys["KeyS"]) throttle -= .025;

  currentCar.userData.speed += throttle;

  currentCar.userData.speed *= .97;

  currentCar.userData.speed = THREE.MathUtils.clamp(
    currentCar.userData.speed,
    -0.8,
    1.4
  );

  if (keys["KeyA"]) {
    currentCar.rotation.y += .025;
  }

  if (keys["KeyD"]) {
    currentCar.rotation.y -= .025;
  }

  const speed = currentCar.userData.speed;

  currentCar.position.x -=
    Math.sin(currentCar.rotation.y) * speed;

  currentCar.position.z -=
    Math.cos(currentCar.rotation.y) * speed;

  player.position.copy(currentCar.position);
}

/* ================= CAMERA ================= */

function updateCamera() {
  const target = currentCar || player;

  const targetPos = target.position.clone();

  /* character-sized camera */

  targetPos.y += currentCar ? 2.2 : 1.45;

  const distance = currentCar ? 9 : 6.5;

  const desired = new THREE.Vector3(
    targetPos.x + Math.sin(yaw) * distance,
    targetPos.y + 3.2 + Math.sin(pitch) * 2,
    targetPos.z + Math.cos(yaw) * distance
  );

  camera.position.lerp(desired, .12);
  camera.lookAt(targetPos);
}

/* ================= MOUSE LOOK ================= */

renderer.domElement.addEventListener("click", () => {
  renderer.domElement.requestPointerLock?.();
});

document.addEventListener("mousemove", e => {
  if (document.pointerLockElement !== renderer.domElement) return;

  yaw -= e.movementX * .0025;
  pitch -= e.movementY * .0018;

  pitch = THREE.MathUtils.clamp(
    pitch,
    -0.55,
    0.35
  );
});

/* ================= INPUT ================= */

document.addEventListener("keydown", e => {
  keys[e.code] = true;

  if (
    ["KeyW", "KeyA", "KeyS", "KeyD", "Space", "ShiftLeft", "ShiftRight"]
      .includes(e.code)
  ) {
    e.preventDefault();
  }

  if (e.code === "KeyE" && !e.repeat) {
    toggleCar();
  }
});

document.addEventListener("keyup", e => {
  keys[e.code] = false;
});

/* ================= TRAFFIC ================= */

function updateTraffic() {
  for (const car of cars) {
    if (!car.userData.traffic || car === currentCar) continue;

    car.position.z +=
      car.userData.speed * car.userData.direction;

    if (car.position.z > 330)
      car.position.z = -330;

    if (car.position.z < -330)
      car.position.z = 330;
  }
}

/* ================= NPC ================= */

function updateNPCs() {
  for (const npc of npcs) {
    npc.position.x +=
      Math.sin(npc.userData.dir) * npc.userData.speed;

    npc.position.z +=
      Math.cos(npc.userData.dir) * npc.userData.speed;

    if (Math.random() < .005) {
      npc.userData.dir =
        Math.random() * Math.PI * 2;
    }
  }
}

/* ================= DAY / NIGHT ================= */

function updateDayNight(dt) {
  worldTime += dt * .015;

  const cycle = (Math.sin(worldTime) + 1) / 2;

  sun.intensity = .7 + cycle * 1.7;
  hemi.intensity = .5 + cycle * 1.2;

  const sky = new THREE.Color();

  sky.lerpColors(
    new THREE.Color(0x10192e),
    new THREE.Color(0x8fc9ed),
    cycle
  );

  scene.background.copy(sky);
  scene.fog.color.copy(sky);
}

/* ================= SPEED HUD ================= */

function updateHUD() {
  let speed = 0;

  if (currentCar) {
    speed = Math.abs(currentCar.userData.speed) * 65;
  }

  document.getElementById("speed").textContent =
    Math.round(speed) + " km/h";

  document.getElementById("money").textContent =
    "₹ " + money.toLocaleString("en-IN");

  document.getElementById("wanted").textContent =
    "WANTED " +
    "★".repeat(wanted) +
    "☆".repeat(5 - wanted);
}

/* ================= RESIZE ================= */

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(
    innerWidth,
    innerHeight
  );
});

/* ================= START ================= */

camera.position.set(
  player.position.x + 6,
  4,
  player.position.z + 6
);

updateCamera();

/* ================= GAME LOOP ================= */

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(
    clock.getDelta(),
    .05
  );

  movePlayer();
  driveCar();
  updateTraffic();
  updateNPCs();
  updateDayNight(dt);
  updateCamera();
  updateHUD();

  renderer.render(scene, camera);
}

animate();
