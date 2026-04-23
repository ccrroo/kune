import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

-
const enterBtn = document.getElementById('enter-3d-btn');
const exitBtn = document.getElementById('exit-3d-btn');
const container = document.getElementById('webgl-container');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#a0d8ef'); 

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 8;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);


function createTextTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
 
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 150px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('くねくね', canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

const textTexture = createTextTexture();
const planes = [];

const geometry = new THREE.PlaneGeometry(8, 2, 64, 16);

for (let i = 0; i < 15; i++) {
    const material = new THREE.MeshBasicMaterial({
        map: textTexture,
        transparent: true,
        side: THREE.DoubleSide,
        color: new THREE.Color().setHSL(Math.random(), 1.0, 0.5) 
    });

    const plane = new THREE.Mesh(geometry, material);

    plane.position.set((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 20);
    plane.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

    plane.userData = {
        hueOffset: Math.random(), 
        wiggleSpeed: Math.random() * 2 + 1,
        wiggleIntensity: 0.5, 
        time: 0
    };

    scene.add(plane);
    planes.push(plane);
}

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = true; 
controls.autoRotateSpeed = 1.0;

const clock = new THREE.Clock();
let isAnimating = false;

function animate() {
    if (!isAnimating) return;
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    controls.update();

    planes.forEach(plane => {
        const data = plane.userData;
        data.time += delta * data.wiggleSpeed;

        
        data.hueOffset += delta * 0.2;
        plane.material.color.setHSL(data.hueOffset % 1, 1.0, 0.6);

        
        data.wiggleIntensity += (0.5 - data.wiggleIntensity) * 0.05;

        
        const positionAttribute = plane.geometry.attributes.position;
        for (let i = 0; i < positionAttribute.count; i++) {
            const x = positionAttribute.getX(i);
            const y = positionAttribute.getY(i);
            
            const z = Math.sin(x * 2 + data.time) * data.wiggleIntensity + Math.cos(y * 3 + data.time) * (data.wiggleIntensity * 0.5);
            positionAttribute.setZ(i, z);
        }
        plane.geometry.computeVertexNormals();
        plane.geometry.attributes.position.needsUpdate = true;
    });

    renderer.render(scene, camera);
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onInteract(event) {
    if (!isAnimating) return;

    
    let clientX = event.clientX || (event.touches && event.touches[0].clientX);
    let clientY = event.clientY || (event.touches && event.touches[0].clientY);

    if (clientX === undefined) return;

    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planes);

    if (intersects.length > 0) {
        
        intersects[0].object.userData.wiggleIntensity = 3.0;
        intersects[0].object.userData.wiggleSpeed += 2.0;
    }
}

window.addEventListener('mousedown', onInteract);
window.addEventListener('touchstart', onInteract, { passive: false });


window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


enterBtn.addEventListener('click', () => {
    container.appendChild(renderer.domElement);
    container.style.display = 'block';
    isAnimating = true;
    clock.start();
    animate();
});

exitBtn.addEventListener('click', () => {
    container.style.display = 'none';
    isAnimating = false;
});
