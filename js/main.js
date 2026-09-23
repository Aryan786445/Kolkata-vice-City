import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js";

/* =========================================================
   KOLKATA VICE CITY — V5
   Vehicles + Traffic + Improved UI + Mouse Look
========================================================= */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fc7e8);
scene.fog = new THREE.Fog(0x8fc7e8, 180, 750);

const camera = new THREE.PerspectiveCamera(
    70,
    innerWidth / innerHeight,
    0.1,
    2000
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

ui.innerHTML = `
<style>

#kv-ui{
    position:fixed;
    inset:0;
    pointer-events:none;
    color:white;
    font-family:Arial,sans-serif;
    z-index:1000;
}

/* TOP BAR */

#kv-top{
    position:absolute;
    top:18px;
    left:20px;
    right:20px;
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
}

#kv-brand{
    background:rgba(10,15,20,.72);
    backdrop-filter:blur(8px);
    padding:12px 18px;
    border-left:4px solid #f3c623;
    border-radius:8px;
    box-shadow:0 5px 20px rgba(0,0,0,.25);
}

#kv-brand-title{
    font-size:20px;
    font-weight:900;
    letter-spacing:3px;
}

#kv-brand-sub{
    font-size:10px;
    opacity:.65;
    margin-top:3px;
    letter-spacing:2px;
}

#kv-money{
    background:rgba(10,15,20,.72);
    backdrop-filter:blur(8px);
    padding:11px 18px;
    border-radius:8px;
    font-size:19px;
    font-weight:bold;
}

/* WANTED */

#kv-wanted{
    position:absolute;
    top:88px;
    right:22px;
    background:rgba(10,15,20,.68);
    padding:8px 13px;
    border-radius:7px;
    font-size:17px;
    letter-spacing:3px;
}

/* CROSSHAIR */

#kv-crosshair{
    position:absolute;
    left:50%;
    top:50%;
    transform:translate(-50%,-50%);
    font-size:23px;
    font-weight:bold;
    text-shadow:0 0 5px black;
}

/* INTERACTION */

#kv-interact{
    position:absolute;
    left:50%;
    bottom:145px;
    transform:translateX(-50%);
    background:rgba(8,12,16,.82);
    border:1px solid rgba(255,255,255,.25);
    border-radius:9px;
    padding:11px 18px;
    font-size:14px;
    display:none;
}

#kv-interact b{
    background:#f3c623;
    color:#111;
    padding:4px 7px;
    border-radius:5px;
    margin-right:6px;
}

/* VEHICLE HUD */

#kv-carhud{
    position:absolute;
    right:22px;
    bottom:25px;
    background:rgba(8,12,16,.78);
    border-radius:12px;
    padding:14px 18px;
    min-width:150px;
    display:none;
    box-shadow:0 8px 25px rgba(0,0,0,.3);
}

#kv-speed{
    font-size:32px;
    font-weight:900;
}

#kv-kmh{
    font-size:11px;
    opacity:.6;
}

#kv-carhelp{
    margin-top:8px;
    font-size:11px;
    opacity:.7;
}

/* CONTROLS */

#kv-controls{
    position:absolute;
    left:20px;
    bottom:20px;
    background:rgba(8,12,16,.68);
    border-radius:9px;
    padding:10px 14px;
    font-size:11px;
    line-height:1.7;
    opacity:.8;
}

/* MINIMAP */

#kv-map{
    position:absolute;
    right:20px;
    top:145px;
    width:120px;
    height:120px;
    border-radius:50%;
    background:
        linear-gradient(90deg,
        transparent 47%,
        rgba(255,255,255,.18) 48%,
        rgba(255,255,255,.18) 52%,
        transparent 53%),
        linear-gradient(0deg,
        transparent 47%,
        rgba(255,255,255,.18) 48%,
        rgba(255,255,255,.18) 52%,
        transparent 53%),
        #26352d;
    border:3px solid rgba(255,255,255,.7);
    box-shadow:0 5px 20px rgba(0,0,0,.35);
}

#kv-player-dot{
    position:absolute;
    width:9px;
    height:9px;
    background:#35a7ff;
    border-radius:50%;
    left:50%;
    top:50%;
    transform:translate(-50%,-50%);
    box-shadow:0 0 8px #35a7ff;
}

</style>

<div id="kv-ui">

    <div id="kv-top">

        <div id="kv-brand">
            <div id="kv-brand-title">KOLKATA VICE CITY</div>
            <div id="kv-brand-sub">THE CITY IS YOURS</div>
        </div>

        <div id="kv-money">₹ 0</div>

    </div>

    <div id="kv-wanted">
        ☆☆☆☆☆
    </div>

    <div id="kv-map">
        <div id="kv-player-dot"></div>
    </div>

    <div id="kv-crosshair">+</div>

    <div id="kv-interact">
        <b>E</b> ENTER VEHICLE
    </div>

    <div id="kv-carhud">
        <div id="kv-speed">0</div>
        <div id="kv-kmh">KM/H</div>
        <div id="kv-carhelp">
            W/S Drive · A/D Steer · E Exit
        </div>
    </div>

    <div id="kv-controls">
        WASD — Move<br>
        SHIFT — Run<br>
        Mouse — Camera<br>
        E — Enter / Exit Vehicle<br>
        ESC — Unlock Mouse
    </div>

</div>
`;

document.body.appendChild(ui);

const interactUI =
    document.getElementById("kv-interact");

const carHUD =
    document.getElementById("kv-carhud");

const speedUI =
    document.getElementById("kv-speed");

const crosshair =
    document.getElementById("kv-crosshair");

/* =========================================================
   LIGHTING
========================================================= */

scene.add(
    new THREE.HemisphereLight(
        0xbfe7ff,
        0x665544,
        2
    )
);

const sun =
    new THREE.DirectionalLight(
        0xffffff,
        2.2
    );

sun.position.set(180,300,120);
sun.castShadow = true;

sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;

scene.add(sun);

/* =========================================================
   HELPERS
========================================================= */

function box(
    x,y,z,
    w,h,d,
    color,
    cast=true
){
    const m = new THREE.Mesh(
        new THREE.BoxGeometry(w,h,d),
        new THREE.MeshStandardMaterial({
            color,
            roughness:.8
        })
    );

    m.position.set(x,y+h/2,z);
    m.castShadow=cast;
    m.receiveShadow=true;

    scene.add(m);
    return m;
}

function cylinder(
    x,y,z,
    radius,
    height,
    color
){
    const m=new THREE.Mesh(
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

    m.position.set(
        x,
        y+height/2,
        z
    );

    m.castShadow=true;

    scene.add(m);
    return m;
}

/* =========================================================
   GROUND
========================================================= */

const ground=new THREE.Mesh(
    new THREE.PlaneGeometry(1400,1400),
    new THREE.MeshStandardMaterial({
        color:0x59634f
    })
);

ground.rotation.x=-Math.PI/2;
ground.receiveShadow=true;

scene.add(ground);

/* =========================================================
   ROADS
========================================================= */

function road(
    x,z,
    width,length,
    rotation=0
){

    const r=new THREE.Mesh(
        new THREE.PlaneGeometry(
            width,
            length
        ),
        new THREE.MeshStandardMaterial({
            color:0x24272b
        })
    );

    r.rotation.x=-Math.PI/2;
    r.rotation.z=rotation;
    r.position.set(x,.03,z);

    scene.add(r);

    for(
        let i=-length/2+10;
        i<length/2;
        i+=18
    ){

        const line=new THREE.Mesh(
            new THREE.PlaneGeometry(
                .35,
                8
            ),
            new THREE.MeshBasicMaterial({
                color:0xffffff
            })
        );

        line.rotation.x=-Math.PI/2;

        if(rotation===0)
            line.position.set(
                x,.05,z+i
            );
        else
            line.position.set(
                x+i,.05,z
            );

        scene.add(line);
    }
}

road(0,0,28,900,0);
road(0,0,28,900,Math.PI/2);

road(-180,0,20,700,0);
road(180,0,20,700,0);

road(0,-180,20,700,Math.PI/2);
road(0,180,20,700,Math.PI/2);

/* =========================================================
   SIDEWALKS
========================================================= */

box(18,.08,0,5,.25,900,0x99958c,false);
box(-18,.08,0,5,.25,900,0x99958c,false);
box(0,.08,18,900,.25,5,0x99958c,false);
box(0,.08,-18,900,.25,5,0x99958c,false);

/* =========================================================
   BUILDINGS
========================================================= */

const buildingColors=[
    0xd0a77b,
    0xb9b1a3,
    0xc57b68,
    0x8e9e9b,
    0xd6c28d,
    0x9b7d68,
    0xb7b7b7
];

function building(x,z){

    const w=18+Math.random()*15;
    const d=18+Math.random()*15;
    const h=15+Math.random()*60;

    const color=
        buildingColors[
            Math.floor(
                Math.random()*
                buildingColors.length
            )
        ];

    box(x,0,z,w,h,d,color);

    if(Math.random()>.45)
        box(
            x,h,z,
            w+1,1.5,d+1,
            0x444444
        );

    for(
        let yy=8;
        yy<h-5;
        yy+=8
    ){

        for(
            let xx=-w/2+4;
            xx<w/2;
            xx+=6
        ){

            box(
                x+xx,
                yy,
                z-d/2-.08,
                2.5,3,.15,
                0x24384c,
                false
            );
        }
    }
}

for(
    let x=-300;
    x<=300;
    x+=45
){

    for(
        let z=-300;
        z<=300;
        z+=45
    ){

        if(
            Math.abs(x)<35 ||
            Math.abs(z)<35
        ) continue;

        building(x,z);
    }
}

/* =========================================================
   RIVER
========================================================= */

const river=new THREE.Mesh(
    new THREE.PlaneGeometry(
        260,
        1400
    ),
    new THREE.MeshStandardMaterial({
        color:0x236c89,
        roughness:.35
    })
);

river.rotation.x=-Math.PI/2;
river.position.set(
    -470,
    .02,
    0
);

scene.add(river);

box(
    -330,0,0,
    20,1,1400,
    0x7a735d
);

/* =========================================================
   TREES
========================================================= */

function tree(x,z){

    cylinder(
        x,0,z,
        1.2,6,
        0x6b4428
    );

    const leaves=new THREE.Mesh(
        new THREE.SphereGeometry(
            5,10,10
        ),
        new THREE.MeshStandardMaterial({
            color:0x28733b
        })
    );

    leaves.position.set(x,9,z);
    leaves.castShadow=true;

    scene.add(leaves);
}

for(let i=0;i<100;i++){

    const x=
        THREE.MathUtils.randFloatSpread(650);

    const z=
        THREE.MathUtils.randFloatSpread(650);

    if(
        Math.abs(x)<40 ||
        Math.abs(z)<40
    ) continue;

    tree(x,z);
}

/* =========================================================
   VICTORIA MEMORIAL
========================================================= */

function victoria(){

    const g=new THREE.Group();

    const base=new THREE.Mesh(
        new THREE.BoxGeometry(80,5,55),
        new THREE.MeshStandardMaterial({
            color:0xe8dfc8
        })
    );

    base.position.y=2.5;
    g.add(base);

    const hall=new THREE.Mesh(
        new THREE.BoxGeometry(58,24,38),
        new THREE.MeshStandardMaterial({
            color:0xf0e5cc
        })
    );

    hall.position.y=17;
    g.add(hall);

    for(
        let x=-20;
        x<=20;
        x+=10
    ){

        const c=new THREE.Mesh(
            new THREE.CylinderGeometry(
                2,2,22,16
            ),
            new THREE.MeshStandardMaterial({
                color:0xf7eedb
            })
        );

        c.position.set(x,16,-21);
        g.add(c);
    }

    const dome=new THREE.Mesh(
        new THREE.SphereGeometry(
            18,32,16,
            0,Math.PI*2,
            0,Math.PI/2
        ),
        new THREE.MeshStandardMaterial({
            color:0xe9dfc6
        })
    );

    dome.position.y=33;
    g.add(dome);

    g.position.set(
        250,0,-220
    );

    scene.add(g);
}

victoria();

/* =========================================================
   RAJ BHAVAN
========================================================= */

function rajBhavan(){

    const g=new THREE.Group();

    const body=new THREE.Mesh(
        new THREE.BoxGeometry(
            75,22,50
        ),
        new THREE.MeshStandardMaterial({
            color:0xe2d3b4
        })
    );

    body.position.y=11;
    g.add(body);

    for(
        let x=-28;
        x<=28;
        x+=14
    ){

        const c=new THREE.Mesh(
            new THREE.CylinderGeometry(
                2,2,20,12
            ),
            new THREE.MeshStandardMaterial({
                color:0xf1e7d0
            })
        );

        c.position.set(x,10,-27);
        g.add(c);
    }

    g.position.set(
        240,0,120
    );

    scene.add(g);
}

rajBhavan();

/* =========================================================
   HOWRAH BRIDGE
========================================================= */

function bridge(){

    const g=new THREE.Group();

    const deck=new THREE.Mesh(
        new THREE.BoxGeometry(
            30,4,260
        ),
        new THREE.MeshStandardMaterial({
            color:0x50545a,
            metalness:.4
        })
    );

    deck.position.y=16;
    g.add(deck);

    for(
        let z=-110;
        z<=110;
        z+=55
    ){

        const tower=new THREE.Mesh(
            new THREE.BoxGeometry(
                10,55,10
            ),
            new THREE.MeshStandardMaterial({
                color:0x50545a,
                metalness:.4
            })
        );

        tower.position.set(
            0,27,z
        );

        g.add(tower);
    }

    g.position.set(
        -350,0,0
    );

    scene.add(g);
}

bridge();

/* =========================================================
   MAIDAN
========================================================= */

const maidan=new THREE.Mesh(
    new THREE.CircleGeometry(
        100,48
    ),
    new THREE.MeshStandardMaterial({
        color:0x547d3e
    })
);

maidan.rotation.x=-Math.PI/2;
maidan.position.set(
    120,.04,-80
);

scene.add(maidan);

/* =========================================================
   PLAYER
========================================================= */

const player=new THREE.Group();

const playerBody=new THREE.Mesh(
    new THREE.CapsuleGeometry(
        1.2,2.8,6,10
    ),
    new THREE.MeshStandardMaterial({
        color:0x2468c5
    })
);

playerBody.position.y=3;
playerBody.castShadow=true;

player.add(playerBody);

const head=new THREE.Mesh(
    new THREE.SphereGeometry(
        1.25,16,16
    ),
    new THREE.MeshStandardMaterial({
        color:0xc98d68
    })
);

head.position.y=5.5;
head.castShadow=true;

player.add(head);

const legGeo=new THREE.CylinderGeometry(
    .42,.5,2.5,10
);

const legMat=new THREE.MeshStandardMaterial({
    color:0x20252d
});

const leftLeg=new THREE.Mesh(
    legGeo,legMat
);

leftLeg.position.set(
    -.55,1.25,0
);

player.add(leftLeg);

const rightLeg=new THREE.Mesh(
    legGeo,legMat
);

rightLeg.position.set(
    .55,1.25,0
);

player.add(rightLeg);

player.position.set(
    0,0,70
);

scene.add(player);

/* =========================================================
   VEHICLE CREATOR
========================================================= */

function createCar(
    x,
    z,
    color=0xffc400
){

    const car=new THREE.Group();

    const body=new THREE.Mesh(
        new THREE.BoxGeometry(
            4.6,1.5,8
        ),
        new THREE.MeshStandardMaterial({
            color
        })
    );

    body.position.y=1.45;
    body.castShadow=true;

    car.add(body);

    const roof=new THREE.Mesh(
        new THREE.BoxGeometry(
            3.5,1.25,4
        ),
        new THREE.MeshStandardMaterial({
            color
        })
    );

    roof.position.y=2.65;
    roof.castShadow=true;

    car.add(roof);

    const glassMat=
        new THREE.MeshStandardMaterial({
            color:0x263b4a,
            metalness:.3,
            roughness:.3
        });

    const windshield=new THREE.Mesh(
        new THREE.BoxGeometry(
            3.1,.8,.12
        ),
        glassMat
    );

    windshield.position.set(
        0,2.65,-2.05
    );

    car.add(windshield);

    const wheelGeo=
        new THREE.CylinderGeometry(
            .78,.78,.55,16
        );

    const wheelMat=
        new THREE.MeshStandardMaterial({
            color:0x111111
        });

    for(
        const wx of [-2.35,2.35]
    ){

        for(
            const wz of [-2.4,2.4]
        ){

            const wheel=new THREE.Mesh(
                wheelGeo,
                wheelMat
            );

            wheel.rotation.z=
                Math.PI/2;

            wheel.position.set(
                wx,.75,wz
            );

            car.add(wheel);
        }
    }

    scene.add(car);

    return car;
}

/* =========================================================
   PLAYER CAR
========================================================= */

const playerCar=createCar(
    45,
    70,
    0xffc400
);

playerCar.rotation.y=
    Math.PI/2;

let inVehicle=false;
let currentVehicle=null;
let vehicleSpeed=0;
let steering=0;

/* =========================================================
   TRAFFIC CARS
========================================================= */

const traffic=[];

function addTraffic(
    x,z,direction,color
){

    const car=createCar(
        x,z,color
    );

    car.rotation.y=
        direction;

    traffic.push({
        mesh:car,
        speed:8+Math.random()*5,
        direction
    });
}

addTraffic(
    -100,-260,
    0,
    0xffc400
);

addTraffic(
    80,-260,
    0,
    0xd63b32
);

addTraffic(
    -100,260,
    Math.PI,
    0xffc400
);

addTraffic(
    100,260,
    Math.PI,
    0xeeeeee
);

addTraffic(
    -260,100,
    Math.PI/2,
    0x2e73d2
);

addTraffic(
    -260,-100,
    Math.PI/2,
    0xffc400
);

/* =========================================================
   CAMERA
========================================================= */

let cameraYaw=0;
let cameraPitch=.18;

const cameraDistance=9;

let mouseLocked=false;

/* =========================================================
   CLICK TO PLAY
========================================================= */

const overlay=document.createElement("div");

overlay.innerHTML=`
<div style="
position:absolute;
left:50%;
top:50%;
transform:translate(-50%,-50%);
background:rgba(8,12,16,.88);
padding:28px 38px;
border-radius:14px;
text-align:center;
color:white;
font-family:Arial;
box-shadow:0 10px 40px rgba(0,0,0,.5);
">

<div style="
font-size:29px;
font-weight:900;
letter-spacing:3px;
">
KOLKATA VICE CITY
</div>

<div style="
margin-top:10px;
font-size:18px;
">
CLICK TO ENTER CITY
</div>

<div style="
margin-top:10px;
font-size:12px;
opacity:.65;
">
WASD · MOUSE · SHIFT · E
</div>

</div>
`;

overlay.style.position="fixed";
overlay.style.inset="0";
overlay.style.zIndex="9999";
overlay.style.cursor="pointer";

document.body.appendChild(overlay);

function lockMouse(){
    renderer.domElement.requestPointerLock();
}

overlay.addEventListener(
    "click",
    lockMouse
);

renderer.domElement.addEventListener(
    "click",
    ()=>{
        if(!mouseLocked)
            lockMouse();
    }
);

document.addEventListener(
    "pointerlockchange",
    ()=>{
        mouseLocked=
            document.pointerLockElement===
            renderer.domElement;

        overlay.style.display=
            mouseLocked
                ?"none"
                :"block";
    }
);

/* =========================================================
   MOUSE
========================================================= */

document.addEventListener(
    "mousemove",
    e=>{

        if(!mouseLocked)return;

        cameraYaw-=
            e.movementX*.0025;

        cameraPitch-=
            e.movementY*.0025;

        cameraPitch=
            THREE.MathUtils.clamp(
                cameraPitch,
                -.35,
                .65
            );
    }
);

/* =========================================================
   KEYBOARD
========================================================= */

const keys={};

addEventListener(
    "keydown",
    e=>{
        keys[e.code]=true;

        if(
            e.code==="KeyE"
        ){
            toggleVehicle();
        }
    }
);

addEventListener(
    "keyup",
    e=>{
        keys[e.code]=false;
    }
);

/* =========================================================
   ENTER / EXIT VEHICLE
========================================================= */

function toggleVehicle(){

    if(inVehicle){

        exitVehicle();
        return;
    }

    const distance=
        player.position.distanceTo(
            playerCar.position
        );

    if(distance<8){

        inVehicle=true;
        currentVehicle=playerCar;

        player.visible=false;

        carHUD.style.display="block";
        interactUI.style.display="none";

        vehicleSpeed=0;
    }
}

function exitVehicle(){

    if(!currentVehicle)return;

    const side=
        new THREE.Vector3(
            5,
            0,
            0
        );

    side.applyQuaternion(
        currentVehicle.quaternion
    );

    player.position.copy(
        currentVehicle.position
    );

    player.position.add(side);

    player.visible=true;

    inVehicle=false;
    currentVehicle=null;

    carHUD.style.display="none";

    vehicleSpeed=0;
}

/* =========================================================
   PLAYER MOVEMENT
========================================================= */

function updatePlayer(delta){

    if(inVehicle)return;

    let forward=0;
    let right=0;

    if(keys.KeyW)
        forward-=1;

    if(keys.KeyS)
        forward+=1;

    if(keys.KeyA)
        right-=1;

    if(keys.KeyD)
        right+=1;

    const len=
        Math.hypot(
            forward,
            right
        );

    if(!len)return;

    forward/=len;
    right/=len;

    const speed=
        keys.ShiftLeft ||
        keys.ShiftRight
            ?18
            :9;

    const dir=
        new THREE.Vector3(
            right,
            0,
            forward
        );

    dir.applyAxisAngle(
        new THREE.Vector3(0,1,0),
        cameraYaw
    );

    player.position.addScaledVector(
        dir,
        speed*delta
    );

    player.rotation.y=
        THREE.MathUtils.lerp(
            player.rotation.y,
            Math.atan2(
                dir.x,
                dir.z
            ),
            .18
        );
}

/* =========================================================
   PLAYER CAR DRIVING
========================================================= */

function updateVehicle(delta){

    if(!inVehicle)return;

    if(keys.KeyW)
        vehicleSpeed+=22*delta;

    if(keys.KeyS)
        vehicleSpeed-=28*delta;

    vehicleSpeed*=
        Math.pow(.985,delta*60);

    vehicleSpeed=
        THREE.MathUtils.clamp(
            vehicleSpeed,
            -10,
            38
        );

    let steer=0;

    if(keys.KeyA)
        steer+=1;

    if(keys.KeyD)
        steer-=1;

    if(Math.abs(vehicleSpeed)>.5){

        currentVehicle.rotation.y+=
            steer*
            .035*
            (vehicleSpeed/18)*
            delta*60;
    }

    const forward=
        new THREE.Vector3(
            0,
            0,
            -1
        );

    forward.applyQuaternion(
        currentVehicle.quaternion
    );

    currentVehicle.position.addScaledVector(
        forward,
        vehicleSpeed*delta
    );

    speedUI.textContent=
        Math.round(
            Math.abs(vehicleSpeed)*3
        );
}

/* =========================================================
   TRAFFIC AI
========================================================= */

function updateTraffic(delta){

    for(const t of traffic){

        const forward=
            new THREE.Vector3(
                0,
                0,
                -1
            );

        forward.applyQuaternion(
            t.mesh.quaternion
        );

        t.mesh.position.addScaledVector(
            forward,
            t.speed*delta
        );

        /* Loop traffic around city */

        if(
            t.mesh.position.z>330
        )
            t.mesh.position.z=-330;

        if(
            t.mesh.position.z<-330
        )
            t.mesh.position.z=330;

        if(
            t.mesh.position.x>330
        )
            t.mesh.position.x=-330;

        if(
            t.mesh.position.x<-330
        )
            t.mesh.position.x=330;
    }
}

/* =========================================================
   INTERACTION CHECK
========================================================= */

function updateInteraction(){

    if(inVehicle){

        interactUI.style.display="none";
        return;
    }

    const distance=
        player.position.distanceTo(
            playerCar.position
        );

    if(distance<9){

        interactUI.style.display="block";

    }else{

        interactUI.style.display="none";
    }
}

/* =========================================================
   CAMERA
========================================================= */

function updateCamera(){

    let target;

    if(inVehicle){

        target=
            currentVehicle.position.clone();

        target.y+=3;

    }else{

        target=
            player.position.clone();

        target.y+=5;
    }

    const distance=
        inVehicle
            ?11
            :9;

    const horizontal=
        distance*
        Math.cos(cameraPitch);

    const offset=
        new THREE.Vector3(
            Math.sin(cameraYaw)*
                horizontal,

            distance*
                Math.sin(cameraPitch)+3,

            Math.cos(cameraYaw)*
                horizontal
        );

    const desired=
        target.clone().add(offset);

    camera.position.lerp(
        desired,
        .14
    );

    camera.lookAt(target);
}

/* =========================================================
   MAP PLAYER
========================================================= */

function updateMap(){

    const dot=
        document.getElementById(
            "kv-player-dot"
        );

    dot.style.transform=
        `translate(-50%,-50%) rotate(${
            player.rotation.y
        }rad)`;
}

/* =========================================================
   RESIZE
========================================================= */

addEventListener(
    "resize",
    ()=>{

        camera.aspect=
            innerWidth/innerHeight;

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

const clock=
    new THREE.Clock();

function animate(){

    requestAnimationFrame(
        animate
    );

    const delta=
        Math.min(
            clock.getDelta(),
            .05
        );

    updatePlayer(delta);
    updateVehicle(delta);
    updateTraffic(delta);
    updateInteraction();
    updateCamera();
    updateMap();

    renderer.render(
        scene,
        camera
    );
}

updateCamera();
animate();
