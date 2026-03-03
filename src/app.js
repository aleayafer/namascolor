// === NamasColor — App Controller ===

(function() {
  // --- State ---
  let currentColor = '#E8443A';
  let history = JSON.parse(localStorage.getItem('namascolor-history') || '[]');
  let activeHarmony = 'complementary';

  // --- DOM Refs ---
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const colorPreview = $('#color-preview');
  const inputHex = $('#input-hex');
  const valRgb = $('#val-rgb');
  const valHsl = $('#val-hsl');
  const harmonySwatches = $('#harmony-swatches');
  const gradBar = $('#gradient-bar');
  const gradSwatches = $('#gradient-swatches');
  const gradSteps = $('#grad-steps');
  const gradStepsVal = $('#grad-steps-val');
  const gradHex1 = $('#grad-hex1');
  const gradHex2 = $('#grad-hex2');
  const gradColor1 = $('#grad-color1');
  const gradColor2 = $('#grad-color2');
  const contrastFg = $('#contrast-fg');
  const contrastBg = $('#contrast-bg');
  const contrastFgSwatch = $('#contrast-fg-swatch');
  const contrastBgSwatch = $('#contrast-bg-swatch');
  const contrastRatio = $('#contrast-ratio');
  const contrastPreview = $('#contrast-preview');
  const paletteList = $('#palette-list');
  const historyList = $('#history-list');

  // --- Init ---
  function init() {
    updateColorDisplay(currentColor);
    renderHarmonies();
    renderGradient();
    updateContrast();
    renderPalettes();
    renderHistory();
    bindEvents();
  }

  // --- Color Display ---
  function setColor(hex, addToHistory = true) {
    if (!ColorUtils.isValidHex(hex)) return;
    hex = ColorUtils.normalizeHex(hex);
    currentColor = hex;
    updateColorDisplay(hex);
    renderHarmonies();

    // Update gradient start color
    gradHex1.value = hex;
    gradColor1.style.background = hex;
    renderGradient();

    // Update contrast foreground
    contrastFg.value = hex;
    contrastFgSwatch.style.background = hex;
    updateContrast();

    if (addToHistory) addHistory(hex);
  }

  function updateColorDisplay(hex) {
    colorPreview.style.background = hex;
    inputHex.value = hex;
    const rgb = ColorUtils.hexToRgb(hex);
    const hsl = ColorUtils.hexToHsl(hex);
    valRgb.textContent = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
    valHsl.textContent = `${hsl.h}\u00B0, ${hsl.s}%, ${hsl.l}%`;
  }

  // --- Harmonies ---
  function renderHarmonies() {
    let colors;
    switch (activeHarmony) {
      case 'complementary': colors = ColorUtils.complementary(currentColor); break;
      case 'analogous': colors = ColorUtils.analogous(currentColor); break;
      case 'triadic': colors = ColorUtils.triadic(currentColor); break;
      case 'split': colors = ColorUtils.splitComplementary(currentColor); break;
    }
    harmonySwatches.innerHTML = colors.map(c =>
      `<div class="swatch" style="background:${c}" data-color="${c}">
        <span class="swatch-label">${c}</span>
      </div>`
    ).join('');
  }

  // --- Gradient ---
  function renderGradient() {
    const hex1 = ColorUtils.normalizeHex(gradHex1.value || '#E8443A');
    const hex2 = ColorUtils.normalizeHex(gradHex2.value || '#4A90D9');
    const steps = parseInt(gradSteps.value);
    gradStepsVal.textContent = `${steps} pasos`;

    gradBar.style.background = `linear-gradient(to right, ${hex1}, ${hex2})`;

    const colors = ColorUtils.generateGradient(hex1, hex2, steps);
    gradSwatches.innerHTML = colors.map(c =>
      `<div class="swatch" style="background:${c}" data-color="${c}">
        <span class="swatch-label">${c}</span>
      </div>`
    ).join('');
  }

  // --- Contrast ---
  function updateContrast() {
    const fg = ColorUtils.normalizeHex(contrastFg.value || '#FFFFFF');
    const bg = ColorUtils.normalizeHex(contrastBg.value || '#1a1a2e');

    contrastFgSwatch.style.background = fg;
    contrastBgSwatch.style.background = bg;

    const result = Contrast.wcagResults(fg, bg);
    contrastRatio.textContent = `${result.ratio}:1`;

    const setBadge = (id, pass) => {
      const el = $(`#${id}`);
      el.className = `badge ${pass ? 'pass' : 'fail'}`;
    };
    setBadge('badge-aa', result.aa);
    setBadge('badge-aa-large', result.aaLarge);
    setBadge('badge-aaa', result.aaa);
    setBadge('badge-aaa-large', result.aaaLarge);

    contrastPreview.style.background = bg;
    contrastPreview.style.color = fg;
  }

  // --- Palettes ---
  function renderPalettes() {
    paletteList.innerHTML = Palettes.map((p, idx) =>
      `<div class="palette-item">
        <span class="palette-name" data-palette="${idx}">${p.name}</span>
        <div class="palette-swatches">
          ${p.colors.map(c => `<div class="palette-swatch" style="background:${c}" data-color="${c}"></div>`).join('')}
        </div>
      </div>`
    ).join('');
  }

  // --- History ---
  function addHistory(hex) {
    // Remove duplicate
    history = history.filter(h => h !== hex);
    history.unshift(hex);
    if (history.length > 30) history = history.slice(0, 30);
    localStorage.setItem('namascolor-history', JSON.stringify(history));
    renderHistory();
  }

  function renderHistory() {
    historyList.innerHTML = history.map(c =>
      `<div class="history-item" data-color="${c}">
        <div class="history-swatch" style="background:${c}"></div>
        <span class="history-hex">${c}</span>
      </div>`
    ).join('');
  }

  // --- Clipboard ---
  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
  }

  // --- Events ---
  function bindEvents() {
    // Pick color from screen
    $('#btn-pick').addEventListener('click', () => {
      if (window.namascolor) window.namascolor.openPicker();
    });

    // Color from picker
    if (window.namascolor) {
      window.namascolor.onColorPicked((hex) => setColor(hex));
    }

    // Hex input
    inputHex.addEventListener('change', () => setColor(inputHex.value));
    inputHex.addEventListener('keydown', (e) => { if (e.key === 'Enter') setColor(inputHex.value); });

    // Copy buttons
    $$('.btn-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.copy;
        let text;
        if (type === 'hex') text = currentColor;
        else if (type === 'rgb') text = valRgb.textContent;
        else if (type === 'hsl') text = valHsl.textContent;
        copyToClipboard(text);
        btn.classList.add('copied');
        setTimeout(() => btn.classList.remove('copied'), 800);
      });
    });

    // Harmony tabs
    $$('.tab[data-harmony]').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('.tab[data-harmony]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeHarmony = tab.dataset.harmony;
        renderHarmonies();
      });
    });

    // Click on any swatch to select color
    document.addEventListener('click', (e) => {
      const swatch = e.target.closest('[data-color]');
      if (swatch) setColor(swatch.dataset.color);
    });

    // Palette name click -> export as theme
    document.addEventListener('click', (e) => {
      const palName = e.target.closest('.palette-name');
      if (palName) {
        const idx = parseInt(palName.dataset.palette);
        const palette = Palettes[idx];
        const json = ThemeExport.generateThemeFromPalette(palette);
        if (window.namascolor) {
          window.namascolor.saveTheme(json);
        }
      }
    });

    // Gradient color pickers
    gradColor1.addEventListener('click', () => {
      const picker = document.createElement('input');
      picker.type = 'color';
      picker.value = gradHex1.value;
      picker.addEventListener('input', () => {
        gradHex1.value = picker.value;
        gradColor1.style.background = picker.value;
        renderGradient();
      });
      picker.click();
    });
    gradColor2.addEventListener('click', () => {
      const picker = document.createElement('input');
      picker.type = 'color';
      picker.value = gradHex2.value;
      picker.addEventListener('input', () => {
        gradHex2.value = picker.value;
        gradColor2.style.background = picker.value;
        renderGradient();
      });
      picker.click();
    });

    // Gradient controls
    gradSteps.addEventListener('input', renderGradient);
    gradHex1.addEventListener('change', () => {
      gradColor1.style.background = gradHex1.value;
      renderGradient();
    });
    gradHex2.addEventListener('change', () => {
      gradColor2.style.background = gradHex2.value;
      renderGradient();
    });

    // Contrast color pickers
    contrastFgSwatch.addEventListener('click', () => {
      const picker = document.createElement('input');
      picker.type = 'color';
      picker.value = contrastFg.value;
      picker.addEventListener('input', () => {
        contrastFg.value = picker.value;
        contrastFgSwatch.style.background = picker.value;
        updateContrast();
      });
      picker.click();
    });
    contrastBgSwatch.addEventListener('click', () => {
      const picker = document.createElement('input');
      picker.type = 'color';
      picker.value = contrastBg.value;
      picker.addEventListener('input', () => {
        contrastBg.value = picker.value;
        contrastBgSwatch.style.background = picker.value;
        updateContrast();
      });
      picker.click();
    });

    // Contrast inputs
    contrastFg.addEventListener('change', updateContrast);
    contrastBg.addEventListener('change', updateContrast);
    contrastFg.addEventListener('keydown', (e) => { if (e.key === 'Enter') updateContrast(); });
    contrastBg.addEventListener('keydown', (e) => { if (e.key === 'Enter') updateContrast(); });

    // Use current color as contrast foreground
    $('#btn-use-current').addEventListener('click', () => {
      contrastFg.value = currentColor;
      contrastFgSwatch.style.background = currentColor;
      updateContrast();
    });

    // Clear history
    $('#btn-clear-history').addEventListener('click', () => {
      history = [];
      localStorage.removeItem('namascolor-history');
      renderHistory();
    });

    // Export theme button
    $('#btn-export-theme').addEventListener('click', () => {
      // Use history or current colors as theme
      const themeColors = history.length >= 6
        ? history.slice(0, 8)
        : [currentColor, ...ColorUtils.complementary(currentColor).slice(1),
           ...ColorUtils.analogous(currentColor).slice(1),
           ...ColorUtils.triadic(currentColor).slice(1)].slice(0, 8);
      const json = ThemeExport.generatePowerBITheme('NamasColor Custom', themeColors);
      if (window.namascolor) {
        window.namascolor.saveTheme(json);
      }
    });

    // Color preview click -> open native color picker (fallback)
    colorPreview.addEventListener('click', () => {
      const picker = document.createElement('input');
      picker.type = 'color';
      picker.value = currentColor;
      picker.addEventListener('input', () => setColor(picker.value));
      picker.click();
    });
  }

  // --- Start ---
  init();
})();
