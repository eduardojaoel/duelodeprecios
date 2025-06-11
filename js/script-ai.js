document.addEventListener("DOMContentLoaded", () => {
  // --- Referencias a Elementos del DOM ---
  const startScreen = document.getElementById("start-screen");
  const gameScreen = document.getElementById("game-screen");
  const gameOverScreen = document.getElementById("game-over-screen"); // ¡Necesitarás añadir esto a tu HTML!

  const playButton = document.getElementById("play-button");
  const highScoreDisplay = document.getElementById("high-score-value");
  const currentScoreDisplay = document.getElementById("current-score");

  const productLeftDiv = document.getElementById("product-left");
  const productRightDiv = document.getElementById("product-right");

  const higherButton = document.getElementById("higher-button"); // ¡Necesitarás añadir esto!
  const lowerButton = document.getElementById("lower-button"); // ¡Necesitarás añadir esto!

  const finalScoreDisplay = document.getElementById("final-score"); // ¡Necesitarás añadir esto!
  const gameOverHighScoreDisplay = document.getElementById(
    "game-over-high-score"
  ); // ¡Necesitarás añadir esto!
  const playAgainButton = document.getElementById("play-again-button"); // ¡Necesitarás añadir esto!

  // --- Variables Globales del Juego ---
  let allProducts = [];
  let productLeft = null;
  let productRight = null;
  let currentScore = 0;
  let highScore = 0;
  let canGuess = true; // Para evitar clics múltiples mientras se revela/cambia.

  const HIGH_SCORE_KEY = "higherLowerArcadeHighScore"; // Clave para Local Storage

  // --- Funciones de Utilidad ---

  // Carga el High Score al inicio
  function loadHighScore() {
    highScore = localStorage.getItem(HIGH_SCORE_KEY) || 0;
    highScoreDisplay.textContent = highScore;
    if (gameOverHighScoreDisplay)
      gameOverHighScoreDisplay.textContent = highScore;
  }

  // Guarda el High Score si es nuevo
  function saveHighScore() {
    if (currentScore > highScore) {
      highScore = currentScore;
      localStorage.setItem(HIGH_SCORE_KEY, highScore);
      loadHighScore(); // Actualiza la pantalla
    }
  }

  // Obtiene un producto aleatorio
  function getRandomProduct() {
    return allProducts[Math.floor(Math.random() * allProducts.length)];
  }

  // Muestra/Oculta pantallas
  function showScreen(screenToShow) {
    startScreen.classList.remove("active");
    gameScreen.classList.remove("active");
    gameOverScreen.classList.remove("active");
    screenToShow.classList.add("active");
  }

  // Muestra un producto en su div correspondiente
  function displayProduct(product, side, revealPrice = false) {
    const div = side === "left" ? productLeftDiv : productRightDiv;
    const priceToShow =
      side === "left" || revealPrice
        ? `$${product.price.toFixed(2)}` // Muestra precio
        : `¿?`; // Oculta precio

    div.innerHTML = `
            <img src="images/${product.image}" alt="${
      product.title
    }" class="product-image">
            <h3 class="product-title">${product.title}</h3>
            <p class="product-price ${revealPrice ? "revealed" : ""}">
                Precio: <span class="price-value">${priceToShow}</span>
            </p>
        `;
  }

  // --- Lógica del Juego ---

  // Prepara la siguiente (o primera) ronda
  function prepareNextRound(previousRight = null) {
    productLeft = previousRight || getRandomProduct();
    productRight = getRandomProduct();

    // Asegurarse de que no sean el mismo y, si es posible, de diferente precio
    let attempts = 0;
    while (
      (productLeft.image === productRight.image ||
        productLeft.price === productRight.price) &&
      attempts < 50
    ) {
      productRight = getRandomProduct();
      attempts++; // Evita bucle infinito si hay pocos productos/precios
    }

    console.log(
      "Ronda:",
      productLeft.title,
      `($${productLeft.price})`,
      "vs",
      productRight.title
    );
    displayProduct(productLeft, "left");
    displayProduct(productRight, "right", false); // Oculta el precio derecho
    canGuess = true; // Permite adivinar de nuevo
  }

  // Maneja la suposición del usuario
  function handleGuess(guess) {
    if (!canGuess) return; // Si no se puede adivinar, sale
    canGuess = false; // Bloquea nuevos clics

    // 1. Revela el precio
    displayProduct(productRight, "right", true);

    // 2. Compara
    const isHigher = productRight.price > productLeft.price;
    const isCorrect =
      (guess === "higher" && isHigher) || (guess === "lower" && !isHigher);

    // 3. Aplica feedback visual (opcional, con CSS)
    const rightCard = productRightDiv;
    rightCard.classList.add(isCorrect ? "correct-guess" : "wrong-guess");

    // 4. Espera un momento antes de continuar
    setTimeout(() => {
      rightCard.classList.remove("correct-guess", "wrong-guess"); // Limpia feedback

      if (isCorrect) {
        currentScore++;
        currentScoreDisplay.textContent = currentScore;
        prepareNextRound(productRight); // Pasa al siguiente
      } else {
        triggerGameOver(); // Fin del juego
      }
    }, 1500); // Espera 1.5 segundos para ver el resultado
  }

  // Inicia el juego
  function startGame() {
    currentScore = 0;
    currentScoreDisplay.textContent = currentScore;
    prepareNextRound(); // Prepara la primera ronda (no pasa nada)
    showScreen(gameScreen);
  }

  // Finaliza el juego
  function triggerGameOver() {
    saveHighScore();
    finalScoreDisplay.textContent = currentScore;
    showScreen(gameOverScreen);
  }

  // Reinicia para jugar de nuevo
  function restartGame() {
    loadHighScore(); // Asegura que el High Score esté actualizado en la pantalla de inicio
    showScreen(startScreen);
    // La carga de productos ya está hecha, pero deshabilitamos el botón
    // y lo volvemos a habilitar para que el flujo sea igual.
    playButton.disabled = true;
    playButton.textContent = "Cargando...";
    // Simulamos una pequeña carga o simplemente preparamos la ronda
    setTimeout(() => {
      prepareNextRound(); // Prepara la primera ronda para la nueva partida
      playButton.disabled = false;
      playButton.textContent = "¡JUGAR!";
    }, 100);
  }

  // --- Carga Inicial de Datos ---
  async function initializeGameData() {
    loadHighScore();
    try {
      console.log("Iniciando carga de productos...");
      const response = await fetch("data/products.json");
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      allProducts = await response.json();

      if (allProducts.length < 2)
        throw new Error("No hay suficientes productos.");

      console.log(`Cargados ${allProducts.length} productos.`);
      prepareNextRound(); // Prepara los DOS primeros productos

      playButton.disabled = false;
      playButton.textContent = "¡JUGAR!";
      console.log("¡Juego listo para empezar!");
    } catch (error) {
      console.error("Error fatal al cargar los datos del juego:", error);
      playButton.textContent = "Error al Cargar";
      startScreen.innerHTML += `<p class="error-message">No se pudieron cargar los datos. Intenta recargar la página.</p>`;
    }
  }

  // --- Asignación de Event Listeners ---
  playButton.addEventListener("click", startGame);
  higherButton.addEventListener("click", () => handleGuess("higher"));
  lowerButton.addEventListener("click", () => handleGuess("lower"));
  playAgainButton.addEventListener("click", restartGame);

  // --- ¡Empieza Todo! ---
  initializeGameData();
}); // Fin del DOMContentLoaded
