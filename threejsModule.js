import * as THREE from './build/three.module.js';
import { RGBELoader } from './jsm/loaders/RGBELoader.js';
import {OrbitControls} from './jsm/controls/OrbitControls.js';
import {GLTFLoader} from './jsm/loaders/GLTFLoader.js';
let scene, renderer, camera;
let model, skeleton, mixer, clock;
let greenMaterial, yellowMaterial, redMaterial;
let raycaster, mouse;
function init(path) {
    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0a0a0);
    // new RGBELoader()
    //     .setPath( 'textures/equirectangular/' )
    //     .load( 'venice_sunset_1k.hdr', function ( texture ) {
    //         texture.mapping = THREE.EquirectangularReflectionMapping;
    //         scene.environment = texture;
    //     })
    const loader = new GLTFLoader();
    loader.load(path, function (gltf) {
        model = gltf.scene.children[0];
        console.log(model)
        setMachineMaterial(model)
        setEmergenceLight(model)
        const scale = 0.4
        model.scale.set(scale,scale,scale);
        scene.add(model);
        setModelPosition(model)
        setShadow(model)
        skeleton = new THREE.SkeletonHelper(model);
        skeleton.visible = false;
        scene.add(skeleton);
        mixer = new THREE.AnimationMixer(model);
        animate();
    });
    // renderer
    setRenderer()
    // camera
    setCamera()
    // controls
    setControls()
    window.addEventListener('resize', onWindowResize);
    window.addEventListener( 'click', onMouseClick, false );
    setLight()
}
function setLight() {
    const light = new THREE.AmbientLight( 0xffffff, 0.5 ); // soft white light
    scene.add( light );
    const PointLight = new THREE.PointLight( 0xffffff, 4, 100 );
    PointLight.position.set( 0, 1, 0);
    PointLight.castShadow = true
    scene.add( PointLight );
    PointLight.shadow.bias =  -0.0005
    PointLight.shadow.mapSize.width = 1024; // default
    PointLight.shadow.mapSize.height = 1024; // default
    PointLight.shadow.camera.near = 0.5; // default
    PointLight.shadow.camera.far = 1.5 // default
}
function setModelPosition(object) {
    object.updateMatrixWorld();
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    object.position.x += object.position.x - center.x;
    object.position.y += object.position.y - center.y;
    object.position.z += object.position.z - center.z;
}
function setControls () {
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.update();
}
function setCamera () {
    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight,1, 1000 );
    camera.position.set(-5, 10, 4);
}
function setRenderer () {
    const container = document.getElementById('container');
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

}
function setShadow(model) {
    model.traverse(function (object) {
        if (object.name === '墙体') {
            object.children.forEach(item => {
                item.receiveShadow = true;
                object.castShadow = false
            })
        } else {
            object.castShadow = true;
        }
    });
}
function setMachineMaterial(model) {
    greenMaterial =  model.children.filter(item => item.name === '机器3')[0].children[0].material.clone()
    const yellowMaterialColor = model.children.filter(item => item.name === '机器2')[0].children[0].material.color
    yellowMaterial = model.children.filter(item => item.name === '机器3')[0].children[0].material.clone()
    yellowMaterial.color = yellowMaterialColor
    redMaterial = model.children.filter(item => item.name === '机器1')[0].children[0].material.clone()
    model.traverse(function (object) {
        if (object.name.startsWith('机器')) {
            object.children[0].material = greenMaterial
        }
    });
}
function onMouseClick(event) {
    event.preventDefault();
    raycaster = new THREE.Raycaster()
    mouse = new THREE.Vector2()
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    //console.log("x: " + mouse.x + ", y: " + mouse.y);
    raycaster.setFromCamera(mouse, camera)
    let intersects = raycaster.intersectObjects(scene.children);
    console.log(intersects)
    const obj = intersects[0].object
    if (obj.parent.name.startsWith('机器')) {
        if (obj.material === redMaterial) {
            obj.material = yellowMaterial
        } else if (obj.material === yellowMaterial) {
            obj.material = greenMaterial
        } else {
            obj.material = redMaterial
        }
    }

}
function setEmergenceLight(model) {
    console.log(model)
    const lights = model.children.filter(item => item.name === "三色灯1")[0].children
    const materialGreen = lights[1].material.clone()
    const materialYellow = lights[2].material.clone()
    const materialRed = lights[3].material.clone()
    setInterval(() => {
        if (lights[1].material.emissive.g === 0) {
            materialGreen.emissive = new THREE.Color( 0,255, 0 );
            lights[1].material = materialGreen
        } else {
            materialGreen.emissive = new THREE.Color( 0,0, 0 );
            lights[1].material = materialGreen
        }
        // if (lights[4].material.emissive.r === 0) {
        //     materialRed.emissive = new THREE.Color( 255,0, 0 );
        //     lights[4].material = materialRed
        // } else {
        //     materialRed.emissive = new THREE.Color( 0,0, 0 );
        //     lights[4].material = materialRed
        // }
    },500)
}
function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}
function animate() {
    // Render loop
    requestAnimationFrame(animate);
    // Get the time elapsed since the last frame, used for mixer update
    const mixerUpdateDelta = clock.getDelta();
    mixer.update(mixerUpdateDelta);
    renderer.render(scene, camera);
}
function F_Open_dialog() {
    document.getElementById("btn_file").click();
    console.log(window.init)
}

export {init, F_Open_dialog}
