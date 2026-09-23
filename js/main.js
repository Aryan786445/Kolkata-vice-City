import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js";

/* =========================================================
   KOLKATA VICE CITY — V7.1
   ========================================================= */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fc7e8);
scene.fog = new THREE.Fog(0x8fc7e8, 90, 650);

const camera = new THREE.PerspectiveCamera(
    65,
    innerWidth / innerHeight,
    0.1,
    1200
);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
});

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

/* =========================
   UI
========================= */

const ui = document.getElementById("game-ui");

ui.innerHTML = `
<div id="kv-title">KOLKATA VICE CITY</div>
<div id="kv-money">₹ 2,500</div>

<div id="kv-wanted">
    <span>☆</span><span>☆</span><span>☆</span><span>☆</span><span>☆</span>
</div>

<div id="kv-speed">0 KM/H</div>
<div id="kv-cross">+</div>
<div id="kv-action">E — ENTER VEHICLE</div>

<div id="kv-map">
    <div id="kv-map-player"></div>
    <div class="map-road r1"></div>
    <div class="map-road r2"></div>
    <div class="map-road r3"></div>
    <div class="map-river"></div>
</div>

<div id="kv-help">
    <b>WASD</b> Move / Drive &nbsp; <b>SHIFT</b> Run<br>
    <b>E</b> Enter / Exit Vehicle &nbsp; <b>MOUSE</b> Camera<br>
    <b>ESC</b> Release Mouse
</div>
`;

const style = document.createElement("style");

style.textContent = `
#game-ui{
    font-family:Arial,sans-serif;
    color:white;
    text-shadow:2px 2px 5px #000;
    pointer-events:none;
}

#kv-title{
    position:absolute;
    left:25px;
    top:20px;
    font-size:24px;
    font-weight:900;
    letter-spacing:3px;
}

#kv-money{
    position:absolute;
    right:25px;
    top:20px;
    font-size:22px;
    font-weight:bold;
}

#kv-wanted{
    position:absolute;
    right:25px;
    top:55px;
    font-size:24px;
    letter-spacing:3px;
}

#kv-speed{
    position:absolute;
    right:25px;
    bottom:30px;
    font-size:20px;
    font-weight:bold;
}

#kv-cross{
    position:absolute;
    left:50%;
    top:50%;
    transform:translate(-50%,-50%);
    font-size:25px;
    font-weight:bold;
}

#kv-action{
    display:none;
    position:absolute;
    left:50%;
    bottom:125px;
    transform:translateX(-50%);
    padding:10px 18px;
    border:1px solid rgba(255,255,255,.7);
    background:rgba(0,0,0,.55);
    border-radius:7px;
    font-weight:bold;
}

#kv-help{
    position:absolute;
    left:25px;
    bottom:25px;
    font-size:13px;
    line-height:1.7;
}

#kv-map{
    position:absolute;
    right:22px;
    bottom:70px;
    width:145px;
    height:145px;
    border-radius:50%;
    overflow:hidden;
    border:3px solid rgba(255,255,255,.8);
    background:#343434;
    box-shadow:0 3px 12px #000;
}

#kv-map-player{
    position:absolute;
    left:50%;
    top:50%;
    width:9px;
    height:9px;
    transform:translate(-50%,-50%);
    background:white;
    border-radius:50%;
    z-index:5;
}

.map-road{
    position:absolute;
    background:#777;
}

.r1{
    width:180px;
    height:11px;
    left:-15px;
    top:58px;
    transform:rotate(18deg);
}

.r2{
    width:180px;
    height:9px;
    left:-10px;
    top:105px;
    transform:rotate(-32deg);
}

.r3{
    width:9px;
    height:180px;
    left:77px;
    top:-15px;
}

.map-river{
    position:absolute;
    right:-30px;
    top:-10px;
    width:65px;
    height:180px;
    background:#287eaa;
    transform:rotate(12deg);
}
`;

document.head.appendChild(style);

/* =========================
   LIGHTING
========================= */

const hemi = new THREE.HemisphereLight(
    0xbfe8ff,
    0x34402d,
    2.1
);

scene.add(hemi);

const sun = new THREE.DirectionalLight(
    0xfff1cf,
    3.2
);

sun.position.set(-180,260,100);
sun.castShadow = true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left = -300;
sun.shadow.camera.right = 300;
sun.shadow.camera.top = 300;
sun.shadow.camera.bottom = -300;

scene.add(sun);

/* =========================
   MATERIALS
========================= */

const mat = (color, roughness=.8) =>
    new THREE.MeshStandardMaterial({
        color,
        roughness,
        metalness:.05
    });

const roadMat = mat(0x25272b);
const sidewalkMat = mat(0xb3aaa0);
const grassMat = mat(0x3c783d);

const buildingMats = [
    mat(0xc5a47b),
    mat(0xd4c3a2),
    mat(0x9d8f85),
    mat(0xb77c63),
    mat(0xe1d3bd),
    mat(0x817b76),
    mat(0xc28f55)
];

const colliders = [];

/* =========================
   BOX
========================= */

function makeBox(
    x,y,z,
    sx,sy,sz,
    material,
    collision=false
){
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(sx,sy,sz),
        material
    );

    mesh.position.set(x,y,z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    scene.add(mesh);

    if(collision){
        colliders.push({
            minX:x-sx/2,
            maxX:x+sx/2,
            minZ:z-sz/2,
            maxZ:z+sz/2
        });
    }

    return mesh;
}

/* =========================
   GROUND
========================= */

makeBox(
    0,-.3,0,
    900,.5,900,
    grassMat,
    false
);

/* =========================
   ROADS
========================= */

function road(x,z,width,length,horizontal=true){

    if(horizontal){

        makeBox(
            x,.01,z,
            length,.04,width,
            roadMat,
            false
        );

        /* FOOTPATH — NO COLLISION */
        makeBox(
            x,.035,z-width/2-2,
            length,.08,4,
            sidewalkMat,
            false
        );

        makeBox(
            x,.035,z+width/2+2,
            length,.08,4,
            sidewalkMat,
            false
        );

        for(
            let p=x-length/2+10;
            p<x+length/2;
            p+=12
        ){
            makeBox(
                p,.045,z,
                6,.025,.25,
                mat(0xe7dcae),
                false
            );
        }

    }else{

        makeBox(
            x,.01,z,
            width,.04,length,
            roadMat,
            false
        );

        /* FOOTPATH — NO COLLISION */
        makeBox(
            x-width/2-2,.035,z,
            4,.08,length,
            sidewalkMat,
            false
        );

        makeBox(
            x+width/2+2,.035,z,
            4,.08,length,
            sidewalkMat,
            false
        );

        for(
            let p=z-length/2+10;
            p<z+length/2;
            p+=12
        ){
            makeBox(
                x,.045,p,
                .25,.025,6,
                mat(0xe7dcae),
                false
            );
        }
    }
}

road(0,0,20,700,true);
road(0,120,18,700,true);
road(0,-120,18,700,true);

road(-120,0,18,700,false);
road(120,0,18,700,false);

road(-250,0,16,600,false);
road(250,0,16,600,false);

/* =========================
   BUILDINGS
========================= */

function building(x,z,w,d,h,material){

    makeBox(
        x,h/2,z,
        w,h,d,
        material,
        true
    );

    const windowMat =
        mat(0x9fd0d8,.35);

    for(
        let y=2.5;
        y<h-1;
        y+=4
    ){

        for(
            let px=-w/2+2;
            px<=w/2-2;
            px+=4
        ){

            if(Math.random()>.15){

                const win =
                    new THREE.Mesh(
                        new THREE.BoxGeometry(
                            1.25,
                            1.25,
                            .08
                        ),
                        windowMat
                    );

                win.position.set(
                    x+px,
                    y,
                    z-d/2-.06
                );

                scene.add(win);
            }

            if(Math.random()>.25){

                const win =
                    new THREE.Mesh(
                        new THREE.BoxGeometry(
                            1.25,
                            1.25,
                            .08
                        ),
                        windowMat
                    );

                win.position.set(
                    x+px,
                    y,
                    z+d/2+.06
                );

                scene.add(win);
            }
        }
    }
}

for(
    let x=-330;
    x<=330;
    x+=42
){

    for(
        let z=-330;
        z<=330;
        z+=42
    ){

        if(
            Math.abs(z)<18 ||
            Math.abs(z-120)<18 ||
            Math.abs(z+120)<18 ||
            Math.abs(x-120)<18 ||
            Math.abs(x+120)<18 ||
            Math.abs(x-250)<18 ||
            Math.abs(x+250)<18
        ) continue;

        if(Math.random()<.76){

            const w=22+Math.random()*12;
            const d=20+Math.random()*14;
            const h=12+Math.random()*48;

            building(
                x+(Math.random()-.5)*8,
                z+(Math.random()-.5)*8,
                w,d,h,
                buildingMats[
                    Math.floor(
                        Math.random()*
                        buildingMats.length
                    )
                ]
            );
        }
    }
}

/* =========================
   TREES
========================= */

function tree(x,z,scale=1){

    const trunk =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                .45*scale,
                .65*scale,
                4*scale,
                8
            ),
            mat(0x65452d)
        );

    trunk.position.set(
        x,
        2*scale,
        z
    );

    trunk.castShadow=true;
    scene.add(trunk);

    const crown =
        new THREE.Mesh(
            new THREE.IcosahedronGeometry(
                3.2*scale,
                1
            ),
            mat(0x28743a)
        );

    crown.position.set(
        x,
        5*scale,
        z
    );

    crown.castShadow=true;
    scene.add(crown);
}

for(let i=0;i<180;i++){

    const x=(Math.random()-.5)*650;
    const z=(Math.random()-.5)*650;

    if(
        Math.abs(z)<15 ||
        Math.abs(z-120)<15 ||
        Math.abs(z+120)<15 ||
        Math.abs(x)<15
    ) continue;

    tree(
        x,
        z,
        .7+Math.random()*.7
    );
}

/* =========================
   HOOGHLY RIVER
========================= */

makeBox(
    390,-.05,0,
    110,.12,850,
    mat(0x267da6),
    false
);

for(
    let z=-350;
    z<=350;
    z+=18
){

    makeBox(
        330,.03,z,
        4,.03,.35,
        mat(0xa7d7df),
        false
    );
}

/* =========================
   VICTORIA MEMORIAL
========================= */

function createVictoria(){

    const group=new THREE.Group();

    const stone=mat(0xe6e1d1);

    const base =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                42,5,30
            ),
            stone
        );

    base.position.y=2.5;
    group.add(base);

    for(
        let x=-15;
        x<=15;
        x+=10
    ){

        for(
            let z=-9;
            z<=9;
            z+=18
        ){

            const col =
                new THREE.Mesh(
                    new THREE.CylinderGeometry(
                        1.2,1.5,15,12
                    ),
                    stone
                );

            col.position.set(
                x,10,z
            );

            group.add(col);
        }
    }

    const dome =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                13,24,16
            ),
            stone
        );

    dome.scale.y=.7;
    dome.position.y=18;
    group.add(dome);

    const top =
        new THREE.Mesh(
            new THREE.ConeGeometry(
                2.2,7,12
            ),
            mat(0x8b7e55)
        );

    top.position.y=28;
    group.add(top);

    group.position.set(
        300,0,-230
    );

    scene.add(group);
}

createVictoria();

/* =========================
   HOWRAH BRIDGE
========================= */

function createHowrah(){

    const group=new THREE.Group();
    const steel=mat(0x4b4d50,.45);

    for(const x of [-30,30]){

        const tower =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    7,70,12
                ),
                steel
            );

        tower.position.set(
            x,35,0
        );

        group.add(tower);

        const top =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    70,6,10
                ),
                steel
            );

        top.position.set(
            0,70,0
        );

        group.add(top);
    }

    const deck =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                170,4,18
            ),
            steel
        );

    deck.position.y=6;
    group.add(deck);

    for(
        let x=-80;
        x<=80;
        x+=10
    ){

        const cable =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    1,45,1
                ),
                steel
            );

        cable.position.set(
            x,27,0
        );

        group.add(cable);
    }

    group.rotation.y=Math.PI/2;

    group.position.set(
        365,0,-100
    );

    scene.add(group);
}

createHowrah();

/* =========================
   MAIDAN
========================= */

makeBox(
    -230,.02,-225,
    125,.05,100,
    grassMat,
    false
);

for(let i=0;i<20;i++){

    tree(
        -280+Math.random()*100,
        -265+Math.random()*80,
        .8
    );
}

/* =========================
   MACHH BHAAT SHOP
========================= */

function createShop(){

    const group=new THREE.Group();

    const wall =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                25,10,16
            ),
            mat(0xb76b42)
        );

    wall.position.y=5;
    group.add(wall);

    const roof =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                28,1.5,19
            ),
            mat(0x39494b)
        );

    roof.position.y=10.7;
    group.add(roof);

    const canvas=
        document.createElement("canvas");

    canvas.width=1024;
    canvas.height=256;

    const ctx=
        canvas.getContext("2d");

    ctx.fillStyle="#f0c34b";
    ctx.fillRect(
        0,0,1024,256
    );

    ctx.fillStyle="#111";
    ctx.font="bold 110px sans-serif";
    ctx.textAlign="center";
    ctx.textBaseline="middle";

    ctx.fillText(
        "মাছ • ভাত",
        512,128
    );

    const tex=
        new THREE.CanvasTexture(canvas);

    const board=
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                19,2.5
            ),
            new THREE.MeshBasicMaterial({
                map:tex
            })
        );

    board.position.set(
        0,8.7,-8.4
    );

    group.add(board);

    group.position.set(
        -270,0,50
    );

    scene.add(group);
}

createShop();

/* =========================
   PORT
========================= */

function createPort(){

    const baseX=320;
    const baseZ=170;

    makeBox(
        baseX,.3,baseZ,
        90,.6,100,
        mat(0x55585b),
        false
    );

    for(let i=0;i<12;i++){

        const colors=[
            0x3b697f,
            0x8b4c3b,
            0x596e42,
            0xa27a3e
        ];

        makeBox(
            baseX-30+(i%4)*20,
            3+Math.floor(i/4)*6,
            baseZ-25+Math.floor(i/4)*18,
            16,6,10,
            mat(colors[i%4]),
            true
        );
    }

    for(let i=0;i<3;i++){

        const crane=
            new THREE.Group();

        const tower=
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    2,35,2
                ),
                mat(0x4b4d50)
            );

        tower.position.y=17;
        crane.add(tower);

        const arm=
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    35,2,2
                ),
                mat(0x4b4d50)
            );

        arm.position.set(
            14,34,0
        );

        crane.add(arm);

        crane.position.set(
            baseX-30+i*30,
            0,
            baseZ+35
        );

        scene.add(crane);
    }
}

createPort();

/* =========================================================
   PLAYER — SMALLER + NEW FACE
========================================================= */

function createPlayer(){

    const g=new THREE.Group();

    const skin=mat(0x9d623f);
    const skinLight=mat(0xb8754d);
    const hair=mat(0x101010);
    const shirt=mat(0x2875a8);
    const shirtDark=mat(0x17496a);
    const pants=mat(0x202936);
    const shoe=mat(0x171717);
    const white=mat(0xf3f0df);
    const mouthMat=mat(0x542326);

    /* legs */

    const legL=
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.35,4.8,1.45
            ),
            pants
        );

    legL.position.set(
        -.85,3,0
    );

    g.add(legL);

    const legR=legL.clone();
    legR.position.x=.85;
    g.add(legR);

    /* shoes */

    const shoeL=
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.65,.7,2.7
            ),
            shoe
        );

    shoeL.position.set(
        -.85,.45,-.25
    );

    g.add(shoeL);

    const shoeR=shoeL.clone();
    shoeR.position.x=.85;
    g.add(shoeR);

    /* torso */

    const torso=
        new THREE.Mesh(
            new THREE.BoxGeometry(
                3.5,4.8,2.1
            ),
            shirt
        );

    torso.position.y=7.5;
    g.add(torso);

    /* collar */

    const collar=
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                .75,.75,.15,6
            ),
            white
        );

    collar.rotation.x=Math.PI/2;
    collar.position.set(
        0,9.7,-1.05
    );

    g.add(collar);

    /* arms */

    const armL=
        new THREE.Mesh(
            new THREE.CapsuleGeometry(
                .65,3,6,10
            ),
            shirtDark
        );

    armL.position.set(
        -2.2,7.4,0
    );

    armL.rotation.z=-.12;
    g.add(armL);

    const armR=armL.clone();
    armR.position.x=2.2;
    armR.rotation.z=.12;
    g.add(armR);

    /* neck */

    const neck=
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                .65,.7,1.1,12
            ),
            skin
        );

    neck.position.y=10.25;
    g.add(neck);

    /* head */

    const head=
        new THREE.Mesh(
            new THREE.SphereGeometry(
                1.9,24,18
            ),
            skinLight
        );

    head.scale.set(
        1,1.08,.95
    );

    head.position.set(
        0,12.4,0
    );

    g.add(head);

    /* ears */

    for(const x of [-1.85,1.85]){

        const ear=
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    .48,12,8
                ),
                skin
            );

        ear.scale.z=.55;

        ear.position.set(
            x,12.45,0
        );

        g.add(ear);
    }

    /* hair */

    const hairCap=
        new THREE.Mesh(
            new THREE.SphereGeometry(
                1.96,24,12,
                0,Math.PI*2,
                0,Math.PI*.48
            ),
            hair
        );

    hairCap.scale.set(
        1.02,1.12,.98
    );

    hairCap.position.set(
        0,13.05,0
    );

    g.add(hairCap);

    /* hair locks */

    for(let i=-2;i<=2;i++){

        const lock=
            new THREE.Mesh(
                new THREE.ConeGeometry(
                    .25,.85,6
                ),
                hair
            );

        lock.position.set(
            i*.48,
            12.7+Math.abs(i)*.05,
            -1.72
        );

        lock.rotation.x=Math.PI;
        g.add(lock);
    }

    /* eyebrows */

    for(const x of [-.72,.72]){

        const brow=
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    .7,.16,.16
                ),
                hair
            );

        brow.position.set(
            x,12.85,-1.76
        );

        brow.rotation.z=
            x<0 ? -.08 : .08;

        g.add(brow);
    }

    /* eyes */

    for(const x of [-.72,.72]){

        const eye=
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    .32,12,8
                ),
                white
            );

        eye.scale.z=.3;

        eye.position.set(
            x,12.35,-1.78
        );

        g.add(eye);

        const pupil=
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    .13,10,8
                ),
                hair
            );

        pupil.position.set(
            x,12.35,-1.88
        );

        g.add(pupil);
    }

    /* nose */

    const nose=
        new THREE.Mesh(
            new THREE.ConeGeometry(
                .25,.75,8
            ),
            skin
        );

    nose.rotation.x=Math.PI/2;

    nose.position.set(
        0,11.95,-1.9
    );

    g.add(nose);

    /* moustache */

    for(const x of [-.22,.22]){

        const moustache=
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    .27,10,6
                ),
                hair
            );

        moustache.scale.set(
            1.3,.55,.4
        );

        moustache.position.set(
            x,11.5,-1.88
        );

        moustache.rotation.z=
            x<0 ? -.2 : .2;

        g.add(moustache);
    }

    /* mouth */

    const mouth=
        new THREE.Mesh(
            new THREE.BoxGeometry(
                .55,.11,.08
            ),
            mouthMat
        );

    mouth.position.set(
        0,11.22,-1.86
    );

    g.add(mouth);

    /* bracelet */

    const bracelet=
        new THREE.Mesh(
            new THREE.TorusGeometry(
                .67,.09,8,16
            ),
            mat(0xc99a43)
        );

    bracelet.rotation.x=Math.PI/2;
    bracelet.position.set(
        2.18,6.2,0
    );

    g.add(bracelet);

    /*
       IMPORTANT:
       Character is scaled down.
    */

    g.scale.setScalar(.55);

    /*
       START ON ROAD, NOT INSIDE BUILDING
    */

    g.position.set(
        -70,
        0,
        -120
    );

    scene.add(g);

    return g;
}

const player=createPlayer();

/* =========================
   VEHICLES
========================= */

const vehicles=[];

function createCar(
    x,z,color,
    angle=0,
    traffic=false
){

    const g=new THREE.Group();

    const bodyMat=mat(color,.45);
    const black=mat(0x151719,.3);
    const glass=mat(0x7ba6b5,.25);
    const light=mat(0xfff0bd);

    const body=
        new THREE.Mesh(
            new THREE.BoxGeometry(
                4.8,1.35,8
            ),
            bodyMat
        );

    body.position.y=1.3;
    g.add(body);

    const cabin=
        new THREE.Mesh(
            new THREE.BoxGeometry(
                3.6,1.6,4.2
            ),
            glass
        );

    cabin.position.set(
        0,2.45,.2
    );

    g.add(cabin);

    for(const sx of [-2.15,2.15]){

        for(const sz of [-2.55,2.55]){

            const wheel=
                new THREE.Mesh(
                    new THREE.CylinderGeometry(
                        .75,.75,.55,16
                    ),
                    black
                );

            wheel.rotation.z=Math.PI/2;

            wheel.position.set(
                sx,.8,sz
            );

            g.add(wheel);
        }
    }

    const headL=
        new THREE.Mesh(
            new THREE.BoxGeometry(
                .65,.4,.18
            ),
            light
        );

    headL.position.set(
        -1.25,1.55,-4.08
    );

    g.add(headL);

    const headR=headL.clone();
    headR.position.x=1.25;
    g.add(headR);

    g.position.set(
        x,0,z
    );

    g.rotation.y=angle;

    scene.add(g);

    const car={
        mesh:g,
        speed:0,
        occupied:false,
        traffic,
        aiSpeed:
            traffic ?
            .18+Math.random()*.18 :
            0
    };

    vehicles.push(car);

    return car;
}

const carColors=[
    0xd13d32,
    0x2364aa,
    0xf0c338,
    0xeeeeee,
    0x252525,
    0x2f8d5c,
    0xb86f32
];

/* parked */

for(let i=0;i<30;i++){

    const horizontal=
        Math.random()>.5;

    let x,z,angle;

    if(horizontal){

        x=-320+Math.random()*640;

        z=[
            -13,13,
            107,133,
            -107,-133
        ][
            Math.floor(
                Math.random()*6
            )
        ];

        angle=0;

    }else{

        x=[
            -133,-107,
            107,133,
            237,263
        ][
            Math.floor(
                Math.random()*6
            )
        ];

        z=-320+Math.random()*640;

        angle=Math.PI/2;
    }

    createCar(
        x,z,
        carColors[
            Math.floor(
                Math.random()*carColors.length
            )
        ],
        angle
    );
}

/* traffic */

for(let i=0;i<18;i++){

    const z=[
        0,120,-120
    ][i%3];

    const x=
        -340+Math.random()*680;

    createCar(
        x,
        z,
        carColors[
            i%carColors.length
        ],
        i%2 ? Math.PI : 0,
        true
    );
}

/* =========================
   NPCs
========================= */

const npcs=[];

function createNPC(x,z){

    const g=new THREE.Group();

    const skinColors=[
        0x8b5439,
        0x9f6445,
        0xb97750,
        0x70402e
    ];

    const skin=mat(
        skinColors[
            Math.floor(
                Math.random()*skinColors.length
            )
        ]
    );

    const clothes=[
        0x345995,
        0x8b3434,
        0x356b48,
        0xb58a32,
        0x6b4f7d
    ];

    const shirt=mat(
        clothes[
            Math.floor(
                Math.random()*clothes.length
            )
        ]
    );

    const body=
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.3,2.5,.9
            ),
            shirt
        );

    body.position.y=2.3;
    g.add(body);

    const head=
        new THREE.Mesh(
            new THREE.SphereGeometry(
                .65,12,10
            ),
            skin
        );

    head.position.y=4.2;
    g.add(head);

    const legs=
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.15,2,.75
            ),
            mat(0x292b30)
        );

    legs.position.y=.7;
    g.add(legs);

    g.position.set(
        x,0,z
    );

    scene.add(g);

    npcs.push({
        mesh:g,
        angle:
            Math.random()*Math.PI*2,
        speed:
            .015+Math.random()*.025,
        timer:
            60+Math.random()*200
    });
}

for(let i=0;i<55;i++){

    createNPC(
        (Math.random()-.5)*600,
        (Math.random()-.5)*600
    );
}

/* =========================
   COLLISION
========================= */

function blocked(
    x,z,
    radius=.7
){

    for(const c of colliders){

        if(
            x>c.minX-radius &&
            x<c.maxX+radius &&
            z>c.minZ-radius &&
            z<c.maxZ+radius
        ){
            return true;
        }
    }

    return false;
}

/* =========================
   INPUT
========================= */

const keys={};

addEventListener(
    "keydown",
    e=>{

        const key=e.key.toLowerCase();

        keys[key]=true;

        if(
            [
                "w",
                "a",
                "s",
                "d",
                "shift",
                " "
            ].includes(key)
        ){
            e.preventDefault();
        }

        if(key==="e"){
            toggleVehicle();
        }
    }
);

addEventListener(
    "keyup",
    e=>{
        keys[
            e.key.toLowerCase()
        ]=false;
    }
);

/* =========================
   MOUSE CAMERA
========================= */

let yaw=0;
let pitch=-.25;
let mouseLocked=false;

renderer.domElement.addEventListener(
    "click",
    ()=>{
        renderer.domElement.requestPointerLock();
    }
);

document.addEventListener(
    "pointerlockchange",
    ()=>{
        mouseLocked=
            document.pointerLockElement===
            renderer.domElement;
    }
);

document.addEventListener(
    "mousemove",
    e=>{

        if(!mouseLocked) return;

        yaw-=e.movementX*.0025;
        pitch-=e.movementY*.0018;

        pitch=THREE.MathUtils.clamp(
            pitch,
            -1.1,
            .55
        );
    }
);

/* =========================
   VEHICLE SYSTEM
========================= */

let currentVehicle=null;

function nearestVehicle(){

    let best=null;
    let bestDist=9;

    for(const car of vehicles){

        if(car.occupied) continue;

        const d=
            player.position.distanceTo(
                car.mesh.position
            );

        if(d<bestDist){

            bestDist=d;
            best=car;
        }
    }

    return best;
}

function enterVehicle(car){

    if(!car) return;

    currentVehicle=car;
    car.occupied=true;

    player.visible=false;

    document.getElementById(
        "kv-action"
    ).style.display="none";
}

function exitVehicle(){

    if(!currentVehicle) return;

    const car=currentVehicle;

    player.visible=true;

    player.position.copy(
        car.mesh.position
    );

    player.position.x +=
        Math.sin(
            car.mesh.rotation.y
        )*5;

    player.position.z +=
        Math.cos(
            car.mesh.rotation.y
        )*5;

    car.occupied=false;
    car.speed=0;

    currentVehicle=null;
}

function toggleVehicle(){

    if(currentVehicle){

        exitVehicle();
        return;
    }

    const car=nearestVehicle();

    if(car){
        enterVehicle(car);
    }
}

/* =========================
   PLAYER MOVEMENT — FIXED
========================= */

function movePlayer(){

    const speed=
        keys["shift"]
        ? .18
        : .095;

    let forward=0;
    let side=0;

    if(keys["w"]) forward+=1;
    if(keys["s"]) forward-=1;
    if(keys["a"]) side-=1;
    if(keys["d"]) side+=1;

    if(
        forward===0 &&
        side===0
    ){
        return;
    }

    const dir=
        new THREE.Vector3();

    /*
       CAMERA RELATIVE MOVEMENT
    */

    dir.x=
        -Math.sin(yaw)*forward+
        Math.cos(yaw)*side;

    dir.z=
        -Math.cos(yaw)*forward-
        Math.sin(yaw)*side;

    if(dir.lengthSq()>0){
        dir.normalize();
    }

    const nx=
        player.position.x+
        dir.x*speed;

    const nz=
        player.position.z+
        dir.z*speed;

    /*
       Separate X/Z collision
       so walls don't completely
       freeze the character.
    */

    if(
        !blocked(
            nx,
            player.position.z,
            .7
        )
    ){
        player.position.x=nx;
    }

    if(
        !blocked(
            player.position.x,
            nz,
            .7
        )
    ){
        player.position.z=nz;
    }

    /*
       Character faces movement direction.
    */

    player.rotation.y=
        Math.atan2(
            dir.x,
            dir.z
        );
}

/* =========================
   CAR DRIVING
========================= */

function driveVehicle(){

    const car=currentVehicle;

    if(!car) return;

    if(keys["w"]){
        car.speed+=.018;
    }

    if(keys["s"]){
        car.speed-=.025;
    }

    car.speed*=.97;

    car.speed=
        THREE.MathUtils.clamp(
            car.speed,
            -.45,
            1
        );

    let steer=0;

    if(keys["a"]) steer+=.035;
    if(keys["d"]) steer-=.035;

    car.mesh.rotation.y+=
        steer*car.speed;

    const forward=
        new THREE.Vector3(
            -Math.sin(
                car.mesh.rotation.y
            ),
            0,
            -Math.cos(
                car.mesh.rotation.y
            )
        );

    const nx=
        car.mesh.position.x+
        forward.x*car.speed;

    const nz=
        car.mesh.position.z+
        forward.z*car.speed;

    if(
        !blocked(nx,nz,2.3)
    ){

        car.mesh.position.x=nx;
        car.mesh.position.z=nz;

    }else{

        car.speed*= -.25;
    }
}

/* =========================
   TRAFFIC
========================= */

function updateTraffic(){

    for(const car of vehicles){

        if(
            !car.traffic ||
            car===currentVehicle
        ) continue;

        const angle=
            car.mesh.rotation.y;

        car.mesh.position.x-=
            Math.sin(angle)*
            car.aiSpeed;

        car.mesh.position.z-=
            Math.cos(angle)*
            car.aiSpeed;

        if(
            car.mesh.position.x>350 ||
            car.mesh.position.x<-350 ||
            car.mesh.position.z>350 ||
            car.mesh.position.z<-350
        ){

            car.mesh.position.x=
                -car.mesh.position.x;

            car.mesh.position.z=
                -car.mesh.position.z;
        }
    }
}

/* =========================
   NPC AI
========================= */

function updateNPCs(){

    for(const npc of npcs){

        npc.timer--;

        if(npc.timer<=0){

            npc.angle+=
                (Math.random()-.5)*2;

            npc.timer=
                80+Math.random()*180;
        }

        npc.mesh.position.x+=
            Math.sin(npc.angle)*
            npc.speed;

        npc.mesh.position.z+=
            Math.cos(npc.angle)*
            npc.speed;

        npc.mesh.rotation.y=
            npc.angle;

        if(
            Math.abs(
                npc.mesh.position.x
            )>330
        ){
            npc.angle+=Math.PI;
        }

        if(
            Math.abs(
                npc.mesh.position.z
            )>330
        ){
            npc.angle+=Math.PI;
        }
    }
}

/* =========================
   CAMERA — PLAYER SMALL FIX
========================= */

function updateCamera(){

    const target=
        currentVehicle
        ? currentVehicle.mesh.position.clone()
        : player.position.clone();

    target.y+=
        currentVehicle
        ? 2.3
        : 6.5;

    const distance=
        currentVehicle
        ? 16
        : 10;

    const offset=
        new THREE.Vector3(
            Math.sin(yaw)*distance,
            currentVehicle
                ? 5+pitch*4
                : 4.2+pitch*3,
            Math.cos(yaw)*distance
        );

    const desired=
        target.clone().add(offset);

    camera.position.lerp(
        desired,
        .12
    );

    camera.lookAt(target);
}

/* =========================
   HUD
========================= */

function updateHUD(){

    const action=
        document.getElementById(
            "kv-action"
        );

    if(currentVehicle){

        action.style.display="block";

        action.textContent=
            "E — EXIT VEHICLE";

        const kmh=
            Math.round(
                Math.abs(
                    currentVehicle.speed
                )*105
            );

        document.getElementById(
            "kv-speed"
        ).textContent=
            kmh+" KM/H";

        return;
    }

    const car=
        nearestVehicle();

    if(car){

        action.style.display="block";

        action.textContent=
            "E — ENTER VEHICLE";

    }else{

        action.style.display="none";
    }

    document.getElementById(
        "kv-speed"
    ).textContent=
        "0 KM/H";
}

/* =========================
   DAY / NIGHT
========================= */

let worldTime=0;

function updateDayNight(dt){

    worldTime+=dt*.002;

    const sunAngle=
        worldTime%(Math.PI*2);

    sun.position.x=
        Math.cos(sunAngle)*260;

    sun.position.z=
        Math.sin(sunAngle)*260;

    sun.position.y=
        Math.max(
            35,
            Math.sin(sunAngle)*250
        );

    const night=
        sun.position.y<70;

    if(night){

        scene.background.set(
            0x101b35
        );

        scene.fog.color.set(
            0x18233b
        );

        hemi.intensity=.55;
        sun.intensity=.65;

    }else{

        scene.background.set(
            0x8fc7e8
        );

        scene.fog.color.set(
            0x8fc7e8
        );

        hemi.intensity=2.1;
        sun.intensity=3.2;
    }
}

/* =========================
   ANIMATION
========================= */

let last=
    performance.now();

function animate(now){

    requestAnimationFrame(
        animate
    );

    const dt=
        Math.min(
            (now-last)/16.67,
            2
        );

    last=now;

    if(currentVehicle){

        driveVehicle();

    }else{

        movePlayer();
    }

    updateTraffic();
    updateNPCs();
    updateCamera();
    updateHUD();
    updateDayNight(dt);

    renderer.render(
        scene,
        camera
    );
}

animate(
    performance.now()
);

/* =========================
   RESIZE
========================= */

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
