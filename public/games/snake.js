export function initSnakeGame(containerElement) {
    containerElement.innerHTML = `
        <div class="flex flex-col items-center justify-center bg-[#9ead86] p-4 rounded-xl border-4 border-[#333] shadow-inner">
            <div class="text-[#222] font-mono text-lg font-bold mb-2 tracking-widest">NOKIA 3310</div>
            <div class="bg-[#8b9573] border-4 border-[#4f583d] p-2 rounded">
                <canvas id="snakeCanvas" width="200" height="200" class="block bg-[#98a482]"></canvas>
            </div>
            <div class="text-[#222] font-mono text-sm mt-2 font-bold">SCORE: <span id="snakeScore">0</span></div>
            <div class="text-xs text-[#4f583d] mt-1 font-mono">Use Arrow Keys to Play</div>
        </div>
    `;

    const canvas = document.getElementById('snakeCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('snakeScore');

    let snake = [{ x: 10, y: 10 }];
    let food = { x: 5, y: 5 };
    let dx = 1;
    let dy = 0;
    let score = 0;
    let gameInterval;

    function main() {
        if (hasGameEnded()) {
            clearInterval(gameInterval);
            alert('Game Over! Score: ' + score);
            resetGame();
            return;
        }
        clearCanvas();
        drawFood();
        moveSnake();
        drawSnake();
    }

    function clearCanvas() {
        ctx.fillStyle = '#98a482';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawSnake() {
        ctx.fillStyle = '#222813';
        snake.forEach(part => {
            ctx.fillRect(part.x * 10, part.y * 10, 9, 9);
        });
    }

    function moveSnake() {
        const head = { x: snake[0].x + dx, y: snake[0].y + dy };
        snake.unshift(head);
        const hasEatenFood = snake[0].x === food.x && snake[0].y === food.y;
        if (hasEatenFood) {
            score += 10;
            scoreElement.innerText = score;
            generateFood();
        } else {
            snake.pop();
        }
    }

    function generateFood() {
        food.x = Math.floor(Math.random() * 20);
        food.y = Math.floor(Math.random() * 20);
    }

    function drawFood() {
        ctx.fillStyle = '#3f472d';
        ctx.fillRect(food.x * 10, food.y * 10, 9, 9);
    }

    function hasGameEnded() {
        const hitLeftWall = snake[0].x < 0;
        const hitRightWall = snake[0].x > 19;
        const hitToptWall = snake[0].y < 0;
        const hitBottomWall = snake[0].y > 19;
        if (hitLeftWall || hitRightWall || hitToptWall || hitBottomWall) return true;
        for (let i = 4; i < snake.length; i++) {
            if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) return true;
        }
        return false;
    }

    function resetGame() {
        snake = [{ x: 10, y: 10 }];
        score = 0;
        scoreElement.innerText = score;
        dx = 1;
        dy = 0;
        generateFood();
        gameInterval = setInterval(main, 100);
    }

    document.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft' && dx === 0) { dx = -1; dy = 0; }
        if (e.key === 'ArrowUp' && dy === 0) { dx = 0; dy = -1; }
        if (e.key === 'ArrowRight' && dx === 0) { dx = 1; dy = 0; }
        if (e.key === 'ArrowDown' && dy === 0) { dx = 0; dy = 1; }
    });

    generateFood();
    gameInterval = setInterval(main, 100);
}