document.addEventListener("DOMContentLoaded", function () {
  // Obtener (o crear) el footer
  let footer = document.getElementById("gameFooter");
  if (!footer) {
    footer = document.createElement("footer");
    footer.id = "gameFooter";
    footer.style.position = "fixed";
    footer.style.bottom = "0";
    footer.style.left = "0";
    footer.style.width = "100%";
    footer.style.height = "15vh";
    footer.style.background = "#222";
    footer.style.boxSizing = "border-box";
    footer.style.display = "flex";
    footer.style.justifyContent = "space-between";
    footer.style.alignItems = "center";
    footer.style.padding = "0 5px";
    document.body.appendChild(footer);
  }

  // ─── D-PAD (IZQUIERDA) ───
  const dpadContainer = document.createElement("div");
  dpadContainer.style.flex = "0 0 auto";
  dpadContainer.style.display = "flex";
  dpadContainer.style.alignItems = "center";

  const dpadSize = footer.clientHeight * 0.8;
  const dpad = document.createElement("div");
  dpad.style.display = "grid";
  dpad.style.gridTemplateColumns = "repeat(3, 1fr)";
  dpad.style.gridTemplateRows = "repeat(3, 1fr)";
  dpad.style.width = dpadSize + "px";
  dpad.style.height = dpadSize + "px";
  dpad.style.gap = "2px";

  function createBtn(label, gridCol, gridRow) {
    const btn = document.createElement("button");
    btn.innerHTML = label;
    btn.style.fontSize = "1rem";
    btn.style.cursor = "pointer";
    btn.style.gridColumn = gridCol;
    btn.style.gridRow = gridRow;
    return btn;
  }

  const btnUp    = createBtn("▲", "2 / 3", "1 / 2");
  const btnLeft  = createBtn("◀", "1 / 2", "2 / 3");
  const btnDown  = createBtn("▼", "2 / 3", "3 / 4");
  const btnRight = createBtn("▶", "3 / 4", "2 / 3");

  dpad.appendChild(btnUp);
  dpad.appendChild(btnLeft);
  dpad.appendChild(btnDown);
  dpad.appendChild(btnRight);
  dpadContainer.appendChild(dpad);

  // ─── MINIMAPA + VIDA (CENTRO) ───
  const middleContainer = document.createElement("div");
  middleContainer.style.flex = "0 0 auto";
  middleContainer.style.display = "flex";
  middleContainer.style.alignItems = "center";
  middleContainer.style.gap = "1rem";

  // Minimap
  const minimapSize = footer.clientHeight * 0.8;
  const minimapCanvas = document.createElement("canvas");
  minimapCanvas.id = "minimapCanvas"; 
  minimapCanvas.width = minimapSize;
  minimapCanvas.height = minimapSize;
  minimapCanvas.style.background = "#000";

  // Contenedor de la vida (texto a la derecha del mapa)
  const lifeContainer = document.createElement("div");
  lifeContainer.id = "lifeContainer";
  lifeContainer.style.color = "white";
  lifeContainer.style.fontFamily = "sans-serif";
  lifeContainer.style.fontSize = "1rem";

  // Aquí se actualizará el texto de la vida
  const lifeLabel = document.createElement("span");
  lifeLabel.id = "lifeLabel"; 
  lifeContainer.appendChild(lifeLabel);

  middleContainer.appendChild(minimapCanvas);
  middleContainer.appendChild(lifeContainer);

  // ─── BOTÓN DE DISPARO (DERECHA) ───
  const shootContainer = document.createElement("div");
  shootContainer.style.flex = "0 0 auto";
  shootContainer.style.display = "flex";
  shootContainer.style.alignItems = "center";

  const shootBtn = document.createElement("button");
  shootBtn.innerHTML = "Disparar";
  shootBtn.style.width = "12vh";
  shootBtn.style.height = "12vh";
  shootBtn.style.borderRadius = "50%";
  shootBtn.style.fontSize = "1rem";
  shootBtn.style.cursor = "pointer";
  shootContainer.appendChild(shootBtn);

  // AÑADIMOS TODOS LOS CONTENEDORES AL FOOTER
  footer.appendChild(dpadContainer);
  footer.appendChild(middleContainer);
  footer.appendChild(shootContainer);

  // ─── EVENTOS DE LOS BOTONES ───
  function addButtonEvents(button, key) {
    button.addEventListener("touchstart", function(e) {
      e.preventDefault();
      window.keys[key] = true;
    });
    button.addEventListener("touchend", function(e) {
      e.preventDefault();
      window.keys[key] = false;
    });
    button.addEventListener("mousedown", function(e) {
      e.preventDefault();
      window.keys[key] = true;
    });
    button.addEventListener("mouseup", function(e) {
      e.preventDefault();
      window.keys[key] = false;
    });
  }
  // La cruceta imita el left stick del gamepad:
  // Vertical: arriba = "w", abajo = "s"
  // Horizontal: izquierda y derecha se mantienen "ArrowLeft" y "ArrowRight"
  addButtonEvents(btnUp,    "w");
  addButtonEvents(btnLeft,  "q");
  addButtonEvents(btnDown,  "s");
  addButtonEvents(btnRight, "e");

  // Disparo al pulsar el botón
  shootBtn.addEventListener("touchstart", function(e) {
    e.preventDefault();
    if (typeof window.shootBullet === "function") window.shootBullet();
  });
  shootBtn.addEventListener("mousedown", function(e) {
    e.preventDefault();
    if (typeof window.shootBullet === "function") window.shootBullet();
  });

  // ─── BOTONES DE GIRO (SOLO EN VISTA MÓVIL) ───
  // Se crean dos botones, uno para girar a la izquierda y otro para girar a la derecha,
  // posicionados en la parte superior del footer.
  const rotateContainer = document.createElement("div");
  rotateContainer.id = "rotateContainer";
  rotateContainer.style.position = "fixed";
  rotateContainer.style.bottom = "calc(15vh + 20px)"; // Encima del footer y 20px más arriba
  rotateContainer.style.left = "0";
  rotateContainer.style.width = "100%";
  rotateContainer.style.display = "none"; // Se mostrará solo en vista móvil mediante media query
  rotateContainer.style.justifyContent = "flex-end"; // Alineados a la derecha
  rotateContainer.style.gap = "30px"; // Espacio de 30px entre ellos
  rotateContainer.style.padding = "0 10px";
  rotateContainer.style.boxSizing = "border-box";

  const btnRotateLeft = document.createElement("button");
  btnRotateLeft.innerHTML = "◀";
  btnRotateLeft.style.fontSize = "1.5rem";
  btnRotateLeft.style.cursor = "pointer";

  const btnRotateRight = document.createElement("button");
  btnRotateRight.innerHTML = "▶";
  btnRotateRight.style.fontSize = "1.5rem";
  btnRotateRight.style.cursor = "pointer";

  rotateContainer.appendChild(btnRotateLeft);
  rotateContainer.appendChild(btnRotateRight);
  document.body.appendChild(rotateContainer);

  function addRotateButtonEvents(button, key) {
    button.addEventListener("touchstart", function(e) {
      e.preventDefault();
      window.keys[key] = true;
    });
    button.addEventListener("touchend", function(e) {
      e.preventDefault();
      window.keys[key] = false;
    });
    button.addEventListener("mousedown", function(e) {
      e.preventDefault();
      window.keys[key] = true;
    });
    button.addEventListener("mouseup", function(e) {
      e.preventDefault();
      window.keys[key] = false;
    });
  }
  // Los nuevos botones de giro ahora hacen lo mismo que los botones izquierda y derecha de la cruceta
  addRotateButtonEvents(btnRotateLeft, "ArrowLeft");
  addRotateButtonEvents(btnRotateRight, "ArrowRight");

  // ─── MEDIA QUERY PARA VISTA MÓVIL ───
  const styleEl = document.createElement("style");
  styleEl.innerHTML = `
    @media (max-width: 768px) {
      #rotateContainer {
        display: flex !important;
      }
    }
  `;
  document.head.appendChild(styleEl);
});
