export function initBrickBreakerGame(containerElement) {
    containerElement.innerHTML = `
        <div class="flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-3 sm:p-6 rounded-3xl border border-cyan-500/40 shadow-[0_0_50px_rgba(34,211,238,0.25)] w-full max-w-5xl mx-auto select-none gap-3 sm:gap-5">
            
            <!-- Top Header & Level Info -->
            <div class="flex items-center justify-between w-full px-2">
                <div class="flex items-center gap-2 sm:gap-3">
                    <div class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-cyan-400 animate-ping"></div>
                    <span class="text-cyan-300 font-mono text-sm sm:text-xl font-extrabold tracking-widest drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">NEO BREAKER</span>
                </div>
                <div class="flex gap-2">
                    <span id="levelIndicator" class="text-[10px] sm:text-xs font-mono bg-purple-500/20 border border-purple-400/50 text-purple-300 font-bold px-2 sm:px-3 py-1 rounded-full shadow-inner">LEVEL 1 / 10</span>
                    <span class="hidden md:inline-block text-xs font-mono bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 font-bold px-3 py-1 rounded-full shadow-inner">ULTRA HD</span>
                </div>
            </div>

            <!-- Game Stats Bar -->
            <div class="grid grid-cols-3 items-center w-full px-2 font-mono text-xs sm:text-sm font-bold text-cyan-200">
                <div class="bg-black/60 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-cyan-500/30 flex items-center gap-1.5 sm:gap-2 shadow-inner">
                    <span class="text-slate-400 text-[10px] sm:text-xs">SCORE:</span> <span id="breakerScore" class="text-yellow-400 text-xs sm:text-base">0</span>
                </div>
                <div id="activeBonus" class="text-pink-400 text-[9px] sm:text-xs text-center tracking-tight sm:tracking-wider h-5 flex items-center justify-center truncate px-1"></div>
                <div class="bg-black/60 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-cyan-500/30 flex items-center justify-end gap-1.5 sm:gap-2 shadow-inner">
                    <span class="text-slate-400 text-[10px] sm:text-xs">LIVES:</span> <span id="breakerLives" class="text-pink-400 text-xs sm:text-base">3</span>
                </div>
            </div>

            <!-- Paddle Speed Controller Toolbar (Fully Responsive Layout) -->
            <div class="flex flex-col sm:flex-row items-center justify-between w-full px-2 bg-black/40 border border-slate-800 rounded-xl py-2 px-3 sm:px-4 font-mono text-xs gap-2">
                <span class="text-slate-400 font-bold flex items-center gap-1.5 self-start sm:self-center">⚡ SPEED:</span>
                <div class="grid grid-cols-4 gap-1.5 w-full sm:w-auto" id="speedSelector">
                    <button data-speed="8" class="speed-btn py-1 px-2 sm:px-3 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:border-cyan-400 transition text-center">Slow</button>
                    <button data-speed="12" class="speed-btn py-1 px-2 sm:px-3 rounded-lg border border-cyan-400 bg-cyan-500/20 text-cyan-300 font-bold transition text-center">Norm</button>
                    <button data-speed="17" class="speed-btn py-1 px-2 sm:px-3 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:border-cyan-400 transition text-center">Fast</button>
                    <button data-speed="24" class="speed-btn py-1 px-2 sm:px-3 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:border-cyan-400 transition text-center">Hyper</button>
                </div>
            </div>
            
            <!-- Canvas Viewport Box -->
            <div class="bg-black border-2 border-cyan-500/60 p-1 sm:p-2 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.3)] relative w-full flex justify-center overflow-hidden">
                <canvas id="breakerCanvas" width="1000" height="560" class="block bg-slate-950 rounded-xl cursor-crosshair w-full h-auto max-h-[58vh] sm:max-h-[65vh] aspect-[10/5.6] object-contain"></canvas>
            </div>

            <!-- Mobile Controls Toolbar (Aligned & Fixed Pointer Handlers) -->
            <div class="grid grid-cols-2 gap-3 w-full px-1 md:hidden">
                <button id="btnLeft" class="bg-cyan-600 active:bg-cyan-700 text-white font-bold py-3.5 rounded-xl text-lg shadow-lg border border-cyan-300 flex items-center justify-center select-none touch-none">◀</button>
                <button id="btnRight" class="bg-cyan-600 active:bg-cyan-700 text-white font-bold py-3.5 rounded-xl text-lg shadow-lg border border-cyan-300 flex items-center justify-center select-none touch-none">▶</button>
            </div>
        </div>
    `;

    const canvas = document.getElementById('breakerCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('breakerScore');
    const livesElement = document.getElementById('breakerLives');
    const bonusElement = document.getElementById('activeBonus');
    const levelElement = document.getElementById('levelIndicator');

    let score = 0;
    let lives = 3;
    let currentLevel = 1;
    let animationFrameId;
    let isPlaying = false;
    let isGameOver = false;

    const canvasWidth = 1000;
    const canvasHeight = 560;

    const paddle = {
        width: 140,
        height: 16,
        x: canvasWidth / 2 - 70,
        y: canvasHeight - 40,
        speed: 12,
        targetX: canvasWidth / 2 - 70,
        isExpanded: false
    };

    // Handle Speed Controller Selection Buttons UI
    const speedButtons = containerElement.querySelectorAll('.speed-btn');
    speedButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            speedButtons.forEach(b => {
                b.className = "speed-btn py-1 px-2 sm:px-3 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:border-cyan-400 transition text-center";
            });
            e.target.className = "speed-btn py-1 px-2 sm:px-3 rounded-lg border border-cyan-400 bg-cyan-500/20 text-cyan-300 font-bold transition text-center";
            paddle.speed = parseInt(e.target.getAttribute('data-speed'));
        });
    });

    let balls = [];
    let powerUps = [];
    let particles = [];
    let bricks = [];

    const brickRowCount = 5;
    const brickColumnCount = 12;
    const brickWidth = 70;
    const brickHeight = 22;
    const brickPadding = 10;
    const brickOffsetTop = 45;
    const brickOffsetLeft = 50;

    function initBricks() {
        bricks = [];
        const colors = ['#f43f5e', '#fbbf24', '#34d399', '#38bdf8', '#c084fc'];
        
        for (let c = 0; c < brickColumnCount; c++) {
            bricks[c] = [];
            for (let r = 0; r < brickRowCount; r++) {
                let shouldSpawn = true;
                if (currentLevel === 3 && (c + r) % 2 === 0) shouldSpawn = false;
                if (currentLevel === 6 && (c === 0 || c === brickColumnCount - 1)) shouldSpawn = r % 2 === 0;
                if (currentLevel >= 8 && Math.random() < 0.15) shouldSpawn = false;

                let hasPowerUp = Math.random() < 0.2;
                let pType = Math.random() < 0.5 ? 'expand' : 'multiball';
                
                bricks[c][r] = { 
                    x: 0, 
                    y: 0, 
                    status: shouldSpawn ? 1 : 0, 
                    color: colors[r],
                    hasPowerUp: hasPowerUp,
                    powerUpType: pType
                };
            }
        }
    }

    function clearCanvas() {
        ctx.fillStyle = '#030712';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    function drawPaddle() {
        ctx.save();
        ctx.shadowColor = paddle.isExpanded ? '#c084fc' : '#38bdf8';
        ctx.shadowBlur = 18;
        ctx.fillStyle = paddle.isExpanded ? '#c084fc' : '#38bdf8';
        ctx.beginPath();
        ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 8);
        ctx.fill();
        ctx.restore();
    }

    function drawBalls() {
        balls.forEach(ball => {
            ctx.save();
            ctx.shadowColor = '#f43f5e';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#f43f5e';
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    function drawPowerUps() {
        powerUps.forEach(p => {
            ctx.save();
            ctx.fillStyle = p.type === 'expand' ? '#c084fc' : '#fbbf24';
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(p.type === 'expand' ? '↔' : '+++', p.x, p.y + 4);
            ctx.restore();
        });
    }

    function drawParticles() {
        particles.forEach((p, index) => {
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.03;
            if (p.alpha <= 0) {
                particles.splice(index, 1);
                return;
            }
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 5, 5);
            ctx.restore();
        });
    }

    function createExplosion(x, y, color) {
        for (let i = 0; i < 10; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 7,
                vy: (Math.random() - 0.5) * 7,
                color: color,
                alpha: 1.0
            });
        }
    }

    function drawBricks() {
        for (let c = 0; c < brickColumnCount; c++) {
            for (let r = 0; r < brickRowCount; r++) {
                let b = bricks[c][r];
                if (b.status === 1) {
                    let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                    let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                    b.x = brickX;
                    b.y = brickY;

                    ctx.save();
                    ctx.shadowColor = b.color;
                    ctx.shadowBlur = 8;
                    ctx.fillStyle = b.color;
                    ctx.beginPath();
                    ctx.roundRect(brickX, brickY, brickWidth, brickHeight, 5);
                    ctx.fill();

                    if (b.hasPowerUp) {
                        ctx.fillStyle = 'rgba(255,255,255,0.7)';
                        ctx.beginPath();
                        ctx.arc(brickX + brickWidth / 2, brickY + brickHeight / 2, 4, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.restore();
                }
            }
        }
    }

    function renderStartScreen() {
        clearCanvas();
        drawBricks();
        drawPaddle();

        ctx.fillStyle = 'rgba(3, 7, 18, 0.88)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 26px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('NEO BRICK BREAKER', canvasWidth / 2, canvasHeight / 2 - 30);

        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('► TAP / CLICK ANYWHERE TO START ◄', canvasWidth / 2, canvasHeight / 2 + 15);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px monospace';
        ctx.fillText('10 Levels • Adjustable Paddle Speed • Power-up Bounties', canvasWidth / 2, canvasHeight / 2 + 55);
    }

    const keys = {};
    window.addEventListener('keydown', e => {
        if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(e.code)) e.preventDefault();
        keys[e.code] = true;
    });
    window.addEventListener('keyup', e => { keys[e.code] = false; });

    function updatePaddlePosition() {
        if (keys['ArrowLeft'] || keys['KeyA']) {
            paddle.targetX -= paddle.speed;
        }
        if (keys['ArrowRight'] || keys['KeyD']) {
            paddle.targetX += paddle.speed;
        }

        if (paddle.targetX < 0) paddle.targetX = 0;
        if (paddle.targetX > canvasWidth - paddle.width) paddle.targetX = canvasWidth - paddle.width;

        paddle.x += (paddle.targetX - paddle.x) * 0.45;
    }

    function startGameLoop() {
        cancelAnimationFrame(animationFrameId);

        function mainLoop() {
            if (!isPlaying || isGameOver) return;
            
            updatePaddlePosition();
            clearCanvas();
            drawBricks();
            drawParticles();
            drawPowerUps();
            drawPaddle();
            drawBalls();
            movePowerUps();
            collisionDetection();
            moveBalls();

            animationFrameId = requestAnimationFrame(mainLoop);
        }

        animationFrameId = requestAnimationFrame(mainLoop);
    }

    function moveBalls() {
        for (let i = balls.length - 1; i >= 0; i--) {
            let ball = balls[i];
            ball.x += ball.speedX;
            ball.y += ball.speedY;

            if (ball.x + ball.radius > canvasWidth || ball.x - ball.radius < 0) {
                ball.speedX = -ball.speedX;
            }
            if (ball.y - ball.radius < 0) {
                ball.speedY = -ball.speedY;
            }

            if (ball.y + ball.radius >= paddle.y && ball.y - ball.radius <= paddle.y + paddle.height && ball.x >= paddle.x && ball.x <= paddle.x + paddle.width) {
                ball.speedY = -Math.abs(ball.speedY);
                let hitPoint = ball.x - (paddle.x + paddle.width / 2);
                ball.speedX = hitPoint * 0.14;
            }

            if (ball.y + ball.radius > canvasHeight) {
                balls.splice(i, 1);
            }
        }

        if (balls.length === 0) {
            lives--;
            if (livesElement) livesElement.innerText = lives;
            if (lives <= 0) {
                triggerGameOver('GAME OVER');
            } else {
                resetBallAndPaddle();
            }
        }
    }

    function movePowerUps() {
        for (let i = powerUps.length - 1; i >= 0; i--) {
            let p = powerUps[i];
            p.y += 3;

            if (p.y >= paddle.y && p.y <= paddle.y + paddle.height && p.x >= paddle.x && p.x <= paddle.x + paddle.width) {
                applyPowerUp(p.type);
                powerUps.splice(i, 1);
                continue;
            }

            if (p.y > canvasHeight) {
                powerUps.splice(i, 1);
            }
        }
    }

    function applyPowerUp(type) {
        if (type === 'expand') {
            paddle.width = 200;
            paddle.isExpanded = true;
            if (bonusElement) bonusElement.innerText = '✨ EXPANDED PADDLE!';
            setTimeout(() => {
                paddle.width = 140;
                paddle.isExpanded = false;
                if (bonusElement) bonusElement.innerText = '';
            }, 10000);
        } else if (type === 'multiball') {
            if (bonusElement) bonusElement.innerText = '⚡ MULTI-BALL!';
            let currentBall = balls[0] || { x: paddle.x + paddle.width/2, y: paddle.y - 20 };
            let baseSpeed = 3.5 + (currentLevel * 0.3);
            balls.push({ x: currentBall.x, y: currentBall.y, radius: 8, speedX: baseSpeed, speedY: -baseSpeed });
            balls.push({ x: currentBall.x, y: currentBall.y, radius: 8, speedX: -baseSpeed, speedY: -baseSpeed });
            setTimeout(() => { if (bonusElement) bonusElement.innerText = ''; }, 4000);
        }
    }

    function collisionDetection() {
        let activeBricksCount = 0;
        for (let c = 0; c < brickColumnCount; c++) {
            for (let r = 0; r < brickRowCount; r++) {
                let b = bricks[c][r];
                if (b.status === 1) {
                    activeBricksCount++;
                    balls.forEach(ball => {
                        if (ball.x > b.x && ball.x < b.x + brickWidth && ball.y > b.y && ball.y < b.y + brickHeight) {
                            ball.speedY = -ball.speedY;
                            b.status = 0;
                            score += 20 * currentLevel;
                            if (scoreElement) scoreElement.innerText = score;
                            createExplosion(b.x + brickWidth/2, b.y + brickHeight/2, b.color);

                            if (b.hasPowerUp) {
                                powerUps.push({ x: b.x + brickWidth/2, y: b.y, type: b.powerUpType });
                            }
                        }
                    });
                }
            }
        }

        if (activeBricksCount === 0) {
            advanceLevel();
        }
    }

    function advanceLevel() {
        isPlaying = false;
        cancelAnimationFrame(animationFrameId);

        if (currentLevel >= 10) {
            triggerGameOver('VICTORY! YOU BEAT ALL 10 LEVELS! 🎉');
            return;
        }

        currentLevel++;
        if (levelElement) levelElement.innerText = `LEVEL ${currentLevel} / 10`;

        clearCanvas();
        ctx.fillStyle = 'rgba(3, 7, 18, 0.9)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`LEVEL ${currentLevel - 1} CLEARED!`, canvasWidth / 2, canvasHeight / 2 - 20);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('Tap to Start Level ' + currentLevel, canvasWidth / 2, canvasHeight / 2 + 25);

        const nextLevelHandler = () => {
            canvas.removeEventListener('click', nextLevelHandler);
            initBricks();
            resetBallAndPaddle();
            isPlaying = true;
            startGameLoop();
        };
        canvas.addEventListener('click', nextLevelHandler);
    }

    function resetBallAndPaddle() {
        let speed = 4 + (currentLevel * 0.3);
        balls = [{
            x: canvasWidth / 2,
            y: paddle.y - 20,
            radius: 8,
            speedX: speed,
            speedY: -speed
        }];
        paddle.targetX = canvasWidth / 2 - paddle.width / 2;
        paddle.x = paddle.targetX;
    }

    function triggerGameOver(message) {
        isGameOver = true;
        isPlaying = false;
        cancelAnimationFrame(animationFrameId);

        clearCanvas();
        drawBricks();

        ctx.fillStyle = 'rgba(3, 7, 18, 0.9)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.fillStyle = message.includes('VICTORY') ? '#34d399' : '#f43f5e';
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(message, canvasWidth / 2, canvasHeight / 2 - 25);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '12px monospace';
        ctx.fillText(`Final Score: ${score} | Level Reached: ${currentLevel}`, canvasWidth / 2, canvasHeight / 2 + 15);
        ctx.fillText('Tap anywhere to Play Again', canvasWidth / 2, canvasHeight / 2 + 50);
    }

    function resetGame() {
        score = 0;
        lives = 3;
        currentLevel = 1;
        if (scoreElement) scoreElement.innerText = score;
        if (livesElement) livesElement.innerText = lives;
        if (levelElement) levelElement.innerText = `LEVEL 1 / 10`;
        if (bonusElement) bonusElement.innerText = '';
        isGameOver = false;
        isPlaying = true;
        powerUps = [];
        particles = [];
        initBricks();
        resetBallAndPaddle();
        startGameLoop();
    }

    canvas.addEventListener('mousemove', e => {
        if (!isPlaying) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvasWidth / rect.width;
        let mouseX = (e.clientX - rect.left) * scaleX;
        paddle.targetX = mouseX - paddle.width / 2;
        if (paddle.targetX < 0) paddle.targetX = 0;
        if (paddle.targetX > canvasWidth - paddle.width) paddle.targetX = canvasWidth - paddle.width;
    });

    canvas.addEventListener('touchmove', e => {
        if (!isPlaying) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvasWidth / rect.width;
        let touchX = (e.touches[0].clientX - rect.left) * scaleX;
        paddle.targetX = touchX - paddle.width / 2;
        if (paddle.targetX < 0) paddle.targetX = 0;
        if (paddle.targetX > canvasWidth - paddle.width) paddle.targetX = canvasWidth - paddle.width;
    }, { passive: true });

    const btnLeft = document.getElementById('btnLeft');
    const btnRight = document.getElementById('btnRight');
    
    if (btnLeft) {
        btnLeft.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            paddle.targetX = Math.max(0, paddle.targetX - 90);
        });
    }
    if (btnRight) {
        btnRight.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            paddle.targetX = Math.min(canvasWidth - paddle.width, paddle.targetX + 90);
        });
    }

    canvas.onclick = () => {
        if (!isPlaying && !isGameOver) {
            isPlaying = true;
            startGameLoop();
        } else if (isGameOver) {
            resetGame();
        }
    };

    initBricks();
    renderStartScreen();
}