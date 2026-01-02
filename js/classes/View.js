export default class View {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        // Colors (Original Hextris Palette)
        this.colors = {
            bg: '#eec368', // Temporary default, will be overridden by CSS
            hex: '#2c3e50',
            blocks: ['#e74c3c', '#f1c40f', '#3498db', '#2ecc71']
        };

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    drawHexagon(hex) {
        let ctx = this.ctx;
        let radius = hex.radius;
        let x = this.centerX;
        let y = this.centerY;

        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            // Hexagon vertices based on hex.angle
            // Angle is in degrees.
            // Vertices are at angle + i*60
            let theta = (hex.angle + i * 60) * Math.PI / 180;
            ctx.lineTo(x + radius * Math.cos(theta), y + radius * Math.sin(theta));
        }
        ctx.closePath();
        ctx.fillStyle = this.colors.hex;
        ctx.fill();
        ctx.strokeStyle = '#ecf0f1'; // Light grey stroke
        ctx.lineWidth = 4; // Thicker border
        ctx.stroke();
    }

    drawBlock(block) {
        let ctx = this.ctx;
        let h = 20; // Height
        let dist = block.distFromHex;
        let angle = block.angle; // Absolute angle

        // Calculate Trapazoid Points
        // "Width" depends on distance from center (Triangle wedge)
        // At distance d, width w is (d * tan(30)) * 2 ?
        // 360 / 6 = 60 degree wedges.
        // Side = Dist * tan(30) * 2 = Dist * 0.577 * 2 = Dist * 1.15

        // Inner Edge
        let r1 = dist;
        let r2 = dist + h;

        let theta = angle * Math.PI / 180;
        let halfWedge = 30 * Math.PI / 180;

        // Points relative to Center (0,0) then add CenterX,Y
        // Actually, block.angle is the CENTER of the wedge.
        // So corners are angle +/- 30.

        // Convert polar to cartesian
        // P1 (Inner Left)
        let p1 = {
            x: this.centerX + r1 * Math.cos(theta - halfWedge),
            y: this.centerY + r1 * Math.sin(theta - halfWedge)
        };
        // P2 (Inner Right)
        let p2 = {
            x: this.centerX + r1 * Math.cos(theta + halfWedge),
            y: this.centerY + r1 * Math.sin(theta + halfWedge)
        };
        // P3 (Outer Right)
        let p3 = {
            x: this.centerX + r2 * Math.cos(theta + halfWedge),
            y: this.centerY + r2 * Math.sin(theta + halfWedge)
        };
        // P4 (Outer Left)
        let p4 = {
            x: this.centerX + r2 * Math.cos(theta - halfWedge),
            y: this.centerY + r2 * Math.sin(theta - halfWedge)
        };

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();

        ctx.fillStyle = block.color;
        ctx.globalAlpha = block.opacity;
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Stroke
        // ctx.strokeStyle = '#000';
        // ctx.stroke();
    }
}
