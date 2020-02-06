import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import TWEEN from '@tweenjs/tween.js';
import Stats from 'stats.js';

let container, controls;
let camera, scene, renderer;

const stats = new Stats();
stats.domElement.style.right = 0;
stats.domElement.style.left = 'initial';
document.body.appendChild(stats.dom);

init();

function addItems() {

  const n = 8;

  for (let x = - n / 2; x < n / 2; x++) {
    for (let z = - n / 2; z < n / 2; z++) {
      const size = 1;
      const geometry = new THREE.BoxBufferGeometry(size, size, size);
      const material = new THREE.MeshPhongMaterial({ color: 0xffffff });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(x + size / 2, 0, z + size / 2);
      cube.castShadow = true;
      cube.receiveShadow = true;

      const cubeTween = new TWEEN.Tween(cube.position)
        .to({ y: Math.random() }, (Math.random() * 3000) + 1000)
        .easing(TWEEN.Easing.Bounce.Out)
        .yoyo({})
        .repeat(Infinity)
        .start();


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
  scene.add(topRightHelper);

  const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
  backLight.position.set(0, 2, -6);
  backLight.castShadow = true;
  backLight.shadow.camera.top = shadowSize;
  backLight.shadow.camera.bottom = -shadowSize;
  backLight.shadow.camera.left = -shadowSize;
  backLight.shadow.camera.right = shadowSize;
  const backLightHelper = new THREE.DirectionalLightHelper(backLight, 1);
  scene.add(backLight);
  scene.add(backLightHelper);
}

function init() {
  container = document.createElement('div');
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 100);

  scene = new THREE.Scene();
  // scene.fog = new THREE.Fog(0x000000, 10, 20);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
  renderer.outputEncoding = THREE.sRGBEncoding

  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  // controls.addEventListener('change', render);
  camera.position.set(0, 8, 16);
  controls.enabled = false;
  controls.autoRotate = true;
  // controls.minDistance = 2;
  // controls.maxDistance = 10
  // controls.target.set(0, 0, 4);
  controls.update();

  addLights();
  addItems();

  window.addEventListener('resize', onWindowResize, false);
  // render();
  animate();
}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  // render();
}

function animate() {
  // console.log(camera.position);
  stats.begin();
  TWEEN.update();
  controls.update();
  renderer.render(scene, camera);
  stats.end();
  requestAnimationFrame(animate);
}