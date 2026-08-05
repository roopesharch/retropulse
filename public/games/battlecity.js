// public/games/battlecity.js

export function initBattleCityGame(container) {
    container.innerHTML = `
        <div class="flex flex-col items-center justify-center bg-slate-950 p-2 sm:p-4 rounded-xl border border-slate-800 shadow-2xl w-full max-w-md select-none">
            <div class="flex justify-between w-full mb-2 px-2 text-[11px] sm:text-xs font-mono text-amber-400">
                <div>LVL: <span id="bcLevel">1</span>/50</div>
                <div>PTS: <span id="bcScore">0</span></div>
                <div>FOE: <span id="bcEnemies">10</span></div>
                <div>HP: <span id="bcLives">3</span></div>
            </div>
            
            <div class="relative bg-black border-2 border-slate-700 rounded-lg overflow-hidden flex items-center justify-center w-full aspect-square max-w-[380px]">
                <canvas id="bcCanvas" width="416" height="416" class="w-full h-full block bg-black"></canvas>
                <div id="bcOverlay" class="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center p-4 z-10">
                    <h2 class="text-lg sm:text-xl font-black text-amber-400 mb-2">BATTLE CITY</h2>
                    <p class="text-[11px] sm:text-xs text-slate-300 mb-4">Arrow Keys / WASD or Touch D-Pad Below<br>Protect the Eagle base! 50 Progressive Levels.</p>
                    <button id="bcStartBtn" class="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded transition cursor-pointer active:scale-95 shadow-lg">START MISSION</button>
                </div>
            </div>

            <!-- Polished Arcade D-Pad & Action Layout for Mobile -->
            <div class="flex items-center justify-between w-full max-w-[380px] mt-4 px-2">
                <!-- D-Pad Container (Cross Layout) -->
                <div class="relative w-36 h-36 bg-slate-900/80 rounded-full border border-slate-800 shadow-inner flex items-center justify-center">
                    <!-- UP -->
                    <button id="btnUp" class="absolute top-1 left-1/2 -translate-x-1/2 w-11 h-11 bg-slate-800 hover:bg-slate-700 active:bg-amber-600 text-amber-400 font-black rounded-t-xl border border-slate-700 flex items-center justify-center text-base shadow transition active:scale-95">▲</button>
                    <!-- LEFT -->
                    <button id="btnLeft" class="absolute top-1/2 left-1 -translate-y-1/2 w-11 h-11 bg-slate-800 hover:bg-slate-700 active:bg-amber-600 text-amber-400 font-black rounded-l-xl border border-slate-700 flex items-center justify-center text-base shadow transition active:scale-95">◀</button>
                    <!-- RIGHT -->
                    <button id="btnRight" class="absolute top-1/2 right-1 -translate-y-1/2 w-11 h-11 bg-slate-800 hover:bg-slate-700 active:bg-amber-600 text-amber-400 font-black rounded-r-xl border border-slate-700 flex items-center justify-center text-base shadow transition active:scale-95">▶</button>
                    <!-- DOWN -->
                    <button id="btnDown" class="absolute bottom-1 left-1/2 -translate-x-1/2 w-11 h-11 bg-slate-800 hover:bg-slate-700 active:bg-amber-600 text-amber-400 font-black rounded-b-xl border border-slate-700 flex items-center justify-center text-base shadow transition active:scale-95">▼</button>
                    <!-- Center Pivot Decor -->
                    <div class="w-10 h-10 bg-slate-950 rounded-full border border-slate-800 pointer-events-none"></div>
                </div>

                <!-- Action Fire Button -->
                <div class="flex items-center justify-center pr-2">
                    <button id="btnFire" class="w-24 h-24 bg-gradient-to-br from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 active:scale-95 text-black font-black text-sm rounded-full border-2 border-amber-300 shadow-xl flex items-center justify-center tracking-wider transition">FIRE</button>
                </div>
            </div>
        </div>
    `;

    const canvas = document.getElementById('bcCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const levelEl = document.getElementById('bcLevel');
    const scoreEl = document.getElementById('bcScore');
    const enemiesEl = document.getElementById('bcEnemies');
    const livesEl = document.getElementById('bcLives');
    const overlay = document.getElementById('bcOverlay');
    const startBtn = document.getElementById('bcStartBtn');

    const TILE_SIZE = 32; 
    const GRID_SIZE = 13;

    let currentLevel = 1;
    let score = 0;
    let lives = 3;
    let enemiesRemaining = 10;
    let gameInterval = null;
    let isPlaying = false;

    let player = { x: 4 * TILE_SIZE, y: 12 * TILE_SIZE, dir: 3, speed: 2, size: 26 };
    let bullets = [];
    let enemies = [];
    let map = [];

    function generateMap(level) {
        let newMap = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            let row = [];
            for (let c = 0; c < GRID_SIZE; c++) {
                if (r === 0 || c === 0 || c === GRID_SIZE - 1) {
                    row.push(1);
                } else if (r === GRID_SIZE - 1) {
                    if (c === 6) row.push(3);
                    else row.push(1);
                } else {
                    let seed = (r * 7 + c * 13 + level * 3) % 100;
                    if (seed < 25 + (level % 15)) {
                        row.push(level > 25 && seed < 10 ? 2 : 1);
                    } else {
                        row.push(0);
                    }
                }
            }
            newMap.push(row);
        }
        newMap[12][4] = 0;
        newMap[12][5] = 1;
        newMap[12][7] = 1;
        newMap[0][1] = 0;
        newMap[0][6] = 0;
        newMap[0][11] = 0;
        return newMap;
    }

    function resetLevel() {
        map = generateMap(currentLevel);
        player = { x: 4 * TILE_SIZE, y: 12 * TILE_SIZE, dir: 3, speed: 2, size: 26 };
        bullets = [];
        enemies = [];
        enemiesRemaining = 8 + Math.min(currentLevel * 2, 25);
        spawnEnemies();
        updateHUD();
    }

    function spawnEnemies() {
        if (enemies.length < 3 && enemiesRemaining > enemies.length) {
            let spawnCols = [1 * TILE_SIZE, 6 * TILE_SIZE, 11 * TILE_SIZE];
            let col = spawnCols[Math.floor(Math.random() * spawnCols.length)];
            enemies.push({
                x: col,
                y: 0,
                dir: 1,
                speed: 1 + (currentLevel * 0.03),
                size: 26,
                shootTimer: 0
            });
        }
    }

    function updateHUD() {
        levelEl.textContent = currentLevel;
        scoreEl.textContent = score;
        enemiesEl.textContent = enemiesRemaining;
        livesEl.textContent = lives;
    }

    const keys = {};
    window.addEventListener('keydown', (e) => {
        if (!isPlaying) return;
        keys[e.code] = true;
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
            e.preventDefault();
        }
        if (e.code === 'Space') {
            shootBullet(player, true);
        }
    });

    window.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });

    // Touch Controls Wiring for Mobile Devices
    const bindTouch = (id, code, isAction = false) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        
        const pressOn = (e) => {
            e.preventDefault();
            if (!isPlaying) return;
            if (isAction) {
                shootBullet(player, true);
            } else {
                keys[code] = true;
            }
        };

        const pressOff = (e) => {
            e.preventDefault();
            if (!isAction) {
                keys[code] = false;
            }
        };

        btn.addEventListener('touchstart', pressOn, { passive: false });
        btn.addEventListener('touchend', pressOff, { passive: false });
        btn.addEventListener('mousedown', pressOn);
        btn.addEventListener('mouseup', pressOff);
    };

    bindTouch('btnUp', 'ArrowUp');
    bindTouch('btnDown', 'ArrowDown');
    bindTouch('btnLeft', 'ArrowLeft');
    bindTouch('btnRight', 'ArrowRight');
    bindTouch('btnFire', 'Space', true);

    function shootBullet(tank, isPlayer) {
        if (isPlayer && bullets.filter(b => b.isPlayer).length >= 2) return;
        if (!isPlayer && bullets.filter(b => !b.isPlayer).length >= 4) return;

        let bx = tank.x + TILE_SIZE / 2 - 3;
        let by = tank.y + TILE_SIZE / 2 - 3;
        let bdx = 0, bdy = 0;
        let bspeed = 5;

        if (tank.dir === 0) bdx = bspeed;
        else if (tank.dir === 1) bdy = bspeed;
        else if (tank.dir === 2) bdx = -bspeed;
        else if (tank.dir === 3) bdy = -bspeed;

        bullets.push({ x: bx, y: by, dx: bdx, dy: bdy, isPlayer, size: 6 });
    }

    function checkCollision(x, y, size) {
        let left = Math.floor(x / TILE_SIZE);
        let right = Math.floor((x + size) / TILE_SIZE);
        let top = Math.floor(y / TILE_SIZE);
        let bottom = Math.floor((y + size) / TILE_SIZE);

        for (let r = top; r <= bottom; r++) {
            for (let c = left; c <= right; c++) {
                if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return true;
                if (map[r][c] > 0) return true;
            }
        }
        return false;
    }

    function update() {
        let moved = false;
        let nextX = player.x;
        let nextY = player.y;

        if (keys['ArrowRight'] || keys['KeyD']) { player.dir = 0; nextX += player.speed; moved = true; }
        else if (keys['ArrowDown'] || keys['KeyS']) { player.dir = 1; nextY += player.speed; moved = true; }
        else if (keys['ArrowLeft'] || keys['KeyA']) { player.dir = 2; nextX -= player.speed; moved = true; }
        else if (keys['ArrowUp'] || keys['KeyW']) { player.dir = 3; nextY -= player.speed; moved = true; }

        if (moved && !checkCollision(nextX, nextY, player.size)) {
            player.x = nextX;
            player.y = nextY;
        }

        if (Math.random() < 0.02) spawnEnemies();

        enemies.forEach(en => {
            en.shootTimer++;
            if (en.shootTimer > 60 && Math.random() < 0.4) {
                shootBullet(en, false);
                en.shootTimer = 0;
            }

            let edx = 0, edy = 0;
            if (en.dir === 0) edx = en.speed;
            else if (en.dir === 1) edy = en.speed;
            else if (en.dir === 2) edx = -en.speed;
            else if (en.dir === 3) edy = -en.speed;

            let enNextX = en.x + edx;
            let enNextY = en.y + edy;

            if (!checkCollision(enNextX, enNextY, en.size)) {
                en.x = enNextX;
                en.y = enNextY;
            } else {
                en.dir = Math.floor(Math.random() * 4);
            }
        });

        bullets.forEach((b, idx) => {
            b.x += b.dx;
            b.y += b.dy;

            let bxTile = Math.floor((b.x + b.size / 2) / TILE_SIZE);
            let byTile = Math.floor((b.y + b.size / 2) / TILE_SIZE);

            if (bxTile >= 0 && bxTile < GRID_SIZE && byTile >= 0 && byTile < GRID_SIZE) {
                let cell = map[byTile][bxTile];
                if (cell === 1) {
                    map[byTile][bxTile] = 0;
                    bullets.splice(idx, 1);
                    return;
                } else if (cell === 2) {
                    bullets.splice(idx, 1);
                    return;
                } else if (cell === 3) {
                    map[byTile][bxTile] = 0;
                    endGame("BASE DESTROYED!");
                    return;
                }
            } else {
                bullets.splice(idx, 1);
                return;
            }

            if (b.isPlayer) {
                enemies.forEach((en, eIdx) => {
                    if (b.x < en.x + en.size && b.x + b.size > en.x && b.y < en.y + en.size && b.y + b.size > en.y) {
                        enemies.splice(eIdx, 1);
                        bullets.splice(idx, 1);
                        score += 100;
                        enemiesRemaining--;
                        updateHUD();

                        if (enemiesRemaining <= 0) {
                            if (currentLevel < 50) {
                                currentLevel++;
                                resetLevel();
                            } else {
                                endGame("VICTORY! ALL 50 LEVELS CLEARED!");
                            }
                        }
                    }
                });
            } else {
                if (b.x < player.x + player.size && b.x + b.size > player.x && b.y < player.y + player.size && b.y + b.size > player.y) {
                    lives--;
                    bullets.splice(idx, 1);
                    updateHUD();
                    if (lives <= 0) {
                        endGame("MISSION FAILED");
                    } else {
                        player.x = 4 * TILE_SIZE;
                        player.y = 12 * TILE_SIZE;
                    }
                }
            }
        });
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                let val = map[r][c];
                if (val === 1) {
                    ctx.fillStyle = '#b45309';
                    ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    ctx.strokeStyle = '#78350f';
                    ctx.strokeRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                } else if (val === 2) {
                    ctx.fillStyle = '#94a3b8';
                    ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                } else if (val === 3) {
                    ctx.fillStyle = '#eab308';
                    ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    ctx.fillStyle = '#000';
                    ctx.font = 'bold 12px monospace';
                    ctx.fillText('🦅', c * TILE_SIZE + 6, r * TILE_SIZE + 22);
                }
            }
        }

        ctx.fillStyle = '#facc15';
        ctx.fillRect(player.x, player.y, player.size, player.size);
        ctx.fillStyle = '#ca8a04';
        if (player.dir === 0) ctx.fillRect(player.x + player.size, player.y + 10, 6, 6);
        else if (player.dir === 1) ctx.fillRect(player.x + 10, player.y + player.size, 6, 6);
        else if (player.dir === 2) ctx.fillRect(player.x - 6, player.y + 10, 6, 6);
        else if (player.dir === 3) ctx.fillRect(player.x + 10, player.y - 6, 6, 6);

        enemies.forEach(en => {
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(en.x, en.y, en.size, en.size);
        });

        ctx.fillStyle = '#ffffff';
        bullets.forEach(b => {
            ctx.fillRect(b.x, b.y, b.size, b.size);
        });
    }

    function loop() {
        if (!isPlaying) return;
        update();
        draw();
        gameInterval = requestAnimationFrame(loop);
    }

    function startGame() {
        currentLevel = 1;
        score = 0;
        lives = 3;
        resetLevel();
        isPlaying = true;
        overlay.style.display = 'none';
        cancelAnimationFrame(gameInterval);
        loop();
    }

    function endGame(text) {
        isPlaying = false;
        cancelAnimationFrame(gameInterval);
        overlay.style.display = 'flex';
        overlay.querySelector('h2').textContent = text;
        startBtn.textContent = "PLAY AGAIN";
    }

    startBtn.onclick = startGame;
}