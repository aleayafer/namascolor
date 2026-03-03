function generatePowerBITheme(name, colors) {
  // colors: array of 6-8 hex strings
  // First color = primary, generates full theme
  const c = colors.slice(0, 8);
  while (c.length < 8) c.push('#888888');

  const theme = {
    name: name || 'NamasColor Theme',
    dataColors: c,
    background: '#FFFFFF',
    foreground: '#252423',
    tableAccent: c[0],
    good: '#50C878',
    neutral: '#F5A623',
    bad: '#E8443A',
    maximum: c[0],
    center: c[3] || c[0],
    minimum: c[5] || c[1],
    visualStyles: {
      '*': {
        '*': {
          '*': [{
            fontSize: 12,
            fontFamily: 'Segoe UI'
          }]
        }
      }
    }
  };

  return JSON.stringify(theme, null, 2);
}

function generateThemeFromPalette(palette) {
  return generatePowerBITheme(palette.name, palette.colors);
}

function generateThemeFromColors(name, dataColors, options = {}) {
  const theme = {
    name: name || 'NamasColor Theme',
    dataColors: dataColors,
    background: options.background || '#FFFFFF',
    foreground: options.foreground || '#252423',
    tableAccent: options.tableAccent || dataColors[0],
    good: options.good || '#50C878',
    neutral: options.neutral || '#F5A623',
    bad: options.bad || '#E8443A'
  };
  return JSON.stringify(theme, null, 2);
}

window.ThemeExport = { generatePowerBITheme, generateThemeFromPalette, generateThemeFromColors };
