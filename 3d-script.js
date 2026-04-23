import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- HTML要素の取得 ---
const enterBtn = document.getElementById('enter-3d-btn');
const exitBtn = document.getElementById('exit-3d-btn');
const container = document.getElementById('webgl-container');

// --- 3Dシーンの初期設定 ---
const scene = new THREE.Scene();
scene.background = new THREE.Color('#a0d8ef'); // 全体を水色に

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 8;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// --- 「くねくね」の文字画像を作成する関数 ---
function createTextTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // 背景を透明に
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 文字の描画
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

// --- 3Dオブジェクト（板）を複数配置 ---
// 細かく分割された板（PlaneGeometry）を用意し、後で頂点を動かしてくねくねさせます
const geometry = new THREE.PlaneGeometry(8, 2, 64, 16);

for (let i = 0; i < 15; i++) {
    const material = new THREE.MeshBasicMaterial({
        map: textTexture,
        transparent: true,
        side: THREE.DoubleSide,
        color: new THREE.Color().setHSL(Math.random(), 1.0, 0.5) // カラフルな色
    });

    const plane = new THREE.Mesh(geometry, material);

    // ランダムな位置と角度に配置
    plane.position.set((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 20);
    plane.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

    // 各オブジェクトのくねくねパラメータ
    plane.userData = {
        hueOffset: Math.random(), // 色の移り変わり用
        wiggleSpeed: Math.random() * 2 + 1, // 基本のくねくねスピード
        wiggleIntensity: 0.5, // くねくねの激しさ（触ると増える）
        time: 0
    };

    scene.add(plane);
    planes.push(plane);
}

// --- マウスで視点移動（回転・ズーム）できるようにする ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = true; // ゆっくり自動回転させる
controls.autoRotateSpeed = 1.0;

// --- アニメーションループ ---
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

        // カラフルに色を移り変わらせる
        data.hueOffset += delta * 0.2;
        plane.material.color.setHSL(data.hueOffset % 1, 1.0, 0.6);

        // 触った後の激しいくねくねを徐々に元に戻す
        data.wiggleIntensity += (0.5 - data.wiggleIntensity) * 0.05;

        // 板の頂点データをいじって波打たせる（物理的なくねくね）
        const positionAttribute = plane.geometry.attributes.position;
        for (let i = 0; i < positionAttribute.count; i++) {
            const x = positionAttribute.getX(i);
            const y = positionAttribute.getY(i);
            // サイン波を使って波を作ります
            const z = Math.sin(x * 2 + data.time) * data.wiggleIntensity + Math.cos(y * 3 + data.time) * (data.wiggleIntensity * 0.5);
            positionAttribute.setZ(i, z);
        }
        plane.geometry.computeVertexNormals();
        plane.geometry.attributes.position.needsUpdate = true;
    });

    renderer.render(scene, camera);
}

// --- クリック/タッチした時の処理（よりくねくねする） ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onInteract(event) {
    if (!isAnimating) return;

    // スマホのタップとマウスのクリック両方に対応
    let clientX = event.clientX || (event.touches && event.touches[0].clientX);
    let clientY = event.clientY || (event.touches && event.touches[0].clientY);

    if (clientX === undefined) return;

    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planes);

    if (intersects.length > 0) {
        // 触ったオブジェクトのくねくねの激しさを跳ね上げる
        intersects[0].object.userData.wiggleIntensity = 3.0;
        intersects[0].object.userData.wiggleSpeed += 2.0;
    }
}

window.addEventListener('mousedown', onInteract);
window.addEventListener('touchstart', onInteract, { passive: false });

// --- ウィンドウサイズ変更時の対応 ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- ボタンのイベント設定 ---
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