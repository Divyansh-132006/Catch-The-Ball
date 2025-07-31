 (() => {
      // Get elements
      const gameContainer = document.getElementById('gameContainer');
      const basket = document.getElementById('basket');
      const scoreBoard = document.getElementById('scoreBoard');
      const missedCounter = document.getElementById('missedCounter');
      const difficultyIndicator = document.getElementById('difficultyIndicator');
      const startBtn = document.getElementById('startBtn');
      const resetBtn = document.getElementById('resetBtn');
      const gameOverScreen = document.getElementById('gameOverScreen');
      const finalScore = document.getElementById('finalScore');
      const gameOverReason = document.getElementById('gameOverReason');
      const playAgainBtn = document.getElementById('playAgainBtn');
      const instructions = document.getElementById('instructions');
      
      // Game state variables
      let gameRunning = false;
      let gameStarted = false;
      let animationId = null;
      let missedStars = 0;
      const maxMissedStars = 10;
      let score = 0;
      
      // Basket movement variables
      let basketX = 0;
      let basketVelocity = 0;
      const maxSpeed = 8;
      const acceleration = 0.8;
      const friction = 0.88;
      
      // Input handling
      let targetX = 0;
      let isUsingTouch = false;
      let lastInputTime = 0;
      
      // Stars array and settings
      const stars = [];
      const baseFallSpeed = 3.5;
      let currentStarInterval = 1000;
      let currentFallSpeedMultiplier = 1.0;
      let lastTime = 0;
      let starCreationTimer = 0;
      
      // Keyboard state
      const keys = { left: false, right: false };

      // Get container dimensions (need to wait for layout)
      function getContainerDimensions() {
        return {
          width: gameContainer.clientWidth,
          height: gameContainer.clientHeight,
          basketWidth: 100, // Fixed width
          basketHeight: 60  // Fixed height
        };
      }

      function initializePositions() {
        const dims = getContainerDimensions();
        basketX = dims.width / 2 - dims.basketWidth / 2;
        targetX = basketX + dims.basketWidth / 2;
        setBasketPosition(basketX);
      }

      function updateDifficulty() {
        if (score >= 50) {
          currentStarInterval = 300;
          currentFallSpeedMultiplier = 1.8;
          difficultyIndicator.textContent = 'HARD MODE!';
          difficultyIndicator.style.color = '#ff3333';
          difficultyIndicator.style.fontSize = '1.1rem';
        } else if(score >= 20){
              currentStarInterval = 700;
          currentFallSpeedMultiplier = 1.5;
          difficultyIndicator.textContent = 'Medium';
          difficultyIndicator.style.color = '#ff3333';
          difficultyIndicator.style.fontSize = '1.1rem'
        }
        else {
          currentStarInterval = 1000;
          currentFallSpeedMultiplier = 1.0;
          difficultyIndicator.textContent = 'Normal';
          difficultyIndicator.style.color = '#88ffaa';
          difficultyIndicator.style.fontSize = '0.9rem';
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
        resetBtn.disabled = false;
        gameOverScreen.style.display = 'none';
        instructions.style.display = 'none';
        
        if (!animationId) {
          lastTime = performance.now();
          animationId = requestAnimationFrame(gameLoop);
        }
      }
      
      function pauseGame() {
        gameRunning = false;
        startBtn.textContent = 'Resume';
        instructions.style.display = 'block';
      }
      
      function resetGame() {
        gameRunning = false;
        gameStarted = false;
        
        if (animationId) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
       
        // Clear all stars
        stars.forEach(star => {
          if (star.element && star.element.parentNode) {
            gameContainer.removeChild(star.element);
          }
        });
        stars.length = 0;
        
        // Reset game state
        score = 0;
        missedStars = 0;
        basketVelocity = 0;
        isUsingTouch = false;
        lastInputTime = 0;
        lastTime = 0;
        starCreationTimer = 0;
        currentStarInterval = 1000;
        currentFallSpeedMultiplier = 1.0;
        
        // Reset positions
        initializePositions();
        
        updateUI();
        startBtn.textContent = 'Start Game';
        resetBtn.disabled = true;
        gameOverScreen.style.display = 'none';
        instructions.style.display = 'block';
      }
      
      function gameOver() {
        gameRunning = false;
        gameStarted = false;
        finalScore.textContent = `Final Score: ${score}`;
        gameOverReason.textContent = `You missed ${maxMissedStars} stars!`;
        gameOverScreen.style.display = 'flex';
        startBtn.textContent = 'Start Game';
        startBtn.disabled = true;
        instructions.style.display = 'block';
      }
      
      function createStar() {
        if (!gameRunning) return;
        
        const dims = getContainerDimensions();
        const element = document.createElement('div');
        element.classList.add('star');
        element.style.left = Math.random() * (dims.width - 25) + 'px';
        element.style.top = '-30px';
        
        const star = {
          element: element,
          x: parseFloat(element.style.left),
          y: -30,
          speed: baseFallSpeed + Math.random() * 1.5
        };
        
        gameContainer.appendChild(element);
        stars.push(star);
      }

      function setBasketPosition(x) {
        const dims = getContainerDimensions();
        basketX = Math.min(Math.max(0, x), dims.width - dims.basketWidth);
        basket.style.left = basketX + 'px';
      }

      function checkCollision(star) {
        const dims = getContainerDimensions();
        const starLeft = star.x;
        const starTop = star.y;
        const starRight = starLeft + 25;
        const starBottom = starTop + 25;

        const basketLeft = basketX;
        const basketTop = dims.height - 80; // basket bottom position
        const basketRight = basketLeft + dims.basketWidth;
        const basketBottom = dims.height - 20;

        return !(starRight < basketLeft || starLeft > basketRight || starBottom < basketTop || starTop > basketBottom);
      }

      function updateStars() {
        if (!gameRunning) return;
        
        const dims = getContainerDimensions();
        
        for (let i = stars.length - 1; i >= 0; i--) {
          const star = stars[i];
          const currentSpeed = star.speed * currentFallSpeedMultiplier;
          star.y += currentSpeed;
          star.element.style.top = star.y + 'px';

          if (checkCollision(star)) {
            score++;
            updateUI();
            gameContainer.removeChild(star.element);
            stars.splice(i, 1);
            continue;
          }
          
          if (star.y > dims.height) {
            missedStars++;
            updateUI();
            gameContainer.removeChild(star.element);
            stars.splice(i, 1);
            
            if (missedStars >= maxMissedStars) {
              gameOver();
              return;
            }
          }
        }
      }

      // Input handlers
      function handleKeyDown(e) {
        if (!gameRunning) return;
        
        if (e.code === 'ArrowLeft' || e.key === 'ArrowLeft') {
          keys.left = true;
          isUsingTouch = false;
        }
        if (e.code === 'ArrowRight' || e.key === 'ArrowRight') {
          keys.right = true;
          isUsingTouch = false;
        }
        
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

      function handlePointerMove(e) {
        if (!gameRunning) return;
        e.preventDefault();
        
        const rect = gameContainer.getBoundingClientRect();
        targetX = e.clientX - rect.left;
        isUsingTouch = true;
        lastInputTime = performance.now();
      }

      function updateBasketMovement() {
        if (!gameRunning) return;
        
        const dims = getContainerDimensions();
        
        // Auto-disable touch input after inactivity
        if (isUsingTouch && performance.now() - lastInputTime > 150) {
          isUsingTouch = false;
        }

        if (isUsingTouch) {
          // Smooth touch following
          const targetBasketX = Math.min(Math.max(0, targetX - dims.basketWidth / 2), dims.width - dims.basketWidth);
          const distance = targetBasketX - basketX;
          const smoothFactor = 0.25;
          basketX += distance * smoothFactor;
          basketVelocity = distance * smoothFactor;
        } else {
          // Keyboard controls
          if (keys.left) {
            basketVelocity -= acceleration;
          } else if (keys.right) {
            basketVelocity += acceleration;
          } else {
            basketVelocity *= friction;
          }

          basketVelocity = Math.min(Math.max(basketVelocity, -maxSpeed), maxSpeed);
          basketX += basketVelocity;

          if (Math.abs(basketVelocity) < 0.1 && !keys.left && !keys.right) {
            basketVelocity = 0;
          }
        }

        setBasketPosition(basketX);
      }

      function gameLoop(timestamp) {
        if (!gameRunning) {
          animationId = null;
          return;
        }
        
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;

        // Create stars
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

      function init() {
        // Wait for layout to complete
        setTimeout(() => {
          initializePositions();
          gameContainer.focus();
          
          // Event listeners
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
          
          // Keyboard events
          document.addEventListener('keydown', handleKeyDown);
          document.addEventListener('keyup', handleKeyUp);
          
          // Pointer events (works for both mouse and touch)
          gameContainer.addEventListener('pointermove', handlePointerMove);
          gameContainer.addEventListener('touchmove', handlePointerMove, { passive: false });
          gameContainer.addEventListener('mousemove', handlePointerMove);
          
          gameContainer.addEventListener('contextmenu', e => e.preventDefault());
          resetBtn.disabled = true;
          
          updateUI();
        }, 100);
      }

      // Handle window resize
      window.addEventListener('resize', () => {
        if (gameStarted) {
          const dims = getContainerDimensions();
          basketX = Math.min(basketX, dims.width - dims.basketWidth);
          setBasketPosition(basketX);
        }
      });

      init();
    })();
