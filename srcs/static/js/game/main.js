import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
// import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export {THREE, OrbitControls, /*OBJLoader, MTLLoader,*/ GLTFLoader};
window.THREE = THREE;  
window.OrbitControls = OrbitControls;
window.GLTFLoader = GLTFLoader;
