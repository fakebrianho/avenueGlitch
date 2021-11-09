import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { DDSLoader } from "three/examples/jsm/loaders/DDSLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { AfterimagePass } from "three/examples/jsm/postprocessing/AfterimagePass.js";

/*------------------------------
HTML
------------------------------*/
// window.setTimeout(finishedLoading, 5000);
// function finishedLoading() {
//   const loader = document.querySelector("#loader-wrapper");
//   console.log(loader);
//   fadeOut(loader);
//   function fadeOut(el) {
//     el.style.opacity = 1;
//     (function fade() {
//       if ((el.style.opacity -= 0.1) < 0) {
//         el.style.display = "none";
//       } else {
//         requestAnimationFrame(fade);
//       }
//     })();
//   }
// }
const voAudio = document.getElementById("vo");
const musicAudio = document.getElementById("music");
const playBtn = document.querySelector("#play-btn");
const ctx = document.getElementById("webglcanvas");
playBtn.addEventListener("click", () => {
  document.body.classList.add("start-anim");
  voAudio.play();
  musicAudio.play();
  window.setTimeout(animate, 5000);
});
voAudio.onended = () => {
  window.addEventListener("pointerdown", canvasClicker);
  ctx.style.pointerEvents = "auto";
  // document.canvas.style.pointerEvents = "auto";
};
/*------------------------------
Global Setup
------------------------------*/
let afterImagePass;
let linkData;
let counter = 0;
const canvas = document.querySelector("canvas.webgl");
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const mesh = new THREE.Mesh(geometry, material);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
var dummy = new THREE.Object3D();
var sectionWidth = 1;

/*------------------------------
Start Animations
------------------------------*/
const textureLoader = new THREE.TextureLoader();
const heightTexture = textureLoader.load("/assets/Ice_001_DISP.png");
const colorTexture = textureLoader.load(
  "/assets/Ice_001_COLOR.jpg"
  // "/assets/Stylized_Leaves_002_basecolor.jpg"
);
const normalTexture = textureLoader.load(
  "/assets/Ice_001_NRM.jpg"
  // "/assets/Stylized_Leaves_002_normal.jpg"
);
const roughnessTexture = textureLoader.load(
  "/assets/Ice_001_SPEC.jpg"
  // "/assets/Stylized_Leaves_002_roughness.jpg"
);
const ambientOcclusionTexture = textureLoader.load(
  "/assets/Ice_001_OCC.jpg"
  // "/assets/Stylized_Leaves_002_ambientOcculsion.jpg"
);
/*------------------------------
3D Objects
------------------------------*/
const onProgress = function (xhr) {
  if (xhr.lengthComputable) {
    const percentComplete = (xhr.loaded / xhr.total) * 100;
    console.log(Math.round(percentComplete, 2) + "% downloaded");
  }
};

const onError = function () {};

const manager = new THREE.LoadingManager();
manager.addHandler(/\.dds$/i, new DDSLoader());

// comment in the following line and import TGALoader if your asset uses TGA textures
// manager.addHandler( /\.tga$/i, new TGALoader() );

new MTLLoader(manager).load("assets/Prunus_Pendula.mtl", function (materials) {
  materials.preload();

  new OBJLoader(manager).setMaterials(materials).load(
    "assets/Prunus_Pendula.obj",
    function (object) {
      object.scale.set(3.2, 3.0, 3.2);
      object.position.y = -60;
      object.position.z = -1;
      scene.add(object);
    },
    onProgress,
    onError
  );
});

/*------------------------------
Shaders
------------------------------*/
let grass = new THREE.PlaneBufferGeometry(200, 200);
// let grassMaterial = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide });
let grassMaterial = new THREE.MeshBasicMaterial();
const ground = new THREE.Mesh(grass, grassMaterial);
// grassMaterial.map = colorTexture;
// grassMaterial.displacementMap = heightTexture;
// grassMaterial.normalMap = normalTexture;
// grassMaterial.roughnessMap = roughnessTexture;
// grassMaterial.aoMap = ambientOcclusionTexture;
scene.add(ground);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -80;

/*------------------------------
Sockets
------------------------------*/
const socket = io();
socket.on("connect", () => {
  socket.emit("newConn");
});
socket.on("hereYouGo", (data) => {
  linkData = data;
  console.log(data);
});

/*------------------------------
Lights
------------------------------*/
const light = new THREE.PointLight(0xff0000, 1);
light.position.set(0, 100, 0);
scene.add(light);
const lights = new THREE.AmbientLight(0xffc0cb);
scene.add(lights);
/*------------------------------
Particle
------------------------------*/
const mat = new THREE.PointsMaterial({
  sizeAttenuation: true,
  transparent: true,
  alphaTest: 0.1,
  size: 1.4,
  map: new THREE.TextureLoader().load("assets/4.png"),
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexColors: true,
});

const position = [];
const colors = [];
const size = [];
const count = 250;
const particleSize = 20;
for (let i = 0; i < count; i++) {
  const i3 = i * 3;
  colors[i3] = 255;
  colors[i3 + 1] = 10;
  colors[i3 + 2] = 205;
}
for (let i = 0; i < count * 3; i++) {
  let x = (Math.random() - 0.5) * 200;
  position[i] = x;
  size[i] = particleSize * 0.5;
}
const geo = new THREE.BufferGeometry();
geo.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
geo.setAttribute("size", new THREE.Float32BufferAttribute(size, 1));

console.log(geo);
const p = new THREE.Points(geo, mat);
scene.add(p);

/*------------------------------
Dimensions
------------------------------*/
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.0001,
  10000
);
camera.position.z = 400;
scene.add(camera);

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
/*------------------------------
Raycast
------------------------------*/

function canvasClicker(event) {
  console.log("whye");
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(scene.children, false);
  if (intersects.length > 0) {
    const object = intersects[0].index;
    console.log(counter);
    window.open(linkData[counter].webLink);
    counter++;
    if (counter >= linkData.length) {
      counter = 0;
    }
    animate();
  }
}
/*------------------------------
Post Production 
------------------------------*/
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,
  0.4,
  0.85
);
bloomPass.threshold = 0;
bloomPass.strength = 0.6;
const composer = new EffectComposer(renderer);
afterImagePass = new AfterimagePass();
console.log(afterImagePass);
composer.addPass(afterImagePass);
composer.addPass(renderScene);
composer.addPass(bloomPass);

/*------------------------------
Resize
------------------------------*/
window.addEventListener("resize", () => {
  /*------------------------------
  Update Sizes
  ------------------------------*/
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  /*------------------------------
  Update Camera
  ------------------------------*/
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  /*------------------------------
  Update Renderer
  ------------------------------*/
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  /*------------------------------
  Update Shaders
  ------------------------------*/
  // uniforms.u_resolution.value.x = renderer.domElement.width;
  // uniforms.u_resolution.value.y = renderer.domElement.height;
  /*------------------------------
  Update Post
  ------------------------------*/
  composer.setSize(sizes.width, sizes.height);
  bloomPass.setSize(sizes.width, sizes.height);
});

/*------------------------------
Controls
------------------------------*/
const controls = new OrbitControls(camera, canvas);
// const controls = new DeviceOrientationControls(camera, true);
controls.enableDamping = true;

const cineCamera = () => {
  console.log(camera.position.z);
  camera.position.z -= 0.0001;
};
const clock = new THREE.Clock();
const animate = () => {
  /*------------------------------
  Smooth Animation
  ------------------------------*/
  const elapsedTime = clock.getElapsedTime();
  // uniforms.u_time.value += clock.getDelta();
  /*------------------------------
  Update Controls
  ------------------------------*/
  controls.update();

  /*------------------------------
  Update Meshes
  ------------------------------*/
  p.rotation.y = elapsedTime * 0.06;

  if (camera.position.z > 100) {
    console.log(camera.position.z);
    camera.position.z -= elapsedTime * 0.0059;
  }
  /*------------------------------
  Render
  ------------------------------*/
  composer.render();
  // renderer.render(scene, camera);

  /*------------------------------
  Core
  ------------------------------*/
  window.requestAnimationFrame(animate);
};

// animate();
// cineCamera();
