import * as THREE from './build/three.module.js';
import { RGBELoader } from './jsm/loaders/RGBELoader.js';
import {OrbitControls} from './jsm/controls/OrbitControls.js';
import {GLTFLoader} from './jsm/loaders/GLTFLoader.js';
import Mqtt from './mqtt.js'

import {
    CSS3DRenderer,
    CSS3DObject,
} from "./jsm/CSS3DRenderer.js";
let scene, renderer, camera;
let model, skeleton, mixer, clock;
let greenMaterial, yellowMaterial, redMaterial;
let raycaster, mouse;
let render3D;
let materialGreen, materialYellow, materialRed, emissiveMaterialGreen, emissiveMaterialYellow, emissiveMaterialRed;
let timer = {}
let cssObject = {}
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
        model.updateMatrixWorld(true)
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
    // light
    setLight()
    window.addEventListener('resize', onWindowResize);
    // window.addEventListener( 'click', onMouseClick, false );
    connectMqtt()
}
function createdCSS3DLabel() {
    //增加一个CSS3D对象
    let element = document.createElement("div");
    element.className = "css3dcontain";
    element.style.opacity = 0.75;
    let lableTitle = document.createElement("div");
    lableTitle.className = "css3dTitle";
    //   lableTitle.style.opacity = 0.75;
    lableTitle.textContent = "数据详情";
    element.appendChild(lableTitle);

    let lableItem = document.createElement("div");
    lableItem.className = "css3dItem";
    lableItem.style.opacity = 0.75;
    let lableLeft = document.createElement("div");
    lableLeft.className = "css3dLeft";
    lableLeft.textContent = "产量";
    //   lableLeft.style.opacity = 0.75;
    let lableRight = document.createElement("div");
    lableRight.className = "css3dRight";
    //   lableRight.style.opacity = 0.75;
    lableRight.textContent = "10/h";
    lableItem.appendChild(lableLeft);
    lableItem.appendChild(lableRight);
    element.appendChild(lableItem);

    return element;
}
function setLight() {
    const light = new THREE.AmbientLight( 0xffffff, 0.5 ); // soft white light
    scene.add( light );
    const PointLightUp = new THREE.PointLight( 0xffffff, 2, 100 );
    PointLightUp.position.set(0, 4, -2);
    PointLightUp.castShadow = true
    PointLightUp.shadow.bias =  -0.0005
    PointLightUp.shadow.mapSize.width = 1024; // default
    PointLightUp.shadow.mapSize.height = 1024; // default
    PointLightUp.shadow.camera.near = 0.5; // default
    PointLightUp.shadow.camera.far = 1.5 // default
    scene.add( PointLightUp );
    const PointLightDown = PointLightUp.clone()
    PointLightDown.position.set(0, 4, 2)
    scene.add( PointLightDown );

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
    const controls2 = new OrbitControls(camera, render3D.domElement);
    controls2.enablePan = false;
    controls2.enableZoom = true;
    controls2.update();
}
function setCamera () {
    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight,1, 1000 );
    camera.position.set(0,6,12);
}
function setRenderer () {
    const container = document.getElementById('container');

    // model renderer
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // css renderer
    render3D = new CSS3DRenderer();
    render3D.setSize(
        window.innerWidth, window.innerHeight
    );
    render3D.domElement.style.position = "absolute";
    render3D.domElement.style.top = '0';
    container.appendChild(render3D.domElement);
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
// function onMouseClick(event) {
//     event.preventDefault();
//     raycaster = new THREE.Raycaster()
//     mouse = new THREE.Vector2()
//     mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
//     mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
//     raycaster.setFromCamera(mouse, camera)
//     let intersects = raycaster.intersectObjects(scene.children);
//     console.log(intersects)
//     const obj = intersects[0].object
//     if (obj.parent.name.startsWith('机器')) {
//         if (obj.material === redMaterial) {
//             obj.material = yellowMaterial
//         } else if (obj.material === yellowMaterial) {
//             obj.material = greenMaterial
//         } else {
//             obj.material = redMaterial
//         }
//         // get world position
//
//         const position = getWorldPosition(obj)
//         // create css
//         const element = createdCSS3DLabel();
//         let css3DObject = new CSS3DObject(element);
//         if (position.x > 2) {
//             css3DObject.position.x = position.x - 2.05
//         } else if (position.x > 1.5) {
//             css3DObject.position.x = position.x - 1.05
//         } else if (position.x < -2 ) {
//             css3DObject.position.x = position.x + 0.96
//         } else {
//             css3DObject.position.x = position.x - 0.05
//         }
//         console.log( css3DObject.position.x)
//         // css3DObject.position.x = position.x > 1.6 ? position.x - 2 : position.x
//         css3DObject.position.y = position.y + 0.2
//         css3DObject.position.z = position.z > 2.8 ? position.z - 1.5 : position.z + 0.9
//         setModelPosition(css3DObject)
//         const scale = 0.01
//         css3DObject.scale.set(scale, scale, scale)
//         // model.children.push(css3DObject)
//         scene.add(css3DObject);
//     }
// }
function getWorldPosition(obj) {
    obj.geometry.computeBoundingBox();
    const boundingBox = obj.geometry.boundingBox;
    const position = new THREE.Vector3();
    position.subVectors( boundingBox.max, boundingBox.min );
    position.multiplyScalar( 1);
    position.add( boundingBox.min );
    position.applyMatrix4( obj.matrixWorld );
    return position
}
function setEmergenceLight(model) {
    console.log(model)
    const lights = model.children.filter(item => item.name === "三色灯1")[0].children
    materialGreen = lights[1].material.clone()
    materialYellow = lights[2].material.clone()
    materialRed = lights[4].material.clone()
    emissiveMaterialGreen = lights[1].material.clone()
    emissiveMaterialYellow =  lights[2].material.clone()
    emissiveMaterialRed =  lights[4].material.clone()
    emissiveMaterialGreen.emissive = new THREE.Color( 0,255, 0 );
    emissiveMaterialYellow.emissive = new THREE.Color( 225,0, 0 );
    emissiveMaterialRed.emissive = new THREE.Color( 255,0, 0 );
    for(let i = 1; i < 9; i++){
        const device =  model.children.filter(item => item.name === "三色灯" + i)[0]
        device.children[1].material = emissiveMaterialGreen
        device.children[2].material = materialYellow
        device.children[4].material = materialRed
        timer[device+i] = setInterval(() => {
            if(  device.children[1].material === materialGreen) {
                device.children[1].material = emissiveMaterialGreen
            } else {
                device.children[1].material = materialGreen
            }
        }, 500)
    }
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
    render3D.render(scene, camera);
}
function connectMqtt() {
    const mqttOptions = {
        // host: '192.168.53.209',
        // port: 11884,
        // useSSL: false,
        // path: '/',
        // clientId: 'reserved?nonce=456&timestamp=1625845512921',
        // username: 'wHsdx3IOHL77zlK2UYmn',
        // password: 'de5dc3536274581e64e178e1365d92d39978d4c81225f29df76f4a48f831cb5f',
        // subscription: [
        //     `/sys/aoZvAxQmzg/aoZvAxQmzh/thing/property/post`,
        // ]
        host: 'larkea.staging.pivaiot.com',
        port: 443,
        useSSL: true,
        path: '/mqtt',
        clientId: 'reserved?nonce=456&timestamp=1625845512921',
        username: '2eiqA27osEW8EDnDuiqAe8',
        password: 'de5dc3536274581e64e178e1365d92d39978d4c81225f29df76f4a48f831cb5f',
        subscription: [
            `/sys/aoZvAxQmzg/aoZvAxQmzh/thing/property/post`,
        ]
    }
    const mqtt = new Mqtt(mqttOptions, (message) => {
        const data = JSON.parse(message.payloadString).properties
        console.log(data)
        const deviceLight =  model.children.filter(item => item.name === "三色灯" + data.id)[0]
        const device =  model.children.filter(item => item.name === "机器" + data.id)[0].children[0]
        if(timer[deviceLight+data.id]) {
            clearInterval(timer[deviceLight+data.id])
            timer[deviceLight+data.id] = ''
        }
        if(cssObject[device+data.id]) {
            scene.remove(cssObject[device+data.id])
            cssObject[device+data.id] = ''
        }
        switch (data.status) {
            case 0:
                device.material = greenMaterial
                deviceLight.children[1].material = emissiveMaterialGreen
                deviceLight.children[2].material = materialYellow
                deviceLight.children[4].material = materialRed
                timer[deviceLight+data.id] = setInterval(() => {
                    if(  deviceLight.children[1].material === materialGreen) {
                        deviceLight.children[1].material = emissiveMaterialGreen
                    } else {
                        deviceLight.children[1].material = materialGreen
                    }
                }, 500)
                break
            case 1:
                device.material = redMaterial
                deviceLight.children[1].material = materialGreen
                deviceLight.children[2].material = materialYellow
                deviceLight.children[4].material = emissiveMaterialRed
                timer[deviceLight+data.id] = setInterval(() => {
                    if(  deviceLight.children[4].material === materialRed) {
                        deviceLight.children[4].material = emissiveMaterialRed
                    } else {
                        deviceLight.children[4].material = materialRed
                    }
                }, 500)
                const position = getWorldPosition(device)
                // create css
                const element = createdCSS3DLabel();
                let css3DObject = new CSS3DObject(element);
                if (position.x > 2) {
                    css3DObject.position.x = position.x - 2.05
                } else if (position.x > 1.5) {
                    css3DObject.position.x = position.x - 1.05
                } else if (position.x < -2 ) {
                    css3DObject.position.x = position.x + 0.96
                } else {
                    css3DObject.position.x = position.x - 0.05
                }
                console.log( css3DObject.position.x)
                css3DObject.position.y = position.y + 0.2
                css3DObject.position.z = position.z > 2.8 ? position.z - 1.5 : position.z + 0.9
                setModelPosition(css3DObject)
                const scale = 0.01
                css3DObject.scale.set(scale, scale, scale)
                scene.add(css3DObject);
                cssObject[device+data.id] = css3DObject
                break
            case 2:
                device.material = yellowMaterial
                deviceLight.children[1].material = materialGreen
                deviceLight.children[2].material = emissiveMaterialYellow
                deviceLight.children[4].material = materialRed
                timer[deviceLight+data.id] = setInterval(() => {
                    if(  deviceLight.children[2].material === materialYellow) {
                        deviceLight.children[2].material = emissiveMaterialYellow
                    } else {
                        deviceLight.children[2].material = materialYellow
                    }
                }, 500)

                break
        }
    })
    mqtt.connectMqtt()
}

export {init}
