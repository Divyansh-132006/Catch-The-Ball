  (() => {
   
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

    let mouseX = basketX + basketWidth / 2;
    let isUsingMouse = false;
    let lastMouseMoveTime = 0;

    
    const stars = [];
    const baseFallSpeed = 3.5;
    let currentStarInterval = 1000; // Start a bit slower
    let currentFallSpeedMultiplier = 1.0;

    
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
      
      gameRunning = false;
      gameStarted = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
     
      stars.forEach(star => {
        if (star.parentNode) {
          gameContainer.removeChild(star);
        }
      });
      stars.length = 0;
      
      
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
     
      updateUI();
      startBtn.textContent = 'Start Game';
      startBtn.disabled = false;
      resetBtn.disabled = true;
      gameOverScreen.style.display = 'none';
      
      
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
    
    function createStar() {
      if (!gameRunning) return;
      
      const star = document.createElement('div');
      star.classList.add('star');
      star.style.left = Math.random() * (containerWidth - 25) + 'px';
      star.style.top = '-30px';
      
      star.baseFallSpeed = baseFallSpeed + Math.random() * 1.5;
      gameContainer.appendChild(star);
      stars.push(star);
    }

    
    function setBasketPosition(x) {
      basketX = Math.min(Math.max(0, x), containerWidth - basketWidth);
      basket.style.left = basketX + 'px';
    }

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

    
    function updateStars() {
      if (!gameRunning) return;
      
      for (let i = stars.length - 1; i >= 0; i--) {
        const star = stars[i];
        let top = parseFloat(star.style.top);
        
        
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
          
          missedStars++;
          updateUI();
          gameContainer.removeChild(star);
          stars.splice(i, 1);
          
          if (missedStars >= maxMissedStars) {
            gameOver();
            return;
          }
        }
      }
    }

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

  
    function handleMouseMove(e) {
      if (!gameRunning) return;
      
      const rect = gameContainer.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      isUsingMouse = true;
      lastMouseMoveTime = performance.now();
    }

    
    function updateBasketMovement() {
      if (!gameRunning) return;
      
    
      if (isUsingMouse && performance.now() - lastMouseMoveTime > 100) {
        isUsingMouse = false;
      }

      if (isUsingMouse) {
        
        const targetX = Math.min(Math.max(0, mouseX - basketWidth / 2), containerWidth - basketWidth);
        const distance = targetX - basketX;
        const smoothFactor = 0.25; 
        basketX += distance * smoothFactor;
        basketVelocity = distance * smoothFactor; 
      } else {
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

    let lastTime = 0;
    let starCreationTimer = 0;

    function gameLoop(timestamp = 0) {
      if (!gameRunning) {
        animationId = null;
        return;
      }
      
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;

      
      starCreationTimer += deltaTime;
      if (starCreationTimer > currentStarInterval) {
        createStar();
        starCreationTimer = 0;
      }

      
      updateStars();
      updateBasketMovement();

      animationId = requestAnimationFrame(gameLoop);
    }

    
    function init() {
      setBasketPosition(basketX);
      gameContainer.focus();
      
      
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
      
      gameContainer.addEventListener('keydown', handleKeyDown);
      gameContainer.addEventListener('keyup', handleKeyUp);
      gameContainer.addEventListener('mousemove', handleMouseMove);
  
      gameContainer.addEventListener('contextmenu', e => e.preventDefault());
      
  
      resetBtn.disabled = true;
    }

    init();
  })();
