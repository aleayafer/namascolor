// === NamasColor — Screen Picker (one window per monitor) ===

(function() {
  const screenshotCanvas = document.getElementById('screenshot');
  const screenshotCtx = screenshotCanvas.getContext('2d');
  const magnifier = document.getElementById('magnifier');
  const magCanvas = document.getElementById('mag-canvas');
  const magCtx = magCanvas.getContext('2d');
  const colorInfo = document.getElementById('color-info');
  const colorSwatch = colorInfo.querySelector('.swatch');
  const colorText = document.getElementById('color-text');

  const ZOOM = 8;
  const MAG_SIZE = 160;
  const GRID_CELLS = MAG_SIZE / ZOOM; // 20 pixels shown

  let imgData = null;
  let scaleFactor = 1;
  let ready = false;

  // Receive screenshot from main process (one per window)
  if (window.namascolor) {
    window.namascolor.onScreenshotData((data) => {
      const w = data.width;
      const h = data.height;
      scaleFactor = data.scaleFactor;

      screenshotCanvas.width = w;
      screenshotCanvas.height = h;
      screenshotCanvas.style.width = w + 'px';
      screenshotCanvas.style.height = h + 'px';

      const img = new Image();
      img.onload = () => {
        // Draw scaled to logical size for visual background
        screenshotCtx.drawImage(img, 0, 0, w, h);

        // Store native-resolution image data for precise color picking
        const offCanvas = document.createElement('canvas');
        offCanvas.width = img.naturalWidth;
        offCanvas.height = img.naturalHeight;
        const offCtx = offCanvas.getContext('2d');
        offCtx.drawImage(img, 0, 0);
        imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);

        ready = true;
        magnifier.style.display = 'block';
        colorInfo.style.display = 'block';
      };
      img.src = data.dataURL;
    });
  }

  function getPixel(x, y) {
    if (!imgData) return { r: 0, g: 0, b: 0 };
    const px = Math.min(Math.max(Math.round(x * scaleFactor), 0), imgData.width - 1);
    const py = Math.min(Math.max(Math.round(y * scaleFactor), 0), imgData.height - 1);
    const idx = (py * imgData.width + px) * 4;
    return {
      r: imgData.data[idx] || 0,
      g: imgData.data[idx + 1] || 0,
      b: imgData.data[idx + 2] || 0
    };
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
  }

  function drawMagnifier(mouseX, mouseY) {
    const halfCells = Math.floor(GRID_CELLS / 2);
    magCtx.clearRect(0, 0, MAG_SIZE, MAG_SIZE);

    // Draw zoomed pixels
    for (let dy = -halfCells; dy < halfCells; dy++) {
      for (let dx = -halfCells; dx < halfCells; dx++) {
        const px = Math.round(mouseX + dx);
        const py = Math.round(mouseY + dy);
        const pixel = getPixel(px, py);
        magCtx.fillStyle = `rgb(${pixel.r},${pixel.g},${pixel.b})`;
        magCtx.fillRect((dx + halfCells) * ZOOM, (dy + halfCells) * ZOOM, ZOOM, ZOOM);
      }
    }

    // Draw grid lines
    magCtx.strokeStyle = 'rgba(255,255,255,0.1)';
    magCtx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_CELLS; i++) {
      magCtx.beginPath();
      magCtx.moveTo(i * ZOOM, 0);
      magCtx.lineTo(i * ZOOM, MAG_SIZE);
      magCtx.stroke();
      magCtx.beginPath();
      magCtx.moveTo(0, i * ZOOM);
      magCtx.lineTo(MAG_SIZE, i * ZOOM);
      magCtx.stroke();
    }
  }

  document.addEventListener('mousemove', (e) => {
    if (!ready) return;

    const mx = e.clientX;
    const my = e.clientY;

    // Position magnifier offset from cursor
    let magX = mx + 24;
    let magY = my - MAG_SIZE - 16;
    if (magY < 8) magY = my + 24;
    if (magX + MAG_SIZE > window.innerWidth - 8) magX = mx - MAG_SIZE - 24;

    magnifier.style.left = magX + 'px';
    magnifier.style.top = magY + 'px';

    // Color info below magnifier
    colorInfo.style.left = magX + 'px';
    colorInfo.style.top = (magY + MAG_SIZE + 8) + 'px';

    // Get pixel color
    const pixel = getPixel(mx, my);
    const hex = rgbToHex(pixel.r, pixel.g, pixel.b);

    colorSwatch.style.background = hex;
    colorText.textContent = hex.toUpperCase();

    drawMagnifier(mx, my);
  });

  document.addEventListener('click', (e) => {
    if (!ready) return;
    const pixel = getPixel(e.clientX, e.clientY);
    const hex = rgbToHex(pixel.r, pixel.g, pixel.b);
    if (window.namascolor) {
      window.namascolor.sendColorPicked(hex);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (window.namascolor) window.namascolor.sendPickerCancel();
    }
  });
})();
