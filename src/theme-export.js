// === NamasColor — Professional Power BI Theme Export ===

/**
 * Generates a complete Power BI theme JSON.
 *
 * @param {string} name - Theme name
 * @param {string[]} colors - Array of up to 12 hex dataColors
 * @param {object} options
 * @param {object} options.semantic - { good, bad, neutral }
 * @param {object} options.prefs - Design preferences from the UI
 * @returns {string} JSON string
 */
function generatePowerBITheme(name, colors, options = {}) {
  const c = colors.slice(0, 12);
  while (c.length < 12) c.push('#888888');

  const semantic = options.semantic || {};
  const prefs = options.prefs || {};

  const isDark = prefs.themeBase === 'dark';
  const font = prefs.font || 'Segoe UI';
  const borderStyle = prefs.borders || 'none';
  const cornerRadius = parseCornerRadius(prefs.corners);
  const shadowPreset = prefs.shadows || 'none';
  const bgVisuals = prefs.bgVisuals || 'white';
  const alternateRows = prefs.alternateRows !== 'no';

  // --- Semantic colors ---
  const good = semantic.good || '#08C792';
  const bad = semantic.bad || '#ED2939';
  const neutral = semantic.neutral || '#F2C94C';

  // --- Structural colors derived from theme base ---
  const foreground = isDark ? '#E6E6E6' : '#252423';
  const foregroundSecondary = isDark ? '#AAAAAA' : '#605E5C';
  const foregroundTertiary = isDark ? '#777777' : '#A19F9D';
  const background = isDark ? '#1E1E1E' : '#FFFFFF';
  const backgroundLight = isDark ? '#252525' : '#F3F2F1';
  const backgroundNeutral = isDark ? '#333333' : '#EDEBE9';

  const pageBg = isDark ? '#121212' : '#F5F5F5';

  const visualBg = resolveVisualBg(bgVisuals, isDark);
  const visualBgTransparent = bgVisuals === 'transparent';

  // --- Border ---
  const border = buildBorder(borderStyle, c[0], isDark);

  // --- Shadow ---
  const shadow = buildShadow(shadowPreset);

  // --- The theme object ---
  const theme = {
    name: name || 'NamasColor Theme',
    dataColors: c,
    good: good,
    bad: bad,
    neutral: neutral,
    maximum: good,
    center: neutral,
    minimum: bad,
    foreground: foreground,
    foregroundNeutralSecondary: foregroundSecondary,
    foregroundNeutralTertiary: foregroundTertiary,
    background: background,
    backgroundLight: backgroundLight,
    backgroundNeutral: backgroundNeutral,
    tableAccent: c[0],
    textClasses: {
      callout: {
        fontSize: 28,
        fontFace: font,
        color: foreground
      },
      title: {
        fontSize: 12,
        fontFace: font,
        color: foregroundSecondary
      },
      header: {
        fontSize: 14,
        fontFace: font,
        color: foreground
      },
      label: {
        fontSize: 10,
        fontFace: font,
        color: foregroundSecondary
      }
    },
    visualStyles: buildVisualStyles({
      font, foreground, foregroundSecondary, foregroundTertiary,
      background, backgroundLight, backgroundNeutral,
      visualBg, visualBgTransparent, pageBg, border, cornerRadius, shadow,
      primary: c[0], isDark, alternateRows
    })
  };

  return JSON.stringify(theme, null, 2);
}

// --- Helper: visual background ---
function resolveVisualBg(preset, isDark) {
  if (isDark) {
    switch (preset) {
      case 'offwhite': return '#2A2A2A';
      case 'transparent': return '#000000';
      default: return '#1E1E1E';
    }
  }
  switch (preset) {
    case 'offwhite': return '#FAFAFA';
    case 'transparent': return '#FFFFFF';
    default: return '#FFFFFF';
  }
}

// --- Helper: corner radius ---
function parseCornerRadius(preset) {
  switch (preset) {
    case 'rounded': return 6;
    case 'very-rounded': return 12;
    default: return 0;
  }
}

// --- Helper: border config ---
function buildBorder(style, primary, isDark) {
  switch (style) {
    case 'subtle':
      return { show: true, color: isDark ? '#444444' : '#E1DFDD', weight: 1 };
    case 'corporate':
      return { show: true, color: primary, weight: 1 };
    default:
      return { show: false, color: '#FFFFFF', weight: 0 };
  }
}

// --- Helper: shadow config ---
function buildShadow(preset) {
  switch (preset) {
    case 'subtle':
      return { show: true, color: '#000000', position: 'Outer', preset: 'BottomRight', transparency: 85 };
    case 'strong':
      return { show: true, color: '#000000', position: 'Outer', preset: 'BottomRight', transparency: 70 };
    default:
      return { show: false, color: '#000000', position: 'Outer', preset: 'BottomRight', transparency: 100 };
  }
}

// --- Shorthand: wrap a value as Power BI visualStyles expects ---
function solid(color) { return { solid: { color: color } }; }

// --- Build the full visualStyles ---
function buildVisualStyles(cfg) {
  const vs = {};

  // --- Wildcard: applies to all visuals ---
  vs['*'] = {
    '*': {
      background: [{ color: solid(cfg.visualBg), transparency: cfg.visualBgTransparent ? 100 : 0 }],
      border: [{
        show: cfg.border.show,
        color: solid(cfg.border.color),
        weight: cfg.border.weight,
        radius: cfg.cornerRadius
      }],
      title: [{
        show: true,
        fontFamily: cfg.font,
        fontSize: 10,
        color: solid(cfg.foreground),
        bold: true
      }],
      dropShadow: [{
        show: cfg.shadow.show,
        color: solid(cfg.shadow.color),
        position: cfg.shadow.position,
        preset: cfg.shadow.preset,
        transparency: cfg.shadow.transparency
      }]
    }
  };

  // --- Page background ---
  vs['page'] = {
    '*': {
      background: [{ color: solid(cfg.pageBg), transparency: 0 }]
    }
  };

  // --- Card (KPI / Multi-row card) ---
  vs['card'] = {
    '*': {
      labels: [{
        color: solid(cfg.foreground),
        fontSize: 28,
        fontFamily: cfg.font
      }],
      categoryLabels: [{
        show: true,
        color: solid(cfg.foregroundSecondary),
        fontSize: 10,
        fontFamily: cfg.font
      }]
    }
  };

  // --- Table ---
  const tableConfig = {
    '*': {
      grid: [{
        gridVertical: true,
        gridVerticalColor: solid(cfg.isDark ? '#333333' : '#F0F0F0'),
        gridVerticalWeight: 1,
        gridHorizontal: true,
        gridHorizontalColor: solid(cfg.isDark ? '#333333' : '#F0F0F0'),
        gridHorizontalWeight: 1,
        rowPadding: 4
      }],
      values: [{
        fontFamily: cfg.font,
        fontSize: 11,
        color: solid(cfg.foreground),
        backColor: solid(cfg.visualBg)
      }],
      columnHeaders: [{
        fontFamily: cfg.font,
        fontSize: 11,
        bold: true,
        color: solid('#FFFFFF'),
        backColor: solid(cfg.primary)
      }],
      rowHeaders: [{
        fontFamily: cfg.font,
        fontSize: 11,
        color: solid(cfg.foreground)
      }]
    }
  };

  if (cfg.alternateRows) {
    tableConfig['*'].values[0].backColorAlternate = solid(cfg.isDark ? '#2A2A2A' : '#F9F9F9');
  }

  vs['tableEx'] = tableConfig;
  vs['pivotTable'] = JSON.parse(JSON.stringify(tableConfig));

  // --- Slicer ---
  vs['slicer'] = {
    '*': {
      items: [{
        fontFamily: cfg.font,
        fontSize: 11,
        color: solid(cfg.foreground)
      }],
      header: [{
        fontFamily: cfg.font,
        fontSize: 11,
        bold: true,
        color: solid(cfg.foreground)
      }]
    }
  };

  return vs;
}

// --- Legacy wrappers (unused but kept for compat) ---
function generateThemeFromPalette(palette) {
  return generatePowerBITheme(palette.name, palette.colors);
}

function generateThemeFromColors(name, dataColors, options = {}) {
  return generatePowerBITheme(name, dataColors, options);
}

window.ThemeExport = { generatePowerBITheme, generateThemeFromPalette, generateThemeFromColors };
