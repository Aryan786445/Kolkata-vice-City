import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js";

/* =========================================================
   KOLKATA VICE CITY — V6
   Character + Cars + Traffic + Collision + NPCs
========================================================= */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fc7e8);
scene.fog = new THREE.Fog(0x8fc7e8, 180, 850);

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

ui.innerHTML = `
<style>
#kvui{
 position:fixed;
 inset:0;
 pointer-events:none;
 color:white;
 font-family:Arial,sans-serif;
 z-index:1000;
}

#brand{
 position:absolute;
 top:18px;
 left:20px;
 background:rgba(8,12,18,.78);
 padding:12px 18px;
 border-left:4px solid #f3c623;
 border-radius:8px;
}

#brand b{
 font-size:20px;
 letter-spacing:3px;
}

#brand small{
 display:block;
 margin-top:4px;
 opacity:.6;
 letter-spacing:2px;
}

#money{
 position:absolute;
 top:20px;
 right:20px;
 background:rgba(8,12,18,.78);
 padding:11px 18px;
 border-radius:8px;
 font-size:20px;
 font-weight:bold;
}

#wanted{
 position:absolute;
 right:20px;
 top:72px;
 background:rgba(8,12,18,.7);
 padding:8px 12px;
 border-radius:7px;
 letter-spacing:3px;
}

#crosshair{
 position:absolute;
 left:50%;
 top:50%;
 transform:translate(-50%,-50%);
 font-size:23px;
 font-weight:bold;
 text-shadow:0 0 5px #000;
}

#interaction{
 position:absolute;
 left:50%;
 bottom:145px;
 transform:translateX(-50%);
 background:rgba(5,8,12,.88);
 padding:11px 18px;
 border-radius:8px;
 display:none;
}

#interaction b{
 background:#f3c623;
 color:#111;
 padding:4px 8px;
 border-radius:5px;
 margin-right:7px;
}

#speed{
 position:absolute;
 right:22px;
 bottom:22px;
 background:rgba(5,8,12,.82);
 padding:12px 18px;
 border-radius:10px;
 display:none;
}

#speed strong{
 font-size:30px;
}

#help{
 position:absolute;
 left:20px;
 bottom:20px;
 background:rgba(5,8,12,.65);
 padding:10px 14px;
 border-radius:8px;
 font-size:11px;
 line-height:1.7;
 opacity:.85;
}

#map{
 position:absolute;
 right:20px;
 top:120px;
 width:125px;
 height:125px;
 border-radius:50%;
 border:3px solid rgba(255,255,255,.75);
 background:
 linear-gradient(90deg,transparent 47%,rgba(255,255,255,.18) 48%,rgba(255,255,255,.18) 52%,transparent 53%),
 linear-gradient(0deg,transparent 47%,rgba(255,255,255,.18) 48%,rgba(255,255,255,.18) 52%,transparent 53%),
 #29382f;
 box-shadow:0 5px 20px rgba(0,0,0,.4);
}

#dot{
 position:absolute;
 left:50%;
 top:50%;
 width:9px;
 height:9px;
 background:#28a9ff;
 border-radius:50%;
 transform:translate(-50%,-50%);
 box-shadow:0 0 8px #28a9ff;
}
</style>

<div id="kvui">
 <div id="brand">
   <b>KOLKATA VICE CITY</b>
   <small>THE CITY IS YOURS</small>
 </div>

 <div id="money">₹ 0</div>

 <div id="wanted">☆☆☆☆☆</div>

 <div id="map"><div id="dot"></div></div>

 <div id="crosshair">+</div>

 <div id="interaction">
   <b>E</b> ENTER VEHICLE
 </div>

 <div id="speed">
   <strong id="speedNum">0</strong> KM/H<br>
   <small>W/S Drive · A/D Steer · E Exit</small>
 </div>

 <div id="help">
   WASD — Move / Drive<br>
   SHIFT — Run<br>
   Mouse — Camera<br>
   E — Enter / Exit Vehicle<br>
   ESC — Unlock Mouse
 </div>
</div>
`;

document.body.appendChild(ui);

const interaction =
    document.getElementById("interaction");

const speedHUD =
    document.getElementById("speed");

const speedNum =
    document.getElementById("speedNum");

/* =========================================================
   LIGHT
========================================================= */

scene.add(
    new THREE.HemisphereLight(
        0xbfe7ff,
        0x665544,
        2
    )
);

const sun = new THREE.DirectionalLight(
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

function makeBox(
    x,y,z,w,h,d,color,
    solid=true
){
    const m = new THREE.Mesh(
        new THREE.BoxGeometry(w,h,d),
        new THREE.MeshStandardMaterial({
            color,
            roughness:.8
        })
    );

    m.position.set(x,y+h/2,z);
    m.castShadow = true;
    m.receiveShadow = true;

    scene.add(m);

    if(solid){
        colliders.push({
            x,
            z,
            w,
            d
        });
    }

    return m;
}

function makeCylinder(
    x,y,z,r,h,color
){
    const m = new THREE.Mesh(
        new THREE.CylinderGeometry(
            r,r,h,12
        ),
        new THREE.MeshStandardMaterial({
            color
        })
    );

    m.position.set(x,y+h/2,z);
    m.castShadow = true;

    scene.add(m);

    return m;
}

/* =========================================================
   COLLISION DATA
========================================================= */

const colliders = [];

function blocked(
    position,
    radius = 1.2
){

    for(const c of colliders){

        const closestX =
            Math.max(
                c.x-c.w/2,
                Math.min(
                    position.x,
                    c.x+c.w/2
                )
            );

        const closestZ =
            Math.max(
                c.z-c.d/2,
                Math.min(
                    position.z,
                    c.z+c.d/2
                )
            );

        const dx =
            position.x-closestX;

        const dz =
            position.z-closestZ;

        if(
            dx*dx+dz*dz <
            radius*radius
        ){
            return true;
        }
    }

    return false;
}

/* =========================================================
   GROUND
========================================================= */

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(
        1500,
        1500
    ),
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
    x,z,width,length,rotation=0
){

    const r = new THREE.Mesh(
        new THREE.PlaneGeometry(
            width,length
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

        const line = new THREE.Mesh(
            new THREE.PlaneGeometry(
                .35,8
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

road(0,0,30,900);
road(0,0,30,900,Math.PI/2);
road(-180,0,20,700);
road(180,0,20,700);
road(0,-180,20,700,Math.PI/2);
road(0,180,20,700,Math.PI/2);

/* =========================================================
   SIDEWALKS
========================================================= */

makeBox(18,.08,0,5,.25,900,0x99958c);
makeBox(-18,.08,0,5,.25,900,0x99958c);
makeBox(0,.08,18,900,.25,5,0x99958c);
makeBox(0,.08,-18,900,.25,5,0x99958c);

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

    makeBox(
        x,0,z,
        w,h,d,
        color
    );

    if(Math.random()>.4){

        makeBox(
            x,h,z,
            w+1,1.5,d+1,
            0x444444
        );
    }

    for(
        let y=8;
        y<h-5;
        y+=8
    ){

        for(
            let xx=-w/2+4;
            xx<w/2;
            xx+=6
        ){

            makeBox(
                x+xx,
                y,
                z-d/2-.08,
                2.5,
                3,
                .15,
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
            Math.abs(x)<38 ||
            Math.abs(z)<38
        ) continue;

        building(x,z);
    }
}

/* =========================================================
   HOOGHLY RIVER
========================================================= */

const river = new THREE.Mesh(
    new THREE.PlaneGeometry(
        260,
        1500
    ),
    new THREE.MeshStandardMaterial({
        color:0x236c89,
        roughness:.35
    })
);

river.rotation.x=-Math.PI/2;
river.position.set(
    -470,.02,0
);

scene.add(river);

makeBox(
    -330,0,0,
    20,1,1500,
    0x7a735d
);

/* =========================================================
   TREES
========================================================= */

function tree(x,z){

    makeCylinder(
        x,0,z,
        1.2,6,
        0x6b4428
    );

    const leaves = new THREE.Mesh(
        new THREE.SphereGeometry(
            5,10,10
        ),
        new THREE.MeshStandardMaterial({
            color:0x28733b
        })
    );

    leaves.position.set(
        x,9,z
    );

    leaves.castShadow=true;

    scene.add(leaves);
}

for(let i=0;i<100;i++){

    const x=
        THREE.MathUtils.randFloatSpread(650);

    const z=
        THREE.MathUtils.randFloatSpread(650);

    if(
        Math.abs(x)<45 ||
        Math.abs(z)<45
    ) continue;

    tree(x,z);
}

/* =========================================================
   VICTORIA MEMORIAL INSPIRED
========================================================= */

function victoria(){

    const g=new THREE.Group();

    const base=new THREE.Mesh(
        new THREE.BoxGeometry(
            80,5,55
        ),
        new THREE.MeshStandardMaterial({
            color:0xe8dfc8
        })
    );

    base.position.y=2.5;
    g.add(base);

    const hall=new THREE.Mesh(
        new THREE.BoxGeometry(
            58,24,38
        ),
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

        const col=new THREE.Mesh(
            new THREE.CylinderGeometry(
                2,2,22,16
            ),
            new THREE.MeshStandardMaterial({
                color:0xf7eedb
            })
        );

        col.position.set(
            x,16,-21
        );

        g.add(col);
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
   HOWRAH BRIDGE
========================================================= */

const bridge=new THREE.Group();

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
bridge.add(deck);

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
            color:0x50545a
        })
    );

    tower.position.set(
        0,27,z
    );

    bridge.add(tower);
}

bridge.position.set(
    -350,0,0
);

scene.add(bridge);

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
   MACHH-BHAAT SHOP
========================================================= */

const shop=new THREE.Group();

const shopBody=new THREE.Mesh(
    new THREE.BoxGeometry(
        30,10,20
    ),
    new THREE.MeshStandardMaterial({
        color:0xd79a4a
    })
);

shopBody.position.y=5;
shop.add(shopBody);

const shopRoof=new THREE.Mesh(
    new THREE.BoxGeometry(
        34,1,24
    ),
    new THREE.MeshStandardMaterial({
        color:0x9b3d2e
    })
);

shopRoof.position.y=11;
shop.add(shopRoof);

const sign=document.createElement("canvas");
sign.width=512;
sign.height=128;

const ctx=sign.getContext("2d");

ctx.fillStyle="#f5d76e";
ctx.fillRect(0,0,512,128);

ctx.fillStyle="#8b241c";
ctx.font="bold 55px Arial";
ctx.textAlign="center";
ctx.fillText(
    "মাছ • ভাত",
    256,
    80
);

const signTex=
    new THREE.CanvasTexture(sign);

const signMesh=new THREE.Mesh(
    new THREE.PlaneGeometry(
        20,5
    ),
    new THREE.MeshBasicMaterial({
        map:signTex
    })
);

signMesh.position.set(
    0,8,-10.2
);

shop.add(signMesh);

shop.position.set(
    90,0,90
);

scene.add(shop);

/* =========================================================
   KOLKATA PORT AREA
========================================================= */

const port=new THREE.Group();

const warehouse=new THREE.Mesh(
    new THREE.BoxGeometry(
        100,18,45
    ),
    new THREE.MeshStandardMaterial({
        color:0x77736c
    })
);

warehouse.position.y=9;
port.add(warehouse);

for(
    let x=-40;
    x<=40;
    x+=20
){

    const container=new THREE.Mesh(
        new THREE.BoxGeometry(
            16,8,12
        ),
        new THREE.MeshStandardMaterial({
            color:
                [0xb33a2e,
                 0x326ca8,
                 0xd09a32][
                    Math.floor(
                        Math.random()*3
                    )
                ]
        })
    );

    container.position.set(
        x,4,30
    );

    port.add(container);
}

for(
    let x=-45;
    x<=45;
    x+=30
){

    const crane=new THREE.Mesh(
        new THREE.BoxGeometry(
            3,35,3
        ),
        new THREE.MeshStandardMaterial({
            color:0xd38a25
        })
    );

    crane.position.set(
        x,17,58
    );

    port.add(crane);
}

port.position.set(
    -250,0,250
);

scene.add(port);

/* =========================================================
   PLAYER CHARACTER — REDESIGNED
========================================================= */

const player=new THREE.Group();

/* legs */

const pantsMat=
    new THREE.MeshStandardMaterial({
        color:0x26303a
    });

const shirtMat=
    new THREE.MeshStandardMaterial({
        color:0x176b8f
    });

const skinMat=
    new THREE.MeshStandardMaterial({
        color:0xb87854
    });

const hairMat=
    new THREE.MeshStandardMaterial({
        color:0x17130f
    });

function limb(
    x,y,z,
    r,h,
    material
){

    const m=new THREE.Mesh(
        new THREE.CapsuleGeometry(
            r,
            h,
            5,
            8
        ),
        material
    );

    m.position.set(x,y,z);
    m.castShadow=true;

    player.add(m);

    return m;
}

limb(-.55,1.35,0,.4,1.8,pantsMat);
limb(.55,1.35,0,.4,1.8,pantsMat);

/* shoes */

makeCharacterBox(
    -.55,.1,0,
    .75,.35,1.3,
    0x171717
);

makeCharacterBox(
    .55,.1,0,
    .75,.35,1.3,
    0x171717
);

function makeCharacterBox(
    x,y,z,w,h,d,color
){

    const m=new THREE.Mesh(
        new THREE.BoxGeometry(
            w,h,d
        ),
        new THREE.MeshStandardMaterial({
            color
        })
    );

    m.position.set(
        x,y+h/2,z
    );

    m.castShadow=true;

    player.add(m);

    return m;
}

/* torso */

const torso=new THREE.Mesh(
    new THREE.CapsuleGeometry(
        1.15,2.2,6,12
    ),
    shirtMat
);

torso.position.y=3.45;
torso.castShadow=true;

player.add(torso);

/* neck */

limb(
    0,
    4.9,
    0,
    .35,
    .4,
    skinMat
);

/* head */

const face=new THREE.Mesh(
    new THREE.SphereGeometry(
        1.35,
        24,
        18
    ),
    skinMat
);

face.scale.set(
    .88,
    1.05,
    .92
);

face.position.y=6.05;
face.castShadow=true;

player.add(face);

/* hair */

const hair=new THREE.Mesh(
    new THREE.SphereGeometry(
        1.4,
        24,
        12,
        0,
        Math.PI*2,
        0,
        Math.PI*.58
    ),
    hairMat
);

hair.scale.set(
    .92,
    .72,
    .96
);

hair.position.y=6.65;

player.add(hair);

/* ears */

for(
    const x of [-1.28,1.28]
){

    const ear=new THREE.Mesh(
        new THREE.SphereGeometry(
            .25,12,12
        ),
        skinMat
    );

    ear.position.set(
        x,6.05,0
    );

    player.add(ear);
}

/* eyes */

const eyeMat=
    new THREE.MeshBasicMaterial({
        color:0x111111
    });

for(
    const x of [-.42,.42]
){

    const eye=new THREE.Mesh(
        new THREE.SphereGeometry(
            .12,12,12
        ),
        eyeMat
    );

    eye.position.set(
        x,
        6.15,
        -1.27
    );

    player.add(eye);
}

/* eyebrows */

for(
    const x of [-.42,.42]
){

    makeCharacterBox(
        x,
        6.42,
        -1.25,
        .3,
        .07,
        .08,
        0x251b15
    );
}

/* nose */

const nose=new THREE.Mesh(
    new THREE.ConeGeometry(
        .12,.4,8
    ),
    skinMat
);

nose.rotation.x=-Math.PI/2;
nose.position.set(
    0,5.95,-1.34
);

player.add(nose);

/* hair sideburns */

for(
    const x of [-1.05,1.05]
){

    makeCharacterBox(
        x,
        5.65,
        -.2,
        .25,
        .8,
        .4,
        0x17130f
    );
}

/* arms */

limb(
    -1.45,
    3.5,
    0,
    .32,
    1.7,
    shirtMat
);

limb(
    1.45,
    3.5,
    0,
    .32,
    1.7,
    shirtMat
);

player.position.set(
    0,0,70
);

scene.add(player);

/* =========================================================
   VEHICLES
========================================================= */

function createCar(
    x,z,color
){

    const car=new THREE.Group();

    const body=new THREE.Mesh(
        new THREE.BoxGeometry(
            4.7,1.5,8
        ),
        new THREE.MeshStandardMaterial({
            color
        })
    );

    body.position.y=1.5;
    body.castShadow=true;

    car.add(body);

    const roof=new THREE.Mesh(
        new THREE.BoxGeometry(
            3.6,1.25,4.2
        ),
        new THREE.MeshStandardMaterial({
            color
        })
    );

    roof.position.y=2.65;
    car.add(roof);

    const glass=new THREE.Mesh(
        new THREE.BoxGeometry(
            3.2,.9,.12
        ),
        new THREE.MeshStandardMaterial({
            color:0x233b4b,
            metalness:.2
        })
    );

    glass.position.set(
        0,2.65,-2.12
    );

    car.add(glass);

    const wheelGeo=
        new THREE.CylinderGeometry(
            .8,.8,.55,16
        );

    for(
        const wx of [-2.4,2.4]
    ){

        for(
            const wz of [-2.45,2.45]
        ){

            const wheel=new THREE.Mesh(
                wheelGeo,
                new THREE.MeshStandardMaterial({
                    color:0x111111
                })
            );

            wheel.rotation.z=Math.PI/2;

            wheel.position.set(
                wx,.8,wz
            );

            car.add(wheel);
        }
    }

    car.position.set(
        x,0,z
    );

    scene.add(car);

    return car;
}

/* player/parked cars */

const vehicles=[];

function addVehicle(
    x,z,color,rotation=0,
    traffic=false
){

    const car=createCar(
        x,z,color
    );

    car.rotation.y=rotation;

    const data={
        mesh:car,
        speed:traffic
            ? 7+Math.random()*6
            : 0,
        traffic,
        occupied:false
    };

    vehicles.push(data);

    return data;
}

addVehicle(
    45,70,
    0xffc400,
    Math.PI/2
);

addVehicle(
    65,70,
    0xd9342b,
    Math.PI/2
);

addVehicle(
    -55,-70,
    0xeeeeee,
    0
);

addVehicle(
    70,-70,
    0x2d68bd,
    0
);

addVehicle(
    -90,100,
    0xffc400,
    Math.PI/2
);

addVehicle(
    120,70,
    0x38a052,
    Math.PI/2
);

/* traffic */

addVehicle(
    -100,-300,
    0xffc400,
    0,
    true
);

addVehicle(
    80,-300,
    0xd9342b,
    0,
    true
);

addVehicle(
    -100,300,
    0xffffff,
    Math.PI,
    true
);

addVehicle(
    100,300,
    0x2d68bd,
    Math.PI,
    true
);

addVehicle(
    -300,100,
    0xffc400,
    Math.PI/2,
    true
);

addVehicle(
    -300,-100,
    0x38a052,
    Math.PI/2,
    true
);

/* =========================================================
   NPCs
========================================================= */

const npcs=[];

function createNPC(
    x,z
){

    const npc=new THREE.Group();

    const colors=[
        0x9b3328,
        0x176b8f,
        0x6c4d8b,
        0x3d7348,
        0xb87854
    ];

    const shirt=
        colors[
            Math.floor(
                Math.random()*4
            )
        ];

    const body=new THREE.Mesh(
        new THREE.CapsuleGeometry(
            .65,1.5,5,8
        ),
        new THREE.MeshStandardMaterial({
            color:shirt
        })
    );

    body.position.y=2;
    npc.add(body);

    const head=new THREE.Mesh(
        new THREE.SphereGeometry(
            .72,16,12
        ),
        new THREE.MeshStandardMaterial({
            color:0xb87854
        })
    );

    head.position.y=4;
    npc.add(head);

    const hair=new THREE.Mesh(
        new THREE.SphereGeometry(
            .74,16,10
        ),
        new THREE.MeshStandardMaterial({
            color:0x17130f
        })
    );

    hair.scale.y=.55;
    hair.position.y=4.42;
    npc.add(hair);

    npc.position.set(
        x,0,z
    );

    scene.add(npc);

    npcs.push({
        mesh:npc,
        angle:Math.random()*Math.PI*2,
        timer:0
    });
}

for(let i=0;i<18;i++){

    createNPC(
        THREE.MathUtils.randFloatSpread(500),
        THREE.MathUtils.randFloatSpread(500)
    );
}

/* =========================================================
   CAMERA / MOUSE
========================================================= */

let cameraYaw=0;
let cameraPitch=.18;
let mouseLocked=false;

const overlay=document.createElement("div");

overlay.innerHTML=`
<div style="
position:absolute;
left:50%;
top:50%;
transform:translate(-50%,-50%);
background:rgba(6,10,15,.9);
padding:28px 38px;
border-radius:14px;
text-align:center;
color:white;
font-family:Arial;
box-shadow:0 12px 45px rgba(0,0,0,.55);
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
CLICK TO PLAY
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

document.addEventListener(
    "mousemove",
    e=>{

        if(!mouseLocked)return;

        cameraYaw -=
            e.movementX*.0025;

        cameraPitch -=
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
   INPUT
========================================================= */

const keys={};

addEventListener(
    "keydown",
    e=>{

        keys[e.code]=true;

        if(
            e.code==="KeyE" &&
            !e.repeat
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
   VEHICLE SYSTEM
========================================================= */

let currentVehicle=null;
let inVehicle=false;
let vehicleSpeed=0;

function nearestVehicle(){

    let best=null;
    let bestDistance=9;

    for(
        const v of vehicles
    ){

        if(v.occupied)continue;

        const d=
            player.position.distanceTo(
                v.mesh.position
            );

        if(d<bestDistance){

            bestDistance=d;
            best=v;
        }
    }

    return best;
}

function enterVehicle(){

    const v=nearestVehicle();

    if(!v)return;

    currentVehicle=v;
    v.occupied=true;
    v.traffic=false;

    inVehicle=true;
    player.visible=false;

    vehicleSpeed=0;

    interaction.style.display="none";
    speedHUD.style.display="block";
}

function exitVehicle(){

    if(!currentVehicle)return;

    const car=
        currentVehicle.mesh;

    const side=
        new THREE.Vector3(
            5,0,0
        );

    side.applyQuaternion(
        car.quaternion
    );

    player.position.copy(
        car.position
    );

    player.position.add(side);

    if(blocked(
        player.position,
        1
    )){
        player.position.z+=4;
    }

    player.visible=true;

    currentVehicle.occupied=false;
    currentVehicle=null;

    inVehicle=false;
    vehicleSpeed=0;

    speedHUD.style.display="none";
}

function toggleVehicle(){

    if(inVehicle){
        exitVehicle();
    }else{
        enterVehicle();
    }
}

/* =========================================================
   PLAYER
========================================================= */

function updatePlayer(delta){

    if(inVehicle)return;

    let f=0;
    let r=0;

    if(keys.KeyW)f=-1;
    if(keys.KeyS)f=1;
    if(keys.KeyA)r=-1;
    if(keys.KeyD)r=1;

    const len=Math.hypot(f,r);

    if(!len)return;

    f/=len;
    r/=len;

    const speed=
        keys.ShiftLeft ||
        keys.ShiftRight
        ?18
        :9;

    const dir=new THREE.Vector3(
        r,0,f
    );

    dir.applyAxisAngle(
        new THREE.Vector3(0,1,0),
        cameraYaw
    );

    const next=
        player.position.clone();

    next.addScaledVector(
        dir,
        speed*delta
    );

    if(!blocked(next,1.2)){

        player.position.copy(next);

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
}

/* =========================================================
   CAR DRIVING + COLLISION
========================================================= */

function updateVehicle(delta){

    if(!inVehicle)return;

    if(keys.KeyW)
        vehicleSpeed+=24*delta;

    if(keys.KeyS)
        vehicleSpeed-=30*delta;

    vehicleSpeed=
        THREE.MathUtils.clamp(
            vehicleSpeed,
            -12,
            42
        );

    vehicleSpeed*=
        Math.pow(.985,delta*60);

    let steer=0;

    if(keys.KeyA)steer=1;
    if(keys.KeyD)steer=-1;

    if(
        Math.abs(vehicleSpeed)>.5
    ){

        currentVehicle.mesh.rotation.y +=
            steer*.045*
            (vehicleSpeed/18)*
            delta*60;
    }

    const forward=
        new THREE.Vector3(
            0,0,-1
        );

    forward.applyQuaternion(
        currentVehicle.mesh.quaternion
    );

    const next=
        currentVehicle.mesh.position.clone();

    next.addScaledVector(
        forward,
        vehicleSpeed*delta
    );

    if(
        !blocked(next,2.3)
    ){

        currentVehicle.mesh.position.copy(
            next
        );

    }else{

        vehicleSpeed*=-.2;
    }

    speedNum.textContent=
        Math.round(
            Math.abs(vehicleSpeed)*3
        );
}

/* =========================================================
   TRAFFIC
========================================================= */

function updateTraffic(delta){

    for(
        const v of vehicles
    ){

        if(
            !v.traffic ||
            v.occupied
        )continue;

        const dir=
            new THREE.Vector3(
                0,0,-1
            );

        dir.applyQuaternion(
            v.mesh.quaternion
        );

        v.mesh.position.addScaledVector(
            dir,
            v.speed*delta
        );

        if(
            v.mesh.position.z>340
        )
            v.mesh.position.z=-340;

        if(
            v.mesh.position.z<-340
        )
            v.mesh.position.z=340;

        if(
            v.mesh.position.x>340
        )
            v.mesh.position.x=-340;

        if(
            v.mesh.position.x<-340
        )
            v.mesh.position.x=340;
    }
}

/* =========================================================
   NPC WALKING
========================================================= */

function updateNPCs(delta){

    for(
        const n of npcs
    ){

        n.timer-=delta;

        if(n.timer<=0){

            n.angle+=
                (Math.random()-.5)*1.8;

            n.timer=
                2+Math.random()*4;
        }

        const dir=
            new THREE.Vector3(
                Math.sin(n.angle),
                0,
                Math.cos(n.angle)
            );

        const next=
            n.mesh.position.clone();

        next.addScaledVector(
            dir,
            delta*1.2
        );

        if(
            !blocked(next,.7)
        ){

            n.mesh.position.copy(
                next
            );

            n.mesh.rotation.y=
                Math.atan2(
                    dir.x,
                    dir.z
                );
        }
    }
}

/* =========================================================
   INTERACTION
========================================================= */

function updateInteraction(){

    if(inVehicle){

        interaction.style.display="none";
        return;
    }

    const v=nearestVehicle();

    if(v){

        interaction.innerHTML=
            "<b>E</b> ENTER VEHICLE";

        interaction.style.display="block";

    }else{

        interaction.style.display="none";
    }
}

/* =========================================================
   CAMERA
========================================================= */

function updateCamera(){

    const target=
        inVehicle
        ?currentVehicle.mesh.position.clone()
        :player.position.clone();

    target.y+=
        inVehicle
        ?3
        :5;

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
   MINIMAP
========================================================= */

function updateMap(){

    const dot=
        document.getElementById("dot");

    dot.style.left="50%";
    dot.style.top="50%";
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
    updateNPCs(delta);
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
