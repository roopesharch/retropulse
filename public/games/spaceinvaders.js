export function initSpaceInvadersGame(containerElement) {
    containerElement.innerHTML = `
        <div class="flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-3 sm:p-6 rounded-3xl border border-cyan-500/40 shadow-[0_0_50px_rgba(34,211,238,0.25)] w-full max-w-5xl mx-auto select-none gap-3 sm:gap-5">
            
            <!-- Top Header & Wave Info -->
            <div class="flex items-center justify-between w-full px-2">
                <div class="flex items-center gap-2 sm:gap-3">
                    <div class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-cyan-400 animate-ping"></div>
                    <span class="text-cyan-300 font-mono text-sm sm:text-xl font-extrabold tracking-widest drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">NEO SPACE INVADERS</span>
                </div>
                <div class="flex gap-2">
                    <span id="waveIndicator" class="text-[10px] sm:text-xs font-mono bg-purple-500/20 border border-purple-400/50 text-purple-300 font-bold px-2 sm:px-3 py-1 rounded-full shadow-inner">WAVE 1</span>
                    <span class="hidden md:inline-block text-xs font-mono bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 font-bold px-3 py-1 rounded-full shadow-inner">CYBERPUNK EDITION</span>
                </div>
            </div>

            <!-- Game Stats Bar -->
            <div class="grid grid-cols-3 items-center w-full px-2 font-mono text-xs sm:text-sm font-bold text-cyan-200">
                <div class="bg-black/60 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-cyan-500/30 flex items-center gap-1.5 sm:gap-2 shadow-inner">
                    <span class="text-slate-400 text-[10px] sm:text-xs">SCORE:</span> <span id="invaderScore" class="text-yellow-400 text-xs sm:text-base">0</span>
                </div>
                <div id="invaderBonus" class="text-pink-400 text-[9px] sm:text-xs text-center tracking-tight sm:tracking-wider h-5 flex items-center justify-center truncate px-1"></div>
                <div class="bg-black/60 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-cyan-500/30 flex items-center justify-end gap-1.5 sm:gap-2 shadow-inner">
                    <span class="text-slate-400 text-[10px] sm:text-xs">LIVES:</span> <span id="invaderLives" class="text-pink-400 text-xs sm:text-base">3</span>
                </div>
            </div>

            <!-- Ship Speed Controller Toolbar (Fully Responsive Layout) -->
            <div class="flex flex-col sm:flex-row items-center justify-between w-full px-2 bg-black/40 border border-slate-800 rounded-xl py-2 px-3 sm:px-4 font-mono text-xs gap-2">
                <span class="text-slate-400 font-bold flex items-center gap-1.5 self-start sm:self-center">⚡ SPEED:</span>
                <div class="grid grid-cols-4 gap-1.5 w-full sm:w-auto" id="invaderSpeedSelector">
                    <button data-speed="6" class="inv-speed-btn py-1 px-2 sm:px-3 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:border-cyan-400 transition text-center">Slow</button>
                    <button data-speed="10" class="inv-speed-btn py-1 px-2 sm:px-3 rounded-lg border border-cyan-400 bg-cyan-500/20 text-cyan-300 font-bold transition text-center">Norm</button>
                    <button data-speed="15" class="inv-speed-btn py-1 px-2 sm:px-3 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:border-cyan-400 transition text-center">Fast</button>
                    <button data-speed="20" class="inv-speed-btn py-1 px-2 sm:px-3 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:border-cyan-400 transition text-center">Hyper</button>
                </div>
            </div>
            
            <!-- Canvas Viewport Box -->
            <div class="bg-black border-2 border-cyan-500/60 p-1 sm:p-2 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.3)] relative w-full flex justify-center overflow-hidden">
                <canvas id="invadersCanvas" width="1000" height="560" class="block bg-slate-950 rounded-xl cursor-crosshair w-full h-auto max-h-[58vh] sm:max-h-[65vh] aspect-[10/5.6] object-contain"></canvas>
            </div>

            <!-- Mobile Controls Toolbar (Aligned & Fixed Pointer Fire) -->
            <div class="grid grid-cols-3 gap-2 sm:gap-3 w-full px-1 md:hidden">
                <button id="btnInvLeft" class="bg-cyan-600 active:bg-cyan-700 text-white font-bold py-3.5 rounded-xl text-lg shadow-lg border border-cyan-300 flex items-center justify-center select-none touch-none">◀</button>
                <button id="btnInvFire" class="bg-pink-600 active:bg-pink-700 text-white font-bold py-3.5 rounded-xl text-xs sm:text-sm shadow-lg border border-pink-300 flex items-center justify-center tracking-wider select-none touch-none">FIRE 🚀</button>
                <button id="btnInvRight" class="bg-cyan-600 active:bg-cyan-700 text-white font-bold py-3.5 rounded-xl text-lg shadow-lg border border-cyan-300 flex items-center justify-center select-none touch-none">▶</button>
            </div>
        </div>
    `;

    const canvas = document.getElementById('invadersCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('invaderScore');
    const livesElement = document.getElementById('invaderLives');
    const bonusElement = document.getElementById('invaderBonus');
    const waveElement = document.getElementById('waveIndicator');

    let score = 0;
    let lives = 3;
    let wave = 1;
    let animationFrameId;
    let isPlaying = false;
    let isGameOver = false;

    const canvasWidth = 1000;
    const canvasHeight = 560;

    const player = {
        width: 54,
        height: 26,
        x: canvasWidth / 2 - 27,
        y: canvasHeight - 50,
        speed: 10,
        targetX: canvasWidth / 2 - 27,
        powerUp: 'normal',
        powerUpTimer: 0
    };

    let bullets = [];
    let enemyBullets = [];
    let enemies = [];
    let powerUps = [];
    let particles = [];
    let enemyDirection = 1;
    let enemySpeed = 1.3;
    let shootCooldown = 0;

    // Speed Controller UI Events
    const speedButtons = containerElement.querySelectorAll('.inv-speed-btn');
    speedButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            speedButtons.forEach(b => {
                b.className = "inv-speed-btn py-1 px-2 sm:px-3 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:border-cyan-400 transition text-center";
            });
            e.target.className = "inv-speed-btn py-1 px-2 sm:px-3 rounded-lg border border-cyan-400 bg-cyan-500/20 text-cyan-300 font-bold transition text-center";
            player.speed = parseInt(e.target.getAttribute('data-speed'));
        });
    });

    function initEnemies() {
        enemies = [];
        const rows = 4;
        const cols = 11;
        const enemyWidth = 46;
        const enemyHeight = 30;
        const paddingX = 22;
        const paddingY = 20;
        const offsetX = (canvasWidth - (cols * (enemyWidth + paddingX))) / 2;
        const offsetY = 70;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                enemies.push({
                    x: offsetX + c * (enemyWidth + paddingX),
                    y: offsetY + r * (enemyHeight + paddingY),
                    width: enemyWidth,
                    height: enemyHeight,
                    row: r,
                    alive: true,
                    type: r === 0 ? 'top' : r < 2 ? 'mid' : 'bot'
                });
            }
        }
    }

    function clearCanvas() {
        ctx.fillStyle = '#030712';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    function drawPlayer() {
        ctx.save();
        ctx.shadowColor = player.powerUp === 'laser' ? '#f43f5e' : player.powerUp === 'spread' ? '#fbbf24' : '#38bdf8';
        ctx.shadowBlur = 20;
        ctx.fillStyle = player.powerUp === 'laser' ? '#f43f5e' : player.powerUp === 'spread' ? '#fbbf24' : '#38bdf8';
        
        ctx.beginPath();
        ctx.moveTo(player.x + player.width / 2, player.y - 4);
        ctx.lineTo(player.x + player.width, player.y + player.height);
        ctx.lineTo(player.x + player.width - 10, player.y + player.height - 6);
        ctx.lineTo(player.x + 10, player.y + player.height - 6);
        ctx.lineTo(player.x, player.y + player.height);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#c084fc';
        ctx.fillRect(player.x + player.width / 2 - 6, player.y + 10, 12, 10);
        ctx.restore();
    }

    function drawEnemies() {
        enemies.forEach(e => {
            if (!e.alive) return;
            ctx.save();
            let color = e.type === 'top' ? '#f43f5e' : e.type === 'mid' ? '#fbbf24' : '#c084fc';
            ctx.shadowColor = color;
            ctx.shadowBlur = 12;
            ctx.fillStyle = color;
            
            ctx.beginPath();
            ctx.roundRect(e.x, e.y, e.width, e.height, 8);
            ctx.fill();

            ctx.fillStyle = '#030712';
            ctx.fillRect(e.x + 6, e.y + 8, e.width - 12, 6);
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(e.x + 10, e.y + 10, 6, 2);
            ctx.fillRect(e.x + e.width - 16, e.y + 10, 6, 2);
            ctx.restore();
        });
    }

    function drawBullets() {
        ctx.save();
        bullets.forEach(b => {
            ctx.shadowColor = b.color || '#38bdf8';
            ctx.shadowBlur = 15;
            ctx.fillStyle = b.color || '#38bdf8';
            ctx.fillRect(b.x - (b.width || 3)/2, b.y, b.width || 6, b.height || 18);
        });

        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#f43f5e';
        enemyBullets.forEach(b => {
            ctx.fillRect(b.x - 3, b.y, 6, 16);
        });
        ctx.restore();
    }

    function drawPowerUps() {
        powerUps.forEach(p => {
            ctx.save();
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 16;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(p.symbol, p.x, p.y + 4);
            ctx.restore();
        });
    }

    function drawParticles() {
        particles.forEach((p, index) => {
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.035;
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
        for (let i = 0; i < 15; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 9,
                vy: (Math.random() - 0.5) * 9,
                color: color,
                alpha: 1.0
            });
        }
    }

    function renderStartScreen() {
        clearCanvas();
        drawEnemies();
        drawPlayer();

        ctx.fillStyle = 'rgba(3, 7, 18, 0.88)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('NEO SPACE INVADERS', canvasWidth / 2, canvasHeight / 2 - 30);

        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('► TAP / CLICK TO START ◄', canvasWidth / 2, canvasHeight / 2 + 15);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px monospace';
        ctx.fillText('Hold Space or Fire Button for Continuous Laser', canvasWidth / 2, canvasHeight / 2 + 55);
    }

    const keys = {};
    let isFiring = false;

    window.addEventListener('keydown', e => {
        if (['ArrowLeft', 'ArrowRight', 'Space', 'KeyA', 'KeyD'].includes(e.code)) e.preventDefault();
        keys[e.code] = true;
        if (e.code === 'Space' || e.code === 'KeyW') {
            isFiring = true;
        }
    });
    window.addEventListener('keyup', e => { 
        keys[e.code] = false; 
        if (e.code === 'Space' || e.code === 'KeyW') {
            isFiring = false;
        }
    });

    function fireBullet() {
        let bSpeed = 16;
        let bWidth = 6;
        let bHeight = 18;
        let color = '#38bdf8';

        if (player.powerUp === 'rapid') {
            bSpeed = 22;
            color = '#34d399';
        } else if (player.powerUp === 'laser') {
            bWidth = 10;
            bHeight = 26;
            bSpeed = 20;
            color = '#f43f5e';
        }

        if (player.powerUp === 'spread') {
            bullets.push({ x: player.x + player.width / 2, y: player.y, speedX: 0, speedY: -bSpeed, width: bWidth, height: bHeight, color: '#fbbf24' });
            bullets.push({ x: player.x + player.width / 2, y: player.y, speedX: -4, speedY: -bSpeed * 0.9, width: bWidth, height: bHeight, color: '#fbbf24' });
            bullets.push({ x: player.x + player.width / 2, y: player.y, speedX: 4, speedY: -bSpeed * 0.9, width: bWidth, height: bHeight, color: '#fbbf24' });
        } else {
            bullets.push({ x: player.x + player.width / 2, y: player.y, speedX: 0, speedY: -bSpeed, width: bWidth, height: bHeight, color: color });
        }
    }

    function updateGame() {
        if (isFiring && shootCooldown <= 0 && isPlaying) {
            fireBullet();
            shootCooldown = player.powerUp === 'rapid' ? 4 : 10;
        }
        if (shootCooldown > 0) shootCooldown--;

        if (player.powerUp !== 'normal') {
            player.powerUpTimer--;
            if (player.powerUpTimer <= 0) {
                player.powerUp = 'normal';
                if (bonusElement) bonusElement.innerText = '';
            }
        }

        if (keys['ArrowLeft'] || keys['KeyA']) {
            player.targetX -= player.speed;
        }
        if (keys['ArrowRight'] || keys['KeyD']) {
            player.targetX += player.speed;
        }

        if (player.targetX < 10) player.targetX = 10;
        if (player.targetX > canvasWidth - player.width - 10) player.targetX = canvasWidth - player.width - 10;
        player.x += (player.targetX - player.x) * 0.45;

        for (let i = bullets.length - 1; i >= 0; i--) {
            let b = bullets[i];
            b.y += (b.speedY || -16);
            if (b.speedX) b.x += b.speedX;

            if (b.y < 0 || b.x < 0 || b.x > canvasWidth) {
                bullets.splice(i, 1);
            }
        }

        for (let i = powerUps.length - 1; i >= 0; i--) {
            let p = powerUps[i];
            p.y += 3.5;

            if (p.y >= player.y && p.y <= player.y + player.height && p.x >= player.x && p.x <= player.x + player.width) {
                applyPowerUp(p.type);
                powerUps.splice(i, 1);
                continue;
            }

            if (p.y > canvasHeight) {
                powerUps.splice(i, 1);
            }
        }

        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            enemyBullets[i].y += 6 + (wave * 0.6);
            
            let b = enemyBullets[i];
            if (b.x >= player.x && b.x <= player.x + player.width && b.y >= player.y && b.y <= player.y + player.height) {
                enemyBullets.splice(i, 1);
                createExplosion(player.x + player.width/2, player.y + player.height/2, '#38bdf8');
                lives--;
                if (livesElement) livesElement.innerText = lives;
                if (lives <= 0) {
                    triggerGameOver('GAME OVER');
                }
                continue;
            }

            if (b.y > canvasHeight) {
                enemyBullets.splice(i, 1);
            }
        }

        let edgeReached = false;
        let activeEnemiesCount = 0;

        enemies.forEach(e => {
            if (!e.alive) return;
            activeEnemiesCount++;
            e.x += enemySpeed * enemyDirection;

            if (e.x + e.width >= canvasWidth - 20 || e.x <= 20) {
                edgeReached = true;
            }

            if (e.y + e.height >= player.y) {
                triggerGameOver('ALIENS INVADED EARTH!');
            }
        });

        if (edgeReached) {
            enemyDirection *= -1;
            enemies.forEach(e => {
                e.y += 18;
            });
        }

        if (Math.random() < 0.022 + (wave * 0.005)) {
            let aliveEnemies = enemies.filter(e => e.alive);
            if (aliveEnemies.length > 0) {
                let shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
                enemyBullets.push({
                    x: shooter.x + shooter.width / 2,
                    y: shooter.y + shooter.height
                });
            }
        }

        for (let bi = bullets.length - 1; bi >= 0; bi--) {
            let bullet = bullets[bi];
            for (let ei = 0; ei < enemies.length; ei++) {
                let e = enemies[ei];
                if (e.alive && bullet.x >= e.x && bullet.x <= e.x + e.width && bullet.y >= e.y && bullet.y <= e.y + e.height) {
                    e.alive = false;
                    bullets.splice(bi, 1);
                    score += (e.type === 'top' ? 50 : e.type === 'mid' ? 30 : 10) * wave;
                    if (scoreElement) scoreElement.innerText = score;
                    createExplosion(e.x + e.width/2, e.y + e.height/2, e.type === 'top' ? '#f43f5e' : '#fbbf24');

                    if (Math.random() < 0.2) {
                        let types = ['rapid', 'laser', 'spread'];
                        let pType = types[Math.floor(Math.random() * types.length)];
                        let sym = pType === 'rapid' ? '⚡' : pType === 'laser' ? '🔥' : '💥';
                        let col = pType === 'rapid' ? '#34d399' : pType === 'laser' ? '#f43f5e' : '#fbbf24';
                        powerUps.push({ x: e.x + e.width/2, y: e.y, type: pType, symbol: sym, color: col });
                    }
                    break;
                }
            }
        }

        if (activeEnemiesCount === 0) {
            advanceWave();
        }
    }

    function applyPowerUp(type) {
        player.powerUp = type;
        player.powerUpTimer = 450;
        if (type === 'rapid') {
            if (bonusElement) bonusElement.innerText = '⚡ RAPID LASERS!';
        } else if (type === 'laser') {
            if (bonusElement) bonusElement.innerText = '🔥 HEAVY BEAM!';
        } else if (type === 'spread') {
            if (bonusElement) bonusElement.innerText = '💥 SPREAD SHOT!';
        }
    }

    function advanceWave() {
        isPlaying = false;
        cancelAnimationFrame(animationFrameId);

        wave++;
        if (waveElement) waveElement.innerText = `WAVE ${wave}`;
        enemySpeed += 0.35;

        clearCanvas();
        ctx.fillStyle = 'rgba(3, 7, 18, 0.9)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`WAVE ${wave - 1} CLEARED!`, canvasWidth / 2, canvasHeight / 2 - 20);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('Tap to Start Wave ' + wave, canvasWidth / 2, canvasHeight / 2 + 25);

        const nextWaveHandler = () => {
            canvas.removeEventListener('click', nextWaveHandler);
            initEnemies();
            isPlaying = true;
            startGameLoop();
        };
        canvas.addEventListener('click', nextWaveHandler);
    }

    function startGameLoop() {
        cancelAnimationFrame(animationFrameId);

        function mainLoop() {
            if (!isPlaying || isGameOver) return;
            
            updateGame();
            clearCanvas();
            drawParticles();
            drawPowerUps();
            drawEnemies();
            drawBullets();
            drawPlayer();

            animationFrameId = requestAnimationFrame(mainLoop);
        }

        animationFrameId = requestAnimationFrame(mainLoop);
    }

    function triggerGameOver(message) {
        isGameOver = true;
        isPlaying = false;
        cancelAnimationFrame(animationFrameId);

        clearCanvas();
        drawEnemies();

        ctx.fillStyle = 'rgba(3, 7, 18, 0.9)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(message, canvasWidth / 2, canvasHeight / 2 - 25);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '12px monospace';
        ctx.fillText(`Final Score: ${score} | Waves: ${wave - 1}`, canvasWidth / 2, canvasHeight / 2 + 15);
        ctx.fillText('Tap anywhere to Play Again', canvasWidth / 2, canvasHeight / 2 + 50);
    }

    function resetGame() {
        score = 0;
        lives = 3;
        wave = 1;
        enemySpeed = 1.3;
        player.powerUp = 'normal';
        if (scoreElement) scoreElement.innerText = score;
        if (livesElement) livesElement.innerText = lives;
        if (waveElement) waveElement.innerText = `WAVE 1`;
        if (bonusElement) bonusElement.innerText = '';
        isGameOver = false;
        isPlaying = true;
        bullets = [];
        enemyBullets = [];
        powerUps = [];
        particles = [];
        initEnemies();
        startGameLoop();
    }

    // Canvas Movement tracking
    canvas.addEventListener('mousemove', e => {
        if (!isPlaying) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvasWidth / rect.width;
        let mouseX = (e.clientX - rect.left) * scaleX;
        player.targetX = mouseX - player.width / 2;
        if (player.targetX < 10) player.targetX = 10;
        if (player.targetX > canvasWidth - player.width - 10) player.targetX = canvasWidth - player.width - 10;
    });

    canvas.addEventListener('touchmove', e => {
        if (!isPlaying) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvasWidth / rect.width;
        let touchX = (e.touches[0].clientX - rect.left) * scaleX;
        player.targetX = touchX - player.width / 2;
        if (player.targetX < 10) player.targetX = 10;
        if (player.targetX > canvasWidth - player.width - 10) player.targetX = canvasWidth - player.width - 10;
    }, { passive: true });

    // Mobile buttons with pointer events for reliable cross-platform touch firing
    const btnLeft = document.getElementById('btnInvLeft');
    const btnRight = document.getElementById('btnInvRight');
    const btnFire = document.getElementById('btnInvFire');

    if (btnLeft) btnLeft.onclick = () => { player.targetX = Math.max(10, player.targetX - 50); };
    if (btnRight) btnRight.onclick = () => { player.targetX = Math.min(canvasWidth - player.width - 10, player.targetX + 50); };
    
    if (btnFire) {
        const startFire = (e) => {
            e.preventDefault();
            isFiring = true;
        };
        const endFire = (e) => {
            e.preventDefault();
            isFiring = false;
        };

        btnFire.addEventListener('pointerdown', startFire);
        btnFire.addEventListener('pointerup', endFire);
        btnFire.addEventListener('pointercancel', endFire);
        btnFire.addEventListener('pointerleave', endFire);
    }

    canvas.onclick = () => {
        if (!isPlaying && !isGameOver) {
            isPlaying = true;
            startGameLoop();
        } else if (isGameOver) {
            resetGame();
        }
    };

    initEnemies();
    renderStartScreen();
}