/**
 * NEON HEX - Modern Rewrite for Second Life
 * 
 * Core Game Logic
 */

// Configuration
const CONFIG = {
    colors: ['#e74c3c', '#f1c40f', '#3498db', '#2ecc71'], // Red, Yellow, Blue, Green
    hexRadius: 60,
    blockHeight: 20,
    spawnRate: 60, // frames
    rotationSpeed: 5, // degrees per step
    baseSpeed: 2
};

// Game State
let state = {
    status: 'START', // START, PLAYING, GAMEOVER
    score: 0,
    rotation: 0, // Current rotation angle in degrees
    targetRotation: 0, // Target rotation angle
    blocks: [],
    grid: [[], [], [], [], [], []], // 6 sides, each an array of blocks
    spawnTimer: 0,
    speed: CONFIG.baseSpeed
};

// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let centerX, centerY;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    centerX = canvas.width / 2;
    centerY = canvas.height / 2;
}
window.addEventListener('resize', resize);
resize();

// Input Handling
const LEFT_KEY = 37, RIGHT_KEY = 39, A_KEY = 65, D_KEY = 68;

document.addEventListener('keydown', (e) => {
    if (state.status !== 'PLAYING') return;

    if (e.keyCode === LEFT_KEY || e.keyCode === A_KEY) {
        rotate(-1);
    } else if (e.keyCode === RIGHT_KEY || e.keyCode === D_KEY) {
        rotate(1);
    }
});

// Touch/Mouse for SL interaction (Click left/right side of screen)
document.addEventListener('pointerdown', (e) => {
    if (state.status === 'START') {
        startGame();
        return;
    }
    if (state.status === 'GAMEOVER') {
        // Handled by UI buttons, but clicking empty space could restart? 
        // Better leave it to buttons to avoid accidental restarts.
        return;
    }

    if (e.clientX < centerX) {
        rotate(-1); // Left
    } else {
        rotate(1); // Right
    }
});

function rotate(direction) {
    // 60 degrees per step (360 / 6 sides)
    state.targetRotation += direction * 60;
}

// Game Loop
function update() {
    if (state.status === 'PLAYING') {
        // Smooth Rotation
        let diff = state.targetRotation - state.rotation;
        if (Math.abs(diff) > 0.1) {
            state.rotation += diff * 0.2; // Easing
        } else {
            state.rotation = state.targetRotation;
        }

        // Spawning
        state.spawnTimer++;
        if (state.spawnTimer > Math.max(20, CONFIG.spawnRate - Math.floor(state.score / 500))) {
            spawnBlock();
            state.spawnTimer = 0;
        }

        // Update Blocks
        // We iterate backwards to allow removal
        for (let i = state.blocks.length - 1; i >= 0; i--) {
            let block = state.blocks[i];
            block.dist -= state.speed;

            // Checking Collision with Central Hex (or stack)
            let limit = CONFIG.hexRadius + (getStackHeight(block.side) * CONFIG.blockHeight);

            if (block.dist <= limit) {
                block.dist = limit;
                // Add to grid
                state.grid[block.side].push(block);
                state.blocks.splice(i, 1); // Remove from moving blocks

                checkMatches(block.side);
                checkGameOver(block.side);
            }
        }
    }
    requestAnimationFrame(loop);
}

function draw() {
    // Clear Screen
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save Context for Rotation
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((state.rotation * Math.PI) / 180);

    // Draw Central Hexagon
    drawHexagon(0, 0, CONFIG.hexRadius, '#222');

    // Draw Grid (Landed Blocks)
    for (let side = 0; side < 6; side++) {
        for (let i = 0; i < state.grid[side].length; i++) {
            let block = state.grid[side][i];
            let dist = CONFIG.hexRadius + (i * CONFIG.blockHeight) + (CONFIG.blockHeight / 2);
            drawBlock(side, dist, block.color);
        }
    }

    // Draw Moving Blocks
    for (let block of state.blocks) {
        drawBlock(block.side, block.dist, block.color);
    }

    ctx.restore();
}

function loop() {
    update();
    draw();
}

// Helper Functions
function spawnBlock() {
    let side = Math.floor(Math.random() * 6);
    let color = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
    // Distance from center to spawn
    let spawnDist = Math.max(canvas.width, canvas.height) / 1.5;

    state.blocks.push({
        side: side,
        color: color,
        dist: spawnDist
    });
}

function getStackHeight(side) {
    return state.grid[side].length;
}

function drawHexagon(x, y, radius, color) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        ctx.lineTo(x + radius * Math.cos(i * Math.PI / 3), y + radius * Math.sin(i * Math.PI / 3));
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner text (Score? Rotation?)
}

function drawBlock(side, dist, color) {
    // A block is a trapezoid section of the wedge
    // We are already rotated to the center, but we need to rotate to the specific side
    // Actually, since we rotate the whole canvas, "side 0" is always at a specific visual, 
    // BUT the blocks spawn on specific sides relative to the hexagon.
    // Wait, the canvas rotation rotates what we SEE.
    // If I press Right, the hex rotates Clockwise.
    // A block on "Side 0" is attached to the physical side 0 of the hex.

    ctx.save();
    ctx.rotate(side * 60 * Math.PI / 180);

    // Draw Trapezoid
    // We draw it facing "up" (or whatever side 0 is) and let rotation handle it
    // Center of hex is 0,0
    // Dist is distance from center to center of block? Or bottom?
    // Let's assume dist is to the bottom (closest to center) edge of the block to simplify stacking

    // Width grows with distance. 
    // Side length of a hex at radius R is R.
    // The "wedge" angle is 60 degrees.
    // At distance D, the width is roughly D (actually D * tan(30)*2 maybe? No, geometrical side is D).

    let h = CONFIG.blockHeight;
    // Inner edge distance
    let d1 = dist - (h / 2); // if dist was center
    // Wait, previous logic: dist was decreasing.
    // Let's say dist is distance to the INNER edge of the block.
    // Stacking: limit = radius + count*height. 
    // Moving block: dist starts high, decreases.
    // So 'dist' in state.blocks is the Inner Edge.

    // Let's refine draw:
    let innerR = dist - (h / 2); // Visual tweak

    // We need 4 points for the trapezoid
    // Angle spans -30 to +30 degrees relative to the side's axis

    ctx.beginPath();
    // Inner points
    // (We are rotating 90 degrees less because 0 is usually Right in Canvas, but hex 0 is ... let's test)
    // Standard Math: 0 is Right (3 o'clock).
    // Hex sides: 0, 60, 120...

    // To make a block on the "Right" side:
    // P1: (dist, -width/2), P2: (dist, width/2) -- No, it's a wedge.

    let halfWedge = Math.PI / 6; // 30 degrees

    // Distances
    let r1 = dist - (h / 2); // inner
    let r2 = dist + (h / 2); // outer

    // Points (Polar to Cartesian)
    // Angle -30
    let p1 = { x: r1 * Math.cos(-halfWedge), y: r1 * Math.sin(-halfWedge) };
    let p2 = { x: r2 * Math.cos(-halfWedge), y: r2 * Math.sin(-halfWedge) };

    // Angle +30
    let p3 = { x: r2 * Math.cos(halfWedge), y: r2 * Math.sin(halfWedge) };
    let p4 = { x: r1 * Math.cos(halfWedge), y: r1 * Math.sin(halfWedge) };

    // Since 0 degrees is "Right" in Canvas:
    // Block on Side 0 should be at 0 degrees.

    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p4.x, p4.y);

    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
}

function checkMatches(side) {
    let stack = state.grid[side];
    if (stack.length < 3) return;

    // Check top 3
    let last = stack[stack.length - 1];
    let second = stack[stack.length - 2];
    let third = stack[stack.length - 3];

    if (last.color === second.color && second.color === third.color) {
        // MATCH!
        // Remove 3
        stack.pop();
        stack.pop();
        stack.pop();

        state.score += 100;
        updateScoreUI();
    }
}

function checkGameOver(side) {
    // If stack is too high (outside canvas?)
    // Or just a fixed limit.
    // Hex radius + blocks.
    if (state.grid[side].length > 10) { // Arbitrary limit for now
        endGame();
    }
}

function updateScoreUI() {
    document.getElementById('score-value').innerText = state.score;
}

// State Management
function startGame() {
    state.status = 'PLAYING';
    state.score = 0;
    state.blocks = [];
    state.grid = [[], [], [], [], [], []];
    state.rotation = 0;
    state.targetRotation = 0;
    updateScoreUI();

    document.getElementById('start-screen').classList.remove('active');
    document.getElementById('game-over-screen').classList.remove('active');

    // Check URL params for Player Name (SL Integration)
    const urlParams = new URLSearchParams(window.location.search);
    const player = urlParams.get('player');
    if (player) {
        document.getElementById('player-name-input').value = player;
        document.getElementById('player-name-input').disabled = true;
    }
}

function endGame() {
    state.status = 'GAMEOVER';
    document.getElementById('final-score-value').innerText = state.score;
    document.getElementById('game-over-screen').classList.add('active');
}

document.getElementById('restart-btn').addEventListener('click', startGame);

// SL Bridge for Submission
document.getElementById('submit-btn').addEventListener('click', () => {
    let name = document.getElementById('player-name-input').value;
    if (!name) return;

    // Simulate Submission
    document.getElementById('submit-status').innerText = "SENDING...";

    // Real LSL Submission Logic
    const urlParams = new URLSearchParams(window.location.search);
    const slUrl = urlParams.get('sl_url');

    if (slUrl) {
        fetch(slUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: JSON.stringify({ name: name, score: state.score })
        })
            .then(() => {
                document.getElementById('submit-status').innerText = "✅ SENT TO SECOND LIFE!";
            })
            .catch(err => {
                document.getElementById('submit-status').innerText = "❌ ERROR (See Logs)";
                console.error(err);
            });
    } else {
        document.getElementById('submit-status').innerText = "⚠️ NO SL CONNECTION";
    }
});


// Initialization
resize();
loop();
