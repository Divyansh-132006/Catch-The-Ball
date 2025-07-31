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
      const tiltIndicator = document.getElementById('tiltIndicator');
      
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

     g
      let touchX = basketX + basketWidth / 2;
      let isUsingTouch = false;
      let lastTouchTime = 0;
      let deviceOrientationSupported = false;
      let initialGamma = null;
      
     
      const stars = [];
      const baseFallSpeed = 3.5;
      let currentStarInterval = 1000;
      let currentFallSpeedMultiplier = 1.0;

     
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                       'ontouchstart' in window || 
                       window.innerWidth <= 768;

      function updateDifficulty() {
        if (score >= 50) {
          currentStarInterval = 300;
          currentFallSpeedMultiplier = 1.8;
          difficultyIndicator.textContent = 'HARD MODE!';
          difficultyIndicator.style.color = '#ff3333';
          difficultyIndicator.style.fontSize = 'clamp(0.9rem, 3vw, 1.1rem)';
        } else if(score >=20){
              currentStarInterval = 700;
          currentFallSpeedMultiplier = 1.5;
          difficultyIndicator.textContent = 'Medium';
          difficultyIndicator.style.color = '#ff3333';
          difficultyIndicator.style.fontSize = 'clamp(0.9rem, 3vw, 1.1rem)';
        }
        else {
          currentStarInterval = 1000;
          currentFallSpeedMultiplier = 1.0;
          difficultyIndicator.textContent = 'Normal';
          difficultyIndicator.style.color = '#88ffaa';
          difficultyIndicator.style.fontSize = 'clamp(0.8rem, 2.5vw, 1rem)';
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
        tiltIndicator.style.display = 'none';
        
        if (!animationId) {
          requestAnimationFrame(gameLoop);
        }
      }
      
      function pauseGame() {
        gameRunning = false;
        startBtn.textContent = 'Resume';
        tiltIndicator.style.display = 'block';
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
        touchX = basketX + basketWidth / 2;
        isUsingTouch = false;
        lastTouchTime = 0;
        lastTime = 0;
        starCreationTimer = 0;
        currentStarInterval = 1000;
        currentFallSpeedMultiplier = 1.0;
       
        updateUI();
        startBtn.textContent = 'Start Game';
        startBtn.disabled = false;
        resetBtn.disabled = true;
        gameOverScreen.style.display = 'none';
        tiltIndicator.style.display = 'block';
        
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
        tiltIndicator.style.display = 'block';
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

      
      function handleTouchMove(e) {
        if (!gameRunning) return;
        e.preventDefault();
        
        const rect = gameContainer.getBoundingClientRect();
        const touch = e.touches[0] || e.changedTouches[0];
        touchX = touch.clientX - rect.left;
        isUsingTouch = true;
        lastTouchTime = performance.now();
      }

      function handleTouchStart(e) {
        if (!gameRunning) return;
        e.preventDefault();
        handleTouchMove(e);
      }

      function handleTouchEnd(e) {
        e.preventDefault();
      }

      
      function handleDeviceOrientation(e) {
        if (!gameRunning || !deviceOrientationSupported) return;
        
        if (initialGamma === null) {
          initialGamma = e.gamma || 0;
          return;
        }

        const gamma = e.gamma || 0;
        const tiltSensitivity = 3;
        const tiltDifference = (gamma - initialGamma) * tiltSensitivity;
        
        
        const centerX = containerWidth / 2;
        const maxTilt = 30; 
        const normalizedTilt = Math.max(-1, Math.min(1, tiltDifference / maxTilt));
        
        touchX = centerX + (normalizedTilt * centerX);
        isUsingTouch = true;
        lastTouchTime = performance.now();
      }

      function updateBasketMovement() {
        if (!gameRunning) return;
        
        
        if (isUsingTouch && performance.now() - lastTouchTime > 100) {
          isUsingTouch = false;
        }

        if (isUsingTouch) {
         
          const targetX = Math.min(Math.max(0, touchX - basketWidth / 2), containerWidth - basketWidth);
          const distance = targetX - basketX;
          const smoothFactor = 0.3; // Increased for more responsive feel
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
        
       
        gameContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
        gameContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
        gameContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
        
      
        gameContainer.addEventListener('mousemove', (e) => {
          if (!gameRunning) return;
          const rect = gameContainer.getBoundingClientRect();
          touchX = e.clientX - rect.left;
          isUsingTouch = true;
          lastTouchTime = performance.now();
        });

        
        if (window.DeviceOrientationEvent) {
          window.addEventListener('deviceorientation', (e) => {
            if (e.gamma !== null) {
              deviceOrientationSupported = true;
              handleDeviceOrientation(e);
            }
          });
        }

        
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
          startBtn.addEventListener('click', async () => {
            try {
              const permission = await DeviceOrientationEvent.requestPermission();
              if (permission === 'granted') {
                deviceOrientationSupported = true;
              }
            } catch (error) {
              console.log('Device orientation not supported');
            }
          });
        }

        gameContainer.addEventListener('contextmenu', e => e.preventDefault());
        resetBtn.disabled = true;

      
        if (isMobile) {
          if (deviceOrientationSupported) {
            tiltIndicator.textContent = 'Tilt device or touch to move';
          } else {
            tiltIndicator.textContent = 'Touch to move basket';
          }
        } else {
          tiltIndicator.textContent = 'Use arrow keys or mouse';
        }
      }

      window.addEventListener('resize', () => {
        const newContainerWidth = gameContainer.clientWidth;
        const newContainerHeight = gameContainer.clientHeight;
        
        
        basketX = (basketX / containerWidth) * newContainerWidth;
        setBasketPosition(basketX);
      });

      init();
    })();
