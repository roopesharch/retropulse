export function initSnakeGame(containerElement) {
    containerElement.innerHTML = `
        <div class="flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-5 rounded-2xl border-4 border-cyan-400 shadow-2xl max-w-sm mx-auto select-none">
            <div class="text-cyan-300 font-mono text-xl font-extrabold mb-2 tracking-widest flex items-center justify-between w-full px-2 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
                <span>NEO SNAKE</span>
                <span class="text-xs bg-pink-500/80 text-white px-2.5 py-1 rounded-full shadow animate-pulse">ULTRA MODE</span>
            </div>
            
            <div class="bg-white border-4 border-cyan-400 p-2 rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.5)] relative">
                <canvas id="snakeCanvas" width="300" height="300" class="block bg-white rounded-lg cursor-pointer"></canvas>
            </div>

            <div class="flex justify-between w-full px-2 mt-3 font-mono text-sm font-bold text-cyan-200">
                <div class="bg-black/40 px-3 py-1 rounded-lg border border-cyan-500/30">SCORE: <span id="snakeScore" class="text-yellow-400">0</span></div>
                <div class="bg-black/40 px-3 py-1 rounded-lg border border-cyan-500/30">HIGH: <span id="snakeHighScore" class="text-pink-400">0</span></div>
            </div>

            <div id="statusMessage" class="text-xs text-yellow-300 h-5 font-mono mt-1 text-center font-bold tracking-wide"></div>

            <!-- Mobile Touch D-Pad Controls -->
            <div class="grid grid-cols-3 gap-2 mt-3 w-40 h-28">
                <div></div>
                <button id="btnUp" class="bg-gradient-to-t from-cyan-600 to-cyan-500 active:from-cyan-700 text-white font-bold rounded-xl flex items-center justify-center text-xl shadow-lg border border-cyan-300">▲</button>
                <div></div>
                <button id="btnLeft" class="bg-gradient-to-t from-cyan-600 to-cyan-500 active:from-cyan-700 text-white font-bold rounded-xl flex items-center justify-center text-xl shadow-lg border border-cyan-300">◀</button>
                <button id="btnDown" class="bg-gradient-to-t from-cyan-600 to-cyan-500 active:from-cyan-700 text-white font-bold rounded-xl flex items-center justify-center text-xl shadow-lg border border-cyan-300">▼</button>
                <button id="btnRight" class="bg-gradient-to-t from-cyan-600 to-cyan-500 active:from-cyan-700 text-white font-bold rounded-xl flex items-center justify-center text-xl shadow-lg border border-cyan-300">▶</button>
            </div>
        </div>
    `;

    const canvas = document.getElementById('snakeCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('snakeScore');
    const highScoreElement = document.getElementById('snakeHighScore');
    const statusMessage = document.getElementById('statusMessage');

    const GRID_SIZE = 25; 
    const TILE_SIZE = 12; 

    let snake = [{ x: 12, y: 12 }, { x: 12, y: 13 }, { x: 12, y: 14 }];
    let food = { x: 5, y: 5, type: 'normal' };
    let specialBounty = null;
    let bountyTimer = null;
    let bountySpawnTimer = null;

    let dx = 0;
    let dy = 0; // Starts at 0 so snake doesn't move automatically
    let score = 0;
    let highScore = localStorage.getItem('neoSnakeHighScore') || 0;
    let gameInterval;
    let gameSpeed = 90;
    let isGameOver = false;
    let isGameStarted = false;

    highScoreElement.innerText = highScore;

    // Initial Start Screen Render
    renderStartScreen();

    function renderStartScreen() {
        clearCanvas();
        drawGridLines();
        
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('NEO SNAKE', canvas.width / 2, 110);

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('► CLICK TO PLAY ◄', canvas.width / 2, 150);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px monospace';
        ctx.fillText('Use Arrow Keys or D-Pad', canvas.width / 2, 185);
    }

    function startGameLoop() {
        clearInterval(gameInterval);
        gameInterval = setInterval(main, gameSpeed);
    }

    function main() {
        if (isGameOver || !isGameStarted) return;
        clearCanvas();
        drawGridLines();
        drawSpecialBounty();
        drawFood();
        moveSnake();
        drawSnake();
    }

    function clearCanvas() {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawGridLines() {
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= GRID_SIZE; i++) {
            ctx.beginPath();
            ctx.moveTo(i * TILE_SIZE, 0);
            ctx.lineTo(i * TILE_SIZE, canvas.height);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i * TILE_SIZE);
            ctx.lineTo(canvas.width, i * TILE_SIZE);
            ctx.stroke();
        }
    }

    function drawSnake() {
        snake.forEach((part, index) => {
            ctx.save();
            ctx.shadowColor = '#10b981';
            ctx.shadowBlur = index === 0 ? 8 : 2;

            if (index === 0) {
                let grad = ctx.createRadialGradient(
                    part.x * TILE_SIZE + 6, part.y * TILE_SIZE + 6, 1,
                    part.x * TILE_SIZE + 6, part.y * TILE_SIZE + 6, 6
                );
                grad.addColorStop(0, '#34d399');
                grad.addColorStop(1, '#059669');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.roundRect(part.x * TILE_SIZE + 1, part.y * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2, 4);
                ctx.fill();

                ctx.fillStyle = '#0f172a';
                ctx.fillRect(part.x * TILE_SIZE + 3, part.y * TILE_SIZE + 3, 2, 2);
                ctx.fillRect(part.x * TILE_SIZE + 7, part.y * TILE_SIZE + 3, 2, 2);
            } else {
                ctx.fillStyle = index % 2 === 0 ? '#10b981' : '#059669';
                ctx.beginPath();
                ctx.roundRect(part.x * TILE_SIZE + 2, part.y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4, 3);
                ctx.fill();
            }
            ctx.restore();
        });
    }

    function drawFood() {
        ctx.save();
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(food.x * TILE_SIZE + 6, food.y * TILE_SIZE + 6, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(food.x * TILE_SIZE + 6, food.y * TILE_SIZE + 1);
        ctx.lineTo(food.x * TILE_SIZE + 8, food.y * TILE_SIZE - 2);
        ctx.stroke();
        ctx.restore();
    }

    function drawSpecialBounty() {
        if (!specialBounty) return;
        ctx.save();
        let bx = specialBounty.x * TILE_SIZE + 6;
        let by = specialBounty.y * TILE_SIZE + 6;

        if (specialBounty.type === 'fast') {
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(bx, by, 5.5, 0, Math.PI * 2);
            ctx.fill();
        } else if (specialBounty.type === 'slow') {
            ctx.shadowColor = '#c084fc';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#c084fc';
            ctx.beginPath();
            ctx.arc(bx - 2, by - 2, 3, 0, Math.PI * 2);
            ctx.arc(bx + 2, by - 2, 3, 0, Math.PI * 2);
            ctx.arc(bx, by + 2, 3, 0, Math.PI * 2);
            ctx.fill();
        } else if (specialBounty.type === 'shrink') {
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.rect(specialBounty.x * TILE_SIZE + 2, specialBounty.y * TILE_SIZE + 2, 8, 8);
            ctx.fill();
        } else if (specialBounty.type === 'grow') {
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 12;
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(bx, by, 6.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    function moveSnake() {
        let headX = snake[0].x + dx;
        let headY = snake[0].y + dy;

        if (headX < 0) headX = GRID_SIZE - 1;
        if (headX >= GRID_SIZE) headX = 0;
        if (headY < 0) headY = GRID_SIZE - 1;
        if (headY >= GRID_SIZE) headY = 0;

        const head = { x: headX, y: headY };

        for (let i = 0; i < snake.length; i++) {
            if (snake[i].x === head.x && snake[i].y === head.y) {
                triggerGameOver();
                return;
            }
        }

        snake.unshift(head);

        let eaten = false;
        if (snake[0].x === food.x && snake[0].y === food.y) {
            score += 10;
            eaten = true;
            generateFood();
        }

        if (specialBounty && snake[0].x === specialBounty.x && snake[0].y === specialBounty.y) {
            applyBountyEffect(specialBounty.type);
            specialBounty = null;
            eaten = true;
        }

        if (!eaten) {
            snake.pop();
        }

        scoreElement.innerText = score;
        if (score > highScore) {
            highScore = score;
            highScoreElement.innerText = highScore;
            localStorage.setItem('neoSnakeHighScore', highScore);
        }
    }

    function applyBountyEffect(type) {
        if (type === 'fast') {
            showStatus('⚡ LIGHTNING SPEED! (Fast)');
            gameSpeed = 55;
            startGameLoop();
            setTimeout(() => { if (!isGameOver) { gameSpeed = 90; startGameLoop(); showStatus(''); } }, 6000);
        } else if (type === 'slow') {
            showStatus('🍇 CHILL VIBES! (Slow Mo)');
            gameSpeed = 140;
            startGameLoop();
            setTimeout(() => { if (!isGameOver) { gameSpeed = 90; startGameLoop(); showStatus(''); } }, 6000);
        } else if (type === 'shrink') {
            showStatus('🍏 PIPELINE CUT! (Half Size)');
            if (snake.length > 4) {
                const keepCount = Math.max(3, Math.floor(snake.length / 2));
                snake = snake.slice(0, keepCount);
            }
            setTimeout(() => showStatus(''), 3000);
        } else if (type === 'grow') {
            showStatus('☀️ SOLAR BOOST! (+25% Growth)');
            const growthAdd = Math.max(2, Math.floor(snake.length * 0.25));
            const tail = snake[snake.length - 1];
            for (let i = 0; i < growthAdd; i++) {
                snake.push({ ...tail });
            }
            setTimeout(() => showStatus(''), 3000);
        }
    }

    function showStatus(text) {
        statusMessage.innerText = text;
    }

    function generateFood() {
        food.x = Math.floor(Math.random() * GRID_SIZE);
        food.y = Math.floor(Math.random() * GRID_SIZE);
        snake.forEach(part => {
            if (part.x === food.x && part.y === food.y) generateFood();
        });
    }

    function spawnSpecialBountyRandomly() {
        if (isGameOver || !isGameStarted || specialBounty) return;
        const types = ['fast', 'slow', 'shrink', 'grow'];
        const chosenType = types[Math.floor(Math.random() * types.length)];
        
        let bx = Math.floor(Math.random() * GRID_SIZE);
        let by = Math.floor(Math.random() * GRID_SIZE);
        
        specialBounty = { x: bx, y: by, type: chosenType };

        bountyTimer = setTimeout(() => {
            if (specialBounty && specialBounty.type === chosenType) {
                specialBounty = null;
            }
        }, 7000);
    }

    function triggerGameOver() {
        isGameOver = true;
        isGameStarted = false;
        clearInterval(gameInterval);
        clearInterval(bountySpawnTimer);
        clearTimeout(bountyTimer);

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, 115);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '12px monospace';
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, 145);
        ctx.fillText('Click to Restart', canvas.width / 2, 175);
    }

    function resetGame() {
        snake = [{ x: 12, y: 12 }, { x: 12, y: 13 }, { x: 12, y: 14 }];
        score = 0;
        gameSpeed = 90;
        dx = 0;
        dy = -1; // Default moving up upon starting
        specialBounty = null;
        isGameOver = false;
        isGameStarted = true;
        scoreElement.innerText = score;
        statusMessage.innerText = '';
        generateFood();
        startGameLoop();

        clearInterval(bountySpawnTimer);
        bountySpawnTimer = setInterval(spawnSpecialBountyRandomly, 12000);
    }

    function changeDirection(newDx, newDy) {
        if (!isGameStarted || isGameOver) {
            resetGame();
            return;
        }
        if (newDx !== 0 && dx === 0) {
            dx = newDx;
            dy = newDy;
        } else if (newDy !== 0 && dy === 0) {
            dx = newDx;
            dy = newDy;
        }
    }

    const keyHandler = e => {
        if (['ArrowUp', 'KeyW'].includes(e.code)) { changeDirection(0, -1); e.preventDefault(); }
        if (['ArrowDown', 'KeyS'].includes(e.code)) { changeDirection(0, 1); e.preventDefault(); }
        if (['ArrowLeft', 'KeyA'].includes(e.code)) { changeDirection(-1, 0); e.preventDefault(); }
        if (['ArrowRight', 'KeyD'].includes(e.code)) { changeDirection(1, 0); e.preventDefault(); }
    };
    window.addEventListener('keydown', keyHandler);

    document.getElementById('btnUp').onclick = () => changeDirection(0, -1);
    document.getElementById('btnDown').onclick = () => changeDirection(0, 1);
    document.getElementById('btnLeft').onclick = () => changeDirection(-1, 0);
    document.getElementById('btnRight').onclick = () => changeDirection(1, 0);
    
    canvas.onclick = () => {
        if (!isGameStarted || isGameOver) {
            resetGame();
        }
    };

    generateFood();
}