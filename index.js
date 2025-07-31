(() => {
    // Constants
    const gameContainer = document.getElementById('gameContainer');
    const basket = document.getElementById('basket');
    const scoreBoard = document.getElementById('scoreBoard');
    const missedCounter = document.getElementById('missedCounter');
    const difficultyIndicator = document.getElementById('difficultyIndicator');
    const startBtn = document.getElementById('startBtn');
    const resetBtn = document.getElementById('resetBtn');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const gameOverText = document.getElementById('gameOverText');
    const finalScore = document.getElementById('finalScore');
    const gameOverReason = document.getElementById('gameOverReason');
    const playAgainBtn = document.getElementById('playAgainBtn');
    
    const containerWidth = gameContainer.clientWidth;
    const containerHeight = gameContainer.clientHeight;
    const basketWidth = basket.clientWidth;
    const basketHeight = basket.clientHeight;

    // Game state
    let gameRunning = false;
    let gameStarted = false;
    let animationId = null;
    let missedStars = 0;
    const maxMissedStars = 10;

    let score = 0;
    let basketX = containerWidth / 2 - basketWidth / 2;
    let basketVelocity = 0;
    const maxSpeed = 8;
    const acceleration = 0.8;
    const friction = 0.88;

    // Mouse/Touch control variables
    let mouseX = basketX + basketWidth / 2;
    let isUsingMouse = false;
    let lastMouseMoveTime = 0;
    let isDragging = false;

    // Stars array
    const stars = [];
    const baseFallSpeed = 3.5;
    let currentStarInterval = 1000; // Start a bit slower
    let currentFallSpeedMultiplier = 1.0;

    // Game functions
    function updateDifficulty() {
      if (score >= 50) {
        currentStarInterval = 300; // Much faster spawning (3x faster)
        currentFallSpeedMultiplier = 1.8; // Stars fall 80% faster
        difficultyIndicator.textContent = 'HARD MODE!';
        difficultyIndicator.style.color = '#ff3333';
        difficultyIndicator.style.fontSize = '1.1rem';
      } else {
        currentStarInterval = 1000; // Normal speed
        currentFallSpeedMultiplier = 1.0; // Normal fall speed
        difficultyIndicator.textContent = 'Normal';
        difficultyIndicator.style.color = '#88ffaa';
        difficultyIndicator.style.fontSize = '1rem';
      }
    }
    
    function updateUI() {
      scoreBoard.textContent = 'Score: ' + score;
      missedCounter.textContent = `Missed: ${missedStars}/${maxMissedStars}`;
      updateDifficulty();
    }
    function startGame() {
      gameRunning = true;
      gameStarted = true;
      startBtn.textContent = 'Pause';
      startBtn.disabled = false;
      resetBtn.disabled = false;
      gameOverScreen.style.display = 'none';
      
      if (!animationId) {
        requestAnimationFrame(gameLoop);
      }
    }
    
    function pauseGame() {
      gameRunning = false;
      startBtn.textContent = 'Resume';
    }
    
    function resetGame() {
      // Stop the game
      gameRunning = false;
      gameStarted = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      
      // Clear all stars
      stars.forEach(star => {
        if (star.parentNode) {
          gameContainer.removeChild(star);
        }
      });
      stars.length = 0;
      
      // Reset game variables
      score = 0;
      missedStars = 0;
      basketX = containerWidth / 2 - basketWidth / 2;
      basketVelocity = 0;
      mouseX = basketX + basketWidth / 2;
      isUsingMouse = false;
      lastMouseMoveTime = 0;
      lastTime = 0;
      starCreationTimer = 0;
      currentStarInterval = 1000;
      currentFallSpeedMultiplier = 1.0;
      
      // Reset UI
      updateUI();
      startBtn.textContent = 'Start Game';
      startBtn.disabled = false;
      resetBtn.disabled = true;
      gameOverScreen.style.display = 'none';
      
      // Reset basket position
      setBasketPosition(basketX);
    }
    
    function gameOver() {
      gameRunning = false;
      gameStarted = false;
      finalScore.textContent = `Final Score: ${score}`;
      gameOverReason.textContent = `You missed ${maxMissedStars} stars!`;
      gameOverScreen.style.display = 'flex';
      startBtn.textContent = 'Start Game';
      startBtn.disabled = true;
    }
    // Create star DOM elements dynamically and add to game container
    function createStar() {
      if (!gameRunning) return;
      
      const star = document.createElement('div');
      star.classList.add('star');
      star.style.left = Math.random() * (containerWidth - 25) + 'px';
      star.style.top = '-30px';
      // Store base fall speed so we can apply multiplier dynamically
      star.baseFallSpeed = baseFallSpeed + Math.random() * 1.5;
      gameContainer.appendChild(star);
      stars.push(star);
    }

    // Move basket to current position, clamping inside container width
    function setBasketPosition(x) {
      basketX = Math.min(Math.max(0, x), containerWidth - basketWidth);
      basket.style.left = basketX + 'px';
    }

    // Check collision between star and basket
    function checkCollision(star) {
      const rectStar = star.getBoundingClientRect();
      const rectBasket = basket.getBoundingClientRect();
      const offsetX = gameContainer.getBoundingClientRect().left;
      const offsetY = gameContainer.getBoundingClientRect().top;

      const starLeft = rectStar.left - offsetX;
      const starTop = rectStar.top - offsetY;
      const starRight = starLeft + rectStar.width;
      const starBottom = starTop + rectStar.height;

      const basketLeft = rectBasket.left - offsetX;
      const basketTop = rectBasket.top - offsetY;
      const basketRight = basketLeft + rectBasket.width;
      const basketBottom = basketTop + rectBasket.height;

      return !(starRight < basketLeft || starLeft > basketRight || starBottom < basketTop || starTop > basketBottom);
    }

    // Update stars position and collision detection
    function updateStars() {
      if (!gameRunning) return;
      
      for (let i = stars.length - 1; i >= 0; i--) {
        const star = stars[i];
        let top = parseFloat(star.style.top);
        
        // Apply current fall speed (this ensures all stars fall at current difficulty speed)
        const currentSpeed = star.baseFallSpeed * currentFallSpeedMultiplier;
        top += currentSpeed;
        star.style.top = top + 'px';

        if (checkCollision(star)) {
          score++;
          updateUI();
          gameContainer.removeChild(star);
          stars.splice(i, 1);
          continue;
        }
        
        if (top > containerHeight) {
          // Star missed - increment counter
          missedStars++;
          updateUI();
          gameContainer.removeChild(star);
          stars.splice(i, 1);
          
          // Check if game should end
          if (missedStars >= maxMissedStars) {
            gameOver();
            return;
          }
        }
      }
    }

    // Keyboard state
    const keys = { left: false, right: false };

    function handleKeyDown(e) {
      if (!gameRunning) return;
      
      if (e.code === 'ArrowLeft' || e.key === 'ArrowLeft') {
        keys.left = true;
        isUsingMouse = false;
      }
      if (e.code === 'ArrowRight' || e.key === 'ArrowRight') {
        keys.right = true;
        isUsingMouse = false;
      }
      
      // Space bar to start/pause
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (!gameStarted || !gameRunning) {
          startGame();
        } else {
          pauseGame();
        }
      }
    }
    
    function handleKeyUp(e) {
      if (e.code === 'ArrowLeft' || e.key === 'ArrowLeft') keys.left = false;
      if (e.code === 'ArrowRight' || e.key === 'ArrowRight') keys.right = false;
    }

    // Mouse/Touch move control for basket
    function handleMouseMove(e) {
      if (!gameRunning) return;
      
      const rect = gameContainer.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      isUsingMouse = true;
      lastMouseMoveTime = performance.now();
    }

    // Touch controls for mobile
    function handleTouchStart(e) {
      if (!gameRunning) return;
      e.preventDefault();
      isDragging = true;
      const touch = e.touches[0];
      const rect = gameContainer.getBoundingClientRect();
      mouseX = touch.clientX - rect.left;
      isUsingMouse = true;
      lastMouseMoveTime = performance.now();
    }

    function handleTouchMove(e) {
      if (!gameRunning || !isDragging) return;
      e.preventDefault();
      const touch = e.touches[0];
      const rect = gameContainer.getBoundingClientRect();
      mouseX = touch.clientX - rect.left;
      isUsingMouse = true;
      lastMouseMoveTime = performance.now();
    }

    function handleTouchEnd(e) {
      e.preventDefault();
      isDragging = false;
      // Don't immediately stop mouse mode, let it fade out naturally
    }

    // Unified basket movement system
    function updateBasketMovement() {
      if (!gameRunning) return;
      
      // Check if mouse/touch has been inactive for a while
      if (isUsingMouse && performance.now() - lastMouseMoveTime > 100) {
        isUsingMouse = false;
      }

      if (isUsingMouse) {
        // Mouse/Touch control - smooth following
        const targetX = Math.min(Math.max(0, mouseX - basketWidth / 2), containerWidth - basketWidth);
        const distance = targetX - basketX;
        const smoothFactor = 0.3; // Increased for better mobile responsiveness
        basketX += distance * smoothFactor;
        basketVelocity = distance * smoothFactor; // Update velocity for smooth transitions
      } else {
        // Keyboard control - acceleration based
        if (keys.left) {
          basketVelocity -= acceleration;
        } else if (keys.right) {
          basketVelocity += acceleration;
        } else {
          basketVelocity *= friction;
        }

        // Clamp velocity to max speed
        basketVelocity = Math.min(Math.max(basketVelocity, -maxSpeed), maxSpeed);

        // Update basket position
        basketX += basketVelocity;

        // Stop velocity if very small and no input
        if (Math.abs(basketVelocity) < 0.1 && !keys.left && !keys.right) {
          basketVelocity = 0;
        }
      }

      setBasketPosition(basketX);
    }

    // Main game loop
    let lastTime = 0;
    let starCreationTimer = 0;

    function gameLoop(timestamp = 0) {
      if (!gameRunning) {
        animationId = null;
        return;
      }
      
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;

      // Create stars with dynamic interval
      starCreationTimer += deltaTime;
      if (starCreationTimer > currentStarInterval) {
        createStar();
        starCreationTimer = 0;
      }

      // Update game objects
      updateStars();
      updateBasketMovement();

      animationId = requestAnimationFrame(gameLoop);
    }

    // Initialize
    function init() {
      setBasketPosition(basketX);
      gameContainer.focus();
      
      // Button event listeners
      startBtn.addEventListener('click', () => {
        if (!gameStarted || !gameRunning) {
          startGame();
        } else {
          pauseGame();
        }
      });
      
      resetBtn.addEventListener('click', resetGame);
      playAgainBtn.addEventListener('click', () => {
        resetGame();
        startGame();
      });
      
      // Game event listeners
      gameContainer.addEventListener('keydown', handleKeyDown);
      gameContainer.addEventListener('keyup', handleKeyUp);
      gameContainer.addEventListener('mousemove', handleMouseMove);
      
      // Touch event listeners for mobile
      gameContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
      gameContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
      gameContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
      
      // Prevent context menu on right click and long press
      gameContainer.addEventListener('contextmenu', e => e.preventDefault());
      
      // Initial state
      resetBtn.disabled = true;
    }

    init();
  })();
