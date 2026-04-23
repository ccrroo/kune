const elements = document.querySelectorAll('.kunekune-text');

elements.forEach(el => {
    const htmlContent = el.innerHTML;
    el.innerHTML = '';
    let delay = 0;
    const parts = htmlContent.split(/(<br\s*\/?>)/i);

    // この要素がメインタイトルかどうかを判定
    const isInteractive = el.id === 'main-title';
    const physicsNodes = []; // 物理演算で動かす文字のリスト

    parts.forEach(part => {
        if (/<br\s*\/?>/i.test(part)) {
            el.appendChild(document.createElement('br'));
        } else {
            for (let i = 0; i < part.length; i++) {
                let char = part[i];

                if (char === ' ' || char === '　') {
                    el.appendChild(document.createTextNode(char));
                    continue;
                }

                // JSで物理演算を行うための「外箱」
                let wrapper = document.createElement('span');
                wrapper.style.display = 'inline-block';

                // CSSでくねくねアニメーションをする「中身」
                let span = document.createElement('span');
                span.textContent = char;
                span.className = 'kune-char';
                span.style.animationDelay = delay + 's';

                wrapper.appendChild(span);
                el.appendChild(wrapper);

                // インタラクティブにする場合のみ配列に追加
                if (isInteractive) {
                    wrapper.style.cursor = 'grab';
                    physicsNodes.push(wrapper);
                }

                delay += 0.05;
            }
        }
    });

    // メインタイトルなら物理演算をセットアップ
    if (isInteractive && physicsNodes.length > 0) {
        setupPhysics(physicsNodes, el);
    }
});

// 物理演算エンジン（バネの動き）
function setupPhysics(nodes, container) {
    // 各文字の状態（位置 x, y と 速度 vx, vy）
    let state = nodes.map(() => ({ x: 0, y: 0, vx: 0, vy: 0 }));
    let draggedIndex = -1;
    let mouseX = 0,
        mouseY = 0;
    let startMouseX = 0,
        startMouseY = 0;

    // 【調整ポイント】ここの数値をいじると「ぷるぷる感」が変わります
    const k = 0.05; // 元の位置に戻ろうとする力
    const linkK = 0.2; // 隣の文字を引っ張る力
    const friction = 0.85; // 摩擦（数字が小さいほどすぐ止まる）

    // マウス/指を押した時
    const onDown = (e, index) => {
        draggedIndex = index;
        let clientX = e.clientX || (e.touches && e.touches[0].clientX);
        let clientY = e.clientY || (e.touches && e.touches[0].clientY);

        startMouseX = clientX - state[index].x;
        startMouseY = clientY - state[index].y;

        nodes.forEach(n => n.style.cursor = 'grabbing');
    };

    // マウス/指を動かした時
    const onMove = (e) => {
        if (draggedIndex === -1) return;
        if (e.cancelable) e.preventDefault(); // ドラッグ中のスクロールを止める

        let clientX = e.clientX || (e.touches && e.touches[0].clientX);
        let clientY = e.clientY || (e.touches && e.touches[0].clientY);

        mouseX = clientX - startMouseX;
        mouseY = clientY - startMouseY;
    };

    // マウス/指を離した時
    const onUp = () => {
        draggedIndex = -1;
        nodes.forEach(n => n.style.cursor = 'grab');
    };

    // イベントリスナーの登録
    nodes.forEach((node, i) => {
        node.addEventListener('mousedown', (e) => onDown(e, i));
        node.addEventListener('touchstart', (e) => onDown(e, i), { passive: false });
    });

    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);

    // アニメーションループ（毎フレーム計算する）
    function update() {
        for (let i = 0; i < nodes.length; i++) {
            if (i === draggedIndex) {
                // 掴まれている文字はマウスの動きに直接ついてくる
                state[i].x = mouseX;
                state[i].y = mouseY;
                state[i].vx = 0;
                state[i].vy = 0;
            } else {
                // バネの計算：元の位置に戻る力
                let fx = -state[i].x * k;
                let fy = -state[i].y * k;

                // 隣の文字との繋がり（引っ張られる力）
                if (i > 0) {
                    fx += (state[i - 1].x - state[i].x) * linkK;
                    fy += (state[i - 1].y - state[i].y) * linkK;
                }
                if (i < nodes.length - 1) {
                    fx += (state[i + 1].x - state[i].x) * linkK;
                    fy += (state[i + 1].y - state[i].y) * linkK;
                }

                // 速度に力を足して、摩擦をかける
                state[i].vx += fx;
                state[i].vy += fy;
                state[i].vx *= friction;
                state[i].vy *= friction;

                // 最終的な位置の更新
                state[i].x += state[i].vx;
                state[i].y += state[i].vy;
            }

            // HTML要素に位置を適用（CSSのくねくねとは別枠で動く）
            nodes[i].style.transform = `translate(${state[i].x}px, ${state[i].y}px)`;
        }
        requestAnimationFrame(update);
    }
    update();
}