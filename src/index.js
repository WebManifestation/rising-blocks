import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import TWEEN from "@tweenjs/tween.js";
import Stats from "stats.js";

let container, controls;
let camera, scene, renderer;
let raycaster, mouse;
let listener, analyser, audio;

const cubes = [];
const startBtn = document.getElementById("start-btn");
const debug = document.getElementById("debug");

const stats = new Stats();
stats.domElement.style.right = 0;
stats.domElement.style.left = "initial";
document.body.appendChild(stats.dom);

init();

const fftSize = 1024 * 2;

function addItems() {
  const n = 32;

  for (let x = -n / 2; x < n / 2; x++) {
    for (let z = -n / 2; z < n / 2; z++) {
      // const color = new THREE.Color(`hsla(${(x + n / 2) / n * 360}, ${Math.round((x + n / 2) / n * 100)}%, ${Math.round((x + n / 2) / n * 100)}%, 1)`);
      // const colorZ = new THREE.Color(`hsla(${(z + n / 2) / n * 360}, ${Math.round((z + n / 2) / n * 100)}%, ${Math.round((z + n / 2) / n * 100)}%, 1)`);
      const hue = ((x + n / 2) / n) * 360;
      let satu = 100;
      let lumin = ((z + n / 2) / n) * 100;
      lumin = parseInt(THREE.MathUtils.mapLinear(lumin, 0, 100, 50, 10));
      const color = new THREE.Color(`hsla(${hue}, ${satu}%, ${lumin}%, 1)`);
      // const colorZ = new THREE.Color(`hsla(0, ${parseInt((z + n / 2) / n * 100)}%, 100%, 1)`);
      // color.multiply(colorZ);
      const size = 1;
      const geometry = new THREE.BoxBufferGeometry(size, size, size);
      const material = new THREE.MeshLambertMaterial({ color: color });
      const cube = new THREE.Mesh(geometry, material);
      geometry.applyMatrix4(
        new THREE.Matrix4().makeTranslation(0, size / 2, 0)
      );
      cube.position.set(x + size / 2, 0, z + size / 2);
      cube.scale.y = 0.1;
      cube.castShadow = true;
      cube.receiveShadow = true;

      const animDuration = Math.random() * 100 + 200;

      const cubeTweenOut = new TWEEN.Tween(cube.position)
        .to({ y: 0 }, animDuration)
        .easing(TWEEN.Easing.Bounce.Out);

      const cubeTweenIn = new TWEEN.Tween(cube.position)
        .to({ y: Math.random() }, animDuration)
        .easing(TWEEN.Easing.Bounce.Out)
        .onComplete(() => {
          cubeTweenOut.start();
        });

      cube.tweenIn = cubeTweenIn;
      cube.tweenOut = cubeTweenOut;
      cubes.push(cube);
      scene.add(cube);
    }
  }
}

function addLights() {
  const shadowSize = 4;

  const ambient = new THREE.AmbientLight(0xffffff, 0.05);
  scene.add(ambient);

  const topRight = new THREE.DirectionalLight(0xffffff, 0.5);
  topRight.position.set(4, 4, 4);
  topRight.castShadow = true;
  topRight.shadow.camera.top = shadowSize;
  topRight.shadow.camera.bottom = -shadowSize;
  topRight.shadow.camera.left = -shadowSize;
  topRight.shadow.camera.right = shadowSize;
  const topRightHelper = new THREE.DirectionalLightHelper(topRight, 1);
  scene.add(topRight);
  // scene.add(topRightHelper);

  const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
  backLight.position.set(0, 2, -6);
  backLight.castShadow = true;
  backLight.shadow.camera.top = shadowSize;
  backLight.shadow.camera.bottom = -shadowSize;
  backLight.shadow.camera.left = -shadowSize;
  backLight.shadow.camera.right = shadowSize;
  const backLightHelper = new THREE.DirectionalLightHelper(backLight, 1);
  scene.add(backLight);
  // scene.add(backLightHelper);
}

function onMouseMove(event) {
  const x = event.touches ? event.touches[0].clientX : event.clientX;
  const y = event.touches ? event.touches[0].clientY : event.clientY;

  mouse.x = (x / window.innerWidth) * 2 - 1;
  mouse.y = -(y / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // calculate objects intersecting the picking ray
  var intersects = raycaster.intersectObjects(scene.children);

  // intersects[ i ].object.material.color.set( 0xff0000 );
  if (intersects.length) {
    const obj = intersects[0].object;
    if (obj.tweenIn && !obj.tweenIn.isPlaying() && !obj.tweenOut.isPlaying()) {
      obj.tweenIn.start();
    }
  }

  renderer.render(scene, camera);
}

function init() {
  container = document.createElement("div");
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.25,
    1000
  );

  scene = new THREE.Scene();
  // scene.fog = new THREE.Fog(0x000000, 10, 30);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  // renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
  renderer.outputEncoding = THREE.sRGBEncoding;

  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  // controls.addEventListener('change', render);
  camera.position.set(41, 22, 0);
  // controls.enabled = false;
  // controls.autoRotate = true;
  // controls.minDistance = 2;
  // controls.maxDistance = 10
  // controls.target.set(0, 0, 4);
  controls.update();

  addLights();
  addItems();
  // addAudioListener();

  window.addEventListener("resize", onWindowResize, false);
  // window.addEventListener('mousemove', onMouseMove, false);
  // window.addEventListener('touchmove', onMouseMove, false);
  startBtn.addEventListener("click", addAudioListener);
  animate();
}

function addAudioListener() {
  listener = new THREE.AudioListener();
  listener.gain.disconnect();
  camera.add(listener);
  navigator.mediaDevices
    .getUserMedia({ audio: true, video: false })
    .then(handleSuccess);
}

function handleSuccess(stream) {
  audio = new THREE.Audio(listener);
  startBtn.style.opacity = 0;
  startBtn.style.pointerEvents = "none";
  var context = listener.context;
  var source = context.createMediaStreamSource(stream);
  audio.setNodeSource(source);

  // audio.setVolume(0);

  analyser = new THREE.AudioAnalyser(audio, fftSize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  stats.begin();

  if (analyser) {
    const fqData = analyser.getFrequencyData();
    // console.log(fqData);
    debug.innerHTML = fqData.length + ", " + cubes.length;
    for (let i = 0; i < fqData.length; i++) {
      cubes[i].scale.y = (fqData[i] / 255) * 8 + 0.1;
    }
  }
  TWEEN.update();
  controls.update();
  renderer.render(scene, camera);
  stats.end();
  requestAnimationFrame(animate);
}
