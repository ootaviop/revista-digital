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

function getViewBoxForElement(svg, element, paddingPercent = 10) {
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
  const elem2 = svg.querySelector('.object2');
  const elem3 = svg.querySelector('.object3');

  // Começa zoom no elemento 2
  const startViewBox = getViewBoxForElement(svg, elem2);
  svg.setAttribute('viewBox', startViewBox.join(' '));

  // Botão para ir ao elemento 3 com animação
  const btn = document.createElement('button');
  btn.textContent = 'Zoom para objeto 3';
  document.body.appendChild(btn);

  btn.addEventListener('click', () => {
    const endViewBox = getViewBoxForElement(svg, elem3);
    animateViewBox(svg, startViewBox, endViewBox, 1200);
  });
});
