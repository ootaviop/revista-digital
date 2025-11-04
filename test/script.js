function interpolate(start, end, t) {
  return start + (end - start) * t;
}

function animateViewBox(svg, startViewBox, endViewBox, duration = 1000) {
  let startTime;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    let progress = (timestamp - startTime) / duration;
    if (progress > 1) progress = 1;

    const currentViewBox = startViewBox.map((startVal, i) =>
      interpolate(startVal, endViewBox[i], progress)
    );

    svg.setAttribute('viewBox', currentViewBox.join(' '));

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

function getViewBoxForElement(svg, element, paddingPercent = 15) {
  const bbox = element.getBBox();
  const padX = (bbox.width * paddingPercent) / 100;
  const padY = (bbox.height * paddingPercent) / 100;
  const x = bbox.x - padX;
  const y = bbox.y - padY;
  const width = bbox.width + 2 * padX;
  const height = bbox.height + 2 * padY;
  return [x, y, width, height];
}

// Uso exemplo:
document.addEventListener('DOMContentLoaded', () => {
  const svg = document.querySelector('.svgContainer');
  const elements = {
    elem1: svg.querySelector('.object1'),
    elem2: svg.querySelector('.object2'),
    elem3: svg.querySelector('.object3'),
    elem4: svg.querySelector('.object4'),
    elem5: svg.querySelector('.object5'),
    elem6: svg.querySelector('.object6'),
  };

  // Cria um botão para cada elemento, que quando for clicado, faz o zoom no elemento correspondente
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
  let startViewBox = [0, 0, svg.clientWidth, svg.clientHeight];
  svg.setAttribute('viewBox', startViewBox.join(' '));
  Object.keys(elements).forEach((key) => {
    const button = document.createElement('button');
    button.textContent = `Zoom para ${key}`;
    //redefine a startViwebox para que a animação sempre inicie da vista atual
    button.addEventListener('click', () => {
      const currentViewBox = svg.getAttribute('viewBox').split(' ').map(Number);
      startViewBox = currentViewBox;
    });

  
    button.addEventListener('click', () => {
      const endViewBox = getViewBoxForElement(svg, elements[key].selector, elements[key].paddingPercent);
      animateViewBox(svg, startViewBox, endViewBox, 1700);
    });
    btnContainer.appendChild(button);
  });
  


  // Começa zoom no elemento 2
  // const startViewBox = getViewBoxForElement(svg, elem2);
  // svg.setAttribute('viewBox', startViewBox.join(' '));

  // Botão para ir ao elemento 3 com animação
  // const containerRevista = document.querySelector('.containerRevista');
  // containerRevista.style.position = 'relative';
  // const btn = document.createElement('button');
  // btn.textContent = 'Zoom para objeto 3';
  // btn.style.position = 'absolute';
  // btn.style.top = '10px';
  // btn.style.right = '10px';
  // containerRevista.appendChild(btn);

  // btn.addEventListener('click', () => {
  //   const endViewBox = getViewBoxForElement(svg, elem3);
  //   animateViewBox(svg, startViewBox, endViewBox, 1200);
  // });
});
