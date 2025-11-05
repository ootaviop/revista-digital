document.addEventListener('DOMContentLoaded', () => {
  const svg = document.querySelector('.svgContainer');
  if (!svg) {
    console.error('Elemento SVG com a classe .svgContainer não encontrado.');
    return;
  }

  const svgPanZoomFn = (typeof svgPanZoom !== 'undefined') ? svgPanZoom : window.svgPanZoom;
  if (!svgPanZoomFn) {
    console.error('Biblioteca svg-pan-zoom não encontrada.');
    return;
  }

  const panZoomInstance = svgPanZoomFn(svg, {
    panEnabled: true,
    controlIconsEnabled: true,
    zoomEnabled: true,
    fit: false,
    center: true,
    minZoom: 0.8,
    maxZoom: 10,
    dblClickZoomEnabled: false,
    zoomScaleSensitivity: 0.2,
  });

  let animationQueue = [];
  let isAnimating = false;

  function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function lerp(start, end, t) {
    return start + (end - start) * t;
  }

  function animate(duration, onUpdate, onComplete) {
    const startTime = performance.now();
    
    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOutQuad(progress);
      
      onUpdate(easedProgress);
      
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        onComplete();
      }
    }
    
    requestAnimationFrame(step);
  }

  function calculatePan(cx, cy, zoom) {
    const sizes = panZoomInstance.getSizes();
    return {
      x: sizes.width / 2 - cx * zoom,
      y: sizes.height / 2 - cy * zoom
    };
  }

  function executeAnimation(targetElement, targetZoom, padding) {
    const bbox = targetElement.getBBox();
    const sizes = panZoomInstance.getSizes();

    const currentZoom = panZoomInstance.getZoom();
    const currentPan = panZoomInstance.getPan();

    // Centro do elemento
    const cx = bbox.x + bbox.width / 2;
    const cy = bbox.y + bbox.height / 2;

    // Calcula zoom final
    const width = bbox.width + padding;
    const height = bbox.height + padding;
    const scaleX = sizes.width / width;
    const scaleY = sizes.height / height;
    const finalZoom = Math.min(scaleX, scaleY, targetZoom);

    // Zoom intermediário
    const intermediateZoom = Math.min(currentZoom, finalZoom, 1.2);

    // Pan para cada zoom
    const intermediatePan = calculatePan(cx, cy, intermediateZoom);
    const finalPan = calculatePan(cx, cy, finalZoom);

    // Bloqueia interação
    panZoomInstance.disablePan();
    panZoomInstance.disableZoom();

    // Calcula centro atual da viewport em coordenadas SVG
    const currentCenterX = (sizes.width / 2 - currentPan.x) / currentZoom;
    const currentCenterY = (sizes.height / 2 - currentPan.y) / currentZoom;
    
    // Pan para manter centro atual no zoom intermediário
    const keepCenterPan = calculatePan(currentCenterX, currentCenterY, intermediateZoom);

    // Etapa 1: Zoom out mantendo centro atual
    animate(800, 
      (t) => {
        const zoom = lerp(currentZoom, intermediateZoom, t);
        const pan = {
          x: lerp(currentPan.x, keepCenterPan.x, t),
          y: lerp(currentPan.y, keepCenterPan.y, t)
        };
        panZoomInstance.zoom(zoom);
        panZoomInstance.pan(pan);
      },
      () => {
        // Etapa 2: Pan para novo elemento (zoom intermediário constante)
        animate(1000,
          (t) => {
            const pan = {
              x: lerp(keepCenterPan.x, intermediatePan.x, t),
              y: lerp(keepCenterPan.y, intermediatePan.y, t)
            };
            panZoomInstance.pan(pan);
          },
          () => {
            // Etapa 3: Zoom in no novo elemento
            animate(800,
              (t) => {
                const zoom = lerp(intermediateZoom, finalZoom, t);
                const pan = {
                  x: lerp(intermediatePan.x, finalPan.x, t),
                  y: lerp(intermediatePan.y, finalPan.y, t)
                };
                panZoomInstance.zoom(zoom);
                panZoomInstance.pan(pan);
              },
              () => {
                panZoomInstance.enablePan();
                panZoomInstance.enableZoom();
                isAnimating = false;
                processQueue();
              }
            );
          }
        );
      }
    );
  }

  function processQueue() {
    if (animationQueue.length === 0 || isAnimating) return;
    isAnimating = true;
    const next = animationQueue.shift();
    executeAnimation(next.element, next.zoom, next.padding);
  }

  function queueAnimation(element, zoomLevel, padding) {
    animationQueue.push({ element, zoom: zoomLevel, padding });
    processQueue();
  }

  const elements = {
    elem1: { selector: svg.querySelector('.object1'), paddingPercent: 50, zoomLevel: 1.7 },
    elem2: { selector: svg.querySelector('.object2'), paddingPercent: 50, zoomLevel: 1.85 },
    elem3: { selector: svg.querySelector('.object3'), paddingPercent: 15, zoomLevel: 1.7 },
    elem4: { selector: svg.querySelector('.object4'), paddingPercent: 15, zoomLevel: 1.4 },
    elem5: { selector: svg.querySelector('.object5'), paddingPercent: 1, zoomLevel: 1.7 },
    elem6: { selector: svg.querySelector('.object6'), paddingPercent: 15, zoomLevel: 1.7 }
  };

  const containerRevista = document.querySelector('.containerRevista');
  containerRevista.style.position = 'relative';
  
  const btnContainer = document.createElement('div');
  btnContainer.className = 'btnContainer';
  Object.assign(btnContainer.style, {
    position: 'absolute',
    top: '10px',
    right: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  });
  containerRevista.appendChild(btnContainer);

  Object.keys(elements).forEach((key) => {
    const button = document.createElement('button');
    button.textContent = `Zoom para ${key}`;
    button.onclick = () => queueAnimation(
      elements[key].selector,
      elements[key].zoomLevel,
      elements[key].paddingPercent
    );
    btnContainer.appendChild(button);
  });
});