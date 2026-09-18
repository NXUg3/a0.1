# Axie Smash — entrega completa para GitHub

Juego modular HTML/Canvas/JS con menú moderno aprobado, fondo de Kotaro en la arena, intro, roster oficial PNG, selección, VS, cuenta regresiva y dos victorias para ganar. Incluye todos los recursos multimedia disponibles y los módulos nuevos de Socket.io, configurados para https://axie-smash-server.onrender.com.

## Subir y publicar

1. Descomprime el ZIP.
2. Sube su CONTENIDO a la raíz del repositorio: index.html, css/, js/, assets/, tests/, README.md, NETWORK.md, package.json, .gitignore y .nojekyll. No subas el ZIP ni las versiones monolíticas antiguas.
3. En GitHub: Settings → Pages → Source: Deploy from a branch → main → /(root) → Save.
4. Abre la URL que muestre Pages. En el backend permite ese origen en CORS.

Guía oficial: https://docs.github.com/en/pages/quickstart

## Contenido

```text
index.html
css/                 estilos y adaptación responsive
js/
  config.js          roster y configuración
  assets.js          recursos PNG y caché
  audio.js           música y efectos
  scenes.js          navegación
  selection.js       selección compartida
  room-flow.js       crear / unirse, código y espera
  net.js             Socket.io y URL oficial Render
  online.js          eventos de sesión y comienzo sincronizado
  online-combat.js   inputs y snapshots host-autoritativos
  game.js            coordinación, física y bucle 60 Hz
  ...                HUD, animación 12/15 FPS y auxiliares
assets/
  sprites/           oleg, momo, buba, pomodoro, trip, venoki, puff, kotaro
  ui/                menú y logo del juego
  audio/             música disponible
  video/intro.mp4
 tests/              pruebas sin servidor real
NETWORK.md           contrato de eventos y configuración del backend
package.json
.gitignore
.nojekyll
```

No hay medios incrustados en el HTML. Cada archivo JS/CSS pesa menos de 6 KB. El vídeo y las imágenes siguen siendo recursos separados.

## Online

La URL de Render está incluida en net.js; no debes configurar localhost. El servidor genera el código único y asigna P1/P2. P1 espera rival; P2 entra por código. La selección sincronizada requiere confirmación de ambos. P1 simula combate a 60 Hz y P2 envía controles/recibe snapshots. No es rollback ni servidor autoritativo: un host puede hacer trampas. Consulta NETWORK.md para eventos, CORS y limitaciones.

No se incluye el código del backend de Render porque no se proporcionó. Debe implementar el contrato de NETWORK.md. Se probaron dos clientes con un transporte simulado; no se confirmó compatibilidad del servidor desplegado ni conexión real entre dispositivos.

## Música pendiente

Incluido: assets/audio/press_start.mp3. No se proporcionaron main_menu.mp3, character_select.mp3 ni combat_theme.mp3; añade tus pistas a assets/audio/ con esos nombres. El juego funciona sin ellas y mantiene efectos sintetizados. No se inventaron pistas de reemplazo.

## Pruebas y uso local

Con Node.js 22 o posterior: npm test (no necesita instalar dependencias). Para probar en navegador sirve esta carpeta mediante HTTP, por ejemplo con Python: python -m http.server 8080; abre http://localhost:8080. No abras el HTML mediante file://.

Roster exacto: Oleg, Momo, Buba, Pomodoro, Trip, Venoki, Puff, Kotaro. Momo, Trip, Venoki y Puff están bloqueados. Logos: assets/sprites/[personaje]/logo.png. Reemplazar los PNG y recargar la página renueva la versión de caché; Opciones también permite recargar recursos.
