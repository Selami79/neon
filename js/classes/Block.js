export default class Block {
    constructor(lane, color, distFromHex, iter) {
        this.lane = lane; // 0-5
        this.color = color;
        this.distFromHex = distFromHex; // Distance from center
        this.iter = iter || 1; // Speed multiplier or iteration count
        this.width = 0;
        this.height = 0; // Set by View/Game settings
        this.angle = 90 - (30 + 60 * lane); // Visual angle in degrees? No, in standard math.

        this.settled = false; // Is it part of the stack?
        this.deleted = false; // Is it being removed?
        this.opacity = 1;
        this.scale = 1; // For animations
    }

    update(speed) {
        if (!this.settled) {
            this.distFromHex -= speed * this.iter;
        }

        if (this.deleted) {
            this.opacity -= 0.1;
            this.scale *= 0.9;
        }
    }
}
