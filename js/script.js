import { createClient } from "https://esm.sh/@supabase/supabase-js";

document.addEventListener("DOMContentLoaded", () => {
  const startScreen = document.getElementById("start-screen");
  const gameScreen = document.getElementById("game-screen");
  const gameOverScreen = document.getElementById("game-over-screen");
  const leaderboardScreen = document.getElementById("leaderboard-screen");
  const enterNameScreen = document.getElementById("enter-name-screen");

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

  let productReference = null;
  let productToGuess = null;
  let productReserve = null;
  let shownProducts = [];
  let currentScore = 0;
  let highScore = 0;
  let canGuess = true;
  let isLoading = true;
  let isLoadingNextProduct = false;
  let outOfViewElements = [];

  const now = new Date();

  const HIGH_SCORE_KEY = "dueloDePreciosHighScore_v1";
  const PLAYER_ID_KEY = "dueloDePreciosPlayerId_v1";
  const GAME_VERSION = "1.0.1";

  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vYXRya3FpeXNycndpamJjaGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4OTI1ODgsImV4cCI6MjA2NDQ2ODU4OH0.SJB5Rc323ASOebF-aBdZVd9SZg5QXUXeyo4zj3FMWqg";
  const SUPABASE_URL = "https://ooatrkqiysrrwijbchej.supabase.co";
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const introMessages = [
    "Nadie se ha hecho millonario jugando a esto (que sepamos). Pero la gloria en Duelo de Precios... esa es otra historia. ¿La escribes?",
    "Si tuvieras un superpoder, ¿sería adivinar precios? Pues aquí puedes probar esa teoría. (No requiere capa).",
    "Advertencia: Jugar esto podría hacerte cuestionar todas tus decisiones de compra pasadas. O simplemente divertirte un rato. ¡Vale la pena!",
    "Tranqui, aquí no hay 'análisis de mercado' ni 'KPIs'. Solo precios, tu instinto y un botón de ¡PLAY! ¿Así o más fácil?",
  ];

  function displayRandomIntroMessage() {
    if (introTextElement && introMessages.length > 0) {
      const randomIndex = Math.floor(Math.random() * introMessages.length);
      introTextElement.textContent = introMessages[randomIndex];
    }
  }

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
    return `${day}-${month}-${year}`;
  }

  function getTime() {
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  function setDateAndTime() {
    const invoiceDateValue = document.getElementById("invoice-date-value");
    const invoiceTimeValue = document.getElementById("invoice-time-value");
    if (invoiceDateValue) invoiceDateValue.textContent = getDate();
    if (invoiceTimeValue) invoiceTimeValue.textContent = getTime();
  }

  async function getRandomProduct(excludeProduct = null) {
    try {
      const excludeId = excludeProduct ? excludeProduct.id : null;

      const referencePrice = productReference ? productReference.price : 0;

      const { data, error } = await supabase.rpc("get_secure_random_product", {
        p_exclude_id: excludeId,
        p_reference_price: referencePrice,
      });

      if (error) throw error;

      if (!data || data.length === 0) {
        const fallbackResult = await supabase.rpc(
          "get_secure_random_product_fallback",
          { p_exclude_id: excludeId }
        );
        if (fallbackResult.error) throw fallbackResult.error;
        return fallbackResult.data[0];
      }

      return data[0];
    } catch (error) {
      throw error;
    }
  }

  async function preloadNextProduct() {
    if (isLoadingNextProduct) return;
    try {
      isLoadingNextProduct = true;
      productReserve = await getRandomProduct(productToGuess, 1);
    } catch (error) {
      console.error("Error al precargar producto:", error);
      productReserve = null;
    } finally {
      isLoadingNextProduct = false;
    }
  }

  function showScreen(screenToShow, keepHomePage) {
    gameScreen.classList.remove("active");
    gameOverScreen.classList.remove("active");
    leaderboardScreen.classList.remove("active");
    enterNameScreen.classList.remove("active");
    if (!keepHomePage) {
      startScreen.classList.remove("active");
    }

    screenToShow.classList.add("active");
    if (logo && !keepHomePage) {
      logo.classList.toggle("active", screenToShow === startScreen);
    }
  }

  class AudioEngine {
    constructor() {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      this.soundBuffers = {};
      const unlockAudio = () => {
        if (this.audioContext.state === "suspended") this.audioContext.resume();
        document.body.removeEventListener("click", unlockAudio);
      };
      document.body.addEventListener("click", unlockAudio, { once: true });
    }
    async loadSound(name, url) {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        this.soundBuffers[name] = await this.audioContext.decodeAudioData(
          arrayBuffer
        );
      } catch (error) {
        console.error(`Error al cargar el sonido ${name}:`, error);
      }
    }
    async loadAll(soundPaths, hostUrl) {
      await Promise.all(
        Object.entries(soundPaths).map(([name, path]) =>
          this.loadSound(name, hostUrl + path)
        )
      );
    }
    play(name, options = {}) {
      if (!this.soundBuffers[name]) return;
      const source = this.audioContext.createBufferSource();
      source.buffer = this.soundBuffers[name];
      source.playbackRate.value = options.rate || 1;
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = options.volume ?? 1;
      source.connect(gainNode).connect(this.audioContext.destination);
      source.start(0);
    }
  }

  const audio = new AudioEngine();
  audio.loadAll(
    {
      charging: "audios/sfx-charging.mp3",
      correct: "audios/sfx-correct.mp3",
      incorrect: "audios/sfx-incorrect.mp3",
      beep: "audios/sfx-scanner-beep.mp3",
    },
    "https://www.duelodeprecios.com/"
  );

  function addProductToArena(product, role, showPrice) {
    const container = document.createElement("div");
    container.className = "product-display-container";
    container.dataset.productRole = role;

    const card = document.createElement("div");
    card.className = "product-card";

    const priceHTML = showPrice
      ? `$${product.price.toFixed(2)}`
      : `<span class="char">?</span><span class="char">?</span><span class="char">?</span>`;

    card.innerHTML = `
      <img src="images/${product.image}" alt="${
      product.title
    }" class="product-image">
      <div class="product-content">
        ${
          product.category
            ? `<span class="product-category">${product.category}</span>`
            : ""
        }
        ${
          product.brand
            ? `<span class="product-brand">${product.brand}</span>`
            : ""
        }
        <h3 class="product-title">${product.title}</h3>
        ${
          product.measure
            ? `<span class="product-measure">${product.measure}</span>`
            : ""
        }
        <p class="product-price ${showPrice ? "revealed" : ""}">
          <span class="price-value">${priceHTML}</span>
        </p>
      </div>`;

    container.appendChild(card);
    gameArena.appendChild(container);

    if (role === "guess") {
      document.getElementById("controls-product-label").textContent =
        product.title;

      const verbElement = document.getElementById("controls-product-text");

      if (product.is_plural) {
        verbElement.textContent = "Cuestan";
      } else {
        verbElement.textContent = "Cuesta";
      }
    }

    return container;
  }

  function updateCurrentScoreDisplay() {
    currentScoreDisplay.textContent = currentScore;
  }

  async function getInitialProducts() {
    try {
      const { data, error } = await supabase.rpc("get_game_start_products");

      if (error) {
        throw error;
      }
      return data;
    } catch (error) {
      console.error("Error al obtener productos iniciales:", error);
      throw error;
    }
  }

  function setupFirstRoundWithProducts() {
    if (!productReference || !productToGuess) return false;
    gameArena.innerHTML = "";
    const refEl = addProductToArena(productReference, "reference", true);
    const guessEl = addProductToArena(productToGuess, "guess", false);
    refEl.classList.add("in-view");
    guessEl.classList.add("in-view");
    return true;
  }

  function setupLeaderboardButton() {
    const leaderboardButtons = document.querySelectorAll(".leaderboard-button");
    if (!leaderboardButtons) return;

    leaderboardButtons.forEach((button) => {
      button.addEventListener("click", () => {
        showLeaderboard(button);
      });
    });
  }

  function getPlayerName() {
    let name = localStorage.getItem("playerName");
    if (!name) {
      name = prompt("¡Nuevo Récord! Ingresa tus iniciales (3 letras):", "AAA");
      if (name && name.length === 3) {
        localStorage.setItem("playerName", name.toUpperCase());
      } else {
        return null;
      }
    }
    return name.toUpperCase();
  }

  async function showLeaderboard(button) {
    const leaderboardScreen = document.getElementById("leaderboard-screen");
    const leaderboardBody = document.getElementById("leaderboard-body");
    const leaderboardCloseButton = document.getElementById(
      "leaderboard-close-button"
    );

    const leaderboardBackTo = button.dataset.backTo;

    if (leaderboardBackTo == "start-screen") {
      if (typeof gtag === "function") {
        gtag("event", "leaderboard_from_homepage");
      }
    } else if (leaderboardBackTo == "game-over-screen") {
      if (typeof gtag === "function") {
        gtag("event", "leaderboard_from_gameover");
      }
    }

    leaderboardCloseButton.addEventListener("click", () => {
      if (leaderboardBackTo == "gamestart-screen") {
        showScreen(document.getElementById(leaderboardBackTo), true);
      } else {
        showScreen(document.getElementById(leaderboardBackTo));
      }
    });

    showScreen(leaderboardScreen, document.getElementById(leaderboardBackTo));
    leaderboardBody.innerHTML =
      '<tr class="loading-row"><td class="loading-row-text">Cargando...</td></tr>';
    try {
      const { data: scores, error } = await supabase.rpc(
        "get_leaderboard_filtered"
      );
      if (error) throw error;
      if (!scores || scores.length === 0) {
        leaderboardBody.innerHTML =
          '<tr class="no-data"><td colspan="3">Aún no hay puntajes. ¡Sé el primero!</td></tr>';
        return;
      }
      leaderboardBody.innerHTML = scores
        .map(
          (entry) =>
            `<tr class="ranking-position-${entry.rank}">
         <td>${entry.rank}.</td>
         <td>${entry.player_name}</td>
         <td>${entry.score}</td>
       </tr>`
        )
        .join("");
    } catch (error) {
      console.error("Error al cargar el leaderboard:", error);
      leaderboardBody.innerHTML =
        '<tr><td colspan="3">No se pudo cargar el ranking.</td></tr>';
    }
  }

  // Cerca del inicio de tu script, añade esta función auxiliar
  function getFontCss() {
    let css = "";
    // Recorre todas las hojas de estilo del documento
    for (const sheet of document.styleSheets) {
      try {
        // Busca la hoja de estilo que carga tus fuentes (fonts.css)
        if (sheet.href && sheet.href.includes("fonts.css")) {
          for (const rule of sheet.cssRules) {
            // Si la regla es un @font-face, la añadimos a nuestro string de CSS
            if (rule.type === CSSRule.FONT_FACE_RULE) {
              css += rule.cssText;
            }
          }
        }
      } catch (e) {
        console.warn("No se pudo leer una hoja de estilos (CORS):", e);
      }
    }
    return css;
  }

  // Ahora, reemplaza tu función setupDownloadButton con esta
  function setupDownloadButton() {
    const downloadButton = document.getElementById("download-button");
    const leaderboardButton = document.getElementById("leaderboard-button");
    const invoiceElement = document.querySelector(".invoice-wrapper");

    if (!downloadButton || !invoiceElement) {
      return;
    }

    downloadButton.addEventListener("click", () => {
      if (typeof gtag === "function") {
        gtag("event", "download_score", { score: currentScore });
      }
      downloadButton.style.display = "none";
      leaderboardButton.style.display = "none";

      // Preparamos los recursos como antes
      const fontsReadyPromise = document.fonts.ready;
      const images = invoiceElement.querySelectorAll("img");
      const imagesLoadedPromises = [...images].map((img) => {
        return new Promise((resolve) => {
          if (img.complete) resolve();
          else {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
          }
        });
      });

      Promise.all([fontsReadyPromise, ...imagesLoadedPromises]).then(() => {
        // --- INICIO DE LA SOLUCIÓN DEFINITIVA ---

        // 1. Obtenemos el CSS de nuestras @font-face
        const fontCss = getFontCss();

        // 2. Creamos la etiqueta <style> que se inyectará en el SVG
        const style = document.createElement("style");
        style.appendChild(document.createTextNode(fontCss));

        const scaleFactor = 2;
        const options = {
          width: invoiceElement.offsetWidth * scaleFactor,
          height: invoiceElement.offsetHeight * scaleFactor,
          style: {
            transform: "scale(" + scaleFactor + ")",
            transformOrigin: "top left",
          },
          // 3. (OPCIONAL pero recomendado) Añadimos el <style> a la captura
          // Esto es una propiedad no documentada pero que puede ayudar
          // Sin embargo, el método principal es `embedCss`
        };

        // 4. Usamos toPng con la opción para incrustar el CSS.
        // Es más directo y fiable que pasar por SVG manualmente.
        domtoimage
          .toPng(invoiceElement, {
            ...options,
            embedCss: fontCss, // Le pasamos directamente el CSS de las fuentes
          })
          .then((pngDataUrl) => {
            const link = document.createElement("a");
            link.href = pngDataUrl;
            link.download = "puntaje-duelo-de-precios.png";
            link.click();

            downloadButton.style.display = "block";
            leaderboardButton.style.display = "block";
          })
          .catch((error) => {
            console.error("Oops, algo salió mal durante la captura!", error);
            downloadButton.style.display = "block";
            leaderboardButton.style.display = "block";
          });

        // --- FIN DE LA SOLUCIÓN ---
      });
    });
  }

  function setupShareButton() {
    const shareButton = document.getElementById("share-button");
    if (!shareButton) return;

    shareButton.addEventListener("click", () => {
      if (typeof gtag === "function") {
        gtag("event", "share_score", {
          score: currentScore,
        });
      }

      const shareData = {
        title: "Duelo de Precios",
        text: `¡Hice ${currentScore} puntos en Duelo de Precios! ¿Puedes superarme?`,
        url: window.location.href,
      };

      if (navigator.share) {
        navigator
          .share(shareData)
          .catch((error) => console.error("Error al compartir:", error));
      } else {
        const fallbackText = `${shareData.text} ${shareData.url}`;
        navigator.clipboard
          .writeText(fallbackText)
          .then(() => {
            const originalText = shareButton.textContent;
            shareButton.querySelector("span").textContent = "¡COPIADO!";
            setTimeout(() => {
              shareButton.querySelector("span").textContent = originalText;
            }, 2000);
          })
          .catch((err) => {
            console.error("Error al copiar texto:", err);
          });
      }
    });
  }

  async function initializeGameData() {
    isLoading = true;
    playButton.disabled = true;
    playButton.classList.add("is-disabled");
    playButton.innerHTML = `<span>Cargando...</span> <svg width="13" height="21" viewBox="0 0 13 21" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.9758 0.572754H0.97583V6.57275H2.97583V8.57275H4.97583V12.5728H2.97583V14.5728H0.97583V20.5728H12.9758V14.5728H10.9758V12.5728H8.97583V8.57275H10.9758V6.57275H12.9758V0.572754ZM10.9758 6.57275H8.97583V8.57275H4.97583V6.57275H2.97583V2.57275H10.9758V6.57275ZM8.97583 12.5728V14.5728H10.9758V18.5728H2.97583V14.5728H4.97583V12.5728H8.97583Z" fill="#023A50"/></svg>`;
    displayRandomIntroMessage();
    loadHighScoreFromStorage();
    document.body.classList.add("disable-scroll");

    try {
      const data = await getInitialProducts();
      productReference = data.reference;
      productToGuess = data.guess;
      shownProducts = [productToGuess];
      setupFirstRoundWithProducts();
      await preloadNextProduct();

      setGameArenaHeight();
      isLoading = false;
      playButton.disabled = false;
      playButton.classList.remove("is-disabled");
      playButton.innerHTML = `<span>Empezar</span> <svg width="17" height="21" viewBox="0 0 17 21" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.729 20.5728H0.729004V0.572754H4.729V3.07275H8.729V6.82275H12.729V9.32275H16.729V11.8228H12.729V14.3228H8.729V18.0728H4.729V20.5728Z" fill="#023A50"/></svg>`;
    } catch (error) {
      console.error("Error fatal al inicializar:", error);
      playButton.textContent = "Error al Cargar";
      if (introTextElement)
        introTextElement.textContent =
          "Oops! No pudimos cargar los productos. Recarga la página.";
    }
  }

  function startGame() {
    if (isLoading) return;
    currentScore = 0;
    updateCurrentScoreDisplay();
    document.body.classList.remove("disable-scroll");
    canGuess = true;
    if (typeof gtag === "function") {
      gtag("event", "game_start");
    }
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
    if (!priceElement) {
      console.error("Elemento de precio no válido para la animación.");
      return;
    }
    let validated = false;
    const initialValueNum = parseFloat(initialNumber);
    const finalValueNum = parseFloat(finalNumber);
    let startTime = null;

    function updateDisplay(textValue) {
      priceElement.textContent = "$" + textValue;
    }

    priceElement.parentNode.classList.add("animate-price-reveal");
    updateDisplay(initialValueNum.toFixed(2));

    const wrongIcon = `<svg class="validation-icon" width="19" height="18" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.75 0.25H3.25V2.75H0.75V0.25ZM5.75 5.25H3.25V2.75H5.75V5.25ZM8.25 7.75H5.75V5.25H8.25V7.75ZM10.75 7.75H8.25V10.25H5.75V12.75H3.25V15.25H0.75V17.75H3.25V15.25H5.75V12.75H8.25V10.25H10.75V12.75H13.25V15.25H15.75V17.75H18.25V15.25H15.75V12.75H13.25V10.25H10.75V7.75ZM13.25 5.25V7.75H10.75V5.25H13.25ZM15.75 2.75V5.25H13.25V2.75H15.75ZM15.75 2.75V0.25H18.25V2.75H15.75Z" fill="#FF6C6C"/></svg>`;
    const checkIcon = `<svg class="validation-icon" width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.5 0.5H20V3H17.5V0.5ZM15 5.5V3H17.5V5.5H15ZM12.5 8V5.5H15V8H12.5ZM10 10.5H12.5V8H10V10.5ZM7.5 13H10V10.5H7.5V13ZM5 13V15.5H7.5V13H5ZM2.5 10.5H5V13H2.5V10.5ZM2.5 10.5H0V8H2.5V10.5Z" fill="#81FF6C"/></svg>`;

    const isVisuallyCorrect =
      (guess === "higher" && finalValueNum > productReferencePrice) ||
      (guess === "lower" && finalValueNum < productReferencePrice) ||
      finalValueNum === productReferencePrice;

    function animationFrame(timestamp) {
      if (!startTime) startTime = timestamp;

      const elapsedTime = timestamp - startTime;
      const progress = Math.min(elapsedTime / animationDuration, 1);
      const currentValue =
        initialValueNum + (finalValueNum - initialValueNum) * progress;
      updateDisplay(currentValue.toFixed(2));

      if (progress < 1) {
        requestAnimationFrame(animationFrame);
      } else if (!validated) {
        validated = true;
        priceElement.parentNode.classList.add(
          isVisuallyCorrect ? "good-guess" : "wrong-guess"
        );
        priceElement.parentNode.insertAdjacentHTML(
          "beforeend",
          isVisuallyCorrect ? checkIcon : wrongIcon
        );
        priceElement.parentNode
          .querySelector(".validation-icon")
          .classList.add("icon-fade-in");
        audio.play(isVisuallyCorrect ? "correct" : "incorrect");
      }
    }
    requestAnimationFrame(animationFrame);
  }

  async function handleGuess(guess) {
    if (!canGuess) return;

    const currentGuessElement = gameArena.querySelector(
      '[data-product-role="guess"].in-view'
    );
    if (!currentGuessElement) {
      console.error(
        "Error crítico: No se pudo encontrar la tarjeta del producto a adivinar."
      );
      return;
    }

    const priceElement = currentGuessElement.querySelector(
      ".product-price .price-value"
    );
    if (!priceElement) {
      console.error(
        "Error crítico: No se pudo encontrar el elemento .price-value dentro de la tarjeta."
      );
      return;
    }

    canGuess = false;
    audio.play("charging");

    const productCard = currentGuessElement.querySelector(".product-card");
    productCard.classList.add("is-charging");

    try {
      const { data, error } = await supabase.rpc("check_guess", {
        reference_price: productReference.price,
        guess_product_id: productToGuess.id,
        user_guess: guess,
      });

      if (error) throw error;

      const { is_correct, actual_price } = data[0];

      productCard.classList.remove("is-charging");

      animatePriceReveal(
        0.0,
        actual_price,
        1000,
        priceElement,
        guess,
        actual_price,
        productReference.price
      );

      setTimeout(() => {
        if (is_correct) {
          currentScore++;
          updateCurrentScoreDisplay();
          saveHighScoreToStorage();
          audio.play("beep");
          const oldRef = gameArena.querySelector(
            '[data-product-role="reference"].in-view'
          );
          const oldGuess = gameArena.querySelector(
            '[data-product-role="guess"].in-view'
          );
          outOfViewElements.push(oldRef);
          setGameArenaTranslate();
          oldRef.classList.remove("in-view");
          oldRef.classList.add("out-view");
          setTimeout(setGameArenaHeight, 500);
          oldGuess.dataset.productRole = "reference";
          productToGuess.price = actual_price;
          productReference = productToGuess;
          if (productReserve) {
            productToGuess = productReserve;
            productReserve = null;
            shownProducts.push(productToGuess);
            const newGuessElement = addProductToArena(
              productToGuess,
              "guess",
              false
            );
            void newGuessElement.offsetWidth;
            newGuessElement.classList.add("in-view");
            preloadNextProduct();
            canGuess = true;
          } else {
            triggerGameOver();
          }
        } else {
          setDateAndTime();
          triggerGameOver();
        }
      }, 2000);
    } catch (error) {
      console.error("Error al verificar la jugada:", error);
      productCard.classList.remove("is-charging");
      canGuess = true;
    }
  }

  function setGameArenaHeight() {
    const productsInView = document.querySelectorAll(".in-view");
    if (productsInView.length === 0) {
      gameArena.style.height = "400px";
      return;
    }
    const height = Array.from(productsInView).reduce(
      (acc, el) => acc + el.offsetHeight,
      0
    );
    gameArena.style.height = `calc(${height}px + 10px)`;
  }

  function setGameArenaTranslate() {
    let outOfViewHeight = outOfViewElements.reduce(
      (acc, el) => acc + el.offsetHeight,
      0
    );
    gameArena.style.transform = `translateY(calc(-${outOfViewHeight}px - ${
      currentScore * 10
    }px))`;
  }

  function promptForPlayerName() {
    const nameScreen = document.getElementById("enter-name-screen");
    const nameInput = document.getElementById("playerNameInput");
    const saveButton = document.getElementById("saveScoreButton");
    const errorMessage = document.getElementById("name-error-message");

    const skipButton = document.getElementById("skipNameButton");

    errorMessage.textContent = "";
    saveButton.disabled = false;
    saveButton.textContent = "Guardar";
    nameInput.classList.remove("input-error");

    const savedName = localStorage.getItem("playerName");
    if (savedName) {
      nameInput.value = savedName;
    }

    showScreen(nameScreen);

    setTimeout(() => {
      nameInput.focus();
    }, 500);

    const handleSkipClick = () => {
      logScoreToDB(null, currentScore);
      showScreen(document.getElementById("game-over-screen"));
    };

    const handleSaveClick = async () => {
      const playerName = nameInput.value.trim();
      const validationRegex = /^[a-zA-Z0-9 ]{1,8}$/;

      if (validationRegex.test(playerName)) {
        saveButton.disabled = true;
        saveButton.textContent = "Guardando...";

        localStorage.setItem("playerName", playerName);
        const success = await logScoreToDB(playerName, currentScore);

        if (success) {
          showScreen(document.getElementById("game-over-screen"));
        } else {
          errorMessage.textContent = "Hubo un error al guardar.";
          saveButton.disabled = false;
          saveButton.textContent = "Guardar";
        }
      } else {
        nameInput.classList.add("input-error");
        errorMessage.textContent = "Debe tener entre 1 y 8 caracteres.";
      }
    };

    const newSaveButton = saveButton.cloneNode(true);
    saveButton.parentNode.replaceChild(newSaveButton, saveButton);
    newSaveButton.addEventListener("click", handleSaveClick);

    const newSkipButton = skipButton.cloneNode(true);
    skipButton.parentNode.replaceChild(newSkipButton, skipButton);
    newSkipButton.addEventListener("click", handleSkipClick);
  }

  async function logScoreToDB(playerName, score) {
    let playerUUID = null;

    try {
      if (playerName) {
        const { data, error: playerError } = await supabase.rpc(
          "get_or_create_player",
          { p_player_name: playerName }
        );
        if (playerError) throw playerError;
        playerUUID = data;
      }

      const { data: newId, error: sessionError } = await supabase.rpc(
        "log_game_session",
        {
          p_score: score,
          p_player_uuid: playerUUID,
          p_game_version: GAME_VERSION,
          p_timestamp: new Date().toISOString(),
        }
      );
      if (sessionError) throw sessionError;

      const invoiceNumEl = document.getElementById("invoice-number-value");
      if (invoiceNumEl && newId) {
        invoiceNumEl.textContent = "DDP" + String(newId).padStart(8, "0");
      }
      return true;
    } catch (error) {
      console.error("Error al registrar el puntaje:", error);
      return false;
    }
  }

  async function triggerGameOver() {
    saveHighScoreToStorage();
    finalScoreDisplay.textContent = currentScore;
    document.getElementById("invoice-line-guesses-value").textContent =
      currentScore;

    const totalSum = shownProducts.reduce(
      (sum, product) => sum + (product.price || 0),
      0
    );
    const finalTotal = totalSum + (productToGuess.price || 0);
    const totalValueElement = document.getElementById(
      "invoice-line-total-value"
    );
    if (totalValueElement) {
      totalValueElement.textContent = `$${finalTotal.toFixed(2)}`;
    }
    if (gameOverHighScoreDisplay) {
      gameOverHighScoreDisplay.textContent = highScore;
    }

    try {
      const { data: isHighScore, error } = await supabase.rpc(
        "check_if_high_score",
        {
          p_score: currentScore,
        }
      );

      if (error) {
        throw error;
      }

      if (isHighScore && currentScore > 0) {
        promptForPlayerName();
      } else {
        logScoreToDB(null, currentScore);
        showScreen(gameOverScreen);
      }
    } catch (error) {
      console.error("Error en el flujo de fin de partida:", error);
      logScoreToDB(null, currentScore);
      showScreen(gameOverScreen);
    }
  }

  async function restartGame() {
    if (typeof gtag === "function") {
      gtag("event", "game_restart");
    }
    currentScore = 0;
    outOfViewElements = [];
    productReserve = null;
    isLoadingNextProduct = false;
    canGuess = false;
    updateCurrentScoreDisplay();
    loadHighScoreFromStorage();
    scoreFlamme.style.display = "none";
    gameArena.innerHTML = "";
    gameArena.style.transform = "translateY(0)";
    showScreen(gameScreen);

    try {
      const data = await getInitialProducts();
      productReference = data.reference;
      productToGuess = data.guess;
      shownProducts = [productToGuess];
      setupFirstRoundWithProducts();
      await preloadNextProduct();
      setGameArenaHeight();
      document.body.classList.remove("disable-scroll");
      canGuess = true;
    } catch (error) {
      console.error("Error restarting game:", error);
      showScreen(startScreen);
      if (introTextElement)
        introTextElement.textContent = "Error al reiniciar. Intenta de nuevo.";
    }
  }

  playButton.addEventListener("click", startGame);
  higherButton.addEventListener("click", () => handleGuess("higher"));
  lowerButton.addEventListener("click", () => handleGuess("lower"));
  playAgainButton.addEventListener("click", restartGame);
  window.addEventListener("resize", () => {
    setGameArenaHeight();
    setGameArenaTranslate();
  });

  initializeGameData();
  setupDownloadButton();
  setupShareButton();
  setupLeaderboardButton();
});
