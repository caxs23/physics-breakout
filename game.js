document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const startButton = document.getElementById('startButton');
    const messageDiv = document.getElementById('message');
    const scoreEl = document.getElementById('score');
    const levelEl = document.getElementById('level');

    // Canvas dimensions
    canvas.width = window.innerWidth > 480 ? 480 : window.innerWidth * 0.95;
    canvas.height = window.innerHeight > 720 ? 720 : window.innerHeight * 0.85;

    // Game variables
    let gameLoop;
    let isPlaying = false;
    let score = 0;
    let level = 1;
    let bricks = [];
    let balls = [];
    let powerUps = [];

    // Player paddle properties
    let paddle = {
        x: (canvas.width - 100) / 2,
        y: canvas.height - 30,
        width: 100,
        height: 15,
        dx: 0
    };

    // Ball properties
    const initialBall = {
        x: canvas.width / 2,
        y: paddle.y - 15,
        radius: 7,
        dx: 3,
        dy: -3,
        gravity: 0.1,
        speed: 3
    };

    // Brick properties
    const brick = {
        width: 60,
        height: 20,
        padding: 10,
        offsetX: 20,
        offsetY: 45
    };

    const BRICK_ROWS = 5;
    const BRICK_COLS = Math.floor((canvas.width - brick.offsetX * 2) / (brick.width + brick.padding));

    // Colors
    const colors = {
        ball: '#e9c46a',
        paddle: '#2a9d8f',
        brick: '#e76f51',
        specialBrick: '#f4a261',
        powerUp: '#264653'
    };

    // --- Core Game Functions ---

    function initGame() {
        score = 0;
        level = 1;
        scoreEl.textContent = score;
        levelEl.textContent = level;
        resetGameElements();
        createBricks();
        balls.push({ ...initialBall });
        hideMessage();
        startButton.style.display = 'none';
        isPlaying = true;
        gameLoop = requestAnimationFrame(update);
    }

    function resetGameElements() {
        balls = [];
        powerUps = [];
        paddle.width = 100;
        paddle.x = (canvas.width - paddle.width) / 2;
    }

    function createBricks() {
        bricks = [];
        for (let c = 0; c < BRICK_COLS; c++) {
            bricks[c] = [];
            for (let r = 0; r < BRICK_ROWS; r++) {
                const isSpecial = Math.random() < 0.15; // 15% chance for a special brick
                bricks[c][r] = {
                    x: c * (brick.width + brick.padding) + brick.offsetX,
                    y: r * (brick.height + brick.padding) + brick.offsetY,
                    status: 1,
                    isSpecial: isSpecial,
                    health: isSpecial ? 3 : 1
                };
            }
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBricks();
        drawPaddle();
        drawBalls();
        drawPowerUps();
    }

    function drawBricks() {
        bricks.forEach(column => {
            column.forEach(b => {
                if (b.status === 1) {
                    ctx.beginPath();
                    ctx.rect(b.x, b.y, brick.width, brick.height);
                    ctx.fillStyle = b.isSpecial ? colors.specialBrick : colors.brick;
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
                    ctx.shadowBlur = 5;
                    ctx.shadowOffsetX = 2;
                    ctx.shadowOffsetY = 2;
                    ctx.fill();
                    ctx.closePath();
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                }
            });
        });
    }

    function drawPaddle() {
        ctx.beginPath();
        ctx.rect(paddle.x, paddle.y, paddle.width, paddle.height);
        ctx.fillStyle = colors.paddle;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fill();
        ctx.closePath();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }

    function drawBalls() {
        balls.forEach(ball => {
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fillStyle = colors.ball;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            ctx.shadowBlur = 5;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.fill();
            ctx.closePath();
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        });
    }

    function drawPowerUps() {
        powerUps.forEach(pu => {
            if (pu.status === 1) {
                ctx.beginPath();
                ctx.rect(pu.x, pu.y, 20, 20);
                ctx.fillStyle = colors.powerUp;
                ctx.fill();
                ctx.closePath();
                ctx.font = '16px Arial';
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(pu.type === 'increasePaddle' ? 'P' : 'S', pu.x + 10, pu.y + 10);
            }
        });
    }

    function update() {
        if (!isPlaying) return;

        movePaddle();
        moveBalls();
        movePowerUps();
        collisionDetection();
        draw();

        if (isLevelCleared()) {
            levelUp();
        }

        if (balls.length === 0) {
            gameOver();
        }

        gameLoop = requestAnimationFrame(update);
    }

    function movePaddle() {
        paddle.x += paddle.dx;
        if (paddle.x < 0) paddle.x = 0;
        if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
    }

    function moveBalls() {
        balls.forEach(ball => {
            ball.x += ball.dx;
            ball.dy += ball.gravity; // Apply gravity
            ball.y += ball.dy;

            // Wall collision (left, right, top)
            if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
                ball.dx *= -1;
                vibrate();
            }
            if (ball.y - ball.radius < 0) {
                ball.dy *= -1;
                vibrate();
            }

            // Paddle collision
            if (
                ball.y + ball.radius > paddle.y &&
                ball.y + ball.radius < paddle.y + paddle.height &&
                ball.x > paddle.x &&
                ball.x < paddle.x + paddle.width
            ) {
                vibrate();

                // Fix for low bounce: set a consistent upward velocity
                ball.dy = -initialBall.speed;

                let hitPoint = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
                ball.dx = hitPoint * ball.speed;

                // Condition 2: Duplicate ball on paddle hit, max 10 balls to prevent lag
                if (balls.length < 10) {
                    const newBall = { ...initialBall };
                    newBall.x = ball.x;
                    newBall.y = ball.y;
                    newBall.dx = -ball.dx; // Give new ball opposite horizontal direction
                    newBall.dy = ball.dy;
                    balls.push(newBall);
                }
            }

            // Bottom collision (Game Over condition for a single ball)
            if (ball.y + ball.radius > canvas.height) {
                balls = balls.filter(b => b !== ball);
            }
        });
    }

    function movePowerUps() {
        powerUps.forEach(pu => {
            if (pu.status === 1) {
                pu.y += pu.dy;

                // Check for collision with paddle
                if (
                    pu.y + 20 > paddle.y &&
                    pu.y < paddle.y + paddle.height &&
                    pu.x + 20 > paddle.x &&
                    pu.x < paddle.x + paddle.width
                ) {
                    applyPowerUp(pu.type);
                    pu.status = 0; // Consume power-up
                }

                // Remove if it goes off screen
                if (pu.y > canvas.height) {
                    pu.status = 0;
                }
            }
        });
        powerUps = powerUps.filter(pu => pu.status === 1);
    }

    function applyPowerUp(type) {
        vibrate(100);
        if (type === 'increasePaddle') {
            paddle.width = Math.min(paddle.width + 20, 150);
        } else if (type === 'speedUpBall') {
            balls.forEach(ball => {
                ball.speed += 0.5;
                ball.dx = Math.sign(ball.dx) * ball.speed;
                ball.dy = Math.sign(ball.dy) * ball.speed;
            });
        }
    }

    function collisionDetection() {
        bricks.forEach(column => {
            column.forEach(b => {
                if (b.status === 1) {
                    balls.forEach(ball => {
                        const hit = ball.x > b.x && ball.x < b.x + brick.width &&
                                    ball.y > b.y && ball.y < b.y + brick.height;
                        if (hit) {
                            // A more robust collision logic could be implemented, but for a simple fix, this is fine.
                            ball.dy *= -1;
                            vibrate();
                            b.health--;

                            if (b.health <= 0) {
                                b.status = 0;
                                score += 10;
                                scoreEl.textContent = score;

                                if (b.isSpecial) {
                                    score += 50;
                                    destroySurroundingBricks(b.x, b.y);
                                    spawnPowerUp(b.x, b.y);
                                } else {
                                    if (Math.random() < 0.1) {
                                        spawnPowerUp(b.x, b.y);
                                    }
                                }
                            }
                        }
                    });
                }
            });
        });
    }

    function destroySurroundingBricks(x, y) {
        bricks.forEach(column => {
            column.forEach(b => {
                if (b.status === 1) {
                    const distance = Math.sqrt(Math.pow(b.x - x, 2) + Math.pow(b.y - y, 2));
                    if (distance < brick.width * 1.5) {
                        b.status = 0;
                        score += 10;
                        scoreEl.textContent = score;
                    }
                }
            });
        });
    }

    function spawnPowerUp(x, y) {
        const type = Math.random() < 0.5 ? 'increasePaddle' : 'speedUpBall';
        powerUps.push({
            x: x + brick.width / 2,
            y: y,
            dy: 1,
            status: 1,
            type: type
        });
    }

    function isLevelCleared() {
        return bricks.every(column => column.every(b => b.status === 0));
    }

    function levelUp() {
        level++;
        levelEl.textContent = level;
        showMessage(`Level ${level} Clear! 🎉`, 'Next Level', () => {
            resetGameElements();
            createBricks();
            balls.push({ ...initialBall });
            hideMessage();
        });
    }

    function gameOver() {
        isPlaying = false;
        cancelAnimationFrame(gameLoop);
        showMessage('Game Over 😞', 'Restart', initGame);
    }

    function showMessage(msg, buttonText, buttonAction) {
        messageDiv.textContent = msg;
        messageDiv.style.display = 'block';
        startButton.textContent = buttonText;
        startButton.onclick = buttonAction;
        startButton.style.display = 'block';
    }

    function hideMessage() {
        messageDiv.style.display = 'none';
    }

    function vibrate(duration = 10) {
        if (navigator.vibrate) {
            navigator.vibrate(duration);
        }
    }

    // --- Event Listeners for Mobile Touch Control ---

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
        paddle.dx = 0;
        paddle.startX = touchX;
        paddle.startPaddleX = paddle.x;
    });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
        const deltaX = touchX - paddle.startX;
        paddle.x = paddle.startPaddleX + deltaX;
    });

    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        paddle.dx = 0;
    });

    startButton.onclick = initGame;

    // Initial message
    showMessage('벽돌깨기 게임', '게임 시작', initGame);
});
