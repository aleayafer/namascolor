// === NamasColor — App Controller ===

(function() {
  // --- State ---
  let currentColor = '#E8443A';
  let history = JSON.parse(localStorage.getItem('namascolor-history') || '[]');
  let activeHarmony = 'complementary';
  let themeName = localStorage.getItem('namascolor-theme-name') || 'NamasColor Custom';

  // Migrate 8→12 slots
  let themeSlots = JSON.parse(localStorage.getItem('namascolor-theme-slots') || '[null,null,null,null,null,null,null,null,null,null,null,null]');
  if (themeSlots.length < 12) {
    while (themeSlots.length < 12) themeSlots.push(null);
    localStorage.setItem('namascolor-theme-slots', JSON.stringify(themeSlots));
  }

  // Semantic colors
  const defaultSemantic = { good: '#08C792', bad: '#ED2939', neutral: '#F2C94C' };
  let semanticColors = JSON.parse(localStorage.getItem('namascolor-semantic') || 'null') || { ...defaultSemantic };

  // Design preferences
  const defaultPrefs = {
    themeBase: 'light',
    borders: 'none',
    corners: 'square',
    shadows: 'none',
    font: 'Segoe UI',
    fontCustom: '',
    bgVisuals: 'white',
    alternateRows: 'yes'
  };
  let designPrefs = JSON.parse(localStorage.getItem('namascolor-prefs') || 'null') || { ...defaultPrefs };

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
  const themeSlotsEl = $('#theme-slots');
  const themeNameInput = $('#theme-name');
  const presetRow = $('#preset-row');
  const historyList = $('#history-list');

  // Prefs DOM
  const prefThemeBase = $('#pref-theme-base');
  const prefBorders = $('#pref-borders');
  const prefCorners = $('#pref-corners');
  const prefShadows = $('#pref-shadows');
  const prefFont = $('#pref-font');
  const prefFontCustom = $('#pref-font-custom');
  const prefFontCustomWrap = $('#pref-font-custom-wrap');
  const prefBgVisuals = $('#pref-bg-visuals');
  const prefAlternateRows = $('#pref-alternate-rows');

  // --- Init ---
  function init() {
    themeNameInput.value = themeName;
    updateColorDisplay(currentColor);
    renderHarmonies();
    renderGradient();
    updateContrast();
    renderThemeSlots();
    renderPresets();
    renderHistory();
    renderSemanticColors();
    loadDesignPrefs();
    bindEvents();
  }

  // --- Color Display ---
  function setColor(hex, { addToHistory = true, addToTheme = false } = {}) {
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
    if (addToTheme) addColorToTheme(hex);
  }

  function updateColorDisplay(hex) {
    colorPreview.style.background = hex;
    inputHex.value = hex;
    const rgb = ColorUtils.hexToRgb(hex);
    const hsl = ColorUtils.hexToHsl(hex);
    valRgb.textContent = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
    valHsl.textContent = `${hsl.h}\u00B0, ${hsl.s}%, ${hsl.l}%`;
  }

  // --- Semantic Colors ---
  function renderSemanticColors() {
    ['good', 'bad', 'neutral'].forEach(key => {
      const el = $(`#sem-${key}`);
      if (el) el.style.background = semanticColors[key];
    });
  }

  function openSemanticPicker(key) {
    const picker = document.createElement('input');
    picker.type = 'color';
    picker.value = semanticColors[key];
    picker.addEventListener('input', () => {
      semanticColors[key] = picker.value.toUpperCase();
      saveSemanticColors();
      renderSemanticColors();
    });
    picker.click();
  }

  function saveSemanticColors() {
    localStorage.setItem('namascolor-semantic', JSON.stringify(semanticColors));
  }

  // --- Design Preferences ---
  function loadDesignPrefs() {
    prefThemeBase.value = designPrefs.themeBase;
    prefBorders.value = designPrefs.borders;
    prefCorners.value = designPrefs.corners;
    prefShadows.value = designPrefs.shadows;

    // Font: check if it's a known value or custom
    if (designPrefs.font === 'Segoe UI' || designPrefs.font === 'DIN') {
      prefFont.value = designPrefs.font;
      prefFontCustomWrap.classList.add('pref-font-hidden');
    } else {
      prefFont.value = 'custom';
      prefFontCustom.value = designPrefs.font;
      prefFontCustomWrap.classList.remove('pref-font-hidden');
    }

    prefBgVisuals.value = designPrefs.bgVisuals;
    prefAlternateRows.value = designPrefs.alternateRows;
  }

  function saveDesignPrefs() {
    designPrefs.themeBase = prefThemeBase.value;
    designPrefs.borders = prefBorders.value;
    designPrefs.corners = prefCorners.value;
    designPrefs.shadows = prefShadows.value;
    designPrefs.bgVisuals = prefBgVisuals.value;
    designPrefs.alternateRows = prefAlternateRows.value;

    // Font
    if (prefFont.value === 'custom') {
      designPrefs.font = prefFontCustom.value || 'Segoe UI';
      prefFontCustomWrap.classList.remove('pref-font-hidden');
    } else {
      designPrefs.font = prefFont.value;
      prefFontCustomWrap.classList.add('pref-font-hidden');
    }

    localStorage.setItem('namascolor-prefs', JSON.stringify(designPrefs));

    // Recalculate WCAG warnings when theme base changes
    renderThemeSlots();
  }

  // --- Theme Slots ---
  function addColorToTheme(hex) {
    const idx = themeSlots.indexOf(null);
    if (idx === -1) return; // all slots full
    themeSlots[idx] = hex;
    saveThemeSlots();
    renderThemeSlots();
  }

  function removeFromTheme(index) {
    themeSlots[index] = null;
    saveThemeSlots();
    renderThemeSlots();
  }

  function loadPreset(paletteIndex) {
    const palette = Palettes[paletteIndex];
    themeSlots = palette.colors.slice(0, 12).map(c => c);
    while (themeSlots.length < 12) themeSlots.push(null);
    saveThemeSlots();
    renderThemeSlots();
  }

  function clearThemeSlots() {
    themeSlots = Array(12).fill(null);
    saveThemeSlots();
    renderThemeSlots();
  }

  function saveThemeSlots() {
    localStorage.setItem('namascolor-theme-slots', JSON.stringify(themeSlots));
  }

  function saveThemeName() {
    themeName = themeNameInput.value || 'NamasColor Custom';
    localStorage.setItem('namascolor-theme-name', themeName);
  }

  function renderThemeSlots() {
    const bgForContrast = designPrefs.themeBase === 'dark' ? '#1E1E1E' : '#FFFFFF';

    themeSlotsEl.innerHTML = themeSlots.map((color, i) => {
      if (color) {
        // WCAG check: contrast < 3:1 vs theme background
        const ratio = Contrast.contrastRatio(color, bgForContrast);
        const warn = ratio < 3;
        return `<div class="theme-slot filled" style="background:${color}" data-slot="${i}" title="${color} — contraste ${Math.round(ratio * 10) / 10}:1">
          <button class="remove" data-remove="${i}">&times;</button>
          ${warn ? '<span class="wcag-warn"></span>' : ''}
        </div>`;
      }
      return `<div class="theme-slot empty" data-slot="${i}" title="Clic para añadir color"></div>`;
    }).join('');
  }

  function renderPresets() {
    presetRow.innerHTML = Palettes.map((p, idx) =>
      `<button class="preset-btn" data-preset="${idx}">
        <span class="preset-mini">${p.colors.slice(0, 8).map(c => `<span class="preset-mini-swatch" style="background:${c}"></span>`).join('')}</span>
        <span>${p.name}</span>
      </button>`
    ).join('');
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

    // Color from picker → adds to theme
    if (window.namascolor) {
      window.namascolor.onColorPicked((hex) => setColor(hex, { addToTheme: true }));
    }

    // Hex input → does NOT add to theme
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

    // Click on any swatch (harmonies, gradient, history) → select color + add to theme
    document.addEventListener('click', (e) => {
      const swatch = e.target.closest('[data-color]');
      if (swatch) {
        // Don't add to theme from preset mini swatches
        if (swatch.closest('.preset-btn')) return;
        setColor(swatch.dataset.color, { addToTheme: true });
      }
    });

    // Theme slot clicks
    themeSlotsEl.addEventListener('click', (e) => {
      // Remove button
      const removeBtn = e.target.closest('[data-remove]');
      if (removeBtn) {
        e.stopPropagation();
        removeFromTheme(parseInt(removeBtn.dataset.remove));
        return;
      }

      const slot = e.target.closest('.theme-slot');
      if (!slot) return;
      const idx = parseInt(slot.dataset.slot);

      // Open native color picker
      const picker = document.createElement('input');
      picker.type = 'color';
      picker.value = themeSlots[idx] || currentColor;
      picker.addEventListener('input', () => {
        themeSlots[idx] = picker.value.toUpperCase();
        saveThemeSlots();
        renderThemeSlots();
      });
      picker.click();
    });

    // Semantic color clicks
    $$('.semantic-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        openSemanticPicker(swatch.dataset.key);
      });
    });

    // Design preferences
    [prefThemeBase, prefBorders, prefCorners, prefShadows, prefFont, prefBgVisuals, prefAlternateRows].forEach(el => {
      el.addEventListener('change', saveDesignPrefs);
    });
    prefFontCustom.addEventListener('change', saveDesignPrefs);
    prefFontCustom.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveDesignPrefs(); });

    // Preset buttons
    presetRow.addEventListener('click', (e) => {
      const btn = e.target.closest('.preset-btn');
      if (btn) loadPreset(parseInt(btn.dataset.preset));
    });

    // Clear theme slots
    $('#btn-clear-theme').addEventListener('click', clearThemeSlots);

    // Theme name
    themeNameInput.addEventListener('change', saveThemeName);
    themeNameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveThemeName(); });

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

    // Export theme button → uses Mi Tema slots + semantic + prefs
    $('#btn-export-theme').addEventListener('click', () => {
      const colors = themeSlots.filter(Boolean);
      if (colors.length === 0) {
        // Fallback: use current color
        colors.push(currentColor);
      }

      // Resolve effective font
      const effectiveFont = designPrefs.font === 'custom'
        ? (prefFontCustom.value || 'Segoe UI')
        : designPrefs.font;

      const json = ThemeExport.generatePowerBITheme(themeName, colors, {
        semantic: semanticColors,
        prefs: { ...designPrefs, font: effectiveFont }
      });

      if (window.namascolor) {
        window.namascolor.saveTheme(json);
      }
    });

    // Color preview click -> open native color picker
    colorPreview.addEventListener('click', () => {
      const picker = document.createElement('input');
      picker.type = 'color';
      picker.value = currentColor;
      picker.addEventListener('input', () => setColor(picker.value, { addToTheme: true }));
      picker.click();
    });
  }

  // --- Start ---
  init();
})();
