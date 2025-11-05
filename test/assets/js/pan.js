document.addEventListener('DOMContentLoaded', () => {
  const svg = document.querySelector('.svgContainer');
  if (!svg) {
    console.error('Elemento SVG com a classe .svgContainer não encontrado.');
    return;
  }

  const svgPanZoomFn = (typeof svgPanZoom !== 'undefined') ? svgPanZoom : window.svgPanZoom;
  if (!svgPanZoomFn) {
    console.error('Biblioteca svg-pan-zoom não encontrada. Verifique se o script CDN foi incluído antes de pan.js');
    return;
  }

  const panZoomInstance = svgPanZoomFn(svg, {
    panEnabled: true,
    controlIconsEnabled: true,
    // Ative o zoom se quiser suporte a zoom; se preferir apenas pan, coloque false
    zoomEnabled: false,
    fit: false,
    center: true,
    minZoom: 0.8,
    maxZoom: 10,
    dblClickZoomEnabled: false,
    zoomScaleSensitivity: 0.2,
  });

// Função para focar em elemento específico
function focusElementPanZoom(panZoomInstance, element, zoomLevel = 2, padding = 20) {
  const bbox = element.getBBox();
  const svg = element.ownerSVGElement;

  // Centro do elemento no espaço SVG interno
  const cx = bbox.x + bbox.width / 2;
  const cy = bbox.y + bbox.height / 2;

  // Ajustando largura e altura com padding no sistema SVG interno
  const width = bbox.width + padding;
  const height = bbox.height + padding;

  // Obtem o tamanho visível do viewport do SVG e zoom atual
  const sizes = panZoomInstance.getSizes();

  // Calcula escala para o zoom desejado e limites do viewport
  const scaleX = sizes.width / width;
  const scaleY = sizes.height / height;
  const scale = Math.min(scaleX, scaleY, zoomLevel);

  // Aplica zoom
  panZoomInstance.zoom(scale);

  // Calcula o pan para centralizar o conteúdo (em pixels)
  const panX = sizes.width / 2 - cx * scale;
  const panY = sizes.height / 2 - cy * scale;

  panZoomInstance.pan({ x: panX, y: panY });
}


 const elements = {
    elem1: {
        selector: svg.querySelector('.object1'),
        paddingPercent: 50,
        zoomLevel: 1.7
    },
    elem2: {
        selector: svg.querySelector('.object2'),
        paddingPercent: 50,
        zoomLevel: 1.7
    },
    elem3: {
        selector: svg.querySelector('.object3'),
        paddingPercent: 15,
        zoomLevel: 1.7
    },
    elem4: {
        selector: svg.querySelector('.object4'),
        paddingPercent: 15,
        zoomLevel: 1.4
    },
    elem5: {
        selector: svg.querySelector('.object5'),
        paddingPercent: 1,
        zoomLevel: 1.7
    },
    elem6: {
        selector: svg.querySelector('.object6'),
        paddingPercent: 15,
        zoomLevel: 1.7
    }
  };
    const containerRevista = document.querySelector('.containerRevista');
    containerRevista.style.position = 'relative';
    const btnContainer = document.createElement('div');
    btnContainer.className = 'btnContainer';
    btnContainer.style.position = 'absolute';
    btnContainer.style.top = '10px';
    btnContainer.style.right = '10px';
    btnContainer.style.display = 'flex';
    btnContainer.style.flexDirection = 'column';
    btnContainer.style.gap = '5px';
    containerRevista.appendChild(btnContainer);
    Object.keys(elements).forEach((key) => {
        const button = document.createElement('button');
        button.textContent = `Zoom para ${key}`;
        button.addEventListener('click', () => {
            focusElementPanZoom(panZoomInstance, elements[key].selector, elements[key].zoomLevel, elements[key].paddingPercent);
        });
        btnContainer.appendChild(button);
    });
});