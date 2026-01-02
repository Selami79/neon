import View from './js/classes/View.js';
import Input from './js/classes/Input.js';
import Hexagon from './js/classes/Hexagon.js';
import Block from './js/classes/Block.js';

class Game {
    constructor() {
        this.view = new View('gameCanvas');
        this.input = new Input((dir) => this.handleInput(dir));
        this.hex = new Hexagon();

        this.blocks = []; // Falling blocks
        this.state = 'START'; // START, PLAYING, GAMEOVER
        this.score = 0;
        this.spawnTimer = 0;
        this.speed = 2; // Initial Speed

        // Loop
        this.lastTime = 0;
        requestAnimationFrame((t) => this.loop(t));

        // Bind UI
        this.bindUI();
    }

    bindUI() {
        document.getElementById('start-screen').addEventListener('click', () => this.start());
        document.getElementById('restart-btn').addEventListener('click', () => this.start());
        document.getElementById('submit-btn').addEventListener('click', () => this.submitScore());
    }

    start() {
        this.state = 'PLAYING';
        this.score = 0;
        this.blocks = []; // Clear falling
        this.hex = new Hexagon(); // Reset grid
        this.speed = 2;
        this.updateScore();

        document.getElementById('start-screen').classList.remove('active');
        document.getElementById('game-over-screen').classList.remove('active');

        // SL Name logic
        const urlParams = new URLSearchParams(window.location.search);
        const player = urlParams.get('player');
        if (player) {
            document.getElementById('player-name-input').value = player;
            document.getElementById('player-name-input').disabled = true;
        }
    }

    handleInput(dir) {
        if (this.state !== 'PLAYING') return;
        this.hex.rotate(dir);
    }

    loop(timestamp) {
        let dt = (timestamp - this.lastTime) / 16.66; // Normalize to ~60fps (1.0)
        this.lastTime = timestamp;
        if (isNaN(dt)) dt = 1;

        if (this.state === 'PLAYING') {
            this.update(dt);
        }

        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        // Hex Rotation
        this.hex.update();

        // Spawning
        this.spawnTimer += dt;
        if (this.spawnTimer > 60) { // Every ~1 sec
            this.spawnBlock();
            this.spawnTimer = 0;
        }

        // Falling Blocks
        for (let i = this.blocks.length - 1; i >= 0; i--) {
            let block = this.blocks[i];
            block.update(this.speed * dt); // Move closer

            // Collision Check
            // We pass the Falling Lane and the Current Hex Position logic handled in Hex
            if (this.hex.checkCollision(block, block.lane, this.speed)) {
                // Add to Hex Grid
                // Note: checkCollision was called above, but we need to pass failingLane again?
                // Actually addBlock needs fallingLane.
                let landedLane = this.hex.addBlock(block, block.lane);

                // Remove from Falling
                this.blocks.splice(i, 1);

                // Check Matches
                let points = this.hex.checkMatches(landedLane);
                this.hex.cleanupChecked();

                if (points > 0) {
                    this.score += points;
                    this.updateScore();
                }

                // Game Over Check
                // If any lane is too high (e.g. > 10 blocks)
                if (this.hex.lanes[landedLane].length > 10) {
                    this.state = 'GAMEOVER';
                    document.getElementById('game-over-screen').classList.add('active');
                }
            }
        }

        // Update Settled Blocks (Animations, Angles)
        // We need to keep settled blocks visuals in sync with hex rotation if we draw them absolutely
        // But if we draw them locally, we don't need to update angles explicitly.
        // View.js draws blocks with `block.angle`.
        // We need to update that angle? 
        // Hexagon.js handles `rotate` but we need to propogate it?
        // Let's rely on View.js using Hex.angle to offset drawing.
    }

    spawnBlock() {
        let lane = Math.floor(Math.random() * 6);
        let color = this.view.colors.blocks[Math.floor(Math.random() * 4)];
        let dist = Math.max(this.view.width, this.view.height) / 1.5;

        let block = new Block(lane, color, dist);
        this.blocks.push(block);
    }

    draw() {
        this.view.clear();

        // Draw Hex + Settled Blocks
        // We pass the entire Hex object
        // View needs to handle Drawing Settled Blocks relative to Hex Angle
        // Let's Iterate Lanes in View.drawHexagon or separate method

        this.view.drawHexagon(this.hex);

        // Draw Settled Blocks (Visual Pass)
        // Ideally View handles this by iterating hex.lanes
        this.hex.lanes.forEach((lane, laneIndex) => {
            lane.forEach(block => {
                // We need to calculate Visual Angle for the block
                // Lane 0 is at Hex Angle + 0
                // Lane 1 is at Hex Angle + 60 ...
                // block.angle is effectively Hex.angle + (LogicLane * 60)
                // Use View helper

                // Temp override for drawing until View is smarter
                block.angle = this.hex.angle + (laneIndex * 60) + 90; // + Offset for alignment
                this.view.drawBlock(block);
            });
        });

        // Draw Falling Blocks
        this.blocks.forEach(block => {
            // Keep falling blocks static absolute angle
            // block.angle was set in constructor based on lane
            this.view.drawBlock(block);
        });
    }

    updateScore() {
        document.getElementById('score-value').innerText = this.score;
        document.getElementById('final-score-value').innerText = this.score;
    }

    submitScore() {
        // SL Logic
        let name = document.getElementById('player-name-input').value;
        if (!name) return;

        const urlParams = new URLSearchParams(window.location.search);
        const slUrl = urlParams.get('sl_url');
        document.getElementById('submit-status').innerText = "SENDING...";

        if (slUrl) {
            fetch(slUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ name: name, score: this.score })
            })
                .then(() => document.getElementById('submit-status').innerText = "✅ SENT!")
                .catch(err => document.getElementById('submit-status').innerText = "❌ ERROR");
        }
    }
}

// Start
new Game();
