# NamasColor

Color Picker para Power BI Desktop. Herramienta gratuita para estudiantes de NamasData.

![NamasColor](https://img.shields.io/badge/version-1.0.0-E8443A) ![Platform](https://img.shields.io/badge/platform-Windows-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## Funcionalidades

- **Screen Color Picker** — Captura cualquier color de tu pantalla con magnificador zoom 8x
- **Valores HEX / RGB / HSL** — Copia en un click el formato que necesites
- **Armonias de color** — Complementario, analogos, triadico y split-complementario
- **Generador de degradados** — De 2 a 20 pasos con interpolacion HSL
- **Contraste WCAG** — Verifica accesibilidad con badges AA/AAA pass/fail
- **6 paletas predefinidas** — Corporate Blue, Sunset Warm, Nature Earth, Modern Minimal, Power BI Default y NamasData
- **Historial** — Ultimos 30 colores guardados automaticamente
- **Export tema Power BI** — Genera un `.json` importable directamente en Power BI Desktop
- **External Tool** — Se registra automaticamente en Power BI Desktop

## Instalacion

### Instalador (recomendado)

1. Descarga `NamasColor Setup 1.0.0.exe` desde [Releases](https://github.com/aleayafer/namascolor/releases)
2. Ejecuta el instalador
3. Abre Power BI Desktop — NamasColor aparecera en la pestana **External Tools**

### Portable

Descarga la carpeta `win-unpacked` y ejecuta `NamasColor.exe` directamente.

## Desarrollo

```bash
# Clonar el repositorio
git clone https://github.com/aleayafer/namascolor.git
cd namascolor

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm start

# Generar instalador
npm run build
```

## Tecnologia

- [Electron](https://www.electronjs.org/) — Framework de escritorio
- Sin dependencias de runtime — todo el color math es manual
- NSIS — Instalador de Windows

## Estructura del proyecto

```
namascolor/
├── main.js              # Proceso principal Electron
├── preload.js           # Bridge IPC seguro
├── src/
│   ├── index.html       # Layout principal
│   ├── styles.css       # Tema claro minimalista
│   ├── app.js           # Orquestacion UI y estado
│   ├── color-utils.js   # Conversiones y armonias
│   ├── contrast.js      # WCAG contrast ratio
│   ├── palettes.js      # Paletas predefinidas
│   ├── theme-export.js  # Generador JSON tema Power BI
│   ├── picker.html      # Overlay captura de pantalla
│   └── picker.js        # Magnificador y lectura de pixel
├── assets/
│   ├── icon.ico
│   ├── icon.png
│   └── namascolor.pbitool.json
└── build/
    └── installer.nsh    # Script NSIS para External Tool
```

## Licencia

MIT — by [NamasData](https://namasdata.com)
