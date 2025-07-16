import { createClient } from "https://esm.sh/@supabase/supabase-js";

document.addEventListener("DOMContentLoaded", () => {
  // --- 1. Referencias a Elementos del DOM ---
  const startScreen = document.getElementById("start-screen");
  const gameScreen = document.getElementById("game-screen");
  const gameOverScreen = document.getElementById("game-over-screen");

  const logo = document.getElementById("logo");
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
  let productsGuessed = [];
  let outOfViewElements = [];
  let productReference = null;
  let productToGuess = null;
  let productReserve = null; // Producto precargado para la siguiente ronda
  let currentScore = 0;
  let highScore = 0;
  let canGuess = true;
  let isLoading = true;
  let isLoadingNextProduct = false; // Flag para controlar la precarga
  let currentTranslate = 0;
  let gameArenaHeight = 0;

  const now = new Date();

  const HIGH_SCORE_KEY = "dueloDePreciosHighScore_v1";
  const PLAYER_ID_KEY = "dueloDePreciosPlayerId_v1";
  const GAME_VERSION = "1.0";

  const SUPABASE_LOG_SCORE =
    "https://ooatrkqiysrrwijbchej.supabase.co/functions/v1/log-score";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXRya3FpeXNycndpamJjaGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4OTI1ODgsImV4cCI6MjA2NDQ2ODU4OH0.SJB5Rc323ASOebF-aBdZVd9SZg5QXUXeyo4zj3FMWqg";
  const SUPABASE_URL = "https://ooatrkqiysrrwijbchej.supabase.co";
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

  function getDate() {
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;

    return formattedDate;
  }

  function getTime() {
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const formattedTime = `${hours}:${minutes}`;

    return formattedTime;
  }

  function setDateAndTime() {
    const invoiceDateValue = document.getElementById("invoice-date-value");
    const invoiceTimeValue = document.getElementById("invoice-time-value");

    invoiceDateValue.textContent = getDate();
    invoiceTimeValue.textContent = getTime();
  }

  // Función mejorada para obtener producto aleatorio con mejor manejo de CORS
  async function getRandomProduct(excludeProduct = null) {
    try {
      console.log("Obteniendo producto aleatorio...");

      // Construir URL con parámetros
      const params = new URLSearchParams();
      params.append("count", "1");

      if (excludeProduct && excludeProduct.id) {
        params.append("exclude_id", excludeProduct.id.toString());
      }

      // Usar fetch directo en lugar de supabase.functions.invoke para mejor control de CORS
      const url = `${SUPABASE_URL}/functions/v1/get-random-products?${params.toString()}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.product) {
        throw new Error("No se encontró producto en la respuesta");
      }

      console.log("Producto obtenido:", data.product);
      return data.product;
    } catch (error) {
      console.error("Error al obtener producto aleatorio:", error);

      // Fallback: usar consulta directa si falla la edge function
      console.log("Usando fallback: consulta directa");
      try {
        let query = supabase
          .from("products")
          .select("id, title, brand, category, measure, price, image")
          .eq("is_active", true);

        if (excludeProduct && excludeProduct.id) {
          query = query.neq("id", excludeProduct.id);
        }

        const { data, error } = await query.limit(50);

        if (error) {
          throw new Error(`Fallback error: ${error.message}`);
        }

        if (!data || data.length === 0) {
          throw new Error("No products found in fallback");
        }

        // Seleccionar uno aleatorio
        const randomIndex = Math.floor(Math.random() * data.length);
        const selectedProduct = data[randomIndex];

        console.log("Producto obtenido con fallback:", selectedProduct);
        return selectedProduct;
      } catch (fallbackError) {
        console.error("Fallback también falló:", fallbackError);
        throw fallbackError;
      }
    }
  }

  // Función de precarga mejorada
  async function preloadNextProduct() {
    if (isLoadingNextProduct) {
      console.log("Ya hay una precarga en progreso, saltando...");
      return;
    }

    try {
      isLoadingNextProduct = true;
      console.log("Precargando siguiente producto...");

      productReserve = await getRandomProduct(productToGuess);
      console.log("Producto precargado exitosamente:", productReserve);
    } catch (error) {
      console.error("Error al precargar producto:", error);
      productReserve = null;
    } finally {
      isLoadingNextProduct = false;
    }
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
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      this.soundBuffers = {};
      this.isReady = false;

      const unlockAudio = () => {
        if (this.audioContext.state === "suspended") {
          this.audioContext.resume();
        }
        document.body.removeEventListener("touchstart", unlockAudio);
        document.body.removeEventListener("click", unlockAudio);
      };
      document.body.addEventListener("touchstart", unlockAudio, { once: true });
      document.body.addEventListener("click", unlockAudio, { once: true });
    }

    async loadSound(name, url) {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(
          arrayBuffer
        );
        this.soundBuffers[name] = audioBuffer;
      } catch (error) {
        console.error(`Error al cargar el sonido ${name} desde ${url}:`, error);
        throw error;
      }
    }

    async loadAllSounds(soundPaths, hostUrl, onReadyCallback) {
      const loadPromises = [];
      for (const name in soundPaths) {
        const url = hostUrl + soundPaths[name];
        loadPromises.push(this.loadSound(name, url));
      }

      try {
        await Promise.all(loadPromises);
        this.isReady = true;
        if (onReadyCallback) {
          onReadyCallback();
        }
      } catch (error) {
        console.error("Falló la carga de uno o más sonidos.", error);
      }
    }

    play(name, options = {}) {
      if (!this.soundBuffers[name]) {
        console.warn(`Sonido "${name}" no encontrado o no cargado.`);
        return;
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = this.soundBuffers[name];
      source.playbackRate.value = options.rate || 1;

      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = options.volume !== undefined ? options.volume : 1;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      source.start(0);
    }
  }

  const hostUrl = "https://eduardojaoel.github.io/duelodeprecios/";
  const soundPaths = {
    charging: "audios/sfx-charging.mp3",
    correct: "audios/sfx-correct.mp3",
    incorrect: "audios/sfx-incorrect.mp3",
    beep: "audios/sfx-scanner-beep.mp3",
  };

  const audio = new AudioEngine();
  audio.loadAllSounds(soundPaths, hostUrl);

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

    const displayTitle = product.title || "Producto Desconocido";
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
    gameArena.appendChild(container);

    if (role == "guess") {
      document.getElementById("controls-product-label").textContent =
        displayTitle;
    }
    return container;
  }

  function updateCurrentScoreDisplay() {
    currentScoreDisplay.textContent = currentScore;
  }

  // Función para obtener productos iniciales
  async function getInitialProducts() {
    try {
      console.log("Obteniendo 2 productos iniciales en una sola llamada...");

      // Tu función ya puede devolver más de uno, ¡usémoslo!
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/get-random-products?count=2`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      // La respuesta debería tener un array 'products' con 2 elementos
      if (!data.products || data.products.length < 2) {
        throw new Error(
          "No se pudieron obtener suficientes productos iniciales"
        );
      }

      console.log("Productos iniciales obtenidos:", {
        reference: data.products[0],
        guess: data.products[1],
      });

      // Devolvemos los productos en el formato que el resto del código espera
      return { reference: data.products[0], guess: data.products[1] };
    } catch (error) {
      console.error("Error al obtener productos iniciales:", error);
      // Aquí puedes mantener o mejorar tu lógica de fallback si lo deseas
      throw error;
    }
  }

  // Configuración de la primera ronda
  function setupFirstRoundWithProducts() {
    if (!productReference || !productToGuess) {
      console.error(
        "No hay productos disponibles para configurar la primera ronda."
      );
      return false;
    }

    productsGuessed = [];
    gameArena.innerHTML = "";

    const refEl = addProductToArena(productReference, "reference", true);
    const guessEl = addProductToArena(productToGuess, "guess", false);

    void refEl.offsetWidth;
    void guessEl.offsetWidth;

    refEl.classList.add("in-view");
    guessEl.classList.add("in-view");

    return true;
  }

  // --- 6. Lógica Principal del Juego ---
  async function initializeGameData() {
    isLoading = true;
    playButton.disabled = true;
    playButton.innerHTML = `<span>Cargando...</span> <svg width="13" height="21" viewBox="0 0 13 21" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.9758 0.572754H0.97583V6.57275H2.97583V8.57275H4.97583V12.5728H2.97583V14.5728H0.97583V20.5728H12.9758V14.5728H10.9758V12.5728H8.97583V8.57275H10.9758V6.57275H12.9758V0.572754ZM10.9758 6.57275H8.97583V8.57275H4.97583V6.57275H2.97583V2.57275H10.9758V6.57275ZM8.97583 12.5728V14.5728H10.9758V18.5728H2.97583V14.5728H4.97583V12.5728H8.97583Z" fill="#023A50"/>
</svg>
`;

    displayRandomIntroMessage();
    loadHighScoreFromStorage();

    try {
      const { reference, guess } = await getInitialProducts();

      if (!reference || !guess) {
        throw new Error("No se pudieron obtener productos iniciales.");
      }

      productReference = reference;
      productToGuess = guess;

      allProducts = [];
      productsGuessed = [];

      setupFirstRoundWithProducts();

      console.log("Precargando tercer producto...");
      preloadNextProduct();

      setTimeout(() => {
        setGameArenaHeight();
        isLoading = false;
        playButton.disabled = false;
        playButton.classList.remove("is-disabled");
        playButton.innerHTML = `<span>Empezar</span> <svg width="17" height="21" viewBox="0 0 17 21" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.729 20.5728H0.729004V0.572754H4.729V3.07275H8.729V6.82275H12.729V9.32275H16.729V11.8228H12.729V14.3228H8.729V18.0728H4.729V20.5728Z" fill="#023A50"/></svg>`;
      }, 500);
    } catch (error) {
      console.error("Error fatal al inicializar el juego:", error);
      playButton.textContent = "Error al Cargar";
      playButton.disabled = true;

      if (introTextElement) {
        introTextElement.textContent =
          "Oops! No pudimos cargar los productos. Por favor, recarga la página.";
      }
    }
  }

  function startGame() {
    if (isLoading) {
      console.warn("Los datos del juego no están listos.");
      return;
    }
    currentScore = 0;
    updateCurrentScoreDisplay();
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
      }
    }

    requestAnimationFrame(animationFrame);
  }

  async function handleGuess(guess) {
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

    const isHigher = productToGuess.price > productReference.price;
    const pricesAreEqual = productToGuess.price === productReference.price;
    let isCorrect = pricesAreEqual
      ? true
      : (guess === "higher" && isHigher) || (guess === "lower" && !isHigher);

    animatePriceReveal(
      0.0,
      productToGuess.price,
      1000,
      priceElement,
      guess,
      productToGuess.price,
      productReference.price
    );

    if (isCorrect) {
      productsGuessed.push(productToGuess);
    } else {
      document.getElementById("invoice-line-total-value").textContent =
        "$" +
        productsGuessed
          .reduce((accumulator, product) => accumulator + product.price, 0)
          .toFixed(2);

      logScoreToDB();
      setDateAndTime();
    }

    setTimeout(async () => {
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
        }, 500);

        currentGuessElement.dataset.productRole = "reference";
        productReference = productToGuess;

        try {
          if (productReserve) {
            console.log("Usando producto precargado");
            productToGuess = productReserve;
            productReserve = null;

            preloadNextProduct();

            const newGuessElement = addProductToArena(
              productToGuess,
              "guess",
              false
            );
            void newGuessElement.offsetWidth;
            newGuessElement.classList.add("in-view");

            preloadNextProduct();

            canGuess = true;
          }
        } catch (error) {
          console.error("Error crítico al obtener nuevo producto:", error);
          console.log("No se pudo obtener más productos, terminando juego...");
          triggerGameOver();
        }
      } else {
        triggerGameOver();
      }
    }, 2000);
  }

  function setGameArenaHeight() {
    const productsInView = document.querySelectorAll(".in-view");

    if (productsInView.length === 0) {
      gameArena.style.height = "400px";
      return;
    }

    gameArenaHeight = 0;

    productsInView.forEach((productInView) => {
      if (productInView.offsetHeight > 0) {
        gameArenaHeight += productInView.offsetHeight;
      }
    });

    if (gameArenaHeight === 0) {
      const estimatedProductHeight = 300;
      gameArenaHeight = productsInView.length * estimatedProductHeight;
      console.log(
        "Usando altura estimada para el game arena:",
        gameArenaHeight
      );
    }

    gameArena.style.height = `calc(${gameArenaHeight}px + 10px)`;
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
      playerId: obtenerPlayerId(),
      game_version: GAME_VERSION,
    };

    const invoiceNumberValue = document.getElementById("invoice-number-value");

    console.log("Enviando datos de partida a Supabase:", gameData);

    try {
      const { data, error } = await supabase.functions.invoke("log-score", {
        body: gameData,
      });

      if (error) {
        console.error("Error al registrar la partida en Supabase:", error);
      } else {
        console.log("Partida registrada exitosamente en Supabase:", data);

        if (invoiceNumberValue && data.id !== undefined) {
          const responseId = data.id;
          const idFormatted = "DDP" + responseId.toString().padStart(8, "0");
          invoiceNumberValue.textContent = idFormatted;
        } else {
          console.warn(
            "El id no está presente en la respuesta de la Edge Function:",
            data
          );
        }
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
    document.getElementById("invoice-line-guesses-value").textContent =
      currentScore;
    if (gameOverHighScoreDisplay)
      gameOverHighScoreDisplay.textContent = highScore;

    showScreen(gameOverScreen);

    console.log(productsGuessed);
  }

  async function restartGame() {
    currentScore = 0;
    updateCurrentScoreDisplay();
    productsGuessed = [];
    productReserve = null;
    isLoadingNextProduct = false;
    outOfViewElements = [];
    canGuess = false;

    loadHighScoreFromStorage();
    scoreFlamme.style.display = "none";

    showScreen(gameScreen);

    gameArena.innerHTML = "";
    gameArena.style.transform = "translateY(0)";
    setGameArenaTranslate();

    try {
      console.log("Cargando productos para nuevo juego...");

      const { reference, guess } = await getInitialProducts();

      if (!reference || !guess) {
        throw new Error("No se pudieron obtener productos para reiniciar");
      }

      productReference = reference;
      productToGuess = guess;

      setupFirstRoundWithProducts();

      console.log("Precargando tercer producto...");
      preloadNextProduct();

      setTimeout(() => {
        setGameArenaHeight();
        canGuess = true;
      }, 500);
    } catch (error) {
      console.error("Error al cargar productos para nuevo juego:", error);
      showScreen(startScreen);
      displayRandomIntroMessage();
      if (introTextElement) {
        introTextElement.textContent = "Error al reiniciar. Intenta de nuevo.";
      }
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
