export default class Hexagon {
    constructor() {
        this.sides = 6;
        this.lanes = [[], [], [], [], [], []]; // 6 arrays of settled blocks
        this.angle = 0; // Visual angle in degrees
        this.targetAngle = 0;
        this.rotationStep = 0; // Logical rotation (how many 60deg steps)
        this.position = 0; // 0-5 index of rotation

        // Settings
        this.radius = 60; // Base size
    }

    update() {
        // Smooth rotation interpolation
        let diff = this.targetAngle - this.angle;
        if (Math.abs(diff) > 0.1) {
            this.angle += diff * 0.2;
        } else {
            this.angle = this.targetAngle;
        }
    }

    rotate(dir) {
        // dir: 1 (Right/CW) or -1 (Left/CCW)
        // 1 step = 60 degrees.
        // In Hextris original: Left Key -> Rotate CCW?
        // Let's assume Dir 1 adds 60 degrees.

        this.targetAngle += dir * 60;
        this.rotationStep += dir;

        // Update logical position (inverse to visual?)
        // If I rotate World CW, the "Top" slot moves Right.
        // So a block falling from Top (Lane 0) hits the slot that was previously Left (Lane 5).
        // Let's sync with original logic:
        // this.position += steps;

        this.position -= dir; // Logic inverse to visual rotation usually

        // Normalize position to 0-5
        while (this.position < 0) this.position += 6;
        this.position %= 6;
    }

    getLaneIndex(fallingLane) {
        // Maps a screen-space falling lane (0-5) to the current Hex lane index
        // Formula derived from original: lane = sides - fallingLane + position?
        // Let's try simple relative logic:
        // Hex Lane = (FallingLane + Position) % 6

        let index = (fallingLane + this.position) % 6;
        return index;
    }

    addBlock(block, fallingLane) {
        let laneIndex = this.getLaneIndex(fallingLane);
        block.settled = true;

        // Calculate stack height/dist logic
        // Original uses math.sqrt(3) etc.
        // We will simplify or match.
        // Base Radius + (Count * Height)

        this.lanes[laneIndex].push(block);
        return laneIndex; // Return where it landed for matching check
    }

    checkCollision(block, fallingLane, speed) {
        let laneIndex = this.getLaneIndex(fallingLane);
        let stack = this.lanes[laneIndex];

        let limit = this.radius;
        if (stack.length > 0) {
            let topBlock = stack[stack.length - 1];
            // Height logic: 25px per block? Original uses dynamic scaling...
            // Let's stick to fixed for now: 20px
            limit = topBlock.distFromHex + 20;
        }

        if (block.distFromHex <= limit) {
            block.distFromHex = limit;
            return true;
        }
        return false;
    }

    checkMatches(startLaneIndex) {
        // Find the last block added
        let stack = this.lanes[startLaneIndex];
        if (stack.length === 0) return 0;

        let addedBlockIndex = stack.length - 1;
        let matches = [];

        // Flood Fill
        this.floodFill(startLaneIndex, addedBlockIndex, stack[addedBlockIndex].color, matches);

        if (matches.length >= 3) {
            // Remove blocks
            let score = 0;

            // Mark for deletion or remove immediately?
            // Hextris implementation removes them and triggers visuals.
            // We will simplify: Remove from arrays.

            // Sort matches by lane/index to remove correctly (backwards) usually?
            // But we have references.

            matches.forEach(m => {
                let s = this.lanes[m.lane];
                // Instead of splice which shifts indices during iteration, let's mark for deletion
                if (s[m.index]) s[m.index].deleted = true;
            });

            // Now cleanup and compact
            for (let l = 0; l < 6; l++) {
                let newLane = [];
                let shift = 0;
                this.lanes[l].forEach(b => {
                    if (b.deleted) {
                        shift += 1; // Assuming height 1 per block unit
                        score += 100; // Basic scoring
                    } else {
                        // Collapse logic: 
                        // If blocks below were deleted, this block's distFromHex must decrease.
                        // However, simpler is to rebuild the stack distances based on index.
                        newLane.push(b);
                    }
                });
                this.lanes[l] = newLane;

                // Recalculate positions
                this.lanes[l].forEach((b, idx) => {
                    // 60 (Radius) + idx * 20 (Height)
                    let targetDist = this.radius + (idx * 20);
                    b.distFromHex = targetDist;
                });
            }
            return score;
        }
        return 0;
    }

    floodFill(lane, index, color, matches) {
        // Check bounds
        if (lane < 0 || lane >= 6) return;
        if (index < 0 || index >= this.lanes[lane].length) return;

        let block = this.lanes[lane][index];
        if (!block || block.checked || block.color !== color) return;

        // Match found
        block.checked = true; // Temporary flag to prevent infinite loops
        matches.push({ lane: lane, index: index });

        // Check Neighbors (Left, Right, Down, Up)

        // Left Lane
        let leftLane = (lane - 1 + 6) % 6;
        this.floodFill(leftLane, index, color, matches); // Same height? Hextris adjaceny is tricky.
        // Hextris Grid is radial.
        // Neighbor at same index is usually adjacent physically.

        // Right Lane
        let rightLane = (lane + 1) % 6;
        this.floodFill(rightLane, index, color, matches);

        // Down (Same lane, lower index)
        this.floodFill(lane, index - 1, color, matches);

        // Up (Same lane, higher index)
        this.floodFill(lane, index + 1, color, matches);
    }

    cleanupChecked() {
        // Reset checked flags after operation
        for (let l = 0; l < 6; l++) {
            this.lanes[l].forEach(b => b.checked = false);
        }
    }
}
