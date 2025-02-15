/***** CONFIGURACIÓN DEL CANVAS Y VARIABLES GLOBALES *****/
const canvas = document.getElementById('gameCanvas');
const availableHeight = window.innerHeight * 0.85;
const canvasSize = Math.min(window.innerWidth, availableHeight);
canvas.width = canvasSize;
canvas.height = canvasSize;
const ctx = canvas.getContext('2d');
const screenWidth = canvas.width;
const screenHeight = canvas.height;

// ─── FUNCIONES DE AYUDA ───
function loadTexture(src) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  return img;
}

// ─── CARGA DE TEXTURAS ───
const wallTexture    = loadTexture('wall.png');
const floorTexture   = loadTexture('floor.png');
const ceilingTexture = loadTexture('ceiling.png');
const weaponTexture  = loadTexture('weapon.png');
const enemyTexture   = loadTexture('enemy.png');

// Variables para extraer píxeles de piso y techo (para el raycasting)
let floorData = null, ceilingData = null;
let texturesLoaded = 0;
function onTextureLoaded() {
  texturesLoaded++;
  if (texturesLoaded === 5) {
    // Extraer píxeles de piso
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = floorTexture.width;
    floorCanvas.height = floorTexture.height;
    const floorCtx = floorCanvas.getContext('2d');
    floorCtx.drawImage(floorTexture, 0, 0);
    floorData = floorCtx.getImageData(0, 0, floorTexture.width, floorTexture.height).data;

    // Extraer píxeles de techo
    const ceilingCanvas = document.createElement('canvas');
    ceilingCanvas.width = ceilingTexture.width;
    ceilingCanvas.height = ceilingTexture.height;
    const ceilingCtx = ceilingCanvas.getContext('2d');
    ceilingCtx.drawImage(ceilingTexture, 0, 0);
    ceilingData = ceilingCtx.getImageData(0, 0, ceilingTexture.width, ceilingTexture.height).data;

    requestAnimationFrame(gameLoop);
  }
}
wallTexture.onload    = onTextureLoaded;
floorTexture.onload   = onTextureLoaded;
ceilingTexture.onload = onTextureLoaded;
weaponTexture.onload  = onTextureLoaded;
enemyTexture.onload   = onTextureLoaded;

// ─── DEFINICIÓN DEL MAPA (15x15) ───
const MAP_WIDTH = 15, MAP_HEIGHT = 15;
const map = [];
for (let y = 0; y < MAP_HEIGHT; y++) {
  const row = [];
  for (let x = 0; x < MAP_WIDTH; x++) {
    row.push(1); // Ponemos 1 (pared) por defecto
  }
  map.push(row);
}
// "Vaciar" parte del mapa (pasillos) poniendo 0
// Barra horizontal: filas 1 a 4, columnas 3 a 11
for (let y = 1; y <= 4; y++) {
  for (let x = 3; x <= 11; x++) {
    map[y][x] = 0;
  }
}
// Barra vertical: filas 4 a 13, columnas 6 a 8
for (let y = 4; y <= 13; y++) {
  for (let x = 6; x <= 8; x++) {
    map[y][x] = 0;
  }
}

// Exponemos el mapa en window para que lo use el minimapa
window.map = map;

// ─── VARIABLES DEL JUGADOR ───
let posX = 7.5, posY = 3.5; // Posición inicial
let angle = 0;              // Ángulo en radianes
const fov = Math.PI / 3;    // Campo de visión (60°)

// Velocidades
const moveSpeed = 0.2;
const rotSpeed  = 0.2;

// ─── CONTROLES ───
window.keys = {}; // Objeto global para almacenar pulsaciones

window.addEventListener('keydown', e => {
  window.keys[e.key] = true;
  // Disparo con la barra espaciadora (opcional)
  if (e.code === "Space") {
    shootBullet();
  }
});
window.addEventListener('keyup', e => {
  window.keys[e.key] = false;
});

// ─── SISTEMA DE DISPAROS ───
const bullets = [];
const bulletSpeed = 0.5;
let lastShotTime = 0;
const shootCooldown = 300; // milisegundos

function shootBullet() {
  const currentTime = Date.now();
  if (currentTime - lastShotTime > shootCooldown) {
    bullets.push({ x: posX, y: posY, angle: angle });
    lastShotTime = currentTime;
  }
}
// Exponemos la función para que otros módulos (footer.js) la llamen
window.shootBullet = shootBullet;

// ─── ENEMIGOS ───
const enemies = [
  { x: 5.5,  y: 2.5,  alive: true },
  { x: 7.5,  y: 10.5, alive: true },
  { x: 10.5, y: 4.5,  alive: true }
];
// Exponemos los enemigos en window para el minimapa
window.enemies = enemies;

const enemySpeed = 0.02;

// ─── ACTUALIZACIÓN DEL ESTADO (MOVIMIENTO Y LÓGICA) ───
function update() {
  // Movimiento del jugador
  if (window.keys["ArrowUp"] || window.keys["w"]) {
    let newX = posX + Math.cos(angle) * moveSpeed;
    let newY = posY + Math.sin(angle) * moveSpeed;
    if (map[Math.floor(newY)][Math.floor(newX)] === 0) {
      posX = newX;
      posY = newY;
    }
  }
  if (window.keys["ArrowDown"] || window.keys["s"]) {
    let newX = posX - Math.cos(angle) * moveSpeed;
    let newY = posY - Math.sin(angle) * moveSpeed;
    if (map[Math.floor(newY)][Math.floor(newX)] === 0) {
      posX = newX;
      posY = newY;
    }
  }
  if (window.keys["ArrowLeft"] || window.keys["a"]) {
    angle -= rotSpeed;
  }
  if (window.keys["ArrowRight"] || window.keys["d"]) {
    angle += rotSpeed;
  }

  // Actualizamos las posiciones en window para el minimapa
  window.posX = posX;
  window.posY = posY;

  // Actualizamos proyectiles
  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];
    // Avanza el proyectil
    b.x += Math.cos(b.angle) * bulletSpeed;
    b.y += Math.sin(b.angle) * bulletSpeed;
    // Si colisiona con pared o fuera de mapa, se destruye
    if (!map[Math.floor(b.y)] || map[Math.floor(b.y)][Math.floor(b.x)] > 0) {
      bullets.splice(i, 1);
      continue;
    }
    // Detección de impacto con enemigos
    for (let enemy of enemies) {
      if (enemy.alive) {
        let dx = enemy.x - b.x;
        let dy = enemy.y - b.y;
        if (Math.sqrt(dx * dx + dy * dy) < 0.3) {
          enemy.alive = false;
          bullets.splice(i, 1);
          break;
        }
      }
    }
  }

  // Movimiento simple de enemigos (persiguen al jugador)
  for (let enemy of enemies) {
    if (enemy.alive) {
      let dx = posX - enemy.x;
      let dy = posY - enemy.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      // Se mueven si están a más de 0.5 de distancia
      if (dist > 0.5) {
        let newX = enemy.x + (dx / dist) * enemySpeed;
        let newY = enemy.y + (dy / dist) * enemySpeed;
        if (map[Math.floor(newY)][Math.floor(newX)] === 0) {
          enemy.x = newX;
          enemy.y = newY;
        }
      }
    }
  }

  // Exponemos un valor de vida del jugador, para que el minimapa (u otro módulo) lo muestre
  window.playerLife = 100; // Valor fijo de ejemplo
}

// ─── RENDERIZADO (raycasting 2D) ───
function render() {
  // Fondo negro
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, screenWidth, screenHeight);

  const zBuffer = new Array(screenWidth);
  const planeX = -Math.sin(angle) * Math.tan(fov / 2);
  const planeY =  Math.cos(angle) * Math.tan(fov / 2);
  const dirX   =  Math.cos(angle);
  const dirY   =  Math.sin(angle);
  const invDet = 1.0 / (planeX * dirY - dirX * planeY);
  const halfHeight = screenHeight / 2;
  const posZ = halfHeight;

  // Floor & ceiling casting
  const imgData = ctx.getImageData(0, 0, screenWidth, screenHeight);
  const data = imgData.data;

  for (let y = 0; y < screenHeight; y++) {
    let p = y - halfHeight;
    if (p === 0) p = 1; // Evitar división entre cero
    let rowDistance = posZ / Math.abs(p);

    const floorStepX = rowDistance * ((dirX + planeX) - (dirX - planeX)) / screenWidth;
    const floorStepY = rowDistance * ((dirY + planeY) - (dirY - planeY)) / screenWidth;
    let worldX = posX + rowDistance * (dirX - planeX);
    let worldY = posY + rowDistance * (dirY - planeY);

    for (let x = 0; x < screenWidth; x++) {
      const cellX = Math.floor(worldX);
      const cellY = Math.floor(worldY);
      const pixelIndex = (y * screenWidth + x) * 4;

      if (y > halfHeight) {
        // Floor
        let tx = Math.floor((worldX - cellX) * floorTexture.width);
        let ty = Math.floor((worldY - cellY) * floorTexture.height);
        tx = ((tx % floorTexture.width) + floorTexture.width) % floorTexture.width;
        ty = ((ty % floorTexture.height) + floorTexture.height) % floorTexture.height;
        const texIndex = (ty * floorTexture.width + tx) * 4;
        data[pixelIndex    ] = floorData[texIndex    ];
        data[pixelIndex + 1] = floorData[texIndex + 1];
        data[pixelIndex + 2] = floorData[texIndex + 2];
        data[pixelIndex + 3] = 255;
      } else if (y < halfHeight) {
        // Ceiling
        let tx = Math.floor((worldX - cellX) * ceilingTexture.width);
        let ty = Math.floor((worldY - cellY) * ceilingTexture.height);
        tx = ((tx % ceilingTexture.width) + ceilingTexture.width) % ceilingTexture.width;
        ty = ((ty % ceilingTexture.height) + ceilingTexture.height) % ceilingTexture.height;
        const texIndex = (ty * ceilingTexture.width + tx) * 4;
        data[pixelIndex    ] = ceilingData[texIndex    ];
        data[pixelIndex + 1] = ceilingData[texIndex + 1];
        data[pixelIndex + 2] = ceilingData[texIndex + 2];
        data[pixelIndex + 3] = 255;
      }

      worldX += floorStepX;
      worldY += floorStepY;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // Raycasting de paredes
  for (let x = 0; x < screenWidth; x++) {
    const cameraX = 2 * x / screenWidth - 1;
    const rayDirX = dirX + planeX * cameraX;
    const rayDirY = dirY + planeY * cameraX;

    let mapX = Math.floor(posX);
    let mapY = Math.floor(posY);

    const deltaDistX = Math.abs(1 / rayDirX);
    const deltaDistY = Math.abs(1 / rayDirY);

    let stepX, stepY;
    let sideDistX, sideDistY;

    if (rayDirX < 0) {
      stepX = -1;
      sideDistX = (posX - mapX) * deltaDistX;
    } else {
      stepX = 1;
      sideDistX = (mapX + 1 - posX) * deltaDistX;
    }
    if (rayDirY < 0) {
      stepY = -1;
      sideDistY = (posY - mapY) * deltaDistY;
    } else {
      stepY = 1;
      sideDistY = (mapY + 1 - posY) * deltaDistY;
    }

    let hit = false;
    let side;

    while (!hit) {
      if (sideDistX < sideDistY) {
        sideDistX += deltaDistX;
        mapX += stepX;
        side = 0;
      } else {
        sideDistY += deltaDistY;
        mapY += stepY;
        side = 1;
      }
      if (map[mapY][mapX] > 0) hit = true;
    }

    let perpWallDist;
    if (side === 0) {
      perpWallDist = (mapX - posX + (1 - stepX) / 2) / rayDirX;
    } else {
      perpWallDist = (mapY - posY + (1 - stepY) / 2) / rayDirY;
    }

    zBuffer[x] = perpWallDist;

    const lineHeight = Math.floor(screenHeight / perpWallDist);
    let drawStart = Math.floor(-lineHeight / 2 + screenHeight / 2);
    if (drawStart < 0) drawStart = 0;
    let drawEnd = Math.floor(lineHeight / 2 + screenHeight / 2);
    if (drawEnd >= screenHeight) drawEnd = screenHeight - 1;

    // Coordenada X en la textura
    let wallX;
    if (side === 0) {
      wallX = posY + perpWallDist * rayDirY;
    } else {
      wallX = posX + perpWallDist * rayDirX;
    }
    wallX -= Math.floor(wallX);

    let texX = Math.floor(wallX * wallTexture.width);
    // Ajuste para que la textura no "salte"
    if (side === 0 && rayDirX > 0) texX = wallTexture.width - texX - 1;
    if (side === 1 && rayDirY < 0) texX = wallTexture.width - texX - 1;

    // Dibujamos la pared
    if (wallTexture.complete) {
      ctx.drawImage(
        wallTexture,
        texX, 0, 1, wallTexture.height,
        x, drawStart, 1, drawEnd - drawStart
      );
    } else {
      // Color sólido si textura no está lista
      ctx.fillStyle = (side === 1) ? "#888" : "#aaa";
      ctx.fillRect(x, drawStart, 1, drawEnd - drawStart);
    }
  }

  // Renderizado de enemigos (sprites)
  const spriteData = [];
  for (let enemy of enemies) {
    if (!enemy.alive) continue;
    const spriteX = enemy.x - posX;
    const spriteY = enemy.y - posY;
    const transformX = invDet * (dirY * spriteX - dirX * spriteY);
    const transformY = invDet * (-planeY * spriteX + planeX * spriteY);
    if (transformY <= 0) continue;
    spriteData.push({ enemy, transformX, transformY });
  }
  // Ordenar sprites por distancia (los más lejanos detrás)
  spriteData.sort((a, b) => b.transformY - a.transformY);

  for (let sprite of spriteData) {
    const { transformX, transformY } = sprite;
    const spriteScreenX = Math.floor((screenWidth / 2) * (1 + transformX / transformY));
    const spriteHeight = Math.abs(Math.floor(screenHeight / transformY));
    const spriteWidth  = spriteHeight;

    const drawStartY = Math.floor(-spriteHeight / 2 + screenHeight / 2);
    const drawStartX = Math.floor(-spriteWidth / 2 + spriteScreenX);
    const drawEndX = drawStartX + spriteWidth;

    for (let stripe = drawStartX; stripe < drawEndX; stripe++) {
      if (stripe < 0 || stripe >= screenWidth) continue;
      // Z-Buffer check
      if (transformY < zBuffer[stripe]) {
        const texX = Math.floor((stripe - drawStartX) * enemyTexture.width / spriteWidth);
        ctx.drawImage(
          enemyTexture,
          texX, 0, 1, enemyTexture.height,
          stripe, drawStartY, 1, spriteHeight
        );
      }
    }
  }

  // Renderizado de proyectiles
  for (let bullet of bullets) {
    const spriteX = bullet.x - posX;
    const spriteY = bullet.y - posY;
    const transformX = invDet * (dirY * spriteX - dirX * spriteY);
    const transformY = invDet * (-planeY * spriteX + planeX * spriteY);
    if (transformY > 0) {
      const spriteScreenX = Math.floor((screenWidth / 2) * (1 + transformX / transformY));
      const spriteSize = Math.abs(Math.floor(screenHeight / transformY)) / 8;
      const drawStartY = Math.floor(-spriteSize / 2 + screenHeight / 2);
      const drawStartX = Math.floor(-spriteSize / 2 + spriteScreenX);

      // Dibujamos la bala como un pequeño círculo amarillo
      ctx.fillStyle = "yellow";
      ctx.beginPath();
      ctx.arc(drawStartX + spriteSize/2, drawStartY + spriteSize/2, spriteSize/2, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  // Dibuja el arma (HUD) en la parte inferior
  const weaponWidth = screenWidth * 0.5;
  const weaponHeight = weaponTexture.height * (weaponWidth / weaponTexture.width);
  const weaponX = (screenWidth - weaponWidth) / 2;
  const weaponY = screenHeight - weaponHeight;
  ctx.drawImage(weaponTexture, weaponX, weaponY, weaponWidth, weaponHeight);
}

// ─── BUCLE DEL JUEGO ───
function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}
