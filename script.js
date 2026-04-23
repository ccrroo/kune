const elements = document.querySelectorAll('.kunekune-text');

elements.forEach(el => {
    const htmlContent = el.innerHTML;
    el.innerHTML = '';
    let delay = 0;
    const parts = htmlContent.split(/(<br\s*\/?>)/i);

    
    const isInteractive = el.id === 'main-title';
    const physicsNodes = []; 

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

                
                let wrapper = document.createElement('span');
                wrapper.style.display = 'inline-block';

                let span = document.createElement('span');
                span.textContent = char;
                span.className = 'kune-char';
                span.style.animationDelay = delay + 's';

                wrapper.appendChild(span);
                el.appendChild(wrapper);

                if (isInteractive) {
                    wrapper.style.cursor = 'grab';
                    physicsNodes.push(wrapper);
                }

                delay += 0.05;
            }
        }
    });

    if (isInteractive && physicsNodes.length > 0) {
        setupPhysics(physicsNodes, el);
    }
});

function setupPhysics(nodes, container) {
    let state = nodes.map(() => ({ x: 0, y: 0, vx: 0, vy: 0 }));
    let draggedIndex = -1;
    let mouseX = 0,
        mouseY = 0;
    let startMouseX = 0,
        startMouseY = 0;

    const k = 0.05; 
    const linkK = 0.2; 
    const friction = 0.85; 

    
    const onDown = (e, index) => {
        draggedIndex = index;
        let clientX = e.clientX || (e.touches && e.touches[0].clientX);
        let clientY = e.clientY || (e.touches && e.touches[0].clientY);

        startMouseX = clientX - state[index].x;
        startMouseY = clientY - state[index].y;

        nodes.forEach(n => n.style.cursor = 'grabbing');
    };

    
    const onMove = (e) => {
        if (draggedIndex === -1) return;
        if (e.cancelable) e.preventDefault(); 

        let clientX = e.clientX || (e.touches && e.touches[0].clientX);
        let clientY = e.clientY || (e.touches && e.touches[0].clientY);

        mouseX = clientX - startMouseX;
        mouseY = clientY - startMouseY;
    };

    
    const onUp = () => {
        draggedIndex = -1;
        nodes.forEach(n => n.style.cursor = 'grab');
    };


    nodes.forEach((node, i) => {
        node.addEventListener('mousedown', (e) => onDown(e, i));
        node.addEventListener('touchstart', (e) => onDown(e, i), { passive: false });
    });

    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);

    function update() {
        for (let i = 0; i < nodes.length; i++) {
            if (i === draggedIndex) {
                state[i].x = mouseX;
                state[i].y = mouseY;
                state[i].vx = 0;
                state[i].vy = 0;
            } else {
                let fx = -state[i].x * k;
                let fy = -state[i].y * k;

                if (i > 0) {
                    fx += (state[i - 1].x - state[i].x) * linkK;
                    fy += (state[i - 1].y - state[i].y) * linkK;
                }
                if (i < nodes.length - 1) {
                    fx += (state[i + 1].x - state[i].x) * linkK;
                    fy += (state[i + 1].y - state[i].y) * linkK;
                }

                state[i].vx += fx;
                state[i].vy += fy;
                state[i].vx *= friction;
                state[i].vy *= friction;

                state[i].x += state[i].vx;
                state[i].y += state[i].vy;
            }

            nodes[i].style.transform = `translate(${state[i].x}px, ${state[i].y}px)`;
        }
        requestAnimationFrame(update);
    }
    update();
}
