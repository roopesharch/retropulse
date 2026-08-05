export function initBlocksGame(containerElement) {
    containerElement.innerHTML = `
        <div class="flex flex-col items-center justify-center bg-gradient-to-br from-amber-950 via-yellow-950 to-slate-950 p-3 sm:p-5 rounded-2xl border-2 sm:border-4 border-amber-400 shadow-2xl mx-auto select-none w-full max-w-md gap-2 sm:gap-3">
            <div class="text-amber-300 font-mono text-lg sm:text-2xl font-extrabold tracking-widest flex items-center justify-between w-full px-1 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]">
                <span>GOLDEN RUSH</span>
                <span class="text-[10px] sm:text-xs bg-amber-500 text-black font-black px-2.5 py-0.5 rounded-full shadow animate-pulse">DELUXE</span>
            </div>
            
            <div class="bg-slate-950 border-2 sm:border-4 border-amber-400 p-1 sm:p-2 rounded-xl shadow-[0_0_20px_rgba(251,191,36,0.4)] relative flex justify-center w-full overflow-hidden">
                <canvas id="blocksCanvas" width="280" height="460" class="block bg-slate-950 rounded-lg max-h-[50vh] sm:max-h-[55vh] w-auto aspect-[280/460] object-contain"></canvas>
            </div>

            <div class="flex justify-between w-full px-1 font-mono text-xs sm:text-base font-bold text-amber-200">
                <div class="bg-black/50 px-3 py-1 rounded-lg border border-amber-500/40">SCORE: <span id="blocksScore" class="text-yellow-400">0</span></div>
                <div class="bg-black/50 px-3 py-1 rounded-lg border border-amber-500/40">LINES: <span id="blocksLines" class="text-cyan-400">0</span></div>
            </div>

            <div id="blocksStatus" class="text-[11px] sm:text-xs text-yellow-300 h-5 font-mono text-center font-bold tracking-wide"></div>

            <!-- Laptop Controls Guide (Hidden on compact mobile screens to save space) -->
            <div class="hidden sm:block bg-black/70 border-2 border-amber-500/60 p-2.5 rounded-xl w-full font-mono text-xs text-amber-200 shadow-inner">
                <div class="text-center font-bold text-amber-400 mb-1 tracking-wider uppercase underline">💻 Laptop / PC Controls</div>
                <div class="grid grid-cols-2 gap-2 text-left px-2">
                    <div>⬅️ / ➡️ or <b class="text-yellow-400">A / D</b> : Move</div>
                    <div>🔄 <b class="text-yellow-400">W</b> or <b class="text-yellow-400">Up Arrow</b> : Rotate</div>
                    <div>⬇️ or <b class="text-yellow-400">S Key</b> : Soft Drop</div>
                    <div>⚡ <b class="text-yellow-400">Spacebar</b> : Hard Drop</div>
                </div>
            </div>

            <!-- On-Screen Touch Control Deck (Optimized for Mobile) -->
            <div class="grid grid-cols-4 gap-1.5 w-full px-0.5">
                <button id="btnRotate" class="bg-gradient-to-t from-amber-700 to-amber-500 active:from-amber-800 text-black font-black py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-xs shadow-lg border border-amber-200 touch-none">ROTATE</button>
                <button id="btnLeft" class="bg-gradient-to-t from-yellow-700 to-yellow-500 active:from-yellow-800 text-black font-black py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm shadow-lg border border-yellow-200 touch-none">◀ LEFT</button>
                <button id="btnRight" class="bg-gradient-to-t from-yellow-700 to-yellow-500 active:from-yellow-800 text-black font-black py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm shadow-lg border border-yellow-200 touch-none">RIGHT ▶</button>
                <button id="btnDrop" class="bg-gradient-to-t from-cyan-600 to-cyan-400 active:from-cyan-700 text-black font-black py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-xs shadow-lg border border-cyan-200 touch-none">DROP</button>
            </div>
        </div>
    `;

    const canvas = document.getElementById('blocksCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('blocksScore');
    const linesElement = document.getElementById('blocksLines');
    const statusMessage = document.getElementById('blocksStatus');

    const COLS = 11;
    const ROWS = 18; // Slightly compact rows to fit mobile viewports nicely
    const BLOCK_SIZE = 26; 

    let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

    const SHAPES = [
        { shape: [[1,1,1,1]], type: 'I' }, 
        { shape: [[1,1],[1,1]], type: 'O' }, 
        { shape: [[0,1,0],[1,1,1]], type: 'T' }, 
        { shape: [[0,1,1],[1,1,0]], type: 'S' }, 
        { shape: [[1,1,0],[0,1,1]], type: 'Z' }, 
        { shape: [[1,0,0],[1,1,1]], type: 'J' }, 
        { shape: [[0,0,1],[1,1,1]], type: 'L' }  
    ];

    let currentPiece = null;
    let score = 0;
    let linesCleared = 0;
    let dropInterval = 450;
    let gameTimer = null;
    let isGameOver = false;

    function createPiece() {
        const rand = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        const isGoldenMystery = Math.random() < 0.15;
        return {
            matrix: rand.shape,
            type: rand.type,
            golden: isGoldenMystery,
            x: Math.floor(COLS / 2) - Math.floor(rand.shape[0].length / 2),
            y: 0
        };
    }

    function drawGoldenBrick(x, y, isGolden) {
        ctx.save();
        const px = x * BLOCK_SIZE;
        const py = y * BLOCK_SIZE;

        if (isGolden) {
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 14;
            let grad = ctx.createLinearGradient(px, py, px + BLOCK_SIZE, py + BLOCK_SIZE);
            grad.addColorStop(0, '#fef08a');
            grad.addColorStop(0.5, '#eab308');
            grad.addColorStop(1, '#ca8a04');
            ctx.fillStyle = grad;
        } else {
            ctx.shadowColor = '#d97706';
            ctx.shadowBlur = 6;
            let grad = ctx.createLinearGradient(px, py, px + BLOCK_SIZE, py + BLOCK_SIZE);
            grad.addColorStop(0, '#fbbf24');
            grad.addColorStop(0.5, '#d97706');
            grad.addColorStop(1, '#b45309');
            ctx.fillStyle = grad;
        }

        ctx.beginPath();
        ctx.roundRect(px + 1, py + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2, 5);
        ctx.fill();

        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.restore();
    }

    function render() {
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= COLS; i++) {
            ctx.beginPath();
            ctx.moveTo(i * BLOCK_SIZE, 0);
            ctx.lineTo(i * BLOCK_SIZE, canvas.height);
            ctx.stroke();
        }
        for (let j = 0; j <= ROWS; j++) {
            ctx.beginPath();
            ctx.moveTo(0, j * BLOCK_SIZE);
            ctx.lineTo(canvas.width, j * BLOCK_SIZE);
            ctx.stroke();
        }

        board.forEach((row, rIdx) => {
            row.forEach((cell, cIdx) => {
                if (cell !== 0) {
                    drawGoldenBrick(cIdx, rIdx, cell === 'golden');
                }
            });
        });

        if (currentPiece) {
            currentPiece.matrix.forEach((row, rIdx) => {
                row.forEach((cell, cIdx) => {
                    if (cell !== 0) {
                        drawGoldenBrick(currentPiece.x + cIdx, currentPiece.y + rIdx, currentPiece.golden);
                    }
                });
            });
        }
    }

    function isValidMove(piece, offsetX, offsetY, newMatrix = piece.matrix) {
        for (let r = 0; r < newMatrix.length; r++) {
            for (let c = 0; c < newMatrix[r].length; c++) {
                if (newMatrix[r][c] !== 0) {
                    let newX = piece.x + c + offsetX;
                    let newY = piece.y + r + offsetY;
                    if (newX < 0 || newX >= COLS || newY >= ROWS) return false;
                    if (newY >= 0 && board[newY][newX] !== 0) return false;
                }
            }
        }
        return true;
    }

    function mergePiece() {
        let goldenLanded = currentPiece.golden;
        currentPiece.matrix.forEach((row, rIdx) => {
            row.forEach((cell, cIdx) => {
                if (cell !== 0) {
                    let targetY = currentPiece.y + rIdx;
                    let targetX = currentPiece.x + cIdx;
                    if (targetY >= 0 && targetY < ROWS) {
                        board[targetY][targetX] = goldenLanded ? 'golden' : 'standard';
                    }
                }
            });
        });

        if (goldenLanded) {
            triggerGoldenSurprise();
        }
    }

    function triggerGoldenSurprise() {
        const surprises = [
            () => {
                score += 500;
                showStatus('✨ GOLDEN JACKPOT! +500 PTS');
            },
            () => {
                board.pop();
                board.unshift(Array(COLS).fill(0));
                score += 250;
                showStatus('🌋 EARTHQUAKE CLEAR!');
            },
            () => {
                score += 350;
                showStatus('⚡ MIDAS TOUCH! +350 Bonus');
            }
        ];
        const randomSurprise = surprises[Math.floor(Math.random() * surprises.length)];
        randomSurprise();
        scoreElement.innerText = score;
        setTimeout(() => showStatus(''), 3000);
    }

    function clearFullLines() {
        let cleared = 0;
        board = board.filter(row => {
            const isFull = row.every(cell => cell !== 0);
            if (isFull) cleared++;
            return !isFull;
        });

        while (board.length < ROWS) {
            board.unshift(Array(COLS).fill(0));
        }

        if (cleared > 0) {
            linesCleared += cleared;
            let multiplier = cleared === 4 ? 3 : 1;
            score += cleared * 150 * multiplier;
            scoreElement.innerText = score;
            linesElement.innerText = linesCleared;
            
            if (cleared === 4) {
                showStatus('🌟 MEGA GOLDEN TETRIS! 3x COMBO');
                setTimeout(() => showStatus(''), 3000);
            }
        }
    }

    function dropPiece() {
        if (isGameOver) return;
        if (isValidMove(currentPiece, 0, 1)) {
            currentPiece.y++;
        } else {
            mergePiece();
            clearFullLines();
            currentPiece = createPiece();
            if (!isValidMove(currentPiece, 0, 0)) {
                triggerGameOver();
                return;
            }
        }
        render();
    }

    function showStatus(text) {
        statusMessage.innerText = text;
    }

    function triggerGameOver() {
        isGameOver = true;
        clearInterval(gameTimer);

        ctx.fillStyle = 'rgba(2, 6, 23, 0.92)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('VAULT LOCKED', canvas.width / 2, canvas.height / 2 - 25);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '13px monospace';
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillText('Tap to Restart', canvas.width / 2, canvas.height / 2 + 45);

        canvas.onclick = resetGame;
    }

    function resetGame() {
        canvas.onclick = null;
        board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        score = 0;
        linesCleared = 0;
        isGameOver = false;
        scoreElement.innerText = score;
        linesElement.innerText = linesCleared;
        statusMessage.innerText = '';
        currentPiece = createPiece();
        
        clearInterval(gameTimer);
        gameTimer = setInterval(dropPiece, dropInterval);
    }

    function moveLeftSafe() {
        if (isGameOver) { resetGame(); return; }
        if (isValidMove(currentPiece, -1, 0)) {
            currentPiece.x--;
            render();
        }
    }

    function moveRight() {
        if (isGameOver) { resetGame(); return; }
        if (isValidMove(currentPiece, 1, 0)) {
            currentPiece.x++;
            render();
        }
    }

    function rotate() {
        if (isGameOver) { resetGame(); return; }
        const rotatedMatrix = currentPiece.matrix[0].map((_, index) =>
            currentPiece.matrix.map(row => row[index]).reverse()
        );
        if (isValidMove(currentPiece, 0, 0, rotatedMatrix)) {
            currentPiece.matrix = rotatedMatrix;
            render();
        }
    }

    function hardDrop() {
        if (isGameOver) { resetGame(); return; }
        while (isValidMove(currentPiece, 0, 1)) {
            currentPiece.y++;
        }
        dropPiece();
    }

    const keyHandler = e => {
        if (['ArrowLeft', 'KeyA'].includes(e.code)) { moveLeftSafe(); e.preventDefault(); }
        if (['ArrowRight', 'KeyD'].includes(e.code)) { moveRight(); e.preventDefault(); }
        if (['ArrowUp', 'KeyW'].includes(e.code)) { rotate(); e.preventDefault(); }
        if (['ArrowDown', 'KeyS'].includes(e.code)) { dropPiece(); e.preventDefault(); }
        if (['Space'].includes(e.code)) { hardDrop(); e.preventDefault(); }
    };
    window.addEventListener('keydown', keyHandler);

    document.getElementById('btnRotate').addEventListener('pointerdown', e => { e.preventDefault(); rotate(); });
    document.getElementById('btnLeft').addEventListener('pointerdown', e => { e.preventDefault(); moveLeftSafe(); });
    document.getElementById('btnRight').addEventListener('pointerdown', e => { e.preventDefault(); moveRight(); });
    document.getElementById('btnDrop').addEventListener('pointerdown', e => { e.preventDefault(); hardDrop(); });
    
    canvas.onclick = () => { if (isGameOver) resetGame(); };

    currentPiece = createPiece();
    render();
    gameTimer = setInterval(dropPiece, dropInterval);
}