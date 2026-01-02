export default class Input {
    constructor(onAction) {
        this.onAction = onAction; // Callback (direction) => {}

        // Keyboard
        document.addEventListener('keydown', (e) => this.handleKey(e));

        // Touch / Mouse
        document.addEventListener('pointerdown', (e) => this.handleTouch(e));
    }

    handleKey(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            this.onAction(-1); // Left/CCW
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            this.onAction(1); // Right/CW
        }
    }

    handleTouch(e) {
        // Simple Left/Right screen division
        const centerX = window.innerWidth / 2;
        if (e.clientX < centerX) {
            this.onAction(-1);
        } else {
            this.onAction(1);
        }
    }
}
