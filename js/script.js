document.addEventListener("DOMContentLoaded", () => {
  // --- 1. Referencias a Elementos del DOM ---
  const startScreen = document.getElementById("start-screen");
  const gameScreen = document.getElementById("game-screen");
  const gameOverScreen = document.getElementById("game-over-screen");

  const logo = document.getElementById("logo"); // Asegúrate que este ID exista en tu HTML si lo usas
  const introTextElement = document.getElementById("intro-text");
  const playButton = document.getElementById("play-button");
  const highScoreDisplay = document.querySelectorAll(".high-score-value");
  const currentScoreDisplay = document.getElementById("current-score");
  const scoreFlamme = document.getElementById("score-flamme");

  const gameArena = document.getElementById("game-arena");

  const higherButton = document.getElementById("higher-button");
  const lowerButton = document.getElementById("lower-button");

  const finalScoreDisplay = document.getElementById("final-score");
  const gameOverHighScoreDisplay = document.getElementById(
    "game-over-high-score"
  );
  const playAgainButton = document.getElementById("play-again-button");

  const sfxScannerBeep = document.getElementById("sfx-scanner-beep");
  const sfxCharging = document.getElementById("sfx-charging");
  const sfxCorrect = document.getElementById("sfx-correct");
  const sfxIncorrect = document.getElementById("sfx-incorrect");

  // --- 2. Variables Globales y Constantes del Juego ---
  let allProducts = [];
  let outOfViewElements = [];
  let productReference = null; // Producto actual de referencia (el de arriba)
  let productToGuess = null; // Producto actual a adivinar (el de abajo)
  let currentScore = 0;
  let highScore = 0;
  let canGuess = true;
  let isLoading = true;
  let currentTranslate = 0;
  let gameArenaHeight = 0;

  const HIGH_SCORE_KEY = "higherLowerArcadeHighScore_v4";
  const PLAYER_ID_KEY = "higherLowerArcadePlayerId_v4";
  const GAME_VERSION = "1.3";

  // ¡¡¡IMPORTANTE!!! Reemplaza estas con tus URLs y Claves Reales de Supabase
  const SUPABASE_FUNCTION_URL =
    "https://ooatrkqiysrrwijbchej.supabase.co/functions/v1/log-partida"; // Usa tu URL desplegada
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXRya3FpeXNycndpamJjaGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4OTI1ODgsImV4cCI6MjA2NDQ2ODU4OH0.SJB5Rc323ASOebF-aBdZVd9SZg5QXUXeyo4zj3FMWqg"; // Tu Anon Key pública

  // --- 3. Mensajes de Introducción ---
  const introMessages = [
    "Nadie se ha hecho millonario jugando a esto (que sepamos). Pero la gloria en Duelo de Precios... esa es otra historia. ¿La escribes?",
    "Si tuvieras un superpoder, ¿sería adivinar precios? Pues aquí puedes probar esa teoría. (No requiere capa).",
    "No te vamos a pedir la tarjeta de crédito, solo tu mejor instinto para los precios. ¿Trato hecho?",
    "Advertencia: Jugar esto podría hacerte cuestionar todas tus decisiones de compra pasadas. O simplemente divertirte un rato. ¡Vale la pena!",
    "Tranqui, aquí no hay 'análisis de mercado' ni 'KPIs'. Solo precios, tu instinto y un botón de ¡PLAY! ¿Así o más fácil?",
    "Ponte cómodo/a. Aquí no hay colas ni carritos abandonados, solo la pura emoción de adivinar precios. ¿Le entras?",
    "No te preocupes, no vamos a juzgar tus hábitos de compra. Solo tu habilidad para decir '¡Más alto!' o '¡Más bajo!'.",
    "No te prometemos un premio millonario, pero sí el derecho universal a presumir tu puntaje más alto.",
    "Si 'comparar precios' es tu segundo nombre, este juego debería ser tu apellido. ¡Demuéstralo!",
    "Esto no es el Black Friday, pero la emoción de acertar un precio se le parece. (Y sin empujones).",
    "¿Tu carrito online siempre está lleno pero tu cartera no tanto? Aquí, al menos, solo arriesgas puntos.",
    "Aquí no hace falta un título en economía, basta con ese 'olfato' para saber si algo está 'carísimo' o es un '¡dame dos!'. ¿Qué tan agudo es el tuyo?",
    "No te pediremos el diploma de economista, pero sí que actives ese 'radar' especial que detecta si algo está 'por las nubes' o es un '¡directo al carrito!'. ¿Lo tienes calibrado?",
  ];

  function displayRandomIntroMessage() {
    if (introTextElement && introMessages.length > 0) {
      const randomIndex = Math.floor(Math.random() * introMessages.length);
      introTextElement.textContent = introMessages[randomIndex];
    }
  }

  // --- 4. Funciones de Utilidad ---
  function loadHighScoreFromStorage() {
    highScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
    highScoreDisplay.forEach((display) => {
      display.textContent = highScore;
    });
    if (gameOverHighScoreDisplay)
      gameOverHighScoreDisplay.textContent = highScore;
  }

  function saveHighScoreToStorage() {
    if (currentScore > highScore) {
      highScore = currentScore;
      localStorage.setItem(HIGH_SCORE_KEY, highScore);
      loadHighScoreFromStorage();
      scoreFlamme.style.display = "block";
    }
  }

  function obtenerPlayerId() {
    let playerId = localStorage.getItem(PLAYER_ID_KEY);
    if (!playerId) {
      playerId =
        "player_" +
        Date.now().toString(36) +
        Math.random().toString(36).substring(2, 9);
      localStorage.setItem(PLAYER_ID_KEY, playerId);
    }
    return playerId;
  }

  function getRandomProduct(excludeProduct = null) {
    if (allProducts.length === 0) return null;
    let product;
    let attempts = 0;
    const maxAttempts = allProducts.length * 2;

    do {
      product = allProducts[Math.floor(Math.random() * allProducts.length)];
      attempts++;
    } while (
      allProducts.length > 1 &&
      excludeProduct &&
      product.image === excludeProduct.image &&
      attempts < maxAttempts
    );

    if (
      allProducts.length > 1 &&
      excludeProduct &&
      product.image === excludeProduct.image &&
      attempts >= maxAttempts
    ) {
      console.warn(
        "No se pudo encontrar un producto completamente diferente. Puede haber repetición o se están acabando los productos únicos."
      );
    }
    return product;
  }

  function showScreen(screenToShow) {
    startScreen.classList.remove("active");
    gameScreen.classList.remove("active");
    gameOverScreen.classList.remove("active");
    screenToShow.classList.add("active");

    if (logo) {
      if (screenToShow == gameScreen) {
        logo.classList.remove("active");
      } else if (screenToShow == startGame) {
        logo.classList.add("active");
      }
    }
  }

  class AudioEngine {
    constructor() {
      // 1. Crear el Contexto de Audio. Es el corazón de la Web Audio API.
      // Se maneja el prefijo 'webkit' para máxima compatibilidad con Safari.
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      this.soundBuffers = {}; // Objeto para guardar los sonidos ya decodificados.
      this.isReady = false;

      // Desbloquear el audio en iOS/Chrome con la primera interacción del usuario.
      const unlockAudio = () => {
        if (this.audioContext.state === "suspended") {
          this.audioContext.resume();
        }
        // Remover el listener una vez que se ejecute.
        document.body.removeEventListener("touchstart", unlockAudio);
        document.body.removeEventListener("click", unlockAudio);
      };
      document.body.addEventListener("touchstart", unlockAudio, { once: true });
      document.body.addEventListener("click", unlockAudio, { once: true });
    }

    /**
     * Carga un único archivo de audio, lo decodifica y lo guarda en el buffer.
     * @param {string} name - El nombre clave para el sonido (ej: 'beep').
     * @param {string} url - La URL completa del archivo de audio.
     * @returns {Promise<AudioBuffer>}
     */
    async loadSound(name, url) {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        // Decodifica el archivo (MP3, WAV, etc.) a datos de audio puros.
        const audioBuffer = await this.audioContext.decodeAudioData(
          arrayBuffer
        );
        this.soundBuffers[name] = audioBuffer;
      } catch (error) {
        console.error(`Error al cargar el sonido ${name} desde ${url}:`, error);
        throw error;
      }
    }

    /**
     * Carga una lista de sonidos y ejecuta una función cuando todo está listo.
     * @param {object} soundPaths - Objeto con los nombres y rutas relativas de los sonidos.
     * @param {string} hostUrl - La URL base para construir las rutas completas.
     * @param {function} onReadyCallback - La función a llamar cuando todo esté cargado.
     */
    async loadAllSounds(soundPaths, hostUrl, onReadyCallback) {
      console.log("🚀 Iniciando carga robusta de sonidos...");
      const loadPromises = [];
      for (const name in soundPaths) {
        const url = hostUrl + soundPaths[name];
        loadPromises.push(this.loadSound(name, url));
      }

      try {
        await Promise.all(loadPromises);
        this.isReady = true;
        console.log(
          "✅ Motor de audio listo. Todos los sonidos decodificados y en memoria."
        );
        if (onReadyCallback) {
          onReadyCallback();
        }
      } catch (error) {
        console.error("Falló la carga de uno o más sonidos.", error);
      }
    }

    /**
     * Reproduce un sonido desde el buffer.
     * @param {string} name - El nombre del sonido a reproducir.
     * @param {object} [options] - Opciones como volumen y velocidad.
     * @param {number} [options.volume=1] - Volumen de 0.0 a 1.0 (o más).
     * @param {number} [options.rate=1] - Velocidad de reproducción (1 = normal).
     */
    play(name, options = {}) {
      if (!this.soundBuffers[name]) {
        console.warn(`Sonido "${name}" no encontrado o no cargado.`);
        return;
      }

      // --- Creación de la cadena de nodos de audio ---

      // 1. La fuente: El buffer con los datos del sonido.
      const source = this.audioContext.createBufferSource();
      source.buffer = this.soundBuffers[name];
      source.playbackRate.value = options.rate || 1;

      // 2. El control de volumen: Un nodo de ganancia.
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = options.volume !== undefined ? options.volume : 1;

      // 3. Conectar los nodos en una cadena: source -> gain -> speakers
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // 4. ¡Reproducir!
      source.start(0);
    }
  }

  // --- CÓMO USAR EL MOTOR DE AUDIO ---

  // 1. Definir las rutas (como ya lo tenías)
  const hostUrl = "https://eduardojaoel.github.io/duelodeprecios/";
  const soundPaths = {
    charging: "audios/sfx-charging.mp3",
    correct: "audios/sfx-correct.mp3",
    incorrect: "audios/sfx-incorrect.mp3",
    beep: "audios/sfx-scanner-beep.mp3",
  };

  // 2. Crear una instancia del motor.
  const audio = new AudioEngine();

  // 3. Cargar todos los sonidos y definir qué hacer cuando estén listos.
  audio.loadAllSounds(soundPaths, hostUrl, () => {
    // Esta función se ejecuta cuando todo está listo.
    // Aquí puedes habilitar la interfaz de usuario.
    console.log("La aplicación está lista para usarse.");
    document.getElementById("miBotonDeJuego").disabled = false;
  });

  // --- 5. Funciones de Actualización de UI ---
  function addProductToArena(product, role, showPrice) {
    const container = document.createElement("div");
    container.classList.add("product-display-container");
    container.dataset.productRole = role;

    const card = document.createElement("div");
    card.classList.add("product-card");

    const priceToShow = showPrice
      ? `$${product.price.toFixed(2)}`
      : `<span class="char">?</span><span class="char">?</span><span class="char">?</span>`;
    const displayTitle =
      product.title || product.original_title || "Producto Desconocido";
    const displayBrand = product.brand || "";
    const displayCategory = product.category || "";
    const displayMeasure = product.measure || "";

    card.innerHTML = `
            <img src="images/${
              product.image
            }" alt="${displayTitle}" class="product-image">
            <div class="product-content">
                ${
                  displayCategory
                    ? `<span class="product-category">${displayCategory}</span>`
                    : ""
                }
                ${
                  displayBrand
                    ? `<span class="product-brand">${displayBrand}</span>`
                    : ""
                }
                <h3 class="product-title">${displayTitle}</h3>
                ${
                  displayMeasure
                    ? `<span class="product-measure">${displayMeasure}</span>`
                    : ""
                }
                <p class="product-price ${showPrice ? "revealed" : ""}">
                  <span class="price-value">${priceToShow}</span>
                </p>
            </div>
        `;
    container.appendChild(card);
    gameArena.appendChild(container); // Añade al final

    if (role == "guess") {
      document.getElementById("controls-product-label").textContent =
        displayTitle;
    }
    return container;
  }

  function updateCurrentScoreDisplay() {
    currentScoreDisplay.textContent = currentScore;
  }

  // --- 6. Lógica Principal del Juego ---
  async function initializeGameData() {
    isLoading = true;
    playButton.disabled = true;
    playButton.innerHTML = `<span>Empezar</span> <svg width="13" height="21" viewBox="0 0 13 21" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.9758 0.572754H0.97583V6.57275H2.97583V8.57275H4.97583V12.5728H2.97583V14.5728H0.97583V20.5728H12.9758V14.5728H10.9758V12.5728H8.97583V8.57275H10.9758V6.57275H12.9758V0.572754ZM10.9758 6.57275H8.97583V8.57275H4.97583V6.57275H2.97583V2.57275H10.9758V6.57275ZM8.97583 12.5728V14.5728H10.9758V18.5728H2.97583V14.5728H4.97583V12.5728H8.97583Z" fill="#023A50"/>
</svg>
`;
    displayRandomIntroMessage();
    loadHighScoreFromStorage();

    try {
      const response = await fetch("data/test_products_v1.json"); // Asegúrate que esta sea la ruta correcta
      if (!response.ok)
        throw new Error(
          `Error HTTP: ${response.status} al cargar products.json`
        );
      allProducts = await response.json();

      if (allProducts.length < 2) {
        throw new Error("No hay suficientes productos para iniciar el juego.");
      }
      console.log(`Cargados ${allProducts.length} productos.`);

      setupFirstRound();

      setTimeout(() => {
        setGameArenaHeight();
        isLoading = false;
        playButton.disabled = false;
        playButton.classList.remove("is-disabled");
        playButton.innerHTML = `<span>Empezar</span> <svg width="17" height="21" viewBox="0 0 17 21" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.729 20.5728H0.729004V0.572754H4.729V3.07275H8.729V6.82275H12.729V9.32275H16.729V11.8228H12.729V14.3228H8.729V18.0728H4.729V20.5728Z" fill="#023A50"/></svg>`;
        console.log("¡Datos listos para el juego!");
      }, 500);
    } catch (error) {
      console.error("Error fatal al cargar los datos del juego:", error);
      playButton.textContent = "Error al Cargar";
      if (introTextElement)
        introTextElement.textContent =
          "Oops! No pudimos cargar los productos. Por favor, recarga la página.";
    }
  }

  function setupFirstRound() {
    productReference = getRandomProduct();
    productToGuess = getRandomProduct(productReference);

    if (!productReference || !productToGuess) {
      console.error(
        "No se pudieron obtener los productos iniciales para la primera ronda."
      );
      playButton.textContent = "Error Productos";
      playButton.disabled = true;
      return false;
    }

    gameArena.innerHTML = ""; // Limpiar arena por si acaso

    const refEl = addProductToArena(productReference, "reference", true);
    const guessEl = addProductToArena(productToGuess, "guess", false);

    // Forzar reflujo para que las animaciones de entrada funcionen
    void refEl.offsetWidth;
    void guessEl.offsetWidth;

    refEl.classList.add("in-view");
    guessEl.classList.add("in-view");

    return true;
  }

  function startGame() {
    if (isLoading || allProducts.length < 2) {
      console.warn("Los datos del juego no están listos o no son suficientes.");
      return;
    }
    currentScore = 0;
    updateCurrentScoreDisplay();
    /* if (!setupFirstRound()) {
      return; // No iniciar si la configuración falla
    } */
    canGuess = true;
    showScreen(gameScreen);
  }

  function animatePriceReveal(
    initialNumber,
    finalNumber,
    animationDuration,
    priceElement,
    guess,
    productToGuessPrice,
    productReferencePrice
  ) {
    if (!priceElement || typeof priceElement.textContent === "undefined") {
      console.error(
        "Invalid or unprovided DOM element. The animation will be displayed in the console."
      );
    }
    let validated = false;
    console.log(guess);

    const initialValueNum = parseFloat(initialNumber);
    const finalValueNum = parseFloat(finalNumber);
    let startTime = null;

    function updateDisplay(textValue) {
      if (priceElement && typeof priceElement.textContent !== "undefined") {
        priceElement.textContent = "$" + textValue;
      } else {
        console.log(textValue);
      }
    }

    priceElement.parentNode.classList.add("animate-price-reveal");

    updateDisplay(initialValueNum.toFixed(2));

    if (initialValueNum === finalValueNum || animationDuration <= 0) {
      updateDisplay(finalValueNum.toFixed(2));
      console.log(
        `Animation unnecessary or duration is zero. Final value ${finalValueNum.toFixed(
          2
        )} set.`
      );
      return;
    }

    const wrongIcon = `<svg class="validation-icon" width="19" height="18" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.75 0.25H3.25V2.75H0.75V0.25ZM5.75 5.25H3.25V2.75H5.75V5.25ZM8.25 7.75H5.75V5.25H8.25V7.75ZM10.75 7.75H8.25V10.25H5.75V12.75H3.25V15.25H0.75V17.75H3.25V15.25H5.75V12.75H8.25V10.25H10.75V12.75H13.25V15.25H15.75V17.75H18.25V15.25H15.75V12.75H13.25V10.25H10.75V7.75ZM13.25 5.25V7.75H10.75V5.25H13.25ZM15.75 2.75V5.25H13.25V2.75H15.75ZM15.75 2.75V0.25H18.25V2.75H15.75Z" fill="#FF6C6C"/>
            </svg>
            `;
    const checkIcon = `<svg class="validation-icon" width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M17.5 0.5H20V3H17.5V0.5ZM15 5.5V3H17.5V5.5H15ZM12.5 8V5.5H15V8H12.5ZM10 10.5H12.5V8H10V10.5ZM7.5 13H10V10.5H7.5V13ZM5 13V15.5H7.5V13H5ZM2.5 10.5H5V13H2.5V10.5ZM2.5 10.5H0V8H2.5V10.5Z" fill="#81FF6C"/>
</svg>
`;

    function animationFrame(timestamp) {
      if (!startTime) {
        startTime = timestamp;
      }

      const elapsedTime = timestamp - startTime;
      let progress = elapsedTime / animationDuration;
      progress = Math.min(progress, 1);

      const currentValue =
        initialValueNum + (finalValueNum - initialValueNum) * progress;

      updateDisplay(currentValue.toFixed(2));

      if (progress < 1) {
        requestAnimationFrame(animationFrame);
        if (
          guess == "lower" &&
          currentValue > productReferencePrice &&
          !validated
        ) {
          priceElement.parentNode.classList.add("wrong-guess");
          priceElement.parentNode.insertAdjacentHTML("beforeend", wrongIcon);
          priceElement.parentNode
            .querySelector(".validation-icon")
            .classList.add("icon-fade-in");
          validated = true;
          audio.play("incorrect");
        }

        if (
          guess == "higher" &&
          currentValue > productReferencePrice &&
          !validated
        ) {
          priceElement.parentNode.classList.add("good-guess");
          priceElement.parentNode.insertAdjacentHTML("beforeend", checkIcon);
          priceElement.parentNode
            .querySelector(".validation-icon")
            .classList.add("icon-fade-in");
          validated = true;
          audio.play("correct");

          setTimeout(() => {
            priceElement.parentNode.classList.remove("good-guess");
            priceElement.parentNode
              .querySelector(".validation-icon")
              .classList.add("icon-fade-out");
          }, 1500);
        }
      } else {
        updateDisplay(finalValueNum.toFixed(2));
        if (
          guess == "higher" &&
          currentValue < productReferencePrice &&
          !validated
        ) {
          priceElement.parentNode.classList.add("wrong-guess");
          priceElement.parentNode.insertAdjacentHTML("beforeend", wrongIcon);
          priceElement.parentNode
            .querySelector(".validation-icon")
            .classList.add("icon-fade-in");
          validated = true;
          audio.play("incorrect");
        }
        if (
          guess == "lower" &&
          currentValue < productReferencePrice &&
          !validated
        ) {
          priceElement.parentNode.classList.add("good-guess");
          priceElement.parentNode.insertAdjacentHTML("beforeend", checkIcon);
          priceElement.parentNode
            .querySelector(".validation-icon")
            .classList.add("icon-fade-in");
          validated = true;
          audio.play("correct");

          setTimeout(() => {
            priceElement.parentNode.classList.remove("good-guess");
            priceElement.parentNode
              .querySelector(".validation-icon")
              .classList.add("icon-fade-out");
          }, 1500);
        }
        console.log(
          `Animation completed in approximately ${
            animationDuration / 1000
          } seconds.`
        );
      }
    }

    requestAnimationFrame(animationFrame);
  }

  /* const testElement = document.querySelector(".rainbow-text"); */

  function handleGuess(guess) {
    if (!canGuess || !productReference || !productToGuess) return;
    canGuess = false;

    const currentReferenceElement = gameArena.querySelector(
      '[data-product-role="reference"].in-view'
    );
    const currentGuessElement = gameArena.querySelector(
      '[data-product-role="guess"].in-view'
    );

    if (!currentGuessElement || !currentReferenceElement) {
      console.error("No se encontraron los elementos de producto activos.");
      canGuess = true;
      return;
    }
    const currentGuessCard = currentGuessElement.querySelector(".product-card");
    const priceElement = currentGuessCard.querySelector(
      ".product-price .price-value"
    );

    /* priceElement.textContent = `$${productToGuess.price.toFixed(2)}`;
    currentGuessCard.querySelector(".product-price").classList.add("revealed"); */

    const isHigher = productToGuess.price > productReference.price;
    const pricesAreEqual = productToGuess.price === productReference.price;
    let isCorrect = pricesAreEqual
      ? true
      : (guess === "higher" && isHigher) || (guess === "lower" && !isHigher);

    /* currentGuessCard.classList.add(isCorrect ? "correct-guess" : "wrong-guess"); */

    animatePriceReveal(
      0.0,
      productToGuess.price,
      1000,
      priceElement,
      guess,
      productToGuess.price,
      productReference.price
    );

    setTimeout(() => {
      currentGuessCard.classList.remove("correct-guess", "wrong-guess");

      if (isCorrect) {
        currentScore++;
        updateCurrentScoreDisplay();
        saveHighScoreToStorage();
        loadHighScoreFromStorage();
        audio.play("beep");

        outOfViewElements.push(currentReferenceElement);

        setGameArenaTranslate();

        currentReferenceElement.classList.remove("in-view");
        currentReferenceElement.classList.add("out-view");
        setTimeout(() => {
          setGameArenaHeight();
          if (currentReferenceElement.parentNode) {
            // Chequeo extra
            /* currentReferenceElement.remove(); */
          }
        }, 500); // Tiempo para animación de salida

        currentGuessElement.dataset.productRole = "reference"; // El que se adivinó, ahora es referencia
        // No necesitamos quitar y poner 'in-view' si ya está y se queda.

        productReference = productToGuess; // El B anterior es el nuevo A
        productToGuess = getRandomProduct(productReference); // Nuevo B

        if (!productToGuess) {
          console.log(
            "Se acabaron los productos o no se pudo encontrar uno nuevo para adivinar."
          );
          triggerGameOver();
          return;
        }

        const newGuessElement = addProductToArena(
          productToGuess,
          "guess",
          false
        );
        void newGuessElement.offsetWidth; // Forzar reflujo
        newGuessElement.classList.add("in-view");

        canGuess = true;
      } else {
        triggerGameOver();
      }
    }, 2000);
  }

  function setGameArenaHeight() {
    const productsInView = document.querySelectorAll(".in-view");

    gameArenaHeight = 0;

    productsInView.forEach((productInView) => {
      console.log("productInViewHeight: ", productInView.offsetHeight);
      gameArenaHeight += productInView.offsetHeight;
    });

    gameArena.style.height = `calc(${gameArenaHeight}px + 10px) `;
    console.log("La altura del contenedor debería ser: ", gameArenaHeight);
  }
  function setGameArenaTranslate() {
    let outOfViewHeight = 0;

    outOfViewElements.forEach((element) => {
      outOfViewHeight += element.offsetHeight;
    });

    gameArena.style.transform = `translateY(calc(-${outOfViewHeight}px - ${
      currentScore * 10
    }px))`;
  }

  async function logScoreToDB() {
    const gameData = {
      score: currentScore,
      timestamp: new Date().toISOString(),
      player_id: obtenerPlayerId(),
      game_version: GAME_VERSION,
    };

    console.log("Enviando datos de partida a Supabase:", gameData);

    try {
      const response = await fetch(SUPABASE_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(gameData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Partida registrada exitosamente en Supabase:", result);
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = await response.text(); // Fallback si el error no es JSON
        }
        console.error(
          "Error al registrar la partida en Supabase:",
          response.status,
          response.statusText,
          errorData
        );
      }
    } catch (error) {
      console.error(
        "Error de red al intentar registrar la partida en Supabase:",
        error
      );
    }
  }

  function triggerGameOver() {
    saveHighScoreToStorage();
    finalScoreDisplay.textContent = currentScore;
    if (gameOverHighScoreDisplay)
      gameOverHighScoreDisplay.textContent = highScore;

    logScoreToDB();

    showScreen(gameOverScreen);
  }

  function restartGame() {
    loadHighScoreFromStorage();
    displayRandomIntroMessage();
    startGame();
    outOfViewElements = [];
    setGameArenaTranslate();
    setTimeout(() => {
      setGameArenaHeight();
    }, 500);
    showScreen(gameScreen);

    scoreFlamme.style.display = "none";

    // El botón Play se habilitará o mostrará error basado en el estado de carga
    if (!isLoading && allProducts.length >= 2) {
      setupFirstRound();
      playButton.disabled = false;
      playButton.innerHTML = `<span>Empezar</span> <svg width="17" height="21" viewBox="0 0 17 21" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.729 20.5728H0.729004V0.572754H4.729V3.07275H8.729V6.82275H12.729V9.32275H16.729V11.8228H12.729V14.3228H8.729V18.0728H4.729V20.5728Z" fill="#023A50"/></svg>`;
    } else if (!isLoading && allProducts.length < 2) {
      playButton.textContent = "Error Productos";
      playButton.disabled = true;
    } else {
      // Todavía cargando o error inicial no resuelto
      playButton.innerHTML = `<span>Empezar</span> <svg width="13" height="21" viewBox="0 0 13 21" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.9758 0.572754H0.97583V6.57275H2.97583V8.57275H4.97583V12.5728H2.97583V14.5728H0.97583V20.5728H12.9758V14.5728H10.9758V12.5728H8.97583V8.57275H10.9758V6.57275H12.9758V0.572754ZM10.9758 6.57275H8.97583V8.57275H4.97583V6.57275H2.97583V2.57275H10.9758V6.57275ZM8.97583 12.5728V14.5728H10.9758V18.5728H2.97583V14.5728H4.97583V12.5728H8.97583Z" fill="#023A50"/>
</svg>
`;
      playButton.disabled = true;
      // Se podría re-intentar initializeGameData() aquí si fuera una condición de error recuperable
      // pero para un reinicio simple, usualmente se asume que los datos ya están.
      // Si los datos fallaron al cargar inicialmente, initializeGameData ya lo marcó.
    }
  }

  // --- 7. Asignación de Event Listeners ---
  playButton.addEventListener("click", startGame);
  higherButton.addEventListener("click", () => handleGuess("higher"));
  lowerButton.addEventListener("click", () => handleGuess("lower"));
  higherButton.addEventListener("click", () => audio.play("charging"));
  lowerButton.addEventListener("click", () => audio.play("charging"));
  playAgainButton.addEventListener("click", restartGame);
  window.addEventListener("resize", function () {
    setGameArenaTranslate();
    setGameArenaHeight();
  });

  // --- 8. ¡Empieza Todo! ---
  initializeGameData();
}); // Fin del DOMContentLoaded
